// backend/admin-service/src/types/transaction.ts

export interface TransactionDetails {
  id: string;
  
  // Payment Information
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  
  // Transaction Type
  paymentType: 'RENT' | 'DEPOSIT' | 'AGENT_COMMISSION' | 'PREMIUM_UPGRADE' | 'PROPERTY_MARKING';
  status: PaymentStatus;
  
  // Related Entities
  rentalId?: string;
  propertyId?: string;
  propertyTitle?: string;
  markingJobId?: string;
  
  // Payment Gateway
  paymentMethod?: string;
  flutterwaveRef?: string;
  transactionId?: string;
  
  // Commission Split
  agentCommission?: number;
  platformFee?: number;
  ownerAmount?: number;
  
  // Confirmation System
  confirmationPeriodEnd?: Date;
  isReleased: boolean;
  releasedAt?: Date;
  
  // Metadata
  description?: string;
  failureReason?: string;
  paidAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  HELD = 'HELD',
  RELEASED = 'RELEASED',
}

export interface TransactionFilter {
  userId?: string;
  paymentType?: string[];
  status?: PaymentStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  search?: string;
}

export interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  
  // By Status
  pending: { count: number; amount: number };
  successful: { count: number; amount: number };
  failed: { count: number; amount: number };
  refunded: { count: number; amount: number };
  held: { count: number; amount: number };
  
  // By Type
  rentPayments: { count: number; amount: number };
  markingPayments: { count: number; amount: number };
  premiumPayments: { count: number; amount: number };
  
  // Trends
  todayTransactions: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  
  // Pending Actions
  pendingConfirmations: number;
  pendingReleases: number;
  heldAmount: number;
}

export interface RefundRequest {
  transactionId: string;
  adminId: string;
  reason: string;
  refundAmount?: number; // partial refund if less than full amount
  notifyUser: boolean;
}

export interface PaymentReleaseRequest {
  transactionId: string;
  adminId: string;
  releaseToVirtualAccount?: boolean;
  notes?: string;
}

export interface TransactionDispute {
  id: string;
  transactionId: string;
  disputedBy: string;
  disputeReason: string;
  evidence: DisputeEvidence[];
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface DisputeEvidence {
  type: 'IMAGE' | 'DOCUMENT' | 'SCREENSHOT' | 'OTHER';
  url: string;
  description: string;
  uploadedAt: Date;
}

export interface VirtualAccountDetails {
  id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  
  // Owner Info
  userId: string;
  userName: string;
  propertyId?: string;
  propertyTitle?: string;
  
  // Balance
  balance: number;
  currency: string;
  
  // Status
  isActive: boolean;
  
  // Flutterwave
  flutterwaveAccountId?: string;
  
  // Timestamps
  createdAt: Date;
  lastTransactionAt?: Date;
}

export interface VirtualAccountTransaction {
  id: string;
  virtualAccountId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  balance: number; // balance after transaction
  description: string;
  reference?: string;
  timestamp: Date;
}

export interface BulkTransactionAction {
  transactionIds: string[];
  adminId: string;
  action: 'RELEASE' | 'REFUND' | 'CANCEL';
  reason?: string;
}

export interface TransactionExport {
  format: 'CSV' | 'EXCEL' | 'PDF';
  filters: TransactionFilter;
  includeCommissions: boolean;
  includeVirtualAccounts: boolean;
}

export interface CommissionBreakdown {
  transactionId: string;
  totalAmount: number;
  
  // Breakdown
  platformFee: number;
  platformFeePercentage: number;
  
  agentCommission?: number;
  agentCommissionPercentage?: number;
  agentId?: string;
  
  ownerAmount: number;
  ownerPercentage: number;
  ownerId: string;
  
  // Status
  isDistributed: boolean;
  distributedAt?: Date;
}