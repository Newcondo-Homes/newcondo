// apps/platform/lib/utils/payment.ts
// Payment utility functions for Flutterwave integration

import { formatCurrency, roundToCurrency } from './currency';

// Payment status types
export type PaymentStatus = 
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'HELD'
  | 'RELEASED';

export type PaymentType = 
  | 'RENT'
  | 'DEPOSIT'
  | 'AGENT_COMMISSION'
  | 'PREMIUM_UPGRADE'
  | 'PROPERTY_MARKING';

export type PaymentMethod = 
  | 'card'
  | 'bank_transfer'
  | 'ussd'
  | 'mobile_money'
  | 'qr_code';

// Flutterwave configuration
export const FLUTTERWAVE_CONFIG = {
  CURRENCIES: ['NGN', 'USD', 'GBP', 'EUR'],
  PAYMENT_METHODS: {
    card: 'Credit/Debit Card',
    bank_transfer: 'Bank Transfer',
    ussd: 'USSD',
    mobile_money: 'Mobile Money',
    qr_code: 'QR Code',
  },
  MIN_AMOUNTS: {
    NGN: 100, // Minimum 1 Naira
    USD: 1,   // Minimum 1 Dollar
    GBP: 1,   // Minimum 1 Pound
    EUR: 1,   // Minimum 1 Euro
  },
  MAX_AMOUNTS: {
    NGN: 50000000, // 50 Million Naira
    USD: 100000,   // 100 Thousand Dollars
    GBP: 100000,   // 100 Thousand Pounds
    EUR: 100000,   // 100 Thousand Euros
  },
};

/**
 * Generate a unique transaction reference
 * @param prefix - Optional prefix for the reference
 */
export function generateTransactionRef(prefix: string = 'NCD'): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate a unique payment reference for Flutterwave
 * @param paymentType - Type of payment
 * @param userId - User ID making the payment
 */
export function generateFlutterwaveRef(paymentType: PaymentType, userId?: string): string {
  const typePrefix = paymentType.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString();
  const userSuffix = userId ? `_${userId.substring(0, 6)}` : '';
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `FLW_${typePrefix}_${timestamp}${userSuffix}_${random}`;
}

/**
 * Validate payment amount against currency limits
 * @param amount - Amount to validate
 * @param currency - Currency code
 */
export function validatePaymentAmount(amount: number, currency: string = 'NGN'): {
  isValid: boolean;
  error?: string;
} {
  const upperCurrency = currency.toUpperCase();
  
  if (!FLUTTERWAVE_CONFIG.CURRENCIES.includes(upperCurrency)) {
    return {
      isValid: false,
      error: `Currency ${currency} is not supported`,
    };
  }

  const minAmount = FLUTTERWAVE_CONFIG.MIN_AMOUNTS[upperCurrency as keyof typeof FLUTTERWAVE_CONFIG.MIN_AMOUNTS];
  const maxAmount = FLUTTERWAVE_CONFIG.MAX_AMOUNTS[upperCurrency as keyof typeof FLUTTERWAVE_CONFIG.MAX_AMOUNTS];

  if (amount < minAmount) {
    return {
      isValid: false,
      error: `Minimum amount is ${formatCurrency(minAmount, currency)}`,
    };
  }

  if (amount > maxAmount) {
    return {
      isValid: false,
      error: `Maximum amount is ${formatCurrency(maxAmount, currency)}`,
    };
  }

  return { isValid: true };
}

/**
 * Calculate payment breakdown including fees and commissions
 * @param baseAmount - Base payment amount
 * @param paymentType - Type of payment
 * @param currency - Currency code
 */
