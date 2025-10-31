/**
 * Admin Dashboard - Payment Types
 * Location: apps/admin/src/types/payment.ts
 */

export enum PaymentType {
  RENT = "RENT",
  DEPOSIT = "DEPOSIT",
  AGENT_COMMISSION = "AGENT_COMMISSION",
  PREMIUM_UPGRADE = "PREMIUM_UPGRADE",
  PROPERTY_MARKING = "PROPERTY_MARKING",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
  HELD = "HELD",
  RELEASED = "RELEASED",
}

export interface Payment {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  
  // Transaction details
  rentalId: string | null;
  markingJobId: string | null;
  amount: number;
  currency: string;
  
  // Payment info
  paymentType: PaymentType;
  status: PaymentStatus;
  paymentMethod: string | null;
  
  // Flutterwave
  flutterwaveRef: string | null;
  transactionId: string | null;
  
  // Commission split
  agentCommission: number | null;
  platformFee: number | null;
  ownerAmount: number | null;
  
  // Confirmation system
  confirmationPeriodEnd: Date | null;
  isReleased: boolean;
  releasedAt: Date | null;
  
  // Metadata
  description: string | null;
  failureReason: string | null;
  paidAt: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentListItem {
  id: string;
  userName: string | null;
  userEmail: string;
  amount: number;
  paymentType: PaymentType;
  status: PaymentStatus;
  transactionId: string | null;
  paidAt: Date | null;
  createdAt: Date;
}

export interface VirtualAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  
  // Owner
  userId: string;
  userName: string | null;
  userEmail: string;
  
  // Property
  propertyId: string | null;
  propertyTitle: string | null;
  
  // Account details
  balance: number;
  currency: string;
  isActive: boolean;
  
  // Flutterwave
  flutterwaveAccountId: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentFilters {
  search?: string;
  status?: PaymentStatus;
  paymentType?: PaymentType;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  isReleased?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface VirtualAccountFilters {
  search?: string;
  userId?: string;
  propertyId?: string;
  isActive?: boolean;
  balanceMin?: number;
  balanceMax?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  heldPayments: number;
  totalRevenue: number;
  platformFees: number;
  agentCommissions: number;
  todayRevenue: number;
  thisWeekRevenue: number;
  thisMonthRevenue: number;
  averageTransactionValue: number;
}

export interface VirtualAccountStats {
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
  totalBalance: number;
  averageBalance: number;
  accountsWithBalance: number;
}

export interface RefundRequest {
  paymentId: string;
  reason: string;
  amount: number; // Can be partial refund
  notes?: string;
  requestedBy: string; // Admin ID
}

export interface PaymentReleaseRequest {
  paymentId: string;
  releaseType: "full" | "partial";
  amount?: number; // For partial release
  notes?: string;
  releasedBy: string; // Admin ID
}

export interface PaymentTimeline {
  id: string;
  paymentId: string;
  event: string;
  description: string;
  performedBy: string | null;
  performedByName: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

export interface PaymentAttemptLog {
  id: string;
  userId: string;
  propertyId: string;
  unitId: string | null;
  amount: number;
  status: string;
  failureReason: string | null;
  lockAcquired: boolean;
  lockDuration: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface CommissionBreakdown {
  paymentId: string;
  totalAmount: number;
  agentCommission: number;
  agentPercentage: number;
  platformFee: number;
  platformPercentage: number;
  ownerAmount: number;
  ownerPercentage: number;
}

export interface RevenueReport {
  period: string; // "daily", "weekly", "monthly", "yearly"
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  platformFees: number;
  agentCommissions: number;
  ownerPayouts: number;
  refunds: number;
  netRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
}

export interface BulkPaymentAction {
  paymentIds: string[];
  action: "release" | "refund" | "cancel";
  reason?: string;
  notes?: string;
  amount?: number; // For partial actions
}