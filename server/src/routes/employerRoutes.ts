import { Router } from 'express';
import {
  getMyOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getApplicants,
  updateApplicantStatus,
  submitVerificationDocs
} from '../controllers/employerController';
import { authenticateUser, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateUser, requireRole('employer'));

router.get('/opportunities', getMyOpportunities);
router.post('/opportunities', createOpportunity);
router.put('/opportunities/:id', updateOpportunity);
router.delete('/opportunities/:id', deleteOpportunity);

router.get('/applicants', getApplicants);
router.put('/applicants/:id/status', updateApplicantStatus);

router.post('/verification', submitVerificationDocs);

export default router;
