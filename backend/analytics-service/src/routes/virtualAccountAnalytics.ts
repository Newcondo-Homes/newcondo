// File: backend/analytics-service/src/routes/virtualAccountAnalytics.ts

import { Router } from 'express';
import { VirtualAccountAnalyticsController } from '../controllers/virtualAccountAnalyticsController';
import { auth } from '../../../shared/src/middleware/auth';
import { validateRequest } from '../../../shared/src/middleware/validation';
import { body, query, param } from 'express-validator';

const router = Router();
const controller = new VirtualAccountAnalyticsController();

// Validation schemas
const periodValidation = query('period')
  .optional()
  .isIn(['7d', '30d', '90d', '180d', '365d', '1y', '2y'])
  .withMessage('Period must be one of: 7d, 30d, 90d, 180d, 365d, 1y, 2y');

const timezoneValidation = query('timezone')
  .optional()
  .isString()
  .withMessage('Timezone must be a valid string');

const groupByValidation = query('groupBy')
  .optional()
  .isIn(['day', 'week', 'month'])
  .withMessage('GroupBy must be one of: day, week, month');

const dateValidation = [
  query('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

// Routes

/**
 * @route GET /api/analytics/virtual-accounts/overview
 * @desc Get virtual account overview metrics
 * @access Private (Admin only)
 */
router.get(
  '/overview',
  auth(['ADMIN']),
  [periodValidation, timezoneValidation],
  validateRequest,
  controller.getVirtualAccountOverview
);

/**
 * @route GET /api/analytics/virtual-accounts/balance
 * @desc Get balance analytics across all virtual accounts
 * @access Private (Admin only)
 */
router.get(
  '/balance',
  auth(['ADMIN']),
  [periodValidation, timezoneValidation, groupByValidation],
  validateRequest,
  controller.getBalanceAnalytics
);

/**
 * @route GET /api/analytics/virtual-accounts/transactions
 * @desc Get transaction analytics for virtual accounts
 * @access Private (Admin only)
 */
router.get(
  '/transactions',
  auth(['ADMIN']),
  [periodValidation, timezoneValidation, groupByValidation],
  validateRequest,
  controller.getTransactionAnalytics
);

/**
 * @route GET /api/analytics/virtual-accounts/performance
 * @desc Get virtual account performance metrics
 * @access Private (Admin only)
 */
router.get(
  '/performance',
  auth(['ADMIN']),
  [periodValidation, timezoneValidation],
  validateRequest,
  controller.getPerformanceMetrics
);

/**
 * @route GET /api/analytics/virtual-accounts/top-accounts
 * @desc Get top performing virtual accounts
 * @access Private (Admin only)
 */
router.get(
  '/top-accounts',
  auth(['ADMIN']),
  [
    periodValidation,
    timezoneValidation,
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isIn(['totalTransactions', 'totalAmount', 'averageTransaction'])
      .withMessage('SortBy must be one of: totalTransactions, totalAmount, averageTransaction')
  ],
  validateRequest,
  controller.getTopPerformingAccounts
);

/**
 * @route GET /api/analytics/virtual-accounts/user-type-distribution
 * @desc Get virtual account distribution by user type
 * @access Private (Admin only)
 */
router.get(
  '/user-type-distribution',
  auth(['ADMIN']),
  [periodValidation, timezoneValidation],
  validateRequest,
  controller.getUserTypeDistribution
);

/**
 * @route GET /api/analytics/virtual-accounts/activity-trends
 * @desc Get virtual account activity trends
 * @access Private (Admin only)
 */
router.get(
  '/activity-trends',
  auth(['ADMIN']),
  [periodValidation, timezoneValidation, groupByValidation],
  validateRequest,
  controller.getActivityTrends
);

/**
 * @route GET /api/analytics/virtual-accounts/reconciliation
 * @desc Get virtual account reconciliation report
 * @access Private (Admin only)
 */
router.get(
  '/reconciliation',
  auth(['ADMIN']),
  [
    ...dateValidation,
    timezoneValidation
  ],
  validateRequest,
  controller.getReconciliationReport
);

/**
 * @route GET /api/analytics/virtual-accounts/health
 * @desc Get virtual account health metrics
 * @access Private (Admin only)
 */
router.get(
  '/health',
  auth(['ADMIN']),
  [timezoneValidation],
  validateRequest,
  controller.getHealthMetrics
);

/**
 * @route GET /api/analytics/virtual-accounts/growth
 * @desc Get virtual account growth metrics
 * @access Private (Admin only)
 */
router.get(
  '/growth',
  auth(['ADMIN']),
  [
    periodValidation,
    timezoneValidation,
    query('comparePeriod')
      .optional()
      .isBoolean()
      .withMessage('ComparePeriod must be a boolean value')
  ],
  validateRequest,
  controller.getGrowthMetrics
);

/**
 * @route GET /api/analytics/virtual-accounts/export
 * @desc Export virtual account analytics data
 * @access Private (Admin only)
 */
router.get(
  '/export',
  auth(['ADMIN']),
  [
    query('format')
      .optional()
      .isIn(['csv', 'excel'])
      .withMessage('Format must be either csv or excel'),
    periodValidation,
    timezoneValidation,
    query('includeTransactions')
      .optional()
      .isBoolean()
      .withMessage('IncludeTransactions must be a boolean value')
  ],
  validateRequest,
  controller.exportAnalyticsData
);

/**
 * @route GET /api/analytics/virtual-accounts/:accountId
 * @desc Get analytics for a specific virtual account
 * @access Private (Admin only)
 */
router.get(
  '/:accountId',
  auth(['ADMIN']),
  [
    param('accountId')
      .isString()
      .notEmpty()
      .withMessage('Account ID is required'),
    periodValidation,
    timezoneValidation
  ],
  validateRequest,
  controller.getAccountAnalytics
);

/**
 * @route GET /api/analytics/virtual-accounts/alerts
 * @desc Get virtual account alerts and anomalies
 * @access Private (Admin only)
 */
router.get(
  '/alerts',
  auth(['ADMIN']),
  [
    periodValidation,
    timezoneValidation,
    query('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical', 'all'])
      .withMessage('Severity must be one of: low, medium, high, critical, all')
  ],
  validateRequest,
  controller.getAlertsAndAnomalies
);

export default router;