import { Router } from 'express';
import multer from 'multer';
import {
  getEmployerDashboard,
  getEmployerApplicants,
  scheduleInterview,
  submitVerificationDocs
} from '../controllers/employer.controller';
import {
  getCompanyProfile,
  updateCompanyProfile,
  completeCompanyOnboarding,
  getVerificationOverview,
  uploadVerificationDocument,
  replaceVerificationDocument,
  streamVerificationDocumentFile,
  requestReverification,
  getHiringPreferences,
  createHiringPreference,
  updateHiringPreference,
  deleteHiringPreference,
  searchCandidates,
  getCandidateProfileForEmployer,
  inviteCandidateToApply,
  shortlistCandidate,
  addRecruiterNote,
  getEmployerInterviews,
  createEmployerInterview,
  updateEmployerInterview,
  deleteEmployerInterview,
  getEmployerAnalytics,
  getEmployerNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  updateEmployerSettings
} from '../controllers/employerPortal.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Strict in-memory upload middleware for secure verification documents (PDF, JPG, PNG; max 5MB)
const verificationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Allowed formats: PDF, JPG, PNG.'));
    }
  }
});

// Dashboard & Analytics
router.get('/dashboard', authenticate, requireRole('employer'), getEmployerDashboard);
router.get('/analytics', authenticate, requireRole('employer'), getEmployerAnalytics);

// Company Profile & Onboarding
router.get('/company', authenticate, requireRole('employer'), getCompanyProfile);
router.put('/company', authenticate, requireRole('employer'), updateCompanyProfile);
router.post(
  '/company/complete-onboarding',
  authenticate,
  requireRole('employer'),
  completeCompanyOnboarding
);

// Company Verification & Secure Document Uploads
router.get('/verification', authenticate, requireRole('employer'), getVerificationOverview);
router.put('/verification', authenticate, requireRole('employer'), submitVerificationDocs);
router.get('/verification/documents', authenticate, requireRole('employer'), getVerificationOverview);
router.post(
  '/verification/documents',
  authenticate,
  requireRole('employer'),
  verificationUpload.single('document'),
  uploadVerificationDocument
);
router.put(
  '/verification/documents/:docId',
  authenticate,
  requireRole('employer'),
  verificationUpload.single('document'),
  replaceVerificationDocument
);
// Stream file: strictly owning employer OR admin (enforced in handler)
router.get(
  '/verification/documents/:docId/file',
  authenticate,
  requireRole('employer', 'admin'),
  streamVerificationDocumentFile
);
router.post(
  '/verification/request-review',
  authenticate,
  requireRole('employer'),
  requestReverification
);

// Hiring Preferences (Multiple saved preferences)
router.get('/hiring-preferences', authenticate, requireRole('employer'), getHiringPreferences);
router.post('/hiring-preferences', authenticate, requireRole('employer'), createHiringPreference);
router.put('/hiring-preferences/:id', authenticate, requireRole('employer'), updateHiringPreference);
router.delete(
  '/hiring-preferences/:id',
  authenticate,
  requireRole('employer'),
  deleteHiringPreference
);

// Candidate Search & Matching (Consenting seekers only)
router.get('/candidates', authenticate, requireRole('employer'), searchCandidates);
router.get(
  '/candidates/:candidateId',
  authenticate,
  requireRole('employer'),
  getCandidateProfileForEmployer
);
router.post(
  '/candidates/:candidateId/invite',
  authenticate,
  requireRole('employer'),
  inviteCandidateToApply
);
router.post(
  '/candidates/:candidateId/shortlist',
  authenticate,
  requireRole('employer'),
  shortlistCandidate
);

// Applications & Private Recruiter Notes
router.get('/applicants', authenticate, requireRole('employer'), getEmployerApplicants);
router.post('/applicants/:id/notes', authenticate, requireRole('employer'), addRecruiterNote);

// Interview Management
router.post('/interview', authenticate, requireRole('employer'), scheduleInterview);
router.get('/interviews', authenticate, requireRole('employer'), getEmployerInterviews);
router.post('/interviews', authenticate, requireRole('employer'), createEmployerInterview);
router.put('/interviews/:id', authenticate, requireRole('employer'), updateEmployerInterview);
router.delete('/interviews/:id', authenticate, requireRole('employer'), deleteEmployerInterview);

// Notifications
router.get('/notifications', authenticate, requireRole('employer'), getEmployerNotifications);
router.patch('/notifications/read-all', authenticate, requireRole('employer'), markAllNotificationsRead);
router.patch('/notifications/:id/read', authenticate, requireRole('employer'), markNotificationRead);

// Settings
router.put('/settings', authenticate, requireRole('employer'), updateEmployerSettings);

export default router;
