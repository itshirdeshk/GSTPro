import { Router } from 'express';
import { customerController } from './customer.controller';
import { authenticate } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenantScope';
import { validate } from '../../middleware/validate';
import { createCustomerSchema, updateCustomerSchema } from './customer.validators';

const router = Router();

router.use(authenticate, requireTenant);

router.post('/', validate(createCustomerSchema), customerController.create);
router.get('/', customerController.findAll);
router.get('/:id', customerController.findById);
router.put('/:id', validate(updateCustomerSchema), customerController.update);
router.delete('/:id', customerController.delete);

export default router;
