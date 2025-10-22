// backend/marking-service/src/routes/confirmation.ts
import { Router } from 'express';
import {
  confirmMarking,
  rejectMarking,
  getConfirmationStatus,
  requestReMarking,
  getPendingConfirmations,
  processAutoConfirmation,
  getConfirmationDeadline,
  extendConfirmationDeadline,
  processExpiredConfirmations
} from '../controllers/confirmationController';
import { authenticate, authorize } from '../middleware/auth';
import { validateConfirmation } from '../middleware/queueValidation';

const router = Router();

/**
 * @route   POST /api/marking/confirmation/:jobId/confirm
 * @desc    Confirm marking job completion (property owner)
 * @access  Private (Job owner only)
 */
router.post(
  '/:jobId/confirm',
  authenticate,
  validateConfirmation,
  confirmMarking
);

/**
 * @route   POST /api/marking/confirmation/:jobId/reject
 * @desc    Reject marking job completion
 * @access  Private (Job owner only)
 */
router.post(
  '/:jobId/reject',
  authenticate,
  rejectMarking
);

/**
 * @route   GET /api/marking/confirmation/:jobId/status
 * @desc    Get confirmation status for a job
 * @access  Private
 */
router.get(
  '/:jobId/status',
  authenticate,
  getConfirmationStatus
);

/**
 * @route   POST /api/marking/confirmation/:jobId/request-remarking
 * @desc    Request re-marking after rejection
 * @access  Private (Job owner only)
 */
router.post(
  '/:jobId/request-remarking',
  authenticate,
  requestReMarking
);

/**
 * @route   GET /api/marking/confirmation/pending/me
 * @desc    Get all pending confirmations for property owner
 * @access  Private (OWNER only)
 */
router.get(
  '/pending/me',
  authenticate,
  authorize(['OWNER', 'AGENT']),
  getPendingConfirmations
);

/**
 * @route   POST /api/marking/confirmation/:jobId/auto-confirm
 * @desc    Auto-confirm after deadline expiry (system triggered)
 * @access  Private (System/ADMIN only)
 */
router.post(
  '/:jobId/auto-confirm',
  authenticate,
  authorize(['ADMIN']),
  processAutoConfirmation
);

/**
 * @route   GET /api/marking/confirmation/:jobId/deadline
 * @desc    Get confirmation deadline for a job
 * @access  Private
 */
router.get(
  '/:jobId/deadline',
  authenticate,
  getConfirmationDeadline
);

/**
 * @route   PATCH /api/marking/confirmation/:jobId/extend-deadline
 * @desc    Extend confirmation deadline (admin only)
 * @access  Private (ADMIN only)
 */
router.patch(
  '/:jobId/extend-deadline',
  authenticate,
  authorize(['ADMIN']),
  extendConfirmationDeadline
);

/**
 * @route   POST /api/marking/confirmation/expired/process
 * @desc    Process all expired confirmations (system cron job)
 * @access  Private (System/ADMIN only)
 */
router.post(
  '/expired/process',
  authenticate,
  authorize(['ADMIN']),
  processExpiredConfirmations
);

export default router;