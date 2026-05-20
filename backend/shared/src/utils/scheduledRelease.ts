// backend/shared/src/utils/scheduledRelease.ts

import { DecimalClass, Decimal } from '@newcondo/db';

/**
 * Confirmation period is 24 hours from payment
 */
export const CONFIRMATION_RELEASE_PERIOD_HOURS = 24;

interface PaymentReleaseSchedule {
  paymentId: string;
  paymentDate: Date;
  confirmationPeriodEnd: Date;
  scheduledReleaseDate: Date;
  isEligibleForRelease: boolean;
  hoursUntilRelease: number;
}

export interface ReleaseDistribution {
  paymentId: string;
  totalAmount: Decimal;
  distributions: Array<{
    recipientId: string;
    recipientType: 'OWNER' | 'LISTING_AGENT' | 'SUB_AGENT' | 'PLATFORM';
    amount: Decimal;
    virtualAccountId?: string;
  }>;
}

enum ReleaseStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface ReleaseJob {
  id: string;
  paymentId: string;
  status: ReleaseStatus;
  scheduledFor: Date;
  processedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

/**
 * Calculate confirmation period end date (24 hours from payment)
 * @param paymentDate - Date when payment was made
 * @returns Date when confirmation period ends
 */
export function calculateConfirmationPeriodEnd(paymentDate: Date): Date {
  const endDate = new Date(paymentDate);
  endDate.setHours(endDate.getHours() + CONFIRMATION_RELEASE_PERIOD_HOURS);
  return endDate;
}

/**
 * Check if confirmation period has ended
 * @param confirmationPeriodEnd - Date when confirmation period ends
 * @returns true if period has ended
 */
export function hasConfirmationPeriodEnded(confirmationPeriodEnd: Date): boolean {
  return new Date() >= confirmationPeriodEnd;
}

/**
 * Get hours remaining in confirmation period
 * @param confirmationPeriodEnd - Date when confirmation period ends
 * @returns Hours remaining (0 if expired)
 */
export function getHoursRemainingInConfirmationPeriod(
  confirmationPeriodEnd: Date
): number {
  const now = new Date();
  const diffMs = confirmationPeriodEnd.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 0;
  }

  return Math.ceil(diffMs / (1000 * 60 * 60));
}

/**
 * Create payment release schedule
 * @param paymentId - Payment ID
 * @param paymentDate - Date when payment was made
 * @returns Release schedule
 */
export function createPaymentReleaseScheduleFunction(
  paymentId: string,
  paymentDate: Date
): PaymentReleaseSchedule {
  const confirmationPeriodEnd = calculateConfirmationPeriodEnd(paymentDate);
  const isEligibleForRelease = hasConfirmationPeriodEnded(confirmationPeriodEnd);
  const hoursUntilRelease = getHoursRemainingInConfirmationPeriod(confirmationPeriodEnd);

  return {
    paymentId,
    paymentDate,
    confirmationPeriodEnd,
    scheduledReleaseDate: confirmationPeriodEnd,
    isEligibleForRelease,
    hoursUntilRelease,
  };
}

/**
 * Find payments ready for release
 * @param payments - Array of payments with their confirmation period end dates
 * @returns Array of payment IDs ready for release
 */
export function findPaymentsReadyForRelease(
  payments: Array<{ id: string; confirmationPeriodEnd: Date; isReleased: boolean }>
): string[] {
  const now = new Date();

  return payments
    .filter(payment => !payment.isReleased && now >= payment.confirmationPeriodEnd)
    .map(payment => payment.id);
}

/**
 * Create release distribution plan
 * @param paymentId - Payment ID
 * @param totalAmount - Total amount to distribute
 * @param distributions - Distribution details for each recipient
 * @returns Release distribution plan
 */
export function createReleaseDistribution(
  paymentId: string,
  totalAmount: Decimal | number,
  distributions: Array<{
    recipientId: string;
    recipientType: 'OWNER' | 'LISTING_AGENT' | 'SUB_AGENT' | 'PLATFORM';
    amount: Decimal | number;
    virtualAccountId?: string;
  }>
): ReleaseDistribution {
  const total = new DecimalClass(totalAmount);

  // Convert all amounts to Decimal
  const formattedDistributions = distributions.map(dist => ({
    recipientId: dist.recipientId,
    recipientType: dist.recipientType,
    amount: new DecimalClass(dist.amount),
    virtualAccountId: dist.virtualAccountId,
  }));

  // Validate total matches sum of distributions
  const sum = formattedDistributions.reduce(
    (acc, dist) => acc.add(dist.amount),
    new DecimalClass(0)
  );

  const difference = total.sub(sum).abs();
  if (difference.greaterThan(0.01)) {
    throw new Error(
      `Distribution mismatch: Total ${total.toString()} does not match sum ${sum.toString()}`
    );
  }

  return {
    paymentId,
    totalAmount: total,
    distributions: formattedDistributions,
  };
}

