// backend/shared/src/middleware/confirmationValidation.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Validation schemas for payment confirmation requests
 */

// Schema for confirming a payment
export const confirmPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().cuid('Invalid payment ID format'),
    confirmed: z.boolean({
      required_error: 'Confirmation status is required',
      invalid_type_error: 'Confirmation status must be a boolean'
    }),
    verificationNotes: z.string().min(10, 'Verification notes must be at least 10 characters').optional(),
    propertyConditionMatches: z.boolean().optional(),
    issuesFound: z.array(z.string()).optional()
  })
});

// Schema for requesting a refund
export const refundRequestSchema = z.object({
  body: z.object({
    paymentId: z.string().cuid('Invalid payment ID format'),
    reason: z.enum([
      'PROPERTY_NOT_AS_DESCRIBED',
      'PROPERTY_UNAVAILABLE',
      'FRAUD_SUSPECTED',
      'OWNER_CANCELLED',
      'DUPLICATE_BOOKING',
      'OTHER'
    ], {
      required_error: 'Refund reason is required',
      invalid_type_error: 'Invalid refund reason'
    }),
    description: z.string()
      .min(20, 'Refund description must be at least 20 characters')
      .max(1000, 'Refund description must not exceed 1000 characters'),
    evidence: z.array(z.string().url('Invalid evidence URL')).optional()
  })
});

// Schema for checking confirmation status
export const checkConfirmationStatusSchema = z.object({
  params: z.object({
    paymentId: z.string().cuid('Invalid payment ID format')
  })
});

// Schema for manual release (admin only)
export const manualReleaseSchema = z.object({
  body: z.object({
    paymentId: z.string().cuid('Invalid payment ID format'),
    reason: z.string().min(10, 'Release reason must be at least 10 characters'),
    overrideConfirmationPeriod: z.boolean().optional()
  })
});

// Schema for property verification upload
export const propertyVerificationSchema = z.object({
  body: z.object({
    paymentId: z.string().cuid('Invalid payment ID format'),
    verificationImages: z.array(z.string().url('Invalid image URL')).min(1, 'At least one verification image is required'),
    verificationNotes: z.string().max(500, 'Verification notes must not exceed 500 characters').optional(),
    propertyAccessible: z.boolean({
      required_error: 'Property accessibility status is required'
    }),
    matchesListing: z.boolean({
      required_error: 'Listing match status is required'
    })
  })
});

/**
 * Middleware to validate confirmation requests
 */
export const validateConfirmation = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware to check if confirmation period is still active
 */
export const checkConfirmationPeriod = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { paymentId } = req.body;
    
    // This will be implemented with actual database check in the service
    // For now, we just pass through
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to ensure user is authorized to confirm payment
 */
export const ensurePaymentOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    const { paymentId } = req.body || req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    // Actual ownership check will be done in the service layer
    // This middleware just ensures user is authenticated
    next();
  } catch (error) {
    next(error);
  }
};