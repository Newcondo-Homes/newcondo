// Commission calculation and distribution types
export interface CommissionStructure {
  id: string;
  propertyId: string;
  rentalId?: string;
  rentAmount: number;
  
  // Commission breakdown
  totalCommission: number; // 20% of rent
  platformCommission: number; // Newcondo's share
  agentCommission: number; // Agent's share (if applicable)
  
  // Agent split (if sub-agent involved)
  listingAgentCommission?: number; // 50% of agent commission
  subAgentCommission?: number; // 50% of agent commission
  
  // Service fees
  serviceFee: number; // Platform processing fee
  flutterwaveFee: number; // Payment gateway fee
  refundReserveFee: number; // Double Flutterwave fee for refund coverage
  
  // Net amounts
  ownerNetAmount: number; // Amount to property owner
  totalDeductions: number; // Total deducted from rent
  
  currency: string;
  createdAt: Date;
}

export interface CommissionDistribution {
  id: string;
  commissionStructureId: string;
  paymentId: string;
  rentalId: string;
  
  // Distribution status
  status: DistributionStatus;
  distributedAt?: Date;
  
  // Recipients
  recipients: CommissionRecipient[];
  
  // Timeline
  scheduledFor: Date;
  completedAt?: Date;
  
  metadata?: Record<string, any>;
}

export enum DistributionStatus {
  PENDING = 'PENDING',
  HELD = 'HELD', // During confirmation period
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface CommissionRecipient {
  id: string;
  distributionId: string;
  
  // Recipient details
  recipientType: RecipientType;
  userId?: string;
  virtualAccountId: string;
  
  // Amount
  amount: number;
  currency: string;
  
  // Status
  status: RecipientStatus;
  paidAt?: Date;
  
  // Transaction reference
  transactionId?: string;
  reference: string;
  
  failureReason?: string;
}

export enum RecipientType {
  PROPERTY_OWNER = 'PROPERTY_OWNER',
  LISTING_AGENT = 'LISTING_AGENT',
  SUB_AGENT = 'SUB_AGENT',
  PLATFORM = 'PLATFORM', // Newcondo
}

export enum RecipientStatus {
  PENDING = 'PENDING',
  HELD = 'HELD',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface CommissionCalculation {
  rentAmount: number;
  
  // Commission rates
  platformCommissionRate: number; // 20% (0.20)
  agentCommissionSplit: number; // 50% of platform commission (0.50)
  
  // Service fee rates
  serviceFeeRate: number;
  flutterwaveFeeRate: number;
  
  // Calculated amounts
  totalCommission: number;
  serviceFee: number;
  flutterwaveFee: number;
  refundReserveFee: number;
  
  // Distribution
  platformAmount: number;
  agentAmount?: number;
  listingAgentAmount?: number;
  subAgentAmount?: number;
  ownerAmount: number;
  
  // Flags
  hasAgent: boolean;
  hasSubAgent: boolean;
  isPromotion: boolean; // If paid via sub-agent link
}

export interface CommissionSummary {
  userId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Totals
  totalEarnings: number;
  totalCommissions: number;
  totalWithdrawn: number;
  availableBalance: number;
  heldAmount: number;
  
  // Breakdown by type
  listingCommissions: number;
  subAgentCommissions: number;
  
  // Statistics
  totalTransactions: number;
  successfulTransactions: number;
  averageCommission: number;
  
  // Top properties
  topEarningProperties: PropertyCommissionSummary[];
  
  currency: string;
}

export interface PropertyCommissionSummary {
  propertyId: string;
  propertyTitle: string;
  totalEarnings: number;
  transactionCount: number;
  averageCommission: number;
}

export interface AgentCommissionHistory {
  id: string;
  agentId: string;
  propertyId: string;
  rentalId: string;
  paymentId: string;
  
  // Commission details
  commissionType: 'LISTING' | 'SUB_AGENT';
  amount: number;
  currency: string;
  
