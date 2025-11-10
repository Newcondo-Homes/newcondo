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

















// import { Decimal } from '@prisma/client/runtime/library';
// import { PaymentStatus, PaymentType } from '@newcondo/db';

// /**
//  * Transaction summary
//  */
// export interface TransactionSummary {
//   totalTransactions: number;
//   totalVolume: Decimal;
//   averageTransactionValue: Decimal;
//   successfulTransactions: number;
//   failedTransactions: number;
//   pendingTransactions: number;
//   refundedTransactions: number;
  
//   // By payment type
//   byPaymentType: {
//     type: PaymentType;
//     count: number;
//     volume: Decimal;
//     percentage: number;
//   }[];
  
//   // By status
//   byStatus: {
//     status: PaymentStatus;
//     count: number;
//     volume: Decimal;
//   }[];
  
//   // Success rate
//   successRate: number;
//   failureRate: number;
//   refundRate: number;
// }

// /**
//  * Transaction details
//  */
// export interface TransactionDetails {
//   id: string;
//   userId: string;
//   userName: string;
//   userEmail: string;
//   amount: Decimal;
//   currency: string;
//   paymentType: PaymentType;
//   status: PaymentStatus;
//   paymentMethod?: string;
//   flutterwaveRef?: string;
//   transactionId?: string;
//   description?: string;
//   failureReason?: string;
  
//   // Related entities
//   rentalId?: string;
//   propertyId?: string;
//   propertyTitle?: string;
  
//   // Timestamps
//   createdAt: Date;
//   paidAt?: Date;
//   updatedAt: Date;
  
//   // Commission breakdown
//   commissionBreakdown?: {
//     agentCommission?: Decimal;
//     platformFee?: Decimal;
//     ownerAmount?: Decimal;
//   };
  
//   // Metadata
//   ipAddress?: string;
//   userAgent?: string;
// }

// /**
//  * Transaction analytics
//  */
// export interface TransactionAnalytics {
//   startDate: Date;
//   endDate: Date;
  
//   summary: TransactionSummary;
  
//   // Time series data
//   timeSeries: {
//     date: Date;
//     transactions: number;
//     volume: Decimal;
//     successRate: number;
//   }[];
  
//   // Peak transaction times
//   peakTimes: {
//     hour: number;
//     dayOfWeek: number;
//     averageTransactions: number;
//   }[];
  
//   // Top properties by transaction volume
//   topProperties: {
//     propertyId: string;
//     propertyTitle: string;
//     transactions: number;
//     totalVolume: Decimal;
//   }[];
  
//   // Top users by transaction volume
//   topUsers: {
//     userId: string;
//     userName: string;
//     transactions: number;
//     totalVolume: Decimal;
//     userRole: string;
//   }[];
  
//   // Geographic distribution
//   byLocation: {
//     state: string;
//     city: string;
//     transactions: number;
//     volume: Decimal;
//   }[];
  
//   // Payment method distribution
//   byPaymentMethod: {
//     method: string;
//     count: number;
//     volume: Decimal;
//     successRate: number;
//   }[];
// }

// /**
//  * Transaction monitoring alert
//  */
// export interface TransactionAlert {
//   id: string;
//   type: 'high_value' | 'unusual_pattern' | 'high_failure_rate' | 'duplicate_attempt' | 'fraud_suspicion';
//   severity: 'low' | 'medium' | 'high' | 'critical';
//   transactionId?: string;
//   userId?: string;
//   description: string;
//   metadata: Record<string, any>;
//   timestamp: Date;
//   acknowledged: boolean;
//   acknowledgedBy?: string;
//   acknowledgedAt?: Date;
// }

// /**
//  * Transaction filters
//  */
// export interface TransactionFilters {
//   startDate?: Date;
//   endDate?: Date;
//   status?: PaymentStatus | 'all';
//   paymentType?: PaymentType | 'all';
//   minAmount?: number;
//   maxAmount?: number;
//   userId?: string;
//   propertyId?: string;
//   city?: string;
//   state?: string;
//   paymentMethod?: string;
// }

// /**
//  * Transaction reconciliation
//  */
// export interface TransactionReconciliation {
//   period: {
//     startDate: Date;
//     endDate: Date;
//   };
  
//   // Expected vs actual
//   expected: {
//     totalTransactions: number;
//     totalVolume: Decimal;
//   };
  
//   actual: {
//     totalTransactions: number;
//     totalVolume: Decimal;
//   };
  
//   // Discrepancies
//   discrepancies: {
//     missingTransactions: string[];
//     duplicateTransactions: string[];
//     amountMismatches: {
//       transactionId: string;
//       expected: Decimal;
//       actual: Decimal;
//       difference: Decimal;
//     }[];
//   };
  
//   // Reconciliation status
//   status: 'matched' | 'discrepancies_found' | 'pending_review';
//   reconciledBy?: string;
//   reconciledAt?: Date;
//   notes?: string;
// }

// /**
//  * Transaction export
//  */
// export interface TransactionExport {
//   transactions: TransactionDetails[];
//   summary: TransactionSummary;
//   filters: TransactionFilters;
//   exportedAt: Date;
//   exportedBy: string;
//   format: 'csv' | 'xlsx' | 'pdf' | 'json';
// }

// /**
//  * Payment gateway statistics
//  */
// export interface PaymentGatewayStats {
//   provider: 'flutterwave';
  
//   // Performance metrics
//   totalRequests: number;
//   successfulRequests: number;
//   failedRequests: number;
//   averageResponseTime: number;
//   uptime: number;
  
//   // Error analysis
//   errors: {
//     errorCode: string;
//     errorMessage: string;
//     count: number;
//     lastOccurrence: Date;
//   }[];
  
//   // Status breakdown
//   statusBreakdown: {
//     status: string;
//     count: number;
//     percentage: number;
//   }[];
  
//   // Health status
//   healthStatus: 'healthy' | 'degraded' | 'down';
//   lastHealthCheck: Date;
// }

// /**
//  * Refund request
//  */
// export interface RefundRequest {
//   id: string;
//   transactionId: string;
//   userId: string;
//   amount: Decimal;
//   reason: string;
//   status: 'pending' | 'approved' | 'rejected' | 'completed';
//   requestedAt: Date;
//   processedAt?: Date;
//   processedBy?: string;
//   rejectionReason?: string;
//   refundTransactionId?: string;
// }

// /**
//  * Transaction dispute
//  */
// export interface TransactionDispute {
//   id: string;
//   transactionId: string;
//   userId: string;
//   disputeType: 'unauthorized' | 'property_mismatch' | 'service_not_received' | 'amount_incorrect' | 'other';
//   description: string;
//   evidence: string[];
//   status: 'open' | 'investigating' | 'resolved' | 'closed';
//   resolution?: string;
//   resolvedBy?: string;
//   resolvedAt?: Date;
//   createdAt: Date;
//   updatedAt: Date;
// }