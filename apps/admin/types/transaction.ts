// apps/admin/src/types/transaction.ts

/**
 * Transaction overview
 */
export interface TransactionOverview {
  transactionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  type: 'RENT' | 'DEPOSIT' | 'AGENT_COMMISSION' | 'PREMIUM_UPGRADE' | 'PROPERTY_MARKING';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'HELD' | 'RELEASED';
  paymentMethod?: string;
  flutterwaveRef?: string;
  transactionRef?: string;
  propertyId?: string;
  propertyTitle?: string;
  rentalId?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Detailed transaction
 */
export interface TransactionDetails extends TransactionOverview {
  description?: string;
  failureReason?: string;
  
  // Commission breakdown
  agentCommission?: number;
  platformFee?: number;
  ownerAmount?: number;
  
  // Payment confirmation
  confirmationPeriodEnd?: string;
  isReleased: boolean;
  releasedAt?: string;
  
  // Additional metadata
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  
  // Related data
  property?: {
    propertyId: string;
    title: string;
    type: string;
    location: string;
  };
  rental?: {
    rentalId: string;
    startDate: string;
    endDate?: string;
  };
  
  updatedAt: string;
}

/**
 * Transaction statistics
 */
export interface TransactionStatistics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  refundedTransactions: number;
  totalVolume: number;
  averageValue: number;
  successRate: number;
  failureRate: number;
  refundRate: number;
}

/**
 * Transaction by type
 */
export interface TransactionByType {
  type: string;
  count: number;
  amount: number;
  percentage: number;
  successRate: number;
  averageValue: number;
  growth: number;
}

/**
 * Transaction by status
 */
export interface TransactionByStatus {
  status: string;
  count: number;
  percentage: number;
  totalAmount: number;
}

/**
 * Transaction timeline
 */
export interface TransactionTimeline {
  period: string;
  date: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalAmount: number;
  averageValue: number;
}

/**
 * Failed transaction analysis
 */
export interface FailedTransactionAnalysis {
  totalFailed: number;
  totalAmount: number;
  failureRate: number;
  estimatedRevenueLoss: number;
  failuresByReason: Array<{
    reason: string;
    count: number;
    percentage: number;
    totalAmount: number;
  }>;
  failuresByPaymentMethod: Array<{
    method: string;
    count: number;
    failureRate: number;
  }>;
  failuresByTimeOfDay: Array<{
    hour: number;
    count: number;
  }>;
  recommendations: string[];
}

/**
 * Transaction refund details
 */
export interface TransactionRefund {
  refundId: string;
  transactionId: string;
  originalAmount: number;
  refundAmount: number;
  refundFee: number;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  processedAt?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  flutterwaveRefundRef?: string;
}

/**
 * Payment lock details
 */
export interface PaymentLockDetails {
  lockId: string;
  propertyId: string;
  unitId?: string;
  userId: string;
  lockedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'RELEASED';
  transactionId?: string;
}

/**
 * Payment attempt log
 */
export interface PaymentAttemptLog {
  attemptId: string;
  userId: string;
  propertyId: string;
  unitId?: string;
  amount: number;
  status: 'LOCKED' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  failureReason?: string;
  lockAcquired: boolean;
  lockDuration?: number;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * Transaction search filters
 */
export interface TransactionSearchFilters {
  searchTerm?: string;
  type?: string;
  status?: string;
  userId?: string;
  propertyId?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  flutterwaveRef?: string;
  sortBy?: 'amount' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Transaction metrics
 */
export interface TransactionMetrics {
  totalVolume: number;
  transactionCount: number;
  averageTransactionValue: number;
  medianTransactionValue: number;
  largestTransaction: number;
  smallestTransaction: number;
  totalFees: number;
  netVolume: number;
}

/**
 * Transaction flow
 */
export interface TransactionFlow {
  initiated: number;
  paymentAttempted: number;
  paymentSucceeded: number;
  confirmationPending: number;
  confirmed: number;
  released: number;
  refunded: number;
  conversionRate: number;
}

/**
 * Payment method analytics
 */
export interface PaymentMethodAnalytics {
  method: string;
  transactionCount: number;
  totalAmount: number;
  percentage: number;
  successRate: number;
  failureRate: number;
  averageValue: number;
  averageProcessingTime: number;
}

/**
 * Transaction velocity
 */
export interface TransactionVelocity {
  period: string;
  transactionsPerHour: number;
  transactionsPerDay: number;
  peakHour: {
    hour: number;
    count: number;
  };
  peakDay: {
    day: string;
    count: number;
  };
  trend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Commission transaction
 */
export interface CommissionTransaction {
  commissionId: string;
  transactionId: string;
  recipientId: string;
  recipientName: string;
  recipientType: 'LISTING_AGENT' | 'SUB_AGENT' | 'MARKING_AGENT' | 'PLATFORM';
  amount: number;
  percentage: number;
  baseAmount: number;
  status: 'PENDING' | 'HELD' | 'RELEASED' | 'PAID';
  releasedAt?: string;
  paidAt?: string;
  virtualAccountId?: string;
}

/**
 * Transaction dispute
 */
export interface TransactionDispute {
  disputeId: string;
  transactionId: string;
  userId: string;
  reason: string;
  description: string;
  evidence?: string[];
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

/**
 * Transaction reconciliation
 */
export interface TransactionReconciliation {
  reconciliationId: string;
  period: string;
  expectedTransactions: number;
  actualTransactions: number;
  expectedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
  discrepancies: Array<{
    transactionId: string;
    type: string;
    expectedAmount: number;
    actualAmount: number;
    difference: number;
  }>;
  status: 'PENDING' | 'RECONCILED' | 'DISCREPANCY';
  reconciledBy?: string;
  reconciledAt?: string;
}

/**
 * Transaction notification
 */
export interface TransactionNotification {
  notificationId: string;
  transactionId: string;
  userId: string;
  type: 'SUCCESS' | 'FAILURE' | 'REFUND' | 'CONFIRMATION_PENDING' | 'RELEASED';
  channel: 'EMAIL' | 'SMS' | 'PUSH';
  message: string;
  sentAt: string;
  deliveryStatus: 'SENT' | 'DELIVERED' | 'FAILED';
}

/**
 * Transaction audit log
 */
export interface TransactionAuditLog {
  auditId: string;
  transactionId: string;
  action: string;
  performedBy: string;
  performedByRole: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

/**
 * Transaction export options
 */
export interface TransactionExportOptions {
  format: 'csv' | 'excel' | 'json';
  filters: TransactionSearchFilters;
  fields: string[];
  includeCommissions: boolean;
  includeRefunds: boolean;
  groupBy?: 'day' | 'week' | 'month' | 'type' | 'status';
}

/**
 * Flutterwave webhook data
 */
export interface FlutterwaveWebhookData {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    status: string;
    payment_type: string;
    created_at: string;
    customer: {
      id: number;
      name: string;
      email: string;
      phone_number?: string;
    };
  };
}