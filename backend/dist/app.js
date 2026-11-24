"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./config/env");
const auth_middleware_1 = require("./middleware/auth.middleware");
const role_middleware_1 = require("./middleware/role.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const response_1 = require("./utils/response");
const user_controller_1 = require("./controllers/user.controller");
const application_controller_1 = require("./controllers/application.controller");
const assessment_controller_1 = require("./controllers/assessment.controller");
const learning_controller_1 = require("./controllers/learning.controller");
const opportunity_controller_1 = require("./controllers/opportunity.controller");
const employer_controller_1 = require("./controllers/employer.controller");
const employerPortal_controller_1 = require("./controllers/employerPortal.controller");
const admin_controller_1 = require("./controllers/admin.controller");
const scheme_controller_1 = require("./controllers/scheme.controller");
const Opportunity_1 = require("./models/Opportunity");
const AssessmentResult_1 = require("./models/AssessmentResult");
const LearningProgress_1 = require("./models/LearningProgress");
const LearningResource_1 = require("./models/LearningResource");
const GovernmentScheme_1 = require("./models/GovernmentScheme");
const Report_1 = require("./models/Report");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const opportunity_routes_1 = __importDefault(require("./routes/opportunity.routes"));
const assessment_routes_1 = __importDefault(require("./routes/assessment.routes"));
const learning_routes_1 = __importDefault(require("./routes/learning.routes"));
const portfolio_routes_1 = __importDefault(require("./routes/portfolio.routes"));
const application_routes_1 = __importDefault(require("./routes/application.routes"));
const employer_routes_1 = __importDefault(require("./routes/employer.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const scheme_routes_1 = __importDefault(require("./routes/scheme.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const resume_routes_1 = __importDefault(require("./routes/resume.routes"));
const cane_routes_1 = __importDefault(require("./routes/cane.routes"));
const app = (0, express_1.default)();
// Trust reverse proxies (important for Render, Netlify, and secure cookies)
app.set('trust proxy', 1);
// Allowed frontend origins (Netlify production, previews, localhost, configured CLIENT_URLs)
const allowedOrigins = Array.from(new Set([
    ...env_1.ENV.CLIENT_URLS,
    'https://oursetu.netlify.app',
    'https://www.oursetu.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
]));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, server-to-server, same-origin proxy)
        if (!origin)
            return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, '');
        const isLocalOrigin = /^http:\/\/localhost:\d+$/.test(normalizedOrigin) ||
            /^http:\/\/127\.0\.0\.1:\d+$/.test(normalizedOrigin);
        const isAllowed = allowedOrigins.includes(normalizedOrigin) ||
            /^https:\/\/[a-z0-9-]+(--[a-z0-9-]+)?\.netlify\.app$/i.test(normalizedOrigin) ||
            /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalizedOrigin) ||
            (env_1.ENV.NODE_ENV !== 'production' && isLocalOrigin);
        if (isAllowed) {
            callback(null, true);
        }
        else {
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// Root Health Check
app.get('/', (_req, res) => {
    (0, response_1.sendSuccess)(res, 'SETU Backend API is operational', {
        project: 'SETU',
        version: '1.0.0',
        status: 'healthy',
        database: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date()
    });
});
app.get('/api/health', (_req, res) => {
    (0, response_1.sendSuccess)(res, 'SETU Health Check OK', {
        status: 'ok',
        project: 'SETU',
        tagline: 'Bridging Skills, Opportunities & Employment',
        taglineHindi: 'हुनर से हक़ की कमाई तक।',
        database: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date()
    });
});
// Primary RESTful Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.get('/api/profile', auth_middleware_1.authenticate, user_controller_1.getProfile);
app.put('/api/profile', auth_middleware_1.authenticate, user_controller_1.updateProfile);
app.get('/api/profile/completion', auth_middleware_1.authenticate, user_controller_1.getProfileCompletion);
app.get('/api/dashboard', auth_middleware_1.authenticate, user_controller_1.getDashboard);
app.use('/api/opportunities', opportunity_routes_1.default);
app.use('/api/jobs', opportunity_routes_1.default);
app.use('/api/assessments', assessment_routes_1.default);
app.use('/api/learning', learning_routes_1.default);
app.use('/api/portfolio', portfolio_routes_1.default);
app.use('/api/applications', application_routes_1.default);
app.use('/api/employer', employer_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/schemes', scheme_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/resumes', resume_routes_1.default);
app.use('/api/cane', cane_routes_1.default);
// Backward-Compatible Seeker Aliases
app.get('/api/seeker/assessments/my-attempts', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const attempts = await AssessmentResult_1.AssessmentResult.find({ userId: req.user._id })
            .populate('assessmentId', 'title domain')
            .sort({ completedAt: -1 });
        (0, response_1.sendSuccess)(res, 'Assessment attempts retrieved', attempts);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch assessment attempts', 500);
    }
});
app.post('/api/seeker/assessments/submit', auth_middleware_1.authenticate, (req, res) => {
    if (!req.params.id && req.body?.assessmentId) {
        req.params.id = String(req.body.assessmentId);
    }
    (0, assessment_controller_1.submitAssessment)(req, res);
});
app.get('/api/seeker/learning/progress', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const progress = await LearningProgress_1.LearningProgress.find({ userId: req.user._id }).populate('resourceId', 'title type skillTag duration');
        (0, response_1.sendSuccess)(res, 'Learning progress retrieved', progress);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch learning progress', 500);
    }
});
app.post('/api/seeker/learning/progress', auth_middleware_1.authenticate, (req, res) => {
    if (!req.params.id && req.body?.resourceId) {
        req.params.id = String(req.body.resourceId);
    }
    (0, learning_controller_1.completeLearning)(req, res);
});
app.get('/api/seeker/saved-opportunities', auth_middleware_1.authenticate, opportunity_controller_1.getSavedOpportunities);
app.post('/api/seeker/saved-opportunities/toggle', auth_middleware_1.authenticate, opportunity_controller_1.toggleSaveOpportunity);
app.post('/api/seeker/report', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { opportunityId, reason, description } = req.body || {};
        if (!opportunityId || !reason) {
            (0, response_1.sendError)(res, 'Opportunity ID and report reason are required', 400);
            return;
        }
        const report = await Report_1.Report.create({
            reporterId: req.user._id,
            listingId: opportunityId,
            reason,
            description: description || ''
        });
        (0, response_1.sendSuccess)(res, 'Report submitted successfully', report, 201);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to submit report', 500);
    }
});
const handleBuildHerSupportTicket = async (req, res) => {
    const { subject, message } = req.body || {};
    if (!subject || !message) {
        (0, response_1.sendError)(res, 'Subject and message are required', 400);
        return;
    }
    (0, response_1.sendSuccess)(res, 'Confidential support message received', { receivedAt: new Date() }, 201);
};
app.post('/api/seeker/support-ticket', auth_middleware_1.authenticate, role_middleware_1.requireBuildHerAccess, handleBuildHerSupportTicket);
app.post('/api/build-her/support-ticket', auth_middleware_1.authenticate, role_middleware_1.requireBuildHerAccess, handleBuildHerSupportTicket);
app.use('/api/seeker/assessments', assessment_routes_1.default);
app.use('/api/seeker/learning', learning_routes_1.default);
app.use('/api/seeker/portfolio', portfolio_routes_1.default);
app.use('/api/seeker/applications', application_routes_1.default);
app.post('/api/seeker/applications/apply', auth_middleware_1.authenticate, application_controller_1.createApplication);
// Backward-Compatible Employer & Analytics Aliases
app.get('/api/analytics/employer/stats', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employer_controller_1.getEmployerDashboard);
app.get('/api/analytics/admin/stats', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('admin'), admin_controller_1.getAdminStats);
app.get('/api/employer/opportunities', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), async (req, res) => {
    try {
        const listings = await Opportunity_1.Opportunity.find({ employerId: req.user._id }).sort({ createdAt: -1 });
        (0, response_1.sendSuccess)(res, 'Employer opportunities retrieved', listings);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch employer opportunities', 500);
    }
});
app.post('/api/employer/opportunities', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), opportunity_controller_1.createOpportunity);
app.put('/api/employer/opportunities/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), opportunity_controller_1.updateOpportunity);
app.delete('/api/employer/opportunities/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), opportunity_controller_1.deleteOpportunity);
app.put('/api/employer/applicants/:id/status', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), application_controller_1.updateApplicationStatus);
app.post('/api/employer/verification', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employer_controller_1.submitVerificationDocs);
// Backward-Compatible Admin Aliases
app.get('/api/admin/opportunities', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('admin'), async (_req, res) => {
    try {
        const listings = await Opportunity_1.Opportunity.find().sort({ createdAt: -1 });
        (0, response_1.sendSuccess)(res, 'All opportunities retrieved', listings);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch opportunities', 500);
    }
});
app.put('/api/admin/employers/:id/verification', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('admin'), admin_controller_1.updateEmployerVerification);
app.get('/api/admin/support-tickets', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('admin'), (_req, res) => {
    (0, response_1.sendSuccess)(res, 'Support tickets retrieved', []);
});
app.put('/api/admin/support-tickets/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('admin'), (_req, res) => {
    (0, response_1.sendSuccess)(res, 'Support ticket updated', { status: 'resolved' });
});
app.post('/api/admin/schemes', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('admin'), scheme_controller_1.createScheme);
app.put('/api/admin/schemes/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('admin'), scheme_controller_1.updateScheme);
app.delete('/api/admin/schemes/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('admin'), scheme_controller_1.deleteScheme);
// Public Company Profile (strictly approved public fields only; never exposes verification documents)
app.get('/api/companies/:id/public', auth_middleware_1.optionalAuthenticate, employerPortal_controller_1.getPublicCompanyProfile);
// Shared Authenticated Notifications (Seekers & Employers)
app.get('/api/notifications', auth_middleware_1.authenticate, employerPortal_controller_1.getEmployerNotifications);
app.patch('/api/notifications/read-all', auth_middleware_1.authenticate, employerPortal_controller_1.markAllNotificationsRead);
app.patch('/api/notifications/:id/read', auth_middleware_1.authenticate, employerPortal_controller_1.markNotificationRead);
// Public Aliases (general catalogs remain accessible; Build Her is strictly gated to eligible female job seekers)
app.use('/api/public/opportunities', opportunity_routes_1.default);
app.use('/api/public/schemes', scheme_routes_1.default);
const getBuildHerResourcesHandler = async (_req, res) => {
    try {
        const [returneeJobs, refreshers, allSchemes] = await Promise.all([
            Promise.resolve(Opportunity_1.Opportunity.find({
                $or: [{ isCareerRestart: true }, { workMode: { $in: ['remote', 'hybrid'] } }],
                status: 'published'
            }).limit(6)).catch(() => []),
            Promise.resolve(LearningResource_1.LearningResource.find({ type: { $in: ['tutorial', 'course'] } }).limit(4)).catch(() => []),
            Promise.resolve(GovernmentScheme_1.GovernmentScheme.find().limit(25)).catch(() => [])
        ]);
        const womenSchemes = (Array.isArray(allSchemes) ? allSchemes : [])
            .filter((s) => /women|mahila|girl|female|stand-up|shg|lakhpati|udyogini/i.test(`${s.title || ''} ${s.category || ''} ${s.targetGroup || ''} ${s.summary || ''}`))
            .slice(0, 6);
        (0, response_1.sendSuccess)(res, 'Build Her initiatives retrieved', {
            restartOpportunities: returneeJobs,
            refreshers,
            womenSchemes,
            sanctuaryGuidelines: [
                'Zero-tolerance policy against workplace harassment (POSH compliance verified).',
                'Flexible remote and hybrid options designed for career returnees.',
                'Dedicated mentorship during first 90 days of onboarding.'
            ]
        });
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to load Build Her resources', 500);
    }
};
app.get('/api/build-her', auth_middleware_1.authenticate, role_middleware_1.requireBuildHerAccess, getBuildHerResourcesHandler);
app.get('/api/public/build-her', auth_middleware_1.authenticate, role_middleware_1.requireBuildHerAccess, getBuildHerResourcesHandler);
// Fallback JSON 404 for unknown endpoints (strictly never HTML)
app.use(error_middleware_1.notFoundHandler);
// Centralized JSON Error Handler
app.use(error_middleware_1.errorHandler);
exports.default = app;
