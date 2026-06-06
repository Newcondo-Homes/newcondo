// backend/auth-service/src/validations/authValidation.ts
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Validation Schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().optional(),
    userType: z.enum(['OWNER', 'AGENT', 'RENTER']).optional(),
    phone: z.string().optional(),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
});

export const sendOtpSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, 'Email or phone is required'),
    type: z.enum(['EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET', 'LOGIN']),
  })
});

export const verifyOtpSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, 'Email or phone is required'),
    code: z.string().length(6, 'OTP must be 6 digits'),
    type: z.enum(['EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET', 'LOGIN']),
  })
});

export const resendOtpSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, 'Email or phone is required'),
    type: z.enum(['EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET', 'LOGIN']),
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    dateOfBirth: z.string().optional(),
    companyName: z.string().optional(),
    businessRegNumber: z.string().optional(),
  })
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    code: z.string().length(6, 'OTP must be 6 digits'),
  })
});

export const verifyPhoneSchema = z.object({
  body: z.object({
    phone: z.string().min(1, 'Phone number is required'),
    code: z.string().length(6, 'OTP must be 6 digits'),
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  })
});

export const verify2FASchema = z.object({
  body: z.object({
    code: z.string().length(6, 'Code must be 6 digits'),
  })
});

// Middleware creator function
const createValidationMiddleware = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: result.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      // Attach validated data to request
      req.body = result.data.body;
      req.query = result.data.query;
      req.params = result.data.params;

      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
      });
    }
  };
};

// Export validation middleware functions
export const register = createValidationMiddleware(registerSchema);
export const login = createValidationMiddleware(loginSchema);
export const forgotPassword = createValidationMiddleware(forgotPasswordSchema);
export const resetPassword = createValidationMiddleware(resetPasswordSchema);
export const sendOtp = createValidationMiddleware(sendOtpSchema);
export const verifyOtp = createValidationMiddleware(verifyOtpSchema);
export const resendOtp = createValidationMiddleware(resendOtpSchema);
export const updateProfile = createValidationMiddleware(updateProfileSchema);
export const verifyEmail = createValidationMiddleware(verifyEmailSchema);
export const verifyPhone = createValidationMiddleware(verifyPhoneSchema);
export const changePassword = createValidationMiddleware(changePasswordSchema);
export const verify2FA = createValidationMiddleware(verify2FASchema);