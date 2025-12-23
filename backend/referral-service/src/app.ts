import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { errorHandler } from "@newcondo/backend-shared/src";
import { authRoutes } from "./routes/auth";
import { otpRoutes } from "./routes/otp";
import profileRoutes from "./routes/profile";

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Stricter rate limiting for auth endpoints
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 auth requests per windowMs
//   message: "Too many authentication attempts, please try again later",
// })

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan("combined"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);

//auth routes with strict rate limiting
// app.use("/api/auth", authLimiter, authRoutes)
// app.use("/api/otp", authLimiter, otpRoutes)

app.use("/api/profile", profileRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "auth-service" });
});

// Error handling
app.use(errorHandler);

export default app;











// // backend/referral-service/src/app.ts

// import express, { Application, Request, Response, NextFunction } from 'express';
// import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import compression from 'compression';

// // Import routes
// import referralRoutes from './routes/referrals';
// import trackingRoutes from './routes/tracking';
// import rewardRoutes from './routes/rewards';
// import analyticsRoutes from './routes/analytics';

// // Import middleware
// import { generalRateLimiter } from './middleware/rateLimiting';

// const app: Application = express();

// /**
//  * Security Middleware
//  */
// app.use(helmet());
// app.use(
//   cors({
//     origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
//     credentials: true,
//   })
// );

// /**
//  * Body Parsing Middleware
//  */
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// /**
//  * Compression Middleware
//  */
// app.use(compression());

// /**
//  * Logging Middleware
//  */
// if (process.env.NODE_ENV !== 'production') {
//   app.use(morgan('dev'));
// } else {
//   app.use(morgan('combined'));
// }

// /**
//  * Rate Limiting
//  */
// app.use('/api', generalRateLimiter);

// /**
//  * Health Check Route
//  */
// app.get('/health', (req: Request, res: Response) => {
//   res.json({
//     success: true,
//     data: {
//       service: 'referral-service',
//       status: 'healthy',
//       timestamp: new Date().toISOString(),
//       uptime: process.uptime(),
//     },
//   });
// });

// /**
//  * API Routes
//  */
// app.use('/api/referrals', referralRoutes);
// app.use('/api/tracking', trackingRoutes);
// app.use('/api/rewards', rewardRoutes);
// app.use('/api/analytics', analyticsRoutes);

// /**
//  * Root Route
//  */
// app.get('/', (req: Request, res: Response) => {
//   res.json({
//     success: true,
//     data: {
//       service: 'NewCondo Referral Service',
//       version: '1.0.0',
//       endpoints: {
//         referrals: '/api/referrals',
//         tracking: '/api/tracking',
//         rewards: '/api/rewards',
//         analytics: '/api/analytics',
//         health: '/health',
//       },
//     },
//   });
// });

// /**
//  * 404 Handler
//  */
// app.use((req: Request, res: Response) => {
//   res.status(404).json({
//     success: false,
//     error: {
//       code: 'NOT_FOUND',
//       message: 'The requested resource was not found',
//       path: req.path,
//     },
//   });
// });

// /**
//  * Global Error Handler
//  */
// app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
//   console.error('Error:', err);

//   // Handle specific error types
//   if (err.name === 'ValidationError') {
//     return res.status(400).json({
//       success: false,
//       error: {
//         code: 'VALIDATION_ERROR',
//         message: err.message,
//       },
//     });
//   }

//   if (err.name === 'UnauthorizedError') {
//     return res.status(401).json({
//       success: false,
//       error: {
//         code: 'UNAUTHORIZED',
//         message: 'Authentication required',
//       },
//     });
//   }

//   if (err.name === 'ForbiddenError') {
//     return res.status(403).json({
//       success: false,
//       error: {
//         code: 'FORBIDDEN',
//         message: 'You do not have permission to access this resource',
//       },
//     });
//   }

//   // Default error response
//   res.status(500).json({
//     success: false,
//     error: {
//       code: 'INTERNAL_SERVER_ERROR',
//       message: process.env.NODE_ENV === 'production'
//         ? 'An internal server error occurred'
//         : err.message,
//       ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
//     },
//   });
// });

// export default app;
