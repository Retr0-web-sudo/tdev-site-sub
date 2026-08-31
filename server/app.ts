/**
 * Express App Setup
 * Middleware, routes, error handling
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';
import routes from './routes';
import subscriptionRoutes from './subscription-routes';
import { errorHandler, generalLimiter, requestId } from './middleware';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // ── Sentry initialization (optional, won't crash if DSN is not set) ──
  try {
    if (process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 0.1,
      });
      app.use(Sentry.Handlers.requestHandler());
    }
  } catch (e) {
    console.warn('Sentry initialization skipped:', (e as Error).message);
  }

  // Trust proxy for rate limiter behind Vercel
  app.set('trust proxy', 1);

  // ── Security headers ──
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

  // ── Request ID for tracing ──
  app.use(requestId);

  // ── CORS ──
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.CORS_ORIGIN || 'https://tdev-site.vercel.app').split(',').map(s => s.trim())
      : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
    credentials: true,
  }));

  // ── Body parsing ──
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Cookie parsing (for httpOnly JWT) ──
  app.use(cookieParser());

  // ── Rate limiting ──
  app.use('/api', generalLimiter);

  // ── API Routes ──
  app.use('/api', routes);
  app.use('/api', subscriptionRoutes);

  // ── Serve uploads directory ──
  const uploadDir = path.resolve(__dirname, '..', 'uploads');
  app.use('/uploads', express.static(uploadDir));

  // ── Serve static files in production ──
  const staticPath = process.env.NODE_ENV === 'production'
    ? path.resolve(__dirname, 'public')
    : path.resolve(__dirname, '..', 'dist', 'public');

  app.use(express.static(staticPath));

  // ── SPA fallback ──
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  // ── Error handler ──
  app.use(errorHandler);

  return app;
}
