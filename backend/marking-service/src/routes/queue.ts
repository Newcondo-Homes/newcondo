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




// // backend/marking-service/src/routes/queue.ts
// import { Router } from "express";
// import { authenticate } from "../../../shared/src/middleware/auth";
// import {
//   getQueueStatus,
//   getAgentQueue,
//   getPropertyQueue,
//   updateQueuePosition,
//   removeFromQueue,
//   getQueueAnalytics,
// } from "../controllers/queueController";

// const router = Router();

// /**
//  * @route GET /api/marking-jobs/queue/:jobId
//  * @desc Get queue status for a specific marking job
//  * @access Private
//  * @params jobId: string
//  */
// router.get("/:jobId", authenticate, getQueueStatus);

// /**
//  * @route GET /api/marking-jobs/queue/agent/:agentId
//  * @desc Get queue positions for a specific agent
//  * @access Private (Agent or admin)
//  * @params agentId: string
//  * @query {
//  *   limit?: number,
//  *   offset?: number,
//  *   status?: string
//  * }
//  */
// router.get("/agent/:agentId", authenticate, getAgentQueue);

// /**
//  * @route GET /api/marking-jobs/queue/property/:propertyId
//  * @desc Get all queue entries for a specific property marking job
//  * @access Private (Property owner or admin)
//  * @params propertyId: string
//  */
// router.get("/property/:propertyId", authenticate, getPropertyQueue);

// /**
//  * @route PUT /api/marking-jobs/queue/position/:jobId
//  * @desc Update queue position (manual admin reassignment)
//  * @access Private (Admin only)
//  * @params jobId: string
//  * @body {
//  *   newPosition: number
//  * }
//  */
// router.put("/position/:jobId", authenticate, updateQueuePosition);

// /**
//  * @route DELETE /api/marking-jobs/queue/:jobId
//  * @desc Remove agent from queue for a marking job
//  * @access Private (Agent or admin)
//  * @params jobId: string
//  * @query {
//  *   agentId?: string (optional, defaults to current user)
//  * }
//  */
// router.delete("/:jobId", authenticate, removeFromQueue);

// /**
//  * @route GET /api/marking-jobs/queue/analytics
//  * @desc Get queue analytics for admin dashboard
//  * @access Private (Admin only)
//  * @query {
//  *   timeframe?: "24hours" | "7days" | "30days",
//  *   serviceArea?: string
//  * }
//  */
// router.get("/analytics", authenticate, getQueueAnalytics);

// export default router;





// // backend/marking-service/src/routes/queue.ts
// import { Router } from 'express';
// import {
//   getJobQueue,
//   addAgentToQueue,
//   removeAgentFromQueue,
//   getAgentQueuePosition,
//   getQueueStats,
//   processNextInQueue,
//   clearExpiredQueueEntries,
//   getAgentQueueHistory
// } from '../controllers/queueController';
// import { authenticate, authorize } from '../middleware/auth';
// import { validateQueueEntry } from '../middleware/queueValidation';

// const router = Router();

// /**
//  * @route   GET /api/marking/queue/:jobId
//  * @desc    Get queue for a specific marking job
//  * @access  Private (Job owner or ADMIN)
//  */
// router.get(
//   '/:jobId',
//   authenticate,
//   getJobQueue
// );

// /**
//  * @route   POST /api/marking/queue/:jobId/join
//  * @desc    Join queue for a marking job (FCFS)
//  * @access  Private (AGENT or RENTER with premium)
//  */
// router.post(
//   '/:jobId/join',
//   authenticate,
//   authorize(['AGENT', 'RENTER']),
//   validateQueueEntry,
//   addAgentToQueue
// );

// /**
//  * @route   DELETE /api/marking/queue/:jobId/leave
//  * @desc    Leave queue for a marking job
//  * @access  Private (AGENT or RENTER)
//  */
// router.delete(
//   '/:jobId/leave',
//   authenticate,
//   removeAgentFromQueue
// );

// /**
//  * @route   GET /api/marking/queue/:jobId/position
//  * @desc    Get agent's position in queue
//  * @access  Private
//  */
// router.get(
//   '/:jobId/position',
//   authenticate,
//   getAgentQueuePosition
// );

// /**
//  * @route   GET /api/marking/queue/stats/overview
//  * @desc    Get queue statistics
//  * @access  Private (ADMIN only)
//  */
// router.get(
//   '/stats/overview',
//   authenticate,
//   authorize(['ADMIN']),
//   getQueueStats
// );

// /**
//  * @route   POST /api/marking/queue/:jobId/process-next
//  * @desc    Process next agent in queue (after time expiry)
//  * @access  Private (System/ADMIN only)
//  */
// router.post(
//   '/:jobId/process-next',
//   authenticate,
//   authorize(['ADMIN']),
//   processNextInQueue
// );

// /**
//  * @route   DELETE /api/marking/queue/expired/clear
//  * @desc    Clear expired queue entries
//  * @access  Private (System/ADMIN only)
//  */
// router.delete(
//   '/expired/clear',
//   authenticate,
//   authorize(['ADMIN']),
//   clearExpiredQueueEntries
// );

// /**
//  * @route   GET /api/marking/queue/agent/history
//  * @desc    Get agent's queue participation history
//  * @access  Private
//  */
// router.get(
//   '/agent/history',
//   authenticate,
//   getAgentQueueHistory
// );

// export default router;