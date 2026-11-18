import { Router } from 'express';
import {
  getEmployers,
  updateEmployerVerification,
  getAllOpportunitiesAdmin,
  toggleOpportunityModeration,
  getReports,
  resolveReport,
  getSupportTickets,
  updateSupportTicket,
  createScheme,
  updateScheme,
  deleteScheme
} from '../controllers/adminController';
import { authenticateUser, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateUser, requireRole('admin'));

router.get('/employers', getEmployers);
router.put('/employers/:id/verification', updateEmployerVerification);

router.get('/opportunities', getAllOpportunitiesAdmin);
router.put('/opportunities/:id/moderate', toggleOpportunityModeration);

router.get('/reports', getReports);
router.put('/reports/:id/resolve', resolveReport);

router.get('/support-tickets', getSupportTickets);
router.put('/support-tickets/:id', updateSupportTicket);

router.post('/schemes', createScheme);
router.put('/schemes/:id', updateScheme);
router.delete('/schemes/:id', deleteScheme);

export default router;
