// backend/marking-service/src/types/compensation.ts

export interface CompensationStructure {
  totalMarkingFee: number; // 20,000 NGN for Newcondo-assigned jobs
  agentPercentage: number; // 25% of total fee
  platformPercentage: number; // 75% of total fee
  initialPayment: number; // 1,000 NGN upon marking
  remainingPayment: number; // Balance after confirmation
}

export interface CompensationCalculation {
  markingJobId: string;
  totalFee: number;
  agentCompensation: number;
  platformFee: number;
  initialPaymentAmount: number;
  remainingPaymentAmount: number;
  calculatedAt: Date;
}

export interface CompensationPayment {
  id: string;
  markingJobId: string;
  agentId: string;
  paymentType: CompensationPaymentType;
  amount: number;
  status: CompensationPaymentStatus;
  virtualAccountId: string;
  transactionReference?: string;
  paidAt?: Date;
  createdAt: Date;
}

export enum CompensationPaymentType {
  INITIAL = 'INITIAL', // 1,000 NGN upon marking
  REMAINING = 'REMAINING', // Balance after confirmation
  TIMEOUT_PENALTY = 'TIMEOUT_PENALTY', // Partial payment if owner doesn't confirm
  FULL_PAYMENT = 'FULL_PAYMENT' // For self-marking or direct assignment
}

export enum CompensationPaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED'
}

export interface TimeoutCompensation {
  markingJobId: string;
  agentId: string;
  totalFee: number;
  timeoutOccurrences: number;
  compensationAmount: number;
  remainingBalance: number;
  calculatedAt: Date;
}

export interface CompensationBreakdown {
  baseMarkingFee: number;
  urgencyBonus?: number;
  distanceBonus?: number;
  complexityBonus?: number;
  totalCompensation: number;
  deductions?: {
    type: string;
    amount: number;
    reason: string;
  }[];
  netCompensation: number;
}

export const COMPENSATION_CONSTANTS = {
  STANDARD_MARKING_FEE: 20000, // NGN
  NEWCONDO_ADMIN_FEE: 25000, // NGN for admin-marked properties
  AGENT_PERCENTAGE: 0.25, // 25%
  PLATFORM_PERCENTAGE: 0.75, // 75%
  INITIAL_PAYMENT: 1000, // NGN
  TIMEOUT_COMPENSATION_INCREMENT: 1000, // NGN per timeout
  MIN_WITHDRAWAL_AMOUNT: 500, // NGN
  MAX_TIMEOUT_COMPENSATIONS: 19 // Max times agent gets paid during timeouts
} as const;

export interface WithdrawalRequest {
  id: string;
  agentId: string;
  amount: number;
  status: WithdrawalStatus;
  virtualAccountId: string;
  bankAccountNumber: string;
  bankCode: string;
  accountName: string;
  requestedAt: Date;
  processedAt?: Date;
  failureReason?: string;
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface CompensationHistory {
  agentId: string;
  totalEarned: number;
  totalWithdrawn: number;
  availableBalance: number;
  pendingPayments: number;
  completedJobs: number;
  timeoutCompensations: number;
  lastPaymentDate?: Date;
}