"use strict";
// backend/shared/src/utils/paymentRelease.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIRMATION_PERIOD_MS_FOR_PAYMENTRELEASE = void 0;
exports.calculateConfirmationDeadlineForPayment = calculateConfirmationDeadlineForPayment;
exports.isConfirmationPeriodExpired = isConfirmationPeriodExpired;
exports.getTimeRemainingInConfirmation = getTimeRemainingInConfirmation;
exports.createPaymentReleaseSchedule = createPaymentReleaseSchedule;
exports.determinePaymentReleaseStatus = determinePaymentReleaseStatus;
exports.isPaymentReadyForRelease = isPaymentReadyForRelease;
exports.canPaymentBeRefunded = canPaymentBeRefunded;
exports.getPaymentHoldPeriod = getPaymentHoldPeriod;
exports.getNextAutoReleaseBatchTime = getNextAutoReleaseBatchTime;
exports.filterPaymentsForAutoRelease = filterPaymentsForAutoRelease;
exports.formatTimeRemaining = formatTimeRemaining;
exports.validatePaymentReleaseEligibility = validatePaymentReleaseEligibility;
const paymentRelease_1 = require("../types/paymentRelease");
const constants_1 = require("../constants");
/**
 * Confirmation period in milliseconds
 */
exports.CONFIRMATION_PERIOD_MS_FOR_PAYMENTRELEASE = constants_1.CONFIRMATION_PERIOD_HOURS * 60 * 60 * 1000;
/**
 * Calculate confirmation deadline from payment date
 */
function calculateConfirmationDeadlineForPayment(paymentDate) {
    return new Date(paymentDate.getTime() + exports.CONFIRMATION_PERIOD_MS_FOR_PAYMENTRELEASE);
}
/**
 * Check if confirmation period has expired
 */
function isConfirmationPeriodExpired(confirmationDeadline) {
    const now = new Date();
    return now >= confirmationDeadline;
}
/**
 * Calculate time remaining in confirmation period
 */
function getTimeRemainingInConfirmation(confirmationDeadline) {
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
function createPaymentReleaseSchedule(params) {
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
        status: paymentRelease_1.PaymentHoldStatus.HELD,
        heldAt: paymentDate,
        releaseScheduledAt: confirmationDeadline,
        isConfirmed: false
    };
}
/**
 * Determine payment release status based on current state metrics
 */
function determinePaymentReleaseStatus(params) {
    const { isConfirmed, confirmationDeadline, status } = params;
    if (status === paymentRelease_1.PaymentHoldStatus.REFUNDED) {
        return paymentRelease_1.PaymentHoldStatus.REFUNDED;
    }
    if (status === paymentRelease_1.PaymentHoldStatus.RELEASED) {
        return paymentRelease_1.PaymentHoldStatus.RELEASED;
    }
    if (status === paymentRelease_1.PaymentHoldStatus.DISPUTED) {
        return paymentRelease_1.PaymentHoldStatus.DISPUTED;
    }
    if (isConfirmed) {
        return paymentRelease_1.PaymentHoldStatus.PENDING_RELEASE;
    }
    const isPeriodExpired = isConfirmationPeriodExpired(confirmationDeadline);
    if (isPeriodExpired) {
        return paymentRelease_1.PaymentHoldStatus.PENDING_RELEASE;
    }
    return paymentRelease_1.PaymentHoldStatus.HELD;
}
/**
 * Check if payment is ready for release execution
 */
function isPaymentReadyForRelease(params) {
    const { isConfirmed, confirmationDeadline, status } = params;
    // Cannot release if already finished or blocked
    if ([paymentRelease_1.PaymentHoldStatus.RELEASED, paymentRelease_1.PaymentHoldStatus.REFUNDED, paymentRelease_1.PaymentHoldStatus.DISPUTED, paymentRelease_1.PaymentHoldStatus.CANCELLED].includes(status)) {
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
function canPaymentBeRefunded(params) {
    const { status, confirmationDeadline } = params;
    if (status === paymentRelease_1.PaymentHoldStatus.REFUNDED) {
        return { canRefund: false, reason: 'Payment has already been refunded' };
    }
    if (status === paymentRelease_1.PaymentHoldStatus.RELEASED) {
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
function getPaymentHoldPeriod(paymentDate) {
    const confirmationDeadline = calculateConfirmationDeadlineForPayment(paymentDate);
    const timeRemaining = getTimeRemainingInConfirmation(confirmationDeadline);
    const status = timeRemaining.isExpired ? 'EXPIRED' : 'ACTIVE';
    return {
        startDate: paymentDate,
        endDate: confirmationDeadline,
        durationHours: constants_1.CONFIRMATION_PERIOD_HOURS,
        timeRemaining,
        status,
    };
}
/**
 * Calculate next auto-release batch time
 */
function getNextAutoReleaseBatchTime() {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setMinutes(0, 0, 0);
    nextHour.setHours(nextHour.getHours() + 1);
    return nextHour;
}
/**
 * Get payments ready for auto-release tracking schedules
 */
function filterPaymentsForAutoRelease(schedules) {
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
function formatTimeRemaining(timeRemaining) {
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
function validatePaymentReleaseEligibility(params) {
    const errors = [];
    const { status, confirmationDeadline, totalAmount } = params;
    if (status === paymentRelease_1.PaymentHoldStatus.RELEASED) {
        errors.push('Payment has already been released');
    }
    if (status === paymentRelease_1.PaymentHoldStatus.REFUNDED) {
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
//# sourceMappingURL=paymentRelease.js.map