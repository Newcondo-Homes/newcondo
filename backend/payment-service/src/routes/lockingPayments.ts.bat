import { Router } from 'express';
import { authenticateToken } from '../../../shared/src/middleware/auth';
import { validateRequest } from '../../../shared/src/middleware/validation';
import { lockingPaymentController } from '../controllers/lockingPaymentController';
import { z } from 'zod';

const router = Router();

// Validation schemas
const initiateLockSchema = z.object({
  body: z.object({
    propertyId: z.string().cuid(),
    unitId: z.string().cuid().optional(),
    amount: z.number().positive(),
    paymentType: z.enum(['RENT', 'DEPOSIT']),
  }),
});

const checkLockSchema = z.object({
  params: z.object({
    propertyId: z.string().cuid(),
  }),
  query: z.object({
    unitId: z.string().cuid().optional(),
  }),
});

const releaseLockSchema = z.object({
  params: z.object({
    lockId: z.string().cuid(),
  }),
});

const extendLockSchema = z.object({
  params: z.object({
    lockId: z.string().cuid(),
  }),
  body: z.object({
    extensionMinutes: z.number().min(1).max(30), // Max 30 minutes extension
  }),
});

/**
 * @route   POST /api/payments/locks/initiate
 * @desc    Initiate a payment lock for a property/unit
 * @access  Private (Authenticated users)
 */
router.post(
  '/initiate',
  authenticateToken,
  validateRequest(initiateLockSchema),
  lockingPaymentController.initiateLock
);

/**
 * @route   GET /api/payments/locks/check/:propertyId
 * @desc    Check if a property/unit is locked
 * @access  Private
 */
router.get(
  '/check/:propertyId',
  authenticateToken,
  validateRequest(checkLockSchema),
  lockingPaymentController.checkLock
);

/**
 * @route   POST /api/payments/locks/:lockId/release
 * @desc    Release a payment lock
 * @access  Private (Lock owner or admin)
 */
router.post(
  '/:lockId/release',
  authenticateToken,
  validateRequest(releaseLockSchema),
  lockingPaymentController.releaseLock
);

/**
 * @route   POST /api/payments/locks/:lockId/extend
 * @desc    Extend a payment lock duration
 * @access  Private (Lock owner)
 */
router.post(
  '/:lockId/extend',
  authenticateToken,
  validateRequest(extendLockSchema),
  lockingPaymentController.extendLock
);

/**
 * @route   GET /api/payments/locks/my-locks
 * @desc    Get all active locks for current user
 * @access  Private
 */
router.get(
  '/my-locks',
  authenticateToken,
  lockingPaymentController.getUserLocks
);

/**
 * @route   POST /api/payments/locks/:lockId/complete-payment
 * @desc    Complete payment and convert lock to rental
 * @access  Private (Lock owner)
 */
router.post(
  '/:lockId/complete-payment',
  authenticateToken,
  validateRequest(releaseLockSchema),
  lockingPaymentController.completePayment
);

/**
 * @route   GET /api/payments/locks/expired
 * @desc    Get expired locks (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/expired',
  authenticateToken,
  lockingPaymentController.getExpiredLocks
);

/**
 * @route   POST /api/payments/locks/cleanup
 * @desc    Cleanup expired locks (Admin/Cron job)
 * @access  Private (Admin)
 */
router.post(
  '/cleanup',
  authenticateToken,
  lockingPaymentController.cleanupExpiredLocks
);

export default router;