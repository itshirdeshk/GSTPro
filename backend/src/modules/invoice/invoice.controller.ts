import { Response, NextFunction } from 'express';
import { invoiceService } from './invoice.service';
import { AuthRequest } from '../../types';
import { sendSuccess, sendCreated, sendPaginated, getPagination } from '../../utils/response';
import { getTenantId, getUserId } from '../../middleware/tenantScope';
import { InvoiceStatus } from '@prisma/client';

export class InvoiceController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const invoice = await invoiceService.create(tenantId, userId, req.body);
      sendCreated(res, invoice, 'Invoice created successfully');
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const { page, limit, skip } = getPagination(req.query as any);
      const { search, status, customerId, fromDate, toDate } = req.query as Record<string, string>;

      const { invoices, total } = await invoiceService.findAll(tenantId, {
        page,
        limit,
        skip,
        search,
        status: status as InvoiceStatus | undefined,
        customerId,
        fromDate,
        toDate,
      });

      sendPaginated(res, invoices, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const invoice = await invoiceService.findById(tenantId, req.params.id as string);
      sendSuccess(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const invoice = await invoiceService.update(tenantId, req.params.id as string, req.body);
      sendSuccess(res, invoice, 'Invoice updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async issue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const invoice = await invoiceService.issueInvoice(tenantId, req.params.id as string);
      sendSuccess(res, invoice, 'Invoice issued successfully');
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const invoice = await invoiceService.cancelInvoice(
        tenantId,
        req.params.id as string,
        userId,
        req.body.reason
      );
      sendSuccess(res, invoice, 'Invoice cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const result = await invoiceService.deleteInvoice(tenantId, req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const invoiceController = new InvoiceController();
