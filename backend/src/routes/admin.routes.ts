import { Router } from 'express';
import {
  getAdminStats,
  getEmployers,
  getEmployerDocumentsForAdmin,
  reviewVerificationDocument,
  updateEmployerVerification,
  getReports,
  resolveReport,
  moderateListing
} from '../controllers/admin.controller';
import { streamVerificationDocumentFile } from '../controllers/employerPortal.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/stats', getAdminStats);
router.get('/employers', getEmployers);
router.get('/employers/:id/documents', getEmployerDocumentsForAdmin);
router.put('/employers/:id/verify', updateEmployerVerification);
router.get('/verification/documents/:docId/file', streamVerificationDocumentFile);
router.put('/verification/documents/:docId', reviewVerificationDocument);
router.get('/reports', getReports);
router.put('/reports/:id/resolve', resolveReport);
router.put('/opportunities/:id/moderate', moderateListing);

export default router;
