import { Router } from 'express';
import {
  getSeekerProgress,
  getEmployerStats,
  getAdminStats
} from '../controllers/analyticsController';
import { authenticateUser, requireRole } from '../middleware/auth';

const router = Router();

router.get('/seeker/progress', authenticateUser, requireRole('seeker'), getSeekerProgress);
router.get('/employer/stats', authenticateUser, requireRole('employer'), getEmployerStats);
router.get('/admin/stats', authenticateUser, requireRole('admin'), getAdminStats);

export default router;
