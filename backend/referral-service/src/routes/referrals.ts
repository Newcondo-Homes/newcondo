// backend/referral-service/src/routes/referrals.ts

import { Router } from 'express';
import referralController from '../controllers/referralController';
import {
  verifyToken,
  canRefer,
  authorizeReferralAccess,
} from '../middleware/referralAuth';
import {
  validateReferralCode,
  validatePagination,
  validateReferralFilters,
} from '../middleware/referralValidation';
import {
  referralCreationRateLimiter,
  rapidReferralCheck,
} from '../middleware/rateLimiting';

const router = Router();

/**
 * Public routes
 */

// Validate referral code (public)
router.get(
  '/validate/:code',
  validateReferralCode,
  referralController.validateCode
);

/**
 * Protected routes (require authentication)
 */

// Get referral dashboard
router.get(
  '/dashboard',
  verifyToken,
  referralController.getDashboard
);

// Get or create referral code
router.get(
  '/code',
  verifyToken,
  referralController.getReferralCode
);

// Get referral links
router.get(
  '/links',
  verifyToken,
  referralController.getReferralLinks
);

// Get user's referrals
router.get(
  '/',
  verifyToken,
  validatePagination,
  validateReferralFilters,
  referralController.getReferrals
);

// Get referral statistics
router.get(
  '/statistics',
  verifyToken,
  referralController.getStatistics
);

// Check referral eligibility
router.get(
  '/eligibility',
  verifyToken,
  referralController.checkEligibility
);

// Get specific referral
router.get(
  '/:referralId',
  verifyToken,
  authorizeReferralAccess,
  referralController.getReferralById
);

// Regenerate referral code
router.post(
  '/regenerate',
  verifyToken,
  canRefer,
  referralCreationRateLimiter,
  referralController.regenerateCode
);

// Generate custom referral link
router.post(
  '/custom-link',
  verifyToken,
  canRefer,
  referralController.generateCustomLink
);

export default router;