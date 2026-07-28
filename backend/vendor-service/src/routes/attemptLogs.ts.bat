import { Router } from 'express';
import { authenticateToken } from '../../../shared/src/middleware/auth';
import { validateRequest } from '../../../shared/src/middleware/validation';
import { attemptLogController } from '../controllers/attemptLogController';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createLogSchema = z.object({
  body: z.object({
    propertyId: z.string().cuid(),
    unitId: z.string().cuid().optional(),
    amount: z.number().positive(),
    status: z.enum(['LOCKED', 'SUCCESS', 'FAILED', 'TIMEOUT']),
    failureReason: z.string().optional(),
    lockAcquired: z.boolean(),
    lockDuration: z.number().int().positive().optional(),
  }),
});

const getUserLogsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    status: z.enum(['LOCKED', 'SUCCESS', 'FAILED', 'TIMEOUT']).optional(),
    propertyId: z.string().cuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

const getPropertyLogsSchema = z.object({
  params: z.object({
    propertyId: z.string().cuid(),
  }),
  query: z.object({
    unitId: z.string().cuid().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    status: z.enum(['LOCKED', 'SUCCESS', 'FAILED', 'TIMEOUT']).optional(),
  }),
});

const logIdSchema = z.object({
  params: z.object({
    logId: z.string().cuid(),
  }),
});

const analyticsSchema = z.object({
  query: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    propertyId: z.string().cuid().optional(),
    groupBy: z.enum(['day', 'week', 'month']).default('day'),
  }),
});

/**
 * @route   POST /api/payments/attempt-logs
 * @desc    Create payment attempt log
 * @access  Private (System)
 */
router.post(
  '/',
  authenticateToken,
  validateRequest(createLogSchema),
  attemptLogController.createLog
);

/**
 * @route   GET /api/payments/attempt-logs/my-attempts
 * @desc    Get current user's payment attempts
 * @access  Private
 */
router.get(
  '/my-attempts',
  authenticateToken,
  validateRequest(getUserLogsSchema),
  attemptLogController.getUserLogs
);

/**
 * @route   GET /api/payments/attempt-logs/:logId
 * @desc    Get specific attempt log details
 * @access  Private (Log owner or admin)
 */
router.get(
  '/:logId',
  authenticateToken,
  validateRequest(logIdSchema),
  attemptLogController.getLogById
);

/**
 * @route   GET /api/payments/attempt-logs/property/:propertyId
 * @desc    Get all payment attempts for a property
 * @access  Private (Property owner, agent, or admin)
 */
router.get(
  '/property/:propertyId',
  authenticateToken,
  validateRequest(getPropertyLogsSchema),
  attemptLogController.getPropertyLogs
);

/**
 * @route   GET /api/payments/attempt-logs/analytics/success-rate
 * @desc    Get payment success rate analytics
 * @access  Private (Admin)
 */
router.get(
  '/analytics/success-rate',
  authenticateToken,
  validateRequest(analyticsSchema),
  attemptLogController.getSuccessRateAnalytics
);

/**
 * @route   GET /api/payments/attempt-logs/analytics/lock-contention
 * @desc    Get lock contention analytics
 * @access  Private (Admin)
 */
router.get(
  '/analytics/lock-contention',
  authenticateToken,
  validateRequest(analyticsSchema),
  attemptLogController.getLockContentionAnalytics
);

/**
 * @route   GET /api/payments/attempt-logs/analytics/failure-reasons
 * @desc    Get top payment failure reasons
 * @access  Private (Admin)
 */
router.get(
  '/analytics/failure-reasons',
  authenticateToken,
  validateRequest(analyticsSchema),
  attemptLogController.getFailureReasons
);

/**
 * @route   GET /api/payments/attempt-logs/analytics/high-demand
 * @desc    Get high-demand properties based on attempt frequency
 * @access  Private (Admin)
 */
router.get(
  '/analytics/high-demand',
  authenticateToken,
  validateRequest(analyticsSchema),
  attemptLogController.getHighDemandProperties
);

/**
 * @route   POST /api/payments/attempt-logs/cleanup
 * @desc    Cleanup old attempt logs (older than 90 days)
 * @access  Private (Admin/Cron)
 */
router.post(
  '/cleanup',
  authenticateToken,
  attemptLogController.cleanupOldLogs
);

/**
 * @route   GET /api/payments/attempt-logs/export
 * @desc    Export attempt logs to CSV
 * @access  Private (Admin)
 */
router.get(
  '/export',
  authenticateToken,
  validateRequest(analyticsSchema),
  attemptLogController.exportLogs
);

export default router;