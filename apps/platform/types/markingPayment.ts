/**
 * Property Marking Payment Types
 * Location: apps/platform/types/markingPayment.ts
 */

export enum MarkingChoice {
  SELF = 'SELF',
  NEWCONDO = 'NEWCONDO',
  SOMEONE_I_KNOW = 'SOMEONE_I_KNOW',
  ASSIGN_TO_AGENT = 'ASSIGN_TO_AGENT',
}

export enum MarkingPaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL', // For agents receiving partial payment
  RELEASED = 'RELEASED', // When full payment is released to agent
}

export enum MarkingJobStatus {
  QUEUED = 'QUEUED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  DISPUTE = 'DISPUTE',
}

export enum UrgencyLevel {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface MarkingPricing {
  basePrice: number; // 20,000 NGN for standard marking
  newcondoPrice: number; // 25,000 NGN for Newcondo marking
  agentCommissionPercentage: number; // 25%
  partialPaymentAmount: number; // 1,000 NGN initial payment
  currency: string;
}

export interface MarkingPaymentBreakdown {
  totalAmount: number;
  agentCommission: number;
  platformFee: number;
  partialPayment?: number;
  remainingAmount?: number;
}

export interface VirtualAccountDetails {
  id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface MarkingPaymentIntent {
  id: string;
  jobId: string;
  userId: string;
  amount: number;
  currency: string;
  status: MarkingPaymentStatus;
  paymentMethod?: string;
  flutterwaveRef?: string;
  transactionId?: string;
  breakdown: MarkingPaymentBreakdown;
  createdAt: string;
  paidAt?: string;
}

export interface MarkingJobPayment {
  id: string;
  markingJobId: string;
  userId: string;
  amount: number;
  status: MarkingPaymentStatus;
  paymentType: 'PROPERTY_MARKING';
  flutterwaveRef?: string;
  transactionId?: string;
  agentCommission?: number;
  platformFee?: number;
  isReleased: boolean;
  releasedAt?: string;
  confirmationPeriodEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentConfirmation {
  jobId: string;
  confirmed: boolean;
  confirmedAt?: string;
  confirmationNotes?: string;
  imagesVerified: boolean;
  boundaryVerified: boolean;
}

export interface RefundRequest {
  paymentId: string;
  reason: string;
  requestedAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
}

export interface PaymentWebhookPayload {
  event: string;
  data: {
    id: string;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: string;
    payment_type: string;
    created_at: string;
  };
}

export interface MarkingPaymentHistory {
  payments: MarkingJobPayment[];
  totalPaid: number;
  totalEarned: number; // For agents
  pendingPayments: number;
  failedPayments: number;
}

export interface AgentEarnings {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  completedJobs: number;
  averageEarningPerJob: number;
  earningsHistory: Array<{
    jobId: string;
    amount: number;
    status: MarkingPaymentStatus;
    earnedAt: string;
  }>;
}

// Payment error types
export interface PaymentError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Flutterwave payment initialization
export interface FlutterwavePaymentConfig {
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  customer: {
    email: string;
    phone_number: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo?: string;
  };
  meta?: {
    marking_job_id: string;
    property_id: string;
    payment_type: string;
  };
}

// Payment locking to prevent double processing
export interface PaymentLock {
  jobId: string;
  userId: string;
  lockedAt: string;
  expiresAt: string;
  lockToken: string;
}

// Agent compensation tracking
export interface AgentCompensation {
  agentId: string;
  jobId: string;
  partialPayment: number;
  remainingPayment: number;
  totalCompensation: number;
  paymentStatus: MarkingPaymentStatus;
  paidAt?: string;
  releasedAt?: string;
}

// Withdrawal request (for agents)
export interface WithdrawalRequest {
  id: string;
  agentId: string;
  amount: number;
  accountDetails: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
  };
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedAt: string;
  processedAt?: string;
  failureReason?: string;
}