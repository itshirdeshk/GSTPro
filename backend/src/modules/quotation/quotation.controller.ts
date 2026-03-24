import { Response, NextFunction } from 'express';
import { QuotationStatus } from '@prisma/client';
import { quotationService } from './quotation.service';
import { AuthRequest } from '../../types';
import { getTenantId, getUserId } from '../../middleware/tenantScope';
import { getPagination, sendCreated, sendPaginated, sendSuccess } from '../../utils/response';

export class QuotationController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const quotation = await quotationService.create(tenantId, userId, req.body);
      sendCreated(res, quotation, 'Quotation created successfully');
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const { page, limit, skip } = getPagination(req.query as any);
      const { search, status, customerId, fromDate, toDate } = req.query as Record<string, string>;

      const { quotations, total } = await quotationService.findAll(tenantId, {
        page,
        limit,
        skip,
        search,
        status: status as QuotationStatus | undefined,
        customerId,
        fromDate,
        toDate,
      });

      sendPaginated(res, quotations, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const quotation = await quotationService.findById(tenantId, req.params.id as string);
      sendSuccess(res, quotation);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const quotation = await quotationService.update(tenantId, req.params.id as string, req.body);
      sendSuccess(res, quotation, 'Quotation updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const quotation = await quotationService.updateStatus(tenantId, req.params.id as string, req.body.status);
      sendSuccess(res, quotation, 'Quotation status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async convertToInvoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const result = await quotationService.convertToInvoice(tenantId, userId, req.params.id as string);
      sendSuccess(res, result, 'Quotation converted to invoice successfully');
    } catch (error) {
      next(error);
    }
  }

  async exportDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const result = await quotationService.exportDocument(tenantId, req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const result = await quotationService.delete(tenantId, req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const quotationController = new QuotationController();
