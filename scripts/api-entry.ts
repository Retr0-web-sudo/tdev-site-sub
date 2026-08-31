/**
 * Vercel Serverless Function Entry Point
 * 
 * This file is compiled by esbuild during the Vercel build step.
 * The compiled output (api/compiled.js) is what Vercel actually runs.
 */

import { createApp } from '../server/app';

const app = createApp();

export default app;
