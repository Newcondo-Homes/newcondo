// backend/shared/src/utils/refund.ts

import { Decimal } from '@prisma/client/runtime/library';

export interface RefundRequest {
  paymentId: string;
  rentalId: string;
  userId: string;
  originalAmount: Decimal;
  serviceFee: Decimal;
  reason: string;
  requestedAt: Date;
}

export interface RefundBreakdown {
  totalPaid: Decimal;
  serviceFee: Decimal; // Non-refundable
  refundableAmount: Decimal;
  flutterwaveRefundFee: Decimal;
  netRefundAmount: Decimal; // Amount user actually receives back
  
  breakdown: {
    originalPayment: string;
    serviceFeeDeducted: string;
    processingFeeDeducted: string;
    finalRefundAmount: string;
  };
}

export enum RefundEligibility {
  ELIGIBLE = 'ELIGIBLE',
  PAST_DEADLINE = 'PAST_DEADLINE',
  ALREADY_RELEASED = 'ALREADY_RELEASED',
  ALREADY_REFUNDED = 'ALREADY_REFUNDED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
}

export interface RefundEligibilityCheck {
  isEligible: boolean;
  status: RefundEligibility;
  reason?: string;
  deadlineDate?: Date;
  hoursRemaining?: number;
}

/**
 * Calculate refund breakdown
 * Note: Service fee is non-refundable as stated in requirements
 * @param totalPaid - Total amount paid including service fee
 * @param serviceFee - Service fee that was charged (non-refundable)
 * @returns Detailed refund breakdown
 */
export function calculateRefundBreakdown(
  totalPaid: Decimal | number,
  serviceFee: Decimal | number
): RefundBreakdown {
  const total = new Decimal(totalPaid);
  const fee = new Decimal(serviceFee);
  
  // Refundable amount = total paid - service fee
  const refundableAmount = total.sub(fee);
  
  // Flutterwave charges approximately 1.4% + NGN 100 for refunds
  const flutterwaveRefundFee = refundableAmount.mul(0.014).add(100);
  
  // Net refund = refundable amount - flutterwave refund fee
  // Note: Service fee covers this, but we still deduct actual cost
  const netRefundAmount = refundableAmount.sub(flutterwaveRefundFee);
  
  return {
    totalPaid: total,
    serviceFee: fee,
    refundableAmount,
    flutterwaveRefundFee,
    netRefundAmount,
    breakdown: {
      originalPayment: total.toFixed(2),
      serviceFeeDeducted: fee.toFixed(2),
      processingFeeDeducted: flutterwaveRefundFee.toFixed(2),
      finalRefundAmount: netRefundAmount.toFixed(2),
    },
  };
}

/**
 * Check if payment is eligible for refund
 * @param confirmationPeriodEnd - When the 24-hour confirmation period ends
 * @param paymentStatus - Current payment status
 * @param isReleased - Whether payment has been released
 * @returns Eligibility check result
 */
export function checkRefundEligibility(
  confirmationPeriodEnd: Date,
  paymentStatus: string,
  isReleased: boolean
): RefundEligibilityCheck {
  const now = new Date();
  
  // Check if payment is in correct status
  if (paymentStatus !== 'SUCCESS' && paymentStatus !== 'HELD') {
    return {
      isEligible: false,
      status: RefundEligibility.PAYMENT_PENDING,
      reason: 'Payment must be successful before requesting refund',
    };
  }
  
  // Check if already released
  if (isReleased) {
    return {
      isEligible: false,
      status: RefundEligibility.ALREADY_RELEASED,
      reason: 'Payment has already been released. Refund period has expired.',
    };
  }
  
  // Check if within 24-hour confirmation period
  if (now > confirmationPeriodEnd) {
    return {
      isEligible: false,
      status: RefundEligibility.PAST_DEADLINE,
      reason: 'Refund request period has expired (24 hours from payment)',
      deadlineDate: confirmationPeriodEnd,
    };
  }
  
  // Calculate hours remaining
  const hoursRemaining = Math.floor(
    (confirmationPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60)
  );
  
  return {
    isEligible: true,
    status: RefundEligibility.ELIGIBLE,
    deadlineDate: confirmationPeriodEnd,
    hoursRemaining: Math.max(0, hoursRemaining),
  };
}

