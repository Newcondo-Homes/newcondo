import { Decimal } from '@newcondo/db';
import { CommissionBreakdown, CalculateCommissionInput, CommissionDistribution, AgentType } from '../types/commission';
/**
 * Agent share of platform commission (50% of the 20%)
 */
export declare const AGENT_COMMISSION_SHARE = 0.5;
/**
 * Flutterwave transaction fee rate (approximately 1.4%)
 */
export declare const FLUTTERWAVE_FEE_RATE = 0.014;
/**
 * Our service fee multiplier (2x Flutterwave fee to cover refund costs)
 */
export declare const SERVICE_FEE_MULTIPLIER = 2;
interface CreateDistributionInput {
    rentalId: string;
    propertyId: string;
    unitId?: string;
    breakdown: CommissionBreakdown;
    ownerVirtualAccountId: string;
    platformVirtualAccountId: string;
    listingAgentVirtualAccountId?: string;
    subAgentVirtualAccountId?: string;
}
/**
 * Calculate service fee (double Flutterwave's charge to cover refunds)
 * @param amount - Transaction amount
 * @returns Service fee amount
 */
export declare function calculateServiceFeeToCoverFlutterwaveCharge(amount: Decimal | number): Decimal;
/**
 * Calculate platform commission (20% of rent)
 */
export declare function calculatePlatformCommissionForRent(rentAmount: number | Decimal): Decimal;
/**
 * Calculate agent commission based on agent type
 * - Listing agent only: Gets full 50% of platform commission
 * - Listing agent + Sub-agent: Each gets 25% of platform commission (split the 50%)
 */
export declare function calculateAgentCommission(rentAmount: number | Decimal, agentType: AgentType): Decimal;
/**
 * Calculate complete commission breakdown for a rental payment
 */
export declare function calculateCommissionBreakdown(input: CalculateCommissionInput): CommissionBreakdown;
/**
 * Create distribution instructions for payment release
 */
export declare function createCommissionDistribution(input: CreateDistributionInput): CommissionDistribution;
/**
 * Validates that a commission breakdown's math is correct and balances completely.
 */
export declare function validateCommissionBreakdown(breakdown: CommissionBreakdown): boolean;
/**
 * Calculate refund amount (excludes service fee)
 */
export declare function calculateRefundAmount(totalPaid: number | Decimal, serviceFee: number | Decimal): Decimal;
export {};
//# sourceMappingURL=commission.d.ts.map