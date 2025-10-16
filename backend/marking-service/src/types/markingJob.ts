// backend/marking-service/src/types/markingJob.ts

import { UrgencyLevel, MarkingJobStatus, PaymentStatus } from '@newcondo/db';

export interface CreateMarkingJobData {
  propertyId: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel: UrgencyLevel;
  requestedBy: string;
}

export interface UpdateMarkingJobData {
  contactPersonName?: string;
  contactPersonPhone?: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel?: UrgencyLevel;
  status?: MarkingJobStatus;
}

export interface MarkingJobFilters {
  status?: MarkingJobStatus;
  urgencyLevel?: UrgencyLevel;
  assignedAgentId?: string;
  requestedBy?: string;
  city?: string;
  paymentStatus?: PaymentStatus;
}

export interface JobCompletionData {
  completionNotes?: string;
  completionImages: string[];
  boundaryData: {
    coordinates: Array<{ lat: number; lng: number }>;
    center: { lat: number; lng: number };
    area: number;
    perimeter: number;
  };
}

export interface AgentAssignmentData {
  agentId: string;
  timeSlotStart: Date;
  timeSlotEnd: Date;
  estimatedCompletionTime: Date;
}



// // backend/marking-service/src/types/markingJob.ts

// export enum MarkingMethod {
//   SELF = 'SELF',
//   NEWCONDO_ADMIN = 'NEWCONDO_ADMIN',
//   PERSONAL_CONTACT = 'PERSONAL_CONTACT',
//   PLATFORM_AGENT = 'PLATFORM_AGENT'
// }

// export enum MarkingJobStatus {
//   PENDING_PAYMENT = 'PENDING_PAYMENT',
//   PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
//   QUEUED = 'QUEUED',
//   ASSIGNED = 'ASSIGNED',
//   IN_PROGRESS = 'IN_PROGRESS',
//   AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION',
//   CONFIRMED = 'CONFIRMED',
//   REJECTED = 'REJECTED',
//   COMPLETED = 'COMPLETED',
//   CANCELLED = 'CANCELLED',
//   EXPIRED = 'EXPIRED'
// }

// export enum UrgencyLevel {
//   LOW = 'LOW',
//   NORMAL = 'NORMAL',
//   HIGH = 'HIGH',
//   URGENT = 'URGENT'
// }

// export interface PropertyAddress {
//   state: string;
//   lga: string; // Local Government Area
//   city: string;
//   location: string; // Lowest level location
//   streetAddress?: string;
//   landmarks?: string;
// }

// export interface ContactPerson {
//   name: string;
//   phone: string;
//   alternatePhone?: string;
//   relationship?: string; // e.g., "Caretaker", "Neighbor", "Relative"
//   notes?: string;
// }

// export interface MarkingJobPricing {
//   basePrice: number; // 20,000 NGN for user-requested marking
//   adminPrice: number; // 25,000 NGN for admin marking
//   agentCompensationPercentage: number; // 25%
//   agentCompensation: number; // 25% of 20,000 = 5,000 NGN
//   platformShare: number; // 75% of 20,000 = 15,000 NGN
//   initialPayment: number; // 1,000 NGN initial payment to agent
//   remainingPayment: number; // Remaining after initial payment
// }

// export interface MarkingJobImages {
//   propertyExterior?: string[]; // Images provided by property owner
//   propertyInterior?: string[];
//   boundaryMarking?: string[]; // Images uploaded by agent after marking
//   keyRooms?: string[]; // Living room, kitchen, bathroom, etc.
// }

// export interface BoundaryData {
//   coordinates: {
//     lat: number;
//     lng: number;
//   }[];
//   centerPoint: {
//     lat: number;
//     lng: number;
//   };
//   area?: number; // Square meters
//   perimeter?: number; // Meters
//   markedAt: Date;
//   markedBy: string; // Agent ID
// }

// export interface ShareableLink {
//   token: string;
//   url: string;
//   expiresAt: Date;
//   isUsed: boolean;
//   usedAt?: Date;
//   usedBy?: string; // Name or identifier of the person who used it
// }

// export interface MarkingJobConfirmation {
//   isConfirmed: boolean;
//   confirmedAt?: Date;
//   confirmationDeadline: Date;
//   rejectionReason?: string;
//   rejectionCount: number;
//   maxRejections: number; // After x rejections, fee is depleted
// }

// export interface MarkingJob {
//   id: string;
//   propertyId: string;
//   requestedBy: string; // User ID
//   markingMethod: MarkingMethod;
  
//   // Property Details
//   propertyAddress: PropertyAddress;
//   propertyImages?: MarkingJobImages;
  
//   // Contact & Access
//   contactPerson: ContactPerson;
//   accessInstructions?: string;
//   preferredTimeSlot?: Date;
//   urgencyLevel: UrgencyLevel;
  
