// backend/admin-service/src/routes/markingOversight.ts

import { Router, Request, Response } from 'express';
import { markingOversightController } from '../controllers/markingOversightController';
import { adminAuth } from '../middleware/adminAuth';
import { oversightValidation } from '../middleware/oversightValidation';

/**
 * Routes for marking job oversight and quality assurance
 * All routes require admin authentication
 */

const router = Router();

// Apply admin auth middleware to all routes
router.use(adminAuth);

/**
 * GET /api/admin/marking-oversight
 * Get marking jobs overview dashboard
 */
router.get('/', markingOversightController.getMarkingOverview);

/**
 * GET /api/admin/marking-oversight/jobs
 * Get list of marking jobs with filters and pagination
 * Query params: status, page, limit, sortBy
 */
router.get('/jobs', markingOversightController.getMarkingJobs);

/**
 * GET /api/admin/marking-oversight/jobs/:jobId
 * Get detailed information about a specific marking job
 */
router.get('/jobs/:jobId', markingOversightController.getMarkingJobDetail);

/**
 * GET /api/admin/marking-oversight/agents/:agentId/performance
 * Get agent performance metrics and reliability scores
 * Query params: timeRange (default: 30days)
 */
router.get(
  '/agents/:agentId/performance',
  markingOversightController.getAgentPerformance
);

/**
 * GET /api/admin/marking-oversight/flagged-jobs
 * Get incomplete or suspicious marking jobs for review
 * Query params: reason, page, limit
 */
router.get('/flagged-jobs', markingOversightController.getFlaggedJobs);

/**
 * POST /api/admin/marking-oversight/jobs/:jobId/approve
 * Review and approve a completed marking job
 * Body: { notes?: string }
 */
router.post(
  '/jobs/:jobId/approve',
  oversightValidation.validateApprovalRequest,
  markingOversightController.approveMarkingJob
);

/**
 * POST /api/admin/marking-oversight/jobs/:jobId/reject
 * Reject a marking job and request re-marking
 * Body: { reason: string, notes?: string }
 */
router.post(
  '/jobs/:jobId/reject',
  oversightValidation.validateRejectionRequest,
  markingOversightController.rejectMarkingJob
);

/**
 * GET /api/admin/marking-oversight/quality-assurance
 * Get quality assurance report for marking jobs
 * Query params: timeRange (default: 30days), agentId (optional)
 */
router.get('/quality-assurance', markingOversightController.getQualityAssuranceReport);

/**
 * GET /api/admin/marking-oversight/analytics
 * Get marking job analytics and trends
 * Query params: timeRange (default: 30days), metric (optional)
 */
router.get('/analytics', markingOversightController.getMarkingAnalytics);

/**
 * POST /api/admin/marking-oversight/jobs/:jobId/assign
 * Manually assign a marking job to an agent (admin override)
 * Body: { agentId: string, reason?: string }
 */
router.post(
  '/jobs/:jobId/assign',
  oversightValidation.validateManualAssignment,
  markingOversightController.manuallyAssignJob
);

/**
 * POST /api/admin/marking-oversight/jobs/:jobId/cancel
 * Cancel a marking job and optionally refund the property owner
 * Body: { reason: string, notes?: string, refund?: boolean }
 */
router.post(
  '/jobs/:jobId/cancel',
  oversightValidation.validateCancellation,
  markingOversightController.cancelMarkingJob
);

export default router;









// // backend/admin-service/src/routes/markingOversight.ts

// import { Router } from 'express';
// import * as markingOversightController from '../controllers/markingOversightController';
// import { adminAuth } from '../middleware/adminAuth';
// import { oversightValidation } from '../middleware/oversightValidation';

// const router = Router();

// // Apply admin authentication to all routes
// router.use(adminAuth);

// /**
//  * GET /api/admin/marking-oversight/jobs
//  * Get all marking jobs with filters
//  */
// router.get(
//   '/jobs',
//   markingOversightController.getAllMarkingJobs
// );

