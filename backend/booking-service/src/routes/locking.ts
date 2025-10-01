import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { validate } from '../../../shared/src/middleware/validation';
import { lockingController } from '../controllers/lockingController';

const router = Router();

/**
 * @route   POST /api/booking/lock/:propertyId
 * @desc    Acquire payment lock for a property
 * @access  Private
 */
router.post(
  '/lock/:propertyId',
  authMiddleware,
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    body('unitId').optional().isString().withMessage('Unit ID must be a string'),
    body('lockDurationMinutes')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Lock duration must be between 1 and 30 minutes'),
  ],
  validate,
  lockingController.acquireLock
);

/**
 * @route   POST /api/booking/lock/:propertyId/release
 * @desc    Release payment lock for a property
 * @access  Private
 */
router.post(
  '/lock/:propertyId/release',
  authMiddleware,
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    body('unitId').optional().isString().withMessage('Unit ID must be a string'),
  ],
  validate,
  lockingController.releaseLock
);

/**
 * @route   GET /api/booking/lock/:propertyId/status
 * @desc    Check lock status for a property
 * @access  Public
 */
router.get(
  '/lock/:propertyId/status',
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    query('unitId').optional().isString().withMessage('Unit ID must be a string'),
  ],
  validate,
  lockingController.checkLockStatus
);

/**
 * @route   POST /api/booking/lock/:propertyId/extend
 * @desc    Extend existing payment lock
 * @access  Private
 */
router.post(
  '/lock/:propertyId/extend',
  authMiddleware,
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    body('unitId').optional().isString().withMessage('Unit ID must be a string'),
    body('additionalMinutes')
      .isInt({ min: 1, max: 15 })
      .withMessage('Additional minutes must be between 1 and 15'),
  ],
  validate,
  lockingController.extendLock
);

/**
 * @route   DELETE /api/booking/lock/:propertyId/force-release
 * @desc    Force release a lock (Admin only)
 * @access  Private (Admin)
 */
router.delete(
  '/lock/:propertyId/force-release',
  authMiddleware,
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    body('unitId').optional().isString().withMessage('Unit ID must be a string'),
    body('reason').isString().notEmpty().withMessage('Reason is required'),
  ],
  validate,
  lockingController.forceReleaseLock
);

/**
 * @route   GET /api/booking/locks/active
 * @desc    Get all active locks (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/locks/active',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validate,
  lockingController.getActiveLocks
);

/**
 * @route   GET /api/booking/locks/user
 * @desc    Get user's active locks
 * @access  Private
 */
router.get(
  '/locks/user',
  authMiddleware,
  lockingController.getUserLocks
);

/**
 * @route   POST /api/booking/lock/cleanup
 * @desc    Clean up expired locks (Cron job endpoint)
 * @access  Private (Internal/Admin)
 */
router.post(
  '/lock/cleanup',
  authMiddleware,
  lockingController.cleanupExpiredLocks
);

/**
 * @route   GET /api/booking/lock/:propertyId/history
 * @desc    Get lock history for a property
 * @access  Private (Owner/Admin)
 */
router.get(
  '/lock/:propertyId/history',
  authMiddleware,
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validate,
  lockingController.getLockHistory
);

export default router;