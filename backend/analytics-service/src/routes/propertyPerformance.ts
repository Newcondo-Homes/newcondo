import { Router } from 'express';
import { PropertyPerformanceController } from '../controllers/propertyPerformanceController';
import { auth } from '../../../shared/src/middleware/auth';
import { rateLimiter } from '../../../shared/src/middleware/rateLimiter';

const router = Router();
const controller = new PropertyPerformanceController();

// Apply authentication to all routes
router.use(auth);

// Apply rate limiting
router.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 })); // 100 requests per 15 minutes

/**
 * @route GET /api/analytics/property-performance/:propertyId
 * @desc Get performance metrics for a specific property
 * @access Private (Owner/Agent)
 */
router.get('/:propertyId', controller.getPropertyPerformance);

/**
 * @route GET /api/analytics/property-performance
 * @desc Get performance metrics for all user's properties
 * @access Private (Owner/Agent)
 */
router.get('/', controller.getAllPropertiesPerformance);

/**
 * @route GET /api/analytics/property-performance/:propertyId/views
 * @desc Get view analytics for a property
 * @access Private (Owner/Agent)
 */
router.get('/:propertyId/views', controller.getPropertyViewAnalytics);

/**
 * @route GET /api/analytics/property-performance/:propertyId/conversion
 * @desc Get rental conversion rate for a property
 * @access Private (Owner/Agent)
 */
router.get('/:propertyId/conversion', controller.getPropertyConversionRate);

/**
 * @route GET /api/analytics/property-performance/compare
 * @desc Get property comparison analytics
 * @access Private (Owner/Agent)
 */
router.get('/compare', controller.getPropertyComparison);

/**
 * @route GET /api/analytics/property-performance/ranking
 * @desc Get best and worst performing properties
 * @access Private (Owner/Agent)
 */
router.get('/ranking', controller.getPerformanceRanking);

/**
 * @route GET /api/analytics/property-performance/:propertyId/marketing
 * @desc Get property marketing effectiveness
 * @access Private (Owner/Agent)
 */
router.get('/:propertyId/marketing', controller.getMarketingEffectiveness);

/**
 * @route GET /api/analytics/property-performance/:propertyId/time-on-market
 * @desc Get time-on-market analytics
 * @access Private (Owner/Agent)
 */
router.get('/:propertyId/time-on-market', controller.getTimeOnMarketAnalytics);

export default router;