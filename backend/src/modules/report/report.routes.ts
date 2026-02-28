import { Router } from 'express';
import { reportController } from './report.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenantScope';

const router = Router();

router.use(authenticate, requireTenant);

// All reports require at least ACCOUNTANT role
router.get('/sales', authorize('ADMIN', 'ACCOUNTANT'), reportController.salesReport);
router.get('/gst', authorize('ADMIN', 'ACCOUNTANT'), reportController.gstReport);
router.get('/profit-loss', authorize('ADMIN', 'ACCOUNTANT'), reportController.profitLossReport);
router.get('/outstanding', authorize('ADMIN', 'ACCOUNTANT', 'STAFF'), reportController.outstandingReport);

export default router;
