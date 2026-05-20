/**
 * File: backend/shared/src/types/queue.ts
 * Shared queue types for Property Marking Service
 */

import { MarkingJobStatus, UrgencyLevel } from '@newcondo/db';

/**
 * Queue position information for an agent
 */
export interface QueuePosition {
  agentId: string;
  position: number;
  estimatedWaitTime: number; // in minutes
  joinedAt: Date;
  expiresAt: Date; // When the 3-hour time slot expires
}

/**
 * Queue entry for a marking job
 */
export interface MarkingJobQueueEntry {
  jobId: string;
  propertyId: string;
  requestedBy: string;
  markingFee: number;
  urgencyLevel: UrgencyLevel;
  propertyLocation: {
    state: string;
    city: string;
    lga?: string;
    gpsCoordinates?: string;
  };
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  queuedAt: Date;
  maxCompletionTime: Date; // Max 3 days from request
}

/**
 * Agent queue entry
 */
export interface AgentQueueEntry {
  agentId: string;
  jobId: string;
  position: number;
  assignedAt: Date;
  timeSlotStart: Date;
  timeSlotEnd: Date; // 3 hours from start
  status: AgentQueueStatus;
  partialPaymentAmount?: number; // Small compensation (1000 naira)
  partialPaymentReleased: boolean;
}

/**
 * Agent queue status
 */
export enum AgentQueueStatus {
  WAITING = 'WAITING', // In queue, waiting for turn
  ACTIVE = 'ACTIVE', // Currently has the 3-hour time slot
  COMPLETED = 'COMPLETED', // Successfully marked the property
  EXPIRED = 'EXPIRED', // Time slot expired without completion
  SKIPPED = 'SKIPPED', // Moved to next agent
  CANCELLED = 'CANCELLED', // Job cancelled
}

/**
 * Queue statistics
 */
export interface QueueStats {
  totalJobsInQueue: number;
  totalActiveJobs: number;
  totalWaitingAgents: number;
  averageWaitTime: number; // in minutes
  averageCompletionTime: number; // in minutes
  successRate: number; // percentage
}

/**
 * Queue notification payload
 */
export interface QueueNotificationPayload {
  type: QueueNotificationType;
  agentId: string;
  jobId: string;
  propertyId: string;
  message: string;
  metadata?: {
    position?: number;
    timeSlotStart?: Date;
    timeSlotEnd?: Date;
    estimatedWaitTime?: number;
    fee?: number;
    location?: string;
  };
}

/**
 * Queue notification types
 */
export enum QueueNotificationType {
  JOB_AVAILABLE = 'JOB_AVAILABLE', // New job broadcast to eligible agents
  POSITION_ASSIGNED = 'POSITION_ASSIGNED', // Agent added to queue
  TURN_APPROACHING = 'TURN_APPROACHING', // Next in queue (15 min warning)
  TIME_SLOT_STARTED = 'TIME_SLOT_STARTED', // 3-hour window started
  TIME_SLOT_EXPIRING = 'TIME_SLOT_EXPIRING', // 30 min warning
  TIME_SLOT_EXPIRED = 'TIME_SLOT_EXPIRED', // Time slot ended
  JOB_COMPLETED = 'JOB_COMPLETED', // Job marked by another agent
  JOB_CANCELLED = 'JOB_CANCELLED', // Job cancelled by owner
  PARTIAL_PAYMENT_RELEASED = 'PARTIAL_PAYMENT_RELEASED', // 1000 naira released
  FULL_PAYMENT_RELEASED = 'FULL_PAYMENT_RELEASED', // Full payment after confirmation
}

/**
 * Queue rotation event
 */
export interface QueueRotationEvent {
  jobId: string;
  previousAgentId: string;
  nextAgentId: string;
  reason: RotationReason;
  timestamp: Date;
}

/**
 * Rotation reasons
 */
export enum RotationReason {
  TIME_EXPIRED = 'TIME_EXPIRED', // 3-hour time slot expired
  AGENT_DECLINED = 'AGENT_DECLINED', // Agent declined the job
  AGENT_UNAVAILABLE = 'AGENT_UNAVAILABLE', // Agent became unavailable
  MANUAL_ROTATION = 'MANUAL_ROTATION', // Admin manually rotated
}

/**
 * Time slot configuration
 */
export interface TimeSlotConfig {
  duration: number; // in minutes (default: 180 = 3 hours)
  warningThreshold: number; // in minutes (default: 30)
  approachingThreshold: number; // in minutes (default: 15)
  maxRotations: number; // Max times to rotate queue (default: 10)
  partialPaymentAmount: number; // Small compensation (default: 1000)
}

/**
 * Queue eligibility criteria
 */
export interface QueueEligibilityCriteria {
  agentId: string;
  isAvailableForMarking: boolean;
  hasActiveTimeSlot: boolean;
  reliabilityScore: number;
  serviceAreas: string[];
  distanceFromProperty: number; // in kilometers
  isWithinReasonableProximity: boolean;
  completedMarkingJobs: number;
  totalMarkingJobs: number;
}

/**
 * Queue management action
 */
export interface QueueManagementAction {
  action: QueueAction;
  jobId: string;
  agentId?: string;
  performedBy: string; // Admin user ID
  reason?: string;
  timestamp: Date;
}

/**
 * Queue actions
 */
export enum QueueAction {
  ADD_AGENT = 'ADD_AGENT',
  REMOVE_AGENT = 'REMOVE_AGENT',
  ROTATE_QUEUE = 'ROTATE_QUEUE',
  CANCEL_JOB = 'CANCEL_JOB',
  EXTEND_TIME_SLOT = 'EXTEND_TIME_SLOT',
  MANUAL_ASSIGNMENT = 'MANUAL_ASSIGNMENT',
}

/**
 * Property confirmation status
 */
export interface PropertyConfirmationStatus {
  jobId: string;
  propertyId: string;
  ownerId: string;
  agentId: string;
  markedAt: Date;
  confirmationDeadline: Date; // 2-3 days from marking
  isConfirmed: boolean;
  confirmedAt?: Date;
  rejectionReason?: string;
  attemptsRemaining: number;
  partialPaymentsReleased: number;
  totalFeeRemaining: number;
}

/**
 * Queue performance metrics
 */
export interface QueuePerformanceMetrics {
  jobId: string;
  totalAgentsInQueue: number;
  totalRotations: number;
  averageTimeSlotUtilization: number; // percentage
  completionTime: number; // in minutes
  firstResponseTime: number; // Time to first agent acceptance
  successfulCompletionRate: number; // percentage
}

export default {
  AgentQueueStatus,
  QueueNotificationType,
  RotationReason,
  QueueAction,
};

