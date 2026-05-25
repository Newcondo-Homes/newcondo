"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmationPeriodUtils = void 0;
const confirmation_1 = require("../types/confirmation");
class ConfirmationPeriodUtils {
    /**
     * Calculate confirmation period details from payment date
     */
    static calculateConfirmationPeriod(paymentDate) {
        const startTime = new Date(paymentDate);
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + this.CONFIRMATION_PERIOD_HOURS);
        const now = new Date();
        const remainingMs = endTime.getTime() - now.getTime();
        const remainingHours = Math.max(0, remainingMs / (1000 * 60 * 60));
        return {
            startTime,
            endTime,
            durationHours: this.CONFIRMATION_PERIOD_HOURS,
            isActive: now < endTime && now >= startTime,
            hasExpired: now >= endTime,
            remainingHours: Math.round(remainingHours * 100) / 100,
        };
    }
    /**
     * Check if confirmation period is still active
     */
    static isConfirmationPeriodActive(confirmationDeadline) {
        return new Date() < new Date(confirmationDeadline);
    }
    /**
     * Check if confirmation period has expired
     */
    static hasConfirmationPeriodExpired(confirmationDeadline) {
        return new Date() >= new Date(confirmationDeadline);
    }
    /**
     * Get remaining time in confirmation period
     */
    static getRemainingTime(confirmationDeadline) {
        const now = new Date();
        const deadline = new Date(confirmationDeadline);
        const remainingMs = Math.max(0, deadline.getTime() - now.getTime());
        return {
            totalMilliseconds: remainingMs,
            hours: Math.floor(remainingMs / (1000 * 60 * 60)),
            minutes: Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((remainingMs % (1000 * 60)) / 1000),
        };
    }
    /**
     * Check if confirmation deadline is approaching (within warning threshold)
     */
    static isDeadlineApproaching(confirmationDeadline) {
        const remaining = this.getRemainingTime(confirmationDeadline);
        const remainingHours = remaining.totalMilliseconds / (1000 * 60 * 60);
        return remainingHours > 0 && remainingHours <= this.WARNING_THRESHOLD_HOURS;
    }
    /**
     * Calculate the release date (immediately after confirmation period ends)
     */
    static calculateReleaseDate(confirmationDeadline) {
        return new Date(confirmationDeadline);
    }
    /**
     * Get confirmation status based on current state
     */
    static getConfirmationStatus(isConfirmed, confirmationDeadline, hasDispute) {
        if (hasDispute) {
            return confirmation_1.ConfirmationStatus.DISPUTED;
        }
        if (isConfirmed) {
            return confirmation_1.ConfirmationStatus.CONFIRMED;
        }
        const hasExpired = this.hasConfirmationPeriodExpired(confirmationDeadline);
        if (hasExpired) {
            return confirmation_1.ConfirmationStatus.AUTO_CONFIRMED;
        }
        return confirmation_1.ConfirmationStatus.PENDING;
    }
    /**
     * Format remaining time as human-readable string
     */
    static formatRemainingTime(confirmationDeadline) {
        const remaining = this.getRemainingTime(confirmationDeadline);
        if (remaining.totalMilliseconds === 0) {
            return 'Expired';
        }
        if (remaining.hours > 0) {
            return `${remaining.hours}h ${remaining.minutes}m remaining`;
        }
        if (remaining.minutes > 0) {
            return `${remaining.minutes}m ${remaining.seconds}s remaining`;
        }
        return `${remaining.seconds}s remaining`;
    }
    /**
     * Get payments that need confirmation reminder notifications
     */
    static shouldSendReminderNotification(confirmationDeadline, lastReminderSentAt) {
        if (!this.isConfirmationPeriodActive(confirmationDeadline)) {
            return false;
        }
        if (!this.isDeadlineApproaching(confirmationDeadline)) {
            return false;
        }
        // Don't send reminder if one was sent in the last 2 hours
        if (lastReminderSentAt) {
            const hoursSinceLastReminder = (new Date().getTime() - new Date(lastReminderSentAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastReminder < 2) {
                return false;
            }
        }
        return true;
    }
    /**
     * Validate confirmation request timing
     */
    static canConfirmPayment(confirmationDeadline) {
        if (this.hasConfirmationPeriodExpired(confirmationDeadline)) {
            return {
                canConfirm: false,
                reason: 'Confirmation period has expired. Payment will be auto-confirmed.',
            };
        }
        return { canConfirm: true };
    }
    /**
     * Calculate auto-confirmation date
     */
    static getAutoConfirmationDate(paymentDate) {
        const deadline = new Date(paymentDate);
        deadline.setHours(deadline.getHours() + this.CONFIRMATION_PERIOD_HOURS);
        return deadline;
    }
}
exports.ConfirmationPeriodUtils = ConfirmationPeriodUtils;
// TODO: since CONFIRMATION_PERIOD_HOURS may change in the future, find the best
// place to put it so it can be referenced here or anywhere its needed
ConfirmationPeriodUtils.CONFIRMATION_PERIOD_HOURS = 24;
ConfirmationPeriodUtils.WARNING_THRESHOLD_HOURS = 6;
//# sourceMappingURL=confirmationPeriod.js.map