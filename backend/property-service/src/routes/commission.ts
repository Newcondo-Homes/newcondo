// backend/payment-service/src/routes/commission.ts

import { Router } from 'express';
import { commissionController } from '../controllers/commissionController';
import { auth } from '../../../shared/src/middleware/auth';
import { rateLimiter } from '../../../shared/src/middleware/rateLimiter';

const router = Router();

// Apply authentication to all routes
router.use(auth);

// Apply rate limiting
router.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));

/**
 * @route   GET /api/commission/dashboard
 * @desc    Get commission dashboard
 * @access  Private (Agent/Owner)
 */
router.get(
  '/dashboard',
  commissionController.getCommissionDashboard.bind(commissionController)
);

/**
 * @route   GET /api/commission/payment/:paymentId/breakdown
 * @desc    Get commission breakdown for a specific payment
 * @access  Private (Agent/Owner)
 */
router.get(
  '/payment/:paymentId/breakdown',
  commissionController.getPaymentCommissionBreakdown.bind(commissionController)
);

/**
 * @route   GET /api/commission/earnings/summary
 * @desc    Get earnings summary
 * @access  Private (Agent/Owner)
 * @query   startDate, endDate
 */
router.get(
  '/earnings/summary',
  commissionController.getEarningsSummary.bind(commissionController)
);

/**
 * @route   GET /api/commission/history
 * @desc    Get commission history
 * @access  Private (Agent/Owner)
 * @query   page, limit, status, startDate, endDate
 */
router.get(
  '/history',
  commissionController.getCommissionHistory.bind(commissionController)
);

/**
 * @route   GET /api/commission/earnings/pending
 * @desc    Get pending earnings (in confirmation period)
 * @access  Private (Agent/Owner)
 */
router.get(
  '/earnings/pending',
  commissionController.getPendingEarnings.bind(commissionController)
);

/**
 * @route   GET /api/commission/earnings/released
 * @desc    Get released earnings (available for withdrawal)
 * @access  Private (Agent/Owner)
 * @query   page, limit
 */
router.get(
  '/earnings/released',
  commissionController.getReleasedEarnings.bind(commissionController)
);

/**
 * @route   GET /api/commission/earnings/by-property
 * @desc    Get earnings breakdown by property
 * @access  Private (Agent/Owner)
 * @query   page, limit
 */
router.get(
  '/earnings/by-property',
  commissionController.getEarningsByProperty.bind(commissionController)
);

/**
 * @route   GET /api/commission/analytics
 * @desc    Get earnings analytics
 * @access  Private (Agent/Owner)
 * @query   period: 'week' | 'month' | 'year'
 */
router.get(
  '/analytics',
  commissionController.getEarningsAnalytics.bind(commissionController)
);

/**
 * @route   POST /api/commission/calculate
 * @desc    Calculate commission for a rental payment
 * @access  Private
 * @body    { rentAmount, propertyId, referralCode? }
 */
router.post(
  '/calculate',
  commissionController.calculateCommission.bind(commissionController)
);

export default router;