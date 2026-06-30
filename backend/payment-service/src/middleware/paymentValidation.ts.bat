// File: backend/payment-service/src/middleware/paymentValidation.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PaymentType, PaymentStatus } from '@prisma/client';

// Validation schemas
const initiatePaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().default('NGN'),
    paymentType: z.nativeEnum(PaymentType),
    description: z.string().optional(),
    // Rental payment specific
    rentalId: z.string().optional(),
    propertyId: z.string().optional(),
    unitId: z.string().optional(),
    // Marking job payment specific
    markingJobId: z.string().optional(),
    // Customer info
    customerEmail: z.string().email('Invalid email format'),
    customerPhone: z.string().min(10, 'Invalid phone number'),
    customerName: z.string().min(2, 'Customer name required'),
    // Payment method preference
    paymentMethods: z.array(z.string()).optional(),
  }),
});

const verifyPaymentSchema = z.object({
  params: z.object({
    transactionId: z.string().min(1, 'Transaction ID required'),
  }),
});

const refundPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().min(1, 'Payment ID required'),
    amount: z.number().positive('Refund amount must be positive').optional(),
    reason: z.string().min(5, 'Refund reason required'),
  }),
});

const retryPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().min(1, 'Payment ID required'),
  }),
});

const createVirtualAccountSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID required'),
    propertyId: z.string().optional(),
    accountName: z.string().min(2, 'Account name required'),
    email: z.string().email('Invalid email format'),
    phone: z.string().min(10, 'Invalid phone number'),
    bvn: z.string().length(11, 'BVN must be 11 digits').optional(),
  }),
});

const webhookSchema = z.object({
  body: z.object({
    event: z.string(),
    data: z.object({
      id: z.number(),
      tx_ref: z.string(),
      flw_ref: z.string(),
      device_fingerprint: z.string(),
      amount: z.number(),
      currency: z.string(),
      charged_amount: z.number(),
      app_fee: z.number(),
      merchant_fee: z.number(),
      processor_response: z.string(),
      auth_model: z.string(),
      ip: z.string(),
      narration: z.string(),
      status: z.string(),
      payment_type: z.string(),
      created_at: z.string(),
      account_id: z.number(),
      customer: z.object({
        id: z.number(),
        name: z.string(),
        phone_number: z.string(),
        email: z.string(),
        created_at: z.string(),
      }),
    }),
  }),
  headers: z.object({
    'verif-hash': z.string().optional(),
    'flw-signature': z.string().optional(),
  }),
});

// Middleware functions
export const validateInitiatePayment = (req: Request, res: Response, next: NextFunction) => {
  try {
    initiatePaymentSchema.parse({ body: req.body });
    
    // Additional business logic validations
    const { paymentType, rentalId, markingJobId } = req.body;
    
    if (paymentType === PaymentType.RENT && !rentalId) {
      return res.status(400).json({
        success: false,
        message: 'Rental ID is required for rent payments',
      });
    }
    
    if (paymentType === PaymentType.PROPERTY_MARKING && !markingJobId) {
      return res.status(400).json({
        success: false,
        message: 'Marking job ID is required for property marking payments',
      });
    }
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
    });
  }
};

export const validateVerifyPayment = (req: Request, res: Response, next: NextFunction) => {
  try {
    verifyPaymentSchema.parse({ params: req.params });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID',
        errors: error.errors,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
    });
  }
};

export const validateRefundPayment = (req: Request, res: Response, next: NextFunction) => {
  try {
    refundPaymentSchema.parse({ body: req.body });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
    });
  }
};

export const validateRetryPayment = (req: Request, res: Response, next: NextFunction) => {
  try {
    retryPaymentSchema.parse({ body: req.body });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID',
        errors: error.errors,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
    });
  }
};

export const validateCreateVirtualAccount = (req: Request, res: Response, next: NextFunction) => {
  try {
    createVirtualAccountSchema.parse({ body: req.body });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
    });
  }
};

export const validateWebhook = (req: Request, res: Response, next: NextFunction) => {
  try {
    webhookSchema.parse({ 
      body: req.body,
      headers: req.headers 
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook payload',
        errors: error.errors,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
    });
  }
};

// Amount validation helper
export const validateAmount = (amount: number, minAmount: number = 100): boolean => {
  return amount >= minAmount && amount <= 10000000; // Max 10M NGN
};

// Currency validation helper
export const validateCurrency = (currency: string): boolean => {
  const supportedCurrencies = ['NGN', 'USD', 'GBP', 'EUR'];
  return supportedCurrencies.includes(currency);
};

// Payment type validation helper
export const validatePaymentTypeContext = (
  paymentType: PaymentType,
  context: { rentalId?: string; markingJobId?: string; propertyId?: string }
): { isValid: boolean; message?: string } => {
  switch (paymentType) {
    case PaymentType.RENT:
      if (!context.rentalId && !context.propertyId) {
        return {
          isValid: false,
          message: 'Rental ID or Property ID required for rent payments',
        };
      }
      break;
    case PaymentType.PROPERTY_MARKING:
      if (!context.markingJobId) {
        return {
          isValid: false,
          message: 'Marking job ID required for property marking payments',
        };
      }
      break;
    case PaymentType.DEPOSIT:
      if (!context.propertyId) {
        return {
          isValid: false,
          message: 'Property ID required for deposit payments',
        };
      }
      break;
  }
  
  return { isValid: true };
};