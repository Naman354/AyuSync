import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

// Load environment variables (from .env file)
dotenv.config();

import { prisma } from './lib/prisma';

// Initialize Express App
const app = express();
const httpServer = createServer(app);

import { initSocket } from './events/socket';
import { correlationMiddleware } from './middleware/correlation';
import { hasRedis } from './lib/redis';

// Initialize Socket.io
const io = initSocket(httpServer);

// Trust reverse proxies (Render, Cloudflare, etc.)
app.set('trust proxy', 1);

// Parse CORS origins with dynamic Vercel preview support
const customOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Allow configured custom origins
    if (customOrigins.includes(origin)) return callback(null, true);

    // Automatically allow all Vercel domains (*.vercel.app)
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);

    // Allow local development ports (localhost and 127.0.0.1)
    if (/^http:\/\/(localhost|127\.0\.0\.1):[0-9]+$/.test(origin)) return callback(null, true);

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));
app.use(express.json());
app.use(correlationMiddleware);

// ---------------------------------------------------------
// REST Endpoints
// ---------------------------------------------------------

import authRoutes from './modules/auth/auth.routes';
import patientRoutes from './modules/patients/patient.routes';
import assessmentRoutes from './modules/assessments/assessment.routes';
import facilityRoutes from './modules/facilities/facility.routes';
import referralRoutes from './modules/referrals/referral.routes';
import queueRoutes from './modules/queue/queue.routes';
import appointmentRoutes from './modules/appointments/appointment.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import syncRoutes from './modules/sync/sync.routes';
import followupRoutes from './modules/followups/followup.routes';
import aiRoutes from './modules/ai/ai.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import { startJobs } from './jobs/caregap.job';

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);


// Health check and system verification
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      redis: hasRedis() ? 'connected' : 'standalone_fallback',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database healthcheck failed:', error);
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      redis: hasRedis() ? 'connected' : 'standalone_fallback',
      timestamp: new Date().toISOString()
    });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`AyuSync Backend is running on http://localhost:${PORT}`);
    startJobs();
  });
}

export { app, prisma, io };
