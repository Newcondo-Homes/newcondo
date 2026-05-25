/**
 * Commission-related types for the Payment Confirmation & Release System
 * Location: backend/shared/src/types/commission.ts
 */
import { Decimal } from '@newcondo/db';
/**
 * Commission rates configuration
*/
export interface CommissionRates {
    platformCommissionRate: number;
    agentCommissionRate: number;
    subAgentSplitRate: number;
}
/**
 * Agent involvement types for commission calculation
*/
export declare enum AgentInvolvementType {
    NO_AGENT = "NO_AGENT",// Property owner only
    LISTING_AGENT = "LISTING_AGENT",// Only listing agent involved
    SUB_AGENT = "SUB_AGENT"
}
export type AgentType = AgentInvolvementType;
/**
 * Commission breakdown structure
 */
export interface CommissionBreakdown {
    totalRentAmount: Decimal;
    platformCommission: Decimal;
    agentCommission: Decimal;
    listingAgentShare: Decimal;
    subAgentShare: Decimal;
    propertyOwnerAmount: Decimal;
    agentInvolvementType: AgentInvolvementType;
    listingAgentId?: string;
    subAgentId?: string;
    propertyOwnerId: string;
}
/**
 * Commission distribution result
 */
export interface CommissionDistribution {
    rentalId: string;
    propertyId: string;
    unitId?: string;
    breakdown: CommissionBreakdown;
    isDistributed: boolean;
    distributedAt?: Date;
    transfers: CommissionTransfer[];
}
/**
 * Individual commission transfer record
 */
export interface CommissionTransfer {
    id: string;
    recipientId: string;
    recipientType: RecipientType;
    amount: Decimal;
    virtualAccountId: string;
    status: CommissionTransferStatus;
    transferredAt?: Date;
    failureReason?: string;
}
/**
 * Recipient types for commission transfers
 */
export declare enum RecipientType {
    PLATFORM = "PLATFORM",// Newcondo
    LISTING_AGENT = "LISTING_AGENT",
    SUB_AGENT = "SUB_AGENT",
    PROPERTY_OWNER = "PROPERTY_OWNER"
}
/**
 * Transfer status
 */
export declare enum CommissionTransferStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REVERSED = "REVERSED"
}
/**
 * Commission calculation input
 */
export interface CalculateCommissionInput {
    rentAmount: Decimal;
    propertyOwnerId: string;
    listingAgentId?: string;
    subAgentId?: string;
}
/**
 * Commission calculation result
 */
export interface CalculateCommissionResult {
    breakdown: CommissionBreakdown;
    distributionPlan: DistributionPlan[];
}
/**
 * Distribution plan for automated transfers
 */
export interface DistributionPlan {
    recipientId: string;
    recipientType: RecipientType;
    amount: Decimal;
    virtualAccountId?: string;
    priority: number;
}
/**
 * Platform fee configuration
 */
export interface PlatformFeeConfig {
    serviceFeeRate: number;
    flutterwaveChargeMultiplier: number;
    isRefundable: boolean;
}
/**
 * Agent promotion settings
 */
export declare enum PromotionType {
    PUBLIC = "PUBLIC",// Any agent can promote
    PERMISSION_BASED = "PERMISSION_BASED",// Requires approval
    RESTRICTED = "RESTRICTED"
}
/**
 * Property promotion configuration
 */
export interface PropertyPromotionConfig {
    propertyId: string;
    promotionType: PromotionType;
    allowSubAgentPromotion: boolean;
}
/**
 * Sub-agent promotional link
 */
export interface SubAgentPromotionalLink {
    id: string;
    propertyId: string;
    unitId?: string;
    subAgentId: string;
    uniqueLink: string;
    isActive: boolean;
    clickCount: number;
    conversionCount: number;
    createdAt: Date;
}
/**
 * Commission report for analytics
 */
export interface CommissionReport {
    period: {
        startDate: Date;
        endDate: Date;
    };
    totalCommissionsGenerated: Decimal;
    platformEarnings: Decimal;
    agentEarnings: Decimal;
    totalTransactions: number;
    averageCommissionPerTransaction: Decimal;
    byAgentType: {
        listingAgentOnly: number;
        withSubAgent: number;
        noAgent: number;
    };
}
/**
 * Error types for commission operations
 */
export declare enum CommissionErrorType {
    INVALID_AMOUNT = "INVALID_AMOUNT",
    MISSING_RECIPIENT = "MISSING_RECIPIENT",
    VIRTUAL_ACCOUNT_NOT_FOUND = "VIRTUAL_ACCOUNT_NOT_FOUND",
    INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
    DISTRIBUTION_FAILED = "DISTRIBUTION_FAILED",
    ALREADY_DISTRIBUTED = "ALREADY_DISTRIBUTED"
}
/**
 * Commission error
 */
export declare class CommissionError extends Error {
    type: CommissionErrorType;
    details?: Record<string, any> | undefined;
    constructor(type: CommissionErrorType, message: string, details?: Record<string, any> | undefined);
}
//# sourceMappingURL=commission.d.ts.map