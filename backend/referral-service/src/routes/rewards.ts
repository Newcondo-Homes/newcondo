// backend/referral-service/src/routes/rewards.ts

import { Router } from 'express';
import rewardController from '../controllers/rewardController';
import {
  verifyToken,
  authorizeRewardAccess,
  requireAdmin,
} from '../middleware/referralAuth';
import {
  validateApplyReward,
  validatePagination,
} from '../middleware/referralValidation';
import { rewardRedemptionRateLimiter } from '../middleware/rateLimiting';

const router = Router();

/**
 * User routes
 */

// Get reward balance
router.get(
  '/balance',
  verifyToken,
  rewardController.getBalance
);

// Get user's rewards
router.get(
  '/',
  verifyToken,
  validatePagination,
  rewardController.getRewards
);

// Get reward summary
router.get(
  '/summary',
  verifyToken,
  rewardController.getSummary
);

// Get expiring rewards
router.get(
  '/expiring',
  verifyToken,
  rewardController.getExpiringRewards
);

// Apply reward to transaction
router.post(
  '/apply',
  verifyToken,
  validateApplyReward,
  rewardRedemptionRateLimiter,
  rewardController.applyReward
);

// Redeem reward
router.post(
  '/:rewardId/redeem',
  verifyToken,
  authorizeRewardAccess,
  rewardRedemptionRateLimiter,
  rewardController.redeemReward
);

/**
 * Admin routes
 */

// Approve reward
router.post(
  '/:rewardId/approve',
  verifyToken,
  requireAdmin,
  rewardController.approveReward
);

// Reject reward
router.post(
  '/:rewardId/reject',
  verifyToken,
  requireAdmin,
  rewardController.rejectReward
);

// Process reward payout
router.post(
  '/:rewardId/payout',
  verifyToken,
  requireAdmin,
  rewardController.processRewardPayout
);

export default router;