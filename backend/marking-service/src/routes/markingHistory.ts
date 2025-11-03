// backend/marking-service/src/routes/markingHistory.ts

import { Router } from 'express';
import { markingHistoryController } from '../controllers/markingHistoryController';
import { auth } from '../../../shared/src/middleware/auth';
import { rateLimiter } from '../../../shared/src/middleware/rateLimiter';

const router = Router();

// Apply authentication to all routes
router.use(auth);

// Apply rate limiting
router.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));

/**
 * @route   GET /api/marking/history
 * @desc    Get marking history for owner or agent
 * @access  Private (Owner/Agent)
 * @query   role: 'owner' | 'agent', page, limit, status, dateFrom, dateTo
 */
router.get(
  '/history',
  markingHistoryController.getMarkingHistory.bind(markingHistoryController)
);

/**
 * @route   GET /api/marking/history/:jobId
 * @desc    Get marking job details
 * @access  Private (Owner/Agent)
 */
router.get(
  '/history/:jobId',
  markingHistoryController.getMarkingJobDetails.bind(markingHistoryController)
);

/**
 * @route   GET /api/marking/statistics
 * @desc    Get marking statistics for user
 * @access  Private (Owner/Agent)
 * @query   role: 'owner' | 'agent'
 */
router.get(
  '/statistics',
  markingHistoryController.getMarkingStatistics.bind(markingHistoryController)
);

/**
 * @route   GET /api/marking/active
 * @desc    Get active marking jobs for agent
 * @access  Private (Agent)
 */
router.get(
  '/active',
  markingHistoryController.getActiveMarkingJobs.bind(markingHistoryController)
);

/**
 * @route   GET /api/marking/history/:jobId/timeline
 * @desc    Get marking job timeline
 * @access  Private (Owner/Agent)
 */
router.get(
  '/history/:jobId/timeline',
  markingHistoryController.getMarkingJobTimeline.bind(markingHistoryController)
);

/**
 * @route   GET /api/marking/completed
 * @desc    Get completed marking jobs for agent
 * @access  Private (Agent)
 * @query   page, limit, dateFrom, dateTo
 */
router.get(
  '/completed',
  markingHistoryController.getCompletedMarkingJobs.bind(markingHistoryController)
);

export default router;