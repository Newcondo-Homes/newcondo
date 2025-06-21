import { z } from 'zod';

// Login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters long'),
  rememberMe: z.boolean().optional(),
});

// Register validation schema
export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .optional()
    .refine((phone) => {
      if (!phone) return true; // Optional field
      // Nigerian phone number validation
      const phoneRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
      return phoneRegex.test(phone.replace(/\s+/g, ''));
    }, 'Please enter a valid Nigerian phone number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['OWNER', 'AGENT', 'RENTER'], {
    required_error: 'Please select your role',
  }),
  terms: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// OTP verification schema
export const otpVerificationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  otp: z
    .string()
    .min(6, 'OTP must be 6 digits')
    .max(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
  type: z.enum(['EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET', 'LOGIN']),
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

// Password reset schema
export const passwordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  otp: z
    .string()
    .min(6, 'Reset code must be 6 digits')
    .max(6, 'Reset code must be 6 digits')
    .regex(/^\d{6}$/, 'Reset code must contain only numbers'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  token: z.string().optional(), // For direct reset links
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Profile update schema
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must be less than 50 characters')
    .optional(),
  phone: z
    .string()
    .optional()
    .refine((phone) => {
      if (!phone) return true;
      const phoneRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
      return phoneRegex.test(phone.replace(/\s+/g, ''));
    }, 'Please enter a valid Nigerian phone number'),
  dateOfBirth: z
    .string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18;
    }, 'You must be at least 18 years old'),
  address: z.string().max(200, 'Address must be less than 200 characters').optional(),
  city: z.string().max(50, 'City must be less than 50 characters').optional(),
  state: z.string().max(50, 'State must be less than 50 characters').optional(),
  country: z.string().max(50, 'Country must be less than 50 characters').optional(),
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Email update schema
export const emailUpdateSchema = z.object({
  newEmail: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required to change email'),
});

// Phone update schema
export const phoneUpdateSchema = z.object({
  newPhone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((phone) => {
      const phoneRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
      return phoneRegex.test(phone.replace(/\s+/g, ''));
    }, 'Please enter a valid Nigerian phone number'),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type OTPVerificationFormData = z.infer<typeof otpVerificationSchema>;
export type PasswordResetRequestFormData = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type EmailUpdateFormData = z.infer<typeof emailUpdateSchema>;
export type PhoneUpdateFormData = z.infer<typeof phoneUpdateSchema>;

// Helper functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateNigerianPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('234')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+234${cleaned.slice(1)}`;
  } else if (cleaned.length === 10) {
    return `+234${cleaned}`;
  }
  
  return phone; // Return original if can't format
};