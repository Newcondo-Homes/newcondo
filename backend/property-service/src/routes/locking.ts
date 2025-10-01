// backend/property-service/src/routes/locking.ts

import express from 'express';
import {
  acquirePaymentLock,
  releasePaymentLock,
  checkLockStatus,
  extendPaymentLock,
  forceReleaseLock,
  getActiveLocks,
  cleanupExpiredLocks
} from '../controllers/lockingController';
import { authenticateToken } from '../../../shared/src/middleware/auth';
import { validateRequest } from '../../../shared/src/middleware/validation';
import { body, param, query } from 'express-validator';

const router = express.Router();

/**
 * @route   POST /api/properties/:propertyId/lock
 * @desc    Acquire payment lock for a property
 * @access  Private (Authenticated users)
 */
router.post(
  '/:propertyId/lock',
  authenticateToken,
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    body('unitId').optional().isString().withMessage('Unit ID must be a string'),
    body('amount').isDecimal({ decimal_digits: '0,2' }).withMessage('Amount must be a valid decimal'),
    body('lockDuration').optional().isInt({ min: 60000, max: 900000 }).withMessage('Lock duration must be between 1-15 minutes')
  ],
  validateRequest,
  acquirePaymentLock
);

/**
 * @route   DELETE /api/properties/:propertyId/lock
 * @desc    Release payment lock for a property
 * @access  Private (Authenticated users)
 */
router.delete(
  '/:propertyId/lock',
  authenticateToken,
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    body('unitId').optional().isString().withMessage('Unit ID must be a string')
  ],
  validateRequest,
  releasePaymentLock
);

/**
 * @route   GET /api/properties/:propertyId/lock/status
 * @desc    Check lock status for a property
 * @access  Public
 */
router.get(
  '/:propertyId/lock/status',
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    query('unitId').optional().isString().withMessage('Unit ID must be a string')
  ],
  validateRequest,
  checkLockStatus
);

/**
 * @route   PATCH /api/properties/:propertyId/lock/extend
 * @desc    Extend payment lock duration
 * @access  Private (Authenticated users)
 */
router.patch(
  '/:propertyId/lock/extend',
  authenticateToken,
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    body('unitId').optional().isString().withMessage('Unit ID must be a string'),
    body('extensionDuration').isInt({ min: 60000, max: 300000 }).withMessage('Extension duration must be between 1-5 minutes')
  ],
  validateRequest,
  extendPaymentLock
);

/**
 * @route   DELETE /api/properties/:propertyId/lock/force-release
 * @desc    Force release a payment lock (Admin only)
 * @access  Private (Admin only)
 */
router.delete(
  '/:propertyId/lock/force-release',
  authenticateToken,
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    body('unitId').optional().isString().withMessage('Unit ID must be a string'),
    body('reason').isString().notEmpty().withMessage('Reason is required for force release')
  ],
  validateRequest,
  forceReleaseLock
);

/**
 * @route   GET /api/properties/locks/active
 * @desc    Get all active payment locks (Admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/locks/active',
  authenticateToken,
  getActiveLocks
);

/**
 * @route   POST /api/properties/locks/cleanup
 * @desc    Manually trigger cleanup of expired locks (Admin only)
 * @access  Private (Admin only)
 */
router.post(
  '/locks/cleanup',
  authenticateToken,
  cleanupExpiredLocks
);

export default router;