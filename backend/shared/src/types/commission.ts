/**
 * Commission-related types for the Payment Confirmation & Release System
 * Location: backend/shared/src/types/commission.ts
 */

import { Decimal } from '@prisma/client/runtime/library';

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
  status: TransferStatus;
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
export enum TransferStatus {
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


// import { Decimal } from '@prisma/client/runtime/library';

// export interface CommissionBreakdown {
//   totalRentAmount: Decimal;
//   platformCommissionRate: number; // 20% = 0.20
//   platformCommission: Decimal;
//   agentCommissionRate: number; // 50% of platform commission = 0.10 of rent
//   agentCommission: Decimal;
//   ownerAmount: Decimal;
//   serviceFee: Decimal;
//   flutterwaveTransactionFee: Decimal;
//   flutterwaveRefundFee: Decimal;
//   totalServiceFee: Decimal; // serviceFee + double Flutterwave fee
// }

// export interface AgentCommissionSplit {
//   listingAgentId?: string;
//   subAgentId?: string;
//   listingAgentCommission: Decimal;
//   subAgentCommission: Decimal;
//   totalAgentCommission: Decimal;
// }

// export interface CommissionDistribution {
//   paymentId: string;
//   rentalId: string;
//   propertyId: string;
//   unitId?: string;
  
//   // Base amounts
//   rentAmount: Decimal;
  
//   // Platform fees (non-refundable)
//   serviceFee: Decimal;
//   flutterwaveTransactionFee: Decimal;
//   flutterwaveRefundBuffer: Decimal; // Extra fee charged for potential refunds
//   totalServiceFee: Decimal;
  
//   // Commission breakdown
//   platformCommission: Decimal; // 20% of rent
//   totalAgentCommission: Decimal; // 50% of platform commission (10% of rent)
  
//   // Agent split (if applicable)
//   listingAgentId?: string;
//   listingAgentCommission: Decimal; // 50% of agent commission (5% of rent)
//   subAgentId?: string;
//   subAgentCommission: Decimal; // 50% of agent commission (5% of rent)
  
//   // Owner amount
//   ownerId: string;
//   ownerAmount: Decimal; // 80% of rent
  
//   // Virtual account details
//   newcondoVirtualAccountId: string;
//   ownerVirtualAccountId: string;
//   listingAgentVirtualAccountId?: string;
//   subAgentVirtualAccountId?: string;
// }

// export interface CommissionCalculationInput {
//   rentAmount: number;
//   hasListingAgent: boolean;
//   hasSubAgent: boolean;
//   listingAgentId?: string;
//   subAgentId?: string;
//   ownerId: string;
//   flutterwaveTransactionFee: number;
// }

// export interface CommissionPayoutSchedule {
//   distributionId: string;
//   paymentId: string;
//   scheduledAt: Date;
//   executedAt?: Date;
//   status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
//   payouts: CommissionPayout[];
// }

// export interface CommissionPayout {
//   recipientId: string;
//   recipientType: 'OWNER' | 'LISTING_AGENT' | 'SUB_AGENT' | 'PLATFORM';
//   virtualAccountId: string;
//   amount: Decimal;
//   status: 'PENDING' | 'HELD' | 'RELEASED' | 'FAILED';
//   releasedAt?: Date;
//   failureReason?: string;
// }

// export const COMMISSION_RATES = {
//   PLATFORM_RATE: 0.20, // 20% of rent
//   AGENT_SPLIT_RATE: 0.50, // 50% of platform commission
//   LISTING_AGENT_SPLIT: 0.50, // 50% of agent commission
//   SUB_AGENT_SPLIT: 0.50, // 50% of agent commission
//   FLUTTERWAVE_TRANSACTION_FEE_RATE: 0.014, // 1.4% + 100 NGN cap
//   FLUTTERWAVE_FIXED_FEE: 100, // 100 NGN
//   FLUTTERWAVE_FEE_CAP: 2000, // 2000 NGN maximum
// } as const;

















// export interface CommissionRates {
//   platformCommissionRate: number;
//   listingAgentShare: number;
//   subAgentShare: number;
//   markingServiceAgentCommission: number;
//   markingServicePlatformShare: number;
// }

// export interface CommissionBreakdown {
//   totalRentAmount: number;
//   platformCommission: number;
//   listingAgentCommission: number;
//   subAgentCommission: number;
//   ownerAmount: number;
//   newCondoAmount: number;
// }

// export interface MarkingServiceCommissionBreakdown {
//   totalMarkingFee: number;
//   agentCommission: number;
//   platformAmount: number;
// }

// export interface CommissionPaymentData {
//   paymentId: string;
//   rentalId: string;
//   propertyId: string;
//   rentAmount: number;
//   breakdown: CommissionBreakdown;
//   status: CommissionPaymentStatus;
//   scheduledReleaseDate?: Date;
//   releasedDate?: Date;
// }

// export enum CommissionPaymentStatus {
//   PENDING = 'PENDING',
//   HELD = 'HELD',
//   RELEASED = 'RELEASED',
//   CANCELLED = 'CANCELLED',
//   DISPUTED = 'DISPUTED',
// }

// export interface AgentCommissionSummary {
//   agentId: string;
//   agentName: string;
//   totalEarnings: number;
//   listingCommissions: number;
//   subAgentCommissions: number;
//   markingServiceEarnings: number;
//   pendingCommissions: number;
//   paidCommissions: number;
//   commissionsByProperty: Array<{
//     propertyId: string;
//     propertyTitle: string;
//     commission: number;
//   }>;
// }

// export interface OwnerCommissionSummary {
//   ownerId: string;
//   ownerName: string;
//   totalRevenue: number;
//   totalCommissionsPaid: number;
//   netRevenue: number;
//   platformFees: number;
//   revenueByProperty: Array<{
//     propertyId: string;
//     propertyTitle: string;
//     revenue: number;
//     commissionsPaid: number;
//   }>;
// }

// export interface PlatformCommissionSummary {
//   totalRevenue: number;
//   rentalCommissions: number;
//   markingServiceRevenue: number;
//   totalAgentCommissionsPaid: number;
//   netRevenue: number;
//   revenueByMonth: Array<{
//     month: string;
//     revenue: number;
//   }>;
// }

// export interface CommissionDispute {
//   disputeId: string;
//   paymentId: string;
//   rentalId: string;
//   propertyId: string;
//   disputedBy: string;
//   disputeReason: string;
//   disputeAmount: number;
//   status: DisputeStatus;
//   createdAt: Date;
//   resolvedAt?: Date;
//   resolution?: string;
// }

// export enum DisputeStatus {
//   OPEN = 'OPEN',
//   UNDER_REVIEW = 'UNDER_REVIEW',
//   RESOLVED = 'RESOLVED',
//   REJECTED = 'REJECTED',
// }

// export interface CommissionCalculationInput {
//   rentAmount: number;
//   hasListingAgent: boolean;
//   hasSubAgent: boolean;
//   propertyId: string;
//   ownerId: string;
//   listingAgentId?: string;
//   subAgentId?: string;
// }

// export interface CommissionDistributionPlan {
//   ownerId: string;
//   ownerAmount: number;
//   ownerVirtualAccountId: string;
//   listingAgentId?: string;
//   listingAgentAmount?: number;
//   listingAgentVirtualAccountId?: string;
//   subAgentId?: string;
//   subAgentAmount?: number;
//   subAgentVirtualAccountId?: string;
//   platformAmount: number;
//   platformVirtualAccountId: string;
//   scheduledReleaseDate: Date;
// }

// export interface CommissionReleaseSchedule {
//   paymentId: string;
//   rentalId: string;
//   holdPeriodHours: number;
//   scheduledReleaseDate: Date;
//   confirmationDeadline: Date;
//   isConfirmed: boolean;
//   canBeReleased: boolean;
// }

// export interface CommissionRefundData {
//   paymentId: string;
//   rentalId: string;
//   originalAmount: number;
//   refundAmount: number;
//   platformFeeRetained: number;
//   refundReason: string;
//   refundedAt: Date;
//   distributionReversal: {
//     ownerRefund: number;
//     agentRefund?: number;
//     subAgentRefund?: number;
//   };
// }