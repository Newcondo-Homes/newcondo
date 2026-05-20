// src/routes/index.ts
import { Router } from 'express';
import { logger } from '../utils/logger';
import type { Router as ExpressRouter } from 'express'

// Import service routers
import { authRouter } from './auth';
// import { propertyRouter } from './properties';
import { paymentRouter } from './payments';
// import { bookingRouter } from './bookings';
// import { markingRouter } from './marking';
// import { adminRouter } from './admin';
// import { referralRouter } from './referrals';
// import { notificationRouter } from './notifications';
// import { analyticsRouter } from './analytics';

const router: ExpressRouter = Router();

// Test route to verify router is working
router.get('/test', (req, res) => {
  logger.info('Test route hit successfully');
  res.json({
    success: true,
    message: 'Main router is working correctly',
    timestamp: new Date().toISOString(),
    route: '/api/v1/test'
  });
});

// Service route mounting with error handling
const mountRoute = (path: string, routerInstance: Router, serviceName: string) => {
  try {
    router.use(path, routerInstance);
    logger.info(`✅ ${serviceName} routes mounted on ${path}`);
  } catch (error) {
    logger.error(`❌ Failed to mount ${serviceName} routes on ${path}:`, error);
  }
};

// Mount all service routes
mountRoute('/auth', authRouter, 'Auth Service');
mountRoute('/payments', paymentRouter, 'Payment Service');
// mountRoute('/properties', propertyRouter, 'Property Service');
// mountRoute('/bookings', bookingRouter, 'Booking Service');
// mountRoute('/marking', markingRouter, 'Marking Service');
// mountRoute('/admin', adminRouter, 'Admin Service');
// mountRoute('/referrals', referralRouter, 'Referral Service');
// mountRoute('/notifications', notificationRouter, 'Notification Service');
// mountRoute('/analytics', analyticsRouter, 'Analytics Service');

// Service status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    services: {
      auth: 'active',
      properties: 'active',
      payments: 'active',
      bookings: 'active',
      marking: 'active',
      admin: 'active',
      referrals: 'active',
      notifications: 'active',
      analytics: 'active'
    },
    timestamp: new Date().toISOString()
  });
});

export { router as mainRouter };