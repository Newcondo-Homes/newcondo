// backend/admin-service/src/routes/queueOversight.ts

import express from 'express';
import * as queueOversightController from '../controllers/queueOversightController';
import { adminAuth } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/adminValidation';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

/**
 * @route   GET /api/admin/queue-oversight/overview
 * @desc    Get overview of all marking job queues
 * @access  Admin only
 */
router.get(
  '/overview',
  [
    query('status')
      .optional()
      .isIn(['QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED'])
      .withMessage('Invalid status'),
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    query('priority')
      .optional()
      .isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
      .withMessage('Invalid priority'),
    validateRequest,
  ],
  queueOversightController.getQueueOverview
);

/**
 * @route   GET /api/admin/queue-oversight/job/:jobId
 * @desc    Get detailed information about a specific marking job queue
 * @access  Admin only
 */
router.get(
  '/job/:jobId',
  [
    param('jobId')
      .isString()
      .notEmpty()
      .withMessage('Job ID is required'),
    validateRequest,
  ],
  queueOversightController.getQueueDetails
);

/**
 * @route   GET /api/admin/queue-oversight/job/:jobId/agents
 * @desc    Get all agents in queue for a specific marking job
 * @access  Admin only
 */
router.get(
  '/job/:jobId/agents',
  [
    param('jobId')
      .isString()
      .notEmpty()
      .withMessage('Job ID is required'),
    query('includeHistory')
      .optional()
      .isBoolean()
      .withMessage('includeHistory must be boolean'),
    validateRequest,
  ],
  queueOversightController.getQueueAgents
);

/**
 * @route   POST /api/admin/queue-oversight/job/:jobId/reassign
 * @desc    Manually reassign a marking job to a different agent
 * @access  Admin only
 */
router.post(
  '/job/:jobId/reassign',
  [
    param('jobId')
      .isString()
      .notEmpty()
      .withMessage('Job ID is required'),
    body('newAgentId')
      .isString()
      .notEmpty()
      .withMessage('New agent ID is required'),
    body('reason')
      .isString()
      .notEmpty()
      .withMessage('Reason for reassignment is required'),
    validateRequest,
  ],
  queueOversightController.reassignMarkingJob
);

/**
 * @route   POST /api/admin/queue-oversight/job/:jobId/cancel
 * @desc    Cancel a marking job from admin panel
 * @access  Admin only
 */
router.post(
  '/job/:jobId/cancel',
  [
    param('jobId')
      .isString()
      .notEmpty()
      .withMessage('Job ID is required'),
    body('reason')
      .isString()
      .notEmpty()
      .withMessage('Reason for cancellation is required'),
    validateRequest,
  ],
  queueOversightController.cancelMarkingJob
);

/**
 * @route   POST /api/admin/queue-oversight/job/:jobId/extend-time
 * @desc    Extend time slot for an agent working on a marking job
 * @access  Admin only
 */
router.post(
  '/job/:jobId/extend-time',
  [
    param('jobId')
      .isString()
      .notEmpty()
      .withMessage('Job ID is required'),
    body('extensionHours')
      .isInt({ min: 1, max: 24 })
      .withMessage('Extension hours must be between 1 and 24'),
    body('reason')
      .isString()
      .notEmpty()
      .withMessage('Reason for extension is required'),
    validateRequest,
  ],
  queueOversightController.extendTimeSlot
);

/**
 * @route   POST /api/admin/queue-oversight/job/:jobId/force-complete
 * @desc    Force complete a marking job (admin override)
 * @access  Admin only
 */
router.post(
  '/job/:jobId/force-complete',
  [
    param('jobId')
      .isString()
      .notEmpty()
      .withMessage('Job ID is required'),
    body('reason')
      .isString()
      .notEmpty()
      .withMessage('Reason for force completion is required'),
    body('completionData')
      .optional()
      .isObject()
      .withMessage('Completion data must be an object'),
    validateRequest,
  ],
  queueOversightController.forceCompleteJob
);

/**
 * @route   GET /api/admin/queue-oversight/metrics
 * @desc    Get queue performance metrics
 * @access  Admin only
 */
router.get(
  '/metrics',
  [
    query('period')
      .optional()
      .isIn(['day', 'week', 'month', 'year'])
      .withMessage('Invalid period'),
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    validateRequest,
  ],
  queueOversightController.getQueueMetrics
);

/**
 * @route   GET /api/admin/queue-oversight/agent/:agentId/performance
 * @desc    Get agent performance in queue system
 * @access  Admin only
 */
router.get(
  '/agent/:agentId/performance',
  [
    param('agentId')
      .isString()
      .notEmpty()
      .withMessage('Agent ID is required'),
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    validateRequest,
  ],
  queueOversightController.getAgentQueuePerformance
);

/**
 * @route   GET /api/admin/queue-oversight/bottlenecks
 * @desc    Get queue bottlenecks and issues
 * @access  Admin only
 */
router.get(
  '/bottlenecks',
  queueOversightController.getQueueBottlenecks
);

/**
 * @route   GET /api/admin/queue-oversight/waiting-times
 * @desc    Get queue waiting times analysis
 * @access  Admin only
 */
router.get(
  '/waiting-times',
  [
    query('period')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('Invalid period'),
    validateRequest,
  ],
  queueOversightController.getWaitingTimesAnalysis
);

/**
 * @route   GET /api/admin/queue-oversight/expired-slots
 * @desc    Get expired time slots that need attention
 * @access  Admin only
 */
router.get(
  '/expired-slots',
  queueOversightController.getExpiredTimeSlots
);

/**
 * @route   GET /api/admin/queue-oversight/health
 * @desc    Get queue health status
 * @access  Admin only
 */
router.get(
  '/health',
  queueOversightController.getQueueHealthStatus
);

export default router;