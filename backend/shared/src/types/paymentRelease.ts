/**
 * Payment release types for the Payment Confirmation & Release System
 * Location: backend/shared/src/types/paymentRelease.ts
 */

import { Decimal } from '@prisma/client/runtime/library';
import { CommissionDistribution } from './commission';

/**
 * Payment hold period (24 hours in milliseconds)
 */
export const PAYMENT_HOLD_PERIOD_HOURS = 24;
export const PAYMENT_HOLD_PERIOD_MS = PAYMENT_HOLD_PERIOD_HOURS * 60 * 60 * 1000;

/**
 * Payment hold status
 */
export enum PaymentHoldStatus {
  HELD = 'HELD', // Payment is being held
  PENDING_RELEASE = 'PENDING_RELEASE', // Ready to be released
  RELEASED = 'RELEASED', // Released to recipients
  REFUNDED = 'REFUNDED', // Refunded to renter
  DISPUTED = 'DISPUTED', // Under dispute
  CANCELLED = 'CANCELLED', // Cancelled
}

/**
 * Payment hold record
 */
export interface PaymentHold {
  id: string;
  paymentId: string;
  rentalId: string;
  propertyId: string;
  unitId?: string;
  renterId: string;
  
  // Amount details
  totalAmount: Decimal;
  rentAmount: Decimal;
  serviceFee: Decimal; // Non-refundable
  transactionFee: Decimal; // 2x Flutterwave fee
  
  // Hold details
  status: PaymentHoldStatus;
  heldAt: Date;
  releaseScheduledAt: Date; // 24 hours after heldAt
  releasedAt?: Date;
  
  // Virtual account where funds are held
  holdingVirtualAccountId: string;
  
  // Metadata
  isConfirmed: boolean;
  confirmedAt?: Date;
  disputeReason?: string;
  disputedAt?: Date;
}

/**
 * Payment release schedule
 */
export interface PaymentReleaseSchedule {
  id: string;
  paymentHoldId: string;
  scheduledAt: Date;
  status: ReleaseScheduleStatus;
  
  // Release details
  commissionDistribution?: CommissionDistribution;
  
  // Execution
  executedAt?: Date;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
}

/**
 * Release schedule status
 */
export enum ReleaseScheduleStatus {
  SCHEDULED = 'SCHEDULED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Payment release request
 */
export interface PaymentReleaseRequest {
  paymentHoldId: string;
  initiatedBy: string; // User ID or 'SYSTEM' for automated
  reason?: string;
}

/**
 * Payment release result
 */
export interface PaymentReleaseResult {
  success: boolean;
  paymentHoldId: string;
  releasedAt: Date;
  commissionDistribution: CommissionDistribution;
  transfers: ReleaseTransfer[];
  errors?: ReleaseError[];
}

/**
 * Individual release transfer
 */
export interface ReleaseTransfer {
  id: string;
  recipientId: string;
  recipientType: string;
  amount: Decimal;
  fromVirtualAccountId: string;
  toVirtualAccountId: string;
  status: TransferStatus;
  transferredAt?: Date;
  transactionReference: string;
}

/**
 * Transfer status
 */
export enum TransferStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Release error
 */
export interface ReleaseError {
  transferId: string;
  errorCode: string;
  errorMessage: string;
  timestamp: Date;
}

/**
 * Refund request
 */
export interface RefundRequest {
  paymentHoldId: string;
  renterId: string;
  reason: string;
  requestedAt: Date;
  supportingDocuments?: string[]; // URLs to evidence
}

/**
 * Refund calculation
 */
export interface RefundCalculation {
  totalPaid: Decimal;
  refundableAmount: Decimal;
  nonRefundableServiceFee: Decimal;
  refundTransactionFee: Decimal; // Additional fee for refund
  netRefundAmount: Decimal; // Amount renter receives
}

/**
 * Refund result
 */
export interface RefundResult {
  success: boolean;
  paymentHoldId: string;
  refundAmount: Decimal;
  refundedAt: Date;
  transactionReference: string;
  refundCalculation: RefundCalculation;
  error?: string;
}

/**
 * Automated release job
 */
export interface AutomatedReleaseJob {
  id: string;
  scheduledAt: Date;
  batchSize: number;
  status: JobStatus;
  
