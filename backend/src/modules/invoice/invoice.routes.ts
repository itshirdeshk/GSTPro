import { Router } from 'express';
import { invoiceController } from './invoice.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenantScope';
import { validate } from '../../middleware/validate';
import { createInvoiceSchema, updateInvoiceSchema, cancelInvoiceSchema } from './invoice.validators';

const router = Router();

router.use(authenticate, requireTenant);

router.post('/', authorize('ADMIN', 'STAFF'), validate(createInvoiceSchema), invoiceController.create);
router.get('/', invoiceController.findAll);
router.get('/:id', invoiceController.findById);
router.put('/:id', authorize('ADMIN', 'STAFF'), validate(updateInvoiceSchema), invoiceController.update);
router.post('/:id/issue', authorize('ADMIN', 'STAFF'), invoiceController.issue);
router.post('/:id/cancel', authorize('ADMIN'), validate(cancelInvoiceSchema), invoiceController.cancel);
router.delete('/:id', authorize('ADMIN'), invoiceController.delete);

export default router;