// /**
//  * GET /api/admin/marking-oversight/jobs/:jobId
//  * Get marking job details by ID
//  */
// router.get(
//   '/jobs/:jobId',
//   oversightValidation.validateJobId,
//   markingOversightController.getMarkingJobById
// );

// /**
//  * POST /api/admin/marking-oversight/jobs/:jobId/assign
//  * Manually assign marking job to an agent
//  */
// router.post(
//   '/jobs/:jobId/assign',
//   oversightValidation.validateJobId,
//   oversightValidation.validateAssignment,
//   markingOversightController.assignMarkingJob
// );

// /**
//  * POST /api/admin/marking-oversight/jobs/:jobId/reassign
//  * Reassign marking job to another agent
//  */
// router.post(
//   '/jobs/:jobId/reassign',
//   oversightValidation.validateJobId,
//   oversightValidation.validateReassignment,
//   markingOversightController.reassignMarkingJob
// );

// /**
//  * POST /api/admin/marking-oversight/jobs/:jobId/cancel
//  * Cancel a marking job
//  */
// router.post(
//   '/jobs/:jobId/cancel',
//   oversightValidation.validateJobId,
//   oversightValidation.validateCancellation,
//   markingOversightController.cancelMarkingJob
// );

// /**
//  * POST /api/admin/marking-oversight/jobs/:jobId/review
//  * Review and approve/reject marking completion
//  */
// router.post(
//   '/jobs/:jobId/review',
//   oversightValidation.validateJobId,
//   oversightValidation.validateReview,
//   markingOversightController.reviewMarkingCompletion
// );

// /**
//  * POST /api/admin/marking-oversight/jobs/:jobId/dispute
//  * Handle marking disputes
//  */
// router.post(
//   '/jobs/:jobId/dispute',
//   oversightValidation.validateJobId,
//   oversightValidation.validateDispute,
//   markingOversightController.handleMarkingDispute
// );

// /**
//  * PATCH /api/admin/marking-oversight/jobs/:jobId/urgency
//  * Update marking job urgency level
//  */
// router.patch(
//   '/jobs/:jobId/urgency',
//   oversightValidation.validateJobId,
//   oversightValidation.validateUrgencyUpdate,
//   markingOversightController.updateJobUrgency
// );

// /**
//  * PATCH /api/admin/marking-oversight/jobs/:jobId/extend
//  * Extend marking job deadline
//  */
// router.patch(
//   '/jobs/:jobId/extend',
//   oversightValidation.validateJobId,
//   oversightValidation.validateDeadlineExtension,
//   markingOversightController.extendJobDeadline
// );

// /**
//  * POST /api/admin/marking-oversight/jobs/bulk-update
//  * Bulk update marking jobs
//  */
// router.post(
//   '/jobs/bulk-update',
//   oversightValidation.validateBulkUpdate,
//   markingOversightController.bulkUpdateJobs
// );

// /**
//  * GET /api/admin/marking-oversight/jobs/:jobId/history
//  * Get marking job history
//  */
// router.get(
//   '/jobs/:jobId/history',
//   oversightValidation.validateJobId,
//   markingOversightController.getJobHistory
// );

// /**
//  * GET /api/admin/marking-oversight/queue
//  * Get marking job queue status
//  */
// router.get(
//   '/queue',
//   markingOversightController.getQueueStatus
// );

// /**
//  * GET /api/admin/marking-oversight/expired
//  * Get expired marking jobs
//  */
// router.get(
//   '/expired',
//   markingOversightController.getExpiredJobs
// );

// /**
//  * GET /api/admin/marking-oversight/agents/:agentId/performance
//  * Get agent performance metrics
//  */
// router.get(
//   '/agents/:agentId/performance',
//   oversightValidation.validateAgentId,
//   markingOversightController.getAgentPerformance
// );

