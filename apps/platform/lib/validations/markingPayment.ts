// apps/platform/lib/validations/markingPayment.ts

import { z } from 'zod';

/**
 * Marking fee structure constants
 */
export const MARKING_FEES = {
  PROPERTY_OWNER_TO_AGENT: 20000, // 20,000 NGN
  PROPERTY_OWNER_TO_NEWCONDO: 25000, // 25,000 NGN
  AGENT_COMMISSION_PERCENTAGE: 0.25, // 25% of fee
  PARTIAL_PAYMENT_AMOUNT: 1000, // 1,000 NGN partial payment to agent
  CONFIRMATION_WINDOW_DAYS: 3, // 2-3 days for property owner to confirm
} as const;

/**
 * Initialize marking payment schema
 */
export const initializeMarkingPaymentSchema = z.object({
  markingJobId: z.string().cuid('Invalid marking job ID'),
  
  markingMethod: z.enum([
    'SELF',
    'NEWCONDO_ADMIN',
    'SOMEONE_I_KNOW',
    'ASSIGN_TO_AGENTS',
  ]),
  
  amount: z
    .number()
    .positive('Amount must be positive')
    .refine(
      (amount) => {
        // Validate amount matches marking fee structure
        return (
          amount === MARKING_FEES.PROPERTY_OWNER_TO_AGENT ||
          amount === MARKING_FEES.PROPERTY_OWNER_TO_NEWCONDO
        );
      },
      {
        message: `Amount must be either ${MARKING_FEES.PROPERTY_OWNER_TO_AGENT} or ${MARKING_FEES.PROPERTY_OWNER_TO_NEWCONDO} NGN`,
      }
    ),
  
  currency: z.literal('NGN'),
  
  paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'WALLET']),
  
  // Metadata for payment tracking
  metadata: z
    .object({
      propertyId: z.string().cuid(),
      propertyAddress: z.string(),
      contactPersonName: z.string(),
      contactPersonPhone: z.string(),
    })
    .optional(),
});

/**
 * Process payment callback schema (from Flutterwave)
 */
export const processPaymentCallbackSchema = z.object({
  transaction_id: z.string(),
  
  tx_ref: z.string(), // Our reference
  
  flw_ref: z.string(), // Flutterwave reference
  
  status: z.enum(['successful', 'failed', 'cancelled']),
  
  amount: z.number().positive(),
  
  currency: z.string(),
  
  customer: z.object({
    email: z.string().email(),
    phone_number: z.string().optional(),
    name: z.string(),
  }),
  
  charged_amount: z.number().positive(),
  
  payment_type: z.string(),
});

/**
 * Release agent payment schema
 */
export const releaseAgentPaymentSchema = z.object({
  markingJobId: z.string().cuid('Invalid marking job ID'),
  
  paymentId: z.string().cuid('Invalid payment ID'),
  
  releaseType: z.enum(['PARTIAL', 'FULL']),
  
  amount: z.number().positive('Amount must be positive'),
  
  notes: z.string().max(500).optional(),
});

/**
 * Payment confirmation schema
 */
export const confirmPaymentSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  
  verificationCode: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only digits')
    .optional(),
});

/**
 * Refund marking payment schema
 */
export const refundMarkingPaymentSchema = z.object({
  paymentId: z.string().cuid('Invalid payment ID'),
  
  markingJobId: z.string().cuid('Invalid marking job ID'),
  
  refundReason: z
    .string()
    .min(10, 'Refund reason must be at least 10 characters')
    .max(500, 'Refund reason must not exceed 500 characters'),
  
  refundAmount: z.number().positive('Refund amount must be positive').optional(),
  
  refundType: z.enum(['FULL', 'PARTIAL']).default('FULL'),
});

/**
 * Virtual account webhook schema
 */
export const virtualAccountWebhookSchema = z.object({
  event: z.enum(['charge.completed', 'transfer.completed']),
  
  data: z.object({
    id: z.number(),
    
    tx_ref: z.string(),
    
    flw_ref: z.string(),
    
    amount: z.number(),
    
    currency: z.string(),
    
    status: z.string(),
    
    customer: z.object({
      email: z.string().email(),
      name: z.string(),
    }),
    
    account_number: z.string().optional(),
    
    bank_code: z.string().optional(),
  }),
});

/**
 * Payment history query schema
 */
export const queryMarkingPaymentsSchema = z.object({
  markingJobId: z.string().cuid().optional(),
  
  userId: z.string().cuid().optional(),
  
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED', 'HELD', 'RELEASED']).optional(),
  
  paymentType: z.literal('PROPERTY_MARKING').optional(),
  
  dateFrom: z.string().datetime().or(z.date()).optional(),
  
  dateTo: z.string().datetime().or(z.date()).optional(),
  
  minAmount: z.number().positive().optional(),
  
  maxAmount: z.number().positive().optional(),
  
  page: z.number().int().positive().default(1),
  
  limit: z.number().int().positive().max(100).default(20),
  
  sortBy: z.enum(['createdAt', 'amount', 'status']).default('createdAt'),
  
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Split payment calculation schema
 */
export const calculatePaymentSplitSchema = z.object({
  totalAmount: z.number().positive('Total amount must be positive'),
  
  markingMethod: z.enum([
    'ASSIGN_TO_AGENTS',
    'NEWCONDO_ADMIN',
  ]),
  
  agentCommissionPercentage: z
    .number()
    .min(0)
    .max(1)
    .default(MARKING_FEES.AGENT_COMMISSION_PERCENTAGE),
});

/**
 * Wallet balance query schema
 */
export const getWalletBalanceSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  
  includeHeldFunds: z.boolean().default(true),
  
  includeTransactionHistory: z.boolean().default(false),
  
  transactionLimit: z.number().int().positive().max(50).default(10),
});

// Type exports
export type InitializeMarkingPaymentInput = z.infer<typeof initializeMarkingPaymentSchema>;
export type ProcessPaymentCallbackInput = z.infer<typeof processPaymentCallbackSchema>;
export type ReleaseAgentPaymentInput = z.infer<typeof releaseAgentPaymentSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
export type RefundMarkingPaymentInput = z.infer<typeof refundMarkingPaymentSchema>;
export type VirtualAccountWebhookInput = z.infer<typeof virtualAccountWebhookSchema>;
export type QueryMarkingPaymentsInput = z.infer<typeof queryMarkingPaymentsSchema>;
export type CalculatePaymentSplitInput = z.infer<typeof calculatePaymentSplitSchema>;
export type GetWalletBalanceInput = z.infer<typeof getWalletBalanceSchema>;