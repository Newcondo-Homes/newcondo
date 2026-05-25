import { Decimal } from '@newcondo/db';
import { PaymentHoldStatus, PaymentHold, PaymentReleaseSchedule } from '../types/paymentRelease';
/**
 * Confirmation period in milliseconds
 */
export declare const CONFIRMATION_PERIOD_MS_FOR_PAYMENTRELEASE: number;
/**
 * Calculate confirmation deadline from payment date
 */
export declare function calculateConfirmationDeadlineForPayment(paymentDate: Date): Date;
/**
 * Check if confirmation period has expired
 */
export declare function isConfirmationPeriodExpired(confirmationDeadline: Date): boolean;
/**
 * Calculate time remaining in confirmation period
 */
export declare function getTimeRemainingInConfirmation(confirmationDeadline: Date): {
    hours: number;
    minutes: number;
    isExpired: boolean;
};
/**
 * Create a base payment hold profile setup
 */
export declare function createPaymentReleaseSchedule(params: {
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
}): Partial<PaymentHold>;
/**
 * Determine payment release status based on current state metrics
 */
export declare function determinePaymentReleaseStatus(params: {
    isConfirmed: boolean;
    confirmationDeadline: Date;
    status: PaymentHoldStatus;
}): PaymentHoldStatus;
/**
 * Check if payment is ready for release execution
 */
export declare function isPaymentReadyForRelease(params: {
    isConfirmed: boolean;
    confirmationDeadline: Date;
    status: PaymentHoldStatus;
}): boolean;
/**
 * Check if payment can still be refunded
 */
export declare function canPaymentBeRefunded(params: {
    status: PaymentHoldStatus;
    confirmationDeadline: Date;
}): {
    canRefund: boolean;
    reason?: string;
};
/**
 * Get unified dashboard data frame representation details
 */
export declare function getPaymentHoldPeriod(paymentDate: Date): {
    startDate: Date;
    endDate: Date;
    durationHours: number;
    timeRemaining: {
        hours: number;
        minutes: number;
        isExpired: boolean;
    };
    status: string;
};
/**
 * Calculate next auto-release batch time
 */
export declare function getNextAutoReleaseBatchTime(): Date;
/**
 * Get payments ready for auto-release tracking schedules
 */
export declare function filterPaymentsForAutoRelease(schedules: PaymentReleaseSchedule[]): PaymentReleaseSchedule[];
/**
 * Format time remaining for display
 */
export declare function formatTimeRemaining(timeRemaining: {
    hours: number;
    minutes: number;
    isExpired: boolean;
}): string;
/**
 * Validate payment release eligibility criteria
 */
export declare function validatePaymentReleaseEligibility(params: {
    paymentId: string;
    status: PaymentHoldStatus;
    confirmationDeadline: Date;
    totalAmount: Decimal;
}): {
    isEligible: boolean;
    errors: string[];
};
//# sourceMappingURL=paymentRelease.d.ts.map