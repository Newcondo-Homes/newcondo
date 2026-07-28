import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { virtualAccountLogger } from '../utils/virtualAccountLogger';
import { redisClient } from '@newcondo/db/redis'; // Assumed Redis client import from the shared db package

/**
 * Extending the Request interface to attach validated data
 */
declare global {
  namespace Express {
    interface Request {
      validatedWebhookData?: z.infer<typeof FlutterwaveWebhookSchema> | z.infer<typeof BalanceUpdateSchema> | z.infer<typeof TransactionStatusSchema>;
    }
  }
}

/**
 * Flutterwave webhook payload validation schemas
 */
const FlutterwaveWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.number().optional(),
    account_id: z.string().optional(),
    account_number: z.string(),
    account_name: z.string().optional(),
    tx_ref: z.string().optional(),
    transaction_id: z.string().optional(),
    amount: z.number(),
    currency: z.string().default('NGN'),
    status: z.string(),
    created_at: z.string(),
    narration: z.string().optional(),
    bank_code: z.string().optional(),
    is_active: z.boolean().optional(),
    reason: z.string().optional(),
  }).passthrough(), // Allow additional fields
  event_type: z.string().optional(),
});

const BalanceUpdateSchema = z.object({
  account_number: z.string(),
  available_balance: z.number(),
  currency: z.string().default('NGN'),
  updated_at: z.string().optional(),
});

const TransactionStatusSchema = z.object({
  transaction_id: z.string(),
  tx_ref: z.string().optional(),
  status: z.string(),
  updated_at: z.string().optional(),
});

/**
 * Middleware to validate webhook signature
 */
export const validateWebhookSignature = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const signature = req.headers['verif-hash'] as string;
    const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      virtualAccountLogger.error('Webhook secret not configured');
      res.status(500).json({ error: 'Webhook secret not configured' });
      return;
    }

    if (!signature) {
      virtualAccountLogger.warn('Missing webhook signature');
      res.status(401).json({ error: 'Missing signature' });
      return;
    }

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Verify signature
    const isValidSignature = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValidSignature) {
      virtualAccountLogger.warn('Invalid webhook signature', {
        received: signature,
        expected: expectedSignature
      });
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    virtualAccountLogger.info('Webhook signature validated successfully');
    next();

  } catch (error) {
    virtualAccountLogger.error('Signature validation error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({ error: 'Signature validation failed' });
  }
};

/**
 * Middleware to validate Flutterwave webhook payload structure
 */
export const validateFlutterwaveWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validationResult = FlutterwaveWebhookSchema.safeParse(req.body);

    if (!validationResult.success) {
      virtualAccountLogger.warn('Invalid webhook payload structure', {
        errors: validationResult.error.errors,
        payload: req.body
      });

      res.status(400).json({
        error: 'Invalid webhook payload',
        details: validationResult.error.errors
      });
      return;
    }

    // Attach validated data to request
    req.validatedWebhookData = validationResult.data;
    
    virtualAccountLogger.info('Webhook payload validated', {
      event: validationResult.data.event,
      accountNumber: validationResult.data.data.account_number
    });

    next();

  } catch (error) {
    virtualAccountLogger.error('Webhook payload validation error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({ error: 'Payload validation failed' });
  }
};

/**
 * Middleware to validate balance update webhook payload
 */
export const validateBalanceUpdateWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validationResult = BalanceUpdateSchema.safeParse(req.body);

    if (!validationResult.success) {
      virtualAccountLogger.warn('Invalid balance update payload', {
        errors: validationResult.error.errors,
        payload: req.body
      });

      res.status(400).json({
        error: 'Invalid balance update payload',
        details: validationResult.error.errors
      });
      return;
    }

    req.validatedWebhookData = validationResult.data;
    next();

  } catch (error) {
    virtualAccountLogger.error('Balance update validation error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({ error: 'Balance update validation failed' });
  }
};

/**
 * Middleware to validate transaction status webhook payload
 */
export const validateTransactionStatusWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validationResult = TransactionStatusSchema.safeParse(req.body);

    if (!validationResult.success) {
      virtualAccountLogger.warn('Invalid transaction status payload', {
        errors: validationResult.error.errors,
        payload: req.body
      });

      res.status(400).json({
        error: 'Invalid transaction status payload',
        details: validationResult.error.errors
      });
      return;
    }

    req.validatedWebhookData = validationResult.data;
    next();

  } catch (error) {
    virtualAccountLogger.error('Transaction status validation error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({ error: 'Transaction status validation failed' });
  }
};

/**
 * Middleware to log webhook requests for debugging
 */
export const logWebhookRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log incoming request
  virtualAccountLogger.info('Incoming webhook request', {
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'user-agent': req.headers['user-agent'],
      'verif-hash': req.headers['verif-hash'] ? '[PRESENT]' : '[MISSING]'
    },
    body: JSON.stringify(req.body).substring(0, 500) // Truncate for logging
  });

  // Log response when request completes
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - startTime;
    
    virtualAccountLogger.info('Webhook request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: body ? body.length : 0
    });

    return originalSend.call(this, body);
  };

  next();
};

/**
 * Middleware to handle webhook idempotency
 */
export const handleWebhookIdempotency = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Determine a unique key for the webhook event
    const eventType = req.body?.event;
    const transactionId = req.body?.data?.id || req.body?.data?.transaction_id || req.body?.data?.tx_ref;

    // Skip idempotency check if a unique identifier is missing
    if (!eventType || !transactionId) {
      virtualAccountLogger.warn('Missing event or transaction ID for idempotency check, skipping.', { body: req.body });
      return next();
    }

    const idempotencyKey = `webhook:flutterwave:${eventType}:${transactionId}`;
    const ttlInSeconds = 60 * 60 * 24 * 7; // 7 days TTL for the key

    // Check if the request has already been processed using Redis
    const isProcessed = await redisClient.get(idempotencyKey);

    if (isProcessed) {
      virtualAccountLogger.info('Duplicate webhook detected, returning cached success response.', { idempotencyKey });
      // Respond with 200 OK to acknowledge receipt without reprocessing
      return res.status(200).json({ message: 'OK - Webhook already processed' });
    }

    // If it's a new request, proceed with the handler logic
    // We set a listener to store the key *after* the response is sent successfully
    res.on('finish', async () => {
      // Only store the key for successful requests (e.g., 2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await redisClient.set(idempotencyKey, 'processed', { EX: ttlInSeconds });
          virtualAccountLogger.info('Idempotency key stored successfully.', { idempotencyKey });
        } catch (error) {
          virtualAccountLogger.error('Failed to store idempotency key', {
            idempotencyKey,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    });

    next();

  } catch (error) {
    virtualAccountLogger.error('Idempotency middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    // Fallback: Continue processing the request to avoid dropping valid events
    next();
  }
};