//   // Assignment
//   assignedAgentId?: string;
//   assignedAt?: Date;
//   queuePosition?: number;
//   timeSlotExpiry?: Date; // 3-hour window
  
//   // Shareable Link (for PERSONAL_CONTACT method)
//   shareableLink?: ShareableLink;
  
//   // Payment
//   pricing: MarkingJobPricing;
//   paymentStatus: 'PENDING' | 'COMPLETED' | 'REFUNDED';
//   paymentId?: string;
//   virtualAccountId?: string;
  
//   // Completion
//   completionData?: {
//     boundaryData: BoundaryData;
//     completionImages: string[];
//     completionNotes?: string;
//     completedAt: Date;
//   };
  
//   // Confirmation System
//   confirmation: MarkingJobConfirmation;
  
//   // Status & Tracking
//   status: MarkingJobStatus;
//   maxCompletionTime: Date; // 2-3 days from agent marking
//   notifications: MarkingJobNotification[];
  
//   // Metadata
//   createdAt: Date;
//   updatedAt: Date;
//   cancelledAt?: Date;
//   cancellationReason?: string;
// }

// export interface MarkingJobNotification {
//   id: string;
//   type: 'ASSIGNMENT' | 'COMPLETION' | 'CONFIRMATION_REMINDER' | 'EXPIRY_WARNING' | 'PAYMENT_RELEASED';
//   recipient: string; // User ID
//   message: string;
//   sentAt: Date;
//   isRead: boolean;
// }

// export interface CreateMarkingJobDTO {
//   propertyId: string;
//   requestedBy: string;
//   markingMethod: MarkingMethod;
//   propertyAddress: PropertyAddress;
//   contactPerson: ContactPerson;
//   accessInstructions?: string;
//   preferredTimeSlot?: Date;
//   urgencyLevel?: UrgencyLevel;
//   propertyImages?: {
//     exterior?: string[];
//     interior?: string[];
//   };
// }

// export interface UpdateMarkingJobDTO {
//   assignedAgentId?: string;
//   status?: MarkingJobStatus;
//   completionData?: MarkingJob['completionData'];
//   confirmation?: Partial<MarkingJobConfirmation>;
//   cancellationReason?: string;
// }

// export interface MarkingJobFilters {
//   status?: MarkingJobStatus[];
//   markingMethod?: MarkingMethod[];
//   requestedBy?: string;
//   assignedAgentId?: string;
//   urgencyLevel?: UrgencyLevel[];
//   state?: string;
//   lga?: string;
//   dateFrom?: Date;
//   dateTo?: Date;
//   paymentStatus?: 'PENDING' | 'COMPLETED' | 'REFUNDED';
// }









// // backend/marking-service/src/types/markingJob.ts

// import { 
//   MarkingJobStatus, 
//   UrgencyLevel, 
//   PaymentStatus 
// } from '@prisma/client';

// export interface MarkingJobCreate {
//   propertyId: string;
//   requestedBy: string;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: Date;
//   urgencyLevel?: UrgencyLevel;
//   markingFee: number;
// }

// export interface MarkingJobUpdate {
//   contactPersonName?: string;
//   contactPersonPhone?: string;
//   accessInstructions?: string;
//   preferredTime?: Date;
//   urgencyLevel?: UrgencyLevel;
//   status?: MarkingJobStatus;
// }

// export interface MarkingJobCompletion {
//   completionNotes?: string;
//   completionImages: string[];
//   boundaryData: {
//     coordinates: Array<{ lat: number; lng: number }>;
//     area: number;
//     centerPoint: { lat: number; lng: number };
//   };
// }

// export interface MarkingJobAssignment {
//   jobId: string;
//   agentId: string;
//   timeSlotExpiry: Date;
//   queuePosition: number;
// }

// export interface MarkingJobFilter {
//   status?: MarkingJobStatus | MarkingJobStatus[];
//   requestedBy?: string;
//   assignedAgentId?: string;
//   propertyId?: string;
//   paymentStatus?: PaymentStatus;
//   urgencyLevel?: UrgencyLevel;
//   createdAfter?: Date;
//   createdBefore?: Date;
//   hasExpired?: boolean;
//   queuePosition?: number;
// }

// export interface MarkingJobStats {
//   totalJobs: number;
//   queuedJobs: number;
//   assignedJobs: number;
//   completedJobs: number;
//   expiredJobs: number;
//   averageCompletionTime: number; // in hours
//   totalRevenue: number;
//   agentPayouts: number;
// }

// export interface MarkingJobNotification {
//   jobId: string;
//   type: 'ASSIGNMENT' | 'REMINDER' | 'EXPIRY_WARNING' | 'COMPLETION' | 'CANCELLATION';
//   recipientId: string;
//   recipientType: 'AGENT' | 'PROPERTY_OWNER' | 'ADMIN';
//   message: string;
//   metadata?: Record<string, any>;
// }

