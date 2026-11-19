import { Router } from 'express';
import {
  getEmployerDashboard,
  getEmployerApplicants,
  scheduleInterview,
  submitVerificationDocs
} from '../controllers/employer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.get('/dashboard', authenticate, requireRole('employer'), getEmployerDashboard);
router.get('/applicants', authenticate, requireRole('employer'), getEmployerApplicants);
router.post('/interview', authenticate, requireRole('employer'), scheduleInterview);
router.put('/verification', authenticate, requireRole('employer'), submitVerificationDocs);

export default router;
