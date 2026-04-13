import { Prisma, QuotationStatus } from '@prisma/client';
import { prisma } from '../../config';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { calculateGST, isInterStateTransaction, roundTo2 } from '../../utils/gst';
import { CreateQuotationInput, UpdateQuotationInput } from './quotation.validators';
import { invoiceService } from '../invoice/invoice.service';
import { escapeHtml } from '../../utils';

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-IN');
}

export class QuotationService {
  private async getTenantAndCustomer(tenantId: string, customerId: string) {
    const [tenant, customer] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.customer.findFirst({ where: { id: customerId, tenantId, deletedAt: null } }),
    ]);

    if (!tenant) {
      throw new BadRequestError('Tenant not found');
    }
    if (!customer) {
      throw new BadRequestError('Customer not found');
    }

    return { tenant, customer };
  }

  private async validateProducts(tenantId: string, inputItems: { productId?: string }[]) {
    const productIds = inputItems.filter((item) => item.productId).map((item) => item.productId as string);
    if (!productIds.length) {
      return;
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, tenantId, deletedAt: null },
      select: { id: true },
    });

    const found = new Set(products.map((p) => p.id));
    const missing = productIds.filter((id) => !found.has(id));
    if (missing.length) {
      throw new BadRequestError(`Products not found: ${missing.join(', ')}`);
    }
  }

  private buildFinancials(
    items: CreateQuotationInput['items'],
    opts: {
      isInterState: boolean;
      isComposition: boolean;
      discount: number;
    }
  ) {
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const itemsData = items.map((item) => {
      const taxableAmount = roundTo2(item.quantity * item.unitPrice);
      const gst = calculateGST({
        amount: taxableAmount,
        gstRate: item.gstRate,
        isInterState: opts.isInterState,
        isReverseCharge: false,
        isComposition: opts.isComposition,
      });

      subtotal += taxableAmount;
      totalCgst += gst.cgst;
      totalSgst += gst.sgst;
      totalIgst += gst.igst;

      return {
        productId: item.productId || null,
        description: item.description,
        hsnCode: item.hsnCode || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        gstRate: item.gstRate,
        taxableAmount,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        totalAmount: gst.totalWithTax,
      };
    });

    const discount = roundTo2(opts.discount || 0);
    const totals = {
      subtotal: roundTo2(subtotal),
      cgst: roundTo2(totalCgst),
      sgst: roundTo2(totalSgst),
      igst: roundTo2(totalIgst),
      discount,
    };

    return {
      itemsData,
      ...totals,
      totalAmount: roundTo2(totals.subtotal + totals.cgst + totals.sgst + totals.igst - totals.discount),
    };
  }

  private async generateQuotationNumber(tenantId: string) {
    const year = new Date().getFullYear();
    const prefix = `QT-${year}-`;

    const last = await prisma.quotation.findFirst({
      where: {
        tenantId,
        quotationNumber: { startsWith: prefix },
      },
      orderBy: { createdAt: 'desc' },
      select: { quotationNumber: true },
    });

    const lastSeq = last ? Number(last.quotationNumber.replace(prefix, '')) || 0 : 0;
    return `${prefix}${String(lastSeq + 1).padStart(4, '0')}`;
  }

  async create(tenantId: string, userId: string, input: CreateQuotationInput) {
    const { tenant, customer } = await this.getTenantAndCustomer(tenantId, input.customerId);
    await this.validateProducts(tenantId, input.items);

    const isInterState = isInterStateTransaction(tenant.stateCode || '', customer.stateCode || '');
    const financials = this.buildFinancials(input.items, {
      isInterState,
      isComposition: tenant.isComposition,
      discount: input.discount || 0,
    });

    const quotationNumber = await this.generateQuotationNumber(tenantId);

    return prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.create({
        data: {
          tenantId,
          customerId: input.customerId,
          quotationNumber,
          quotationDate: new Date(input.quotationDate),
          validUntil: new Date(input.validUntil),
          status: 'DRAFT',
          subtotal: financials.subtotal,
          cgst: financials.cgst,
          sgst: financials.sgst,
          igst: financials.igst,
          discount: financials.discount,
          totalAmount: financials.totalAmount,
          isInterState,
          terms: input.terms || null,
          notes: input.notes || null,
          items: {
            create: financials.itemsData,
          },
        },
        include: {
          customer: { select: { id: true, name: true, gstin: true } },
          items: true,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'CREATE',
          entity: 'Quotation',
          entityId: quotation.id,
          meta: { quotationNumber: quotation.quotationNumber },
        },
      });

      return quotation;
    });
  }

  async findAll(
    tenantId: string,
    params: {
      page: number;
      limit: number;
      skip: number;
      search?: string;
      status?: QuotationStatus;
      customerId?: string;
      fromDate?: string;
      toDate?: string;
    }
  ) {
    const where: Prisma.QuotationWhereInput = { tenantId };

    if (params.search) {
      where.OR = [
        { quotationNumber: { contains: params.search, mode: 'insensitive' } },
        { customer: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.customerId) {
      where.customerId = params.customerId;
    }

    if (params.fromDate || params.toDate) {
      where.quotationDate = {};
      if (params.fromDate) {
        (where.quotationDate as Prisma.DateTimeFilter).gte = new Date(params.fromDate);
      }
      if (params.toDate) {
        (where.quotationDate as Prisma.DateTimeFilter).lte = new Date(params.toDate);
      }
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, gstin: true } },
        },
      }),
      prisma.quotation.count({ where }),
    ]);

    return { quotations, total };
  }

  async findById(tenantId: string, id: string) {
    const quotation = await prisma.quotation.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        items: {
          include: {
            product: { select: { id: true, name: true, hsnCode: true } },
          },
        },
      },
    });

    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    return quotation;
  }

  async update(tenantId: string, id: string, input: UpdateQuotationInput) {
    const existing = await prisma.quotation.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundError('Quotation not found');
    }

    if (existing.status === 'CONVERTED') {
      throw new BadRequestError('Converted quotations cannot be edited');
    }

    if (!input.items) {
      return prisma.quotation.update({
        where: { id },
        data: {
          ...(input.customerId && { customerId: input.customerId }),
          ...(input.quotationDate && { quotationDate: new Date(input.quotationDate) }),
          ...(input.validUntil && { validUntil: new Date(input.validUntil) }),
          ...(input.terms !== undefined && { terms: input.terms || null }),
          ...(input.notes !== undefined && { notes: input.notes || null }),
          ...(input.discount !== undefined && { discount: roundTo2(input.discount) }),
        },
        include: {
          customer: { select: { id: true, name: true, gstin: true } },
          items: true,
        },
      });
    }

    const customerId = input.customerId || existing.customerId;
    const { tenant, customer } = await this.getTenantAndCustomer(tenantId, customerId);
    await this.validateProducts(tenantId, input.items);

    const isInterState = isInterStateTransaction(tenant.stateCode || '', customer.stateCode || '');
    const financials = this.buildFinancials(input.items, {
      isInterState,
      isComposition: tenant.isComposition,
      discount: input.discount ?? Number(existing.discount),
    });

    return prisma.$transaction(async (tx) => {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });

      return tx.quotation.update({
        where: { id },
        data: {
          customerId,
          ...(input.quotationDate && { quotationDate: new Date(input.quotationDate) }),
          ...(input.validUntil && { validUntil: new Date(input.validUntil) }),
          ...(input.terms !== undefined && { terms: input.terms || null }),
          ...(input.notes !== undefined && { notes: input.notes || null }),
          subtotal: financials.subtotal,
          cgst: financials.cgst,
          sgst: financials.sgst,
          igst: financials.igst,
          discount: financials.discount,
          totalAmount: financials.totalAmount,
          isInterState,
          items: {
            create: financials.itemsData,
          },
        },
        include: {
          customer: { select: { id: true, name: true, gstin: true } },
          items: true,
        },
      });
    });
  }

  async updateStatus(tenantId: string, id: string, status: QuotationStatus) {
    const existing = await prisma.quotation.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundError('Quotation not found');
    }

    if (existing.status === 'CONVERTED' && status !== 'CONVERTED') {
      throw new BadRequestError('Converted quotation status cannot be changed');
    }

    return prisma.quotation.update({
      where: { id },
      data: { status },
      include: {
        customer: { select: { id: true, name: true, gstin: true } },
      },
    });
  }

  async convertToInvoice(tenantId: string, userId: string, id: string) {
    const quotation = await prisma.quotation.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });

    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    if (quotation.status === 'CONVERTED' && quotation.convertedInvoiceId) {
      throw new BadRequestError('Quotation is already converted');
    }

    const invoice = await invoiceService.create(tenantId, userId, {
      customerId: quotation.customerId,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(quotation.validUntil).toISOString().split('T')[0],
      isReverseCharge: false,
      discount: Number(quotation.discount),
      terms: quotation.terms || '',
      notes: quotation.notes || '',
      templateId: 1,
      items: quotation.items.map((item) => ({
        productId: item.productId || undefined,
        description: item.description,
        hsnCode: item.hsnCode || undefined,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        gstRate: Number(item.gstRate),
      })),
    });

    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        convertedInvoiceId: invoice.id,
      },
      include: {
        customer: { select: { id: true, name: true, gstin: true } },
        items: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'CONVERT',
        entity: 'Quotation',
        entityId: id,
        meta: {
          quotationNumber: quotation.quotationNumber,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        },
      },
    });

    return {
      quotation: updatedQuotation,
      invoice,
    };
  }

  async delete(tenantId: string, id: string) {
    const existing = await prisma.quotation.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundError('Quotation not found');
    }

    if (existing.status === 'CONVERTED') {
      throw new BadRequestError('Converted quotations cannot be deleted');
    }

    await prisma.quotation.delete({ where: { id } });
    return { message: 'Quotation deleted successfully' };
  }

  async exportDocument(tenantId: string, id: string) {
    const quotation = await prisma.quotation.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        tenant: true,
        items: true,
      },
    });

    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    const itemRows = quotation.items
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.description)}</td>
            <td>${escapeHtml(item.hsnCode || '-')}</td>
            <td style="text-align:right;">${Number(item.quantity).toFixed(2)}</td>
            <td style="text-align:right;">${Number(item.unitPrice).toFixed(2)}</td>
            <td style="text-align:right;">${Number(item.gstRate).toFixed(2)}%</td>
            <td style="text-align:right;">${Number(item.totalAmount).toFixed(2)}</td>
          </tr>
        `
      )
      .join('');

    const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(quotation.quotationNumber)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 16px; }
    .title { font-size: 22px; margin: 0; }
    .meta, .party { font-size: 12px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; }
    th { background: #f3f4f6; text-align: left; }
    .totals { width: 320px; margin-left: auto; margin-top: 16px; font-size: 12px; }
    .totals div { display:flex; justify-content:space-between; padding: 4px 0; }
    .grand { font-weight: bold; border-top: 1px solid #111827; margin-top: 6px; padding-top: 6px; }
    .footer { margin-top: 24px; font-size: 11px; color: #4b5563; }
    @media print {
      .no-print { display: none; }
      body { margin: 12px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">Quotation</h1>
      <div class="meta">
        <div><strong>No:</strong> ${escapeHtml(quotation.quotationNumber)}</div>
        <div><strong>Date:</strong> ${escapeHtml(formatDate(quotation.quotationDate))}</div>
        <div><strong>Valid Till:</strong> ${escapeHtml(formatDate(quotation.validUntil))}</div>
        <div><strong>Status:</strong> ${escapeHtml(quotation.status)}</div>
      </div>
    </div>
    <div class="party">
      <div><strong>${escapeHtml(quotation.tenant.businessName)}</strong></div>
      <div>${escapeHtml(quotation.tenant.address || '')}</div>
      <div>${escapeHtml(quotation.tenant.city || '')} ${escapeHtml(quotation.tenant.state || '')}</div>
      <div>GSTIN: ${escapeHtml(quotation.tenant.gstin || '-')}</div>
    </div>
  </div>

  <div class="party">
    <div><strong>Bill To:</strong> ${escapeHtml(quotation.customer.name)}</div>
    <div>${escapeHtml(quotation.customer.address || '')}</div>
    <div>${escapeHtml(quotation.customer.city || '')} ${escapeHtml(quotation.customer.state || '')}</div>
    <div>GSTIN: ${escapeHtml(quotation.customer.gstin || '-')}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>HSN</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>GST</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>INR ${Number(quotation.subtotal).toFixed(2)}</span></div>
    <div><span>CGST</span><span>INR ${Number(quotation.cgst).toFixed(2)}</span></div>
    <div><span>SGST</span><span>INR ${Number(quotation.sgst).toFixed(2)}</span></div>
    <div><span>IGST</span><span>INR ${Number(quotation.igst).toFixed(2)}</span></div>
    <div><span>Discount</span><span>INR ${Number(quotation.discount).toFixed(2)}</span></div>
    <div class="grand"><span>Grand Total</span><span>INR ${Number(quotation.totalAmount).toFixed(2)}</span></div>
  </div>

  <div class="footer">
    <div><strong>Terms:</strong> ${escapeHtml(quotation.terms || '-')}</div>
    <div><strong>Notes:</strong> ${escapeHtml(quotation.notes || '-')}</div>
  </div>
</body>
</html>`;

    return {
      quotation,
      filename: `${quotation.quotationNumber}.html`,
      html,
    };
  }
}

export const quotationService = new QuotationService();
