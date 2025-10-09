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