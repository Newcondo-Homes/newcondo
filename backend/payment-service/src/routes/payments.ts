// backend/payment-service/src/routes/payments.ts
import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { validationMiddleware } from '../../../shared/src/middleware/validation';
import { rateLimiterMiddleware } from '../../../shared/src/middleware/rateLimiter';
import { z } from 'zod';

const router = Router();

// Validation schemas
const initiatePaymentSchema = z.object({
  body: z.object({
    propertyId: z.string().min(1),
    unitId: z.string().optional(),
    amount: z.number().positive(),
    paymentType: z.enum(['RENT', 'DEPOSIT', 'AGENT_COMMISSION', 'PREMIUM_UPGRADE', 'PROPERTY_MARKING']),
    currency: z.string().default('NGN'),
    description: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

const verifyPaymentSchema = z.object({
  body: z.object({
    transactionId: z.string().min(1),
    flutterwaveRef: z.string().optional(),
  }),
});

const retryPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().min(1),
    paymentMethod: z.string().optional(),
  }),
});

// Apply rate limiting to payment endpoints
const paymentRateLimit = rateLimiterMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: 'Too many payment requests, please try again later',
});

// Public routes (no auth required)

/**
 * @route   GET /api/payments/methods
 * @desc    Get available payment methods
 * @access  Public
 */
router.get('/methods', paymentController.getPaymentMethods);

/**
 * @route   GET /api/payments/fees
 * @desc    Get payment fees structure
 * @access  Public
 */
router.get('/fees', paymentController.getPaymentFees);

// Protected routes (auth required)

/**
 * @route   POST /api/payments/initiate
 * @desc    Initiate a new payment
 * @access  Private
 */
router.post(
  '/initiate',
  authMiddleware,
  paymentRateLimit,
  validationMiddleware(initiatePaymentSchema),
  paymentController.initiatePayment
);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment transaction
 * @access  Private
 */
router.post(
  '/verify',
  authMiddleware,
  validationMiddleware(verifyPaymentSchema),
  paymentController.verifyPayment
);

/**
 * @route   GET /api/payments/user/:userId
 * @desc    Get user's payment history
 * @access  Private (user can only access own payments or admin)
 */
router.get(
  '/user/:userId',
  authMiddleware,
  paymentController.getUserPayments
);

/**
 * @route   GET /api/payments/:paymentId
 * @desc    Get specific payment details
 * @access  Private
 */
router.get(
  '/:paymentId',
  authMiddleware,
  paymentController.getPaymentById
);

/**
 * @route   PUT /api/payments/:paymentId/cancel
 * @desc    Cancel a pending payment
 * @access  Private
 */
router.put(
  '/:paymentId/cancel',
  authMiddleware,
  paymentController.cancelPayment
);

/**
 * @route   POST /api/payments/:paymentId/retry
 * @desc    Retry a failed payment
 * @access  Private
 */
router.post(
  '/:paymentId/retry',
  authMiddleware,
  paymentRateLimit,
  validationMiddleware(retryPaymentSchema),
  paymentController.retryPayment
);

/**
 * @route   GET /api/payments/:paymentId/receipt
 * @desc    Get payment receipt
 * @access  Private
 */
router.get(
  '/:paymentId/receipt',
  authMiddleware,
  paymentController.getPaymentReceipt
);

/**
 * @route   POST /api/payments/:paymentId/receipt/resend
 * @desc    Resend payment receipt via email
 * @access  Private
 */
router.post(
  '/:paymentId/receipt/resend',
  authMiddleware,
  paymentController.resendPaymentReceipt
);

/**
 * @route   GET /api/payments/property/:propertyId
 * @desc    Get payments for a specific property
 * @access  Private (property owner/agent only)
 */
router.get(
  '/property/:propertyId',
  authMiddleware,
  paymentController.getPropertyPayments
);

/**
 * @route   GET /api/payments/rental/:rentalId
 * @desc    Get payments for a specific rental
 * @access  Private
 */
router.get(
  '/rental/:rentalId',
  authMiddleware,
  paymentController.getRentalPayments
);

/**
 * @route   GET /api/payments/stats/user
 * @desc    Get user payment statistics
 * @access  Private
 */
router.get(
  '/stats/user',
  authMiddleware,
  paymentController.getUserPaymentStats
);

/**
 * @route   GET /api/payments/stats/property/:propertyId
 * @desc    Get property payment statistics
 * @access  Private (property owner/agent only)
 */
router.get(
  '/stats/property/:propertyId',
  authMiddleware,
  paymentController.getPropertyPaymentStats
);

// Admin-only routes

/**
 * @route   GET /api/payments
 * @desc    Get all payments (admin only)
 * @access  Private (admin)
 */
router.get(
  '/',
  authMiddleware,
  // TODO: Add admin middleware
  paymentController.getAllPayments
);

