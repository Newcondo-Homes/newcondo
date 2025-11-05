// backend/property-service/src/routes/propertyAnalytics.ts

import express from 'express';
import propertyAnalyticsController from '../controllers/propertyAnalyticsController';
import { authMiddleware } from '../../shared/src/middleware/auth';
import { verifyPropertyOwnership } from '../middleware/ownershipValidation';

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authMiddleware);

/**
 * Get dashboard analytics
 * GET /api/property-analytics/dashboard
 */
router.get(
  '/dashboard',
  propertyAnalyticsController.getDashboardAnalytics
);

/**
 * Get earnings analytics
 * GET /api/property-analytics/earnings
 */
router.get(
  '/earnings',
  propertyAnalyticsController.getEarningsAnalytics
);

/**
 * Get agent referral analytics
 * GET /api/property-analytics/agent/referrals
 */
router.get(
  '/agent/referrals',
  propertyAnalyticsController.getAgentReferralAnalytics
);

/**
 * Export analytics report
 * GET /api/property-analytics/export
 */
router.get(
  '/export',
  propertyAnalyticsController.exportAnalyticsReport
);

/**
 * Get multiple properties performance summary
 * POST /api/property-analytics/properties/bulk-performance
 */
router.post(
  '/properties/bulk-performance',
  propertyAnalyticsController.getBulkPropertyPerformance
);

/**
 * Get property performance metrics
 * GET /api/property-analytics/properties/:propertyId/performance
 */
router.get(
  '/properties/:propertyId/performance',
  verifyPropertyOwnership,
  propertyAnalyticsController.getPropertyPerformance
);

/**
 * Get property comparison vs market
 * GET /api/property-analytics/properties/:propertyId/comparison
 */
router.get(
  '/properties/:propertyId/comparison',
  verifyPropertyOwnership,
  propertyAnalyticsController.getPropertyComparison
);

/**
 * Get property listing analytics
 * GET /api/property-analytics/properties/:propertyId/listing-analytics
 */
router.get(
  '/properties/:propertyId/listing-analytics',
  verifyPropertyOwnership,
  propertyAnalyticsController.getPropertyListingAnalytics
);

/**
 * Get property performance trends
 * GET /api/property-analytics/properties/:propertyId/trends
 */
router.get(
  '/properties/:propertyId/trends',
  verifyPropertyOwnership,
  propertyAnalyticsController.getPropertyTrends
);

export default router;