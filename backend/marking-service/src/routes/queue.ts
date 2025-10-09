import express from 'express';
import { auth, requireRole } from '@newcondo/auth/middleware';
import { queueController } from '../controllers/queueController';
import { queueValidation } from '../middleware/queueValidation';
import { validateRequest } from '../../../shared/src/middleware/validation';

const router = express.Router();

// Agent queue management
router.get(
  '/available-jobs',
  auth,
  requireRole(['AGENT']),
  queueController.getAvailableJobs
);

router.get(
  '/my-queue',
  auth,
  requireRole(['AGENT']),
  queueController.getAgentQueue
);

router.patch(
  '/availability',
  auth,
  requireRole(['AGENT']),
  queueValidation.updateAvailability,
  validateRequest,
  queueController.updateAgentAvailability
);

router.patch(
  '/service-areas',
  auth,
  requireRole(['AGENT']),
  queueValidation.updateServiceAreas,
  validateRequest,
  queueController.updateServiceAreas
);

// Job queue statistics
router.get(
  '/stats',
  auth,
  requireRole(['AGENT']),
  queueController.getQueueStats
);

router.get(
  '/position/:jobId',
  auth,
  queueController.getJobQueuePosition
);

// Admin queue management
router.get(
  '/admin/overview',
  auth,
  requireRole(['ADMIN']),
  queueController.getQueueOverview
);

router.patch(
  '/admin/prioritize/:jobId',
  auth,
  requireRole(['ADMIN']),
  queueValidation.prioritizeJob,
  validateRequest,
  queueController.prioritizeJob
);

router.get(
  '/admin/agents',
  auth,
  requireRole(['ADMIN']),
  queueController.getActiveAgents
);

router.patch(
  '/admin/reassign/:jobId',
  auth,
  requireRole(['ADMIN']),
  queueValidation.reassignJob,
  validateRequest,
  queueController.reassignJob
);

// Queue health monitoring
router.get(
  '/health',
  auth,
  requireRole(['ADMIN']),
  queueController.getQueueHealth
);

router.post(
  '/process',
  auth,
  requireRole(['ADMIN']),
  queueController.processQueue
);

export default router;




// import { Router } from 'express';
// import {
//   joinQueue,
//   leaveQueue,
//   getQueueStatus,
//   getQueuePosition,
//   processNextInQueue,
//   clearExpiredQueueEntries,
// } from '../controllers/queueController';
// import { auth } from '../../../shared/src/middleware/auth';
// import { validateQueueJoin } from '../middleware/queueValidation';
// import { checkRolePermission } from '../middleware/rolePermission';

// const router = Router();

// /**
//  * @route   POST /api/marking-jobs/:jobId/queue/join
//  * @desc    Join the marking job queue
//  * @access  Private (Agent/Premium Renter)
//  */
// router.post(
//   '/:jobId/join',
//   auth,
//   checkRolePermission(['AGENT', 'RENTER']),
//   validateQueueJoin,
//   joinQueue
// );

// /**
//  * @route   DELETE /api/marking-jobs/:jobId/queue/leave
//  * @desc    Leave the marking job queue
//  * @access  Private (Agent/Premium Renter)
//  */
// router.delete(
//   '/:jobId/leave',
//   auth,
//   checkRolePermission(['AGENT', 'RENTER']),
//   leaveQueue
// );

// /**
//  * @route   GET /api/marking-jobs/:jobId/queue/status
//  * @desc    Get queue status for a marking job
//  * @access  Private (Job owner or queued agent)
//  */
// router.get(
//   '/:jobId/status',
//   auth,
//   getQueueStatus
// );

// /**
//  * @route   GET /api/marking-jobs/:jobId/queue/position
//  * @desc    Get user's position in queue
//  * @access  Private (Agent/Premium Renter in queue)
//  */
// router.get(
//   '/:jobId/position',
//   auth,
//   checkRolePermission(['AGENT', 'RENTER']),
//   getQueuePosition
// );

// /**
//  * @route   POST /api/marking-jobs/:jobId/queue/process-next
//  * @desc    Process next agent in queue (system/admin use)
//  * @access  Private (System/Admin)
//  */
// router.post(
//   '/:jobId/process-next',
//   auth,
//   checkRolePermission(['ADMIN']),
//   processNextInQueue
// );

// /**
//  * @route   DELETE /api/marking-jobs/queue/cleanup
//  * @desc    Clear expired queue entries
//  * @access  Private (System/Admin)
//  */
// router.delete(
//   '/cleanup',
//   auth,
//   checkRolePermission(['ADMIN']),
//   clearExpiredQueueEntries
// );

// export default router;