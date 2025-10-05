// backend/shared/src/utils/paymentRelease.ts

import { Decimal } from '@prisma/client/runtime/library';
import { 
  PaymentReleaseSchedule, 
  PaymentReleaseStatus,
  PaymentHoldPeriod 
} from '../types/paymentRelease';

/**
 * Confirmation period in hours (24 hours)
 */
export const CONFIRMATION_PERIOD_HOURS = 24;

/**
 * Confirmation period in milliseconds
 */
export const CONFIRMATION_PERIOD_MS = CONFIRMATION_PERIOD_HOURS * 60 * 60 * 1000;

/**
 * Calculate confirmation deadline from payment date
 */
export function calculateConfirmationDeadline(paymentDate: Date): Date {
  const deadline = new Date(paymentDate.getTime() + CONFIRMATION_PERIOD_MS);
  return deadline;
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
 * Create payment release schedule
 */
export function createPaymentReleaseSchedule(params: {
  paymentId: string;
  rentalId: string;
  paymentDate: Date;
  totalAmount: Decimal;
  propertyOwnerId: string;
  listingAgentId?: string;
  subAgentId?: string;
}): PaymentReleaseSchedule {
  const { paymentId, rentalId, paymentDate, totalAmount } = params;
  
  const confirmationDeadline = calculateConfirmationDeadline(paymentDate);
  
  return {
    paymentId,
    rentalId,
    paymentDate,
    confirmationDeadline,
    releaseScheduledFor: confirmationDeadline,
    status: 'PENDING_CONFIRMATION',
    totalAmount,
    isAutoRelease: true,
  };
}

/**
 * Determine payment release status based on current state
 */
export function determinePaymentReleaseStatus(params: {
  isConfirmed: boolean;
  confirmationDeadline: Date;
  isReleased: boolean;
  isRefunded: boolean;
}): PaymentReleaseStatus {
  const { isConfirmed, confirmationDeadline, isReleased, isRefunded } = params;
  
  if (isRefunded) {
    return 'REFUNDED';
  }
  
  if (isReleased) {
    return 'RELEASED';
  }
  
  if (isConfirmed) {
    return 'CONFIRMED_PENDING_RELEASE';
  }
  
  const isPeriodExpired = isConfirmationPeriodExpired(confirmationDeadline);
  
  if (isPeriodExpired) {
    return 'AUTO_RELEASE_READY';
  }
  
  return 'PENDING_CONFIRMATION';
}

/**
 * Check if payment is ready for release
 */
export function isPaymentReadyForRelease(params: {
  isConfirmed: boolean;
  confirmationDeadline: Date;
  isReleased: boolean;
}): boolean {
  const { isConfirmed, confirmationDeadline, isReleased } = params;
  
  // Already released
  if (isReleased) {
    return false;
  }
  
  // Confirmed by renter
  if (isConfirmed) {
    return true;
  }
  
  // Auto-release after confirmation period
  if (isConfirmationPeriodExpired(confirmationDeadline)) {
    return true;
  }
  
  return false;
}

/**
 * Check if payment can still be refunded
 */
export function canPaymentBeRefunded(params: {
  isReleased: boolean;
  isRefunded: boolean;
  confirmationDeadline: Date;
}): { canRefund: boolean; reason?: string } {
  const { isReleased, isRefunded, confirmationDeadline } = params;
  
  if (isRefunded) {
    return { canRefund: false, reason: 'Payment has already been refunded' };
  }
  
  if (isReleased) {
    return { canRefund: false, reason: 'Payment has already been released to recipients' };
  }
  
  if (isConfirmationPeriodExpired(confirmationDeadline)) {
    return { canRefund: false, reason: 'Confirmation period has expired' };
  }
  
  return { canRefund: true };
}

/**
 * Get payment hold period information
 */
export function getPaymentHoldPeriod(paymentDate: Date): PaymentHoldPeriod {
  const confirmationDeadline = calculateConfirmationDeadline(paymentDate);
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
 * Releases happen every hour on the hour
 */
export function getNextAutoReleaseBatchTime(): Date {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  
  return nextHour;
}

/**
 * Get payments ready for auto-release in current batch
 */
export function filterPaymentsForAutoRelease(
  schedules: PaymentReleaseSchedule[]
): PaymentReleaseSchedule[] {
  const now = new Date();
  
  return schedules.filter(schedule => {
    // Must be pending or confirmed
    if (!['PENDING_CONFIRMATION', 'CONFIRMED_PENDING_RELEASE', 'AUTO_RELEASE_READY'].includes(schedule.status)) {
      return false;
    }
    
    // Must be past confirmation deadline
    if (schedule.confirmationDeadline > now) {
      return false;
    }
    
    // Must be scheduled for release at or before current time
    if (schedule.releaseScheduledFor && schedule.releaseScheduledFor > now) {
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
 * Validate payment release eligibility
 */
export function validatePaymentReleaseEligibility(params: {
  paymentId: string;
  isReleased: boolean;
  isRefunded: boolean;
  confirmationDeadline: Date;
  totalAmount: Decimal;
}): { isEligible: boolean; errors: string[] } {
  const errors: string[] = [];
  const { isReleased, isRefunded, confirmationDeadline, totalAmount } = params;
  
  if (isReleased) {
    errors.push('Payment has already been released');
  }
  
  if (isRefunded) {
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