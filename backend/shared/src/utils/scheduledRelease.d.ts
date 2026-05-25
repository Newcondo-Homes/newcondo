import { Decimal } from '@newcondo/db';
/**
 * Confirmation period is 24 hours from payment
 */
export declare const CONFIRMATION_RELEASE_PERIOD_HOURS = 24;
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
declare enum ReleaseStatus {
    PENDING = "PENDING",
    SCHEDULED = "SCHEDULED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
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
export declare function calculateConfirmationPeriodEnd(paymentDate: Date): Date;
/**
 * Check if confirmation period has ended
 * @param confirmationPeriodEnd - Date when confirmation period ends
 * @returns true if period has ended
 */
export declare function hasConfirmationPeriodEnded(confirmationPeriodEnd: Date): boolean;
/**
 * Get hours remaining in confirmation period
 * @param confirmationPeriodEnd - Date when confirmation period ends
 * @returns Hours remaining (0 if expired)
 */
export declare function getHoursRemainingInConfirmationPeriod(confirmationPeriodEnd: Date): number;
/**
 * Create payment release schedule
 * @param paymentId - Payment ID
 * @param paymentDate - Date when payment was made
 * @returns Release schedule
 */
export declare function createPaymentReleaseScheduleFunction(paymentId: string, paymentDate: Date): PaymentReleaseSchedule;
/**
 * Find payments ready for release
 * @param payments - Array of payments with their confirmation period end dates
 * @returns Array of payment IDs ready for release
 */
export declare function findPaymentsReadyForRelease(payments: Array<{
    id: string;
    confirmationPeriodEnd: Date;
    isReleased: boolean;
}>): string[];
/**
 * Create release distribution plan
 * @param paymentId - Payment ID
 * @param totalAmount - Total amount to distribute
 * @param distributions - Distribution details for each recipient
 * @returns Release distribution plan
 */
export declare function createReleaseDistribution(paymentId: string, totalAmount: Decimal | number, distributions: Array<{
    recipientId: string;
    recipientType: 'OWNER' | 'LISTING_AGENT' | 'SUB_AGENT' | 'PLATFORM';
    amount: Decimal | number;
    virtualAccountId?: string;
}>): ReleaseDistribution;
/**
 * Validate release distribution
 * @param distribution - Release distribution to validate
 * @returns Validation result
 */
export declare function validateReleaseDistribution(distribution: ReleaseDistribution): {
    isValid: boolean;
    errors: string[];
};
/**
 * Create release job for scheduled processing
 * @param paymentId - Payment ID
 * @param scheduledFor - When to process the release
 * @returns Release job
 */
export declare function createReleaseJob(paymentId: string, scheduledFor: Date, maxRetries?: number): ReleaseJob;
/**
 * Check if release job should be retried
 * @param job - Release job to check
 * @returns true if job should be retried
 */
export declare function shouldRetryReleaseJob(job: ReleaseJob): boolean;
/**
 * Calculate next retry time with exponential backoff
 * @param retryCount - Current retry count
 * @returns Date for next retry
 */
export declare function calculateNextRetryTime(retryCount: number): Date;
/**
 * Get release summary for notifications
 * @param distribution - Release distribution
 * @returns Human-readable summary
 */
export declare function getReleaseSummary(distribution: ReleaseDistribution): string;
/**
 * Create release notification message for recipient
 * @param recipientType - Type of recipient
 * @param amount - Amount released
 * @param paymentId - Payment ID
 * @returns Formatted notification message
 */
export declare function createReleaseNotificationMessage(recipientType: 'OWNER' | 'LISTING_AGENT' | 'SUB_AGENT' | 'PLATFORM', amount: Decimal, paymentId: string): string;
/**
 * Batch payments ready for release
 * @param payments - Array of payments ready for release
 * @param batchSize - Maximum number of payments per batch
 * @returns Array of payment batches
 */
export declare function batchPaymentsForRelease(payments: string[], batchSize?: number): string[][];
/**
 * Get estimated release time message
 * @param confirmationPeriodEnd - When confirmation period ends
 * @returns User-friendly message about release timing
 */
export declare function getEstimatedReleaseMessage(confirmationPeriodEnd: Date): string;
export {};
//# sourceMappingURL=scheduledRelease.d.ts.map