  // Processing details
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  
  // Timing
  startedAt?: Date;
  completedAt?: Date;
  
  // Results
  processedPaymentHolds: string[]; // Payment hold IDs
  errors: JobError[];
}

/**
 * Job status
 */
export enum JobStatus {
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Job error
 */
export interface JobError {
  paymentHoldId: string;
  errorType: string;
  errorMessage: string;
  timestamp: Date;
  stackTrace?: string;
}

/**
 * Release notification
 */
export interface ReleaseNotification {
  recipientId: string;
  recipientType: 'RENTER' | 'PROPERTY_OWNER' | 'AGENT';
  notificationType: NotificationType;
  
  // Notification content
  subject: string;
  message: string;
  data: Record<string, any>;
  
  // Delivery
  channels: NotificationChannel[];
  sentAt?: Date;
}

/**
 * Notification type
 */
export enum NotificationType {
  PAYMENT_HELD = 'PAYMENT_HELD',
  CONFIRMATION_REMINDER = 'CONFIRMATION_REMINDER',
  PAYMENT_RELEASED = 'PAYMENT_RELEASED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  COMMISSION_RECEIVED = 'COMMISSION_RECEIVED',
}

/**
 * Notification channel
 */
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

/**
 * Payment hold query filters
 */
export interface PaymentHoldQueryFilters {
  status?: PaymentHoldStatus;
  releaseScheduledBefore?: Date;
  releaseScheduledAfter?: Date;
  renterId?: string;
  propertyId?: string;
  isConfirmed?: boolean;
  isDisputed?: boolean;
}

/**
 * Payment release statistics
 */
export interface PaymentReleaseStats {
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Counts
  totalPaymentsHeld: number;
  totalPaymentsReleased: number;
  totalPaymentsRefunded: number;
  totalPaymentsDisputed: number;
  
  // Amounts
  totalAmountHeld: Decimal;
  totalAmountReleased: Decimal;
  totalAmountRefunded: Decimal;
  
  // Timing
  averageHoldDuration: number; // milliseconds
  averageReleaseTime: number; // milliseconds from scheduled time
  
  // Confirmations
  confirmationRate: number; // percentage
  disputeRate: number; // percentage
}

/**
 * Error types for payment release operations
 */
export enum PaymentReleaseErrorType {
  PAYMENT_HOLD_NOT_FOUND = 'PAYMENT_HOLD_NOT_FOUND',
  INVALID_STATUS = 'INVALID_STATUS',
  HOLD_PERIOD_NOT_ELAPSED = 'HOLD_PERIOD_NOT_ELAPSED',
  ALREADY_RELEASED = 'ALREADY_RELEASED',
  ALREADY_REFUNDED = 'ALREADY_REFUNDED',
  VIRTUAL_ACCOUNT_ERROR = 'VIRTUAL_ACCOUNT_ERROR',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TRANSFER_FAILED = 'TRANSFER_FAILED',
  COMMISSION_CALCULATION_FAILED = 'COMMISSION_CALCULATION_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

/**
 * Payment release error
 */
export class PaymentReleaseError extends Error {
  constructor(
    public type: PaymentReleaseErrorType,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'PaymentReleaseError';
  }
}

/**
 * Service fee configuration
 */
export interface ServiceFeeConfig {
  serviceFeePercentage: number;
  flutterwaveChargeMultiplier: number; // 2x for covering refund costs
  isServiceFeeRefundable: boolean; // false
  minimumServiceFee: Decimal;
  maximumServiceFee?: Decimal;
}

/**
 * Payment hold creation input
 */
export interface CreatePaymentHoldInput {
  paymentId: string;
  rentalId: string;
  propertyId: string;
  unitId?: string;
  renterId: string;
  totalAmount: Decimal;
  rentAmount: Decimal;
  serviceFee: Decimal;
  transactionFee: Decimal;
  holdingVirtualAccountId: string;
}

/**
 * Payment confirmation input
 */
export interface ConfirmPaymentInput {
  paymentHoldId: string;
  renterId: string;
  confirmationNotes?: string;
}

/**
 * Dispute payment input
 */
export interface DisputePaymentInput {
  paymentHoldId: string;
  renterId: string;
  disputeReason: string;
  supportingDocuments?: string[];
}