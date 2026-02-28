import { Response, NextFunction } from 'express';
import { expenseService } from './expense.service';
import { AuthRequest } from '../../types';
import { sendSuccess, sendCreated, sendPaginated, getPagination } from '../../utils/response';
import { getTenantId, getUserId } from '../../middleware/tenantScope';
import { ExpenseCategory } from '@prisma/client';

export class ExpenseController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const expense = await expenseService.create(tenantId, userId, req.body);
      sendCreated(res, expense, 'Expense recorded successfully');
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const { page, limit, skip } = getPagination(req.query as any);
      const { search, category, fromDate, toDate, paymentMode } = req.query as Record<string, string>;

      const { expenses, total } = await expenseService.findAll(tenantId, {
        page,
        limit,
        skip,
        search,
        category: category as ExpenseCategory | undefined,
        fromDate,
        toDate,
        paymentMode,
      });

      sendPaginated(res, expenses, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const expense = await expenseService.findById(tenantId, req.params.id as string);
      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const expense = await expenseService.update(tenantId, req.params.id as string, req.body);
      sendSuccess(res, expense, 'Expense updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const result = await expenseService.delete(tenantId, req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const { fromDate, toDate } = req.query as Record<string, string>;
      const stats = await expenseService.getStats(tenantId, fromDate, toDate);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const expenseController = new ExpenseController();