  // Status
  status: RecipientStatus;
  earnedAt: Date;
  paidAt?: Date;
  
  // Property info
  propertyTitle: string;
  rentAmount: number;
  
  // Reference
  reference: string;
  transactionId?: string;
}

export interface CommissionReleaseEvent {
  id: string;
  distributionId: string;
  
  // Event details
  eventType: ReleaseEventType;
  triggeredBy: string; // System, Admin, or User ID
  triggeredAt: Date;
  
  // Affected recipients
  affectedRecipients: string[]; // Array of recipient IDs
  
  // Amounts
  totalReleased: number;
  currency: string;
  
  // Reason
  reason: string;
  metadata?: Record<string, any>;
}

export enum ReleaseEventType {
  AUTO_RELEASE = 'AUTO_RELEASE', // After confirmation period
  MANUAL_RELEASE = 'MANUAL_RELEASE', // Admin triggered
  CONFIRMED_RELEASE = 'CONFIRMED_RELEASE', // Renter confirmed
  DISPUTED_HOLD = 'DISPUTED_HOLD', // Dispute filed
  REFUND_INITIATED = 'REFUND_INITIATED', // Refund in progress
}

// API Request/Response types
export interface CalculateCommissionRequest {
  rentAmount: number;
  propertyId: string;
  hasAgent: boolean;
  hasSubAgent: boolean;
  subAgentId?: string;
}

export interface CalculateCommissionResponse {
  success: boolean;
  calculation: CommissionCalculation;
  structure: CommissionStructure;
}

export interface ScheduleDistributionRequest {
  paymentId: string;
  rentalId: string;
  commissionStructureId: string;
  scheduledFor: Date;
}

export interface ScheduleDistributionResponse {
  success: boolean;
  distribution: CommissionDistribution;
  message: string;
}

export interface ReleaseCommissionRequest {
  distributionId: string;
  reason?: string;
  recipientIds?: string[]; // Optional: release to specific recipients only
}

export interface ReleaseCommissionResponse {
  success: boolean;
  releaseEvent: CommissionReleaseEvent;
  affectedRecipients: CommissionRecipient[];
  message: string;
}

export interface GetCommissionSummaryRequest {
  userId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface GetCommissionSummaryResponse {
  success: boolean;
  summary: CommissionSummary;
  recentCommissions: AgentCommissionHistory[];
}

export interface GetCommissionHistoryRequest {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  type?: 'LISTING' | 'SUB_AGENT';
  status?: RecipientStatus;
  limit?: number;
  offset?: number;
}

export interface GetCommissionHistoryResponse {
  success: boolean;
  history: AgentCommissionHistory[];
  total: number;
  hasMore: boolean;
}










// // apps/platform/types/commission.ts

// import type { CommissionStatus, AutoTransferOption } from '@/lib/constants/commission';

// /**
//  * Commission Types
//  * Type definitions for commission tracking and earnings management
//  */

// // Commission earning record
// export interface CommissionEarning {
//   id: string;
//   userId: string;
//   propertyId: string;
//   rentalId: string;
//   paymentId: string;
  
//   // Amounts
//   rentAmount: number;
//   platformCommission: number;
//   agentCommission: number;
//   netEarning: number;
//   currency: string;
  
//   // Role in transaction
//   role: 'listing_agent' | 'sub_agent' | 'owner';
//   hasSubAgent: boolean;
  
//   // Status tracking
//   status: CommissionStatus;
//   heldUntil?: Date;
//   releasedAt?: Date;
//   paidAt?: Date;
  
//   // Virtual account details
//   virtualAccountId?: string;
//   virtualAccountBalance?: number;
  
//   // Property details
//   propertyTitle: string;
//   propertyAddress: string;
//   unitNumber?: string;
  
//   // Renter details
//   renterName?: string;
//   renterEmail?: string;
  
//   // Timestamps
//   createdAt: Date;
//   updatedAt: Date;
// }

// // Commission summary
// export interface CommissionSummary {
//   userId: string;
//   timePeriod: {
//     startDate: Date;
//     endDate: Date;
//   };
  
//   // Totals
//   totalEarnings: number;
//   totalPending: number;
//   totalHeld: number;
//   totalReleased: number;
//   totalPaid: number;
//   totalWithdrawn: number;
  
//   // Breakdown
//   earningsAsListingAgent: number;
//   earningsAsSubAgent: number;
//   earningsAsOwner: number;
//   markingServiceEarnings: number;
  
//   // Statistics
//   totalTransactions: number;
//   averageCommission: number;
//   highestCommission: number;
  
//   // Virtual account
//   virtualAccountBalance: number;
//   pendingConfirmations: number;
// }

// // Commission breakdown for a specific property
// export interface PropertyCommissionBreakdown {
//   propertyId: string;
//   propertyTitle: string;
//   rentAmount: number;
  
//   // Commission split
//   platformCommission: number;
//   platformCommissionRate: number;
  
//   // Agent earnings
//   listingAgentCommission?: number;
//   listingAgentId?: string;
//   listingAgentName?: string;
  
//   subAgentCommission?: number;
//   subAgentId?: string;
//   subAgentName?: string;
  
//   // Owner earnings
//   ownerAmount: number;
//   ownerId: string;
//   ownerName: string;
  
//   // Platform share
//   platformShare: number;
  
//   // Status
//   status: CommissionStatus;
//   confirmationDeadline?: Date;
//   releaseDate?: Date;
// }

// // Commission transaction
// export interface CommissionTransaction {
//   id: string;
//   userId: string;
//   type: 'earning' | 'withdrawal' | 'refund' | 'adjustment';
//   amount: number;
//   currency: string;
//   description: string;
//   status: 'pending' | 'completed' | 'failed' | 'cancelled';
  
//   // Related entities
//   propertyId?: string;
//   rentalId?: string;
//   paymentId?: string;
  
//   // Banking details (for withdrawals)
//   bankName?: string;
//   accountNumber?: string;
//   accountName?: string;
  
//   // Flutterwave details
//   flutterwaveReference?: string;
//   transactionId?: string;
  
//   // Error handling
//   failureReason?: string;
//   retryCount?: number;
  
//   // Timestamps
//   initiatedAt: Date;
//   completedAt?: Date;
//   createdAt: Date;
//   updatedAt: Date;
// }

// // Commission earnings dashboard
// export interface CommissionDashboard {
//   summary: CommissionSummary;
//   recentEarnings: CommissionEarning[];
//   recentTransactions: CommissionTransaction[];
//   upcomingReleases: {
//     amount: number;
//     releaseDate: Date;
//     count: number;
//   }[];
//   earningsChart: {
//     date: string;
//     earnings: number;
//   }[];
//   topEarningProperties: {
//     propertyId: string;
//     propertyTitle: string;
//     earnings: number;
//     transactions: number;
//   }[];
// }

// // Withdrawal request
// export interface WithdrawalRequest {
//   userId: string;
//   amount: number;
//   currency: string;
  
//   // Banking details
//   bankName: string;
//   bankCode: string;
//   accountNumber: string;
//   accountName: string;
  
//   // Virtual account
//   virtualAccountId: string;
//   availableBalance: number;
  
//   // Optional fields
//   narration?: string;
//   reference?: string;
// }

// // Withdrawal response
// export interface WithdrawalResponse {
//   success: boolean;
//   transactionId?: string;
//   reference?: string;
//   amount: number;
//   fee?: number;
//   netAmount: number;
//   status: 'pending' | 'processing' | 'completed' | 'failed';
//   estimatedCompletionTime?: Date;
//   message?: string;
// }

// // Auto-transfer settings
// export interface AutoTransferSettings {
//   userId: string;
//   enabled: boolean;
//   option: AutoTransferOption;
  
//   // Banking details
//   bankName: string;
//   bankCode: string;
//   accountNumber: string;
//   accountName: string;
  
//   // Thresholds
//   minimumAmount?: number;
  
//   // Schedule (for non-immediate transfers)
//   dayOfWeek?: number; // 0-6 for weekly
//   dayOfMonth?: number; // 1-31 for monthly
//   timeOfDay?: string; // HH:MM format
  
//   // Status
//   lastTransferAt?: Date;
//   nextTransferAt?: Date;
//   totalTransfers: number;
  
//   // Timestamps
//   createdAt: Date;
//   updatedAt: Date;
// }

// // Commission filter options
// export interface CommissionFilters {
//   startDate?: Date;
//   endDate?: Date;
//   status?: CommissionStatus[];
//   role?: ('listing_agent' | 'sub_agent' | 'owner')[];
//   propertyIds?: string[];
//   minAmount?: number;
//   maxAmount?: number;
//   searchQuery?: string;
// }

// // Commission export options
// export interface CommissionExportOptions {
//   format: 'csv' | 'pdf' | 'excel';
//   filters: CommissionFilters;
//   includeBreakdown: boolean;
//   includeTransactions: boolean;
//   groupBy?: 'property' | 'month' | 'status';
// }

// // Virtual account details
// export interface VirtualAccountDetails {
//   id: string;
//   userId: string;
//   accountNumber: string;
//   accountName: string;
//   bankCode: string;
//   bankName: string;
  
//   // Balance
//   balance: number;
//   pendingBalance: number;
//   availableBalance: number;
//   currency: string;
  
//   // Status
//   isActive: boolean;
//   isFrozen: boolean;
//   freezeReason?: string;
  
//   // Auto-transfer
//   autoTransferEnabled: boolean;
//   autoTransferSettings?: AutoTransferSettings;
  
//   // Statistics
//   totalDeposits: number;
//   totalWithdrawals: number;
//   transactionCount: number;
  
//   // Timestamps
//   createdAt: Date;
//   lastTransactionAt?: Date;
// }

// // Marking service commission
// export interface MarkingServiceCommission {
//   id: string;
//   markingJobId: string;
//   propertyId: string;
//   agentId: string;
  
//   // Amounts
//   totalFee: number;
//   agentCompensation: number;
//   platformShare: number;
//   initialPayment: number;
//   finalPayment: number;
  
//   // Status
//   status: CommissionStatus;
//   initialPaymentReleased: boolean;
//   finalPaymentReleased: boolean;
  
//   // Owner confirmation
//   ownerConfirmedAt?: Date;
//   confirmationDeadline?: Date;
  
//   // Timestamps
//   createdAt: Date;
//   updatedAt: Date;
// }

// // Commission API responses
// export interface CommissionApiResponse<T> {
//   success: boolean;
//   data?: T;
//   error?: string;
//   message?: string;
// }

// // Commission context type
// export interface CommissionContextType {
//   summary: CommissionSummary | null;
//   earnings: CommissionEarning[];
//   transactions: CommissionTransaction[];
//   virtualAccount: VirtualAccountDetails | null;
//   loading: boolean;
//   error: string | null;
//   fetchCommissionData: (filters?: CommissionFilters) => Promise<void>;
//   withdrawFunds: (request: WithdrawalRequest) => Promise<WithdrawalResponse>;
//   updateAutoTransfer: (settings: AutoTransferSettings) => Promise<void>;
//   refreshData: () => Promise<void>;
// }

// // Commission notification
// export interface CommissionNotification {
//   id: string;
//   userId: string;
//   type: 'earning_released' | 'withdrawal_completed' | 'payment_held' | 'confirmation_pending';
//   title: string;
//   message: string;
//   amount?: number;
//   propertyId?: string;
//   transactionId?: string;
//   read: boolean;
//   createdAt: Date;
// }

// // Export all types
// export type {
//   CommissionStatus,
//   AutoTransferOption,
// };