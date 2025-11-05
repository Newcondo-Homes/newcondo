// backend/property-service/src/routes/rentalHistory.ts

import express from 'express';
import rentalHistoryController from '../controllers/rentalHistoryController';
import { authMiddleware } from '../../shared/src/middleware/auth';
import { verifyPropertyOwnership } from '../middleware/ownershipValidation';

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authMiddleware);

/**
 * Get rental history with filters
 * GET /api/rental-history
 */
router.get(
  '/',
  rentalHistoryController.getRentalHistory
);

/**
 * Get rental summary statistics
 * GET /api/rental-history/summary
 */
router.get(
  '/summary',
  rentalHistoryController.getRentalSummary
);

/**
 * Get payment history
 * GET /api/rental-history/payments
 */
router.get(
  '/payments',
  rentalHistoryController.getPaymentHistory
);

/**
 * Get rental revenue breakdown
 * GET /api/rental-history/revenue-breakdown
 */
router.get(
  '/revenue-breakdown',
  rentalHistoryController.getRentalRevenueBreakdown
);

/**
 * Get upcoming rental expirations
 * GET /api/rental-history/upcoming-expirations
 */
router.get(
  '/upcoming-expirations',
  rentalHistoryController.getUpcomingExpirations
);

/**
 * Export rental history
 * GET /api/rental-history/export
 */
router.get(
  '/export',
  rentalHistoryController.exportRentalHistory
);

/**
 * Get single rental details
 * GET /api/rental-history/rentals/:rentalId
 */
router.get(
  '/rentals/:rentalId',
  rentalHistoryController.getRentalDetails
);

/**
 * Get property rental timeline
 * GET /api/rental-history/properties/:propertyId/timeline
 */
router.get(
  '/properties/:propertyId/timeline',
  verifyPropertyOwnership,
  rentalHistoryController.getPropertyRentalTimeline
);

/**
 * Get property rental statistics
 * GET /api/rental-history/properties/:propertyId/statistics
 */
router.get(
  '/properties/:propertyId/statistics',
  verifyPropertyOwnership,
  rentalHistoryController.getPropertyRentalStatistics
);

/**
 * Get tenant rental profile
 * GET /api/rental-history/tenants/:renterId/profile
 */
router.get(
  '/tenants/:renterId/profile',
  rentalHistoryController.getTenantRentalProfile
);

export default router;