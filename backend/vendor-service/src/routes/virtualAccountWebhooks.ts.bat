// backend/payment-service/src/routes/virtualAccountWebhooks.ts

import { Router } from 'express';
import { VirtualAccountWebhookController } from '../controllers/virtualAccountWebhookController';
import { validateWebhookSignature } from '../middleware/webhookValidation';
import { rateLimiter } from '@newcondo/shared/middleware/rateLimiter';

const router = Router();
const webhookController = new VirtualAccountWebhookController();

/**
 * Virtual Account Webhook Routes
 * These routes handle incoming webhooks from Flutterwave for virtual account events
 */

// Main Flutterwave webhook endpoint
router.post(
  '/flutterwave',
  rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Allow 100 webhook requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many webhook requests',
  }),
  validateWebhookSignature,
  webhookController.handleFlutterwaveWebhook
);

// Specific webhook handlers for different event types
router.post(
  '/balance-update',
  rateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many balance update requests',
  }),
  validateWebhookSignature,
  webhookController.handleBalanceUpdate
);

router.post(
  '/transaction-status',
  rateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many transaction status requests',
  }),
  validateWebhookSignature,
  webhookController.handleTransactionStatus
);

// Webhook management endpoints (with authentication)
router.get(
  '/status/:webhookId',
  // Note: Add authentication middleware here when implemented
  webhookController.getWebhookStatus
);

router.post(
  '/retry/:webhookId',
  // Note: Add authentication middleware here when implemented
  webhookController.retryWebhook
);

// Health check endpoint for webhook service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Virtual account webhook service is healthy',
    timestamp: new Date().toISOString(),
    service: 'virtual-account-webhooks'
  });
});

// Test endpoint for webhook validation (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test', (req, res) => {
    res.json({
      success: true,
      message: 'Test webhook received',
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });
  });
}

export { router as virtualAccountWebhookRoutes };