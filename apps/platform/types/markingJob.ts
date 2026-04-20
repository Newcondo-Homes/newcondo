// apps/platform/types/markingJob.ts
// Property marking job specific types

import {
  MarkingJobStatus,
  UrgencyLevel,
  PaymentStatus
} from "@newcondo/db";
import {
  MarkingConfirmationStatus,
  BoundaryCoordinates,
  GPSCoordinates,
  MarkingImage
} from "./marking";

/**
 * Complete marking job details
 */
export interface MarkingJob {
  id: string;
  propertyId: string;
  requestedBy: string;
  assignedAgentId?: string;

  // Job Details
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: UrgencyLevel;

  // Pricing
  markingFee: number;
  paymentStatus: PaymentStatus;
  agentCompensation?: number; // 25% of marking fee
  platformFee?: number; // 75% of marking fee

  // Job Status
  status: MarkingJobStatus;
  assignedAt?: string;
  completedAt?: string;
  timeSlotExpiry?: string; // 3-hour time slot limit

  // Completion Data
  completionNotes?: string;
  completionImages?: string[];
  boundaryData?: BoundaryCoordinates;

  // Queue Management
  queuePosition?: number;
  maxCompletionTime?: string; // Max 3 days from request

  // Confirmation System
  confirmationStatus?: MarkingConfirmationStatus;
  confirmationDeadline?: string; // 2-3 days from completion
  confirmationAttempts?: number;
  ownerFeedback?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Marking job with related data
 */
export interface MarkingJobWithRelations extends MarkingJob {
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    gpsCoordinates?: string;
    images?: string[];
  };
  requestingUser: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  assignedAgent?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    reliabilityScore?: number;
  };
}

/**
 * Job assignment details
 */
export interface JobAssignment {
  jobId: string;
  agentId: string;
  assignedAt: string;
  timeSlotExpiry: string;
  queuePosition: number;
  estimatedCompletionTime: string;
}

/**
 * Job completion submission
 */
export interface JobCompletionSubmission {
  jobId: string;
  boundaryCoordinates: BoundaryCoordinates;
  gpsCoordinates: GPSCoordinates;
  images: MarkingImage[];
  buildingFingerprint: string;
  notes?: string;
  completionTime: string;
}

/**
 * Job cancellation request
 */
export interface JobCancellationRequest {
  jobId: string;
  reason: string;
  cancelledBy: string; // User ID
  refundRequested?: boolean;
}

/**
 * Job payment breakdown
 */
export interface JobPaymentBreakdown {
  totalFee: number;
  agentCompensation: number; // 25%
  platformFee: number; // 75%
  initialPayment: number; // Small percentage paid on completion (e.g., 1000 NGN)
  remainingPayment: number; // Released after confirmation
  currency: string;
}

/**
 * Job timeline event
 */
export interface JobTimelineEvent {
  id: string;
  jobId: string;
  eventType: JobEventType;
  description: string;
  performedBy?: string; // User ID
  metadata?: Record<string, any>;
  timestamp: string;
}

export enum JobEventType {
  JOB_CREATED = "JOB_CREATED",
  PAYMENT_COMPLETED = "PAYMENT_COMPLETED",
  JOB_BROADCAST = "JOB_BROADCAST",
  AGENT_ASSIGNED = "AGENT_ASSIGNED",
  AGENT_ARRIVED = "AGENT_ARRIVED",
  MARKING_STARTED = "MARKING_STARTED",
  MARKING_COMPLETED = "MARKING_COMPLETED",
  CONFIRMATION_REQUESTED = "CONFIRMATION_REQUESTED",
  CONFIRMATION_REMINDER_SENT = "CONFIRMATION_REMINDER_SENT",
  OWNER_CONFIRMED = "OWNER_CONFIRMED",
  OWNER_REJECTED = "OWNER_REJECTED",
  PAYMENT_RELEASED = "PAYMENT_RELEASED",
  JOB_CANCELLED = "JOB_CANCELLED",
  JOB_EXPIRED = "JOB_EXPIRED",
  QUEUE_POSITION_CHANGED = "QUEUE_POSITION_CHANGED",
}

/**
 * Job filters for querying
 */
export interface MarkingJobFilters {
  status?: MarkingJobStatus[];
  paymentStatus?: PaymentStatus[];
  confirmationStatus?: MarkingConfirmationStatus[];
  urgencyLevel?: UrgencyLevel[];
  requestedBy?: string;
  assignedAgentId?: string;
  propertyId?: string;
  city?: string;
  state?: string;
  dateFrom?: string;
  dateTo?: string;
  queuePosition?: number;
}

/**
 * Job search criteria
 */
export interface JobSearchCriteria extends MarkingJobFilters {
  page?: number;
  limit?: number;
  sortBy?: JobSortField;
  sortOrder?: "asc" | "desc";
  searchTerm?: string;
}

export enum JobSortField {
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
  QUEUE_POSITION = "queuePosition",
  MARKING_FEE = "markingFee",
  URGENCY_LEVEL = "urgencyLevel",
  CONFIRMATION_DEADLINE = "confirmationDeadline",
}

/**
 * Job statistics by status
 */
export interface JobStatusStatistics {
  queued: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  expired: number;
  total: number;
}

/**
 * Agent job performance
 */
export interface AgentJobPerformance {
  agentId: string;
  totalJobsAssigned: number;
  completedJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  averageCompletionTime: number; // In hours
  reliabilityScore: number; // 0-5 rating
  totalEarnings: number;
  onTimeCompletionRate: number; // Percentage
  confirmationSuccessRate: number; // Percentage
}

/**
 * Job availability notification data
 */
export interface JobAvailabilityNotification {
  jobId: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  city: string;
  state: string;
  markingFee: number;
  agentCompensation: number;
  urgencyLevel: UrgencyLevel;
  preferredTime?: string;
  distanceKm: number;
  estimatedTravelTime: number; // In minutes
  queueSpotsAvailable: number;
}

/**
 * Job confirmation reminder
 */
export interface JobConfirmationReminder {
  jobId: string;
  propertyId: string;
  propertyTitle: string;
  completedAt: string;
  confirmationDeadline: string;
  hoursRemaining: number;
  attemptNumber: number;
  maxAttempts: number;
}

/**
 * Bulk job operations
 */
export interface BulkJobOperation {
  jobIds: string[];
  operation: BulkJobOperationType;
  reason?: string;
  performedBy: string;
}

export enum BulkJobOperationType {
  CANCEL = "CANCEL",
  REASSIGN = "REASSIGN",
  EXTEND_DEADLINE = "EXTEND_DEADLINE",
  CHANGE_URGENCY = "CHANGE_URGENCY",
}

/**
 * Job reassignment request
 */
export interface JobReassignmentRequest {
  jobId: string;
  currentAgentId: string;
  reason: string;
  broadcastToNewAgents: boolean;
  compensateCurrentAgent?: boolean;
}