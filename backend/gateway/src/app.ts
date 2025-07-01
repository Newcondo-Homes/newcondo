// backend/gateway/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// middleware imports
import { corsMiddleware } from './middleware/cors';
import { rateLimiterMiddleware } from './middleware/rateLimiter';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware, adminMiddleware } from './middleware/auth';
import { loadBalancer } from './middleware/loadBalancer';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { healthCheck } from './middleware/healthCheck';
import { config } from './config/environment';
import { requestContextMiddleware } from './middleware/requestContext';
import { validationMiddleware } from './middleware/validation';

// routes imports
import { serviceRoutes } from './routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: config.ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health' || req.path === '/api/health'
  }
});

app.use(limiter);

// Request parsing
app.use(express.json({ limit: '10mb', verify: (req, res, buf) => {
  // store raw ody for webhoot verification
  if (req.originalUrl.includes('/webhooks')){
    req.rawBody = buf;
  }
} }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// Service discovery and load balancing
app.use('/api', loadBalancer);

// Auth service routes (public)
app.use('/api/auth', createProxyMiddleware({
  target: config.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': ''
  },
  onError: (err, req, res) => {
    console.error('Auth service proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: 'Auth service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Property service routes (mixed public/protected)
app.use('/api/properties', createProxyMiddleware({
  target: config.PROPERTY_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/properties': ''
  },
  onError: (err, req, res) => {
    console.error('Property service proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: 'Property service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Payment service routes (protected)
app.use('/api/payments', authMiddleware, createProxyMiddleware({
  target: config.PAYMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/payments': ''
  },
  onError: (err, req, res) => {
    console.error('Payment service proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: 'Payment service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Booking service routes (protected)
app.use('/api/bookings', authMiddleware, createProxyMiddleware({
  target: config.BOOKING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/bookings': ''
  },
  onError: (err, req, res) => {
    console.error('Booking service proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: 'Booking service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Marking service routes (protected)
app.use('/api/marking', authMiddleware, createProxyMiddleware({
  target: config.MARKING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/marking': ''
  },
  onError: (err, req, res) => {
    console.error('Marking service proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: 'Marking service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Referral service routes (protected)
app.use('/api/referrals', authMiddleware, createProxyMiddleware({
  target: config.REFERRAL_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/referrals': ''
  },
  onError: (err, req, res) => {
    console.error('Referral service proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: 'Referral service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Notification service routes (protected)
app.use('/api/notifications', authMiddleware, createProxyMiddleware({
  target: config.NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications': ''
  },
  onError: (err, req, res) => {
    console.error('Notification service proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: 'Notification service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Analytics service routes (protected)
app.use('/api/analytics', authMiddleware, createProxyMiddleware({
  target: config.ANALYTICS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/analytics': ''
  },
  onError: (err, req, res) => {
    console.error('Analytics service proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: 'Analytics service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Admin service routes (admin only)
app.use('/api/admin', authMiddleware, adminMiddleware, createProxyMiddleware({
  target: config.ADMIN_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin': ''
  },
  onError: (err, req, res) => {
    console.error('Admin service proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: 'Admin service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Webhook routes (bypass auth for external services)
app.use('/api/webhooks', createProxyMiddleware({
  target: config.PAYMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/webhooks': '/webhooks'
  },
  onError: (err, req, res) => {
    console.error('Webhook proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: 'Webhook service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Catch-all route for undefined endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

export default app;
