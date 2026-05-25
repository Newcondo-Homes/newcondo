/**
 * Marking Job Constants
 * Central location for all marking-related constants
 */
export declare const MARKING_FEES: {
    readonly SELF: 0;
    readonly NEWCONDO: 25000;
    readonly KNOWN_PERSON: 0;
    readonly AGENT: 20000;
};
export declare const COMMISSION: {
    readonly AGENT_PERCENTAGE: 0.25;
    readonly AGENT_AMOUNT: 5000;
    readonly PLATFORM_PERCENTAGE: 0.75;
    readonly PLATFORM_AMOUNT: 15000;
};
export declare const PARTIAL_PAYMENT: {
    readonly INITIAL_AMOUNT: 1000;
    readonly REMAINING_AMOUNT: 4000;
    readonly INCREMENT_AMOUNT: 1000;
    readonly MAX_CYCLES: 4;
};
export declare const TIME_LIMITS: {
    readonly TIME_SLOT_HOURS: 3;
    readonly TIME_SLOT_MINUTES: 180;
    readonly TIME_SLOT_MILLISECONDS: 10800000;
    readonly MAX_COMPLETION_DAYS: 3;
    readonly CONFIRMATION_WINDOW_DAYS: 2;
    readonly CONFIRMATION_WINDOW_HOURS: 48;
    readonly TIME_SLOT_EXPIRY_WARNING_MINUTES: 30;
    readonly CONFIRMATION_REMINDER_HOURS: 24;
};
export declare const QUEUE_CONFIG: {
    readonly MAX_QUEUE_SIZE: 50;
    readonly MIN_RELIABILITY_SCORE: 3;
    readonly MAX_DISTANCE_KM: 50;
    readonly PRIORITY_WEIGHT_DISTANCE: 0.3;
    readonly PRIORITY_WEIGHT_RELIABILITY: 0.4;
    readonly PRIORITY_WEIGHT_TIME: 0.3;
};
export declare const IMAGE_REQUIREMENTS: {
    readonly MIN_COMPLETION_IMAGES: 3;
    readonly MAX_COMPLETION_IMAGES: 10;
    readonly MIN_PROPERTY_IMAGES: 1;
    readonly MAX_PROPERTY_IMAGES: 5;
    readonly SUPPORTED_FORMATS: readonly ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    readonly MAX_FILE_SIZE_MB: 5;
    readonly MAX_FILE_SIZE_BYTES: 5242880;
};
export declare const BOUNDARY_REQUIREMENTS: {
    readonly MIN_COORDINATES: 3;
    readonly MAX_COORDINATES: 100;
    readonly MIN_AREA_SQM: 10;
    readonly MAX_AREA_SQM: 10000;
    readonly COORDINATE_PRECISION: 6;
};
export declare const MARKING_STATUSES: {
    readonly QUEUED: "QUEUED";
    readonly ASSIGNED: "ASSIGNED";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly COMPLETED: "COMPLETED";
    readonly CANCELLED: "CANCELLED";
    readonly EXPIRED: "EXPIRED";
};
export declare const PAYMENT_STATUSES: {
    readonly PENDING: "PENDING";
    readonly SUCCESS: "SUCCESS";
    readonly FAILED: "FAILED";
    readonly CANCELLED: "CANCELLED";
    readonly REFUNDED: "REFUNDED";
    readonly HELD: "HELD";
    readonly RELEASED: "RELEASED";
};
export declare const QUEUE_ENTRY_STATUSES: {
    readonly WAITING: "WAITING";
    readonly ACTIVE: "ACTIVE";
    readonly EXPIRED: "EXPIRED";
    readonly COMPLETED: "COMPLETED";
    readonly REMOVED: "REMOVED";
};
export declare const URGENCY_LEVELS: {
    readonly LOW: "LOW";
    readonly NORMAL: "NORMAL";
    readonly HIGH: "HIGH";
    readonly URGENT: "URGENT";
};
export declare const URGENCY_PRIORITY_SCORES: {
    readonly URGENT: 1000;
    readonly HIGH: 500;
    readonly NORMAL: 100;
    readonly LOW: 50;
};
export declare const MARKING_NOTIFICATION_TRIGGERS: {
    readonly JOB_CREATED: "JOB_CREATED";
    readonly JOB_ASSIGNED: "JOB_ASSIGNED";
    readonly JOB_AVAILABLE: "JOB_AVAILABLE";
    readonly JOB_COMPLETED: "JOB_COMPLETED";
    readonly JOB_CONFIRMED: "JOB_CONFIRMED";
    readonly JOB_REJECTED: "JOB_REJECTED";
    readonly TIME_SLOT_EXPIRING: "TIME_SLOT_EXPIRING";
    readonly CONFIRMATION_REMINDER: "CONFIRMATION_REMINDER";
    readonly QUEUE_JOINED: "QUEUE_JOINED";
    readonly QUEUE_YOUR_TURN: "QUEUE_YOUR_TURN";
    readonly PARTIAL_PAYMENT: "PARTIAL_PAYMENT";
    readonly FULL_PAYMENT: "FULL_PAYMENT";
};
export declare const SHAREABLE_LINK: {
    readonly TOKEN_LENGTH: 32;
    readonly EXPIRY_HOURS: 72;
    readonly EXPIRY_DAYS: 3;
    readonly MAX_USES: 1;
    readonly BASE_PATH: "/mark-property";
};
export declare const VALIDATION_MESSAGES: {
    readonly MISSING_CONTACT_PERSON: "Contact person name is required";
    readonly MISSING_CONTACT_PHONE: "Contact person phone is required";
    readonly INVALID_PHONE_FORMAT: "Invalid phone number format";
    readonly MISSING_COMPLETION_IMAGES: "Completion images are required";
    readonly INSUFFICIENT_IMAGES: "At least 3 completion images required";
    readonly MISSING_BOUNDARY_DATA: "Boundary data is required";
    readonly INVALID_BOUNDARY_COORDINATES: "Invalid boundary coordinates";
    readonly INSUFFICIENT_COORDINATES: "At least 3 coordinates required";
    readonly TIME_SLOT_EXPIRED: "Your time slot has expired";
    readonly JOB_ALREADY_COMPLETED: "This marking job is already completed";
    readonly JOB_ALREADY_ASSIGNED: "This job is already assigned to another agent";
    readonly AGENT_NOT_AVAILABLE: "Agent is not available for marking jobs";
    readonly QUEUE_FULL: "The queue for this job is full";
    readonly ALREADY_IN_QUEUE: "You are already in the queue for this job";
    readonly NOT_IN_QUEUE: "You are not in the queue for this job";
    readonly PAYMENT_REQUIRED: "Payment is required before proceeding";
    readonly CONFIRMATION_DEADLINE_PASSED: "Confirmation deadline has passed";
    readonly UNAUTHORIZED_ACCESS: "You are not authorized to access this marking job";
};
export declare const MARKING_ERROR_CODES: {
    readonly JOB_NOT_FOUND: "MARKING_JOB_NOT_FOUND";
    readonly JOB_ALREADY_ASSIGNED: "MARKING_JOB_ALREADY_ASSIGNED";
    readonly JOB_ALREADY_COMPLETED: "MARKING_JOB_ALREADY_COMPLETED";
    readonly AGENT_NOT_AVAILABLE: "AGENT_NOT_AVAILABLE";
    readonly TIME_SLOT_EXPIRED: "TIME_SLOT_EXPIRED";
    readonly INVALID_COMPLETION_DATA: "INVALID_COMPLETION_DATA";
    readonly PAYMENT_REQUIRED: "PAYMENT_REQUIRED";
    readonly PAYMENT_FAILED: "PAYMENT_FAILED";
    readonly QUEUE_FULL: "QUEUE_FULL";
    readonly ALREADY_IN_QUEUE: "ALREADY_IN_QUEUE";
    readonly NOT_IN_QUEUE: "NOT_IN_QUEUE";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly CONFIRMATION_DEADLINE_PASSED: "CONFIRMATION_DEADLINE_PASSED";
    readonly SHAREABLE_LINK_EXPIRED: "SHAREABLE_LINK_EXPIRED";
    readonly SHAREABLE_LINK_ALREADY_USED: "SHAREABLE_LINK_ALREADY_USED";
};
export declare const RATE_LIMITS: {
    readonly CREATE_JOB: {
        readonly MAX_REQUESTS: 5;
        readonly WINDOW_MINUTES: 60;
    };
    readonly JOIN_QUEUE: {
        readonly MAX_REQUESTS: 10;
        readonly WINDOW_MINUTES: 60;
    };
    readonly COMPLETE_JOB: {
        readonly MAX_REQUESTS: 3;
        readonly WINDOW_MINUTES: 60;
    };
    readonly UPLOAD_IMAGE: {
        readonly MAX_REQUESTS: 20;
        readonly WINDOW_MINUTES: 60;
    };
};
export declare const AGENT_PERFORMANCE: {
    readonly MIN_RELIABILITY_SCORE: 0;
    readonly MAX_RELIABILITY_SCORE: 5;
    readonly GOOD_RELIABILITY_THRESHOLD: 4;
    readonly EXCELLENT_RELIABILITY_THRESHOLD: 4.5;
    readonly CANCELLATION_PENALTY: 0.5;
    readonly COMPLETION_REWARD: 0.1;
    readonly EXPIRY_PENALTY: 0.3;
    readonly MAX_CANCELLATIONS_BEFORE_SUSPENSION: 3;
    readonly SUSPENSION_DURATION_DAYS: 7;
};
export declare const DISTANCE: {
    readonly EARTH_RADIUS_KM: 6371;
    readonly NEARBY_THRESHOLD_KM: 10;
    readonly LOCAL_THRESHOLD_KM: 25;
    readonly REGIONAL_THRESHOLD_KM: 50;
};
export declare const CURRENCY: {
    readonly DEFAULT: "NGN";
    readonly SYMBOL: "₦";
    readonly CODE: "NGN";
    readonly NAME: "Nigerian Naira";
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
    readonly MIN_LIMIT: 1;
};
export declare const CACHE: {
    readonly QUEUE_STATE_TTL_SECONDS: 30;
    readonly JOB_DETAILS_TTL_SECONDS: 300;
    readonly AGENT_LOCATION_TTL_SECONDS: 600;
    readonly STATS_TTL_SECONDS: 1800;
};
export declare const LOCATION_ACCURACY: {
    readonly HIGH: "HIGH";
    readonly MEDIUM: "MEDIUM";
    readonly LOW: "LOW";
    readonly MIN_ACCURACY_METERS: 50;
    readonly PREFERRED_ACCURACY_METERS: 10;
};
export declare const JOB_METADATA: {
    readonly MAX_ACCESS_INSTRUCTIONS_LENGTH: 500;
    readonly MAX_COMPLETION_NOTES_LENGTH: 1000;
    readonly MAX_REJECTION_REASON_LENGTH: 500;
};
export declare const CONFIRMATION_CYCLES: {
    readonly MAX_UNCONFIRMED_CYCLES: 4;
    readonly TOTAL_CYCLES_TO_DEPLETE_FEE: 4;
    readonly CYCLE_PAYMENT: 1000;
};
export declare const AGENT_ELIGIBILITY: {
    readonly MIN_COMPLETED_VERIFICATIONS: 1;
    readonly MIN_ACCOUNT_AGE_DAYS: 7;
    readonly REQUIRES_PREMIUM_FOR_RENTERS: true;
    readonly BLOCKED_AFTER_CANCELLATIONS: 3;
};
export declare const WEBHOOK: {
    readonly MAX_RETRY_ATTEMPTS: 3;
    readonly RETRY_DELAY_SECONDS: 60;
    readonly TIMEOUT_SECONDS: 30;
};
export declare const UPLOAD: {
    readonly ALLOWED_IMAGE_TYPES: readonly ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    readonly MAX_IMAGE_SIZE_MB: 5;
    readonly MAX_IMAGE_SIZE_BYTES: number;
    readonly IMAGE_QUALITY: 0.85;
    readonly THUMBNAIL_WIDTH: 300;
    readonly THUMBNAIL_HEIGHT: 300;
};
export declare const ANALYTICS_PERIODS: {
    readonly DAILY: "DAILY";
    readonly WEEKLY: "WEEKLY";
    readonly MONTHLY: "MONTHLY";
    readonly YEARLY: "YEARLY";
    readonly CUSTOM: "CUSTOM";
};
export declare const REALTIME: {
    readonly QUEUE_UPDATE_INTERVAL_MS: 5000;
    readonly TIME_SLOT_CHECK_INTERVAL_MS: 60000;
    readonly LOCATION_UPDATE_INTERVAL_MS: 300000;
};
export declare const SUCCESS_MESSAGES: {
    readonly JOB_CREATED: "Marking job created successfully";
    readonly JOB_ASSIGNED: "Job assigned to agent successfully";
    readonly JOB_COMPLETED: "Marking job completed successfully";
    readonly JOB_CONFIRMED: "Marking job confirmed successfully";
    readonly JOINED_QUEUE: "Successfully joined the queue";
    readonly LEFT_QUEUE: "Successfully left the queue";
    readonly PAYMENT_SUCCESS: "Payment processed successfully";
    readonly SHAREABLE_LINK_CREATED: "Shareable link created successfully";
};
export declare const ADMIN: {
    readonly NEWCONDO_ADMIN_COMMISSION: 25000;
    readonly MANUAL_ASSIGNMENT_ALLOWED: true;
    readonly CAN_OVERRIDE_QUEUE: true;
    readonly CAN_EXTEND_TIME_SLOTS: true;
    readonly MAX_TIME_SLOT_EXTENSION_HOURS: 2;
};
export declare const FEATURES: {
    readonly ENABLE_QUEUE_SYSTEM: true;
    readonly ENABLE_PARTIAL_PAYMENTS: true;
    readonly ENABLE_SHAREABLE_LINKS: true;
    readonly ENABLE_REAL_TIME_UPDATES: true;
    readonly ENABLE_LOCATION_TRACKING: true;
    readonly ENABLE_AGENT_RATINGS: true;
    readonly ENABLE_AUTOMATIC_REASSIGNMENT: true;
    readonly ENABLE_CONFIRMATION_REMINDERS: true;
};
export declare const DB_LIMITS: {
    readonly VARCHAR_SHORT: 255;
    readonly VARCHAR_MEDIUM: 500;
    readonly VARCHAR_LONG: 1000;
    readonly TEXT: 5000;
};
export declare const MARKING_COORDINATES: {
    readonly MIN_LATITUDE: -90;
    readonly MAX_LATITUDE: 90;
    readonly MIN_LONGITUDE: -180;
    readonly MAX_LONGITUDE: 180;
    readonly NIGERIA_BOUNDS: {
        readonly MIN_LAT: 4;
        readonly MAX_LAT: 14;
        readonly MIN_LNG: 2.5;
        readonly MAX_LNG: 15;
    };
};
export declare const PHONE: {
    readonly NIGERIA_COUNTRY_CODE: "+234";
    readonly MIN_LENGTH: 10;
    readonly MAX_LENGTH: 15;
    readonly PATTERN: RegExp;
};
export declare const EMAIL: {
    readonly PATTERN: RegExp;
    readonly MAX_LENGTH: 255;
};
export declare const LOGGING: {
    readonly LOG_LEVEL: string;
    readonly LOG_QUEUE_EVENTS: true;
    readonly LOG_PAYMENT_EVENTS: true;
    readonly LOG_NOTIFICATION_EVENTS: true;
    readonly LOG_TIME_SLOT_EVENTS: true;
};
export declare const MARKING_CONSTANTS: {
    readonly FEES: {
        readonly SELF: 0;
        readonly NEWCONDO: 25000;
        readonly KNOWN_PERSON: 0;
        readonly AGENT: 20000;
    };
    readonly COMMISSION: {
        readonly AGENT_PERCENTAGE: 0.25;
        readonly AGENT_AMOUNT: 5000;
        readonly PLATFORM_PERCENTAGE: 0.75;
        readonly PLATFORM_AMOUNT: 15000;
    };
    readonly PARTIAL_PAYMENT: {
        readonly INITIAL_AMOUNT: 1000;
        readonly REMAINING_AMOUNT: 4000;
        readonly INCREMENT_AMOUNT: 1000;
        readonly MAX_CYCLES: 4;
    };
    readonly TIME_LIMITS: {
        readonly TIME_SLOT_HOURS: 3;
        readonly TIME_SLOT_MINUTES: 180;
        readonly TIME_SLOT_MILLISECONDS: 10800000;
        readonly MAX_COMPLETION_DAYS: 3;
        readonly CONFIRMATION_WINDOW_DAYS: 2;
        readonly CONFIRMATION_WINDOW_HOURS: 48;
        readonly TIME_SLOT_EXPIRY_WARNING_MINUTES: 30;
        readonly CONFIRMATION_REMINDER_HOURS: 24;
    };
    readonly QUEUE_CONFIG: {
        readonly MAX_QUEUE_SIZE: 50;
        readonly MIN_RELIABILITY_SCORE: 3;
        readonly MAX_DISTANCE_KM: 50;
        readonly PRIORITY_WEIGHT_DISTANCE: 0.3;
        readonly PRIORITY_WEIGHT_RELIABILITY: 0.4;
        readonly PRIORITY_WEIGHT_TIME: 0.3;
    };
    readonly IMAGE_REQUIREMENTS: {
        readonly MIN_COMPLETION_IMAGES: 3;
        readonly MAX_COMPLETION_IMAGES: 10;
        readonly MIN_PROPERTY_IMAGES: 1;
        readonly MAX_PROPERTY_IMAGES: 5;
        readonly SUPPORTED_FORMATS: readonly ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        readonly MAX_FILE_SIZE_MB: 5;
        readonly MAX_FILE_SIZE_BYTES: 5242880;
    };
    readonly BOUNDARY_REQUIREMENTS: {
        readonly MIN_COORDINATES: 3;
        readonly MAX_COORDINATES: 100;
        readonly MIN_AREA_SQM: 10;
        readonly MAX_AREA_SQM: 10000;
        readonly COORDINATE_PRECISION: 6;
    };
    readonly STATUSES: {
        readonly MARKING: {
            readonly QUEUED: "QUEUED";
            readonly ASSIGNED: "ASSIGNED";
            readonly IN_PROGRESS: "IN_PROGRESS";
            readonly COMPLETED: "COMPLETED";
            readonly CANCELLED: "CANCELLED";
            readonly EXPIRED: "EXPIRED";
        };
        readonly PAYMENT: {
            readonly PENDING: "PENDING";
            readonly SUCCESS: "SUCCESS";
            readonly FAILED: "FAILED";
            readonly CANCELLED: "CANCELLED";
            readonly REFUNDED: "REFUNDED";
            readonly HELD: "HELD";
            readonly RELEASED: "RELEASED";
        };
        readonly QUEUE_ENTRY: {
            readonly WAITING: "WAITING";
            readonly ACTIVE: "ACTIVE";
            readonly EXPIRED: "EXPIRED";
            readonly COMPLETED: "COMPLETED";
            readonly REMOVED: "REMOVED";
        };
    };
    readonly URGENCY: {
        readonly LEVELS: {
            readonly LOW: "LOW";
            readonly NORMAL: "NORMAL";
            readonly HIGH: "HIGH";
            readonly URGENT: "URGENT";
        };
        readonly PRIORITY_SCORES: {
            readonly URGENT: 1000;
            readonly HIGH: 500;
            readonly NORMAL: 100;
            readonly LOW: 50;
        };
    };
    readonly NOTIFICATIONS: {
        readonly JOB_CREATED: "JOB_CREATED";
        readonly JOB_ASSIGNED: "JOB_ASSIGNED";
        readonly JOB_AVAILABLE: "JOB_AVAILABLE";
        readonly JOB_COMPLETED: "JOB_COMPLETED";
        readonly JOB_CONFIRMED: "JOB_CONFIRMED";
        readonly JOB_REJECTED: "JOB_REJECTED";
        readonly TIME_SLOT_EXPIRING: "TIME_SLOT_EXPIRING";
        readonly CONFIRMATION_REMINDER: "CONFIRMATION_REMINDER";
        readonly QUEUE_JOINED: "QUEUE_JOINED";
        readonly QUEUE_YOUR_TURN: "QUEUE_YOUR_TURN";
        readonly PARTIAL_PAYMENT: "PARTIAL_PAYMENT";
        readonly FULL_PAYMENT: "FULL_PAYMENT";
    };
    readonly SHAREABLE_LINK: {
        readonly TOKEN_LENGTH: 32;
        readonly EXPIRY_HOURS: 72;
        readonly EXPIRY_DAYS: 3;
        readonly MAX_USES: 1;
        readonly BASE_PATH: "/mark-property";
    };
    readonly VALIDATION: {
        readonly MISSING_CONTACT_PERSON: "Contact person name is required";
        readonly MISSING_CONTACT_PHONE: "Contact person phone is required";
        readonly INVALID_PHONE_FORMAT: "Invalid phone number format";
        readonly MISSING_COMPLETION_IMAGES: "Completion images are required";
        readonly INSUFFICIENT_IMAGES: "At least 3 completion images required";
        readonly MISSING_BOUNDARY_DATA: "Boundary data is required";
        readonly INVALID_BOUNDARY_COORDINATES: "Invalid boundary coordinates";
        readonly INSUFFICIENT_COORDINATES: "At least 3 coordinates required";
        readonly TIME_SLOT_EXPIRED: "Your time slot has expired";
        readonly JOB_ALREADY_COMPLETED: "This marking job is already completed";
        readonly JOB_ALREADY_ASSIGNED: "This job is already assigned to another agent";
        readonly AGENT_NOT_AVAILABLE: "Agent is not available for marking jobs";
        readonly QUEUE_FULL: "The queue for this job is full";
        readonly ALREADY_IN_QUEUE: "You are already in the queue for this job";
        readonly NOT_IN_QUEUE: "You are not in the queue for this job";
        readonly PAYMENT_REQUIRED: "Payment is required before proceeding";
        readonly CONFIRMATION_DEADLINE_PASSED: "Confirmation deadline has passed";
        readonly UNAUTHORIZED_ACCESS: "You are not authorized to access this marking job";
    };
    readonly ERRORS: {
        readonly JOB_NOT_FOUND: "MARKING_JOB_NOT_FOUND";
        readonly JOB_ALREADY_ASSIGNED: "MARKING_JOB_ALREADY_ASSIGNED";
        readonly JOB_ALREADY_COMPLETED: "MARKING_JOB_ALREADY_COMPLETED";
        readonly AGENT_NOT_AVAILABLE: "AGENT_NOT_AVAILABLE";
        readonly TIME_SLOT_EXPIRED: "TIME_SLOT_EXPIRED";
        readonly INVALID_COMPLETION_DATA: "INVALID_COMPLETION_DATA";
        readonly PAYMENT_REQUIRED: "PAYMENT_REQUIRED";
        readonly PAYMENT_FAILED: "PAYMENT_FAILED";
        readonly QUEUE_FULL: "QUEUE_FULL";
        readonly ALREADY_IN_QUEUE: "ALREADY_IN_QUEUE";
        readonly NOT_IN_QUEUE: "NOT_IN_QUEUE";
        readonly UNAUTHORIZED: "UNAUTHORIZED";
        readonly VALIDATION_ERROR: "VALIDATION_ERROR";
        readonly CONFIRMATION_DEADLINE_PASSED: "CONFIRMATION_DEADLINE_PASSED";
        readonly SHAREABLE_LINK_EXPIRED: "SHAREABLE_LINK_EXPIRED";
        readonly SHAREABLE_LINK_ALREADY_USED: "SHAREABLE_LINK_ALREADY_USED";
    };
    readonly RATE_LIMITS: {
        readonly CREATE_JOB: {
            readonly MAX_REQUESTS: 5;
            readonly WINDOW_MINUTES: 60;
        };
        readonly JOIN_QUEUE: {
            readonly MAX_REQUESTS: 10;
            readonly WINDOW_MINUTES: 60;
        };
        readonly COMPLETE_JOB: {
            readonly MAX_REQUESTS: 3;
            readonly WINDOW_MINUTES: 60;
        };
        readonly UPLOAD_IMAGE: {
            readonly MAX_REQUESTS: 20;
            readonly WINDOW_MINUTES: 60;
        };
    };
    readonly AGENT_PERFORMANCE: {
        readonly MIN_RELIABILITY_SCORE: 0;
        readonly MAX_RELIABILITY_SCORE: 5;
        readonly GOOD_RELIABILITY_THRESHOLD: 4;
        readonly EXCELLENT_RELIABILITY_THRESHOLD: 4.5;
        readonly CANCELLATION_PENALTY: 0.5;
        readonly COMPLETION_REWARD: 0.1;
        readonly EXPIRY_PENALTY: 0.3;
        readonly MAX_CANCELLATIONS_BEFORE_SUSPENSION: 3;
        readonly SUSPENSION_DURATION_DAYS: 7;
    };
    readonly DISTANCE: {
        readonly EARTH_RADIUS_KM: 6371;
        readonly NEARBY_THRESHOLD_KM: 10;
        readonly LOCAL_THRESHOLD_KM: 25;
        readonly REGIONAL_THRESHOLD_KM: 50;
    };
    readonly CURRENCY: {
        readonly DEFAULT: "NGN";
        readonly SYMBOL: "₦";
        readonly CODE: "NGN";
        readonly NAME: "Nigerian Naira";
    };
    readonly PAGINATION: {
        readonly DEFAULT_PAGE: 1;
        readonly DEFAULT_LIMIT: 20;
        readonly MAX_LIMIT: 100;
        readonly MIN_LIMIT: 1;
    };
    readonly CACHE: {
        readonly QUEUE_STATE_TTL_SECONDS: 30;
        readonly JOB_DETAILS_TTL_SECONDS: 300;
        readonly AGENT_LOCATION_TTL_SECONDS: 600;
        readonly STATS_TTL_SECONDS: 1800;
    };
    readonly LOCATION_ACCURACY: {
        readonly HIGH: "HIGH";
        readonly MEDIUM: "MEDIUM";
        readonly LOW: "LOW";
        readonly MIN_ACCURACY_METERS: 50;
        readonly PREFERRED_ACCURACY_METERS: 10;
    };
    readonly JOB_METADATA: {
        readonly MAX_ACCESS_INSTRUCTIONS_LENGTH: 500;
        readonly MAX_COMPLETION_NOTES_LENGTH: 1000;
        readonly MAX_REJECTION_REASON_LENGTH: 500;
    };
    readonly CONFIRMATION_CYCLES: {
        readonly MAX_UNCONFIRMED_CYCLES: 4;
        readonly TOTAL_CYCLES_TO_DEPLETE_FEE: 4;
        readonly CYCLE_PAYMENT: 1000;
    };
    readonly AGENT_ELIGIBILITY: {
        readonly MIN_COMPLETED_VERIFICATIONS: 1;
        readonly MIN_ACCOUNT_AGE_DAYS: 7;
        readonly REQUIRES_PREMIUM_FOR_RENTERS: true;
        readonly BLOCKED_AFTER_CANCELLATIONS: 3;
    };
    readonly WEBHOOK: {
        readonly MAX_RETRY_ATTEMPTS: 3;
        readonly RETRY_DELAY_SECONDS: 60;
        readonly TIMEOUT_SECONDS: 30;
    };
    readonly UPLOAD: {
        readonly ALLOWED_IMAGE_TYPES: readonly ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        readonly MAX_IMAGE_SIZE_MB: 5;
        readonly MAX_IMAGE_SIZE_BYTES: number;
        readonly IMAGE_QUALITY: 0.85;
        readonly THUMBNAIL_WIDTH: 300;
        readonly THUMBNAIL_HEIGHT: 300;
    };
    readonly ANALYTICS_PERIODS: {
        readonly DAILY: "DAILY";
        readonly WEEKLY: "WEEKLY";
        readonly MONTHLY: "MONTHLY";
        readonly YEARLY: "YEARLY";
        readonly CUSTOM: "CUSTOM";
    };
    readonly REALTIME: {
        readonly QUEUE_UPDATE_INTERVAL_MS: 5000;
        readonly TIME_SLOT_CHECK_INTERVAL_MS: 60000;
        readonly LOCATION_UPDATE_INTERVAL_MS: 300000;
    };
    readonly SUCCESS: {
        readonly JOB_CREATED: "Marking job created successfully";
        readonly JOB_ASSIGNED: "Job assigned to agent successfully";
        readonly JOB_COMPLETED: "Marking job completed successfully";
        readonly JOB_CONFIRMED: "Marking job confirmed successfully";
        readonly JOINED_QUEUE: "Successfully joined the queue";
        readonly LEFT_QUEUE: "Successfully left the queue";
        readonly PAYMENT_SUCCESS: "Payment processed successfully";
        readonly SHAREABLE_LINK_CREATED: "Shareable link created successfully";
    };
    readonly ADMIN: {
        readonly NEWCONDO_ADMIN_COMMISSION: 25000;
        readonly MANUAL_ASSIGNMENT_ALLOWED: true;
        readonly CAN_OVERRIDE_QUEUE: true;
        readonly CAN_EXTEND_TIME_SLOTS: true;
        readonly MAX_TIME_SLOT_EXTENSION_HOURS: 2;
    };
    readonly FEATURES: {
        readonly ENABLE_QUEUE_SYSTEM: true;
        readonly ENABLE_PARTIAL_PAYMENTS: true;
        readonly ENABLE_SHAREABLE_LINKS: true;
        readonly ENABLE_REAL_TIME_UPDATES: true;
        readonly ENABLE_LOCATION_TRACKING: true;
        readonly ENABLE_AGENT_RATINGS: true;
        readonly ENABLE_AUTOMATIC_REASSIGNMENT: true;
        readonly ENABLE_CONFIRMATION_REMINDERS: true;
    };
    readonly DB_LIMITS: {
        readonly VARCHAR_SHORT: 255;
        readonly VARCHAR_MEDIUM: 500;
        readonly VARCHAR_LONG: 1000;
        readonly TEXT: 5000;
    };
    readonly MARKING_COORDINATES: {
        readonly MIN_LATITUDE: -90;
        readonly MAX_LATITUDE: 90;
        readonly MIN_LONGITUDE: -180;
        readonly MAX_LONGITUDE: 180;
        readonly NIGERIA_BOUNDS: {
            readonly MIN_LAT: 4;
            readonly MAX_LAT: 14;
            readonly MIN_LNG: 2.5;
            readonly MAX_LNG: 15;
        };
    };
    readonly PHONE: {
        readonly NIGERIA_COUNTRY_CODE: "+234";
        readonly MIN_LENGTH: 10;
        readonly MAX_LENGTH: 15;
        readonly PATTERN: RegExp;
    };
    readonly EMAIL: {
        readonly PATTERN: RegExp;
        readonly MAX_LENGTH: 255;
    };
    readonly LOGGING: {
        readonly LOG_LEVEL: string;
        readonly LOG_QUEUE_EVENTS: true;
        readonly LOG_PAYMENT_EVENTS: true;
        readonly LOG_NOTIFICATION_EVENTS: true;
        readonly LOG_TIME_SLOT_EVENTS: true;
    };
};
export type MarkingStatus = keyof typeof MARKING_STATUSES;
export type PaymentStatus = keyof typeof PAYMENT_STATUSES;
export type QueueEntryStatus = keyof typeof QUEUE_ENTRY_STATUSES;
export type UrgencyLevel = keyof typeof URGENCY_LEVELS;
export type NotificationTrigger = keyof typeof MARKING_NOTIFICATION_TRIGGERS;
export type MarkingErrorCode = keyof typeof MARKING_ERROR_CODES;
export type AnalyticsPeriod = keyof typeof ANALYTICS_PERIODS;
export default MARKING_CONSTANTS;
//# sourceMappingURL=marking.d.ts.map