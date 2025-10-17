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





// import { Router } from 'express';
// import {
//   acceptAssignment,
//   declineAssignment,
//   getAssignedJobs,
//   getAssignmentDetails,
//   startMarkingJob,
//   submitMarkingProgress,
//   getAgentActiveAssignments,
// } from '../controllers/assignmentController';
// import { auth } from '../../../shared/src/middleware/auth';
// import { checkRolePermission } from '../middleware/rolePermission';
// import { validateAssignmentAction } from '../middleware/markingValidation';

// const router = Router();

// /**
//  * @route   POST /api/assignments/:jobId/accept
//  * @desc    Accept a marking job assignment
//  * @access  Private (Agent/Premium Renter)
//  */
// router.post(
//   '/:jobId/accept',
//   auth,
//   checkRolePermission(['AGENT', 'RENTER']),
//   validateAssignmentAction,
//   acceptAssignment
// );

// /**
//  * @route   POST /api/assignments/:jobId/decline
//  * @desc    Decline a marking job assignment
//  * @access  Private (Agent/Premium Renter)
//  */
// router.post(
//   '/:jobId/decline',
//   auth,
//   checkRolePermission(['AGENT', 'RENTER']),
//   validateAssignmentAction,
//   declineAssignment
// );

// /**
//  * @route   GET /api/assignments/my-assignments
//  * @desc    Get all assigned jobs for the authenticated user
//  * @access  Private (Agent/Premium Renter)
//  */
// router.get(
//   '/my-assignments',
//   auth,
//   checkRolePermission(['AGENT', 'RENTER']),
//   getAssignedJobs
// );

// /**
//  * @route   GET /api/assignments/active
//  * @desc    Get active assignments for agent
//  * @access  Private (Agent/Premium Renter)
//  */
// router.get(
//   '/active',
//   auth,
//   checkRolePermission(['AGENT', 'RENTER']),
//   getAgentActiveAssignments
// );

// /**
//  * @route   GET /api/assignments/:jobId
//  * @desc    Get assignment details
//  * @access  Private (Assigned agent only)
//  */
// router.get(
//   '/:jobId',
//   auth,
//   checkRolePermission(['AGENT', 'RENTER']),
//   getAssignmentDetails
// );

// /**
//  * @route   POST /api/assignments/:jobId/start
//  * @desc    Start marking a job
//  * @access  Private (Assigned agent only)
//  */
// router.post(
//   '/:jobId/start',
//   auth,
//   checkRolePermission(['AGENT', 'RENTER']),
//   startMarkingJob
// );

// /**
//  * @route   POST /api/assignments/:jobId/progress
//  * @desc    Submit marking progress/updates
//  * @access  Private (Assigned agent only)
//  */
// router.post(
//   '/:jobId/progress',
//   auth,
//   checkRolePermission(['AGENT', 'RENTER']),
//   submitMarkingProgress
// );

// export default router;








// // backend/marking-service/src/routes/assignments.ts
// import { Router } from "express";
// import { authenticate } from "../../../shared/src/middleware/auth";
// import {
//   assignJobToAgent,
//   acceptJobAssignment,
//   rejectJobAssignment,
//   getAgentAssignments,
//   getPropertyAssignments,
//   reassignJob,
//   getAssignmentDetails,
// } from "../controllers/assignmentController";

// const router = Router();

// /**
//  * @route POST /api/marking-jobs/assignments/assign
//  * @desc Assign a marking job to an agent or renter
//  * @access Private (Admin or property owner)
//  * @body {
//  *   jobId: string,
//  *   agentId: string,
//  *   timeSlotDuration?: number (default: 180 minutes/3 hours)
//  * }
//  */
// router.post("/assign", authenticate, assignJobToAgent);

// /**
//  * @route POST /api/marking-jobs/assignments/:assignmentId/accept
//  * @desc Agent/Renter accepts job assignment
//  * @access Private (Assigned agent/renter)
//  * @params assignmentId: string
//  * @body {
//  *   estimatedArrivalTime?: Date
//  * }
//  */
// router.post("/:assignmentId/accept", authenticate, acceptJobAssignment);

// /**
//  * @route POST /api/marking-jobs/assignments/:assignmentId/reject
//  * @desc Agent/Renter rejects job assignment
//  * @access Private (Assigned agent/renter)
//  * @params assignmentId: string
//  * @body {
//  *   rejectionReason: string
//  * }
//  */
// router.post("/:assignmentId/reject", authenticate, rejectJobAssignment);

// /**
//  * @route GET /api/marking-jobs/assignments/agent/:agentId
//  * @desc Get all assignments for an agent
//  * @access Private (Agent or admin)
//  * @params agentId: string
//  * @query {
//  *   status?: string,
//  *   page?: number,
//  *   limit?: number
//  * }
//  */
// router.get("/agent/:agentId", authenticate, getAgentAssignments);

// /**
//  * @route GET /api/marking-jobs/assignments/property/:propertyId
//  * @desc Get all assignments for a marking job/property
//  * @access Private (Property owner or admin)
//  * @params propertyId: string
//  */
// router.get("/property/:propertyId", authenticate, getPropertyAssignments);

// /**
//  * @route GET /api/marking-jobs/assignments/:assignmentId
//  * @desc Get assignment details
//  * @access Private
//  * @params assignmentId: string
//  */
// router.get("/:assignmentId", authenticate, getAssignmentDetails);

// /**
//  * @route PUT /api/marking-jobs/assignments/:assignmentId/reassign
//  * @desc Reassign job to different agent (after timeout or rejection)
//  * @access Private (Admin only)
//  * @params assignmentId: string
//  * @body {
//  *   newAgentId: string
//  * }
//  */
// router.put("/:assignmentId/reassign", authenticate, reassignJob);

// export default router;