// backend/referral-service/src/routes/analytics.ts

import { Router } from 'express';
import analyticsController from '../controllers/analyticsController';
import { verifyToken } from '../middleware/referralAuth';
import { analyticsRateLimiter } from '../middleware/rateLimiting';

const router = Router();

// All analytics routes require authentication and are rate limited
router.use(verifyToken);
router.use(analyticsRateLimiter);

/**
 * Analytics routes
 */

// Get overview analytics
router.get(
  '/overview',
  analyticsController.getOverview
);

// Get referral trends
router.get(
  '/trends',
  analyticsController.getTrends
);

// Get performance analytics
router.get(
  '/performance',
  analyticsController.getPerformance
);

// Get channel analytics
router.get(
  '/channels',
  analyticsController.getChannelAnalytics
);

// Get leaderboard
router.get(
  '/leaderboard',
  analyticsController.getLeaderboard
);

export default router;