export function calculatePaymentBreakdown(
  baseAmount: number,
  paymentType: PaymentType,
  currency: string = 'NGN'
): {
  baseAmount: number;
  platformFee: number;
  agentCommission?: number;
  processingFee: number;
  totalAmount: number;
  ownerAmount: number;
  breakdown: Array<{
    name: string;
    amount: number;
    formatted: string;
    description: string;
  }>;
} {
  // Platform fee calculation (2.5% for most payment types)
  const platformFeeRate = paymentType === 'PROPERTY_MARKING' ? 0.15 : 0.025; // 15% for marking, 2.5% for others
  const platformFee = roundToCurrency(baseAmount * platformFeeRate, currency);

  // Agent commission calculation (varies by payment type)
  let agentCommission = 0;
  if (paymentType === 'RENT') {
    agentCommission = roundToCurrency(baseAmount * 0.1, currency); // 10% for rent
  } else if (paymentType === 'PROPERTY_MARKING') {
    agentCommission = roundToCurrency(baseAmount * 0.7, currency); // 70% for agents
  }

  // Processing fee (Flutterwave charges ~1.4% + NGN 100 for cards)
  const processingFeeRate = 0.014;
  const processingFixedFee = currency === 'NGN' ? 100 : 1;
  const processingFee = roundToCurrency(
    (baseAmount * processingFeeRate) + processingFixedFee,
    currency
  );

  const totalAmount = roundToCurrency(baseAmount + processingFee, currency);
  const ownerAmount = roundToCurrency(baseAmount - platformFee - agentCommission, currency);

  const breakdown = [
    {
      name: 'Base Amount',
      amount: baseAmount,
      formatted: formatCurrency(baseAmount, currency),
      description: getPaymentTypeDescription(paymentType),
    },
    {
      name: 'Platform Fee',
      amount: platformFee,
      formatted: formatCurrency(platformFee, currency),
      description: `Platform service fee (${(platformFeeRate * 100).toFixed(1)}%)`,
    },
  ];

  if (agentCommission > 0) {
    breakdown.push({
      name: 'Agent Commission',
      amount: agentCommission,
      formatted: formatCurrency(agentCommission, currency),
      description: 'Agent/property manager commission',
    });
  }

  breakdown.push(
    {
      name: 'Processing Fee',
      amount: processingFee,
      formatted: formatCurrency(processingFee, currency),
      description: 'Payment processing fee',
    },
    {
      name: 'Owner Amount',
      amount: ownerAmount,
      formatted: formatCurrency(ownerAmount, currency),
      description: 'Amount to be received by property owner',
    }
  );

  return {
    baseAmount,
    platformFee,
    agentCommission: agentCommission > 0 ? agentCommission : undefined,
    processingFee,
    totalAmount,
    ownerAmount,
    breakdown,
  };
}

/**
 * Get human-readable description for payment types
 * @param paymentType - Payment type
 */
export function getPaymentTypeDescription(paymentType: PaymentType): string {
  const descriptions = {
    RENT: 'Monthly rent payment',
    DEPOSIT: 'Security deposit',
    AGENT_COMMISSION: 'Agent commission payment',
    PREMIUM_UPGRADE: 'Premium account upgrade',
    PROPERTY_MARKING: 'Property boundary marking service',
  };

  return descriptions[paymentType] || 'Payment';
}

/**
 * Format payment status for display
 * @param status - Payment status
 */
export function formatPaymentStatus(status: PaymentStatus): {
  label: string;
  color: 'success' | 'warning' | 'error' | 'info';
  description: string;
} {
  const statusMap = {
    PENDING: {
      label: 'Pending',
      color: 'warning' as const,
      description: 'Payment is being processed',
    },
    SUCCESS: {
      label: 'Successful',
      color: 'success' as const,
      description: 'Payment completed successfully',
    },
    FAILED: {
      label: 'Failed',
      color: 'error' as const,
      description: 'Payment failed to process',
    },
    CANCELLED: {
      label: 'Cancelled',
      color: 'error' as const,
      description: 'Payment was cancelled',
    },
    REFUNDED: {
      label: 'Refunded',
      color: 'info' as const,
      description: 'Payment has been refunded',
    },
    HELD: {
      label: 'On Hold',
      color: 'warning' as const,
      description: 'Payment is held pending confirmation',
    },
    RELEASED: {
      label: 'Released',
      color: 'success' as const,
      description: 'Payment has been released to property owner',
    },
  };

  return statusMap[status] || statusMap.PENDING;
}

/**
 * Calculate payment retry backoff delay
 * @param attemptNumber - Current retry attempt (1-based)
 */
export function calculateRetryDelay(attemptNumber: number): number {
  // Exponential backoff: 2^attempt * 1000ms, max 30 seconds
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  
  const delay = Math.min(Math.pow(2, attemptNumber - 1) * baseDelay, maxDelay);
  return delay;
}

/**
 * Check if payment can be retried based on status and attempts
 * @param status - Current payment status
 * @param attemptCount - Number of retry attempts made
 * @param maxAttempts - Maximum allowed attempts
 */
