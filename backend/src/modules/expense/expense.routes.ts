import { Router } from 'express';
import { expenseController } from './expense.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenantScope';
import { validate } from '../../middleware/validate';
import { createExpenseSchema, updateExpenseSchema } from './expense.validators';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/stats', expenseController.getStats);
router.post('/', authorize('ADMIN', 'STAFF', 'ACCOUNTANT'), validate(createExpenseSchema), expenseController.create);
router.get('/', expenseController.findAll);
router.get('/:id', expenseController.findById);
router.put('/:id', authorize('ADMIN', 'STAFF', 'ACCOUNTANT'), validate(updateExpenseSchema), expenseController.update);
router.delete('/:id', authorize('ADMIN'), expenseController.delete);

export default router;
