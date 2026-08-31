const isProduction = process.env.NODE_ENV === 'production';

// Simple structured logger - no external deps needed
export const logger = {
  info: (msg: string, meta?: any) => {
    const entry = { level: 'info', timestamp: new Date().toISOString(), message: msg, ...meta };
    if (isProduction) console.log(JSON.stringify(entry));
    else console.log(`[INFO] ${msg}`, meta || '');
  },
  
  warn: (msg: string, meta?: any) => {
    const entry = { level: 'warn', timestamp: new Date().toISOString(), message: msg, ...meta };
    if (isProduction) console.warn(JSON.stringify(entry));
    else console.warn(`[WARN] ${msg}`, meta || '');
  },
  
  error: (msg: string, meta?: any) => {
    const entry = { level: 'error', timestamp: new Date().toISOString(), message: msg, ...meta };
    if (isProduction) console.error(JSON.stringify(entry));
    else console.error(`[ERROR] ${msg}`, meta || '');
  },
};
