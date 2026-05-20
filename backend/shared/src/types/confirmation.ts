/**
 * Confirmation period types for the Payment Confirmation & Release System
 * Location: backend/shared/src/types/confirmation.ts
 */

import { Decimal } from '@newcondo/db';
// import { CONFIRMATION_PERIOD_HOURS } from 'src/constants';

/**
 * Confirmation period duration (24 hours)
 */
// export const CONFIRMATION_PERIOD_MS = CONFIRMATION_PERIOD_HOURS * 60 * 60 * 1000;

/**
 * Reminder schedule for confirmation reminders
 */
export const CONFIRMATION_REMINDER_SCHEDULE = {
  FIRST_REMINDER_HOURS: 12, // 12 hours after payment
  SECOND_REMINDER_HOURS: 20, // 20 hours after payment
  FINAL_REMINDER_HOURS: 23, // 1 hour before deadline
};

/**
 * Struct definition tracking active confirmation timelines
 */
export interface ConfirmationPeriod {
  startTime: Date;
  endTime: Date;
  durationHours: number;
  isActive: boolean;
  hasExpired: boolean;
  remainingHours: number;
}

/**
 * Confirmation status
 */
export enum ConfirmationStatus {
  PENDING = 'PENDING', // Waiting for renter confirmation
  CONFIRMED = 'CONFIRMED', // Renter confirmed property
  AUTO_CONFIRMED = 'AUTO_CONFIRMED', // Automatically confirmed after 24 hours
  DISPUTED = 'DISPUTED', // Renter disputed the property
  CANCELLED = 'CANCELLED', // Payment cancelled
}

/**
 * Property confirmation record
 */
export interface PropertyConfirmation {
  id: string;
  paymentHoldId: string;
  rentalId: string;
  propertyId: string;
  unitId?: string;
  renterId: string;
  
  // Confirmation details
  status: ConfirmationStatus;
  confirmationDeadline: Date; // 24 hours from payment
  
  // Pre-payment verification
  prePaymentVerified: boolean; // Checkbox before payment
  prePaymentVerifiedAt?: Date;
  
  // Post-payment confirmation
  confirmedAt?: Date;
  confirmationMethod?: ConfirmationMethod;
  confirmationNotes?: string;
  confirmationPhotos?: string[]; // Optional photos uploaded by renter
  
  // Dispute handling
  disputedAt?: Date;
  disputeReason?: string;
  disputeStatus?: DisputeStatus;
  
  // Auto-confirmation
  autoConfirmed: boolean;
  autoConfirmedAt?: Date;
  
  // Reminders sent
  remindersSent: number;
  lastReminderSentAt?: Date;
}

/**
 * Confirmation method
 */
export enum ConfirmationMethod {
  MANUAL = 'MANUAL', // Renter manually confirmed
  AUTO = 'AUTO', // Auto-confirmed after deadline
  ADMIN_OVERRIDE = 'ADMIN_OVERRIDE', // Admin confirmed
}

/**
 * Dispute status
 */
export enum DisputeStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED_REFUND = 'RESOLVED_REFUND',
  RESOLVED_NO_REFUND = 'RESOLVED_NO_REFUND',
  ESCALATED = 'ESCALATED',
}

/**
 * Pre-payment verification (checkbox before payment)
 */
export interface PrePaymentVerification {
  renterId: string;
  propertyId: string;
  unitId?: string;
  
  // Verification checklist
  checklist: VerificationChecklistItem[];
  allItemsVerified: boolean;
  
  verifiedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Verification checklist item
 */
export interface VerificationChecklistItem {
  id: string;
  label: string;
  description: string;
  isRequired: boolean;
  isChecked: boolean;
  checkedAt?: Date;
}

/**
 * Default verification checklist
 */
export const DEFAULT_VERIFICATION_CHECKLIST: Omit<VerificationChecklistItem, 'isChecked' | 'checkedAt'>[] = [
  {
    id: 'property_viewed',
    label: 'I have physically viewed this property',
    description: 'Confirm that you have visited and inspected the property in person',
    isRequired: true,
  },
  {
    id: 'property_available',
    label: 'I confirm the property is available and as described',
    description: 'The property matches the listing and is ready for occupancy',
    isRequired: true,
  },
  {
    id: 'terms_accepted',
    label: 'I accept the rental terms and conditions',
    description: 'I have read and agree to the rental agreement terms',
    isRequired: true,
  },
  {
    id: 'refund_policy',
    label: 'I understand the refund and confirmation policy',
    description: 'I understand that I have 24 hours to confirm or dispute this payment, and service fees are non-refundable',
    isRequired: true,
  },
];

/**
 * Confirmation request input
 */
export interface ConfirmPropertyInput {
  confirmationId: string;
  renterId: string;
  confirmationNotes?: string;
  confirmationPhotos?: string[];
}

/**
 * Dispute property input
 */
export interface DisputePropertyInput {
  confirmationId: string;
  renterId: string;
  disputeReason: string;
  disputeCategory: DisputeCategory;
  supportingDocuments?: string[];
  preferredResolution: PreferredResolution;
}

/**
 * Dispute category
 */
export enum DisputeCategory {
  PROPERTY_UNAVAILABLE = 'PROPERTY_UNAVAILABLE',
  NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
  CONDITION_ISSUES = 'CONDITION_ISSUES',
  LOCATION_ISSUES = 'LOCATION_ISSUES',
  SAFETY_CONCERNS = 'SAFETY_CONCERNS',
  LANDLORD_UNRESPONSIVE = 'LANDLORD_UNRESPONSIVE',
  FRAUDULENT_LISTING = 'FRAUDULENT_LISTING',
  OTHER = 'OTHER',
}

/**
 * Preferred resolution
 */
export enum PreferredResolution {
  FULL_REFUND = 'FULL_REFUND',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
  ALTERNATIVE_PROPERTY = 'ALTERNATIVE_PROPERTY',
  REPAIR_OR_FIX = 'REPAIR_OR_FIX',
}

/**
 * Confirmation reminder
 */
export interface ConfirmationReminder {
  id: string;
  confirmationId: string;
  renterId: string;
  
  // Reminder details
  reminderType: ReminderType;
  scheduledAt: Date;
  sentAt?: Date;
  
  // Delivery
  channels: ConfirmationNotificationChannel[];
  status: ReminderStatus;
  
  // Content
  subject: string;
  message: string;
  
  // Response tracking
  viewed: boolean;
  viewedAt?: Date;
  actionTaken?: ReminderAction;
}

/**
 * Reminder type
 */
export enum ReminderType {
  FIRST_REMINDER = 'FIRST_REMINDER', // 12 hours after payment
  SECOND_REMINDER = 'SECOND_REMINDER', // 20 hours after payment
  FINAL_REMINDER = 'FINAL_REMINDER', // 23 hours after payment
  URGENT_REMINDER = 'URGENT_REMINDER', // Custom urgent reminder
}

/**
 * Notification channel
 */
export enum ConfirmationNotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

/**
 * Reminder status
 */
export enum ReminderStatus {
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Reminder action
 */
export enum ReminderAction {
  CONFIRMED = 'CONFIRMED',
  DISPUTED = 'DISPUTED',
  IGNORED = 'IGNORED',
}

/**
 * Confirmation interface for renter
 */
export interface RenterConfirmationInterface {
  confirmationId: string;
  paymentDetails: ConfirmationPaymentDetails;
  propertyDetails: ConfirmationPropertyDetails;
  
  // Deadline information
  confirmationDeadline: Date;
  timeRemaining: number; // milliseconds
  isExpired: boolean;
  
  // Actions available
  canConfirm: boolean;
  canDispute: boolean;
  
  // Status
  currentStatus: ConfirmationStatus;
}

/**
 * Confirmation payment details
 */
export interface ConfirmationPaymentDetails {
  paymentId: string;
  totalAmount: Decimal;
  rentAmount: Decimal;
  serviceFee: Decimal;
  transactionFee: Decimal;
  paidAt: Date;
}

/**
 * Confirmation property details
 */
export interface ConfirmationPropertyDetails {
  propertyId: string;
  unitId?: string;
  title: string;
  address: string;
  images: string[];
  
