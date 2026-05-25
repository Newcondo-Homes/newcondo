/**
 * Confirmation period types for the Payment Confirmation & Release System
 * Location: backend/shared/src/types/confirmation.ts
 */
import { Decimal } from '@newcondo/db';
/**
 * Confirmation period duration (24 hours)
 */
/**
 * Reminder schedule for confirmation reminders
 */
export declare const CONFIRMATION_REMINDER_SCHEDULE: {
    FIRST_REMINDER_HOURS: number;
    SECOND_REMINDER_HOURS: number;
    FINAL_REMINDER_HOURS: number;
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
export declare enum ConfirmationStatus {
    PENDING = "PENDING",// Waiting for renter confirmation
    CONFIRMED = "CONFIRMED",// Renter confirmed property
    AUTO_CONFIRMED = "AUTO_CONFIRMED",// Automatically confirmed after 24 hours
    DISPUTED = "DISPUTED",// Renter disputed the property
    CANCELLED = "CANCELLED"
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
    status: ConfirmationStatus;
    confirmationDeadline: Date;
    prePaymentVerified: boolean;
    prePaymentVerifiedAt?: Date;
    confirmedAt?: Date;
    confirmationMethod?: ConfirmationMethod;
    confirmationNotes?: string;
    confirmationPhotos?: string[];
    disputedAt?: Date;
    disputeReason?: string;
    disputeStatus?: DisputeStatus;
    autoConfirmed: boolean;
    autoConfirmedAt?: Date;
    remindersSent: number;
    lastReminderSentAt?: Date;
}
/**
 * Confirmation method
 */
export declare enum ConfirmationMethod {
    MANUAL = "MANUAL",// Renter manually confirmed
    AUTO = "AUTO",// Auto-confirmed after deadline
    ADMIN_OVERRIDE = "ADMIN_OVERRIDE"
}
/**
 * Dispute status
 */
export declare enum DisputeStatus {
    PENDING = "PENDING",
    UNDER_REVIEW = "UNDER_REVIEW",
    RESOLVED_REFUND = "RESOLVED_REFUND",
    RESOLVED_NO_REFUND = "RESOLVED_NO_REFUND",
    ESCALATED = "ESCALATED"
}
/**
 * Pre-payment verification (checkbox before payment)
 */
export interface PrePaymentVerification {
    renterId: string;
    propertyId: string;
    unitId?: string;
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
export declare const DEFAULT_VERIFICATION_CHECKLIST: Omit<VerificationChecklistItem, 'isChecked' | 'checkedAt'>[];
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
export declare enum DisputeCategory {
    PROPERTY_UNAVAILABLE = "PROPERTY_UNAVAILABLE",
    NOT_AS_DESCRIBED = "NOT_AS_DESCRIBED",
    CONDITION_ISSUES = "CONDITION_ISSUES",
    LOCATION_ISSUES = "LOCATION_ISSUES",
    SAFETY_CONCERNS = "SAFETY_CONCERNS",
    LANDLORD_UNRESPONSIVE = "LANDLORD_UNRESPONSIVE",
    FRAUDULENT_LISTING = "FRAUDULENT_LISTING",
    OTHER = "OTHER"
}
/**
 * Preferred resolution
 */
export declare enum PreferredResolution {
    FULL_REFUND = "FULL_REFUND",
    PARTIAL_REFUND = "PARTIAL_REFUND",
    ALTERNATIVE_PROPERTY = "ALTERNATIVE_PROPERTY",
    REPAIR_OR_FIX = "REPAIR_OR_FIX"
}
/**
 * Confirmation reminder
 */
export interface ConfirmationReminder {
    id: string;
    confirmationId: string;
    renterId: string;
    reminderType: ReminderType;
    scheduledAt: Date;
    sentAt?: Date;
    channels: ConfirmationNotificationChannel[];
    status: ReminderStatus;
    subject: string;
    message: string;
    viewed: boolean;
    viewedAt?: Date;
    actionTaken?: ReminderAction;
}
/**
 * Reminder type
 */
export declare enum ReminderType {
    FIRST_REMINDER = "FIRST_REMINDER",// 12 hours after payment
    SECOND_REMINDER = "SECOND_REMINDER",// 20 hours after payment
    FINAL_REMINDER = "FINAL_REMINDER",// 23 hours after payment
    URGENT_REMINDER = "URGENT_REMINDER"
}
/**
 * Notification channel
 */
export declare enum ConfirmationNotificationChannel {
    EMAIL = "EMAIL",
    SMS = "SMS",
    PUSH = "PUSH",
    IN_APP = "IN_APP"
}
/**
 * Reminder status
 */
export declare enum ReminderStatus {
    SCHEDULED = "SCHEDULED",
    SENT = "SENT",
    DELIVERED = "DELIVERED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
/**
 * Reminder action
 */
export declare enum ReminderAction {
    CONFIRMED = "CONFIRMED",
    DISPUTED = "DISPUTED",
    IGNORED = "IGNORED"
}
/**
 * Confirmation interface for renter
 */
export interface RenterConfirmationInterface {
    confirmationId: string;
    paymentDetails: ConfirmationPaymentDetails;
    propertyDetails: ConfirmationPropertyDetails;
    confirmationDeadline: Date;
    timeRemaining: number;
    isExpired: boolean;
    canConfirm: boolean;
    canDispute: boolean;
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
    totalProcessed: number;
    autoConfirmedCount: number;
    failureCount: number;
    startedAt?: Date;
    completedAt?: Date;
    processedConfirmations: string[];
    errors: ConfirmationJobError[];
}
/**
 * Job status
 */
export declare enum ConfirmationJobStatus {
    SCHEDULED = "SCHEDULED",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
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
    totalConfirmations: number;
    manualConfirmations: number;
    autoConfirmations: number;
    disputes: number;
    confirmationRate: number;
    disputeRate: number;
    autoConfirmationRate: number;
    averageConfirmationTime: number;
    averageDisputeTime: number;
    disputesResolved: number;
    disputesRefunded: number;
    averageDisputeResolutionTime: number;
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
    notificationType: OwnerNotificationType;
    confirmationStatus: ConfirmationStatus;
    paymentAmount: Decimal;
    expectedReleaseDate: Date;
    subject: string;
    message: string;
}
/**
 * Owner notification type
 */
export declare enum OwnerNotificationType {
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
    CONFIRMATION_PENDING = "CONFIRMATION_PENDING",
    PROPERTY_CONFIRMED = "PROPERTY_CONFIRMED",
    PROPERTY_DISPUTED = "PROPERTY_DISPUTED",
    PAYMENT_RELEASED = "PAYMENT_RELEASED"
}
/**
 * Error types for confirmation operations
 */
export declare enum ConfirmationErrorType {
    CONFIRMATION_NOT_FOUND = "CONFIRMATION_NOT_FOUND",
    INVALID_STATUS = "INVALID_STATUS",
    DEADLINE_EXPIRED = "DEADLINE_EXPIRED",
    UNAUTHORIZED = "UNAUTHORIZED",
    ALREADY_CONFIRMED = "ALREADY_CONFIRMED",
    ALREADY_DISPUTED = "ALREADY_DISPUTED",
    INVALID_DISPUTE_REASON = "INVALID_DISPUTE_REASON",
    PRE_PAYMENT_NOT_VERIFIED = "PRE_PAYMENT_NOT_VERIFIED"
}
/**
 * Confirmation error
 */
export declare class ConfirmationError extends Error {
    type: ConfirmationErrorType;
    details?: Record<string, any> | undefined;
    constructor(type: ConfirmationErrorType, message: string, details?: Record<string, any> | undefined);
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
/**
 * Admin action to resolve a dispute
 */
export interface AdminResolveDisputeInput {
    confirmationId: string;
    adminId: string;
    resolutionStatus: DisputeResolutionAction;
    adminNotes: string;
    refundAmount?: Decimal;
}
/**
 * Dispute resolution actions available to Admin
 */
export declare enum DisputeResolutionAction {
    APPROVE_REFUND = "APPROVE_REFUND",// Resolves to RESOLVED_REFUND
    DENY_REFUND = "DENY_REFUND",// Resolves to RESOLVED_NO_REFUND
    ESCALATE = "ESCALATE",// Resolves to ESCALATED
    CONFIRM_PROPERTY = "CONFIRM_PROPERTY"
}
//# sourceMappingURL=confirmation.d.ts.map