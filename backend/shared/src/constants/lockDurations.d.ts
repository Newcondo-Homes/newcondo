export declare const LOCK_DURATIONS: {
    readonly PAYMENT_LOCK: number;
    readonly PAYMENT_LOCK_EXTENDED: number;
    readonly QUEUE_TIMEOUT: number;
    readonly QUEUE_PROCESSING_TIMEOUT: number;
    readonly LOCK_RETRY_DELAY: 1000;
    readonly MAX_LOCK_RETRIES: 3;
    readonly EXPIRED_LOCKS_CLEANUP_INTERVAL: number;
    readonly STALE_QUEUE_CLEANUP_INTERVAL: number;
    readonly LOCK_EXPIRY_GRACE_PERIOD: number;
    readonly PAYMENT_COMPLETION_GRACE: number;
};
export declare const LOCK_REASONS: {
    readonly LOCK_ACQUIRED: "Lock successfully acquired";
    readonly LOCK_RELEASED: "Lock successfully released";
    readonly ALREADY_LOCKED: "Property is already locked by another user";
    readonly PROPERTY_UNAVAILABLE: "Property is not available for booking";
    readonly PAYMENT_IN_PROGRESS: "Payment is already in progress for this property";
    readonly ALREADY_RENTED: "Property has already been rented";
    readonly LOCK_EXPIRED: "Lock has expired";
    readonly INVALID_LOCK_ID: "Invalid lock ID provided";
    readonly USER_NOT_AUTHORIZED: "User is not authorized to release this lock";
    readonly MAX_RETRIES_EXCEEDED: "Maximum lock acquisition retries exceeded";
    readonly QUEUE_FULL: "Payment queue is full";
    readonly QUEUE_TIMEOUT: "Queue processing timeout exceeded";
    readonly DUPLICATE_ATTEMPT: "Duplicate payment attempt detected";
    readonly UNIT_UNAVAILABLE: "Selected unit is not available";
    readonly BOUNDARY_CONFLICT: "Property boundary conflict detected";
    readonly SYSTEM_ERROR: "System error occurred during lock operation";
};
export declare const QUEUE_LIMITS: {
    readonly MAX_QUEUE_SIZE: 100;
    readonly MAX_CONCURRENT_LOCKS: 5;
    readonly MAX_DAILY_ATTEMPTS: 10;
};
export declare const AVAILABILITY_CHECK_INTERVALS: {
    readonly REAL_TIME_UPDATE_INTERVAL: number;
    readonly BACKGROUND_SYNC_INTERVAL: number;
    readonly STALE_DATA_THRESHOLD: number;
};
export declare const CONFLICT_DETECTION: {
    readonly BOUNDARY_OVERLAP_THRESHOLD: 0.1;
    readonly DUPLICATE_CHECK_RADIUS: 50;
    readonly GPS_ACCURACY_THRESHOLD: 20;
};
export type LockDurationType = keyof typeof LOCK_DURATIONS;
export type LockReasonType = keyof typeof LOCK_REASONS;
//# sourceMappingURL=lockDurations.d.ts.map