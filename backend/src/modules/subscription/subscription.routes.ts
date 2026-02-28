import { Router } from 'express';
import { subscriptionController } from './subscription.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenantScope';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', subscriptionController.getSubscription);
router.put('/upgrade', authorize('ADMIN'), subscriptionController.upgradePlan);

export default router;
