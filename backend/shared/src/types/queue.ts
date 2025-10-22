/**
 * File: backend/shared/src/types/queue.ts
 * Shared queue types for Property Marking Service
 */

import { MarkingJobStatus, UrgencyLevel } from '@prisma/client';

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
  QueuePosition,
  MarkingJobQueueEntry,
  AgentQueueEntry,
  AgentQueueStatus,
  QueueStats,
  QueueNotificationPayload,
  QueueNotificationType,
  QueueRotationEvent,
  RotationReason,
  TimeSlotConfig,
  QueueEligibilityCriteria,
  QueueManagementAction,
  QueueAction,
  PropertyConfirmationStatus,
  QueuePerformanceMetrics,
};






// /**
//  * Queue Management Types
//  * Types for the first-come-first-served queue system
//  */

// import { AgentInfo } from './marking';

// // Queue Entry Types
// export interface QueueEntryData {
//   id: string;
//   jobId: string;
//   agentId: string;
//   position: number;
//   joinedAt: Date;
//   status: QueueEntryStatus;
//   priority: number; // Calculated priority score
//   metadata?: QueueEntryMetadata;
// }

// export interface QueueEntryMetadata {
//   distance?: number; // Distance from property in km
//   agentLocation?: {
//     latitude: number;
//     longitude: number;
//   };
//   reliabilityScore?: number;
//   previousCompletedJobs?: number;
//   estimatedTravelTime?: number; // in minutes
// }

// export enum QueueEntryStatus {
//   WAITING = 'WAITING',
//   ACTIVE = 'ACTIVE', // Currently assigned the time slot
//   EXPIRED = 'EXPIRED', // Time slot expired
//   COMPLETED = 'COMPLETED', // Successfully completed the job
//   REMOVED = 'REMOVED', // Manually removed or left queue
// }

// // Queue Management
// export interface QueueState {
//   jobId: string;
//   entries: QueueEntryData[];
//   currentAgentId?: string;
//   currentAgentStartTime?: Date;
//   currentAgentExpiry?: Date;
//   totalWaiting: number;
//   lastUpdated: Date;
// }

// export interface JoinQueueRequest {
//   jobId: string;
//   agentId: string;
//   location?: {
//     latitude: number;
//     longitude: number;
//   };
// }

// export interface LeaveQueueRequest {
//   jobId: string;
//   agentId: string;
//   reason?: string;
// }

// export interface QueuePositionResponse {
//   position: number;
//   totalInQueue: number;
//   estimatedWaitTime?: number; // in minutes
//   isActive: boolean;
//   timeSlotExpiry?: Date;
// }

// // Queue Operations
// export interface MoveToNextInQueueRequest {
//   jobId: string;
//   reason: QueueProgressionReason;
//   previousAgentId?: string;
// }

// export enum QueueProgressionReason {
//   TIME_SLOT_EXPIRED = 'TIME_SLOT_EXPIRED',
//   JOB_COMPLETED = 'JOB_COMPLETED',
//   AGENT_REMOVED = 'AGENT_REMOVED',
//   JOB_CANCELLED = 'JOB_CANCELLED',
//   MANUAL_PROGRESSION = 'MANUAL_PROGRESSION',
// }

// export interface QueueProgressionResult {
//   success: boolean;
//   previousAgent?: string;
//   newAgent?: string;
//   newPosition?: number;
//   timeSlotExpiry?: Date;
//   queueEmpty: boolean;
// }

// // Queue Notifications
// export interface QueueNotificationData {
//   type: QueueNotificationType;
//   jobId: string;
//   agentId: string;
//   position?: number;
//   totalInQueue?: number;
//   estimatedWaitTime?: number;
//   timeSlotExpiry?: Date;
//   propertyAddress?: string;
// }

// export enum QueueNotificationType {
//   JOINED_QUEUE = 'JOINED_QUEUE',
//   POSITION_UPDATED = 'POSITION_UPDATED',
//   YOUR_TURN = 'YOUR_TURN',
//   TIME_SLOT_EXPIRING = 'TIME_SLOT_EXPIRING',
//   REMOVED_FROM_QUEUE = 'REMOVED_FROM_QUEUE',
//   QUEUE_CLOSED = 'QUEUE_CLOSED',
// }

// // Queue Statistics
// export interface QueueStatistics {
//   jobId: string;
//   totalJoined: number;
//   currentWaiting: number;
//   totalCompleted: number;
//   totalExpired: number;
//   totalRemoved: number;
//   averageWaitTime: number; // in minutes
//   averageCompletionTime: number; // in minutes
// }

// export interface AgentQueueHistory {
//   agentId: string;
//   totalQueuesJoined: number;
//   totalCompleted: number;
//   totalExpired: number;
//   successRate: number; // percentage
//   averagePosition: number;
//   averageWaitTime: number; // in minutes
// }

// // Queue Filters and Sorting
// export interface QueueFilters {
//   jobId?: string;
//   agentId?: string;
//   status?: QueueEntryStatus[];
//   minReliabilityScore?: number;
//   maxDistance?: number; // in km
//   dateFrom?: Date;
//   dateTo?: Date;
// }

// export interface QueueSortOptions {
//   sortBy: QueueSortField;
//   sortOrder: 'asc' | 'desc';
// }

// export enum QueueSortField {
//   POSITION = 'POSITION',
//   JOINED_AT = 'JOINED_AT',
//   PRIORITY = 'PRIORITY',
//   DISTANCE = 'DISTANCE',
//   RELIABILITY_SCORE = 'RELIABILITY_SCORE',
// }

