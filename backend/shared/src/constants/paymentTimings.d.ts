/**
 * Timing constants for payment confirmation and release system
 */
export declare const CONFIRMATION_PERIOD: {
    readonly DURATION_MS: number;
    readonly DURATION_HOURS: 24;
    readonly DURATION_MINUTES: number;
    readonly DURATION_SECONDS: number;
};
export declare const PAYMENT_LOCK: {
    readonly DURATION_MS: number;
    readonly DURATION_MINUTES: 15;
    readonly WARNING_BEFORE_EXPIRY_MS: number;
};
export declare const REFUND_WINDOW: {
    readonly DURATION_MS: number;
    readonly DURATION_HOURS: 24;
};
export declare const RELEASE_SCHEDULE: {
    readonly CHECK_INTERVAL_MS: number;
    readonly CHECK_INTERVAL_MINUTES: 5;
    readonly BATCH_SIZE: 50;
    readonly MAX_RETRIES: 3;
    readonly RETRY_DELAY_MS: number;
};
export declare const NOTIFICATION_TIMING: {
    readonly REMINDER_BEFORE_DEADLINE_HOURS: 6;
    readonly REMINDER_BEFORE_DEADLINE_MS: number;
    readonly OWNER_NOTIFICATION_BEFORE_RELEASE_HOURS: 2;
    readonly OWNER_NOTIFICATION_BEFORE_RELEASE_MS: number;
};
/**
 * Calculate confirmation deadline from payment time
 */
export declare function calculateConfirmationDeadline(paymentDate: Date): Date;
/**
 * Calculate payment lock expiry time
 */
export declare function calculatePaymentLockExpiry(lockStartTime: Date): Date;
/**
 * Check if confirmation period has passed
 */
export declare function hasConfirmationPeriodPassed(confirmationDeadline: Date): boolean;
/**
 * Check if payment lock has expired
 */
export declare function hasPaymentLockExpired(lockExpiry: Date): boolean;
/**
 * Calculate remaining time in confirmation period (in milliseconds)
 */
export declare function getRemainingConfirmationTime(confirmationDeadline: Date): number;
/**
 * Check if reminder should be sent
 */
export declare function shouldSendConfirmationReminder(confirmationDeadline: Date): boolean;
/**
 * Check if owner should be notified about upcoming release
 */
export declare function shouldNotifyOwnerAboutRelease(confirmationDeadline: Date): boolean;
export declare const PAYMENT_TIMING_CONSTANTS: {
    readonly CONFIRMATION_PERIOD: {
        readonly DURATION_MS: number;
        readonly DURATION_HOURS: 24;
        readonly DURATION_MINUTES: number;
        readonly DURATION_SECONDS: number;
    };
    readonly PAYMENT_LOCK: {
        readonly DURATION_MS: number;
        readonly DURATION_MINUTES: 15;
        readonly WARNING_BEFORE_EXPIRY_MS: number;
    };
    readonly REFUND_WINDOW: {
        readonly DURATION_MS: number;
        readonly DURATION_HOURS: 24;
    };
    readonly RELEASE_SCHEDULE: {
        readonly CHECK_INTERVAL_MS: number;
        readonly CHECK_INTERVAL_MINUTES: 5;
        readonly BATCH_SIZE: 50;
        readonly MAX_RETRIES: 3;
        readonly RETRY_DELAY_MS: number;
    };
    readonly NOTIFICATION_TIMING: {
        readonly REMINDER_BEFORE_DEADLINE_HOURS: 6;
        readonly REMINDER_BEFORE_DEADLINE_MS: number;
        readonly OWNER_NOTIFICATION_BEFORE_RELEASE_HOURS: 2;
        readonly OWNER_NOTIFICATION_BEFORE_RELEASE_MS: number;
    };
    readonly calculateConfirmationDeadline: typeof calculateConfirmationDeadline;
    readonly calculatePaymentLockExpiry: typeof calculatePaymentLockExpiry;
    readonly hasConfirmationPeriodPassed: typeof hasConfirmationPeriodPassed;
    readonly hasPaymentLockExpired: typeof hasPaymentLockExpired;
    readonly getRemainingConfirmationTime: typeof getRemainingConfirmationTime;
    readonly shouldSendConfirmationReminder: typeof shouldSendConfirmationReminder;
    readonly shouldNotifyOwnerAboutRelease: typeof shouldNotifyOwnerAboutRelease;
};
//# sourceMappingURL=paymentTimings.d.ts.map