// export interface MarkingJobPayment {
//   jobId: string;
//   totalFee: number;
//   agentCommission: number; // 25% of total fee
//   platformFee: number; // 75% of total fee
//   status: PaymentStatus;
//   paidAt?: Date;
//   releasedAt?: Date;
// }

// export interface MarkingJobTimeTracking {
//   jobId: string;
//   assignedAt?: Date;
//   timeSlotExpiry?: Date;
//   completedAt?: Date;
//   timeTakenHours?: number;
//   isWithinTimeSlot: boolean;
//   daysUntilMaxCompletion?: number;
// }

// export interface MarkingJobQueueInfo {
//   jobId: string;
//   queuePosition: number;
//   totalInQueue: number;
//   estimatedWaitTime: number; // in hours
//   currentAssignee?: {
//     agentId: string;
//     agentName: string;
//     timeRemaining: number; // in minutes
//   };
// }

// export interface MarkingJobValidation {
//   propertyId: string;
//   requestedBy: string;
//   errors: string[];
//   warnings: string[];
//   canProceed: boolean;
// }

// export interface MarkingJobAgentEligibility {
//   agentId: string;
//   isEligible: boolean;
//   reasons: string[];
//   distance?: number; // in kilometers
//   reliabilityScore?: number;
//   activeJobs: number;
//   completedJobs: number;
// }

// export interface MarkingJobMetrics {
//   jobId: string;
//   viewCount: number;
//   agentInterestCount: number;
//   reassignmentCount: number;
//   completionAttempts: number;
//   averageResponseTime: number; // in minutes
// }

// export interface MarkingJobResponse {
//   success: boolean;
//   message: string;
//   data?: any;
//   errors?: string[];
//   warnings?: string[];
// }

// export interface MarkingJobCancellation {
//   jobId: string;
//   cancelledBy: string;
//   reason: string;
//   refundAmount?: number;
//   refundStatus?: 'PENDING' | 'PROCESSED' | 'FAILED';
// }

// export interface MarkingJobEscalation {
//   jobId: string;
//   reason: 'TIMEOUT' | 'NO_AGENTS' | 'QUALITY_ISSUE' | 'DISPUTE';
//   escalatedBy: string;
//   escalatedAt: Date;
//   assignedToAdmin?: string;
//   resolution?: string;
//   resolvedAt?: Date;
// }

// // Constants for marking job business logic
// export const MARKING_JOB_CONSTANTS = {
//   DEFAULT_MARKING_FEE: 20000, // 20,000 NGN
//   AGENT_COMMISSION_PERCENTAGE: 0.25, // 25%
//   PLATFORM_FEE_PERCENTAGE: 0.75, // 75%
//   TIME_SLOT_DURATION_HOURS: 3,
//   MAX_COMPLETION_DAYS: 3,
//   QUEUE_RETRY_LIMIT: 5,
//   MIN_RELIABILITY_SCORE: 3.0,
//   MAX_CONCURRENT_JOBS_PER_AGENT: 3,
//   PROXIMITY_RADIUS_KM: 50, // 50km radius for agent matching
//   REMINDER_INTERVALS_MINUTES: [30, 60, 120], // Reminder at 30min, 1hr, 2hrs before expiry
// } as const;

// export type MarkingJobStatusTransition = {
//   from: MarkingJobStatus;
//   to: MarkingJobStatus;
//   isValid: boolean;
//   requiredRole?: 'AGENT' | 'OWNER' | 'ADMIN';
// };

// export const VALID_STATUS_TRANSITIONS: MarkingJobStatusTransition[] = [
//   { from: 'QUEUED', to: 'ASSIGNED', isValid: true, requiredRole: 'ADMIN' },
//   { from: 'ASSIGNED', to: 'IN_PROGRESS', isValid: true, requiredRole: 'AGENT' },
//   { from: 'IN_PROGRESS', to: 'COMPLETED', isValid: true, requiredRole: 'AGENT' },
//   { from: 'ASSIGNED', to: 'QUEUED', isValid: true }, // Re-queue on timeout
//   { from: 'QUEUED', to: 'CANCELLED', isValid: true, requiredRole: 'OWNER' },
//   { from: 'ASSIGNED', to: 'CANCELLED', isValid: true, requiredRole: 'OWNER' },
//   { from: 'IN_PROGRESS', to: 'CANCELLED', isValid: true, requiredRole: 'OWNER' },
//   { from: 'ASSIGNED', to: 'EXPIRED', isValid: true },
//   { from: 'QUEUED', to: 'EXPIRED', isValid: true },
// ];