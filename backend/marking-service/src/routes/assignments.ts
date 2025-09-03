import express from 'express';
import { auth, requireRole } from '@newcondo/auth/middleware';
import { assignmentController } from '../controllers/assignmentController';
import { queueValidation } from '../middleware/queueValidation';
import { validateRequest } from '../../../shared/src/middleware/validation';

const router = express.Router();

// Agent assignment management
router.post(
  '/accept/:jobId',
  auth,
  requireRole(['AGENT']),
  assignmentController.acceptAssignment
);

router.post(
  '/decline/:jobId',
  auth,
  requireRole(['AGENT']),
  queueValidation.declineAssignment,
  validateRequest,
  assignmentController.declineAssignment
);

router.patch(
  '/:jobId/start',
  auth,
  requireRole(['AGENT']),
  assignmentController.startJob
);

router.patch(
  '/:jobId/progress',
  auth,
  requireRole(['AGENT']),
  queueValidation.updateProgress,
  validateRequest,
  assignmentController.updateProgress
);

router.get(
  '/my-active',
  auth,
  requireRole(['AGENT']),
  assignmentController.getActiveAssignments
);

router.get(
  '/history',
  auth,
  requireRole(['AGENT']),
  assignmentController.getAssignmentHistory
);

// Time slot management
router.get(
  '/:jobId/time-slot',
  auth,
  requireRole(['AGENT']),
  assignmentController.getTimeSlot
);

router.patch(
  '/:jobId/extend-time',
  auth,
  requireRole(['AGENT']),
  queueValidation.extendTimeSlot,
  validateRequest,
  assignmentController.requestTimeExtension
);

// Agent communication with property owner
router.post(
  '/:jobId/contact-owner',
  auth,
  requireRole(['AGENT']),
  queueValidation.contactOwner,
  validateRequest,
  assignmentController.contactPropertyOwner
);

router.get(
  '/:jobId/contact-details',
  auth,
  requireRole(['AGENT']),
  assignmentController.getContactDetails
);

// Assignment validation and verification
router.post(
  '/:jobId/verify-location',
  auth,
  requireRole(['AGENT']),
  queueValidation.verifyLocation,
  validateRequest,
  assignmentController.verifyAgentLocation
);

router.post(
  '/:jobId/upload-progress-photos',
  auth,
  requireRole(['AGENT']),
  queueValidation.uploadProgressPhotos,
  validateRequest,
  assignmentController.uploadProgressPhotos
);

// Emergency and support
router.post(
  '/:jobId/report-issue',
  auth,
  requireRole(['AGENT']),
  queueValidation.reportIssue,
  validateRequest,
  assignmentController.reportIssue
);

router.patch(
  '/:jobId/request-support',
  auth,
  requireRole(['AGENT']),
  queueValidation.requestSupport,
  validateRequest,
  assignmentController.requestSupport
);

// Admin assignment oversight
router.get(
  '/admin/all',
  auth,
  requireRole(['ADMIN']),
  assignmentController.getAllAssignments
);

router.patch(
  '/admin/:jobId/reassign',
  auth,
  requireRole(['ADMIN']),
  queueValidation.adminReassign,
  validateRequest,
  assignmentController.adminReassignJob
);

router.patch(
  '/admin/:jobId/force-complete',
  auth,
  requireRole(['ADMIN']),
  queueValidation.forceComplete,
  validateRequest,
  assignmentController.forceCompleteJob
);

export default router;