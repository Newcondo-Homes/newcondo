import cors, { CorsOptions, CorsOptionsDelegate } from 'cors';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// ─── Allowed Origins ──────────────────────────────────────────────────────────

const PRODUCTION_ORIGINS = [
  'https://newcondo.homes',
  'https://www.newcondo.homes',
  'https://admin.newcondo.homes',
  'https://app.newcondo.homes',
];

const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',   // platform (Next.js)
  'http://localhost:3001',   // admin (Next.js)
  'http://localhost:3002',   // any additional dev app
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

// Render preview deployments follow the pattern *.onrender.com
const RENDER_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+\.onrender\.com$/;

// Vercel preview deployments follow the pattern *.vercel.app
const VERCEL_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+-[a-z0-9]+\.vercel\.app$/;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAllowedOrigin(origin: string): boolean {
  const env = process.env.NODE_ENV ?? 'development';

  if (PRODUCTION_ORIGINS.includes(origin)) return true;

  if (env !== 'production') {
    if (DEVELOPMENT_ORIGINS.includes(origin)) return true;
    if (RENDER_PREVIEW_PATTERN.test(origin)) return true;
    if (VERCEL_PREVIEW_PATTERN.test(origin)) return true;
  }

  // Allow any extra origins injected at runtime (comma-separated)
  const extra = process.env.EXTRA_ALLOWED_ORIGINS ?? '';
  if (extra) {
    const extras = extra.split(',').map((o) => o.trim());
    if (extras.includes(origin)) return true;
  }

  return false;
}

// ─── Core CORS options ────────────────────────────────────────────────────────

const corsOptionsDelegate: CorsOptionsDelegate<Request> = (req, callback) => {
  const origin = req.headers.origin;

  // Same-origin requests (e.g. server-to-server, Render internal) – no Origin header
  if (!origin) {
    return callback(null, { origin: false });
  }

  if (isAllowedOrigin(origin)) {
    const options: CorsOptions = {
      origin: true,           // reflect the request origin
      credentials: true,      // allow cookies / Authorization headers
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Api-Key',
        'X-Service-Name',     // for internal service identification
        'X-Trace-Id',         // for distributed tracing
      ],
      exposedHeaders: [
        'X-Total-Count',      // pagination
        'X-Request-Id',
        'X-Rate-Limit-Remaining',
      ],
      maxAge: 86_400,         // preflight cache: 24 hours
    };
    callback(null, options);
  } else {
    callback(new Error(`CORS: origin '${origin}' is not allowed`));
  }
};

// ─── Exported middleware ───────────────────────────────────────────────────────

/**
 * Standard CORS middleware.
 *
 * Usage in any service's app.ts:
 *   import { corsMiddleware } from '@newcondo/backend-shared/middleware/cors';
 *   app.use(corsMiddleware);
 */
export const corsMiddleware: RequestHandler = cors(corsOptionsDelegate);

/**
 * Explicit OPTIONS preflight handler.
 * Mount this BEFORE the main router so browsers get an immediate 204.
 *
 * Usage:
 *   app.options('*', preflightHandler);
 */
export const preflightHandler: RequestHandler = cors(corsOptionsDelegate);

/**
 * Convenience function for services that need to override CORS options at
 * mount-time (e.g. the combined-backend gateway).
 */
export function createCorsMiddleware(
  extraOrigins: string[] = [],
): RequestHandler {
  const overrideDelegate: CorsOptionsDelegate<Request> = (req, callback) => {
    const origin = req.headers.origin;

    if (!origin) return callback(null, { origin: false });

    if (isAllowedOrigin(origin) || extraOrigins.includes(origin)) {
      callback(null, {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'X-Api-Key',
          'X-Service-Name',
          'X-Trace-Id',
        ],
        exposedHeaders: ['X-Total-Count', 'X-Request-Id', 'X-Rate-Limit-Remaining'],
        maxAge: 86_400,
      });
    } else {
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    }
  };

  return cors(overrideDelegate);
}

/**
 * CORS error handler — call this after your main error handler so CORS
 * rejections return a clean 403 instead of a generic 500.
 */
export function corsErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err.message.startsWith('CORS:')) {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: err.message,
    });
    return;
  }
  next(err);
}