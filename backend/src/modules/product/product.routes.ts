import { Router } from 'express';
import { productController } from './product.controller';
import { authenticate } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenantScope';
import { validate } from '../../middleware/validate';
import { createProductSchema, updateProductSchema } from './product.validators';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/stats', productController.getStats);
router.post('/', validate(createProductSchema), productController.create);
router.get('/', productController.findAll);
router.get('/:id', productController.findById);
router.put('/:id', validate(updateProductSchema), productController.update);
router.delete('/:id', productController.delete);

export default router;