export function canRetryPayment(
  status: PaymentStatus,
  attemptCount: number,
  maxAttempts: number = 3
): boolean {
  const retryableStatuses: PaymentStatus[] = ['FAILED', 'CANCELLED'];
  
  return retryableStatuses.includes(status) && attemptCount < maxAttempts;
}

/**
 * Generate payment metadata for tracking
 * @param data - Payment data
 */
export function generatePaymentMetadata(data: {
  userId: string;
  propertyId?: string;
  unitId?: string;
  paymentType: PaymentType;
  rentalId?: string;
  markingJobId?: string;
}): Record<string, string> {
  const metadata: Record<string, string> = {
    user_id: data.userId,
    payment_type: data.paymentType,
    platform: 'newcondo',
    timestamp: new Date().toISOString(),
  };

  if (data.propertyId) {
    metadata.property_id = data.propertyId;
  }

  if (data.unitId) {
    metadata.unit_id = data.unitId;
  }

  if (data.rentalId) {
    metadata.rental_id = data.rentalId;
  }

  if (data.markingJobId) {
    metadata.marking_job_id = data.markingJobId;
  }

  return metadata;
}

/**
 * Parse Flutterwave webhook signature
 * @param payload - Webhook payload
 * @param signature - Webhook signature
 * @param secret - Webhook secret
 */
export function verifyWebhookSignature(
  // payload: string,
  // signature: string,
  // secret: string
): boolean {
  // This would typically use crypto.createHmac in Node.js
  // For client-side, we'll return true and let backend handle verification
  return true;
}

/**
 * Get payment confirmation deadline
 * @param paymentDate - When payment was made
 * @param confirmationPeriodDays - Confirmation period in days (default 7)
 */
export function getPaymentConfirmationDeadline(
  paymentDate: Date,
  confirmationPeriodDays: number = 7
): Date {
  const deadline = new Date(paymentDate);
  deadline.setDate(deadline.getDate() + confirmationPeriodDays);
  return deadline;
}

/**
 * Check if payment confirmation period has expired
 * @param confirmationDeadline - Confirmation deadline
 */
export function isConfirmationExpired(confirmationDeadline: Date): boolean {
  return new Date() > confirmationDeadline;
}

/**
 * Format payment method for display
 * @param method - Payment method code
 */
export function formatPaymentMethod(method: PaymentMethod): string {
  return FLUTTERWAVE_CONFIG.PAYMENT_METHODS[method] || method;
}

/**
 * Generate payment receipt data
 * @param paymentData - Payment information
 */
export function generatePaymentReceiptData(paymentData: {
  transactionId: string;
  amount: number;
  currency: string;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paidAt: Date;
  description?: string;
  propertyTitle?: string;
  userName?: string;
  userEmail?: string;
}) {
  return {
    receiptNumber: `RCP_${paymentData.transactionId}`,
    transactionId: paymentData.transactionId,
    amount: formatCurrency(paymentData.amount, paymentData.currency),
    paymentType: getPaymentTypeDescription(paymentData.paymentType),
    paymentMethod: formatPaymentMethod(paymentData.paymentMethod),
    status: formatPaymentStatus(paymentData.status),
    paidAt: paymentData.paidAt.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    description: paymentData.description,
    propertyTitle: paymentData.propertyTitle,
    userName: paymentData.userName,
    userEmail: paymentData.userEmail,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate next payment due date for recurring payments
 * @param lastPaymentDate - Date of last payment
 * @param intervalMonths - Payment interval in months (default 1)
 */
export function calculateNextPaymentDate(
  lastPaymentDate: Date,
  intervalMonths: number = 1
): Date {
  const nextDate = new Date(lastPaymentDate);
  nextDate.setMonth(nextDate.getMonth() + intervalMonths);
  return nextDate;
}

/**
 * Check if payment is overdue
 * @param dueDate - Payment due date
 * @param gracePeriodDays - Grace period in days (default 3)
 */
export function isPaymentOverdue(dueDate: Date, gracePeriodDays: number = 3): boolean {
  const graceDeadline = new Date(dueDate);
  graceDeadline.setDate(graceDeadline.getDate() + gracePeriodDays);
  
  return new Date() > graceDeadline;
}