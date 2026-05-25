"use strict";
// backend/shared/src/constants/paymentTimings.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENT_TIMING_CONSTANTS = exports.NOTIFICATION_TIMING = exports.RELEASE_SCHEDULE = exports.REFUND_WINDOW = exports.PAYMENT_LOCK = exports.CONFIRMATION_PERIOD = void 0;
exports.calculateConfirmationDeadline = calculateConfirmationDeadline;
exports.calculatePaymentLockExpiry = calculatePaymentLockExpiry;
exports.hasConfirmationPeriodPassed = hasConfirmationPeriodPassed;
exports.hasPaymentLockExpired = hasPaymentLockExpired;
exports.getRemainingConfirmationTime = getRemainingConfirmationTime;
exports.shouldSendConfirmationReminder = shouldSendConfirmationReminder;
exports.shouldNotifyOwnerAboutRelease = shouldNotifyOwnerAboutRelease;
/**
 * Timing constants for payment confirmation and release system
 */
exports.CONFIRMATION_PERIOD = {
    // 24-hour confirmation period (in milliseconds)
    DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
    DURATION_HOURS: 24,
    DURATION_MINUTES: 24 * 60,
    DURATION_SECONDS: 24 * 60 * 60,
};
exports.PAYMENT_LOCK = {
    // Payment lock duration to prevent double booking (15 minutes)
    DURATION_MS: 15 * 60 * 1000, // 15 minutes
    DURATION_MINUTES: 15,
    // Grace period before lock expiry warning (2 minutes)
    WARNING_BEFORE_EXPIRY_MS: 2 * 60 * 1000,
};
exports.REFUND_WINDOW = {
    // Maximum time to request refund (within confirmation period)
    DURATION_MS: exports.CONFIRMATION_PERIOD.DURATION_MS,
    DURATION_HOURS: exports.CONFIRMATION_PERIOD.DURATION_HOURS,
};
exports.RELEASE_SCHEDULE = {
    // How frequently to check for payments ready to release (every 5 minutes)
    CHECK_INTERVAL_MS: 5 * 60 * 1000,
    CHECK_INTERVAL_MINUTES: 5,
    // Batch size for processing releases
    BATCH_SIZE: 50,
    // Retry configuration for failed releases
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 30 * 1000, // 30 seconds between retries
};
exports.NOTIFICATION_TIMING = {
    // When to send confirmation reminder to renter
    REMINDER_BEFORE_DEADLINE_HOURS: 6, // 6 hours before deadline
    REMINDER_BEFORE_DEADLINE_MS: 6 * 60 * 60 * 1000,
    // When to notify owner about pending release
    OWNER_NOTIFICATION_BEFORE_RELEASE_HOURS: 2, // 2 hours before release
    OWNER_NOTIFICATION_BEFORE_RELEASE_MS: 2 * 60 * 60 * 1000,
};
/**
 * Calculate confirmation deadline from payment time
 */
function calculateConfirmationDeadline(paymentDate) {
    return new Date(paymentDate.getTime() + exports.CONFIRMATION_PERIOD.DURATION_MS);
}
/**
 * Calculate payment lock expiry time
 */
function calculatePaymentLockExpiry(lockStartTime) {
    return new Date(lockStartTime.getTime() + exports.PAYMENT_LOCK.DURATION_MS);
}
/**
 * Check if confirmation period has passed
 */
function hasConfirmationPeriodPassed(confirmationDeadline) {
    return new Date() >= confirmationDeadline;
}
/**
 * Check if payment lock has expired
 */
function hasPaymentLockExpired(lockExpiry) {
    return new Date() >= lockExpiry;
}
/**
 * Calculate remaining time in confirmation period (in milliseconds)
 */
function getRemainingConfirmationTime(confirmationDeadline) {
    const remaining = confirmationDeadline.getTime() - Date.now();
    return Math.max(0, remaining);
}
/**
 * Check if reminder should be sent
 */
function shouldSendConfirmationReminder(confirmationDeadline) {
    const remainingTime = getRemainingConfirmationTime(confirmationDeadline);
    return (remainingTime > 0 &&
        remainingTime <= exports.NOTIFICATION_TIMING.REMINDER_BEFORE_DEADLINE_MS);
}
/**
 * Check if owner should be notified about upcoming release
 */
function shouldNotifyOwnerAboutRelease(confirmationDeadline) {
    const remainingTime = getRemainingConfirmationTime(confirmationDeadline);
    return (remainingTime > 0 &&
        remainingTime <= exports.NOTIFICATION_TIMING.OWNER_NOTIFICATION_BEFORE_RELEASE_MS);
}
exports.PAYMENT_TIMING_CONSTANTS = {
    CONFIRMATION_PERIOD: exports.CONFIRMATION_PERIOD,
    PAYMENT_LOCK: exports.PAYMENT_LOCK,
    REFUND_WINDOW: exports.REFUND_WINDOW,
    RELEASE_SCHEDULE: exports.RELEASE_SCHEDULE,
    NOTIFICATION_TIMING: exports.NOTIFICATION_TIMING,
    calculateConfirmationDeadline,
    calculatePaymentLockExpiry,
    hasConfirmationPeriodPassed,
    hasPaymentLockExpired,
    getRemainingConfirmationTime,
    shouldSendConfirmationReminder,
    shouldNotifyOwnerAboutRelease,
};
//# sourceMappingURL=paymentTimings.js.map