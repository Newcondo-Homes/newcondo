// backend/shared/src/utils/paymentRelease.ts

import { Decimal } from '@newcondo/db';
import { 
  PaymentHoldStatus, 
  PaymentHold,
  PaymentReleaseSchedule,
} from '../types/paymentRelease';

import { CONFIRMATION_PERIOD_HOURS } from '../constants';


/**
 * Confirmation period in milliseconds
 */
export const CONFIRMATION_PERIOD_MS_FOR_PAYMENTRELEASE = CONFIRMATION_PERIOD_HOURS * 60 * 60 * 1000;

/**
 * Calculate confirmation deadline from payment date
 */
export function calculateConfirmationDeadlineForPayment(paymentDate: Date): Date {
  return new Date(paymentDate.getTime() + CONFIRMATION_PERIOD_MS_FOR_PAYMENTRELEASE);
}

/**
 * Check if confirmation period has expired
 */
export function isConfirmationPeriodExpired(confirmationDeadline: Date): boolean {
  const now = new Date();
  return now >= confirmationDeadline;
}

/**
 * Calculate time remaining in confirmation period
 */
export function getTimeRemainingInConfirmation(confirmationDeadline: Date): {
  hours: number;
  minutes: number;
  isExpired: boolean;
} {
  const now = new Date();
  const timeRemaining = confirmationDeadline.getTime() - now.getTime();
  
  if (timeRemaining <= 0) {
    return { hours: 0, minutes: 0, isExpired: true };
  }
  
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes, isExpired: false };
}

/**
 * Create a base payment hold profile setup
 */
export function createPaymentReleaseSchedule(params: {
  paymentId: string;
  rentalId: string;
  paymentDate: Date;
  totalAmount: Decimal;
  propertyOwnerId: string;
  listingAgentId?: string;
  subAgentId?: string;
  propertyId: string;
  renterId: string;
  rentAmount: Decimal;
  serviceFee: Decimal;
  transactionFee: Decimal;
  holdingVirtualAccountId: string;
}): Partial<PaymentHold> {
  const { paymentId, rentalId, paymentDate, totalAmount, propertyId, renterId, rentAmount, serviceFee, transactionFee, holdingVirtualAccountId } = params;
  
  const confirmationDeadline = calculateConfirmationDeadlineForPayment(paymentDate);
  
  return {
    paymentId,
    rentalId,
    propertyId,
    renterId,
    totalAmount,
    rentAmount,
    serviceFee,
    transactionFee,
    holdingVirtualAccountId,
    status: PaymentHoldStatus.HELD,
    heldAt: paymentDate,
    releaseScheduledAt: confirmationDeadline,
    isConfirmed: false
  };
}

/**
 * Determine payment release status based on current state metrics
 */
export function determinePaymentReleaseStatus(params: {
  isConfirmed: boolean;
  confirmationDeadline: Date;
  status: PaymentHoldStatus;
}): PaymentHoldStatus {
  const { isConfirmed, confirmationDeadline, status } = params;
  
  if (status === PaymentHoldStatus.REFUNDED) {
    return PaymentHoldStatus.REFUNDED;
  }
  
  if (status === PaymentHoldStatus.RELEASED) {
    return PaymentHoldStatus.RELEASED;
  }
  
  if (status === PaymentHoldStatus.DISPUTED) {
    return PaymentHoldStatus.DISPUTED;
  }
  
  if (isConfirmed) {
    return PaymentHoldStatus.PENDING_RELEASE;
  }
  
  const isPeriodExpired = isConfirmationPeriodExpired(confirmationDeadline);
  
  if (isPeriodExpired) {
    return PaymentHoldStatus.PENDING_RELEASE;
  }
  
  return PaymentHoldStatus.HELD;
}

/**
 * Check if payment is ready for release execution
 */
