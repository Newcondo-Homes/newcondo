import express from 'express';
import { auth, requireRole } from '@newcondo/auth/middleware';
import { completionController } from '../controllers/completionController';
import { markingValidation } from '../middleware/markingValidation';
import { validateRequest } from '../../../shared/src/middleware/validation';

const router = express.Router();

// Agent job completion routes
router.post(
  '/:jobId/complete',
  auth,
  requireRole(['AGENT']),
  markingValidation.completeJob,
  validateRequest,
  completionController.completeMarkingJob
);

router.post(
  '/:jobId/upload-completion-photos',
  auth,
  requireRole(['AGENT']),
  markingValidation.uploadCompletionPhotos,
  validateRequest,
  completionController.uploadCompletionPhotos
);

router.post(
  '/:jobId/submit-boundary-data',
  auth,
  requireRole(['AGENT']),
  markingValidation.submitBoundaryData,
  validateRequest,
  completionController.submitBoundaryData
);

router.patch(
  '/:jobId/add-notes',
  auth,
  requireRole(['AGENT']),
  markingValidation.addCompletionNotes,
  validateRequest,
  completionController.addCompletionNotes
);

// Completion verification
router.get(
  '/:jobId/completion-data',
  auth,
  completionController.getCompletionData
);

router.post(
  '/:jobId/verify-completion',
  auth,
  markingValidation.verifyCompletion,
  validateRequest,
  completionController.verifyCompletion
);

// Quality assurance
router.post(
  '/:jobId/report-quality-issue',
  auth,
  markingValidation.reportQualityIssue,
  validateRequest,
  completionController.reportQualityIssue
);

router.patch(
  '/:jobId/request-revision',
  auth,
  markingValidation.requestRevision,
  validateRequest,
  completionController.requestRevision
);

// Owner confirmation of completion
router.patch(
  '/:jobId/confirm-completion',
  auth,
  markingValidation.confirmCompletion,
  validateRequest,
  completionController.ownerConfirmCompletion
);

router.patch(
  '/:jobId/dispute-completion',
  auth,
  markingValidation.disputeCompletion,
  validateRequest,
  completionController.disputeCompletion
);

// Completion analytics for agents
router.get(
  '/agent/completion-stats',
  auth,
  requireRole(['AGENT']),
  completionController.getAgentCompletionStats
);

router.get(
  '/agent/earnings',
  auth,
  requireRole(['AGENT']),
  completionController.getAgentEarnings
);

// Admin completion oversight
router.get(
  '/admin/completed-jobs',
  auth,
  requireRole(['ADMIN']),
  completionController.getCompletedJobs
);

router.patch(
  '/admin/:jobId/approve-completion',
  auth,
  requireRole(['ADMIN']),
  markingValidation.adminApproveCompletion,
  validateRequest,
  completionController.adminApproveCompletion
);

router.patch(
  '/admin/:jobId/reject-completion',
  auth,
  requireRole(['ADMIN']),
  markingValidation.adminRejectCompletion,
  validateRequest,
  completionController.adminRejectCompletion
);

// Completion quality metrics
router.get(
  '/admin/quality-metrics',
  auth,
  requireRole(['ADMIN']),
  completionController.getQualityMetrics
);

router.get(
  '/admin/agent-performance',
  auth,
  requireRole(['ADMIN']),
  completionController.getAgentPerformanceMetrics
);

export default router;