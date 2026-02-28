import { Prisma } from '@prisma/client';
import { prisma } from '../../config';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { roundTo2 } from '../../utils/gst';
import { RecordPaymentInput, UpdatePaymentInput } from './payment.validators';

export class PaymentService {
  async recordPayment(tenantId: string, userId: string, input: RecordPaymentInput) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: input.invoiceId, tenantId },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestError('Cannot record payment on a cancelled invoice');
    }

    if (invoice.status === 'DRAFT') {
      throw new BadRequestError('Invoice must be issued before recording payment');
    }

    const totalAmount = Number(invoice.totalAmount);
    const amountPaid = Number(invoice.amountPaid);
    const remaining = roundTo2(totalAmount - amountPaid);

    if (input.amount > remaining) {
      throw new BadRequestError(
        `Payment amount (${input.amount}) exceeds remaining balance (${remaining})`
      );
    }

    return prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId: input.invoiceId,
          amount: input.amount,
          paymentDate: new Date(input.paymentDate),
          paymentMode: input.paymentMode,
          referenceNumber: input.referenceNumber || null,
          notes: input.notes || null,
        },
      });

      // Update invoice amounts
      const newAmountPaid = roundTo2(amountPaid + input.amount);
      const newStatus = newAmountPaid >= totalAmount ? 'PAID' : 'PARTIALLY_PAID';

      await tx.invoice.update({
        where: { id: input.invoiceId },
        data: {
          amountPaid: newAmountPaid,
          status: newStatus,
        },
      });

      // Decrease customer outstanding
      await tx.customer.update({
        where: { id: invoice.customerId },
        data: {
          outstandingAmount: { decrement: input.amount },
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'CREATE',
          entity: 'Payment',
          entityId: payment.id,
          meta: {
            invoiceId: input.invoiceId,
            amount: input.amount,
            mode: input.paymentMode,
          },
        },
      });

      return payment;
    });
  }

  async findAll(
    tenantId: string,
    params: {
      page: number;
      limit: number;
      skip: number;
      invoiceId?: string;
      fromDate?: string;
      toDate?: string;
      paymentMode?: string;
    }
  ) {
    const where: Prisma.PaymentWhereInput = { tenantId };

    if (params.invoiceId) {
      where.invoiceId = params.invoiceId;
    }

    if (params.paymentMode) {
      where.paymentMode = params.paymentMode as any;
    }

    if (params.fromDate || params.toDate) {
      where.paymentDate = {};
      if (params.fromDate) {
        (where.paymentDate as any).gte = new Date(params.fromDate);
      }
      if (params.toDate) {
        (where.paymentDate as any).lte = new Date(params.toDate);
      }
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              customer: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total };
  }

  async findById(tenantId: string, id: string) {
    const payment = await prisma.payment.findFirst({
      where: { id, tenantId },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            amountPaid: true,
            status: true,
            customer: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    return payment;
  }

  async deletePayment(tenantId: string, id: string, userId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id, tenantId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    return prisma.$transaction(async (tx) => {
      // Reverse invoice payment
      const newAmountPaid = roundTo2(
        Number(payment.invoice.amountPaid) - Number(payment.amount)
      );
      const newStatus =
        newAmountPaid <= 0 ? 'ISSUED' : 'PARTIALLY_PAID';

      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          amountPaid: Math.max(0, newAmountPaid),
          status: newStatus,
        },
      });

      // Increase customer outstanding
      await tx.customer.update({
        where: { id: payment.invoice.customerId },
        data: { outstandingAmount: { increment: Number(payment.amount) } },
      });

      // Delete payment
      await tx.payment.delete({ where: { id } });

      // Audit
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'DELETE',
          entity: 'Payment',
          entityId: id,
          meta: {
            invoiceId: payment.invoiceId,
            amount: Number(payment.amount),
          },
        },
      });

      return { message: 'Payment deleted and invoice updated' };
    });
  }
}

export const paymentService = new PaymentService();
