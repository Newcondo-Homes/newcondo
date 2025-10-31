import { Router } from 'express';
import { queueManagementController } from '../controllers/queueManagementController';
import { authenticateAdmin } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/adminValidation';
import {
  queueListSchema,
  agentQueueSchema,
  queueActionSchema,
} from '../validations/queueManagementSchemas';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * GET /api/admin/queue-management
 * Get overview of all marking job queues
 */
router.get(
  '/',
  validateRequest(queueListSchema, 'query'),
  queueManagementController.getQueueOverview
);

/**
 * GET /api/admin/queue-management/active
 * Get all active queues
 */
router.get('/active', queueManagementController.getActiveQueues);

/**
 * GET /api/admin/queue-management/:jobId
 * Get queue details for a specific marking job
 */
router.get('/:jobId', queueManagementController.getJobQueueDetails);

/**
 * GET /api/admin/queue-management/:jobId/agents
 * Get agents in queue for a specific job
 */
router.get(
  '/:jobId/agents',
  validateRequest(agentQueueSchema, 'query'),
  queueManagementController.getAgentsInQueue
);

/**
 * POST /api/admin/queue-management/:jobId/clear
 * Clear queue for a marking job
 */
router.post('/:jobId/clear', queueManagementController.clearQueue);

/**
 * POST /api/admin/queue-management/:jobId/rotate
 * Manually rotate to next agent in queue
 */
router.post(
  '/:jobId/rotate',
  validateRequest(queueActionSchema, 'body'),
  queueManagementController.rotateQueue
);

/**
 * DELETE /api/admin/queue-management/:jobId/agents/:agentId
 * Remove specific agent from queue
 */
router.delete('/:jobId/agents/:agentId', queueManagementController.removeAgentFromQueue);

/**
 * POST /api/admin/queue-management/:jobId/agents/:agentId/priority
 * Move agent to front of queue (priority)
 */
router.post('/:jobId/agents/:agentId/priority', queueManagementController.prioritizeAgent);

/**
 * GET /api/admin/queue-management/stats
 * Get queue statistics
 */
router.get('/stats', queueManagementController.getQueueStats);

/**
 * GET /api/admin/queue-management/expired-slots
 * Get expired time slots needing rotation
 */
router.get('/expired-slots', queueManagementController.getExpiredSlots);

/**
 * POST /api/admin/queue-management/process-expired
 * Process all expired time slots
 */
router.post('/process-expired', queueManagementController.processExpiredSlots);

/**
 * GET /api/admin/queue-management/:jobId/history
 * Get queue rotation history for a job
 */
router.get('/:jobId/history', queueManagementController.getQueueHistory);

/**
 * POST /api/admin/queue-management/:jobId/extend-slot
 * Extend time slot for current agent
 */
router.post('/:jobId/extend-slot', queueManagementController.extendTimeSlot);

/**
 * GET /api/admin/queue-management/agent/:agentId
 * Get agent's current queue positions
 */
router.get('/agent/:agentId', queueManagementController.getAgentQueues);

export default router;