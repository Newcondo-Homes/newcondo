import { z } from 'zod';

// Base payment validation schemas
export const PaymentStatusSchema = z.enum([
  'PENDING',
  'SUCCESS', 
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'HELD',
  'RELEASED',
]);

export const PaymentTypeSchema = z.enum([
  'RENT',
  'DEPOSIT',
  'AGENT_COMMISSION',
  'PREMIUM_UPGRADE',
  'PROPERTY_MARKING',
]);

export const PaymentMethodSchema = z.enum([
  'card',
  'bank_transfer',
  'ussd',
  'qr',
  'mobile_money',
  'voucher',
  'account',
]);

// Currency validation
export const CurrencySchema = z.string()
  .length(3)
  .regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter uppercase code')
  .default('NGN');

// Amount validation with proper decimal handling
export const AmountSchema = z.number()
  .positive('Amount must be positive')
  .min(100, 'Minimum payment amount is ₦100')
  .max(10000000, 'Maximum payment amount is ₦10,000,000')
  .transform(val => Math.round(val * 100) / 100); // Round to 2 decimal places

// Base payment form schema
export const PaymentFormBaseSchema = z.object({
  amount: AmountSchema,
  currency: CurrencySchema,
  paymentType: PaymentTypeSchema,
  description: z.string().optional(),
  
  // Payer information
  payerName: z.string()
    .min(2, 'Payer name must be at least 2 characters')
    .max(100, 'Payer name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Payer name contains invalid characters'),
    
  payerEmail: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must not exceed 255 characters'),
    
  payerPhone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number'),
    
  // Optional fields
  paymentMethod: PaymentMethodSchema.optional(),
  redirectUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Rent payment specific schema
export const RentPaymentFormSchema = PaymentFormBaseSchema.extend({
  paymentType: z.literal('RENT'),
  rentalId: z.string()
    .min(1, 'Rental ID is required')
    .cuid('Invalid rental ID format'),
    
  propertyTitle: z.string()
    .min(1, 'Property title is required')
    .max(200, 'Property title must not exceed 200 characters'),
    
  unitNumber: z.string()
    .max(50, 'Unit number must not exceed 50 characters')
    .optional(),
    
  monthlyRent: AmountSchema,
  
  landlordName: z.string()
    .min(2, 'Landlord name must be at least 2 characters')
    .max(100, 'Landlord name must not exceed 100 characters'),
}).refine(
  (data) => data.amount <= data.monthlyRent * 12,
  {
    message: 'Payment amount cannot exceed 12 months of rent',
    path: ['amount'],
  }
);

// Property marking payment schema
export const MarkingPaymentFormSchema = PaymentFormBaseSchema.extend({
  paymentType: z.literal('PROPERTY_MARKING'),
  markingJobId: z.string()
    .min(1, 'Marking job ID is required')
    .cuid('Invalid marking job ID format'),
    
  propertyAddress: z.string()
    .min(5, 'Property address must be at least 5 characters')
    .max(500, 'Property address must not exceed 500 characters'),
    
  markingFee: AmountSchema,
  
  agentName: z.string()
    .min(2, 'Agent name must be at least 2 characters')
    .max(100, 'Agent name must not exceed 100 characters')
    .optional(),
}).refine(
  (data) => Math.abs(data.amount - data.markingFee) < 0.01,
  {
    message: 'Payment amount must equal the marking fee',
    path: ['amount'],
  }
);

// Deposit payment schema
export const DepositPaymentFormSchema = PaymentFormBaseSchema.extend({
  paymentType: z.literal('DEPOSIT'),
  rentalId: z.string()
    .min(1, 'Rental ID is required')
    .cuid('Invalid rental ID format'),
    
  propertyTitle: z.string()
    .min(1, 'Property title is required')
    .max(200, 'Property title must not exceed 200 characters'),
    
  monthlyRent: AmountSchema,
}).refine(
  (data) => data.amount >= data.monthlyRent && data.amount <= data.monthlyRent * 2,
  {
    message: 'Security deposit must be between 1 and 2 months rent',
    path: ['amount'],
  }
);

// Virtual account form schema
export const VirtualAccountFormSchema = z.object({
  accountName: z.string()
    .min(5, 'Account name must be at least 5 characters')
    .max(100, 'Account name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Account name contains invalid characters'),
    
  propertyId: z.string()
    .cuid('Invalid property ID format')
    .optional(),
    
  currency: CurrencySchema,
});

// Payment verification schema
export const PaymentVerificationSchema = z.object({
  transactionId: z.string()
    .min(1, 'Transaction ID is required'),
    
  flutterwaveRef: z.string()
    .min(1, 'Flutterwave reference is required'),
    
  status: PaymentStatusSchema,
});

// Payment query parameters schema
export const PaymentQuerySchema = z.object({
  page: z.number()
    .int()
    .positive()
    .default(1),
    
  limit: z.number()
    .int()
    .positive()
    .max(100)
    .default(20),
    
  status: z.array(PaymentStatusSchema).optional(),
  paymentType: z.array(PaymentTypeSchema).optional(),
  paymentMethod: z.array(PaymentMethodSchema).optional(),
  
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }).refine(
    (data) => data.start <= data.end,
    {
      message: 'Start date must be before or equal to end date',
      path: ['dateRange'],
    }
  ).optional(),
  
  amountRange: z.object({
    min: AmountSchema,
    max: AmountSchema,
  }).refine(
    (data) => data.min <= data.max,
    {
      message: 'Minimum amount must be less than or equal to maximum amount',
      path: ['amountRange'],
    }
  ).optional(),
  
  search: z.string()
    .max(100, 'Search query must not exceed 100 characters')
    .optional(),
    
  sortBy: z.enum(['createdAt', 'amount', 'status', 'paymentType'])
    .default('createdAt'),
    
  sortDirection: z.enum(['asc', 'desc'])
    .default('desc'),
});

