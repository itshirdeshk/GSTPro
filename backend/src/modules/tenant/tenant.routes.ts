import { Router } from 'express';
import { tenantController } from './tenant.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenantScope';
import { validate } from '../../middleware/validate';
import { updateTenantSchema } from './tenant.validators';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', tenantController.getTenant);
router.put('/', authorize('ADMIN'), validate(updateTenantSchema), tenantController.updateTenant);

export default router;
