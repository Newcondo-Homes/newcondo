/**
 * Time Slot Management Constants
 * Manages time slots for property marking jobs with automatic rotation
 */
export declare const TIME_SLOT_CONSTANTS: {
    readonly SLOT_DURATION_HOURS: 3;
    readonly SLOT_DURATION_MINUTES: 180;
    readonly SLOT_DURATION_MS: number;
    readonly MAX_JOB_COMPLETION_DAYS: 3;
    readonly MAX_JOB_COMPLETION_MS: number;
    readonly OWNER_CONFIRMATION_DAYS: 3;
    readonly OWNER_CONFIRMATION_MS: number;
    readonly AGENT_PARTIAL_COMPENSATION_NGN: 1000;
    readonly MAX_COMPENSATION_ATTEMPTS: 3;
    readonly COMPENSATION_RETRY_INTERVAL_MS: number;
    readonly SLOT_STATUS: {
        readonly AVAILABLE: "AVAILABLE";
        readonly ASSIGNED: "ASSIGNED";
        readonly IN_PROGRESS: "IN_PROGRESS";
        readonly COMPLETED: "COMPLETED";
        readonly EXPIRED: "EXPIRED";
        readonly CANCELLED: "CANCELLED";
    };
    readonly ROTATION_CHECK_INTERVAL_MS: number;
    readonly ROTATION_TIMEOUT_BUFFER_MS: number;
    readonly MAX_SLOTS_PER_PROPERTY: 5;
    readonly GRACE_PERIOD_BEFORE_EXPIRY_MS: number;
    readonly NOTIFICATION_TIMING: {
        readonly IMMEDIATE: 0;
        readonly BEFORE_30_MINUTES: number;
        readonly BEFORE_1_HOUR: number;
        readonly BEFORE_2_HOURS: number;
    };
    readonly AGENT_RESCHEDULE_ALLOWED: true;
    readonly MAX_RESCHEDULES_PER_JOB: 2;
    readonly RESCHEDULE_MIN_NOTICE_HOURS: 1;
    readonly ESCALATION_LEVELS: {
        readonly LEVEL_1: {
            readonly retries: 2;
            readonly escalateToAdmin: false;
            readonly description: "First two rotations with available agents";
        };
        readonly LEVEL_2: {
            readonly retries: 1;
            readonly escalateToAdmin: false;
            readonly description: "Third rotation with top-rated agents only";
        };
        readonly LEVEL_3: {
            readonly retries: 0;
            readonly escalateToAdmin: true;
            readonly description: "Escalate to admin if no agent accepts";
        };
    };
    readonly ADMIN_MARKING_FEE_NGN: 25000;
    readonly ADMIN_COMPENSATION_TO_AGENT_NGN: 5000;
    readonly ANALYTICS_TRACKING: {
        readonly TRACK_SLOT_ACCEPTANCE_RATE: true;
        readonly TRACK_SLOT_COMPLETION_RATE: true;
        readonly TRACK_AGENT_RESPONSE_TIME: true;
        readonly TRACK_AVERAGE_SLOT_DURATION: true;
    };
    readonly ERROR_MESSAGES: {
        readonly SLOT_EXPIRED: "Time slot has expired";
        readonly NO_AVAILABLE_SLOTS: "No available time slots";
        readonly AGENT_SLOT_CONFLICT: "Agent already has an active slot";
        readonly INVALID_SLOT_TIME: "Invalid time slot duration";
        readonly SLOT_NOT_FOUND: "Time slot not found";
        readonly RESCHEDULE_NOT_ALLOWED: "Rescheduling not allowed for this slot";
        readonly INSUFFICIENT_NOTICE_FOR_RESCHEDULE: "Insufficient notice for rescheduling";
    };
};
export type SlotStatus = typeof TIME_SLOT_CONSTANTS.SLOT_STATUS[keyof typeof TIME_SLOT_CONSTANTS.SLOT_STATUS];
export type EscalationLevel = keyof typeof TIME_SLOT_CONSTANTS.ESCALATION_LEVELS;
//# sourceMappingURL=timeSlots.d.ts.map