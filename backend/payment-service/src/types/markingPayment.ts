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






// /**
//  * Type definitions for Property Marking Payment System
//  * Handles payment processing, virtual account management, and escrow for marking jobs
//  */

// // ============================================
// // Enums
// // ============================================

// export enum MarkingPaymentType {
//   SELF_MARKING = 'SELF_MARKING', // Property owner marks themselves
//   AGENT_MARKING = 'AGENT_MARKING', // Agent assigned by queue
//   KNOWN_PERSON_MARKING = 'KNOWN_PERSON_MARKING', // Someone they know
//   ADMIN_MARKING = 'ADMIN_MARKING', // Newcondo admin marks
// }

// export enum MarkingPaymentStatus {
//   INITIATED = 'INITIATED',
//   PENDING = 'PENDING',
//   PROCESSING = 'PROCESSING',
//   HELD_IN_ESCROW = 'HELD_IN_ESCROW', // Initial payment on hold
//   PARTIAL_RELEASED = 'PARTIAL_RELEASED', // Small compensation released to agent
//   COMPLETED = 'COMPLETED', // Full payment released
//   FAILED = 'FAILED',
//   REFUNDED = 'REFUNDED',
//   CANCELLED = 'CANCELLED',
// }

// export enum EscrowStatus {
//   CREATED = 'CREATED',
//   HELD = 'HELD',
//   PARTIAL_RELEASE = 'PARTIAL_RELEASE',
//   FULL_RELEASE = 'FULL_RELEASE',
//   FORFEITED = 'FORFEITED', // Owner doesn't confirm in time
//   EXPIRED = 'EXPIRED',
// }

// export enum CompensationStatus {
//   PENDING = 'PENDING',
//   PROCESSING = 'PROCESSING',
//   RELEASED = 'RELEASED',
//   WITHDRAWN = 'WITHDRAWN',
//   FORFEITED = 'FORFEITED',
// }

// // ============================================
// // Payment Request/Response Types
// // ============================================

// export interface InitiateMarkingPaymentRequest {
//   propertyId: string;
//   userId: string; // Property owner or requesting user
//   markingPaymentType: MarkingPaymentType;
//   assignedAgentId?: string; // If agent marking
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
// }

// export interface MarkingPaymentResponse {
//   paymentId: string;
//   jobId: string;
//   userId: string;
//   propertyId: string;
//   markingFee: number; // Total marking fee in NGN
//   paymentType: MarkingPaymentType;
//   status: MarkingPaymentStatus;
//   flutterwaveRef?: string;
//   paymentLink?: string; // Flutterwave payment link
//   virtualAccountNumber?: string;
//   virtualAccountName?: string;
//   bankCode?: string;
//   createdAt: Date;
//   expiresAt: Date;
// }

// export interface PaymentVerificationRequest {
//   flutterwaveRef: string;
//   paymentId: string;
// }

// export interface PaymentVerificationResponse {
//   paymentId: string;
//   status: MarkingPaymentStatus;
//   verified: boolean;
//   transactionId: string;
//   amount: number;
//   timestamp: Date;
// }

// // ============================================
// // Pricing Types
// // ============================================

// export interface MarkingPricingStructure {
//   selfMarking: number; // Free - no payment needed
//   agentMarking: number; // 20,000 NGN
//   knownPersonMarking: number; // 20,000 NGN
//   adminMarking: number; // 25,000 NGN
  
//   agentCommissionPercentage: number; // 25% of 20,000 = 5,000 NGN
//   platformFeePercentage: number; // 75% of 20,000 = 15,000 NGN
  
//   initialAgentCompensation: number; // 1,000 NGN held in escrow
//   expiredSlotCompensation: number; // 1,000 NGN for expired slot
//   maxCompensationIterations: number; // Max 3 times before new job required
// }

// export interface PaymentSplit {
//   totalAmount: number;
//   agentAmount: number; // 25% for agent/marker
//   platformAmount: number; // 75% for Newcondo
  
//   breakdown: {
//     markingFee: number;
//     agentCommission: number;
//     platformFee: number;
//     tax?: number;
//   };
// }

// // ============================================
// // Escrow Types
// // ============================================

// export interface EscrowAccount {
//   id: string;
//   paymentId: string;
//   markingJobId: string;
//   propertyOwnerId: string;
//   assignedAgentId?: string;
  
//   totalAmount: number; // Full marking fee
//   heldAmount: number; // Amount currently held
//   releasedAmount: number; // Amount already released
  
//   status: EscrowStatus;
  
//   // Timeline
//   createdAt: Date;
//   heldAt: Date;
//   partialReleaseAt?: Date;
//   fullReleaseAt?: Date;
//   expiresAt: Date; // 3 days from marking completion
  
//   // Compensation tracking
//   compensationAttempts: number;
//   lastCompensationDate?: Date;
  
//   // Notes
//   reason: string; // Why payment is held
//   notes?: string;
// }

// export interface EscrowReleaseRequest {
//   escrowId: string;
//   releaseType: 'PARTIAL' | 'FULL'; // Partial = 1000 NGN, Full = rest
//   reason: string; // Reason for release
//   approvedBy?: string; // Admin ID if admin approved
// }

// export interface EscrowReleaseResponse {
//   escrowId: string;
//   previousStatus: EscrowStatus;
//   newStatus: EscrowStatus;
//   amountReleased: number;
//   remainingHeld: number;
//   timestamp: Date;
// }

// // ============================================
// // Compensation Types
// // ============================================