/**
 * @route   PUT /api/payments/:paymentId/refund
 * @desc    Process payment refund (admin only)
 * @access  Private (admin)
 */
router.put(
  '/:paymentId/refund',
  authMiddleware,
  // TODO: Add admin middleware
  paymentController.refundPayment
);

/**
 * @route   PUT /api/payments/:paymentId/release
 * @desc    Release held payment (admin only)
 * @access  Private (admin)
 */
router.put(
  '/:paymentId/release',
  authMiddleware,
  // TODO: Add admin middleware
  paymentController.releasePayment
);

/**
 * @route   GET /api/payments/stats/platform
 * @desc    Get platform payment statistics (admin only)
 * @access  Private (admin)
 */
router.get(
  '/stats/platform',
  authMiddleware,
  // TODO: Add admin middleware
  paymentController.getPlatformPaymentStats
);

/**
 * @route   GET /api/payments/failed/retry-all
 * @desc    Retry all failed payments (admin only)
 * @access  Private (admin)
 */
router.post(
  '/failed/retry-all',
  authMiddleware,
  // TODO: Add admin middleware
  paymentController.retryFailedPayments
);

/**
 * @route   GET /api/payments/audit/logs
 * @desc    Get payment audit logs (admin only)
 * @access  Private (admin)
 */
router.get(
  '/audit/logs',
  authMiddleware,
  // TODO: Add admin middleware
  paymentController.getPaymentAuditLogs
);

export default router;

// import express from 'express';
// import { authMiddleware } from '../../../shared/src/middleware/auth';
// import { validateRequest } from '../../../shared/src/middleware/validation';
// import { paymentValidation } from '../middleware/paymentValidation';
// import { lockingMiddleware } from '../middleware/lockingMiddleware';
// import {
//   initiatePayment,
//   verifyPayment,
//   getPaymentHistory,
//   getPaymentDetails,
//   cancelPayment,
//   requestRefund,
//   retryPayment,
//   getPaymentMethods,
//   updatePaymentMethod
// } from '../controllers/paymentController';

// const router = express.Router();

// // Apply auth middleware to all routes
// router.use(authMiddleware);

// /**
//  * @route   POST /api/payments/initiate
//  * @desc    Initiate a new payment
//  * @access  Private
//  * @body    { paymentType, amount, propertyId?, unitId?, markingJobId?, paymentMethod? }
//  */
// router.post(
//   '/initiate',
//   validateRequest(paymentValidation.initiatePayment),
//   lockingMiddleware.checkPropertyLock,
//   initiatePayment
// );

// /**
//  * @route   POST /api/payments/verify/:transactionId
//  * @desc    Verify payment status with Flutterwave
//  * @access  Private
//  */
// router.post(
//   '/verify/:transactionId',
//   validateRequest(paymentValidation.verifyPayment),
//   verifyPayment
// );

// /**
//  * @route   GET /api/payments/history
//  * @desc    Get user payment history with pagination
//  * @access  Private
//  * @query   { page?, limit?, status?, paymentType?, startDate?, endDate? }
//  */
// router.get(
//   '/history',
//   validateRequest(paymentValidation.getPaymentHistory),
//   getPaymentHistory
// );

// /**
//  * @route   GET /api/payments/:paymentId
//  * @desc    Get specific payment details
//  * @access  Private
//  */
// router.get(
//   '/:paymentId',
//   validateRequest(paymentValidation.getPaymentDetails),
//   getPaymentDetails
// );

// /**
//  * @route   POST /api/payments/:paymentId/cancel
//  * @desc    Cancel a pending payment
//  * @access  Private
//  */
// router.post(
//   '/:paymentId/cancel',
//   validateRequest(paymentValidation.cancelPayment),
//   cancelPayment
// );

// /**
//  * @route   POST /api/payments/:paymentId/refund
//  * @desc    Request payment refund
//  * @access  Private
//  * @body    { reason, description? }
//  */
// router.post(
//   '/:paymentId/refund',
//   validateRequest(paymentValidation.requestRefund),
//   requestRefund
// );

// /**
//  * @route   POST /api/payments/:paymentId/retry
//  * @desc    Retry failed payment
//  * @access  Private
//  * @body    { paymentMethod? }
//  */
// router.post(
//   '/:paymentId/retry',
//   validateRequest(paymentValidation.retryPayment),
//   lockingMiddleware.checkPropertyLock,
//   retryPayment
// );

// /**
//  * @route   GET /api/payments/methods
//  * @desc    Get available payment methods
//  * @access  Private
//  */
// router.get('/methods', getPaymentMethods);

// /**
//  * @route   PUT /api/payments/methods
//  * @desc    Update preferred payment method
//  * @access  Private
//  * @body    { paymentMethod, isDefault? }
//  */
// router.put(
//   '/methods',
//   validateRequest(paymentValidation.updatePaymentMethod),
//   updatePaymentMethod
// );

// export default router;