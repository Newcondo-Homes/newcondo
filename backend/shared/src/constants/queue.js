"use strict";
/**
 * Queue Management Constants
 * Handles all queue-related configurations for property marking service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUE_CONSTANTS = void 0;
exports.QUEUE_CONSTANTS = {
    // Time slot management
    TIME_SLOT_DURATION_HOURS: 3, // 3-hour window for agents to mark property
    TIME_SLOT_DURATION_MS: 3 * 60 * 60 * 1000, // 3 hours in milliseconds
    // Property owner confirmation window
    PROPERTY_OWNER_CONFIRMATION_DAYS: 3, // 3 days to confirm marked property
    PROPERTY_OWNER_CONFIRMATION_MS: 3 * 24 * 60 * 60 * 1000, // 3 days in milliseconds
    // Queue position and status
    MAX_QUEUE_POSITION: 1000, // Maximum positions to track in queue
    QUEUE_CHECK_INTERVAL_MS: 60 * 1000, // Check queue every 1 minute
    // Agent compensation for expired slots
    AGENT_COMPENSATION_FOR_EXPIRED_SLOT: 1000, // 1000 NGN - partial compensation
    MAX_COMPENSATION_ITERATIONS: 3, // Maximum times agent can be compensated before requiring new job
    // Service area radius for agent assignment
    SERVICE_AREA_RADIUS_KM: 15, // Agents within 15km radius get notified
    // Queue assignment priorities
    QUEUE_PRIORITY: {
        URGENT: 1,
        HIGH: 2,
        NORMAL: 3,
        LOW: 4,
    },
    // Notification retry logic
    NOTIFICATION_RETRY_ATTEMPTS: 3,
    NOTIFICATION_RETRY_DELAY_MS: 5 * 60 * 1000, // 5 minutes between retries
    // Agent reliability thresholds
    AGENT_RELIABILITY_SCORE: {
        EXCELLENT: 4.5, // 4.5 - 5.0
        GOOD: 3.5, // 3.5 - 4.4
        AVERAGE: 2.5, // 2.5 - 3.4
        POOR: 0, // Below 2.5
    },
    // Auto-rotation triggers
    AUTO_ROTATION_TRIGGER_MS: 3 * 60 * 60 * 1000, // Rotate after 3 hours
    AUTO_ROTATION_CHECK_INTERVAL_MS: 5 * 60 * 1000, // Check every 5 minutes
    // Queue status types
    QUEUE_STATUS: {
        WAITING: 'WAITING',
        ASSIGNED: 'ASSIGNED',
        IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED',
        EXPIRED: 'EXPIRED',
    },
    // Error messages
    ERROR_MESSAGES: {
        QUEUE_FULL: 'Queue is at maximum capacity',
        INVALID_POSITION: 'Invalid queue position',
        AGENT_NOT_AVAILABLE: 'Agent is not available for marking',
        EXPIRED_TIME_SLOT: 'Time slot has expired',
        PROPERTY_NOT_FOUND: 'Property not found in queue',
        ALREADY_IN_QUEUE: 'Agent already in queue for this property',
        NO_AGENTS_AVAILABLE: 'No agents available in service area',
    },
};
//# sourceMappingURL=queue.js.map