/**
 * Validate release distribution
 * @param distribution - Release distribution to validate
 * @returns Validation result
 */
export function validateReleaseDistribution(distribution: ReleaseDistribution): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!distribution.paymentId || distribution.paymentId.trim().length === 0) {
    errors.push('Payment ID is required');
  }

  if (distribution.totalAmount.lessThanOrEqualTo(0)) {
    errors.push('Total amount must be greater than zero');
  }

  if (distribution.distributions.length === 0) {
    errors.push('At least one distribution recipient is required');
  }

  // Check for duplicate recipients
  const recipientIds = distribution.distributions.map(d => d.recipientId);
  const uniqueRecipientIds = new Set(recipientIds);
  if (recipientIds.length !== uniqueRecipientIds.size) {
    errors.push('Duplicate recipients found in distribution');
  }

  // Check each distribution
  distribution.distributions.forEach((dist, index) => {
    if (!dist.recipientId || dist.recipientId.trim().length === 0) {
      errors.push(`Distribution ${index + 1}: Recipient ID is required`);
    }

    if (dist.amount.lessThanOrEqualTo(0)) {
      errors.push(`Distribution ${index + 1}: Amount must be greater than zero`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create release job for scheduled processing
 * @param paymentId - Payment ID
 * @param scheduledFor - When to process the release
 * @returns Release job
 */
export function createReleaseJob(
  paymentId: string,
  scheduledFor: Date,
  maxRetries: number = 3
): ReleaseJob {
  return {
    id: `release_${paymentId}_${Date.now()}`,
    paymentId,
    status: ReleaseStatus.SCHEDULED,
    scheduledFor,
    retryCount: 0,
    maxRetries,
  };
}

/**
 * Check if release job should be retried
 * @param job - Release job to check
 * @returns true if job should be retried
 */
export function shouldRetryReleaseJob(job: ReleaseJob): boolean {
  return job.status === ReleaseStatus.FAILED && job.retryCount < job.maxRetries;
}

/**
 * Calculate next retry time with exponential backoff
 * @param retryCount - Current retry count
 * @returns Date for next retry
 */
export function calculateNextRetryTime(retryCount: number): Date {
  // Exponential backoff: 5 minutes * (2 ^ retryCount)
  const baseDelayMinutes = 5;
  const delayMinutes = baseDelayMinutes * Math.pow(2, retryCount);

  const nextRetry = new Date();
  nextRetry.setMinutes(nextRetry.getMinutes() + delayMinutes);

  return nextRetry;
}

/**
 * Get release summary for notifications
 * @param distribution - Release distribution
 * @returns Human-readable summary
 */
export function getReleaseSummary(distribution: ReleaseDistribution): string {
  const lines = [
    `Total Amount Released: NGN ${distribution.totalAmount.toFixed(2)}`,
    '\nDistribution:',
  ];

  distribution.distributions.forEach(dist => {
    lines.push(
      `- ${dist.recipientType}: NGN ${dist.amount.toFixed(2)} (${dist.recipientId})`
    );
  });

  return lines.join('\n');
}

/**
 * Create release notification message for recipient
 * @param recipientType - Type of recipient
 * @param amount - Amount released
 * @param paymentId - Payment ID
 * @returns Formatted notification message
 */
export function createReleaseNotificationMessage(
  recipientType: 'OWNER' | 'LISTING_AGENT' | 'SUB_AGENT' | 'PLATFORM',
  amount: Decimal,
  paymentId: string
): string {
  const typeLabels = {
    OWNER: 'property owner',
    LISTING_AGENT: 'listing agent',
    SUB_AGENT: 'sub-agent',
    PLATFORM: 'platform',
  };

  return `Payment has been released!\n\n` +
    `Amount: NGN ${amount.toFixed(2)}\n` +
    `Your Role: ${typeLabels[recipientType]}\n` +
    `Payment ID: ${paymentId}\n\n` +
    `The funds are now available in your virtual account for withdrawal.`;
}

/**
 * Batch payments ready for release
 * @param payments - Array of payments ready for release
 * @param batchSize - Maximum number of payments per batch
 * @returns Array of payment batches
 */
export function batchPaymentsForRelease(
  payments: string[],
  batchSize: number = 50
): string[][] {
  const batches: string[][] = [];

  for (let i = 0; i < payments.length; i += batchSize) {
    batches.push(payments.slice(i, i + batchSize));
  }

  return batches;
}

/**
 * Get estimated release time message
 * @param confirmationPeriodEnd - When confirmation period ends
 * @returns User-friendly message about release timing
 */
export function getEstimatedReleaseMessage(confirmationPeriodEnd: Date): string {
  const now = new Date();
  const diffMs = confirmationPeriodEnd.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Payment is being processed for release now.';
  }

  const hours = Math.ceil(diffMs / (1000 * 60 * 60));

  if (hours <= 1) {
    return 'Payment will be released in less than 1 hour.';
  }

  return `Payment will be released in approximately ${hours} hours.`;
}