import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authenticateAdmin } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/adminValidation';
import {
  analyticsRangeSchema,
  revenueReportSchema,
  userGrowthSchema,
} from '../validations/analyticsSchemas';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * GET /api/admin/analytics/overview
 * Get platform overview analytics
 */
router.get(
  '/overview',
  validateRequest(analyticsRangeSchema, 'query'),
  analyticsController.getPlatformOverview
);

/**
 * GET /api/admin/analytics/revenue
 * Get revenue analytics and trends
 */
router.get(
  '/revenue',
  validateRequest(revenueReportSchema, 'query'),
  analyticsController.getRevenueAnalytics
);

/**
 * GET /api/admin/analytics/users
 * Get user growth and engagement analytics
 */
router.get(
  '/users',
  validateRequest(userGrowthSchema, 'query'),
  analyticsController.getUserAnalytics
);

/**
 * GET /api/admin/analytics/properties
 * Get property listing analytics
 */
router.get(
  '/properties',
  validateRequest(analyticsRangeSchema, 'query'),
  analyticsController.getPropertyAnalytics
);

/**
 * GET /api/admin/analytics/payments
 * Get payment transaction analytics
 */
router.get(
  '/payments',
  validateRequest(analyticsRangeSchema, 'query'),
  analyticsController.getPaymentAnalytics
);

/**
 * GET /api/admin/analytics/marking-jobs
 * Get property marking job analytics
 */
router.get(
  '/marking-jobs',
  validateRequest(analyticsRangeSchema, 'query'),
  analyticsController.getMarkingJobAnalytics
);

/**
 * GET /api/admin/analytics/referrals
 * Get referral program analytics
 */
router.get(
  '/referrals',
  validateRequest(analyticsRangeSchema, 'query'),
  analyticsController.getReferralAnalytics
);

/**
 * GET /api/admin/analytics/geographic
 * Get geographic distribution analytics
 */
router.get('/geographic', analyticsController.getGeographicAnalytics);

/**
 * GET /api/admin/analytics/agent-performance
 * Get agent performance metrics
 */
router.get(
  '/agent-performance',
  validateRequest(analyticsRangeSchema, 'query'),
  analyticsController.getAgentPerformanceAnalytics
);

/**
 * GET /api/admin/analytics/verification-trends
 * Get user verification trend analytics
 */
router.get(
  '/verification-trends',
  validateRequest(analyticsRangeSchema, 'query'),
  analyticsController.getVerificationTrends
);

/**
 * POST /api/admin/analytics/export
 * Export analytics data as CSV/Excel
 */
router.post('/export', analyticsController.exportAnalyticsData);

/**
 * GET /api/admin/analytics/real-time
 * Get real-time platform metrics
 */
router.get('/real-time', analyticsController.getRealTimeMetrics);

export default router;














// import { Router } from 'express';
// import { analyticsController } from '../controllers/analyticsController';
// import { authMiddleware } from '../../../shared/src/middleware/auth';
// import { adminAuth } from '../middleware/adminAnalyticsAuth';
// import { analyticsValidation } from '../middleware/analyticsValidation';

// const router = Router();

// // All routes require authentication and admin role
// router.use(authMiddleware);
// router.use(adminAuth);

// // Dashboard analytics
// router.get(
//   '/dashboard',
//   analyticsValidation.validateDashboardQuery,
//   analyticsController.getDashboardAnalytics
// );

// // Platform overview
// router.get('/overview', analyticsController.getPlatformOverview);

// // Growth metrics
// router.get(
//   '/growth',
//   analyticsValidation.validateGrowthQuery,
//   analyticsController.getGrowthMetrics
// );

// // Conversion funnel
// router.get(
//   '/funnel',
//   analyticsValidation.validateDateRange,
//   analyticsController.getConversionFunnel
// );

// // User engagement
// router.get('/engagement', analyticsController.getUserEngagement);

// // Export report
// router.get(
//   '/export',
//   analyticsValidation.validateExportQuery,
//   analyticsController.exportReport
// );

// export default router;