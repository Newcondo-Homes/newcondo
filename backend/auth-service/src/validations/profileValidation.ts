// backend/auth-service/src/validations/profileValidation.ts
import { z } from 'zod';
import { Role } from '@newcondo/db';

export const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  
  email: z.string()
    .email('Invalid email format')
    .optional(),
  
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
  
  image: z.string()
    .url('Invalid image URL')
    .optional()
    .nullable(),
  
  dateOfBirth: z.string()
    .datetime('Invalid date format')
    .optional()
    .nullable()
    .transform(val => val ? new Date(val) : null),
  
  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address cannot exceed 500 characters')
    .optional()
    .nullable(),
  
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City cannot exceed 100 characters')
    .optional()
    .nullable(),
  
  state: z.string()
    .min(2, 'State must be at least 2 characters')
    .max(100, 'State cannot exceed 100 characters')
    .optional()
    .nullable(),
  
  country: z.string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country cannot exceed 100 characters')
    .optional(),
  
  // Agent-specific fields
  isAvailableForMarking: z.boolean().optional(),
  
  agentServiceAreas: z.array(z.string())
    .max(10, 'Cannot have more than 10 service areas')
    .optional()
}).refine(data => {
  // At least one field must be provided for update
  const fields = Object.values(data).filter(val => val !== undefined);
  return fields.length > 0;
}, {
  message: 'At least one field must be provided for update'
});

export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const agentProfileSchema = z.object({
  isAvailableForMarking: z.boolean(),
  
  agentServiceAreas: z.array(z.string())
    .min(1, 'At least one service area is required')
    .max(10, 'Cannot have more than 10 service areas'),
  
  // Optional fields for agent profile enhancement
  bio: z.string()
    .max(1000, 'Bio cannot exceed 1000 characters')
    .optional(),
  
  experience: z.number()
    .min(0, 'Experience cannot be negative')
    .max(50, 'Experience cannot exceed 50 years')
    .optional(),
  
  specializations: z.array(z.string())
    .max(5, 'Cannot have more than 5 specializations')
    .optional()
});

export const userPreferencesSchema = z.object({
  emailNotifications: z.object({
    propertyAlerts: z.boolean().default(true),
    markingJobUpdates: z.boolean().default(true),
    paymentReminders: z.boolean().default(true),
    marketingEmails: z.boolean().default(false)
  }).optional(),
  
  smsNotifications: z.object({
    urgentAlerts: z.boolean().default(true),
    markingJobAssignments: z.boolean().default(true),
    paymentConfirmations: z.boolean().default(true)
  }).optional(),
  
  privacy: z.object({
    showPhoneNumber: z.boolean().default(false),
    showEmail: z.boolean().default(false),
    allowContactFromAgents: z.boolean().default(true)
  }).optional(),
  
  language: z.enum(['en', 'ig', 'ha', 'yo']).default('en').optional(),
  
  currency: z.enum(['NGN', 'USD']).default('NGN').optional()
});

export const profileImageSchema = z.object({
  imageUrl: z.string()
    .url('Invalid image URL')
    .refine(url => {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      return allowedExtensions.some(ext => url.toLowerCase().includes(ext));
    }, 'Invalid image format. Only JPG, PNG, and WebP are allowed')
});

export const roleChangeRequestSchema = z.object({
  newRole: z.nativeEnum(Role),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
  
  // Additional documentation for role changes
  supportingDocuments: z.array(z.string().url())
    .max(5, 'Cannot upload more than 5 supporting documents')
    .optional()
});

//------------------------------------------------------------------------------------------------------------------------------------------------

import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateProfile = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 18) {
        throw new Error('You must be at least 18 years old');
      }
      if (age > 120) {
        throw new Error('Invalid date of birth');
      }
      return true;
    }),

  body('address')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),

  body('city')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('City can only contain letters and spaces'),

  body('state')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('State can only contain letters and spaces'),

  body('country')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Country can only contain letters and spaces'),

  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),

  body('isAvailableForMarking')
    .optional()
    .isBoolean()
    .withMessage('isAvailableForMarking must be a boolean'),

  body('agentServiceAreas')
    .optional()
    .isArray()
    .withMessage('Agent service areas must be an array')
    .custom((areas) => {
      if (areas && areas.length > 0) {
        for (const area of areas) {
          if (typeof area !== 'string' || area.length < 2 || area.length > 50) {
            throw new Error('Each service area must be a string between 2 and 50 characters');
          }
        }
      }
      return true;
    }),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  }
];

export const validatePasswordUpdate = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  }
];

export const validateEmailUpdate = [
  body('newEmail')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('otpCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP code must be 6 characters')
    .isNumeric()
    .withMessage('OTP code must contain only numbers'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  }
];

export const validatePhoneUpdate = [
  body('newPhone')
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('otpCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP code must be 6 characters')
    .isNumeric()
    .withMessage('OTP code must contain only numbers'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  }
];

export const validateAccountDeletion = [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  }
];