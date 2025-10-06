import { z } from 'zod';

/**
 * Schema for creating withdrawal request
 */
export const createWithdrawalSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .min(1000, 'Minimum withdrawal amount is ₦1,000')
    .max(10000000, 'Maximum withdrawal amount is ₦10,000,000'),
  bankAccountId: z.string().min(1, 'Bank account is required'),
  narration: z.string()
    .max(100, 'Narration must not exceed 100 characters')
    .optional()
});

/**
 * Schema for adding bank account
 */
export const addBankAccountSchema = z.object({
  accountNumber: z.string()
    .length(10, 'Account number must be 10 digits')
    .regex(/^\d+$/, 'Account number must contain only digits'),
  bankCode: z.string().min(1, 'Bank code is required'),
  accountName: z.string().optional()
});

/**
 * Schema for verifying bank account
 */
export const verifyBankAccountSchema = z.object({
  accountNumber: z.string()
    .length(10, 'Account number must be 10 digits')
    .regex(/^\d+$/, 'Account number must contain only digits'),
  bankCode: z.string().min(1, 'Bank code is required')
});

/**
 * Schema for automatic withdrawal settings
 */
export const automaticWithdrawalSchema = z.object({
  enabled: z.boolean(),
  bankAccountId: z.string().min(1, 'Bank account is required').optional(),
  frequency: z.enum(['immediate', 'daily', 'weekly', 'monthly']).optional(),
  minimumAmount: z.number()
    .positive('Minimum amount must be positive')
    .optional()
});

/**
 * Schema for withdrawal query parameters
 */
export const withdrawalQuerySchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional()
});

/**
 * Type exports
 */
export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type AddBankAccountInput = z.infer<typeof addBankAccountSchema>;
export type VerifyBankAccountInput = z.infer<typeof verifyBankAccountSchema>;
export type AutomaticWithdrawalInput = z.infer<typeof automaticWithdrawalSchema>;
export type WithdrawalQueryInput = z.infer<typeof withdrawalQuerySchema>;