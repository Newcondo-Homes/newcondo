// backend/admin-service/src/routes/revenue.ts
import { Router } from 'express';
import {
  getRevenueOverview,
  getRevenueBySource,
  getRevenueByPeriod,
  getRevenueBreakdown,
  getCommissionAnalysis,
  getRevenueForecasts,
  getRevenueComparison,
  getTopRevenueGenerators,
  getRevenueByLocation,
  getRevenueReport,
  exportRevenueData
} from '../controllers/revenueController';
import { authenticateAdmin } from '../middleware/adminAnalyticsAuth';
import { 
  validateMetricsQuery,
  validateReportParams
} from '../middleware/analyticsValidation';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/revenue/overview
 * @desc    Get revenue overview with key metrics
 * @access  Admin
 */
router.get('/overview', validateMetricsQuery, getRevenueOverview);

/**
 * @route   GET /api/admin/revenue/by-source
 * @desc    Get revenue breakdown by source (rent, marking, premium, etc.)
 * @access  Admin
 */
router.get('/by-source', validateMetricsQuery, getRevenueBySource);

/**
 * @route   GET /api/admin/revenue/by-period
 * @desc    Get revenue data by time period (daily, weekly, monthly)
 * @access  Admin
 */
router.get('/by-period', validateMetricsQuery, getRevenueByPeriod);

/**
 * @route   GET /api/admin/revenue/breakdown
 * @desc    Get detailed revenue breakdown with categories
 * @access  Admin
 */
router.get('/breakdown', validateMetricsQuery, getRevenueBreakdown);

/**
 * @route   GET /api/admin/revenue/commission
 * @desc    Get commission analysis (agent vs platform split)
 * @access  Admin
 */
router.get('/commission', validateMetricsQuery, getCommissionAnalysis);

/**
 * @route   GET /api/admin/revenue/forecasts
 * @desc    Get revenue forecasts and predictions
 * @access  Admin
 */
router.get('/forecasts', validateMetricsQuery, getRevenueForecasts);

/**
 * @route   GET /api/admin/revenue/comparison
 * @desc    Compare revenue across different periods
 * @access  Admin
 */
router.get('/comparison', validateMetricsQuery, getRevenueComparison);

/**
 * @route   GET /api/admin/revenue/top-generators
 * @desc    Get top revenue generating properties/agents/owners
 * @access  Admin
 */
router.get('/top-generators', validateMetricsQuery, getTopRevenueGenerators);

/**
 * @route   GET /api/admin/revenue/by-location
 * @desc    Get revenue breakdown by location
 * @access  Admin
 */
router.get('/by-location', validateMetricsQuery, getRevenueByLocation);

/**
 * @route   POST /api/admin/revenue/report
 * @desc    Generate custom revenue report
 * @access  Admin
 */
router.post('/report', validateReportParams, getRevenueReport);

/**
 * @route   GET /api/admin/revenue/export
 * @desc    Export revenue data (CSV/Excel)
 * @access  Admin
 */
router.get('/export', validateMetricsQuery, exportRevenueData);

export default router;