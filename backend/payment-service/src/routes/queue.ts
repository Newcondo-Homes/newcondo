import { Router } from 'express';
import { authenticateToken } from '../../../shared/src/middleware/auth';
import { validateRequest } from '../../../shared/src/middleware/validation';
import { queueController } from '../controllers/queueController';
import { z } from 'zod';

const router = Router();

// Validation schemas
const joinQueueSchema = z.object({
  body: z.object({
    propertyId: z.string().cuid(),
    unitId: z.string().cuid().optional(),
    amount: z.number().positive(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
  }),
});

const queuePositionSchema = z.object({
  params: z.object({
    queueId: z.string().cuid(),
  }),
});

const propertyQueueSchema = z.object({
  params: z.object({
    propertyId: z.string().cuid(),
  }),
  query: z.object({
    unitId: z.string().cuid().optional(),
  }),
});

const updatePositionSchema = z.object({
  params: z.object({
    queueId: z.string().cuid(),
  }),
  body: z.object({
    position: z.number().int().positive(),
  }),
});

/**
 * @route   POST /api/payments/queue/join
 * @desc    Join payment queue for a property/unit
 * @access  Private
 */
router.post(
  '/join',
  authenticateToken,
  validateRequest(joinQueueSchema),
  queueController.joinQueue
);

/**
 * @route   GET /api/payments/queue/my-position
 * @desc    Get user's position in all queues
 * @access  Private
 */
router.get(
  '/my-position',
  authenticateToken,
  queueController.getUserQueuePosition
);

/**
 * @route   GET /api/payments/queue/:queueId/position
 * @desc    Get specific queue position details
 * @access  Private
 */
router.get(
  '/:queueId/position',
  authenticateToken,
  validateRequest(queuePositionSchema),
  queueController.getQueuePosition
);

/**
 * @route   GET /api/payments/queue/property/:propertyId
 * @desc    Get queue for specific property/unit
 * @access  Private
 */
router.get(
  '/property/:propertyId',
  authenticateToken,
  validateRequest(propertyQueueSchema),
  queueController.getPropertyQueue
);

/**
 * @route   POST /api/payments/queue/:queueId/leave
 * @desc    Leave payment queue
 * @access  Private (Queue member)
 */
router.post(
  '/:queueId/leave',
  authenticateToken,
  validateRequest(queuePositionSchema),
  queueController.leaveQueue
);

/**
 * @route   POST /api/payments/queue/:queueId/process-next
 * @desc    Process next person in queue (Auto-triggered after lock release)
 * @access  Private (System/Admin)
 */
router.post(
  '/:queueId/process-next',
  authenticateToken,
  validateRequest(queuePositionSchema),
  queueController.processNextInQueue
);

/**
 * @route   PUT /api/payments/queue/:queueId/priority
 * @desc    Update queue position priority (Admin only)
 * @access  Private (Admin)
 */
router.put(
  '/:queueId/priority',
  authenticateToken,
  validateRequest(updatePositionSchema),
  queueController.updateQueuePriority
);

/**
 * @route   GET /api/payments/queue/stats
 * @desc    Get queue statistics (Admin)
 * @access  Private (Admin)
 */
router.get(
  '/stats',
  authenticateToken,
  queueController.getQueueStats
);

/**
 * @route   POST /api/payments/queue/cleanup-stale
 * @desc    Remove stale queue entries (Cron job)
 * @access  Private (Admin/System)
 */
router.post(
  '/cleanup-stale',
  authenticateToken,
  queueController.cleanupStaleQueue
);

/**
 * @route   GET /api/payments/queue/property/:propertyId/waiting-time
 * @desc    Estimate waiting time for property queue
 * @access  Public
 */
router.get(
  '/property/:propertyId/waiting-time',
  validateRequest(propertyQueueSchema),
  queueController.estimateWaitingTime
);

export default router;