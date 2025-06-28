// backend/gateway/src/middleware/cors.ts
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { environment } from '../config/environment';
import { logger } from '../utils/logger';

interface CorsOptions {
  origin: string[] | string | boolean;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
}

class CorsManager {
  private allowedOrigins: string[];
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = environment.NODE_ENV === 'development';
    this.allowedOrigins = this.getAllowedOrigins();
  }

  private getAllowedOrigins(): string[] {
    const origins = [
      environment.FRONTEND_URL,
      environment.ADMIN_URL,
      environment.MOBILE_APP_URL,
      environment.WEB_ATTRIBUTION_URL
    ].filter(Boolean);

    if (this.isDevelopment) {
      origins.push(
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:3003'
      );
    }

    return origins;
  }

  private corsOptions: CorsOptions = {
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (this.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow localhost with any port
      if (this.isDevelopment && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }

      logger.warn('CORS blocked request', { origin, allowedOrigins: this.allowedOrigins });
      callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-HTTP-Method-Override',
      'Accept',
      'Origin',
      'X-CSRF-Token',
      'X-API-Key',
      'X-Request-ID',
      'X-Forwarded-For',
      'User-Agent'
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-Current-Page',
      'X-Per-Page',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Request-ID'
    ],
    maxAge: 86400 // 24 hours
  };

  // Main CORS middleware
  getCorsMiddleware() {
    return cors(this.corsOptions);
  }

  // Preflight handler for complex CORS requests
  getPreflightHandler() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', this.corsOptions.methods.join(', '));
        res.header('Access-Control-Allow-Headers', this.corsOptions.allowedHeaders.join(', '));
        res.header('Access-Control-Max-Age', this.corsOptions.maxAge.toString());
        res.status(204).send();
      } else {
        next();
      }
    };
  }

  // Security headers middleware
  getSecurityHeaders() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Security headers
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'DENY');
      res.header('X-XSS-Protection', '1; mode=block');
      res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Remove server signature
      res.removeHeader('X-Powered-By');
      
      // CSP header for development
      if (this.isDevelopment) {
        res.header('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' *");
      } else {
        res.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
      }

      next();
    };
  }

  // API-specific CORS for different services
  getServiceCors(serviceName: string) {
    const serviceSpecificOptions = { ...this.corsOptions };

    switch (serviceName) {
      case 'auth':
        serviceSpecificOptions.exposedHeaders.push('X-Auth-Token', 'X-Refresh-Token');
        break;
      case 'upload':
        serviceSpecificOptions.methods.push('PUT');
        serviceSpecificOptions.allowedHeaders.push('Content-Range', 'X-Upload-Content-Type');
        break;
      case 'payment':
        serviceSpecificOptions.allowedHeaders.push('X-Payment-Method', 'X-Idempotency-Key');
        break;
      default:
        break;
    }

    return cors(serviceSpecificOptions);
  }
}

const corsManager = new CorsManager();

export {
  corsManager,
  CorsOptions
};