// export interface AgentCompensationRecord {
//   id: string;
//   markingJobId: string;
//   agentId: string;
//   compensationType: 'INITIAL' | 'EXPIRED_SLOT' | 'COMPLETION'; // Different types of compensation
  
//   amount: number; // NGN
//   status: CompensationStatus;
  
//   virtualAccountId: string;
//   transactionId?: string;
  
//   reason: string;
//   iterationNumber: number; // Which iteration this compensation is for
  
//   createdAt: Date;
//   processedAt?: Date;
//   withdrawnAt?: Date;
// }

// export interface CompensationRequest {
//   markingJobId: string;
//   agentId: string;
//   compensationType: 'INITIAL' | 'EXPIRED_SLOT' | 'COMPLETION';
//   amount: number;
//   reason: string;
// }

// export interface CompensationResponse {
//   compensationId: string;
//   agentId: string;
//   amount: number;
//   status: CompensationStatus;
//   virtualAccountId: string;
//   message: string;
//   timestamp: Date;
// }

// // ============================================
// // Virtual Account Types
// // ============================================

// export interface VirtualAccountRequest {
//   userId: string;
//   userType: 'OWNER' | 'AGENT' | 'RENTER'; // Different user types
//   accountName: string;
//   metadata?: {
//     businessName?: string;
//     serviceArea?: string[];
//   };
// }

// export interface VirtualAccountResponse {
//   id: string;
//   accountNumber: string;
//   accountName: string;
//   bankCode: string;
//   bankName: string;
//   balance: number;
//   currency: string;
//   isActive: boolean;
//   flutterwaveAccountId?: string;
//   createdAt: Date;
// }

// export interface VirtualAccountBalance {
//   accountId: string;
//   accountNumber: string;
//   balance: number;
//   pendingBalance: number; // Amount held in escrow
//   availableBalance: number; // Balance - pending
//   currency: string;
//   lastUpdated: Date;
// }

// // ============================================
// // Transaction Types
// // ============================================

// export interface MarkingPaymentTransaction {
//   id: string;
//   paymentId: string;
//   markingJobId: string;
  
//   // Payer info
//   payerId: string;
//   payerType: 'OWNER' | 'AGENT' | 'RENTER';
//   payerEmail: string;
//   payerPhone: string;
  
//   // Recipient info
//   recipientId?: string;
//   recipientType?: 'AGENT' | 'ADMIN';
//   recipientVirtualAccountId?: string;
  
//   // Payment details
//   amount: number;
//   currency: string;
//   paymentMethod: 'CARD' | 'BANK_TRANSFER' | 'USSD' | 'WALLET';
  
//   // Flutterwave info
//   flutterwaveRef: string;
//   flutterwaveTransactionId?: string;
  
//   // Status
//   status: MarkingPaymentStatus;
//   failureReason?: string;
  
//   // Timestamps
//   initiatedAt: Date;
//   processedAt?: Date;
//   completedAt?: Date;
  
//   // Metadata
//   metadata?: {
//     ipAddress?: string;
//     userAgent?: string;
//     deviceInfo?: string;
//   };
// }

// export interface PaymentWebhookPayload {
//   event: string;
//   data: {
//     id: number;
//     txRef: string; // Flutterwave reference
//     flwRef: string;
//     amount: number;
//     currency: string;
//     status: 'successful' | 'failed' | 'pending';
//     customer: {
//       id: number;
//       email: string;
//       phone_number: string;
//       name: string;
//     };
//     meta?: Record<string, any>;
//   };
// }

// // ============================================
// // Job Status Update Types
// // ============================================

// export interface MarkingJobPaymentUpdate {
//   jobId: string;
//   paymentStatus: MarkingPaymentStatus;
//   escrowStatus?: EscrowStatus;
//   timestamp: Date;
//   message: string;
// }

// export interface PropertyConfirmationPaymentTrigger {
//   jobId: string;
//   propertyOwnerId: string;
//   confirmed: boolean; // true = release full payment, false = keep in escrow
//   confirmationTimestamp: Date;
//   notes?: string;
// }

// // ============================================
// // Webhook and Notification Types
// // ============================================

// export interface PaymentNotification {
//   type: 'PAYMENT_INITIATED' | 'PAYMENT_CONFIRMED' | 'PAYMENT_RELEASED' | 'COMPENSATION_ISSUED' | 'PAYMENT_FAILED';
//   recipientId: string;
//   recipientEmail: string;
  
//   jobId: string;
//   paymentId: string;
  
//   amount?: number;
//   status?: MarkingPaymentStatus;
  
//   message: string;
//   actionRequired: boolean;
//   actionUrl?: string;
  
//   createdAt: Date;
// }

// // ============================================
// // Report and Analytics Types
// // ============================================

// export interface MarkingPaymentReport {
//   totalMarkingJobs: number;
//   totalRevenueNGN: number;
//   totalAgentCommissionsNGN: number;
//   totalPlatformFeesNGN: number;
  
//   paymentBreakdown: {
//     [key in MarkingPaymentType]: {
//       count: number;
//       totalAmount: number;
//     };
//   };
  
//   statusBreakdown: {
//     [key in MarkingPaymentStatus]: number;
//   };
  
//   averagePaymentProcessingTimeMs: number;
//   paymentSuccessRate: number; // Percentage
  
//   topAgentsbyCompensation: Array<{
//     agentId: string;
//     agentName: string;
//     totalCompensation: number;
//     jobsCompleted: number;
//   }>;
// }