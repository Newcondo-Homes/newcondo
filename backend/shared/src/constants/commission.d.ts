/**
 * Commission rates and distribution rules for the platform
 */
export declare const COMMISSION_RATES: {
    readonly PLATFORM_COMMISSION_RATE: 0.2;
    readonly AGENT_COMMISSION_SPLIT: 0.5;
    readonly PLATFORM_FEE_SPLIT: 0.5;
    readonly SUB_AGENT_SPLIT: 0.5;
    readonly LISTING_AGENT_SPLIT: 0.5;
};
export declare const SERVICE_FEE: {
    readonly SERVICE_FEE_MULTIPLIER: 2;
    readonly FLUTTERWAVE_PERCENTAGE: 0.014;
    readonly FLUTTERWAVE_FIXED_FEE: 100;
    readonly IS_REFUNDABLE: false;
};
/**
 * Calculate service fee for a transaction
 * Formula: 2 * (1.4% of amount + NGN 100)
 */
export declare function calculateServiceFee(amount: number): number;
/**
 * Calculate platform commission (20% of rent)
 */
export declare function calculatePlatformCommission(rentAmount: number): number;
/**
 * Calculate agent commission distribution
 * @param platformCommission - The 20% commission collected by platform
 * @param hasAgent - Whether an agent is involved
 * @param hasSubAgent - Whether a sub-agent is involved
 * @returns Object with commission breakdown
 */
export declare function calculateCommissionDistributionForAgent(platformCommission: number, hasAgent: boolean, hasSubAgent?: boolean): {
    platformAmount: number;
    listingAgentAmount: number;
    subAgentAmount: number;
    totalAgentAmount: number;
};
/**
 * Calculate total payment amount including service fee
 */
export declare function calculateTotalPaymentAmount(rentAmount: number): number;
/**
 * Calculate owner payout after commission deduction
 */
export declare function calculateOwnerPayout(rentAmount: number, platformCommission: number): number;
/**
 * Complete commission breakdown for a rental payment
 */
interface CommissionBreakdown {
    rentAmount: number;
    serviceFee: number;
    totalPaymentAmount: number;
    platformCommission: number;
    platformAmount: number;
    listingAgentAmount: number;
    subAgentAmount: number;
    totalAgentAmount: number;
    ownerPayout: number;
}
/**
 * Calculate complete commission breakdown
 */
export declare function calculateCompleteBreakdown(rentAmount: number, hasAgent: boolean, hasSubAgent?: boolean): CommissionBreakdown;
export declare const COMMISSION_CONSTANTS: {
    readonly RATES: {
        readonly PLATFORM_COMMISSION_RATE: 0.2;
        readonly AGENT_COMMISSION_SPLIT: 0.5;
        readonly PLATFORM_FEE_SPLIT: 0.5;
        readonly SUB_AGENT_SPLIT: 0.5;
        readonly LISTING_AGENT_SPLIT: 0.5;
    };
    readonly SERVICE_FEE: {
        readonly SERVICE_FEE_MULTIPLIER: 2;
        readonly FLUTTERWAVE_PERCENTAGE: 0.014;
        readonly FLUTTERWAVE_FIXED_FEE: 100;
        readonly IS_REFUNDABLE: false;
    };
    readonly calculateServiceFee: typeof calculateServiceFee;
    readonly calculatePlatformCommission: typeof calculatePlatformCommission;
    readonly calculateCommissionDistributionForAgent: typeof calculateCommissionDistributionForAgent;
    readonly calculateTotalPaymentAmount: typeof calculateTotalPaymentAmount;
    readonly calculateOwnerPayout: typeof calculateOwnerPayout;
    readonly calculateCompleteBreakdown: typeof calculateCompleteBreakdown;
};
export {};
//# sourceMappingURL=commission.d.ts.map