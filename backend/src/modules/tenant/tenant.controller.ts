import { Response, NextFunction } from 'express';
import { tenantService } from './tenant.service';
import { AuthRequest } from '../../types';
import { sendSuccess } from '../../utils/response';
import { getTenantId } from '../../middleware/tenantScope';

export class TenantController {
  async getTenant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const tenant = await tenantService.getTenant(tenantId);
      sendSuccess(res, tenant);
    } catch (error) {
      next(error);
    }
  }

  async updateTenant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const tenant = await tenantService.updateTenant(tenantId, req.body);
      sendSuccess(res, tenant, 'Tenant updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const tenantController = new TenantController();
