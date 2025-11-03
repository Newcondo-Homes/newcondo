// backend/referral-service/src/routes/agentReferrals.ts

import { Router } from 'express';
import { agentReferralController } from '../controllers/agentReferralController';
import { auth } from '../../../shared/src/middleware/auth';
import { rateLimiter } from '../../../shared/src/middleware/rateLimiter';

const router = Router();

// Apply authentication to all routes
router.use(auth);

// Apply rate limiting
router.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));

/**
 * @route   GET /api/referrals/dashboard
 * @desc    Get agent referral dashboard data
 * @access  Private (Agent/Owner)
 */
router.get(
  '/dashboard',
  agentReferralController.getReferralDashboard.bind(agentReferralController)
);

/**
 * @route   GET /api/referrals/property/:propertyId/tracking
 * @desc    Get referral tracking for a specific property
 * @access  Private (Agent/Owner)
 */
router.get(
  '/property/:propertyId/tracking',
  agentReferralController.getPropertyReferralTracking.bind(agentReferralController)
);

/**
 * @route   GET /api/referrals/analytics
 * @desc    Get referral analytics
 * @access  Private (Agent/Owner)
 * @query   startDate, endDate, propertyId
 */
router.get(
  '/analytics',
  agentReferralController.getReferralAnalytics.bind(agentReferralController)
);

/**
 * @route   POST /api/referrals/track/click
 * @desc    Track referral link click
 * @access  Public
 * @body    { referralCode, propertyId }
 */
router.post(
  '/track/click',
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 20 }), // 20 clicks per minute
  agentReferralController.trackReferralClick.bind(agentReferralController)
);

/**
 * @route   POST /api/referrals/track/conversion
 * @desc    Track referral conversion (payment)
 * @access  Private
 * @body    { referralCode, propertyId, paymentId, amount }
 */
router.post(
  '/track/conversion',
  agentReferralController.trackReferralConversion.bind(agentReferralController)
);

/**
 * @route   GET /api/referrals/performance/properties
 * @desc    Get referral performance by property
 * @access  Private (Agent/Owner)
 * @query   page, limit, sortBy
 */
router.get(
  '/performance/properties',
  agentReferralController.getReferralPerformanceByProperty.bind(agentReferralController)
);

/**
 * @route   GET /api/referrals/top-performing
 * @desc    Get top performing referrals
 * @access  Private (Agent/Owner)
 * @query   limit
 */
router.get(
  '/top-performing',
  agentReferralController.getTopPerformingReferrals.bind(agentReferralController)
);

/**
 * @route   GET /api/referrals/earnings/history
 * @desc    Get referral earnings history
 * @access  Private (Agent/Owner)
 * @query   page, limit, startDate, endDate
 */
router.get(
  '/earnings/history',
  agentReferralController.getReferralEarningsHistory.bind(agentReferralController)
);

export default router;