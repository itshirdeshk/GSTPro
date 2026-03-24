import { Response, NextFunction } from 'express';
import { reportService } from './report.service';
import { AuthRequest } from '../../types';
import { sendSuccess } from '../../utils/response';
import { getTenantId } from '../../middleware/tenantScope';
import { BadRequestError } from '../../utils/errors';

export class ReportController {
  async salesReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const { fromDate, toDate } = req.query as Record<string, string>;
      if (!fromDate || !toDate) {
        throw new BadRequestError('fromDate and toDate are required');
      }
      const report = await reportService.salesReport(tenantId, fromDate, toDate);
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  async gstReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const { fromDate, toDate } = req.query as Record<string, string>;
      if (!fromDate || !toDate) {
        throw new BadRequestError('fromDate and toDate are required');
      }
      const report = await reportService.gstReport(tenantId, fromDate, toDate);
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  async profitLossReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const { fromDate, toDate } = req.query as Record<string, string>;
      if (!fromDate || !toDate) {
        throw new BadRequestError('fromDate and toDate are required');
      }
      const report = await reportService.profitLossReport(tenantId, fromDate, toDate);
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  async outstandingReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const report = await reportService.outstandingReport(tenantId);
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  async quotationReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const { fromDate, toDate } = req.query as Record<string, string>;
      if (!fromDate || !toDate) {
        throw new BadRequestError('fromDate and toDate are required');
      }
      const report = await reportService.quotationReport(tenantId, fromDate, toDate);
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
