// backend/analytics-service/src/routes/referralAnalytics.ts

import { Router } from 'express';
import { referralAnalyticsController } from '../controllers/referralAnalyticsController';
import { adminAuth } from '../../../shared/src/middleware/auth'; // Adjust path as needed

const router = Router();

/**
 * All referral analytics routes require admin authentication
 */
router.use(adminAuth);

/**
 * @route   GET /api/analytics/referrals/overview
 * @desc    Get referral program overview
 * @access  Admin
 * @query   startDate, endDate (optional)
 */
router.get('/overview', referralAnalyticsController.getOverview.bind(referralAnalyticsController));

/**
 * @route   GET /api/analytics/referrals/conversion-funnel
 * @desc    Get referral conversion funnel
 * @access  Admin
 * @query   startDate, endDate, referralType (optional)
 */
router.get('/conversion-funnel', referralAnalyticsController.getConversionFunnel.bind(referralAnalyticsController));

/**
 * @route   GET /api/analytics/referrals/top-referrers
 * @desc    Get top referrers by various metrics
 * @access  Admin
 * @query   metric (conversions|revenue|referrals), limit, period
 */
router.get('/top-referrers', referralAnalyticsController.getTopReferrers.bind(referralAnalyticsController));

/**
 * @route   GET /api/analytics/referrals/type-breakdown
 * @desc    Get referral type breakdown
 * @access  Admin
 * @query   startDate, endDate (optional)
 */
router.get('/type-breakdown', referralAnalyticsController.getReferralTypeBreakdown.bind(referralAnalyticsController));

/**
 * @route   GET /api/analytics/referrals/reward-distribution
 * @desc    Get reward distribution analytics
 * @access  Admin
 * @query   startDate, endDate, rewardType (optional)
 */
router.get('/reward-distribution', referralAnalyticsController.getRewardDistribution.bind(referralAnalyticsController));

/**
 * @route   GET /api/analytics/referrals/timeline
 * @desc    Get referral timeline trends
 * @access  Admin
 * @query   startDate, endDate, granularity (daily|weekly|monthly)
 */
router.get('/timeline', referralAnalyticsController.getReferralTimeline.bind(referralAnalyticsController));

/**
 * @route   GET /api/analytics/referrals/performance-by-role
 * @desc    Get referral performance by user role
 * @access  Admin
 * @query   startDate, endDate (optional)
 */
router.get('/performance-by-role', referralAnalyticsController.getPerformanceByRole.bind(referralAnalyticsController));

/**
 * @route   GET /api/analytics/referrals/roi
 * @desc    Get ROI analysis for referral program
 * @access  Admin
 * @query   startDate, endDate (optional)
 */
router.get('/roi', referralAnalyticsController.getROIAnalysis.bind(referralAnalyticsController));

/**
 * @route   GET /api/analytics/referrals/viral-coefficient
 * @desc    Get viral coefficient (K-factor) metrics
 * @access  Admin
 * @query   startDate, endDate (optional)
 */
router.get('/viral-coefficient', referralAnalyticsController.getViralCoefficient.bind(referralAnalyticsController));

/**
 * @route   GET /api/analytics/referrals/export
 * @desc    Export referral analytics report
 * @access  Admin
 * @query   startDate, endDate, format (csv|pdf|json)
 */
router.get('/export', referralAnalyticsController.exportReport.bind(referralAnalyticsController));

export default router;