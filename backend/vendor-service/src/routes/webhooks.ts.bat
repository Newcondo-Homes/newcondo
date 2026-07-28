// backend/payment-service/src/routes/webhooks.ts
import { Router } from 'express';
import { webhookController } from '../controllers/webhookController';
import { webhookMiddleware } from '../middleware/webhookMiddleware';
import { rateLimiterMiddleware } from '../../../shared/src/middleware/rateLimiter';

const router = Router();

// Webhook rate limiting (more generous than regular API calls)
const webhookRateLimit = rateLimiterMiddleware({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Webhook rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/webhooks/flutterwave/payment
 * @desc    Handle Flutterwave payment webhook
 * @access  Public (Flutterwave servers only)
 * @note    This endpoint receives payment notifications from Flutterwave
 */
router.post(
  '/flutterwave/payment',
  webhookRateLimit,
  webhookMiddleware.verifyFlutterwaveSignature,
  webhookController.handleFlutterwavePaymentWebhook
);

/**
 * @route   POST /api/webhooks/flutterwave/transfer
 * @desc    Handle Flutterwave transfer webhook
 * @access  Public (Flutterwave servers only)
 * @note    This endpoint receives transfer notifications from Flutterwave
 */
router.post(
  '/flutterwave/transfer',
  webhookRateLimit,
  webhookMiddleware.verifyFlutterwaveSignature,
  webhookController.handleFlutterwaveTransferWebhook
);

/**
 * @route   POST /api/webhooks/flutterwave/refund
 * @desc    Handle Flutterwave refund webhook
 * @access  Public (Flutterwave servers only)
 * @note    This endpoint receives refund notifications from Flutterwave
 */
router.post(
  '/flutterwave/refund',
  webhookRateLimit,
  webhookMiddleware.verifyFlutterwaveSignature,
  webhookController.handleFlutterwaveRefundWebhook
);

/**
 * @route   POST /api/webhooks/flutterwave/virtual-account
 * @desc    Handle Flutterwave virtual account webhook
 * @access  Public (Flutterwave servers only)
 * @note    This endpoint receives virtual account notifications from Flutterwave
 */
router.post(
  '/flutterwave/virtual-account',
  webhookRateLimit,
  webhookMiddleware.verifyFlutterwaveSignature,
  webhookController.handleFlutterwaveVirtualAccountWebhook
);

/**
 * @route   POST /api/webhooks/flutterwave/dispute
 * @desc    Handle Flutterwave dispute webhook
 * @access  Public (Flutterwave servers only)
 * @note    This endpoint receives dispute notifications from Flutterwave
 */
router.post(
  '/flutterwave/dispute',
  webhookRateLimit,
  webhookMiddleware.verifyFlutterwaveSignature,
  webhookController.handleFlutterwaveDisputeWebhook
);

export default router;


// import express from 'express';
// import { webhookVerification } from '../middleware/webhookVerification';
// import {
//   handleFlutterwaveWebhook,
//   handleChargeCompletedWebhook,
//   handleTransferWebhook,
//   handleDisputeWebhook,
//   handleRefundWebhook,
//   handleVirtualAccountWebhook,
//   getWebhookStatus,
//   reprocessWebhook
// } from '../controllers/webhookController';
// import { authMiddleware } from '../../../shared/src/middleware/auth';
// import { validateRequest } from '../../../shared/src/middleware/validation';
// import { paymentValidation } from '../middleware/paymentValidation';

// const router = express.Router();

// /**
//  * @route   POST /api/webhooks/flutterwave
//  * @desc    Handle Flutterwave webhook notifications
//  * @access  Public (with signature verification)
//  */
// router.post(
//   '/flutterwave',
//   express.raw({ type: 'application/json' }), // Raw body for signature verification
//   webhookVerification.verifyFlutterwaveSignature,
//   handleFlutterwaveWebhook
// );

// /**
//  * @route   POST /api/webhooks/flutterwave/charge-completed
//  * @desc    Handle charge completed webhook specifically
//  * @access  Public (with signature verification)
//  */
// router.post(
//   '/flutterwave/charge-completed',
//   express.raw({ type: 'application/json' }),
//   webhookVerification.verifyFlutterwaveSignature,
//   handleChargeCompletedWebhook
// );

// /**
//  * @route   POST /api/webhooks/flutterwave/transfer
//  * @desc    Handle transfer webhook events
//  * @access  Public (with signature verification)
//  */
// router.post(
//   '/flutterwave/transfer',
//   express.raw({ type: 'application/json' }),
//   webhookVerification.verifyFlutterwaveSignature,
//   handleTransferWebhook
// );

// /**
//  * @route   POST /api/webhooks/flutterwave/dispute
//  * @desc    Handle dispute webhook events
//  * @access  Public (with signature verification)
//  */
// router.post(
//   '/flutterwave/dispute',
//   express.raw({ type: 'application/json' }),
//   webhookVerification.verifyFlutterwaveSignature,
//   handleDisputeWebhook
// );

// /**
//  * @route   POST /api/webhooks/flutterwave/refund
//  * @desc    Handle refund webhook events
//  * @access  Public (with signature verification)
//  */
// router.post(
//   '/flutterwave/refund',
//   express.raw({ type: 'application/json' }),
//   webhookVerification.verifyFlutterwaveSignature,
//   handleRefundWebhook
// );

// /**
//  * @route   POST /api/webhooks/flutterwave/virtual-account
//  * @desc    Handle virtual account webhook events
//  * @access  Public (with signature verification)
//  */
// router.post(
//   '/flutterwave/virtual-account',
//   express.raw({ type: 'application/json' }),
//   webhookVerification.verifyFlutterwaveSignature,
//   handleVirtualAccountWebhook
// );

// // Protected webhook management endpoints
// router.use(authMiddleware); // Apply auth for management endpoints

// /**
//  * @route   GET /api/webhooks/status/:webhookId
//  * @desc    Get webhook processing status
//  * @access  Private (Admin only)
//  */
// router.get(
//   '/status/:webhookId',
//   validateRequest(paymentValidation.getWebhookStatus),
//   getWebhookStatus
// );

// /**
//  * @route   POST /api/webhooks/reprocess/:webhookId
//  * @desc    Reprocess failed webhook
//  * @access  Private (Admin only)
//  */
// router.post(
//   '/reprocess/:webhookId',
//   validateRequest(paymentValidation.reprocessWebhook),
//   reprocessWebhook
// );

// /**
//  * @route   GET /api/webhooks/health
//  * @desc    Webhook endpoint health check
//  * @access  Public
//  */
// router.get('/health', (req, res) => {
//   res.status(200).json({
//     status: 'success',
//     message: 'Webhook endpoint is healthy',
//     timestamp: new Date().toISOString()
//   });
// });

// export default router;