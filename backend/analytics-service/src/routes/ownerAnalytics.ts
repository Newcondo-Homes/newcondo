import { Router } from 'express';
import { OwnerAnalyticsController } from '../controllers/ownerAnalyticsController';
import { auth } from '../../../shared/src/middleware/auth';
import { rateLimiter } from '../../../shared/src/middleware/rateLimiter';

const router = Router();
const controller = new OwnerAnalyticsController();

// Apply authentication to all routes
router.use(auth);

// Apply rate limiting
router.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 })); // 100 requests per 15 minutes

/**
 * @route GET /api/analytics/owner/portfolio
 * @desc Get owner's portfolio overview
 * @access Private (Owner/Agent)
 */
router.get('/portfolio', controller.getPortfolioOverview);

/**
 * @route GET /api/analytics/owner/revenue
 * @desc Get revenue analytics
 * @access Private (Owner/Agent)
 */
router.get('/revenue', controller.getRevenueAnalytics);

/**
 * @route GET /api/analytics/owner/commission
 * @desc Get commission earnings breakdown
 * @access Private (Owner/Agent)
 */
router.get('/commission', controller.getCommissionEarnings);

/**
 * @route GET /api/analytics/owner/referrals
 * @desc Get agent referral analytics
 * @access Private (Agent)
 */
router.get('/referrals', controller.getReferralAnalytics);

/**
 * @route GET /api/analytics/owner/occupancy
 * @desc Get occupancy rate analytics
 * @access Private (Owner/Agent)
 */
router.get('/occupancy', controller.getOccupancyAnalytics);

/**
 * @route GET /api/analytics/owner/trends
 * @desc Get property performance trends
 * @access Private (Owner/Agent)
 */
router.get('/trends', controller.getPerformanceTrends);

/**
 * @route GET /api/analytics/owner/financial-summary
 * @desc Get financial summary
 * @access Private (Owner/Agent)
 */
router.get('/financial-summary', controller.getFinancialSummary);

/**
 * @route GET /api/analytics/owner/marking-service
 * @desc Get marking service analytics
 * @access Private (Agent)
 */
router.get('/marking-service', controller.getMarkingServiceAnalytics);

/**
 * @route GET /api/analytics/owner/export
 * @desc Export analytics data
 * @access Private (Owner/Agent)
 */
router.get('/export', controller.exportAnalyticsData);

export default router;