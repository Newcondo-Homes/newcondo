// backend/payment-service/src/types/markingPayment.ts

export interface MarkingPaymentRequest {
  propertyId: string;
  markingJobId: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface MarkingPaymentResponse {
  paymentId: string;
  markingJobId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  flutterwaveRef?: string;
  paymentLink?: string;
  expiresAt: string;
}

export interface FlutterwaveMarkingPaymentData {
  tx_ref: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
    phonenumber: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
  redirect_url: string;
  meta: {
    markingJobId: string;
    propertyId: string;
    urgencyLevel: string;
  };
}

export interface MarkingFeeCalculation {
  baseFee: number;
  urgencyMultiplier: number;
  distanceFee: number;
  totalFee: number;
  currency: string;
}

export interface MarkingPaymentWebhookPayload {
  event: 'charge.completed' | 'charge.failed';
  data: {
    id: string;
    tx_ref: string;
    flw_ref: string;
    status: 'successful' | 'failed' | 'cancelled';
    amount: number;
    currency: string;
    customer: {
      id: string;
      email: string;
      phone_number: string;
      name: string;
    };
    meta: {
      markingJobId: string;
      propertyId: string;
      urgencyLevel: string;
    };
  };
}

export interface MarkingPaymentConfirmation {
  markingJobId: string;
  paymentId: string;
  status: 'CONFIRMED' | 'FAILED';
  transactionId: string;
  paidAt: string;
  amount: number;
  currency: string;
}

export interface MarkingRefundRequest {
  paymentId: string;
  markingJobId: string;
  reason: string;
  refundAmount?: number;
}

export interface MarkingRefundResponse {
  refundId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  refundAmount: number;
  currency: string;
  processedAt?: string;
  failureReason?: string;
}




// // backend/payment-service/src/types/markingPayment.ts

// import { Decimal } from '@prisma/client/runtime/library';
// import { PaymentStatus, MarkingJobStatus } from '@prisma/client';

// /**
//  * Marking payment request from property owner
//  */
// export interface CreateMarkingPaymentRequest {
//   userId: string;
//   markingJobId: string;
//   propertyId: string;
//   amount: number;
//   assignmentType: MarkingAssignmentType;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: string;
// }

// /**
//  * Types of marking assignment
//  */
// export enum MarkingAssignmentType {
//   SELF = 'SELF', // Mark it themselves
//   SOMEONE_I_KNOW = 'SOMEONE_I_KNOW', // Send link to someone they know
//   NEWCONDO_AGENT = 'NEWCONDO_AGENT', // Assign to Newcondo agents
//   NEWCONDO_ADMIN = 'NEWCONDO_ADMIN', // Newcondo admin marks it
// }

// /**
//  * Virtual account creation for marking payments
//  */
// export interface CreateMarkingVirtualAccountRequest {
//   userId: string;
//   propertyId: string;
//   purpose: 'MARKING_PAYMENT';
// }

// /**
//  * Marking payment response
//  */
// export interface MarkingPaymentResponse {
//   success: boolean;
//   paymentId: string;
//   markingJobId: string;
//   amount: string;
//   currency: string;
//   status: PaymentStatus;
//   paymentLink?: string;
//   virtualAccountDetails?: VirtualAccountDetails;
//   message: string;
// }

// /**
//  * Virtual account details
//  */
// export interface VirtualAccountDetails {
//   accountNumber: string;
//   accountName: string;
//   bankCode: string;
//   bankName: string;
//   expiresAt?: Date;
// }

// /**
//  * Payment confirmation request
//  */
// export interface ConfirmMarkingPaymentRequest {
//   paymentId: string;
//   userId: string;
//   transactionReference: string;
// }

// /**
//  * Partial compensation release request
//  */
// export interface ReleasePartialCompensationRequest {
//   markingJobId: string;
//   agentId: string;
//   reason: 'INITIAL_MARKING' | 'CONFIRMATION_EXPIRED';
// }

// /**
//  * Full compensation release request
//  */
// export interface ReleaseFullCompensationRequest {
//   markingJobId: string;
//   agentId: string;
//   propertyOwnerId: string;
// }

// /**
//  * Compensation release response
//  */
// export interface CompensationReleaseResponse {
//   success: boolean;
//   transactionId: string;
//   agentId: string;
//   amount: string;
//   releaseType: 'INITIAL' | 'PARTIAL' | 'FULL';
//   remainingBalance: string;
//   message: string;
// }

// /**
//  * Marking job payment details
//  */
// export interface MarkingJobPaymentDetails {
//   markingJobId: string;
//   totalFee: Decimal;
//   agentShare: Decimal;
//   platformShare: Decimal;
//   initialPayment: Decimal;
//   remainingPayment: Decimal;
//   totalPaid: Decimal;
//   status: PaymentStatus;
//   confirmationDeadline?: Date;
// }

// /**
//  * Compensation history entry
//  */
// export interface CompensationHistoryEntry {
//   transactionId: string;
//   amount: Decimal;
//   type: 'INITIAL' | 'PARTIAL' | 'FULL';
//   paidAt: Date;
//   reason?: string;
// }

// /**
//  * Agent compensation summary
//  */
// export interface AgentCompensationSummary {
//   agentId: string;
//   totalEarnings: Decimal;
//   pendingEarnings: Decimal;
//   completedJobs: number;
//   averageEarningsPerJob: Decimal;
//   compensationHistory: CompensationHistoryEntry[];
// }

// /**
//  * Payment webhook payload for Flutterwave
//  */
// export interface MarkingPaymentWebhookPayload {
//   event: 'charge.completed' | 'transfer.completed';
//   data: {
//     id: string;
//     tx_ref: string;
//     flw_ref: string;
//     amount: number;
//     currency: string;
//     status: 'successful' | 'failed';
//     customer: {
//       email: string;
//       name: string;
//     };
//     meta?: {
//       markingJobId: string;
//       userId: string;
//       propertyId: string;
//     };
//   };
// }

// /**
//  * Virtual account webhook payload
//  */
// export interface VirtualAccountWebhookPayload {
//   event: 'virtualaccount.credited';
//   data: {
//     accountNumber: string;
//     amount: number;
//     currency: string;
//     transactionReference: string;
//     senderName: string;
//     senderAccount: string;
//     meta?: {
//       markingJobId: string;
//       userId: string;
//     };
//   };
// }

// /**
//  * Payment validation result
//  */
// export interface PaymentValidationResult {
//   isValid: boolean;
//   errors?: string[];
//   warnings?: string[];
// }

// /**
//  * Shareable marking link details
//  */
// export interface ShareableMarkingLink {
//   markingJobId: string;
//   token: string;
//   url: string;
//   expiresAt: Date;
//   isActive: boolean;
// }

// /**
//  * Marking payment statistics
//  */
// export interface MarkingPaymentStatistics {
//   totalPayments: number;
//   totalRevenue: Decimal;
//   totalAgentCompensation: Decimal;
//   totalPlatformRevenue: Decimal;
//   averageJobValue: Decimal;
//   completionRate: number;
//   averageConfirmationTime: number; // in hours
// }

// /**
//  * Refund request for marking payment
//  */
// export interface MarkingPaymentRefundRequest {
//   paymentId: string;
//   markingJobId: string;
//   userId: string;
//   reason: RefundReason;
//   notes?: string;
// }

// /**
//  * Refund reasons
//  */
// export enum RefundReason {
//   JOB_CANCELLED = 'JOB_CANCELLED',
//   DUPLICATE_PAYMENT = 'DUPLICATE_PAYMENT',
//   SERVICE_NOT_RENDERED = 'SERVICE_NOT_RENDERED',
//   POOR_SERVICE_QUALITY = 'POOR_SERVICE_QUALITY',
//   AGENT_NO_SHOW = 'AGENT_NO_SHOW',
//   OTHER = 'OTHER',
// }

// /**
//  * Refund response
//  */
// export interface RefundResponse {
//   success: boolean;
//   refundId: string;
//   paymentId: string;
//   amount: string;
//   status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
//   estimatedCompletion?: Date;
//   message: string;
// }

// /**
//  * Payment lock details (prevent double payment)
//  */
// export interface PaymentLockDetails {
//   isLocked: boolean;
//   lockedBy?: string;
//   lockedAt?: Date;
//   expiresAt?: Date;
//   reason?: string;
// }

// /**
//  * Bulk compensation release request
//  */
// export interface BulkCompensationReleaseRequest {
//   markingJobIds: string[];
//   releaseType: 'PARTIAL' | 'FULL';
//   adminId: string;
// }

// /**
//  * Bulk compensation release response
//  */
// export interface BulkCompensationReleaseResponse {
//   totalProcessed: number;
//   successful: number;
//   failed: number;
//   results: Array<{
//     markingJobId: string;
//     success: boolean;
//     error?: string;
//   }>;
// }