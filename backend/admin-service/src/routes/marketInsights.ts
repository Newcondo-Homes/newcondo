// backend/admin-service/src/routes/marketInsights.ts
import { Router } from 'express';
import {
  getMarketOverview,
  getPricingTrends,
  getDemandAnalysis,
  getSupplyAnalysis,
  getLocationInsights,
  getPropertyTypeAnalysis,
  getSeasonalTrends,
  getCompetitiveAnalysis,
  getMarketForecast,
  getHotspots,
  getVacancyRates,
  getRentalYield,
  getMarketGrowthRate,
  getAffordabilityIndex
} from '../controllers/marketInsightsController';
import { authenticateAdmin } from '../middleware/adminAnalyticsAuth';
import { validateMetricsQuery } from '../middleware/analyticsValidation';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/market/overview
 * @desc    Get comprehensive market overview
 * @access  Admin
 */
router.get('/overview', validateMetricsQuery, getMarketOverview);

/**
 * @route   GET /api/admin/market/pricing-trends
 * @desc    Get pricing trends across different property types
 * @access  Admin
 */
router.get('/pricing-trends', validateMetricsQuery, getPricingTrends);

/**
 * @route   GET /api/admin/market/demand
 * @desc    Get demand analysis (searches, views, bookings)
 * @access  Admin
 */
router.get('/demand', validateMetricsQuery, getDemandAnalysis);

/**
 * @route   GET /api/admin/market/supply
 * @desc    Get supply analysis (available properties)
 * @access  Admin
 */
router.get('/supply', validateMetricsQuery, getSupplyAnalysis);

/**
 * @route   GET /api/admin/market/location-insights
 * @desc    Get insights by location (state, city, LGA)
 * @access  Admin
 */
router.get('/location-insights', validateMetricsQuery, getLocationInsights);

/**
 * @route   GET /api/admin/market/property-types
 * @desc    Get property type popularity and performance
 * @access  Admin
 */
router.get('/property-types', validateMetricsQuery, getPropertyTypeAnalysis);

/**
 * @route   GET /api/admin/market/seasonal-trends
 * @desc    Get seasonal market trends
 * @access  Admin
 */
router.get('/seasonal-trends', validateMetricsQuery, getSeasonalTrends);

/**
 * @route   GET /api/admin/market/competitive-analysis
 * @desc    Get competitive market analysis
 * @access  Admin
 */
router.get('/competitive-analysis', validateMetricsQuery, getCompetitiveAnalysis);

/**
 * @route   GET /api/admin/market/forecast
 * @desc    Get market forecasts
 * @access  Admin
 */
router.get('/forecast', validateMetricsQuery, getMarketForecast);

/**
 * @route   GET /api/admin/market/hotspots
 * @desc    Get market hotspots (trending locations)
 * @access  Admin
 */
router.get('/hotspots', validateMetricsQuery, getHotspots);

/**
 * @route   GET /api/admin/market/vacancy-rates
 * @desc    Get vacancy rates by location
 * @access  Admin
 */
router.get('/vacancy-rates', validateMetricsQuery, getVacancyRates);

/**
 * @route   GET /api/admin/market/rental-yield
 * @desc    Get rental yield analysis
 * @access  Admin
 */
router.get('/rental-yield', validateMetricsQuery, getRentalYield);

/**
 * @route   GET /api/admin/market/growth-rate
 * @desc    Get market growth rate
 * @access  Admin
 */
router.get('/growth-rate', validateMetricsQuery, getMarketGrowthRate);

/**
 * @route   GET /api/admin/market/affordability
 * @desc    Get affordability index
 * @access  Admin
 */
router.get('/affordability', validateMetricsQuery, getAffordabilityIndex);

export default router;