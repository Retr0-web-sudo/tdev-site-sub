/**
 * TDEV Server Entry Point
 * Express + Neon PostgreSQL backend
 *
 * IMPORTANT: dotenv must be loaded BEFORE any imports that use env vars.
 * Using the --import flag: node --import dotenv/config server/index.ts
 * We also load it here for the `tsx` dev runner.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { createApp } from './app';

const PORT = process.env.PORT || 3001;

async function startServer() {
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║         TDEV API Server                  ║
║──────────────────────────────────────────║
║  Port:     ${String(PORT).padEnd(30)}║
║  Database: Neon PostgreSQL               ║
║  Env:      ${(process.env.NODE_ENV || 'development').padEnd(30)}║
║──────────────────────────────────────────║
║  API:      http://localhost:${PORT}/api     ║
╚══════════════════════════════════════════╝
    `);
  });
}

startServer().catch(console.error);
