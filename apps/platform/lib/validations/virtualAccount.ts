import { z } from 'zod'

// Virtual Account Creation Schema
export const createVirtualAccountSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  accountName: z.string()
    .min(3, 'Account name must be at least 3 characters')
    .max(50, 'Account name must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Account name can only contain letters, numbers, and spaces'),
})

// Virtual Account Update Schema
export const updateVirtualAccountSchema = z.object({
  accountName: z.string()
    .min(3, 'Account name must be at least 3 characters')
    .max(50, 'Account name must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Account name can only contain letters, numbers, and spaces')
    .optional(),
  isActive: z.boolean().optional(),
})

// Virtual Account Statement Query Schema
export const virtualAccountStatementQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  transactionType: z.enum(['CREDIT', 'DEBIT', 'ALL']).default('ALL'),
})

// Fund Transfer Schema
export const fundTransferSchema = z.object({
  fromAccountId: z.string().min(1, 'Source account ID is required'),
  toAccountId: z.string().min(1, 'Destination account ID is required'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(10000000, 'Amount cannot exceed 10,000,000')
    .multipleOf(0.01, 'Amount must be in valid currency format'),
  reference: z.string()
    .min(3, 'Reference must be at least 3 characters')
    .max(100, 'Reference must not exceed 100 characters')
    .optional(),
  description: z.string()
    .max(200, 'Description must not exceed 200 characters')
    .optional(),
})

// Virtual Account Balance Query Schema
export const virtualAccountBalanceQuerySchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  includeHistory: z.boolean().default(false),
})

// Account Reconciliation Schema
export const accountReconciliationSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  expectedBalance: z.number().optional(),
})

// Webhook Event Schema for Virtual Account
export const virtualAccountWebhookSchema = z.object({
  event: z.enum(['CREDIT', 'DEBIT', 'FREEZE', 'UNFREEZE']),
  accountId: z.string().min(1),
  amount: z.number().optional(),
  reference: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
})

// Types derived from schemas
export type CreateVirtualAccountInput = z.infer<typeof createVirtualAccountSchema>
export type UpdateVirtualAccountInput = z.infer<typeof updateVirtualAccountSchema>
export type VirtualAccountStatementQuery = z.infer<typeof virtualAccountStatementQuerySchema>
export type FundTransferInput = z.infer<typeof fundTransferSchema>
export type VirtualAccountBalanceQuery = z.infer<typeof virtualAccountBalanceQuerySchema>
export type AccountReconciliationInput = z.infer<typeof accountReconciliationSchema>
export type VirtualAccountWebhookEvent = z.infer<typeof virtualAccountWebhookSchema>

// Validation helper functions
export const validateAccountNumber = (accountNumber: string): boolean => {
  // Nigerian virtual account numbers are typically 10 digits
  const accountNumberRegex = /^\d{10}$/
  return accountNumberRegex.test(accountNumber)
}

export const validateBankCode = (bankCode: string): boolean => {
  // Nigerian bank codes are typically 3 digits
  const bankCodeRegex = /^\d{3}$/
  return bankCodeRegex.test(bankCode)
}

export const formatCurrency = (amount: number, currency: string = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export const parseAmount = (amountString: string): number => {
  // Remove currency symbols and commas, then parse
  const cleanAmount = amountString.replace(/[₦,\s]/g, '')
  const parsed = parseFloat(cleanAmount)
  
  if (isNaN(parsed) || parsed < 0) {
    throw new Error('Invalid amount format')
  }
  
  return Math.round(parsed * 100) / 100 // Round to 2 decimal places
}

// Virtual Account Status Validation
export const virtualAccountStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'FROZEN', 'CLOSED'])
export type VirtualAccountStatus = z.infer<typeof virtualAccountStatusSchema>