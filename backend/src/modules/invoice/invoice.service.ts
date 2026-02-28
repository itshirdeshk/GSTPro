import { Prisma, InvoiceStatus } from '@prisma/client';
import { prisma, redis, logger } from '../../config';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { calculateGST, isInterStateTransaction, roundTo2 } from '../../utils/gst';
import { subscriptionService } from '../subscription/subscription.service';
import { CreateInvoiceInput, UpdateInvoiceInput } from './invoice.validators';

const LOCK_TTL = 5000; // 5 seconds
const LOCK_RETRY_DELAY = 100; // ms
const LOCK_MAX_RETRIES = 30;

export class InvoiceService {
  /**
   * Full 10-step invoice creation flow per PRD
   */
  async create(tenantId: string, userId: string, input: CreateInvoiceInput) {
    // Step 1: Validate subscription
    await subscriptionService.checkInvoiceLimit(tenantId);

    // Step 2: Validate tenant
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new BadRequestError('Tenant not found');
    }

    // Step 3: Validate customer
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, tenantId, deletedAt: null },
    });
    if (!customer) {
      throw new BadRequestError('Customer not found');
    }

    // Step 4: Validate products (for items with productId)
    const productIds = input.items
      .filter((item) => item.productId)
      .map((item) => item.productId!);

    if (productIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, tenantId, deletedAt: null },
      });
      const foundIds = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new BadRequestError(`Products not found: ${missing.join(', ')}`);
      }
    }

    // Step 5: Calculate tax
    const isInterState = isInterStateTransaction(
      tenant.stateCode || '',
      customer.stateCode || ''
    );

    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const itemsData = input.items.map((item) => {
      const taxableAmount = roundTo2(item.quantity * item.unitPrice);
      const gst = calculateGST({
        amount: taxableAmount,
        gstRate: item.gstRate,
        isInterState,
        isReverseCharge: input.isReverseCharge,
        isComposition: tenant.isComposition,
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

    subtotal = roundTo2(subtotal);
    totalCgst = roundTo2(totalCgst);
    totalSgst = roundTo2(totalSgst);
    totalIgst = roundTo2(totalIgst);
    const discount = roundTo2(input.discount || 0);
    const totalAmount = roundTo2(subtotal + totalCgst + totalSgst + totalIgst - discount);

    // Step 6: Acquire invoice number lock (Redis distributed lock)
    const lockKey = `invoice-lock:${tenantId}`;
    const lockAcquired = await this.acquireLock(lockKey);
    if (!lockAcquired) {
      throw new BadRequestError('Could not acquire invoice lock. Please try again.');
    }

    try {
      // Step 7 & 8: Generate number + Save transactionally
      const invoice = await prisma.$transaction(async (tx) => {
        // SELECT FOR UPDATE to safely increment invoice number
        const freshTenant = await tx.$queryRaw<{ last_invoice_number: number }[]>`
          SELECT last_invoice_number FROM tenants WHERE id = ${tenantId}::uuid FOR UPDATE
        `;

        const nextNumber = (freshTenant[0]?.last_invoice_number || 0) + 1;
        const invoiceNumber = `${tenant.invoicePrefix}-${String(nextNumber).padStart(4, '0')}`;

        // Update tenant's last invoice number
        await tx.tenant.update({
          where: { id: tenantId },
          data: { lastInvoiceNumber: nextNumber },
        });

        // Create invoice
        const createdInvoice = await tx.invoice.create({
          data: {
            tenantId,
            customerId: input.customerId,
            invoiceNumber,
            invoiceDate: new Date(input.invoiceDate),
            dueDate: new Date(input.dueDate),
            status: 'DRAFT',
            subtotal,
            cgst: totalCgst,
            sgst: totalSgst,
            igst: totalIgst,
            discount,
            totalAmount,
            isInterState,
            isReverseCharge: input.isReverseCharge || false,
            terms: input.terms || null,
            notes: input.notes || null,
            templateId: input.templateId || 1,
            items: {
              create: itemsData,
            },
          },
          include: {
            items: true,
            customer: {
              select: { id: true, name: true, gstin: true, state: true },
            },
          },
        });

        // Update customer outstanding
        await tx.customer.update({
          where: { id: input.customerId },
          data: {
            outstandingAmount: {
              increment: totalAmount,
            },
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: 'CREATE',
            entity: 'Invoice',
            entityId: createdInvoice.id,
            meta: { invoiceNumber },
          },
        });

        return createdInvoice;
      });

      // Step 9: Push PDF job (TODO: BullMQ integration)
      // await pdfQueue.add('generate-invoice-pdf', { invoiceId: invoice.id, tenantId });

      // Step 10: Return response
      return invoice;
    } finally {
      // Always release lock
      await this.releaseLock(lockKey);
    }
  }

  async findAll(
    tenantId: string,
    params: {
      page: number;
      limit: number;
      skip: number;
      search?: string;
      status?: InvoiceStatus;
      customerId?: string;
      fromDate?: string;
      toDate?: string;
    }
  ) {
    const where: Prisma.InvoiceWhereInput = { tenantId };

    if (params.search) {
      where.OR = [
        { invoiceNumber: { contains: params.search, mode: 'insensitive' } },
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
      where.invoiceDate = {};
      if (params.fromDate) {
        (where.invoiceDate as any).gte = new Date(params.fromDate);
      }
      if (params.toDate) {
        (where.invoiceDate as any).lte = new Date(params.toDate);
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, gstin: true },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { invoices, total };
  }

  async findById(tenantId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, hsnCode: true },
            },
          },
        },
        customer: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    return invoice;
  }

  async update(tenantId: string, id: string, input: UpdateInvoiceInput) {
    const existing = await prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundError('Invoice not found');
    }

    if (existing.status !== 'DRAFT') {
      throw new BadRequestError('Only DRAFT invoices can be edited');
    }

    // If items are being updated, recalculate everything
    if (input.items) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      const customerId = input.customerId || existing.customerId;
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, tenantId },
      });

      if (!customer || !tenant) {
        throw new BadRequestError('Invalid customer or tenant');
      }

      const isInterState = isInterStateTransaction(
        tenant.stateCode || '',
        customer.stateCode || ''
      );

      let subtotal = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;

      const itemsData = input.items.map((item) => {
        const taxableAmount = roundTo2(item.quantity * item.unitPrice);
        const gst = calculateGST({
          amount: taxableAmount,
          gstRate: item.gstRate,
          isInterState,
          isReverseCharge: input.isReverseCharge ?? existing.isReverseCharge,
          isComposition: tenant.isComposition,
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

      subtotal = roundTo2(subtotal);
      const discount = roundTo2(input.discount ?? Number(existing.discount));
      const totalAmount = roundTo2(subtotal + roundTo2(totalCgst) + roundTo2(totalSgst) + roundTo2(totalIgst) - discount);

      // Update with new items in transaction
      const invoice = await prisma.$transaction(async (tx) => {
        // Delete old items
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

        // Update outstanding on old customer if customer changed
        if (input.customerId && input.customerId !== existing.customerId) {
          await tx.customer.update({
            where: { id: existing.customerId },
            data: { outstandingAmount: { decrement: Number(existing.totalAmount) } },
          });
          await tx.customer.update({
            where: { id: input.customerId },
            data: { outstandingAmount: { increment: totalAmount } },
          });
        } else {
          const diff = totalAmount - Number(existing.totalAmount);
          if (diff !== 0) {
            await tx.customer.update({
              where: { id: existing.customerId },
              data: { outstandingAmount: { increment: diff } },
            });
          }
        }

        return tx.invoice.update({
          where: { id },
          data: {
            ...(input.customerId && { customerId: input.customerId }),
            ...(input.invoiceDate && { invoiceDate: new Date(input.invoiceDate) }),
            ...(input.dueDate && { dueDate: new Date(input.dueDate) }),
            ...(input.isReverseCharge !== undefined && { isReverseCharge: input.isReverseCharge }),
            ...(input.terms !== undefined && { terms: input.terms || null }),
            ...(input.notes !== undefined && { notes: input.notes || null }),
            ...(input.templateId !== undefined && { templateId: input.templateId }),
            subtotal,
            cgst: roundTo2(totalCgst),
            sgst: roundTo2(totalSgst),
            igst: roundTo2(totalIgst),
            discount,
            totalAmount,
            isInterState,
            items: {
              create: itemsData,
            },
          },
          include: {
            items: true,
            customer: { select: { id: true, name: true, gstin: true } },
          },
        });
      });

      return invoice;
    }

    // Simple field update (no items change)
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(input.invoiceDate && { invoiceDate: new Date(input.invoiceDate) }),
        ...(input.dueDate && { dueDate: new Date(input.dueDate) }),
        ...(input.isReverseCharge !== undefined && { isReverseCharge: input.isReverseCharge }),
        ...(input.terms !== undefined && { terms: input.terms || null }),
        ...(input.notes !== undefined && { notes: input.notes || null }),
        ...(input.templateId !== undefined && { templateId: input.templateId }),
      },
      include: {
        items: true,
        customer: { select: { id: true, name: true, gstin: true } },
      },
    });

    return invoice;
  }

  async issueInvoice(tenantId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestError('Only DRAFT invoices can be issued');
    }

    return prisma.invoice.update({
      where: { id },
      data: { status: 'ISSUED' },
      include: {
        items: true,
        customer: { select: { id: true, name: true, gstin: true } },
      },
    });
  }

  async cancelInvoice(tenantId: string, id: string, userId: string, reason: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestError('Invoice is already cancelled');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestError('Cannot cancel a fully paid invoice');
    }

    return prisma.$transaction(async (tx) => {
      // Reduce customer outstanding
      const remainingBalance = Number(invoice.totalAmount) - Number(invoice.amountPaid);
      if (remainingBalance > 0) {
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: { outstandingAmount: { decrement: remainingBalance } },
        });
      }

      const updated = await tx.invoice.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: reason,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'CANCEL',
          entity: 'Invoice',
          entityId: id,
          meta: { reason },
        },
      });

      return updated;
    });
  }

  async deleteInvoice(tenantId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestError('Only DRAFT invoices can be deleted');
    }

    return prisma.$transaction(async (tx) => {
      // Reduce customer outstanding
      await tx.customer.update({
        where: { id: invoice.customerId },
        data: { outstandingAmount: { decrement: Number(invoice.totalAmount) } },
      });

      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoice.delete({ where: { id } });

      return { message: 'Invoice deleted successfully' };
    });
  }

  // ============================================
  // Redis Distributed Lock
  // ============================================
  private async acquireLock(key: string): Promise<boolean> {
    for (let i = 0; i < LOCK_MAX_RETRIES; i++) {
      const result = await redis.set(key, '1', 'PX', LOCK_TTL, 'NX');
      if (result === 'OK') {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_DELAY));
    }
    return false;
  }

  private async releaseLock(key: string): Promise<void> {
    await redis.del(key);
  }
}

export const invoiceService = new InvoiceService();