// /**
//  * GET /api/admin/marking-oversight/analytics
//  * Get marking analytics dashboard data
//  */
// router.get(
//   '/analytics',
//   markingOversightController.getMarkingAnalytics
// );

// export default router;









// import { Router } from 'express';
// import { markingOversightController } from '../controllers/markingOversightController';
// import { authenticateAdmin } from '../middleware/adminAuth';
// import { validateRequest } from '../middleware/adminValidation';
// import {
//   markingJobListSchema,
//   reviewMarkingSchema,
//   assignMarkingSchema,
//   oversightFilterSchema,
// } from '../validations/markingOversightSchemas';

// const router = Router();

// // Apply admin authentication to all routes
// router.use(authenticateAdmin);

// /**
//  * GET /api/admin/marking-oversight
//  * Get all property marking jobs with filters
//  */
// router.get(
//   '/',
//   validateRequest(markingJobListSchema, 'query'),
//   markingOversightController.getMarkingJobs
// );

// /**
//  * GET /api/admin/marking-oversight/pending-review
//  * Get marking jobs pending admin review
//  */
// router.get(
//   '/pending-review',
//   validateRequest(oversightFilterSchema, 'query'),
//   markingOversightController.getPendingReviewJobs
// );

// /**
//  * GET /api/admin/marking-oversight/:jobId
//  * Get detailed marking job information
//  */
// router.get('/:jobId', markingOversightController.getMarkingJobDetails);

// /**
//  * POST /api/admin/marking-oversight/:jobId/approve
//  * Approve a completed marking job
//  */
// router.post(
//   '/:jobId/approve',
//   validateRequest(reviewMarkingSchema, 'body'),
//   markingOversightController.approveMarkingJob
// );

// /**
//  * POST /api/admin/marking-oversight/:jobId/reject
//  * Reject a marking job and request rework
//  */
// router.post(
//   '/:jobId/reject',
//   validateRequest(reviewMarkingSchema, 'body'),
//   markingOversightController.rejectMarkingJob
// );

// /**
//  * POST /api/admin/marking-oversight/:jobId/assign
//  * Manually assign a marking job to an agent
//  */
// router.post(
//   '/:jobId/assign',
//   validateRequest(assignMarkingSchema, 'body'),
//   markingOversightController.manuallyAssignJob
// );

// /**
//  * POST /api/admin/marking-oversight/:jobId/reassign
//  * Reassign a marking job to a different agent
//  */
// router.post(
//   '/:jobId/reassign',
//   validateRequest(assignMarkingSchema, 'body'),
//   markingOversightController.reassignJob
// );

// /**
//  * POST /api/admin/marking-oversight/:jobId/cancel
//  * Cancel a marking job
//  */
// router.post('/:jobId/cancel', markingOversightController.cancelMarkingJob);

// /**
//  * GET /api/admin/marking-oversight/stats
//  * Get marking job statistics
//  */
// router.get('/stats', markingOversightController.getMarkingStats);

// /**
//  * GET /api/admin/marking-oversight/:jobId/timeline
//  * Get marking job timeline and history
//  */
// router.get('/:jobId/timeline', markingOversightController.getJobTimeline);

// /**
//  * PUT /api/admin/marking-oversight/:jobId/extend-deadline
//  * Extend marking job deadline
//  */
// router.put('/:jobId/extend-deadline', markingOversightController.extendDeadline);

// /**
//  * GET /api/admin/marking-oversight/quality-issues
//  * Get marking jobs with quality issues
//  */
// router.get('/quality-issues', markingOversightController.getQualityIssues);

// /**
//  * POST /api/admin/marking-oversight/:jobId/flag-quality
//  * Flag a marking job for quality issues
//  */
// router.post('/:jobId/flag-quality', markingOversightController.flagQualityIssue);

// /**
//  * GET /api/admin/marking-oversight/expired
//  * Get expired marking jobs
//  */
// router.get('/expired', markingOversightController.getExpiredJobs);

// export default router;