  // Contact information
  propertyOwnerName: string;
  propertyOwnerPhone?: string;
  agentName?: string;
  agentPhone?: string;
}

/**
 * Auto-confirmation job
 */
export interface AutoConfirmationJob {
  id: string;
  scheduledAt: Date;
  status: ConfirmationJobStatus;
  
  // Processing details
  totalProcessed: number;
  autoConfirmedCount: number;
  failureCount: number;
  
  // Timing
  startedAt?: Date;
  completedAt?: Date;
  
  // Results
  processedConfirmations: string[]; // Confirmation IDs
  errors: ConfirmationJobError[];
}

/**
 * Job status
 */
export enum ConfirmationJobStatus {
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Job error
 */
export interface ConfirmationJobError {
  confirmationId: string;
  errorType: string;
  errorMessage: string;
  timestamp: Date;
}

/**
 * Confirmation statistics
 */
export interface ConfirmationStats {
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Confirmation counts
  totalConfirmations: number;
  manualConfirmations: number;
  autoConfirmations: number;
  disputes: number;
  
  // Rates
  confirmationRate: number; // percentage
  disputeRate: number; // percentage
  autoConfirmationRate: number; // percentage
  
  // Timing
  averageConfirmationTime: number; // milliseconds
  averageDisputeTime: number; // milliseconds
  
  // Dispute resolution
  disputesResolved: number;
  disputesRefunded: number;
  averageDisputeResolutionTime: number; // milliseconds
}

/**
 * Property owner notification for confirmation
 */
export interface OwnerConfirmationNotification {
  ownerId: string;
  propertyId: string;
  unitId?: string;
  renterId: string;
  renterName: string;
  
  // Notification type
  notificationType: OwnerNotificationType;
  
  // Details
  confirmationStatus: ConfirmationStatus;
  paymentAmount: Decimal;
  expectedReleaseDate: Date;
  
  // Content
  subject: string;
  message: string;
}

/**
 * Owner notification type
 */
export enum OwnerNotificationType {
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  CONFIRMATION_PENDING = 'CONFIRMATION_PENDING',
  PROPERTY_CONFIRMED = 'PROPERTY_CONFIRMED',
  PROPERTY_DISPUTED = 'PROPERTY_DISPUTED',
  PAYMENT_RELEASED = 'PAYMENT_RELEASED',
}

/**
 * Error types for confirmation operations
 */
export enum ConfirmationErrorType {
  CONFIRMATION_NOT_FOUND = 'CONFIRMATION_NOT_FOUND',
  INVALID_STATUS = 'INVALID_STATUS',
  DEADLINE_EXPIRED = 'DEADLINE_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  ALREADY_CONFIRMED = 'ALREADY_CONFIRMED',
  ALREADY_DISPUTED = 'ALREADY_DISPUTED',
  INVALID_DISPUTE_REASON = 'INVALID_DISPUTE_REASON',
  PRE_PAYMENT_NOT_VERIFIED = 'PRE_PAYMENT_NOT_VERIFIED',
}

/**
 * Confirmation error
 */
export class ConfirmationError extends Error {
  constructor(
    public type: ConfirmationErrorType,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ConfirmationError';
  }
}

/**
 * Confirmation query filters
 */
export interface ConfirmationQueryFilters {
  status?: ConfirmationStatus;
  renterId?: string;
  propertyId?: string;
  deadlineBefore?: Date;
  deadlineAfter?: Date;
  isDisputed?: boolean;
  autoConfirmed?: boolean;
}

// --------------------------------------------------------------------------------------------------------------------

/**
 * Admin action to resolve a dispute
 */
export interface AdminResolveDisputeInput {
  confirmationId: string;
  adminId: string;
  resolutionStatus: DisputeResolutionAction;
  adminNotes: string;
  refundAmount?: Decimal; // Required if resolving as a refund
}

/**
 * Dispute resolution actions available to Admin
 */
export enum DisputeResolutionAction {
  APPROVE_REFUND = 'APPROVE_REFUND', // Resolves to RESOLVED_REFUND
  DENY_REFUND = 'DENY_REFUND', // Resolves to RESOLVED_NO_REFUND
  ESCALATE = 'ESCALATE', // Resolves to ESCALATED
  CONFIRM_PROPERTY = 'CONFIRM_PROPERTY', // Overrides dispute and confirms property (Rare)
}
