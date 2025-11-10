// backend/admin-service/src/routes/platformMetrics.ts
import { Router } from 'express';
import {
  getPlatformOverview,
  getUserMetrics,
  getPropertyMetrics,
  getPaymentMetrics,
  getEngagementMetrics,
  getGrowthMetrics,
  getConversionMetrics,
  getPlatformHealth,
  getTimeSeriesData
} from '../controllers/platformMetricsController';
import { authenticateAdmin } from '../middleware/adminAnalyticsAuth';
import { validateMetricsQuery } from '../middleware/analyticsValidation';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/metrics/overview
 * @desc    Get comprehensive platform overview
 * @access  Admin
 */
router.get('/overview', validateMetricsQuery, getPlatformOverview);

/**
 * @route   GET /api/admin/metrics/users
 * @desc    Get detailed user metrics
 * @access  Admin
 */
router.get('/users', validateMetricsQuery, getUserMetrics);

/**
 * @route   GET /api/admin/metrics/properties
 * @desc    Get detailed property metrics
 * @access  Admin
 */
router.get('/properties', validateMetricsQuery, getPropertyMetrics);

/**
 * @route   GET /api/admin/metrics/payments
 * @desc    Get detailed payment metrics
 * @access  Admin
 */
router.get('/payments', validateMetricsQuery, getPaymentMetrics);

/**
 * @route   GET /api/admin/metrics/engagement
 * @desc    Get user engagement metrics
 * @access  Admin
 */
router.get('/engagement', validateMetricsQuery, getEngagementMetrics);

/**
 * @route   GET /api/admin/metrics/growth
 * @desc    Get platform growth metrics
 * @access  Admin
 */
router.get('/growth', validateMetricsQuery, getGrowthMetrics);

/**
 * @route   GET /api/admin/metrics/conversion
 * @desc    Get conversion rate metrics
 * @access  Admin
 */
router.get('/conversion', validateMetricsQuery, getConversionMetrics);

/**
 * @route   GET /api/admin/metrics/health
 * @desc    Get platform health score
 * @access  Admin
 */
router.get('/health', getPlatformHealth);

/**
 * @route   GET /api/admin/metrics/timeseries
 * @desc    Get time series data for charts
 * @access  Admin
 */
router.get('/timeseries', validateMetricsQuery, getTimeSeriesData);

export default router;