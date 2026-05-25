import { ConfirmationPeriod, ConfirmationStatus } from '../types/confirmation';
export declare class ConfirmationPeriodUtils {
    private static readonly CONFIRMATION_PERIOD_HOURS;
    private static readonly WARNING_THRESHOLD_HOURS;
    /**
     * Calculate confirmation period details from payment date
     */
    static calculateConfirmationPeriod(paymentDate: Date): ConfirmationPeriod;
    /**
     * Check if confirmation period is still active
     */
    static isConfirmationPeriodActive(confirmationDeadline: Date): boolean;
    /**
     * Check if confirmation period has expired
     */
    static hasConfirmationPeriodExpired(confirmationDeadline: Date): boolean;
    /**
     * Get remaining time in confirmation period
     */
    static getRemainingTime(confirmationDeadline: Date): {
        hours: number;
        minutes: number;
        seconds: number;
        totalMilliseconds: number;
    };
    /**
     * Check if confirmation deadline is approaching (within warning threshold)
     */
    static isDeadlineApproaching(confirmationDeadline: Date): boolean;
    /**
     * Calculate the release date (immediately after confirmation period ends)
     */
    static calculateReleaseDate(confirmationDeadline: Date): Date;
    /**
     * Get confirmation status based on current state
     */
    static getConfirmationStatus(isConfirmed: boolean, confirmationDeadline: Date, hasDispute: boolean): ConfirmationStatus;
    /**
     * Format remaining time as human-readable string
     */
    static formatRemainingTime(confirmationDeadline: Date): string;
    /**
     * Get payments that need confirmation reminder notifications
     */
    static shouldSendReminderNotification(confirmationDeadline: Date, lastReminderSentAt?: Date): boolean;
    /**
     * Validate confirmation request timing
     */
    static canConfirmPayment(confirmationDeadline: Date): {
        canConfirm: boolean;
        reason?: string;
    };
    /**
     * Calculate auto-confirmation date
     */
    static getAutoConfirmationDate(paymentDate: Date): Date;
}
//# sourceMappingURL=confirmationPeriod.d.ts.map