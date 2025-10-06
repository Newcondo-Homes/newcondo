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