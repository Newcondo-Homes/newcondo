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




// /**
//  * Property Marking Service - Express App Setup
//  * Location: backend/marking-service/src/app.ts
//  */

// import express, { Application, Request, Response, NextFunction } from 'express';
// import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import { errorHandler } from '../shared/src/middleware/errorHandler';
// import { rateLimiter } from '../shared/src/middleware/rateLimiter';
// import { logger } from '../shared/src/middleware/logger';

// // Routes (to be implemented)
// // import markingJobRoutes from './routes/markingJobs';
// // import queueRoutes from './routes/queue';
// // import assignmentRoutes from './routes/assignments';
// // import completionRoutes from './routes/completion';

// const app: Application = express();

// // ==============================================
// // SECURITY MIDDLEWARE
// // ==============================================

// // Helmet - Security headers
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       scriptSrc: ["'self'"],
//       imgSrc: ["'self'", 'data:', 'https:'],
//     },
//   },
//   crossOriginEmbedderPolicy: false,
// }));

// // CORS configuration
// const corsOptions = {
//   origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
//   maxAge: 86400, // 24 hours
// };

// app.use(cors(corsOptions));

// // ==============================================
// // REQUEST PARSING MIDDLEWARE
// // ==============================================

// // Body parser
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // ==============================================
// // LOGGING MIDDLEWARE
// // ==============================================

// // Morgan - HTTP request logging
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// } else {
//   app.use(morgan('combined'));
// }

// // Custom logger middleware
// app.use(logger);

// // ==============================================
// // RATE LIMITING
// // ==============================================

// // Apply rate limiting to all routes
// app.use(rateLimiter({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later',
// }));

// // Stricter rate limiting for job creation
// app.use('/api/marking-jobs', rateLimiter({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 10, // limit to 10 job creations per hour
//   message: 'Too many marking job requests, please try again later',
// }));

// // ==============================================
// // HEALTH CHECK & INFO ROUTES
// // ==============================================

// // Health check endpoint
// app.get('/health', (req: Request, res: Response) => {
//   res.status(200).json({
//     status: 'healthy',
//     service: 'marking-service',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     environment: process.env.NODE_ENV || 'development',
//   });
// });

// // Readiness check (includes database connectivity)
// app.get('/ready', async (req: Request, res: Response) => {
//   try {
//     // TODO: Add database connectivity check
//     // const dbConnected = await checkDatabaseConnection();
    
//     res.status(200).json({
//       status: 'ready',
//       service: 'marking-service',
//       timestamp: new Date().toISOString(),
//       checks: {
//         database: true, // dbConnected
//         redis: true, // Add redis check if used
//       },
//     });
//   } catch (error) {
//     res.status(503).json({
//       status: 'not ready',
//       service: 'marking-service',
//       timestamp: new Date().toISOString(),
//       error: error instanceof Error ? error.message : 'Unknown error',
//     });
//   }
// });

// // Service info endpoint
// app.get('/info', (req: Request, res: Response) => {
//   res.status(200).json({
//     service: 'marking-service',
//     version: process.env.SERVICE_VERSION || '1.0.0',
//     description: 'Property marking job management service',
//     features: [
//       'Property marking job creation',
//       'Agent queue management',
//       'First-come-first-served assignment',
//       'Time-slot based marking',
//       'Payment processing for marking fees',
//       'Property owner confirmation system',
//       'Proximity-based agent assignment',
//     ],
//     endpoints: {
//       health: '/health',
//       ready: '/ready',
//       info: '/info',
//       markingJobs: '/api/marking-jobs',
//       queue: '/api/queue',
//       assignments: '/api/assignments',
//       completion: '/api/completion',
//     },
//   });
// });

// // ==============================================
// // API ROUTES
// // ==============================================

// // Mount route handlers (to be implemented)
// // app.use('/api/marking-jobs', markingJobRoutes);
// // app.use('/api/queue', queueRoutes);
// // app.use('/api/assignments', assignmentRoutes);
// // app.use('/api/completion', completionRoutes);

// // Placeholder for routes until they are implemented
// app.use('/api/marking-jobs', (req: Request, res: Response) => {
//   res.status(501).json({
//     success: false,
//     message: 'Marking jobs routes not yet implemented',
//   });
// });

// app.use('/api/queue', (req: Request, res: Response) => {
//   res.status(501).json({
//     success: false,
//     message: 'Queue routes not yet implemented',
//   });
// });

// app.use('/api/assignments', (req: Request, res: Response) => {
//   res.status(501).json({
//     success: false,
//     message: 'Assignment routes not yet implemented',
//   });
// });

// app.use('/api/completion', (req: Request, res: Response) => {
//   res.status(501).json({
//     success: false,
//     message: 'Completion routes not yet implemented',
//   });
// });

// // ==============================================
// // 404 HANDLER
// // ==============================================

// app.use('*', (req: Request, res: Response) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found',
//     path: req.originalUrl,
//     method: req.method,
//     timestamp: new Date().toISOString(),
//   });
// });

// // ==============================================
// // ERROR HANDLING MIDDLEWARE
// // ==============================================

// // Global error handler (must be last)
// app.use(errorHandler);

// // ==============================================
// // GRACEFUL SHUTDOWN
// // ==============================================

// process.on('SIGTERM', () => {
//   console.log('SIGTERM signal received: closing HTTP server');
//   // Perform cleanup here (close database connections, etc.)
//   process.exit(0);
// });

// process.on('SIGINT', () => {
//   console.log('SIGINT signal received: closing HTTP server');
//   // Perform cleanup here
//   process.exit(0);
// });

// // Handle uncaught exceptions
// process.on('uncaughtException', (error: Error) => {
//   console.error('Uncaught Exception:', error);
//   // Log to error tracking service (e.g., Sentry)
//   process.exit(1);
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
//   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
//   // Log to error tracking service
//   process.exit(1);
// });

// export default app;