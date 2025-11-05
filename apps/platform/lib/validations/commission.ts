import { z } from 'zod';

export const commissionCalculationSchema = z.object({
  rentAmount: z.number().positive('Rent amount must be positive'),
  hasListingAgent: z.boolean().default(false),
  hasSubAgent: z.boolean().default(false),
  platformCommissionRate: z.number().min(0).max(1).default(0.20), // 20%
  agentCommissionRate: z.number().min(0).max(1).default(0.50), // 50% of platform commission
});

export const commissionEarningsQuerySchema = z.object({
  userId: z.string().cuid().optional(), // Defaults to current user
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'HELD', 'RELEASED', 'WITHDRAWN']).optional(),
  propertyId: z.string().cuid().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const commissionBreakdownSchema = z.object({
  paymentId: z.string().cuid(),
  includeSubAgentDetails: z.boolean().default(true),
});

export const withdrawCommissionSchema = z.object({
  amount: z.number().positive('Withdrawal amount must be positive'),
  bankAccountId: z.string().optional(), // Reference to saved bank account
  bankCode: z.string().regex(/^\d{3}$/).optional(), // Nigerian bank code
  accountNumber: z.string().regex(/^\d{10}$/).optional(), // Nigerian account number
  accountName: z.string().min(3).max(100).optional(),
  reason: z.string().max(500).optional(),
}).refine(
  (data) => {
    // If bankAccountId not provided, all bank details must be provided
    if (!data.bankAccountId) {
      return !!(data.bankCode && data.accountNumber && data.accountName);
    }
    return true;
  },
  {
    message: 'Bank details required when not using saved account',
    path: ['bankCode'],
  }
);

export const agentReferralStatsSchema = z.object({
  agentId: z.string().cuid().optional(), // Defaults to current user
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  includeSubAgents: z.boolean().default(true),
  metrics: z.array(
    z.enum([
      'TOTAL_REFERRALS',
      'SUCCESSFUL_CONVERSIONS',
      'TOTAL_EARNINGS',
      'PENDING_EARNINGS',
      'CONVERSION_RATE',
    ])
  ).optional(),
});

export const topPerformingPropertiesSchema = z.object({
  userId: z.string().cuid().optional(),
  timeframe: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  metric: z.enum(['REVENUE', 'VIEWS', 'CONVERSIONS', 'COMMISSION']).default('REVENUE'),
  limit: z.number().int().positive().max(50).default(10),
});

export const commissionHistoryExportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'pdf']),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  includeTransactionDetails: z.boolean().default(true),
});

export const setAutoWithdrawalSchema = z.object({
  enabled: z.boolean(),
  threshold: z.number().positive().optional(), // Minimum balance before auto-withdrawal
  frequency: z.enum(['IMMEDIATE', 'DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  bankAccountId: z.string().optional(),
}).refine(
  (data) => {
    if (data.enabled) {
      return !!(data.threshold && data.frequency && data.bankAccountId);
    }
    return true;
  },
  {
    message: 'Threshold, frequency, and bank account required when enabling auto-withdrawal',
    path: ['threshold'],
  }
);

export type CommissionCalculation = z.infer<typeof commissionCalculationSchema>;
export type CommissionEarningsQuery = z.infer<typeof commissionEarningsQuerySchema>;
export type CommissionBreakdown = z.infer<typeof commissionBreakdownSchema>;
export type WithdrawCommission = z.infer<typeof withdrawCommissionSchema>;
export type AgentReferralStats = z.infer<typeof agentReferralStatsSchema>;
export type TopPerformingProperties = z.infer<typeof topPerformingPropertiesSchema>;
export type CommissionHistoryExport = z.infer<typeof commissionHistoryExportSchema>;
export type SetAutoWithdrawal = z.infer<typeof setAutoWithdrawalSchema>;