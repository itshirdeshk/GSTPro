import { Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { AuthRequest } from '../../types';
import { sendSuccess, sendCreated, sendPaginated, getPagination } from '../../utils/response';
import { getTenantId, getUserId } from '../../middleware/tenantScope';

export class PaymentController {
  async record(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const payment = await paymentService.recordPayment(tenantId, userId, req.body);
      sendCreated(res, payment, 'Payment recorded successfully');
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const { page, limit, skip } = getPagination(req.query as any);
      const { invoiceId, fromDate, toDate, paymentMode } = req.query as Record<string, string>;

      const { payments, total } = await paymentService.findAll(tenantId, {
        page,
        limit,
        skip,
        invoiceId,
        fromDate,
        toDate,
        paymentMode,
      });

      sendPaginated(res, payments, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const payment = await paymentService.findById(tenantId, req.params.id as string);
      sendSuccess(res, payment);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const result = await paymentService.deletePayment(tenantId, req.params.id as string, userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
