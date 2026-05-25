/**
 * Queue Management Constants
 * Handles all queue-related configurations for property marking service
 */
export declare const QUEUE_CONSTANTS: {
    readonly TIME_SLOT_DURATION_HOURS: 3;
    readonly TIME_SLOT_DURATION_MS: number;
    readonly PROPERTY_OWNER_CONFIRMATION_DAYS: 3;
    readonly PROPERTY_OWNER_CONFIRMATION_MS: number;
    readonly MAX_QUEUE_POSITION: 1000;
    readonly QUEUE_CHECK_INTERVAL_MS: number;
    readonly AGENT_COMPENSATION_FOR_EXPIRED_SLOT: 1000;
    readonly MAX_COMPENSATION_ITERATIONS: 3;
    readonly SERVICE_AREA_RADIUS_KM: 15;
    readonly QUEUE_PRIORITY: {
        readonly URGENT: 1;
        readonly HIGH: 2;
        readonly NORMAL: 3;
        readonly LOW: 4;
    };
    readonly NOTIFICATION_RETRY_ATTEMPTS: 3;
    readonly NOTIFICATION_RETRY_DELAY_MS: number;
    readonly AGENT_RELIABILITY_SCORE: {
        readonly EXCELLENT: 4.5;
        readonly GOOD: 3.5;
        readonly AVERAGE: 2.5;
        readonly POOR: 0;
    };
    readonly AUTO_ROTATION_TRIGGER_MS: number;
    readonly AUTO_ROTATION_CHECK_INTERVAL_MS: number;
    readonly QUEUE_STATUS: {
        readonly WAITING: "WAITING";
        readonly ASSIGNED: "ASSIGNED";
        readonly IN_PROGRESS: "IN_PROGRESS";
        readonly COMPLETED: "COMPLETED";
        readonly CANCELLED: "CANCELLED";
        readonly EXPIRED: "EXPIRED";
    };
    readonly ERROR_MESSAGES: {
        readonly QUEUE_FULL: "Queue is at maximum capacity";
        readonly INVALID_POSITION: "Invalid queue position";
        readonly AGENT_NOT_AVAILABLE: "Agent is not available for marking";
        readonly EXPIRED_TIME_SLOT: "Time slot has expired";
        readonly PROPERTY_NOT_FOUND: "Property not found in queue";
        readonly ALREADY_IN_QUEUE: "Agent already in queue for this property";
        readonly NO_AGENTS_AVAILABLE: "No agents available in service area";
    };
};
export type QueueStatus = typeof QUEUE_CONSTANTS.QUEUE_STATUS[keyof typeof QUEUE_CONSTANTS.QUEUE_STATUS];
export type QueuePriority = typeof QUEUE_CONSTANTS.QUEUE_PRIORITY[keyof typeof QUEUE_CONSTANTS.QUEUE_PRIORITY];
//# sourceMappingURL=queue.d.ts.map