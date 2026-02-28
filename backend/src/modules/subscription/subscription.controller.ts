import { Response, NextFunction } from 'express';
import { subscriptionService } from './subscription.service';
import { AuthRequest } from '../../types';
import { sendSuccess } from '../../utils/response';
import { getTenantId } from '../../middleware/tenantScope';

export class SubscriptionController {
  async getSubscription(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const subscription = await subscriptionService.getSubscription(tenantId);
      sendSuccess(res, subscription);
    } catch (error) {
      next(error);
    }
  }

  async upgradePlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const { planType } = req.body;
      const subscription = await subscriptionService.upgradePlan(tenantId, planType);
      sendSuccess(res, subscription, 'Plan upgraded successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionController = new SubscriptionController();
