import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Import shared middleware
import { errorHandler } from '../../../shared/src/middleware/errorHandler';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { rateLimiterMiddleware } from '../../../shared/src/middleware/rateLimiter';

// Import routes
import markingJobRoutes from './routes/markingJobs';
import queueRoutes from './routes/queue';
import assignmentRoutes from './routes/assignments';
import completionRoutes from './routes/completion';

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.PLATFORM_URL, process.env.ADMIN_URL].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'marking-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API info endpoint
app.get('/info', (req, res) => {
  res.status(200).json({
    service: 'NewCondo Marking Service',
    version: process.env.npm_package_version || '1.0.0',
    description: 'Property boundary marking and verification service',
    endpoints: {
      markingJobs: '/api/v1/marking-jobs',
      queue: '/api/v1/queue',
      assignments: '/api/v1/assignments',
      completion: '/api/v1/completion',
    },
  });
});

// API routes with authentication
app.use('/api/v1/marking-jobs', authMiddleware, markingJobRoutes);
app.use('/api/v1/queue', authMiddleware, queueRoutes);
app.use('/api/v1/assignments', authMiddleware, assignmentRoutes);
app.use('/api/v1/completion', authMiddleware, completionRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'GET /health',
      'GET /info',
      'POST /api/v1/marking-jobs',
      'GET /api/v1/queue',
      'POST /api/v1/assignments',
      'POST /api/v1/completion',
    ],
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down marking service gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down marking service gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception in marking service:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;