import { Decimal } from '@newcondo/db';
/**
 * Commission distribution configuration
 */
export declare const COMMISSION_CONFIG: {
    readonly PLATFORM_COMMISSION_RATE: 0.2;
    readonly AGENT_SHARE_OF_COMMISSION: 0.5;
    readonly SUB_AGENT_SPLIT_RATE: 0.5;
};
export interface CommissionParties {
    hasListingAgent: boolean;
    hasSubAgent: boolean;
    listingAgentId?: string;
    subAgentId?: string;
    propertyOwnerId: string;
}
interface CommissionBreakdown {
    totalRent: Decimal;
    platformCommission: Decimal;
    agentCommission: Decimal;
    ownerAmount: Decimal;
    listingAgentAmount: Decimal;
    subAgentAmount: Decimal;
    newCondoAmount: Decimal;
    breakdown: {
        listingAgentId?: string;
        listingAgentAmount?: string;
        subAgentId?: string;
        subAgentAmount?: string;
        propertyOwnerId: string;
        ownerAmount: string;
        platformAmount: string;
    };
}
/**
 * Calculate commission distribution for a rental payment
 * @param rentAmount - Total rent amount paid
 * @param parties - Information about involved parties
 * @returns Detailed commission breakdown
 */
export declare function calculateCommissionDistributionForRentPayment(rentAmount: Decimal | number, parties: CommissionParties): CommissionBreakdown;
/**
 * Calculate total amount to charge renter (rent + service fee)
 * @param rentAmount - Base rent amount
 * @returns Total amount including service fee
 */
export declare function calculateTotalChargeAmount(rentAmount: Decimal | number): {
    rentAmount: Decimal;
    serviceFee: Decimal;
    totalAmount: Decimal;
};
/**
 * Validate commission distribution totals
 * @param breakdown - Commission breakdown to validate
 * @returns true if valid, throws error if invalid
 */
export declare function validateCommissionDistribution(breakdown: CommissionBreakdown): boolean;
/**
 * Get commission summary for display
 * @param breakdown - Commission breakdown
 * @returns Human-readable summary
 */
export declare function getCommissionSummary(breakdown: CommissionBreakdown): string;
export {};
//# sourceMappingURL=commissionCalculator.d.ts.map