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