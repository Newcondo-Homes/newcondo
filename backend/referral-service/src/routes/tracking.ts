// backend/referral-service/src/routes/tracking.ts

import { Router } from 'express';
import trackingController from '../controllers/trackingController';
import { verifyToken, optionalAuth } from '../middleware/referralAuth';
import { validateTrackClick } from '../middleware/referralValidation';
import { clickTrackingRateLimiter } from '../middleware/rateLimiting';

const router = Router();

/**
 * Public/Semi-public routes
 */

// Track referral click (no auth required)
router.post(
  '/click',
  clickTrackingRateLimiter,
  validateTrackClick,
  trackingController.trackClick
);

/**
 * Protected routes
 */

// Track conversion (requires auth)
router.post(
  '/conversion',
  verifyToken,
  trackingController.trackConversion
);

// Get click analytics for a referral code
router.get(
  '/analytics/:referralCode',
  verifyToken,
  trackingController.getClickAnalytics
);

// Get performance metrics for user
router.get(
  '/performance',
  verifyToken,
  trackingController.getPerformanceMetrics
);

// Get attribution data for current user
router.get(
  '/attribution',
  verifyToken,
  trackingController.getUserAttribution
);

// Get multi-touch attribution
router.get(
  '/multi-touch-attribution',
  verifyToken,
  trackingController.getMultiTouchAttribution
);

// Check for fraud
router.get(
  '/fraud-check',
  verifyToken,
  trackingController.checkFraud
);

export default router;