// Flutterwave configuration schema
export const FlutterwaveConfigSchema = z.object({
  public_key: z.string()
    .min(1, 'Public key is required'),
    
  tx_ref: z.string()
    .min(1, 'Transaction reference is required'),
    
  amount: AmountSchema,
  currency: CurrencySchema,
  
  payment_options: z.string()
    .min(1, 'Payment options are required')
    .default('card,banktransfer,ussd'),
    
  redirect_url: z.string()
    .url('Invalid redirect URL'),
    
  customer: z.object({
    email: z.string().email(),
    phone_number: z.string()
      .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format'),
    name: z.string()
      .min(2, 'Customer name must be at least 2 characters'),
  }),
  
  customizations: z.object({
    title: z.string()
      .min(1, 'Payment title is required')
      .max(100, 'Payment title must not exceed 100 characters'),
      
    description: z.string()
      .max(200, 'Payment description must not exceed 200 characters'),
      
    logo: z.string().url().optional(),
  }),
  
  meta: z.record(z.string(), z.any()).optional(),
});

// Webhook verification schema
export const WebhookVerificationSchema = z.object({
  signature: z.string()
    .min(1, 'Webhook signature is required'),
    
  payload: z.string()
    .min(1, 'Webhook payload is required'),
    
  timestamp: z.string()
    .min(1, 'Webhook timestamp is required'),
});

// Payment receipt schema
export const PaymentReceiptSchema = z.object({
  paymentId: z.string()
    .cuid('Invalid payment ID format'),
    
  format: z.enum(['pdf', 'html', 'json'])
    .default('pdf'),
    
  includeDetails: z.boolean()
    .default(true),
});

// Refund request schema
export const RefundRequestSchema = z.object({
  paymentId: z.string()
    .cuid('Invalid payment ID format'),
    
  amount: AmountSchema.optional(), // Partial refund amount
  
  reason: z.string()
    .min(10, 'A detailed reason of at least 10 characters is required for a refund request.')
    .max(500, 'Reason must not exceed 500 characters'),
});

// Transaction filter schema for API requests
export const TransactionFilterSchema = z.object({
  userId: z.string().cuid('Invalid user ID format').optional(),
  rentalId: z.string().cuid('Invalid rental ID format').optional(),
  markingJobId: z.string().cuid('Invalid marking job ID format').optional(),
  propertyId: z.string().cuid('Invalid property ID format').optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: PaymentStatusSchema.optional(),
  type: PaymentTypeSchema.optional(),
});

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type PaymentType = z.infer<typeof PaymentTypeSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type PaymentFormBase = z.infer<typeof PaymentFormBaseSchema>;
export type RentPaymentForm = z.infer<typeof RentPaymentFormSchema>;
export type MarkingPaymentForm = z.infer<typeof MarkingPaymentFormSchema>;
export type DepositPaymentForm = z.infer<typeof DepositPaymentFormSchema>;
export type VirtualAccountForm = z.infer<typeof VirtualAccountFormSchema>;
export type PaymentVerification = z.infer<typeof PaymentVerificationSchema>;
export type PaymentQuery = z.infer<typeof PaymentQuerySchema>;
export type FlutterwaveConfig = z.infer<typeof FlutterwaveConfigSchema>;
export type WebhookVerification = z.infer<typeof WebhookVerificationSchema>;
export type PaymentReceipt = z.infer<typeof PaymentReceiptSchema>;
export type RefundRequest = z.infer<typeof RefundRequestSchema>;
export type TransactionFilter = z.infer<typeof TransactionFilterSchema>;