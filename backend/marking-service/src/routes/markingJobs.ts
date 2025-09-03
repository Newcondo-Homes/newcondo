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