export function isPaymentReadyForRelease(params: {
  isConfirmed: boolean;
  confirmationDeadline: Date;
  status: PaymentHoldStatus;
}): boolean {
  const { isConfirmed, confirmationDeadline, status } = params;
  
  // Cannot release if already finished or blocked
  if ([PaymentHoldStatus.RELEASED, PaymentHoldStatus.REFUNDED, PaymentHoldStatus.DISPUTED, PaymentHoldStatus.CANCELLED].includes(status)) {
    return false;
  }
  
  // Confirmed by renter or elapsed auto-release window opens processing
  if (isConfirmed || isConfirmationPeriodExpired(confirmationDeadline)) {
    return true;
  }
  
  return false;
}

/**
 * Check if payment can still be refunded
 */
export function canPaymentBeRefunded(params: {
  status: PaymentHoldStatus;
  confirmationDeadline: Date;
}): { canRefund: boolean; reason?: string } {
  const { status, confirmationDeadline } = params;
  
  if (status === PaymentHoldStatus.REFUNDED) {
    return { canRefund: false, reason: 'Payment has already been refunded' };
  }
  
  if (status === PaymentHoldStatus.RELEASED) {
    return { canRefund: false, reason: 'Payment has already been released to recipients' };
  }
  
  if (isConfirmationPeriodExpired(confirmationDeadline)) {
    return { canRefund: false, reason: 'Confirmation period has expired' };
  }
  
  return { canRefund: true };
}

/**
 * Get unified dashboard data frame representation details
 */
export function getPaymentHoldPeriod(paymentDate: Date) {
  const confirmationDeadline = calculateConfirmationDeadlineForPayment(paymentDate);
  const timeRemaining = getTimeRemainingInConfirmation(confirmationDeadline);
  const status = timeRemaining.isExpired ? 'EXPIRED' : 'ACTIVE';
  
  return {
    startDate: paymentDate,
    endDate: confirmationDeadline,
    durationHours: CONFIRMATION_PERIOD_HOURS,
    timeRemaining,
    status,
  };
}

/**
 * Calculate next auto-release batch time
 */
export function getNextAutoReleaseBatchTime(): Date {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  
  return nextHour;
}

/**
 * Get payments ready for auto-release tracking schedules
 */
export function filterPaymentsForAutoRelease(
  schedules: PaymentReleaseSchedule[]
): PaymentReleaseSchedule[] {
  const now = new Date();
  
  return schedules.filter(schedule => {
    // Must be in active SCHEDULED lifecycle state
    if (schedule.status !== 'SCHEDULED') {
      return false;
    }
    
    // Must be past targeted completion timeline
    if (schedule.scheduledAt > now) {
      return false;
    }
    
    return true;
  });
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(timeRemaining: {
  hours: number;
  minutes: number;
  isExpired: boolean;
}): string {
  if (timeRemaining.isExpired) {
    return 'Expired';
  }
  
  const { hours, minutes } = timeRemaining;
  
  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
  }
  
  if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
  }
  
  return `${hours}h ${minutes}m remaining`;
}

/**
 * Validate payment release eligibility criteria
 */
export function validatePaymentReleaseEligibility(params: {
  paymentId: string;
  status: PaymentHoldStatus;
  confirmationDeadline: Date;
  totalAmount: Decimal;
}): { isEligible: boolean; errors: string[] } {
  const errors: string[] = [];
  const { status, confirmationDeadline, totalAmount } = params;
  
  if (status === PaymentHoldStatus.RELEASED) {
    errors.push('Payment has already been released');
  }
  
  if (status === PaymentHoldStatus.REFUNDED) {
    errors.push('Payment has been refunded');
  }
  
  if (!isConfirmationPeriodExpired(confirmationDeadline)) {
    errors.push('Confirmation period has not expired yet');
  }
  
  if (totalAmount.lessThanOrEqualTo(0)) {
    errors.push('Invalid payment amount');
  }
  
  return {
    isEligible: errors.length === 0,
    errors,
  };
}