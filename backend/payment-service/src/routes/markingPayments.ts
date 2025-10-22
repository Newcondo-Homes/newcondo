import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { MarkingPaymentController } from '../controllers/markingPaymentController';
import { authMiddleware } from '../../shared/src/middleware/auth';
import { validationMiddleware } from '../../shared/src/middleware/validation';
import { rateLimiterMiddleware } from '../../shared/src/middleware/rateLimiter';

const router = Router();
const markingPaymentController = new MarkingPaymentController();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route POST /api/marking-payments/initiate
 * @desc Initiate payment for property marking service
 * @access Private
 */
router.post(
  '/initiate',
  rateLimiterMiddleware({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 requests per 15 minutes
  [
    body('markingJobId')
      .notEmpty()
      .withMessage('Marking job ID is required')
      .isString()
      .withMessage('Marking job ID must be a string'),
    
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isNumeric()
      .withMessage('Amount must be a number')
      .custom((value) => {
        if (value <= 0) {
          throw new Error('Amount must be greater than 0');
        }
        return true;
      }),
    
    body('currency')
      .optional()
      .isIn(['NGN', 'USD'])
      .withMessage('Currency must be NGN or USD'),
    
    body('paymentMethod')
      .optional()
      .isIn(['card', 'bank_transfer', 'ussd', 'mobile_money'])
      .withMessage('Invalid payment method'),
    
    body('callbackUrl')
      .optional()
      .isURL()
      .withMessage('Callback URL must be a valid URL'),
    
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
  ],
  validationMiddleware,
  markingPaymentController.initiatePayment
);

/**
 * @route GET /api/marking-payments/:paymentId/status
 * @desc Get payment status for a specific marking payment
 * @access Private
 */
router.get(
  '/:paymentId/status',
  [
    param('paymentId')
      .notEmpty()
      .withMessage('Payment ID is required')
      .isString()
      .withMessage('Payment ID must be a string')
  ],
  validationMiddleware,
  markingPaymentController.getPaymentStatus
);

/**
 * @route POST /api/marking-payments/:paymentId/verify
 * @desc Verify payment completion
 * @access Private
 */
router.post(
  '/:paymentId/verify',
  rateLimiterMiddleware({ windowMs: 5 * 60 * 1000, max: 20 }), // 20 requests per 5 minutes
  [
    param('paymentId')
      .notEmpty()
      .withMessage('Payment ID is required')
      .isString()
      .withMessage('Payment ID must be a string'),
    
    body('transactionId')
      .optional()
      .isString()
      .withMessage('Transaction ID must be a string'),
    
    body('flutterwaveReference')
      .optional()
      .isString()
      .withMessage('Flutterwave reference must be a string')
  ],
  validationMiddleware,
  markingPaymentController.verifyPayment
);

/**
 * @route GET /api/marking-payments/marking-job/:markingJobId
 * @desc Get all payments for a specific marking job
 * @access Private
 */
router.get(
  '/marking-job/:markingJobId',
  [
    param('markingJobId')
      .notEmpty()
      .withMessage('Marking job ID is required')
      .isString()
      .withMessage('Marking job ID must be a string'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('status')
      .optional()
      .isIn(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'])
      .withMessage('Invalid status filter')
  ],
  validationMiddleware,
  markingPaymentController.getMarkingJobPayments
);

/**
 * @route GET /api/marking-payments/user/history
 * @desc Get user's marking payment history
 * @access Private
 */
router.get(
  '/user/history',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('status')
      .optional()
      .isIn(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'])
      .withMessage('Invalid status filter'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ],
  validationMiddleware,
  markingPaymentController.getUserMarkingPaymentHistory
);

/**
 * @route POST /api/marking-payments/:paymentId/refund
 * @desc Request refund for a marking payment
 * @access Private
 */
router.post(
  '/:paymentId/refund',
  rateLimiterMiddleware({ windowMs: 30 * 60 * 1000, max: 5 }), // 5 requests per 30 minutes
  [
    param('paymentId')
      .notEmpty()
      .withMessage('Payment ID is required')
      .isString()
      .withMessage('Payment ID must be a string'),
    
    body('reason')
      .notEmpty()
      .withMessage('Refund reason is required')
      .isString()
      .withMessage('Refund reason must be a string')
      .isLength({ min: 10, max: 500 })
      .withMessage('Refund reason must be between 10 and 500 characters'),
    
    body('refundAmount')
      .optional()
      .isNumeric()
      .withMessage('Refund amount must be a number')
      .custom((value) => {
        if (value <= 0) {
          throw new Error('Refund amount must be greater than 0');
        }
        return true;
      })
  ],
  validationMiddleware,
  markingPaymentController.requestRefund
);

/**
 * @route GET /api/marking-payments/fees/calculate
 * @desc Calculate marking service fees
 * @access Private
 */
router.get(
  '/fees/calculate',
  [
    query('urgencyLevel')
      .optional()
      .isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
      .withMessage('Invalid urgency level'),
    
    query('serviceType')
      .optional()
      .isIn(['STANDARD', 'EXPRESS', 'PREMIUM'])
      .withMessage('Invalid service type'),
    
    query('location')
      .optional()
      .isString()
      .withMessage('Location must be a string'),
    
    query('propertyType')
      .optional()
      .isIn(['APARTMENT', 'HOUSE', 'DUPLEX', 'ROOM', 'SHARED_APARTMENT', 'OFFICE', 'SHOP', 'WAREHOUSE'])
      .withMessage('Invalid property type')
  ],
  validationMiddleware,
  markingPaymentController.calculateMarkingFees
);

/**
 * @route POST /api/marking-payments/webhook/flutterwave
 * @desc Handle Flutterwave webhook for marking payments
 * @access Public (but secured with signature verification)
 */
router.post(
  '/webhook/flutterwave',
  rateLimiterMiddleware({ windowMs: 60 * 1000, max: 100 }), // 100 requests per minute
  markingPaymentController.handleFlutterwaveWebhook
);

/**
 * @route GET /api/marking-payments/:paymentId/receipt
 * @desc Generate and retrieve payment receipt
 * @access Private
 */
router.get(
  '/:paymentId/receipt',
  [
    param('paymentId')
      .notEmpty()
      .withMessage('Payment ID is required')
      .isString()
      .withMessage('Payment ID must be a string'),
    
    query('format')
      .optional()
      .isIn(['pdf', 'json'])
      .withMessage('Format must be pdf or json')
  ],
  validationMiddleware,
  markingPaymentController.getPaymentReceipt
);

/**
 * @route POST /api/marking-payments/:paymentId/retry
 * @desc Retry failed marking payment
 * @access Private
 */
router.post(
  '/:paymentId/retry',
  rateLimiterMiddleware({ windowMs: 10 * 60 * 1000, max: 3 }), // 3 requests per 10 minutes
  [
    param('paymentId')
      .notEmpty()
      .withMessage('Payment ID is required')
      .isString()
      .withMessage('Payment ID must be a string'),
    
    body('paymentMethod')
      .optional()
      .isIn(['card', 'bank_transfer', 'ussd', 'mobile_money'])
      .withMessage('Invalid payment method')
  ],
  validationMiddleware,
  markingPaymentController.retryPayment
);

/**
 * @route GET /api/marking-payments/analytics/summary
 * @desc Get marking payments analytics summary
 * @access Private (Admin only)
 */
router.get(
  '/analytics/summary',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    
    query('groupBy')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('GroupBy must be day, week, or month')
  ],
  validationMiddleware,
  markingPaymentController.getPaymentAnalytics
);

export default router;




// import { Router } from 'express';
// import { markingPaymentController } from '../controllers/markingPaymentController';
// import { authenticateToken } from '../middleware/auth';
// import { validateRequest } from '../middleware/validation';
// import { rateLimiter } from '../middleware/rateLimiter';
// import {
//   initializeMarkingPaymentSchema,
//   releaseCompensationSchema,
//   calculatePriceSchema,
//   refundPaymentSchema,
// } from '../validations/markingPayment';

// const router = Router();

// /**
//  * @route   POST /api/marking-payments/initialize
//  * @desc    Initialize marking payment for a property marking job
//  * @access  Private (Owner/Agent)
//  */
// router.post(
//   '/initialize',
//   authenticateToken,
//   rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 requests per 15 minutes
//   validateRequest(initializeMarkingPaymentSchema),
//   markingPaymentController.initializeMarkingPayment
// );

// /**
//  * @route   GET /api/marking-payments/verify/:transactionId
//  * @desc    Verify marking payment after Flutterwave redirect
//  * @access  Private
//  */
// router.get(
//   '/verify/:transactionId',
//   authenticateToken,
//   markingPaymentController.verifyMarkingPayment
// );

// /**
//  * @route   POST /api/marking-payments/webhook
//  * @desc    Handle Flutterwave webhook for marking payments
//  * @access  Public (Webhook)
//  */
// router.post(
//   '/webhook',
//   markingPaymentController.handleMarkingPaymentWebhook
// );

// /**
//  * @route   POST /api/marking-payments/release-partial
//  * @desc    Release partial compensation to agent (initial payment)
//  * @access  Private (Admin/System)
//  */
// router.post(
//   '/release-partial',
//   authenticateToken,
//   validateRequest(releaseCompensationSchema),
//   markingPaymentController.releasePartialCompensation
// );

// /**
//  * @route   POST /api/marking-payments/release-full
//  * @desc    Release full compensation to agent (after confirmation)
//  * @access  Private (Owner/System)
//  */
// router.post(
//   '/release-full',
//   authenticateToken,
//   validateRequest(releaseCompensationSchema),
//   markingPaymentController.releaseFullCompensation
// );

// /**
//  * @route   POST /api/marking-payments/handle-timeout
//  * @desc    Handle timeout compensation for unconfirmed marking jobs
//  * @access  Private (System/Admin)
//  */
// router.post(
//   '/handle-timeout',
//   authenticateToken,
//   validateRequest(releaseCompensationSchema),
//   markingPaymentController.handleTimeoutCompensation
// );

// /**
//  * @route   GET /api/marking-payments/:paymentId
//  * @desc    Get marking payment details
//  * @access  Private
//  */
// router.get(
//   '/:paymentId',
//   authenticateToken,
//   markingPaymentController.getMarkingPaymentDetails
// );

// /**
//  * @route   GET /api/marking-payments/history
//  * @desc    Get payment history for marking jobs
//  * @access  Private
//  */
// router.get(
//   '/history',
//   authenticateToken,
//   rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 requests per 15 minutes
//   markingPaymentController.getMarkingPaymentHistory
// );

// /**
//  * @route   POST /api/marking-payments/calculate-price
//  * @desc    Calculate marking job pricing
//  * @access  Private
//  */
// router.post(
//   '/calculate-price',
//   authenticateToken,
//   rateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }), // 30 requests per 15 minutes
//   validateRequest(calculatePriceSchema),
//   markingPaymentController.calculateMarkingPrice
// );

// /**
//  * @route   POST /api/marking-payments/refund
//  * @desc    Refund marking payment
//  * @access  Private (Admin)
//  */
// router.post(
//   '/refund',
//   authenticateToken,
//   validateRequest(refundPaymentSchema),
//   markingPaymentController.refundMarkingPayment
// );

// export default router;






// // backend/payment-service/src/routes/markingPayments.ts

// import { Router, Request, Response } from 'express';
// import { markingPaymentController } from '../controllers/markingPaymentController';
// import {
//   authMiddleware,
//   roleMiddleware,
// } from '@newcondo/shared/middleware/auth';
// import {
//   validateMarkingPaymentInitiation,
//   validatePaymentRefund,
//   validatePaymentRelease,
// } from '../middleware/paymentValidation';
// import { rateLimiter } from '@newcondo/shared/middleware/rateLimiter';
// import { errorHandler } from '@newcondo/shared/middleware/errorHandler';

// const router = Router();

// /**
//  * POST /api/payment/marking/initiate
//  * Initiate marking payment when property owner or agent requests marking service
//  * Only OWNER and AGENT roles can initiate marking payments
//  * Requires: propertyId, markingJobId, markingType, userId
//  */
// router.post(
//   '/initiate',
//   rateLimiter,
//   authMiddleware,
//   roleMiddleware(['OWNER', 'AGENT', 'RENTER']),
//   validateMarkingPaymentInitiation,
//   async (req: Request, res: Response) => {
//     await markingPaymentController.initiateMarkingPayment(req, res);
//   }
// );

// /**
//  * POST /api/payment/marking/webhook
//  * Flutterwave webhook endpoint for marking payment confirmations
//  * This is a public endpoint (webhook from external service)
//  * Requires verification of webhook signature
//  */
// router.post(
//   '/webhook',
//   express.raw({ type: 'application/json' }),
//   async (req: Request, res: Response) => {
//     await markingPaymentController.handleMarkingPaymentWebhook(req, res);
//   }
// );

// /**
//  * GET /api/payment/marking/:paymentId
//  * Get marking payment status for a specific payment
//  * User can only view their own payment records
//  * Query param: userId (for authorization)
//  */
// router.get(
//   '/:paymentId',
//   authMiddleware,
//   async (req: Request, res: Response) => {
//     await markingPaymentController.getMarkingPaymentStatus(req, res);
//   }
// );

// /**
//  * POST /api/payment/marking/:paymentId/release
//  * Release payment to agent after property owner confirms marking
//  * Transitions from escrow (1000 NGN) to full payment (25000 NGN)
//  * Only property owner can trigger this after verifying the marked boundary
//  * Requires: paymentId, markingJobId, userId
//  */
// router.post(
//   '/:paymentId/release',
//   rateLimiter,
//   authMiddleware,
//   validatePaymentRelease,
//   async (req: Request, res: Response) => {
//     await markingPaymentController.releasePaymentToAgent(req, res);
//   }
// );

// /**
//  * POST /api/payment/marking/:paymentId/refund
//  * Refund marking payment if job is cancelled or rejected
//  * Can be initiated by: property owner (before agent marks), admin (at any time)
//  * Requires: paymentId, reason, userId
//  */
// router.post(
//   '/:paymentId/refund',
//   rateLimiter,
//   authMiddleware,
//   validatePaymentRefund,
//   async (req: Request, res: Response) => {
//     await markingPaymentController.refundMarkingPayment(req, res);
//   }
// );

// /**
//  * GET /api/payment/marking/history/:userId
//  * Get marking payment history for a user
//  * Shows all marking payments made by user
//  * Query params: page (default: 1), limit (default: 10), status (optional filter)
//  */
// router.get(
//   '/history/:userId',
//   authMiddleware,
//   async (req: Request, res: Response) => {
//     await markingPaymentController.getMarkingPaymentHistory(req, res);
//   }
// );

// // Error handling middleware
// router.use(errorHandler);

// export default router;









// // backend/payment-service/src/routes/markingPayments.ts

// import { Router } from 'express';
// import { markingPaymentController } from '../controllers/markingPaymentController';
// import { partialPaymentController } from '../controllers/partialPaymentController';
// import { auth } from '../../../shared/src/middleware/auth';
// import { validateRequest } from '../../../shared/src/middleware/validation';
// import { markingPaymentValidation } from '../middleware/markingPaymentValidation';
// import { rateLimiter } from '../../../shared/src/middleware/rateLimiter';

// const router = Router();

// // ==================== Marking Payment Routes ====================

// /**
//  * @route   POST /api/payments/marking/initiate
//  * @desc    Initiate payment for a marking job
//  * @access  Private (Property Owner/Agent)
//  */
// router.post(
//   '/marking/initiate',
//   auth,
//   rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 requests per 15 minutes
//   validateRequest(markingPaymentValidation.initiatePayment),
//   markingPaymentController.initiateMarkingPayment
// );

// /**
//  * @route   POST /api/payments/marking/webhook
//  * @desc    Handle Flutterwave webhook for marking payments
//  * @access  Public (Flutterwave webhook)
//  */
// router.post(
//   '/marking/webhook',
//   validateRequest(markingPaymentValidation.webhook),
//   markingPaymentController.handleMarkingPaymentWebhook
// );

// /**
//  * @route   GET /api/payments/marking/verify/:paymentId
//  * @desc    Verify marking payment status
//  * @access  Private
//  */
// router.get(
//   '/marking/verify/:paymentId',
//   auth,
//   markingPaymentController.verifyMarkingPayment
// );

// /**
//  * @route   GET /api/payments/marking/history
//  * @desc    Get marking payment history for user
//  * @access  Private
//  */
// router.get(
//   '/marking/history',
//   auth,
//   markingPaymentController.getMarkingPaymentHistory
// );

// /**
//  * @route   GET /api/payments/marking/:paymentId
//  * @desc    Get marking payment details
//  * @access  Private
//  */
// router.get(
//   '/marking/:paymentId',
//   auth,
//   markingPaymentController.getMarkingPaymentDetails
// );

// /**
//  * @route   POST /api/payments/marking/:paymentId/cancel
//  * @desc    Cancel marking payment
//  * @access  Private
//  */
// router.post(
//   '/marking/:paymentId/cancel',
//   auth,
//   rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
//   markingPaymentController.cancelMarkingPayment
// );

// /**
//  * @route   POST /api/payments/marking/:paymentId/retry
//  * @desc    Retry failed marking payment
//  * @access  Private
//  */
// router.post(
//   '/marking/:paymentId/retry',
//   auth,
//   rateLimiter({ windowMs: 15 * 60 * 1000, max: 3 }),
//   markingPaymentController.retryMarkingPayment
// );

// // ==================== Partial Payment Routes ====================

// /**
//  * @route   POST /api/payments/marking/partial/process
//  * @desc    Process partial payment (1000 naira) to agent
//  * @access  Private (System/Admin)
//  */
// router.post(
//   '/marking/partial/process',
//   auth,
//   validateRequest(markingPaymentValidation.processPartialPayment),
//   partialPaymentController.processPartialPayment
// );

// /**
//  * @route   POST /api/payments/marking/partial/release
//  * @desc    Release remaining payment to agent
//  * @access  Private (Property Owner)
//  */
// router.post(
//   '/marking/partial/release',
//   auth,
//   validateRequest(markingPaymentValidation.releasePayment),
//   partialPaymentController.releaseRemainingPayment
// );

// /**
//  * @route   POST /api/payments/marking/partial/timeout-compensation
//  * @desc    Process timeout compensation payment
//  * @access  Private (System/Admin)
//  */
// router.post(
//   '/marking/partial/timeout-compensation',
//   auth,
//   validateRequest(markingPaymentValidation.timeoutCompensation),
//   partialPaymentController.processTimeoutCompensation
// );

// /**
//  * @route   GET /api/payments/marking/partial/status/:markingJobId
//  * @desc    Get partial payment status for marking job
//  * @access  Private
//  */
// router.get(
//   '/marking/partial/status/:markingJobId',
//   auth,
//   partialPaymentController.getPartialPaymentStatus
// );

// /**
//  * @route   GET /api/payments/marking/partial/agent-history
//  * @desc    Get agent's partial payment history
//  * @access  Private (Agent)
//  */
// router.get(
//   '/marking/partial/agent-history',
//   auth,
//   partialPaymentController.getAgentPartialPayments
// );

// /**
//  * @route   GET /api/payments/marking/partial/pending
//  * @desc    Calculate pending partial payments for agent
//  * @access  Private (Agent)
//  */
// router.get(
//   '/marking/partial/pending',
//   auth,
//   partialPaymentController.calculatePendingPartialPayments
// );

// /**
//  * @route   GET /api/payments/marking/partial/breakdown/:markingJobId
//  * @desc    Get payment breakdown for marking job
//  * @access  Private
//  */
// router.get(
//   '/marking/partial/breakdown/:markingJobId',
//   auth,
//   partialPaymentController.getPaymentBreakdown
// );

// export default router;