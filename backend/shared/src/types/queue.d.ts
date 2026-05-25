/**
 * File: backend/shared/src/types/queue.ts
 * Shared queue types for Property Marking Service
 */
import { UrgencyLevel } from '@newcondo/db';
/**
 * Queue position information for an agent
 */
export interface QueuePosition {
    agentId: string;
    position: number;
    estimatedWaitTime: number;
    joinedAt: Date;
    expiresAt: Date;
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
    maxCompletionTime: Date;
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
    timeSlotEnd: Date;
    status: AgentQueueStatus;
    partialPaymentAmount?: number;
    partialPaymentReleased: boolean;
}
/**
 * Agent queue status
 */
export declare enum AgentQueueStatus {
    WAITING = "WAITING",// In queue, waiting for turn
    ACTIVE = "ACTIVE",// Currently has the 3-hour time slot
    COMPLETED = "COMPLETED",// Successfully marked the property
    EXPIRED = "EXPIRED",// Time slot expired without completion
    SKIPPED = "SKIPPED",// Moved to next agent
    CANCELLED = "CANCELLED"
}
/**
 * Queue statistics
 */
export interface QueueStats {
    totalJobsInQueue: number;
    totalActiveJobs: number;
    totalWaitingAgents: number;
    averageWaitTime: number;
    averageCompletionTime: number;
    successRate: number;
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
export declare enum QueueNotificationType {
    JOB_AVAILABLE = "JOB_AVAILABLE",// New job broadcast to eligible agents
    POSITION_ASSIGNED = "POSITION_ASSIGNED",// Agent added to queue
    TURN_APPROACHING = "TURN_APPROACHING",// Next in queue (15 min warning)
    TIME_SLOT_STARTED = "TIME_SLOT_STARTED",// 3-hour window started
    TIME_SLOT_EXPIRING = "TIME_SLOT_EXPIRING",// 30 min warning
    TIME_SLOT_EXPIRED = "TIME_SLOT_EXPIRED",// Time slot ended
    JOB_COMPLETED = "JOB_COMPLETED",// Job marked by another agent
    JOB_CANCELLED = "JOB_CANCELLED",// Job cancelled by owner
    PARTIAL_PAYMENT_RELEASED = "PARTIAL_PAYMENT_RELEASED",// 1000 naira released
    FULL_PAYMENT_RELEASED = "FULL_PAYMENT_RELEASED"
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
export declare enum RotationReason {
    TIME_EXPIRED = "TIME_EXPIRED",// 3-hour time slot expired
    AGENT_DECLINED = "AGENT_DECLINED",// Agent declined the job
    AGENT_UNAVAILABLE = "AGENT_UNAVAILABLE",// Agent became unavailable
    MANUAL_ROTATION = "MANUAL_ROTATION"
}
/**
 * Time slot configuration
 */
export interface TimeSlotConfig {
    duration: number;
    warningThreshold: number;
    approachingThreshold: number;
    maxRotations: number;
    partialPaymentAmount: number;
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
    distanceFromProperty: number;
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
    performedBy: string;
    reason?: string;
    timestamp: Date;
}
/**
 * Queue actions
 */
export declare enum QueueAction {
    ADD_AGENT = "ADD_AGENT",
    REMOVE_AGENT = "REMOVE_AGENT",
    ROTATE_QUEUE = "ROTATE_QUEUE",
    CANCEL_JOB = "CANCEL_JOB",
    EXTEND_TIME_SLOT = "EXTEND_TIME_SLOT",
    MANUAL_ASSIGNMENT = "MANUAL_ASSIGNMENT"
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
    confirmationDeadline: Date;
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
    averageTimeSlotUtilization: number;
    completionTime: number;
    firstResponseTime: number;
    successfulCompletionRate: number;
}
declare const _default: {
    AgentQueueStatus: typeof AgentQueueStatus;
    QueueNotificationType: typeof QueueNotificationType;
    RotationReason: typeof RotationReason;
    QueueAction: typeof QueueAction;
};
export default _default;
//# sourceMappingURL=queue.d.ts.map