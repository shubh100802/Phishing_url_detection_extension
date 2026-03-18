import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import scanRouter from './routes/scan.js';
import threatsRouter from './routes/threats.js';
import analyticsRouter from './routes/analytics.js';
import usersRouter from './routes/users.js';
import { seedAdmin } from './config/seedAdmin.js';

// Load environment variables
dotenv.config();

const app = express();

// Core middleware
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(helmet());

// CORS configuration (allow localhost and 127.0.0.1 on port 5500)
const defaultFrontend = 'http://localhost:5500';
const altFrontend = 'http://127.0.0.1:5500';
const envFrontend = process.env.FRONTEND_URL || defaultFrontend;
const allowedOrigins = new Set([envFrontend, defaultFrontend, altFrontend]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no origin) and allowed origins
      if (!origin || allowedOrigins.has(origin) || origin.startsWith('chrome-extension://')) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

// Logging (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Connect to MongoDB (non-blocking) and optional seed admin
connectDB()
  .then(async () => {
    if (String(process.env.SEED_ADMIN || '').toLowerCase() === 'true') {
      await seedAdmin();
    }
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err?.message || err);
  });

// Routes
// Optional rate limiting (apply globally) if configured
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '0', 10);
const maxReq = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '0', 10);
if (windowMs > 0 && maxReq > 0) {
  app.use(
    rateLimit({
      windowMs,
      max: maxReq,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
}

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/scan', scanRouter);
app.use('/api/threats', threatsRouter);
app.use('/api/users', usersRouter);
app.use('/api/analytics', analyticsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = Number(process.env.PORT) || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err && (err.code === 'EADDRINUSE' || err.errno === -4091)) {
    console.error(`Port ${PORT} is already in use. Either stop the other process or set a different PORT in .env`);
  } else {
    console.error('Server error:', err);
  }
});
