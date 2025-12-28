// apps/platform/lib/validations/reward.ts

import { z } from 'zod';

export const rewardRedemptionSchema = z.object({
  rewardId: z.string().cuid('Invalid reward ID'),
  method: z.enum(['bank_transfer', 'wallet_credit', 'service_credit']),
  bankDetails: z.object({
    accountNumber: z.string()
      .regex(/^\d{10}$/, 'Account number must be 10 digits'),
    accountName: z.string()
      .min(3, 'Account name must be at least 3 characters')
      .max(100, 'Account name must not exceed 100 characters'),
    bankCode: z.string()
      .regex(/^\d{3}$/, 'Bank code must be 3 digits'),
  }).optional(),
}).refine(
  (data) => {
    // Bank details required for bank_transfer
    if (data.method === 'bank_transfer' && !data.bankDetails) {
      return false;
    }
    return true;
  },
  {
    message: 'Bank details are required for bank transfer',
    path: ['bankDetails'],
  }
);

export const bulkRewardRedemptionSchema = z.object({
  rewardIds: z.array(z.string().cuid()).min(1).max(10),
  method: z.enum(['bank_transfer', 'wallet_credit', 'service_credit']),
  bankDetails: z.object({
    accountNumber: z.string().regex(/^\d{10}$/),
    accountName: z.string().min(3).max(100),
    bankCode: z.string().regex(/^\d{3}$/),
  }).optional(),
});

export const rewardQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
  rewardType: z.enum([
    'SERVICE_CREDIT',
    'SUBSCRIPTION_DISCOUNT',
    'RENT_CREDIT',
    'COMMISSION_CREDIT',
    'MAINTENANCE_VOUCHER',
    'CASH_REWARD'
  ]).optional(),
  isRedeemed: z.boolean().optional(),
  sortBy: z.enum(['createdAt', 'amount', 'status', 'expiresAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const rewardSummaryQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['type', 'status', 'month']).optional(),
});

export type RewardRedemptionInput = z.infer<typeof rewardRedemptionSchema>;
export type BulkRewardRedemptionInput = z.infer<typeof bulkRewardRedemptionSchema>;
export type RewardQuery = z.infer<typeof rewardQuerySchema>;
export type RewardSummaryQuery = z.infer<typeof rewardSummaryQuerySchema>;