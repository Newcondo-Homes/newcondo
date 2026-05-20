/**
 * Commission-related types for the Payment Confirmation & Release System
 * Location: backend/shared/src/types/commission.ts
 */

import { Decimal } from '@newcondo/db';


/**
 * Commission rates configuration
*/
export interface CommissionRates {
  platformCommissionRate: number; // 0.20 (20%)
  agentCommissionRate: number; // 0.50 (50% of platform commission)
  subAgentSplitRate: number; // 0.50 (50% split with listing agent)
}

/**
 * Agent involvement types for commission calculation
*/
export enum AgentInvolvementType {
  NO_AGENT = 'NO_AGENT', // Property owner only
  LISTING_AGENT = 'LISTING_AGENT', // Only listing agent involved
  SUB_AGENT = 'SUB_AGENT', // Sub-agent involved via promotional link
}

export type AgentType = AgentInvolvementType;
/**
 * Commission breakdown structure
 */
export interface CommissionBreakdown {
  totalRentAmount: Decimal;
  platformCommission: Decimal; // 20% of rent
  agentCommission: Decimal; // 50% of platform commission (if agent involved)
  listingAgentShare: Decimal; // Agent's share
  subAgentShare: Decimal; // Sub-agent's share (if applicable)
  propertyOwnerAmount: Decimal; // Remaining amount after commissions
  
  // Metadata
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
  
  // Distribution status
  isDistributed: boolean;
  distributedAt?: Date;
  
  // Virtual account transfers
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
export enum RecipientType {
  PLATFORM = 'PLATFORM', // Newcondo
  LISTING_AGENT = 'LISTING_AGENT',
  SUB_AGENT = 'SUB_AGENT',
  PROPERTY_OWNER = 'PROPERTY_OWNER',
}

/**
 * Transfer status
 */
export enum CommissionTransferStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

/**
 * Commission calculation input
 */
export interface CalculateCommissionInput {
  rentAmount: Decimal;
  propertyOwnerId: string;
  listingAgentId?: string;
  subAgentId?: string; // Present if payment came via sub-agent link
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
  priority: number; // Order of execution
}

/**
 * Platform fee configuration
 */
export interface PlatformFeeConfig {
  serviceFeeRate: number; // Service fee percentage
  flutterwaveChargeMultiplier: number; // 2x Flutterwave charge
  isRefundable: boolean; // false - service fee not refundable
}

/**
 * Agent promotion settings
 */
export enum PromotionType {
  PUBLIC = 'PUBLIC', // Any agent can promote
  PERMISSION_BASED = 'PERMISSION_BASED', // Requires approval
  RESTRICTED = 'RESTRICTED', // No promotion allowed
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
  
  // Breakdown by type
  byAgentType: {
    listingAgentOnly: number;
    withSubAgent: number;
    noAgent: number;
  };
}

/**
 * Error types for commission operations
 */
export enum CommissionErrorType {
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  MISSING_RECIPIENT = 'MISSING_RECIPIENT',
  VIRTUAL_ACCOUNT_NOT_FOUND = 'VIRTUAL_ACCOUNT_NOT_FOUND',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  DISTRIBUTION_FAILED = 'DISTRIBUTION_FAILED',
  ALREADY_DISTRIBUTED = 'ALREADY_DISTRIBUTED',
}

/**
 * Commission error
 */
export class CommissionError extends Error {
  constructor(
    public type: CommissionErrorType,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'CommissionError';
  }
}

