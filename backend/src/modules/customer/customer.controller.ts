import { Response, NextFunction } from 'express';
import { customerService } from './customer.service';
import { AuthRequest } from '../../types';
import { sendSuccess, sendCreated, sendPaginated, getPagination } from '../../utils/response';
import { getTenantId } from '../../middleware/tenantScope';

export class CustomerController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const customer = await customerService.create(tenantId, req.body);
      sendCreated(res, customer, 'Customer created successfully');
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const { page, limit, skip } = getPagination(req.query as any);
      const search = req.query.search as string | undefined;
      const state = req.query.state as string | undefined;

      const { customers, total } = await customerService.findAll(tenantId, {
        page, limit, skip, search, state,
      });

      sendPaginated(res, customers, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const customer = await customerService.findById(tenantId, req.params.id as string);
      sendSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const customer = await customerService.update(tenantId, req.params.id as string, req.body);
      sendSuccess(res, customer, 'Customer updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const result = await customerService.delete(tenantId, req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const customerController = new CustomerController();
