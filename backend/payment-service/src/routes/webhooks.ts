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