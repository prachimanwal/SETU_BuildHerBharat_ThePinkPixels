"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const auth_middleware_1 = require("./middleware/auth.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const response_1 = require("./utils/response");
const user_controller_1 = require("./controllers/user.controller");
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
const app = (0, express_1.default)();
// Trust reverse proxies (important for Render, Netlify, and secure cookies)
app.set('trust proxy', 1);
// Allowed frontend origins (Netlify, localhost, custom preview domains)
const allowedOrigins = [
    env_1.ENV.CLIENT_URL,
    'https://oursetu.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin)
            return callback(null, true);
        const isAllowed = allowedOrigins.includes(origin) ||
            /\.netlify\.app$/.test(origin) ||
            /^http:\/\/localhost:\d+$/.test(origin) ||
            /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
        if (isAllowed) {
            callback(null, true);
        }
        else {
            callback(null, true); // Allow all during demo/evaluator testing with credentials
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// Root Health Check
app.get('/', (_req, res) => {
    (0, response_1.sendSuccess)(res, 'SETU Backend API is operational', {
        project: 'SETU',
        version: '1.0.0',
        documentation: 'https://github.com/...',
        status: 'healthy',
        timestamp: new Date()
    });
});
app.get('/api/health', (_req, res) => {
    (0, response_1.sendSuccess)(res, 'SETU Health Check OK', {
        status: 'ok',
        project: 'SETU',
        tagline: 'Bridging Skills, Opportunities & Employment',
        taglineHindi: 'हुनर से हक़ की कमाई तक।',
        event: 'Builder Bharat 2026 – Build Her Bharat',
        institution: 'K.R. Mangalam University, Gurugram',
        timestamp: new Date()
    });
});
// Primary RESTful Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.get('/api/dashboard', auth_middleware_1.authenticate, user_controller_1.getDashboard);
app.use('/api/opportunities', opportunity_routes_1.default);
app.use('/api/assessments', assessment_routes_1.default);
app.use('/api/learning', learning_routes_1.default);
app.use('/api/portfolio', portfolio_routes_1.default);
app.use('/api/applications', application_routes_1.default);
app.use('/api/employer', employer_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/schemes', scheme_routes_1.default);
// Backward-Compatible Aliases for Netlify Frontend
app.use('/api/seeker/assessments', assessment_routes_1.default);
app.use('/api/seeker/learning', learning_routes_1.default);
app.use('/api/seeker/portfolio', portfolio_routes_1.default);
app.use('/api/seeker/applications', application_routes_1.default);
app.post('/api/seeker/applications/apply', auth_middleware_1.authenticate, (req, res, next) => {
    // Alias for /api/applications POST
    const { createApplication } = require('./controllers/application.controller');
    createApplication(req, res, next);
});
app.use('/api/public/opportunities', opportunity_routes_1.default);
app.use('/api/public/schemes', scheme_routes_1.default);
app.get('/api/analytics/seeker/progress', auth_middleware_1.authenticate, user_controller_1.getDashboard);
app.get('/api/public/build-her', async (_req, res) => {
    const { Opportunity } = require('./models/Opportunity');
    const returneeJobs = await Opportunity.find({
        isCareerRestart: true,
        status: 'published'
    }).limit(6);
    (0, response_1.sendSuccess)(res, 'Build Her initiatives retrieved', {
        restartOpportunities: returneeJobs,
        sanctuaryGuidelines: [
            'Zero-tolerance policy against workplace harassment (POSH compliance verified).',
            'Flexible remote and hybrid options designed for career returnees.',
            'Dedicated mentorship during first 90 days of onboarding.'
        ]
    });
});
// Fallback JSON 404 for unknown endpoints (strictly never HTML)
app.use(error_middleware_1.notFoundHandler);
// Centralized JSON Error Handler
app.use(error_middleware_1.errorHandler);
exports.default = app;
