// backend/admin-service/src/app.ts

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from '../../shared/src/middleware/errorHandler';
import { corsMiddleware } from '../../shared/src/middleware/cors';

// Import routes (to be implemented)
// import adminRoutes from './routes/admin';
// import verificationRoutes from './routes/verification';
// import userRoutes from './routes/users';
// import propertyRoutes from './routes/properties';
// import analyticsRoutes from './routes/analytics';
// import boundaryDisputeRoutes from './routes/boundaryDisputes';
// import duplicateRoutes from './routes/duplicates';
// import markingOversightRoutes from './routes/markingOversight';
// import supportRoutes from './routes/support';
// import transactionRoutes from './routes/transactions';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Admin service is running',
    timestamp: new Date().toISOString(),
    service: 'admin-service',
  });
});

// API Routes
// app.use('/api/admin', adminRoutes);
// app.use('/api/admin/verifications', verificationRoutes);
// app.use('/api/admin/users', userRoutes);
// app.use('/api/admin/properties', propertyRoutes);
// app.use('/api/admin/analytics', analyticsRoutes);
// app.use('/api/admin/boundary-disputes', boundaryDisputeRoutes);
// app.use('/api/admin/duplicates', duplicateRoutes);
// app.use('/api/admin/marking-oversight', markingOversightRoutes);
// app.use('/api/admin/support', supportRoutes);
// app.use('/api/admin/transactions', transactionRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Global error handler
app.use(errorHandler);

export default app;