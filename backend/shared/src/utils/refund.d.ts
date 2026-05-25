import { Decimal } from '@newcondo/db';
interface RefundRequest {
    paymentId: string;
    rentalId: string;
    userId: string;
    originalAmount: Decimal;
    serviceFee: Decimal;
    reason: string;
    requestedAt: Date;
}
export interface RefundBreakdown {
    totalPaid: Decimal;
    serviceFee: Decimal;
    refundableAmount: Decimal;
    flutterwaveRefundFee: Decimal;
    netRefundAmount: Decimal;
    breakdown: {
        originalPayment: string;
        serviceFeeDeducted: string;
        processingFeeDeducted: string;
        finalRefundAmount: string;
    };
}
export declare enum RefundEligibility {
    ELIGIBLE = "ELIGIBLE",
    PAST_DEADLINE = "PAST_DEADLINE",
    ALREADY_RELEASED = "ALREADY_RELEASED",
    ALREADY_REFUNDED = "ALREADY_REFUNDED",
    PAYMENT_PENDING = "PAYMENT_PENDING"
}
export interface RefundEligibilityCheck {
    isEligible: boolean;
    status: RefundEligibility;
    reason?: string;
    deadlineDate?: Date;
    hoursRemaining?: number;
}
/**
 * Calculate refund breakdown
 * Note: Service fee is non-refundable as stated in requirements
 * @param totalPaid - Total amount paid including service fee
 * @param serviceFee - Service fee that was charged (non-refundable)
 * @returns Detailed refund breakdown
 */
export declare function calculateRefundBreakdown(totalPaid: Decimal | number, serviceFee: Decimal | number): RefundBreakdown;
/**
 * Check if payment is eligible for refund
 * @param confirmationPeriodEnd - When the 24-hour confirmation period ends
 * @param paymentStatus - Current payment status
 * @param isReleased - Whether payment has been released
 * @returns Eligibility check result
 */
export declare function checkRefundEligibility(confirmationPeriodEnd: Date, paymentStatus: string, isReleased: boolean): RefundEligibilityCheck;
/**
 * Validate refund request
 * @param request - Refund request details
 * @returns Validation result
 */
export declare function validateRefundRequest(request: RefundRequest): {
    isValid: boolean;
    errors: string[];
};
/**
 * Get refund summary for display
 * @param breakdown - Refund breakdown
 * @returns Human-readable summary
 */
export declare function getRefundSummary(breakdown: RefundBreakdown): string;
/**
 * Calculate refund deadline (24 hours from payment)
 * @param paymentDate - Date when payment was made
 * @returns Refund deadline date
 */
export declare function calculateRefundDeadline(paymentDate: Date): Date;
/**
 * Check if currently within refund period
 * @param confirmationPeriodEnd - When confirmation period ends
 * @returns true if within refund period
 */
export declare function isWithinRefundPeriod(confirmationPeriodEnd: Date): boolean;
/**
 * Get time remaining in refund period
 * @param confirmationPeriodEnd - When confirmation period ends
 * @returns Time remaining in hours and minutes
 */
export declare function getTimeRemainingInRefundPeriod(confirmationPeriodEnd: Date): {
    hours: number;
    minutes: number;
    isExpired: boolean;
};
/**
 * Format refund reason for notifications
 * @param reason - Raw refund reason
 * @param maxLength - Maximum length of formatted reason
 * @returns Formatted reason
 */
export declare function formatRefundReason(reason: string, maxLength?: number): string;
/**
 * Create refund notification message
 * @param breakdown - Refund breakdown
 * @param reason - Refund reason
 * @returns Formatted notification message
 */
export declare function createRefundNotificationMessage(breakdown: RefundBreakdown, reason: string): string;
export {};
//# sourceMappingURL=refund.d.ts.map