// backend/shared/src/constants/paymentTimings.ts

/**
 * Timing constants for payment confirmation and release system
 */

export const CONFIRMATION_PERIOD = {
  // 24-hour confirmation period (in milliseconds)
  DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
  DURATION_HOURS: 24,
  DURATION_MINUTES: 24 * 60,
  DURATION_SECONDS: 24 * 60 * 60,
} as const;

export const PAYMENT_LOCK = {
  // Payment lock duration to prevent double booking (15 minutes)
  DURATION_MS: 15 * 60 * 1000, // 15 minutes
  DURATION_MINUTES: 15,

  // Grace period before lock expiry warning (2 minutes)
  WARNING_BEFORE_EXPIRY_MS: 2 * 60 * 1000,
} as const;

export const REFUND_WINDOW = {
  // Maximum time to request refund (within confirmation period)
  DURATION_MS: CONFIRMATION_PERIOD.DURATION_MS,
  DURATION_HOURS: CONFIRMATION_PERIOD.DURATION_HOURS,
} as const;

export const RELEASE_SCHEDULE = {
  // How frequently to check for payments ready to release (every 5 minutes)
  CHECK_INTERVAL_MS: 5 * 60 * 1000,
  CHECK_INTERVAL_MINUTES: 5,

  // Batch size for processing releases
  BATCH_SIZE: 50,

  // Retry configuration for failed releases
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 30 * 1000, // 30 seconds between retries
} as const;

export const NOTIFICATION_TIMING = {
  // When to send confirmation reminder to renter
  REMINDER_BEFORE_DEADLINE_HOURS: 6, // 6 hours before deadline
  REMINDER_BEFORE_DEADLINE_MS: 6 * 60 * 60 * 1000,

  // When to notify owner about pending release
  OWNER_NOTIFICATION_BEFORE_RELEASE_HOURS: 2, // 2 hours before release
  OWNER_NOTIFICATION_BEFORE_RELEASE_MS: 2 * 60 * 60 * 1000,
} as const;

/**
 * Calculate confirmation deadline from payment time
 */
export function calculateConfirmationDeadline(paymentDate: Date): Date {
  return new Date(paymentDate.getTime() + CONFIRMATION_PERIOD.DURATION_MS);
}

/**
 * Calculate payment lock expiry time
 */
export function calculatePaymentLockExpiry(lockStartTime: Date): Date {
  return new Date(lockStartTime.getTime() + PAYMENT_LOCK.DURATION_MS);
}

/**
 * Check if confirmation period has passed
 */
export function hasConfirmationPeriodPassed(confirmationDeadline: Date): boolean {
  return new Date() >= confirmationDeadline;
}

/**
 * Check if payment lock has expired
 */
export function hasPaymentLockExpired(lockExpiry: Date): boolean {
  return new Date() >= lockExpiry;
}

/**
 * Calculate remaining time in confirmation period (in milliseconds)
 */
export function getRemainingConfirmationTime(confirmationDeadline: Date): number {
  const remaining = confirmationDeadline.getTime() - Date.now();
  return Math.max(0, remaining);
}

/**
 * Check if reminder should be sent
 */
export function shouldSendConfirmationReminder(confirmationDeadline: Date): boolean {
  const remainingTime = getRemainingConfirmationTime(confirmationDeadline);
  return (
    remainingTime > 0 &&
    remainingTime <= NOTIFICATION_TIMING.REMINDER_BEFORE_DEADLINE_MS
  );
}

/**
 * Check if owner should be notified about upcoming release
 */
export function shouldNotifyOwnerAboutRelease(confirmationDeadline: Date): boolean {
  const remainingTime = getRemainingConfirmationTime(confirmationDeadline);
  return (
    remainingTime > 0 &&
    remainingTime <= NOTIFICATION_TIMING.OWNER_NOTIFICATION_BEFORE_RELEASE_MS
  );
}

export const PAYMENT_TIMING_CONSTANTS = {
  CONFIRMATION_PERIOD,
  PAYMENT_LOCK,
  REFUND_WINDOW,
  RELEASE_SCHEDULE,
  NOTIFICATION_TIMING,
  calculateConfirmationDeadline,
  calculatePaymentLockExpiry,
  hasConfirmationPeriodPassed,
  hasPaymentLockExpired,
  getRemainingConfirmationTime,
  shouldSendConfirmationReminder,
  shouldNotifyOwnerAboutRelease,
} as const;