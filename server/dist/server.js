"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const seekerRoutes_1 = __importDefault(require("./routes/seekerRoutes"));
const employerRoutes_1 = __importDefault(require("./routes/employerRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const publicRoutes_1 = __importDefault(require("./routes/publicRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: [env_1.ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// Health Check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        project: 'SETU',
        tagline: 'Bridging Skills, Opportunities & Employment',
        taglineHindi: 'हुनर से हक़ की कमाई तक।',
        event: 'Builder Bharat 2026 – Build Her Bharat',
        institution: 'K.R. Mangalam University, Gurugram',
        timestamp: new Date()
    });
});
// Mount Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/seeker', seekerRoutes_1.default);
app.use('/api/employer', employerRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/public', publicRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});
// Start Server
if (process.env.NODE_ENV !== 'test') {
    (0, db_1.connectDB)().then(() => {
        app.listen(env_1.ENV.PORT, () => {
            console.log(`SETU API Server listening on port ${env_1.ENV.PORT}`);
        });
    });
}
exports.default = app;
