// File: backend/payment-service/src/middleware/webhookVerification.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

// Flutterwave webhook verification
export const verifyFlutterwaveWebhook = (req: Request, res: Response, next: NextFunction) => {
  try {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    const signature = req.headers['verif-hash'] as string;
    
    if (!secretHash) {
      console.error('FLUTTERWAVE_SECRET_HASH not configured');
      return res.status(500).json({
        success: false,
        message: 'Webhook verification not configured',
      });
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook signature',
      });
    }

    // Verify the signature
    if (signature !== secretHash) {
      console.warn('Invalid webhook signature:', signature);
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    next();
  } catch (error) {
    console.error('Webhook verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Webhook verification failed',
    });
  }
};

// Alternative webhook verification using HMAC (if Flutterwave supports it)
export const verifyFlutterwaveWebhookHMAC = (req: Request, res: Response, next: NextFunction) => {
  try {
    const secretKey = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    const signature = req.headers['flw-signature'] as string;
    const payload = JSON.stringify(req.body);
    
    if (!secretKey) {
      console.error('FLUTTERWAVE_WEBHOOK_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Webhook verification not configured',
      });
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook signature',
      });
    }

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex');

    // Compare signatures
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      console.warn('Invalid webhook HMAC signature');
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    next();
  } catch (error) {
    console.error('HMAC webhook verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Webhook verification failed',
    });
  }
};

// Rate limiting for webhooks
export const webhookRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many webhook requests from this IP',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use IP and user agent for rate limiting
    return `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
  },
  skip: (req: Request) => {
    // Skip rate limiting for known Flutterwave IPs (if available)
    const flutterwaveIPs = process.env.FLUTTERWAVE_IPS?.split(',') || [];
    return flutterwaveIPs.includes(req.ip);
  },
});

// Webhook deduplication middleware
const processedWebhooks = new Set<string>();
const WEBHOOK_CACHE_SIZE = 10000;
const WEBHOOK_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const deduplicateWebhook = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data } = req.body;
    
    if (!data || !data.flw_ref) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook payload - missing flw_ref',
      });
    }

    const webhookId = `${data.flw_ref}-${data.status}-${data.created_at}`;

    // Check if webhook has been processed
    if (processedWebhooks.has(webhookId)) {
      console.log(`Duplicate webhook ignored: ${webhookId}`);
      return res.status(200).json({
        success: true,
        message: 'Webhook already processed',
      });
    }

    // Add to processed set
    processedWebhooks.add(webhookId);

    // Clean up old entries periodically
    if (processedWebhooks.size > WEBHOOK_CACHE_SIZE) {
      console.log('Clearing old webhook cache entries...');
      const oldKeys = Array.from(processedWebhooks).slice(0, processedWebhooks.size - WEBHOOK_CACHE_SIZE);
      oldKeys.forEach(key => processedWebhooks.delete(key));
    }

    next();
  } catch (error) {
    console.error('Webhook deduplication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Webhook deduplication failed',
    });
  }
};