// // Time Slot Management
// export interface TimeSlotInfo {
//   jobId: string;
//   agentId: string;
//   startTime: Date;
//   expiryTime: Date;
//   durationMinutes: number;
//   remainingMinutes: number;
//   isExpired: boolean;
//   isActive: boolean;
// }

// export interface TimeSlotExtensionRequest {
//   jobId: string;
//   agentId: string;
//   extensionMinutes: number;
//   reason: string;
// }

// export interface TimeSlotExtensionResponse {
//   granted: boolean;
//   newExpiryTime?: Date;
//   reason?: string;
// }

// // Queue Capacity and Limits
// export interface QueueCapacityInfo {
//   jobId: string;
//   maxCapacity: number;
//   currentCount: number;
//   isAtCapacity: boolean;
//   canJoin: boolean;
// }

// export interface QueueLimits {
//   maxQueueSize: number;
//   maxTimeSlotMinutes: number;
//   minReliabilityScore: number;
//   maxDistanceKm: number;
//   allowDuplicateAgents: boolean;
// }

// // Queue Validation
// export interface QueueValidation {
//   canJoin: boolean;
//   errors: string[];
//   warnings: string[];
//   suggestions?: string[];
// }

// export interface ValidateQueueJoinRequest {
//   jobId: string;
//   agentId: string;
//   location?: {
//     latitude: number;
//     longitude: number;
//   };
// }

// // Queue Events
// export enum QueueEventType {
//   AGENT_JOINED = 'AGENT_JOINED',
//   AGENT_LEFT = 'AGENT_LEFT',
//   AGENT_MOVED_TO_ACTIVE = 'AGENT_MOVED_TO_ACTIVE',
//   AGENT_COMPLETED = 'AGENT_COMPLETED',
//   AGENT_EXPIRED = 'AGENT_EXPIRED',
//   POSITION_UPDATED = 'POSITION_UPDATED',
//   QUEUE_CLEARED = 'QUEUE_CLEARED',
//   QUEUE_CLOSED = 'QUEUE_CLOSED',
// }

// export interface QueueEvent {
//   type: QueueEventType;
//   jobId: string;
//   agentId?: string;
//   timestamp: Date;
//   metadata?: Record<string, any>;
// }

// // Batch Queue Operations
// export interface BatchQueueOperation {
//   jobId: string;
//   operations: Array<{
//     type: 'add' | 'remove' | 'reorder';
//     agentId: string;
//     position?: number;
//   }>;
// }

// export interface BatchQueueOperationResult {
//   success: boolean;
//   successCount: number;
//   failureCount: number;
//   errors: Array<{
//     agentId: string;
//     operation: string;
//     error: string;
//   }>;
// }

// // Queue Analytics
// export interface QueueAnalytics {
//   jobId: string;
//   period: {
//     start: Date;
//     end: Date;
//   };
//   metrics: {
//     totalAgents: number;
//     peakQueueSize: number;
//     averageQueueSize: number;
//     totalCompletions: number;
//     totalExpirations: number;
//     completionRate: number; // percentage
//     averageTimeToCompletion: number; // in minutes
//     averageTimeSlotUtilization: number; // percentage
//   };
//   agentBreakdown: Array<{
//     agentId: string;
//     completions: number;
//     expirations: number;
//     averageWaitTime: number;
//   }>;
// }

// // Real-time Queue Updates
// export interface QueueUpdateSubscription {
//   jobId: string;
//   agentId?: string; // Optional: subscribe to specific agent updates
//   events: QueueEventType[];
// }

// export interface QueueUpdate {
//   jobId: string;
//   event: QueueEventType;
//   data: QueueState;
//   timestamp: Date;
// }

// // Error Handling
// export interface QueueError {
//   code: QueueErrorCode;
//   message: string;
//   details?: Record<string, any>;
// }

// export enum QueueErrorCode {
//   QUEUE_NOT_FOUND = 'QUEUE_NOT_FOUND',
//   QUEUE_FULL = 'QUEUE_FULL',
//   ALREADY_IN_QUEUE = 'ALREADY_IN_QUEUE',
//   NOT_IN_QUEUE = 'NOT_IN_QUEUE',
//   INVALID_POSITION = 'INVALID_POSITION',
//   TIME_SLOT_EXPIRED = 'TIME_SLOT_EXPIRED',
//   AGENT_NOT_ELIGIBLE = 'AGENT_NOT_ELIGIBLE',
//   JOB_NOT_AVAILABLE = 'JOB_NOT_AVAILABLE',
//   QUEUE_CLOSED = 'QUEUE_CLOSED',
//   INVALID_OPERATION = 'INVALID_OPERATION',
// }

// // Export all types
// export type {
//   QueueEntryData,
//   QueueEntryMetadata,
//   QueueState,
//   JoinQueueRequest,
//   LeaveQueueRequest,
//   QueuePositionResponse,
//   MoveToNextInQueueRequest,
//   QueueProgressionResult,
//   QueueNotificationData,
//   QueueStatistics,
//   AgentQueueHistory,
//   QueueFilters,
//   QueueSortOptions,
//   TimeSlotInfo,
//   TimeSlotExtensionRequest,
//   TimeSlotExtensionResponse,
//   QueueCapacityInfo,
//   QueueLimits,
//   QueueValidation,
//   ValidateQueueJoinRequest,
//   QueueEvent,
//   BatchQueueOperation,
//   BatchQueueOperationResult,
//   QueueAnalytics,
//   QueueUpdateSubscription,
//   QueueUpdate,
//   QueueError,
// };