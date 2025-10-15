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






// // apps/platform/types/markingPayment.ts

// export type MarkingChoice = 
//   | 'SELF_MARK' 
//   | 'ASSIGN_NEWCONDO' 
//   | 'SEND_SOMEONE' 
//   | 'ASSIGN_AGENT';

// export interface MarkingPaymentDetails {
//   totalFee: number;
//   agentCompensation: number; // 25% of total fee
//   platformFee: number; // Remaining 75%
//   newcondoAdminFee?: number; // 25,000 NGN for admin marking
//   currency: string;
// }

// export interface MarkingJobPayment {
//   id: string;
//   markingJobId: string;
//   userId: string;
//   amount: number;
//   currency: string;
//   paymentType: 'PROPERTY_MARKING';
//   status: PaymentStatus;
//   flutterwaveRef?: string;
//   transactionId?: string;
//   description?: string;
//   failureReason?: string;
//   paidAt?: Date;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export type PaymentStatus = 
//   | 'PENDING' 
//   | 'SUCCESS' 
//   | 'FAILED' 
//   | 'CANCELLED' 
//   | 'REFUNDED'
//   | 'HELD'
//   | 'RELEASED';

// export interface VirtualAccountDetails {
//   id: string;
//   accountNumber: string;
//   accountName: string;
//   bankCode: string;
//   balance: number;
//   currency: string;
//   isActive: boolean;
// }

// export interface MarkingFeeStructure {
//   propertyOwnerMarkingFee: number; // 20,000 NGN
//   agentCompensationPercentage: number; // 25%
//   agentCompensationAmount: number; // 5,000 NGN (25% of 20,000)
//   platformFeePercentage: number; // 75%
//   platformFeeAmount: number; // 15,000 NGN (75% of 20,000)
//   newcondoAdminMarkingFee: number; // 25,000 NGN
//   initialAgentPayment: number; // 1,000 NGN (paid immediately after marking)
//   remainingAgentPayment: number; // 4,000 NGN (paid after owner confirmation)
// }

// export interface PaymentConfirmation {
//   paymentId: string;
//   confirmationDeadline: Date;
//   isConfirmed: boolean;
//   confirmedAt?: Date;
//   autoReleaseDate: Date;
// }

// export interface AgentCompensationBreakdown {
//   totalCompensation: number;
//   immediatePayment: number; // ~1,000 NGN
//   pendingPayment: number; // ~4,000 NGN
//   status: 'PENDING' | 'PARTIALLY_PAID' | 'FULLY_PAID';
//   releasedAt?: Date;
// }

// export interface MarkingPaymentRequest {
//   propertyId: string;
//   markingChoice: MarkingChoice;
//   assignedAgentId?: string; // For ASSIGN_AGENT choice
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: Date;
//   urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
// }

// export interface FlutterwavePaymentResponse {
//   status: 'success' | 'error';
//   message: string;
//   data?: {
//     link: string;
//     transactionId: string;
//     reference: string;
//   };
// }

// export interface PaymentWebhookPayload {
//   event: string;
//   data: {
//     id: number;
//     tx_ref: string;
//     flw_ref: string;
//     amount: number;
//     currency: string;
//     charged_amount: number;
//     status: string;
//     payment_type: string;
//     created_at: string;
//     customer: {
//       id: number;
//       email: string;
//       phone_number: string;
//       name: string;
//     };
//   };
// }

// export interface MarkingPaymentVerification {
//   isValid: boolean;
//   paymentStatus: PaymentStatus;
//   transactionId?: string;
//   amount?: number;
//   paidAt?: Date;
//   errorMessage?: string;
// }

// export const MARKING_FEE_CONSTANTS: MarkingFeeStructure = {
//   propertyOwnerMarkingFee: 20000, // 20,000 NGN
//   agentCompensationPercentage: 25, // 25%
//   agentCompensationAmount: 5000, // 25% of 20,000
//   platformFeePercentage: 75, // 75%
//   platformFeeAmount: 15000, // 75% of 20,000
//   newcondoAdminMarkingFee: 25000, // 25,000 NGN for Newcondo admin marking
//   initialAgentPayment: 1000, // ~1,000 NGN paid immediately
//   remainingAgentPayment: 4000, // ~4,000 NGN paid after confirmation
// };

// export const calculateMarkingPayment = (
//   choice: MarkingChoice
// ): MarkingPaymentDetails => {
//   const { 
//     propertyOwnerMarkingFee, 
//     agentCompensationAmount, 
//     platformFeeAmount,
//     newcondoAdminMarkingFee 
//   } = MARKING_FEE_CONSTANTS;

//   switch (choice) {
//     case 'ASSIGN_NEWCONDO':
//       return {
//         totalFee: newcondoAdminMarkingFee,
//         agentCompensation: 0,
//         platformFee: newcondoAdminMarkingFee,
//         newcondoAdminFee: newcondoAdminMarkingFee,
//         currency: 'NGN',
//       };
    
//     case 'ASSIGN_AGENT':
//       return {
//         totalFee: propertyOwnerMarkingFee,
//         agentCompensation: agentCompensationAmount,
//         platformFee: platformFeeAmount,
//         currency: 'NGN',
//       };
    
//     case 'SEND_SOMEONE':
//     case 'SELF_MARK':
//       return {
//         totalFee: 0,
//         agentCompensation: 0,
//         platformFee: 0,
//         currency: 'NGN',
//       };
    
//     default:
//       return {
//         totalFee: 0,
//         agentCompensation: 0,
//         platformFee: 0,
//         currency: 'NGN',
//       };
//   }
// };

// export const getAgentCompensationBreakdown = (
//   totalCompensation: number
// ): AgentCompensationBreakdown => {
//   const { initialAgentPayment } = MARKING_FEE_CONSTANTS;
  
//   return {
//     totalCompensation,
//     immediatePayment: initialAgentPayment,
//     pendingPayment: totalCompensation - initialAgentPayment,
//     status: 'PENDING',
//   };
// };