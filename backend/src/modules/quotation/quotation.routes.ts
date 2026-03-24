import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenantScope';
import { validate } from '../../middleware/validate';
import { quotationController } from './quotation.controller';
import {
  createQuotationSchema,
  quotationListQuerySchema,
  updateQuotationSchema,
  updateQuotationStatusSchema,
} from './quotation.validators';

const router = Router();

router.use(authenticate, requireTenant);

router.post('/', authorize('ADMIN', 'STAFF'), validate(createQuotationSchema), quotationController.create);
router.get('/', validate(quotationListQuerySchema, 'query'), quotationController.findAll);
router.get('/:id', quotationController.findById);
router.put('/:id', authorize('ADMIN', 'STAFF'), validate(updateQuotationSchema), quotationController.update);
router.post('/:id/status', authorize('ADMIN', 'STAFF'), validate(updateQuotationStatusSchema), quotationController.updateStatus);
router.post('/:id/convert', authorize('ADMIN', 'STAFF'), quotationController.convertToInvoice);
router.get('/:id/export', quotationController.exportDocument);
router.delete('/:id', authorize('ADMIN'), quotationController.delete);

export default router;
