// backend/marking-service/src/routes/timeSlots.ts
import { Router } from 'express';
import {
  createTimeSlot,
  getActiveTimeSlot,
  extendTimeSlot,
  expireTimeSlot,
  getTimeSlotHistory,
  checkTimeSlotExpiry,
  getExpiringTimeSlots,
  getTimeSlotStats
} from '../controllers/timeSlotController';
import { authenticate, authorize } from '../middleware/auth';
import { validateTimeSlot } from '../middleware/queueValidation';

const router = Router();

/**
 * @route   POST /api/marking/time-slots/:jobId/create
 * @desc    Create time slot for assigned agent (3-hour window)
 * @access  Private (System/ADMIN only)
 */
router.post(
  '/:jobId/create',
  authenticate,
  authorize(['ADMIN']),
  validateTimeSlot,
  createTimeSlot
);

/**
 * @route   GET /api/marking/time-slots/:jobId/active
 * @desc    Get active time slot for a job
 * @access  Private
 */
router.get(
  '/:jobId/active',
  authenticate,
  getActiveTimeSlot
);

/**
 * @route   PATCH /api/marking/time-slots/:jobId/extend
 * @desc    Extend time slot (admin discretion)
 * @access  Private (ADMIN only)
 */
router.patch(
  '/:jobId/extend',
  authenticate,
  authorize(['ADMIN']),
  extendTimeSlot
);

/**
 * @route   POST /api/marking/time-slots/:jobId/expire
 * @desc    Manually expire a time slot
 * @access  Private (ADMIN only)
 */
router.post(
  '/:jobId/expire',
  authenticate,
  authorize(['ADMIN']),
  expireTimeSlot
);

/**
 * @route   GET /api/marking/time-slots/:jobId/history
 * @desc    Get time slot history for a job
 * @access  Private
 */
router.get(
  '/:jobId/history',
  authenticate,
  getTimeSlotHistory
);

/**
 * @route   GET /api/marking/time-slots/:jobId/check-expiry
 * @desc    Check if time slot has expired
 * @access  Private
 */
router.get(
  '/:jobId/check-expiry',
  authenticate,
  checkTimeSlotExpiry
);

/**
 * @route   GET /api/marking/time-slots/expiring/soon
 * @desc    Get time slots expiring soon (within 30 minutes)
 * @access  Private (ADMIN only)
 */
router.get(
  '/expiring/soon',
  authenticate,
  authorize(['ADMIN']),
  getExpiringTimeSlots
);

/**
 * @route   GET /api/marking/time-slots/stats/overview
 * @desc    Get time slot statistics
 * @access  Private (ADMIN only)
 */
router.get(
  '/stats/overview',
  authenticate,
  authorize(['ADMIN']),
  getTimeSlotStats
);

export default router;