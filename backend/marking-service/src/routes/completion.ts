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




// import { Router } from 'express';
// import {
//   submitCompletion,
//   verifyCompletion,
//   rejectCompletion,
//   requestRevision,
//   getCompletionDetails,
//   uploadCompletionImages,
//   getVerificationStatus,
//   autoReleaseExpiredVerifications,
// } from '../controllers/completionController';
// import { auth } from '../../../shared/src/middleware/auth';
// import { checkRolePermission } from '../middleware/rolePermission';
// import { validateCompletionSubmission, validateVerificationAction } from '../middleware/markingValidation';
// import multer from 'multer';

// const router = Router();

// // Configure multer for image uploads
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB per file
//     files: 10, // Max 10 images
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed'));
//     }
//   },
// });

// /**
//  * @route   POST /api/completion/:jobId/submit
//  * @desc    Submit marking job completion
//  * @access  Private (Assigned agent only)
//  */
// router.post(
//   '/:jobId/submit',
//   auth,
//   checkRolePermission(['AGENT', 'RENTER']),
//   validateCompletionSubmission,
//   submitCompletion
// );

// /**
//  * @route   POST /api/completion/:jobId/images
//  * @desc    Upload completion images
//  * @access  Private (Assigned agent only)
//  */
// router.post(
//   '/:jobId/images',
//   auth,
//   checkRolePermission(['AGENT', 'RENTER']),
//   upload.array('images', 10),
//   uploadCompletionImages
// );

// /**
//  * @route   GET /api/completion/:jobId
//  * @desc    Get completion details
//  * @access  Private (Job owner or assigned agent)
//  */
// router.get(
//   '/:jobId',
//   auth,
//   getCompletionDetails
// );

// /**
//  * @route   GET /api/completion/:jobId/verification-status
//  * @desc    Get verification status and deadline
//  * @access  Private (Job owner or assigned agent)
//  */
// router.get(
//   '/:jobId/verification-status',
//   auth,
//   getVerificationStatus
// );

// /**
//  * @route   POST /api/completion/:jobId/verify
//  * @desc    Verify and approve marking job completion
//  * @access  Private (Job owner only)
//  */
// router.post(
//   '/:jobId/verify',
//   auth,
//   checkRolePermission(['OWNER', 'AGENT']),
//   validateVerificationAction,
//   verifyCompletion
// );

// /**
//  * @route   POST /api/completion/:jobId/reject
//  * @desc    Reject marking job completion
//  * @access  Private (Job owner only)
//  */
// router.post(
//   '/:jobId/reject',
//   auth,
//   checkRolePermission(['OWNER', 'AGENT']),
//   validateVerificationAction,
//   rejectCompletion
// );

// /**
//  * @route   POST /api/completion/:jobId/request-revision
//  * @desc    Request revision for marking job
//  * @access  Private (Job owner only)
//  */
// router.post(
//   '/:jobId/request-revision',
//   auth,
//   checkRolePermission(['OWNER', 'AGENT']),
//   validateVerificationAction,
//   requestRevision
// );

// /**
//  * @route   POST /api/completion/auto-release
//  * @desc    Auto-release payments for expired verification periods
//  * @access  Private (System/Admin - Cron job)
//  */
// router.post(
//   '/auto-release',
//   auth,
//   checkRolePermission(['ADMIN']),
//   autoReleaseExpiredVerifications
// );

// export default router;









// // backend/marking-service/src/routes/completion.ts
// import { Router } from "express";
// import { authenticate } from "../../../shared/src/middleware/auth";
// import {
//   submitMarkingCompletion,
//   getCompletionDetails,
//   listCompletions,
//   rejectCompletion,
//   releasePaymentForCompletion,
//   getCompletionAnalytics,
// } from "../controllers/completionController";

// const router = Router();

// /**
//  * @route POST /api/marking-jobs/completion/submit
//  * @desc Agent/Renter submits marking job completion
//  * @access Private (Assigned agent/renter)
//  * @body {
//  *   jobId: string,
//  *   completionNotes: string,
//  *   boundaryData: GeoJSON,
//  *   completionImages: string[] (URLs of uploaded images)
//  * }
//  */
// router.post("/submit", authenticate, submitMarkingCompletion);

// /**
//  * @route GET /api/marking-jobs/completion/:completionId
//  * @desc Get completion details with verification status
//  * @access Private
//  * @params completionId: string
//  */
// router.get("/:completionId", authenticate, getCompletionDetails);

// /**
//  * @route GET /api/marking-jobs/completion
//  * @desc List completions with filters
//  * @access Private
//  * @query {
//  *   jobId?: string,
//  *   agentId?: string,
//  *   status?: string,
//  *   dateFrom?: Date,
//  *   dateTo?: Date,
//  *   page?: number,
//  *   limit?: number
//  * }
//  */
// router.get("/", authenticate, listCompletions);

// /**
//  * @route POST /api/marking-jobs/completion/:completionId/reject
//  * @desc Property owner rejects marking completion
//  * @access Private (Property owner)
//  * @params completionId: string
//  * @body {
//  *   rejectionReason: string,
//  *   requiresRemarking: boolean
//  * }
//  */
// router.post("/:completionId/reject", authenticate, rejectCompletion);

// /**
//  * @route POST /api/marking-jobs/completion/:completionId/release-payment
//  * @desc Release payment to agent after property owner confirms
//  * @access Private (Admin or automated)
//  * @params completionId: string
//  */
// router.post("/:completionId/release-payment", authenticate, releasePaymentForCompletion);

// /**
//  * @route GET /api/marking-jobs/completion/analytics
//  * @desc Get completion analytics for admin dashboard
//  * @access Private (Admin only)
//  * @query {
//  *   timeframe?: "24hours" | "7days" | "30days",
//  *   propertyId?: string,
//  *   agentId?: string
//  * }
//  */
// router.get("/analytics", authenticate, getCompletionAnalytics);

// export default router;