import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenantScope';
import { validate } from '../../middleware/validate';
import { recordPaymentSchema } from './payment.validators';

const router = Router();

router.use(authenticate, requireTenant);

router.post('/', authorize('ADMIN', 'STAFF', 'ACCOUNTANT'), validate(recordPaymentSchema), paymentController.record);
router.get('/', paymentController.findAll);
router.get('/:id', paymentController.findById);
router.delete('/:id', authorize('ADMIN'), paymentController.delete);

export default router;