/**
 * Validate refund request
 * @param request - Refund request details
 * @returns Validation result
 */
export function validateRefundRequest(request: RefundRequest): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!request.paymentId || request.paymentId.trim().length === 0) {
    errors.push('Payment ID is required');
  }
  
  if (!request.rentalId || request.rentalId.trim().length === 0) {
    errors.push('Rental ID is required');
  }
  
  if (!request.userId || request.userId.trim().length === 0) {
    errors.push('User ID is required');
  }
  
  if (!request.reason || request.reason.trim().length < 10) {
    errors.push('Refund reason must be at least 10 characters');
  }
  
  if (request.originalAmount.lessThanOrEqualTo(0)) {
    errors.push('Original amount must be greater than zero');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get refund summary for display
 * @param breakdown - Refund breakdown
 * @returns Human-readable summary
 */
export function getRefundSummary(breakdown: RefundBreakdown): string {
  return [
    `Original Payment: NGN ${breakdown.totalPaid.toFixed(2)}`,
    `Service Fee (Non-refundable): NGN ${breakdown.serviceFee.toFixed(2)}`,
    `Refundable Amount: NGN ${breakdown.refundableAmount.toFixed(2)}`,
    `Processing Fee: NGN ${breakdown.flutterwaveRefundFee.toFixed(2)}`,
    `Net Refund: NGN ${breakdown.netRefundAmount.toFixed(2)}`,
  ].join('\n');
}

/**
 * Calculate refund deadline (24 hours from payment)
 * @param paymentDate - Date when payment was made
 * @returns Refund deadline date
 */
export function calculateRefundDeadline(paymentDate: Date): Date {
  const deadline = new Date(paymentDate);
  deadline.setHours(deadline.getHours() + 24);
  return deadline;
}

/**
 * Check if currently within refund period
 * @param confirmationPeriodEnd - When confirmation period ends
 * @returns true if within refund period
 */
export function isWithinRefundPeriod(confirmationPeriodEnd: Date): boolean {
  return new Date() < confirmationPeriodEnd;
}

/**
 * Get time remaining in refund period
 * @param confirmationPeriodEnd - When confirmation period ends
 * @returns Time remaining in hours and minutes
 */
export function getTimeRemainingInRefundPeriod(confirmationPeriodEnd: Date): {
  hours: number;
  minutes: number;
  isExpired: boolean;
} {
  const now = new Date();
  const diffMs = confirmationPeriodEnd.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, isExpired: true };
  }
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes, isExpired: false };
}

/**
 * Format refund reason for notifications
 * @param reason - Raw refund reason
 * @param maxLength - Maximum length of formatted reason
 * @returns Formatted reason
 */
export function formatRefundReason(reason: string, maxLength: number = 200): string {
  const trimmed = reason.trim();
  
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  
  return `${trimmed.substring(0, maxLength - 3)}...`;
}

/**
 * Create refund notification message
 * @param breakdown - Refund breakdown
 * @param reason - Refund reason
 * @returns Formatted notification message
 */
export function createRefundNotificationMessage(
  breakdown: RefundBreakdown,
  reason: string
): string {
  return `Your refund request has been processed.\n\n` +
    `Refund Amount: NGN ${breakdown.netRefundAmount.toFixed(2)}\n` +
    `(Service fee of NGN ${breakdown.serviceFee.toFixed(2)} is non-refundable)\n\n` +
    `Reason: ${formatRefundReason(reason, 150)}\n\n` +
    `The refund will be processed within 5-7 business days.`;
}