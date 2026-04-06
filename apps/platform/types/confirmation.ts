// Payment confirmation types
export interface PaymentConfirmation {
  id: string;
  paymentId: string;
  rentalId: string;
  propertyId: string;
  unitId?: string;
  renterId: string;
  
  // Confirmation period
  confirmationDeadline: Date;
  confirmationPeriodStart: Date;
  confirmationPeriodEnd: Date;
  hoursRemaining: number;
  
  // Status
  status: ConfirmationStatus;
  isConfirmed: boolean;
  confirmedAt?: Date;
  
  // Dispute information
  canDispute: boolean;
  disputeReason?: string;
  disputedAt?: Date;
  
  // Property verification
  propertyVerified: boolean;
  verificationNotes?: string;
  verifiedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum ConfirmationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DISPUTED = 'DISPUTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  AUTO_CONFIRMED = 'AUTO_CONFIRMED',
}

export interface ConfirmationAction {
  type: 'CONFIRM' | 'DISPUTE' | 'CANCEL';
  reason?: string;
  notes?: string;
  verificationPhotos?: string[];
}

// @/types/confirmation.ts — add these aliases at the bottom

export type ConfirmationStatusResponse = PaymentConfirmation;

export type ConfirmationResponse = ConfirmPaymentResponse;

export type DisputeInitiationResponse = DisputePaymentResponse;

export interface ConfirmationTimer {
  paymentId: string;
  endTime: Date;
  timeRemaining: number; // milliseconds
  isExpired: boolean;
  formattedTime: {
    hours: number;
    minutes: number;
    seconds: number;
  };
}

export interface DisputeRequest {
  paymentId: string;
  rentalId: string;
  reason: DisputeReason;
  description: string;
  evidence?: string[]; // URLs to uploaded evidence
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export enum DisputeReason {
  PROPERTY_NOT_AVAILABLE = 'PROPERTY_NOT_AVAILABLE',
  PROPERTY_CONDITION_MISMATCH = 'PROPERTY_CONDITION_MISMATCH',
  FRAUDULENT_LISTING = 'FRAUDULENT_LISTING',
  PRICING_DISCREPANCY = 'PRICING_DISCREPANCY',
  UNAUTHORIZED_CHARGES = 'UNAUTHORIZED_CHARGES',
  WRONG_PROPERTY = 'WRONG_PROPERTY',
  SAFETY_CONCERNS = 'SAFETY_CONCERNS',
  OTHER = 'OTHER',
}

export interface PropertyVerificationRequest {
  paymentId: string;
  rentalId: string;
  propertyId: string;
  unitId?: string;
  
  // Verification checklist
  checklist: VerificationChecklist;
  
  // Evidence
  photos?: string[];
  videos?: string[];
  notes?: string;
  
  // Location verification
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
}

export interface VerificationChecklist {
  propertyExists: boolean;
  matchesDescription: boolean;
  keysReceived: boolean;
  conditionSatisfactory: boolean;
  utilitiesWorking: boolean;
  securityAdequate: boolean;
  accessGranted: boolean;
  documentationComplete: boolean;
}

export interface ConfirmationNotification {
  id: string;
  paymentId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isRead: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export enum NotificationType {
  PAYMENT_HELD = 'PAYMENT_HELD',
  CONFIRMATION_REMINDER = 'CONFIRMATION_REMINDER',
  CONFIRMATION_DEADLINE_APPROACHING = 'CONFIRMATION_DEADLINE_APPROACHING',
  CONFIRMATION_EXPIRED = 'CONFIRMATION_EXPIRED',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  DISPUTE_SUBMITTED = 'DISPUTE_SUBMITTED',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
  REFUND_INITIATED = 'REFUND_INITIATED',
  REFUND_COMPLETED = 'REFUND_COMPLETED',
  COMMISSION_RELEASED = 'COMMISSION_RELEASED',
}

export interface ConfirmationSummary {
  totalPending: number;
  totalConfirmed: number;
  totalDisputed: number;
  totalExpired: number;
  activeConfirmations: PaymentConfirmation[];
  upcomingDeadlines: PaymentConfirmation[];
  recentActivity: ConfirmationActivity[];
}

export interface ConfirmationActivity {
  id: string;
  paymentId: string;
  action: string;
  description: string;
  performedBy: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// API Request/Response types
export interface ConfirmPaymentRequest {
  paymentId: string;
  verificationChecklist: VerificationChecklist;
  notes?: string;
  photos?: string[];
}

export interface ConfirmPaymentResponse {
  success: boolean;
  confirmation: PaymentConfirmation;
  message: string;
}

export interface DisputePaymentRequest {
  paymentId: string;
  reason: DisputeReason;
  description: string;
  evidence?: string[];
}

export interface DisputePaymentResponse {
  success: boolean;
  disputeId: string;
  ticketNumber: string;
  estimatedResolutionTime: Date;
  message: string;
}

export interface RefundRequest {
  paymentId: string;
  reason: string;
  refundAmount?: number; // Optional partial refund
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  refundAmount: number;
  estimatedCompletionTime: Date;
  message: string;
}