import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Verification validation schemas
const verifyEmailSchema = z.object({
  body: z.object({
    code: z.string()
      .min(6, 'Verification code must be 6 digits')
      .max(6, 'Verification code must be 6 digits')
      .regex(/^\d{6}$/, 'Verification code must contain only numbers')
  })
});

// Validation middleware factory
const createValidationMiddleware = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: 'VALIDATION_ERROR'
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: validationErrors
        });
      }
      
      next(error);
    }
  };
};

export const verificationValidation = {
  sendEmailVerification: (req: Request, res: Response, next: NextFunction) => {
    // No additional validation needed for sending email verification
    // User authentication is handled by authMiddleware
    next();
  },
  
  verifyEmail: createValidationMiddleware(verifyEmailSchema)
};