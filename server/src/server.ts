import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env';
import { connectDB } from './config/db';

import authRoutes from './routes/authRoutes';
import seekerRoutes from './routes/seekerRoutes';
import employerRoutes from './routes/employerRoutes';
import adminRoutes from './routes/adminRoutes';
import publicRoutes from './routes/publicRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

const app = express();

// Middleware
app.use(
  cors({
    origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

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
app.use('/api/auth', authRoutes);
app.use('/api/seeker', seekerRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global Error Handler
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error'
    });
  }
);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(ENV.PORT, () => {
      console.log(`SETU API Server listening on port ${ENV.PORT}`);
    });
  });
}

export default app;
