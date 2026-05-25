import { MarkingJobStatus } from '@newcondo/db';
export interface QueueItemManagement {
    id: string;
    userId: string;
    propertyId: string;
    markingJobId: string;
    position: number;
    assignedAt: Date | null;
    timeSlotExpiry: Date | null;
    createdAt: Date;
}
interface QueueStats {
    totalInQueue: number;
    activeAssignments: number;
    completedToday: number;
    averageCompletionTime: number;
    currentPosition: number | null;
}
export interface QueueTimeSlotConfig {
    durationMinutes: number;
    bufferMinutes: number;
    maxConcurrentAssignments: number;
}
/**
 * Add a marking job to the queue
 */
export declare function addToQueue(markingJobId: string, userId: string, propertyId: string): Promise<QueueItemManagement>;
/**
 * Get next available item from queue
 */
export declare function getNextInQueue(markingJobId: string): Promise<QueueItemManagement | null>;
/**
 * Assign time slot to agent
 */
export declare function assignTimeSlot(markingJobId: string, agentId: string, config?: QueueTimeSlotConfig): Promise<{
    success: boolean;
    timeSlotExpiry: Date | null;
    message: string;
}>;
/**
 * Release expired time slots
 */
export declare function releaseExpiredTimeSlots(): Promise<number>;
/**
 * Move to next in queue after completion or failure
 */
export declare function moveToNextInQueue(propertyId: string): Promise<QueueItemManagement | null>;
/**
 * Remove from queue
 */
export declare function removeFromQueue(markingJobId: string): Promise<boolean>;
/**
 * Get queue statistics for a property
 */
export declare function getQueueStats(propertyId: string, userId?: string): Promise<QueueStats>;
/**
 * Clear entire queue for a property (admin action)
 */
export declare function clearQueue(propertyId: string): Promise<number>;
/**
 * Reorder queue positions after manual intervention
 */
export declare function reorderQueue(propertyId: string): Promise<void>;
/**
 * Get agent's current queue assignments
 */
export declare function getAgentQueueAssignments(agentId: string): Promise<Array<{
    markingJobId: string;
    propertyId: string;
    position: number;
    timeSlotExpiry: Date | null;
    status: MarkingJobStatus;
}>>;
export {};
//# sourceMappingURL=queueManagement.d.ts.map