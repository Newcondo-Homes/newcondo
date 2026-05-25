"use strict";
/**
 * Time Slot Management Constants
 * Manages time slots for property marking jobs with automatic rotation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIME_SLOT_CONSTANTS = void 0;
exports.TIME_SLOT_CONSTANTS = {
    // Individual time slot duration
    SLOT_DURATION_HOURS: 3,
    SLOT_DURATION_MINUTES: 180,
    SLOT_DURATION_MS: 3 * 60 * 60 * 1000,
    // Maximum completion window from job creation
    MAX_JOB_COMPLETION_DAYS: 3,
    MAX_JOB_COMPLETION_MS: 3 * 24 * 60 * 60 * 1000,
    // Property owner confirmation window after agent marks
    OWNER_CONFIRMATION_DAYS: 3,
    OWNER_CONFIRMATION_MS: 3 * 24 * 60 * 60 * 1000,
    // Partial compensation after slot expiry
    AGENT_PARTIAL_COMPENSATION_NGN: 1000,
    // Retry attempts for agent compensation
    MAX_COMPENSATION_ATTEMPTS: 3,
    COMPENSATION_RETRY_INTERVAL_MS: 24 * 60 * 60 * 1000, // 24 hours
    // Slot status tracking
    SLOT_STATUS: {
        AVAILABLE: 'AVAILABLE',
        ASSIGNED: 'ASSIGNED',
        IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'COMPLETED',
        EXPIRED: 'EXPIRED',
        CANCELLED: 'CANCELLED',
    },
    // Rotation triggers
    ROTATION_CHECK_INTERVAL_MS: 5 * 60 * 1000, // Check every 5 minutes
    ROTATION_TIMEOUT_BUFFER_MS: 5 * 60 * 1000, // 5 minute buffer before timeout
    // Multiple slots tracking (for same property if previous agent fails)
    MAX_SLOTS_PER_PROPERTY: 5, // Allow up to 5 rotation rounds
    // Grace period for agent to start marking (warning before slot expiry)
    GRACE_PERIOD_BEFORE_EXPIRY_MS: 30 * 60 * 1000, // 30 minutes warning
    // Slot notification timings
    NOTIFICATION_TIMING: {
        IMMEDIATE: 0, // Send immediately when assigned
        BEFORE_30_MINUTES: 30 * 60 * 1000,
        BEFORE_1_HOUR: 60 * 60 * 1000,
        BEFORE_2_HOURS: 2 * 60 * 60 * 1000,
    },
    // Rescheduling rules
    AGENT_RESCHEDULE_ALLOWED: true,
    MAX_RESCHEDULES_PER_JOB: 2,
    RESCHEDULE_MIN_NOTICE_HOURS: 1, // At least 1 hour notice
    // Escalation rules (if multiple agents fail)
    ESCALATION_LEVELS: {
        LEVEL_1: {
            retries: 2,
            escalateToAdmin: false,
            description: 'First two rotations with available agents',
        },
        LEVEL_2: {
            retries: 1,
            escalateToAdmin: false,
            description: 'Third rotation with top-rated agents only',
        },
        LEVEL_3: {
            retries: 0,
            escalateToAdmin: true,
            description: 'Escalate to admin if no agent accepts',
        },
    },
    // Admin escalation pricing
    ADMIN_MARKING_FEE_NGN: 25000,
    ADMIN_COMPENSATION_TO_AGENT_NGN: 5000, // If admin marks after agent fails
    // Time slot analytics
    ANALYTICS_TRACKING: {
        TRACK_SLOT_ACCEPTANCE_RATE: true,
        TRACK_SLOT_COMPLETION_RATE: true,
        TRACK_AGENT_RESPONSE_TIME: true,
        TRACK_AVERAGE_SLOT_DURATION: true,
    },
    // Error messages
    ERROR_MESSAGES: {
        SLOT_EXPIRED: 'Time slot has expired',
        NO_AVAILABLE_SLOTS: 'No available time slots',
        AGENT_SLOT_CONFLICT: 'Agent already has an active slot',
        INVALID_SLOT_TIME: 'Invalid time slot duration',
        SLOT_NOT_FOUND: 'Time slot not found',
        RESCHEDULE_NOT_ALLOWED: 'Rescheduling not allowed for this slot',
        INSUFFICIENT_NOTICE_FOR_RESCHEDULE: 'Insufficient notice for rescheduling',
    },
};
//# sourceMappingURL=timeSlots.js.map