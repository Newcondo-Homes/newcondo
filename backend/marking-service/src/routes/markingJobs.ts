import express from 'express';
import { auth, requireRole } from '@newcondo/auth/middleware';
import { markingJobController } from '../controllers/markingJobController';
import { markingValidation } from '../middleware/markingValidation';
import { validateRequest } from '../../../shared/src/middleware/validation';

const router = express.Router();

// Public routes (for property owners)
router.post(
  '/request',
  auth,
  markingValidation.createMarkingJob,
  validateRequest,
  markingJobController.requestMarking
);

router.get(
  '/my-requests',
  auth,
  markingJobController.getUserMarkingRequests
);

router.get(
  '/:id',
  auth,
  markingJobController.getMarkingJobById
);

router.patch(
  '/:id/cancel',
  auth,
  markingJobController.cancelMarkingJob
);

// Agent routes
router.get(
  '/available/queue',
  auth,
  requireRole(['AGENT']),
  markingJobController.getAvailableJobs
);

router.get(
  '/my-assignments',
  auth,
  requireRole(['AGENT']),
  markingJobController.getAgentAssignments
);

router.patch(
  '/:id/accept',
  auth,
  requireRole(['AGENT']),
  markingJobController.acceptAssignment
);

router.patch(
  '/:id/decline',
  auth,
  requireRole(['AGENT']),
  markingValidation.declineAssignment,
  validateRequest,
  markingJobController.declineAssignment
);

// Fee calculation
router.post(
  '/calculate-fee',
  auth,
  markingValidation.calculateFee,
  validateRequest,
  markingJobController.calculateMarkingFee
);

// Payment integration
router.post(
  '/:id/pay',
  auth,
  markingValidation.processPayment,
  validateRequest,
  markingJobController.processMarkingPayment
);

router.get(
  '/:id/payment-status',
  auth,
  markingJobController.getPaymentStatus
);

// Job status updates
router.patch(
  '/:id/status',
  auth,
  requireRole(['AGENT']),
  markingValidation.updateStatus,
  validateRequest,
  markingJobController.updateJobStatus
);

export default router;




// import { Router } from 'express';
// import {
//   createMarkingJob,
//   getMarkingJob,
//   getUserMarkingJobs,
//   updateMarkingJob,
//   cancelMarkingJob,
//   getAvailableMarkingJobs,
//   getNearbyMarkingJobs,
// } from '../controllers/markingJobController';
// import { auth } from '../../../shared/src/middleware/auth';
// import { validateMarkingJobCreation, validateMarkingJobUpdate } from '../middleware/markingValidation';
// import { checkRolePermission } from '../middleware/rolePermission';

// const router = Router();

// /**
//  * @route   POST /api/marking-jobs
//  * @desc    Create a new marking job
//  * @access  Private (Owner/Agent)
//  */
// router.post(
//   '/',
//   auth,
//   checkRolePermission(['OWNER', 'AGENT']),
//   validateMarkingJobCreation,
//   createMarkingJob
// );

// /**
//  * @route   GET /api/marking-jobs/:id
//  * @desc    Get marking job details
//  * @access  Private (Job owner or assigned agent)
//  */
// router.get(
//   '/:id',
//   auth,
//   getMarkingJob
// );

// /**
//  * @route   GET /api/marking-jobs/user/my-jobs
//  * @desc    Get all marking jobs for the authenticated user
//  * @access  Private
//  */
// router.get(
//   '/user/my-jobs',
//   auth,
//   getUserMarkingJobs
// );

// /**
//  * @route   GET /api/marking-jobs/available/list
//  * @desc    Get all available marking jobs (for agents/premium renters)
//  * @access  Private (Agent/Premium Renter)
//  */
// router.get(
//   '/available/list',
//   auth,
//   checkRolePermission(['AGENT', 'RENTER']),
//   getAvailableMarkingJobs
// );

// /**
//  * @route   GET /api/marking-jobs/nearby/list
//  * @desc    Get marking jobs within proximity
//  * @access  Private (Agent/Premium Renter)
//  */
// router.get(
//   '/nearby/list',
//   auth,
//   checkRolePermission(['AGENT', 'RENTER']),
//   getNearbyMarkingJobs
// );

// /**
//  * @route   PATCH /api/marking-jobs/:id
//  * @desc    Update marking job details
//  * @access  Private (Job owner only)
//  */
// router.patch(
//   '/:id',
//   auth,
//   validateMarkingJobUpdate,
//   updateMarkingJob
// );

// /**
//  * @route   DELETE /api/marking-jobs/:id
//  * @desc    Cancel a marking job
//  * @access  Private (Job owner only)
//  */
// router.delete(
//   '/:id',
//   auth,
//   cancelMarkingJob
// );

// export default router;






// // backend/marking-service/src/routes/markingJobs.ts
// import { Router } from "express";
// import { authenticate } from "../../../shared/src/middleware/auth";
// import {
//   createMarkingJob,
//   getMarkingJob,
//   listMarkingJobs,
//   updateMarkingJob,
//   cancelMarkingJob,
//   confirmMarkingCompletion,
// } from "../controllers/markingJobController";

// const router = Router();

// /**
//  * @route POST /api/marking-jobs
//  * @desc Create a new property marking job
//  * @access Private (Property owners, listing agents)
//  * @body {
//  *   propertyId: string,
//  *   contactPersonName: string,
//  *   contactPersonPhone: string,
//  *   accessInstructions?: string,
//  *   preferredTime?: Date,
//  *   urgencyLevel?: "LOW" | "NORMAL" | "HIGH" | "URGENT"
//  * }
//  */
// router.post("/", authenticate, createMarkingJob);

// /**
//  * @route GET /api/marking-jobs/:jobId
//  * @desc Get marking job details
//  * @access Private
//  * @params jobId: string
//  */
// router.get("/:jobId", authenticate, getMarkingJob);

// /**
//  * @route GET /api/marking-jobs
//  * @desc List marking jobs with filters
//  * @access Private
//  * @query {
//  *   status?: string,
//  *   propertyId?: string,
//  *   agentId?: string,
//  *   requestedBy?: string,
//  *   page?: number,
//  *   limit?: number
//  * }
//  */
// router.get("/", authenticate, listMarkingJobs);

// /**
//  * @route PUT /api/marking-jobs/:jobId
//  * @desc Update marking job details
//  * @access Private (Property owner or assigned agent)
//  * @params jobId: string
//  * @body {
//  *   contactPersonName?: string,
//  *   contactPersonPhone?: string,
//  *   accessInstructions?: string,
//  *   preferredTime?: Date,
//  *   urgencyLevel?: string
//  * }
//  */
// router.put("/:jobId", authenticate, updateMarkingJob);

// /**
//  * @route POST /api/marking-jobs/:jobId/cancel
//  * @desc Cancel a marking job
//  * @access Private (Property owner)
//  * @params jobId: string
//  */
// router.post("/:jobId/cancel", authenticate, cancelMarkingJob);

// /**
//  * @route POST /api/marking-jobs/:jobId/confirm
//  * @desc Property owner confirms marking completion
//  * @access Private (Property owner)
//  * @params jobId: string
//  * @body {
//  *   isConfirmed: boolean,
//  *   rejectionReason?: string
//  * }
//  */
// router.post("/:jobId/confirm", authenticate, confirmMarkingCompletion);

// export default router;