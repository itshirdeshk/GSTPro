import { Prisma, ExpenseCategory } from '@prisma/client';
import { prisma } from '../../config';
import { NotFoundError } from '../../utils/errors';
import { CreateExpenseInput, UpdateExpenseInput } from './expense.validators';

export class ExpenseService {
  async create(tenantId: string, userId: string, input: CreateExpenseInput) {
    const expense = await prisma.expense.create({
      data: {
        tenantId,
        userId,
        category: input.category,
        description: input.description,
        amount: input.amount,
        gstAmount: input.gstAmount || 0,
        expenseDate: new Date(input.expenseDate),
        paymentMode: input.paymentMode,
        referenceNumber: input.referenceNumber || null,
        vendor: input.vendor || null,
        notes: input.notes || null,
      },
    });

    return expense;
  }

  async findAll(
    tenantId: string,
    params: {
      page: number;
      limit: number;
      skip: number;
      search?: string;
      category?: ExpenseCategory;
      fromDate?: string;
      toDate?: string;
      paymentMode?: string;
    }
  ) {
    const where: Prisma.ExpenseWhereInput = { tenantId };

    if (params.search) {
      where.OR = [
        { description: { contains: params.search, mode: 'insensitive' } },
        { vendor: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.category) {
      where.category = params.category;
    }

    if (params.paymentMode) {
      where.paymentMode = params.paymentMode as any;
    }

    if (params.fromDate || params.toDate) {
      where.expenseDate = {};
      if (params.fromDate) {
        (where.expenseDate as any).gte = new Date(params.fromDate);
      }
      if (params.toDate) {
        (where.expenseDate as any).lte = new Date(params.toDate);
      }
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { expenseDate: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, total };
  }

  async findById(tenantId: string, id: string) {
    const expense = await prisma.expense.findFirst({
      where: { id, tenantId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    return expense;
  }

  async update(tenantId: string, id: string, input: UpdateExpenseInput) {
    const existing = await prisma.expense.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundError('Expense not found');
    }

    return prisma.expense.update({
      where: { id },
      data: {
        ...(input.category && { category: input.category }),
        ...(input.description && { description: input.description }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.gstAmount !== undefined && { gstAmount: input.gstAmount }),
        ...(input.expenseDate && { expenseDate: new Date(input.expenseDate) }),
        ...(input.paymentMode && { paymentMode: input.paymentMode }),
        ...(input.referenceNumber !== undefined && { referenceNumber: input.referenceNumber || null }),
        ...(input.vendor !== undefined && { vendor: input.vendor || null }),
        ...(input.notes !== undefined && { notes: input.notes || null }),
      },
    });
  }

  async delete(tenantId: string, id: string) {
    const existing = await prisma.expense.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundError('Expense not found');
    }

    await prisma.expense.delete({ where: { id } });
    return { message: 'Expense deleted successfully' };
  }

  async getStats(tenantId: string, fromDate?: string, toDate?: string) {
    const where: Prisma.ExpenseWhereInput = { tenantId };

    if (fromDate || toDate) {
      where.expenseDate = {};
      if (fromDate) (where.expenseDate as any).gte = new Date(fromDate);
      if (toDate) (where.expenseDate as any).lte = new Date(toDate);
    }

    const [totalResult, byCategory] = await Promise.all([
      prisma.expense.aggregate({
        where,
        _sum: { amount: true, gstAmount: true },
        _count: true,
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    return {
      totalExpenses: Number(totalResult._sum.amount || 0),
      totalGst: Number(totalResult._sum.gstAmount || 0),
      count: totalResult._count,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        total: Number(c._sum.amount || 0),
        count: c._count,
      })),
    };
  }
}

export const expenseService = new ExpenseService();
