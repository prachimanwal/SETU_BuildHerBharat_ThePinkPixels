import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { ENV } from './config/env';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from './middleware/auth.middleware';
import { requireRole, requireBuildHerAccess } from './middleware/role.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { sendSuccess, sendError } from './utils/response';
import { getDashboard, getProfile, updateProfile, getProfileCompletion } from './controllers/user.controller';
import { createApplication, updateApplicationStatus } from './controllers/application.controller';
import { submitAssessment } from './controllers/assessment.controller';
import { completeLearning } from './controllers/learning.controller';
import {
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getSavedOpportunities,
  toggleSaveOpportunity
} from './controllers/opportunity.controller';
import {
  getEmployerDashboard,
  submitVerificationDocs
} from './controllers/employer.controller';
import {
  getPublicCompanyProfile,
  getEmployerNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from './controllers/employerPortal.controller';
import {
  getAdminStats,
  updateEmployerVerification
} from './controllers/admin.controller';
import {
  createScheme,
  updateScheme,
  deleteScheme
} from './controllers/scheme.controller';
import { Opportunity } from './models/Opportunity';
import { AssessmentResult } from './models/AssessmentResult';
import { LearningProgress } from './models/LearningProgress';
import { LearningResource } from './models/LearningResource';
import { GovernmentScheme } from './models/GovernmentScheme';
import { Report } from './models/Report';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import opportunityRoutes from './routes/opportunity.routes';
import assessmentRoutes from './routes/assessment.routes';
import learningRoutes from './routes/learning.routes';
import portfolioRoutes from './routes/portfolio.routes';
import applicationRoutes from './routes/application.routes';
import employerRoutes from './routes/employer.routes';
import adminRoutes from './routes/admin.routes';
import schemeRoutes from './routes/scheme.routes';
import analyticsRoutes from './routes/analytics.routes';
import resumeRoutes from './routes/resume.routes';
import caneRoutes from './routes/cane.routes';

const app = express();

// Trust reverse proxies (important for Render, Netlify, and secure cookies)
app.set('trust proxy', 1);

// Allowed frontend origins (Netlify production, previews, localhost, configured CLIENT_URLs)
const allowedOrigins = Array.from(
  new Set([
    ...ENV.CLIENT_URLS,
    'https://oursetu.netlify.app',
    'https://www.oursetu.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ])
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, server-to-server, same-origin proxy)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, '');
      const isLocalOrigin =
        /^http:\/\/localhost:\d+$/.test(normalizedOrigin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(normalizedOrigin);

      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        /^https:\/\/[a-z0-9-]+(--[a-z0-9-]+)?\.netlify\.app$/i.test(normalizedOrigin) ||
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalizedOrigin) ||
        (ENV.NODE_ENV !== 'production' && isLocalOrigin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Root Health Check
app.get('/', (_req, res) => {
  sendSuccess(res, 'SETU Backend API is operational', {
    project: 'SETU',
    version: '1.0.0',
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

app.get('/api/health', (_req, res) => {
  sendSuccess(res, 'SETU Health Check OK', {
    status: 'ok',
    project: 'SETU',
    tagline: 'Bridging Skills, Opportunities & Employment',
    taglineHindi: 'हुनर से हक़ की कमाई तक।',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// Primary RESTful Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.get('/api/profile', authenticate, getProfile);
app.put('/api/profile', authenticate, updateProfile);
app.get('/api/profile/completion', authenticate, getProfileCompletion);
app.get('/api/dashboard', authenticate, getDashboard);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/jobs', opportunityRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/cane', caneRoutes);

// Backward-Compatible Seeker Aliases
app.get('/api/seeker/assessments/my-attempts', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const attempts = await AssessmentResult.find({ userId: req.user!._id })
      .populate('assessmentId', 'title domain')
      .sort({ completedAt: -1 });
    sendSuccess(res, 'Assessment attempts retrieved', attempts);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch assessment attempts', 500);
  }
});

app.post('/api/seeker/assessments/submit', authenticate, (req: AuthenticatedRequest, res) => {
  if (!req.params.id && req.body?.assessmentId) {
    req.params.id = String(req.body.assessmentId);
  }
  submitAssessment(req, res);
});

app.get('/api/seeker/learning/progress', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const progress = await LearningProgress.find({ userId: req.user!._id }).populate(
      'resourceId',
      'title type skillTag duration'
    );
    sendSuccess(res, 'Learning progress retrieved', progress);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch learning progress', 500);
  }
});

app.post('/api/seeker/learning/progress', authenticate, (req: AuthenticatedRequest, res) => {
  if (!req.params.id && req.body?.resourceId) {
    req.params.id = String(req.body.resourceId);
  }
  completeLearning(req, res);
});

app.get('/api/seeker/saved-opportunities', authenticate, getSavedOpportunities);

app.post('/api/seeker/saved-opportunities/toggle', authenticate, toggleSaveOpportunity);

app.post('/api/seeker/report', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { opportunityId, reason, description } = req.body || {};
    if (!opportunityId || !reason) {
      sendError(res, 'Opportunity ID and report reason are required', 400);
      return;
    }
    const report = await Report.create({
      reporterId: req.user!._id,
      listingId: opportunityId,
      reason,
      description: description || ''
    });
    sendSuccess(res, 'Report submitted successfully', report, 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to submit report', 500);
  }
});

const handleBuildHerSupportTicket = async (req: AuthenticatedRequest, res: express.Response) => {
  const { subject, message } = req.body || {};
  if (!subject || !message) {
    sendError(res, 'Subject and message are required', 400);
    return;
  }
  sendSuccess(res, 'Confidential support message received', { receivedAt: new Date() }, 201);
};

app.post(
  '/api/seeker/support-ticket',
  authenticate,
  requireBuildHerAccess,
  handleBuildHerSupportTicket
);
app.post(
  '/api/build-her/support-ticket',
  authenticate,
  requireBuildHerAccess,
  handleBuildHerSupportTicket
);

app.use('/api/seeker/assessments', assessmentRoutes);
app.use('/api/seeker/learning', learningRoutes);
app.use('/api/seeker/portfolio', portfolioRoutes);
app.use('/api/seeker/applications', applicationRoutes);
app.post('/api/seeker/applications/apply', authenticate, createApplication);

// Backward-Compatible Employer & Analytics Aliases
app.get('/api/analytics/employer/stats', authenticate, requireRole('employer'), getEmployerDashboard);
app.get('/api/analytics/admin/stats', authenticate, requireRole('admin'), getAdminStats);

app.get('/api/employer/opportunities', authenticate, requireRole('employer'), async (req: AuthenticatedRequest, res) => {
  try {
    const listings = await Opportunity.find({ employerId: req.user!._id }).sort({ createdAt: -1 });
    sendSuccess(res, 'Employer opportunities retrieved', listings);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch employer opportunities', 500);
  }
});
app.post('/api/employer/opportunities', authenticate, requireRole('employer'), createOpportunity);
app.put('/api/employer/opportunities/:id', authenticate, requireRole('employer'), updateOpportunity);
app.delete('/api/employer/opportunities/:id', authenticate, requireRole('employer'), deleteOpportunity);
app.put('/api/employer/applicants/:id/status', authenticate, requireRole('employer'), updateApplicationStatus);
app.post('/api/employer/verification', authenticate, requireRole('employer'), submitVerificationDocs);

// Backward-Compatible Admin Aliases
app.get('/api/admin/opportunities', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const listings = await Opportunity.find().sort({ createdAt: -1 });
    sendSuccess(res, 'All opportunities retrieved', listings);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch opportunities', 500);
  }
});
app.put('/api/admin/employers/:id/verification', authenticate, requireRole('admin'), updateEmployerVerification);
app.get('/api/admin/support-tickets', authenticate, requireRole('admin'), (_req, res) => {
  sendSuccess(res, 'Support tickets retrieved', []);
});
app.put('/api/admin/support-tickets/:id', authenticate, requireRole('admin'), (_req, res) => {
  sendSuccess(res, 'Support ticket updated', { status: 'resolved' });
});
app.post('/api/admin/schemes', authenticate, requireRole('admin'), createScheme);
app.put('/api/admin/schemes/:id', authenticate, requireRole('admin'), updateScheme);
app.delete('/api/admin/schemes/:id', authenticate, requireRole('admin'), deleteScheme);

// Public Company Profile (strictly approved public fields only; never exposes verification documents)
app.get('/api/companies/:id/public', optionalAuthenticate, getPublicCompanyProfile);

// Shared Authenticated Notifications (Seekers & Employers)
app.get('/api/notifications', authenticate, getEmployerNotifications);
app.patch('/api/notifications/read-all', authenticate, markAllNotificationsRead);
app.patch('/api/notifications/:id/read', authenticate, markNotificationRead);

// Public Aliases (general catalogs remain accessible; Build Her is strictly gated to eligible female job seekers)
app.use('/api/public/opportunities', opportunityRoutes);
app.use('/api/public/schemes', schemeRoutes);

const getBuildHerResourcesHandler = async (_req: AuthenticatedRequest, res: express.Response) => {
  try {
    const [returneeJobs, refreshers, allSchemes] = await Promise.all([
      Promise.resolve(
        Opportunity.find({
          $or: [{ isCareerRestart: true }, { workMode: { $in: ['remote', 'hybrid'] } }],
          status: 'published'
        }).limit(6)
      ).catch(() => []),
      Promise.resolve(
        LearningResource.find({ type: { $in: ['tutorial', 'course'] } }).limit(4)
      ).catch(() => []),
      Promise.resolve(GovernmentScheme.find().limit(25)).catch(() => [])
    ]);

    const womenSchemes = (Array.isArray(allSchemes) ? allSchemes : [])
      .filter((s: any) =>
        /women|mahila|girl|female|stand-up|shg|lakhpati|udyogini/i.test(
          `${s.title || ''} ${s.category || ''} ${s.targetGroup || ''} ${s.summary || ''}`
        )
      )
      .slice(0, 6);

    sendSuccess(res, 'Build Her initiatives retrieved', {
      restartOpportunities: returneeJobs,
      refreshers,
      womenSchemes,
      sanctuaryGuidelines: [
        'Zero-tolerance policy against workplace harassment (POSH compliance verified).',
        'Flexible remote and hybrid options designed for career returnees.',
        'Dedicated mentorship during first 90 days of onboarding.'
      ]
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to load Build Her resources', 500);
  }
};

app.get('/api/build-her', authenticate, requireBuildHerAccess, getBuildHerResourcesHandler);
app.get('/api/public/build-her', authenticate, requireBuildHerAccess, getBuildHerResourcesHandler);

// Fallback JSON 404 for unknown endpoints (strictly never HTML)
app.use(notFoundHandler);

// Centralized JSON Error Handler
app.use(errorHandler);

export default app;
