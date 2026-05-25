"use strict";
/**
 * Marking Job Constants
 * Central location for all marking-related constants
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MARKING_CONSTANTS = exports.LOGGING = exports.EMAIL = exports.PHONE = exports.MARKING_COORDINATES = exports.DB_LIMITS = exports.FEATURES = exports.ADMIN = exports.SUCCESS_MESSAGES = exports.REALTIME = exports.ANALYTICS_PERIODS = exports.UPLOAD = exports.WEBHOOK = exports.AGENT_ELIGIBILITY = exports.CONFIRMATION_CYCLES = exports.JOB_METADATA = exports.LOCATION_ACCURACY = exports.CACHE = exports.PAGINATION = exports.CURRENCY = exports.DISTANCE = exports.AGENT_PERFORMANCE = exports.RATE_LIMITS = exports.MARKING_ERROR_CODES = exports.VALIDATION_MESSAGES = exports.SHAREABLE_LINK = exports.MARKING_NOTIFICATION_TRIGGERS = exports.URGENCY_PRIORITY_SCORES = exports.URGENCY_LEVELS = exports.QUEUE_ENTRY_STATUSES = exports.PAYMENT_STATUSES = exports.MARKING_STATUSES = exports.BOUNDARY_REQUIREMENTS = exports.IMAGE_REQUIREMENTS = exports.QUEUE_CONFIG = exports.TIME_LIMITS = exports.PARTIAL_PAYMENT = exports.COMMISSION = exports.MARKING_FEES = void 0;
// Pricing Constants (in Naira)
exports.MARKING_FEES = {
    SELF: 0, // Free if marking themselves
    NEWCONDO: 25000, // Fee for Newcondo admin to mark
    KNOWN_PERSON: 0, // Free if sending someone they know
    AGENT: 20000, // Fee when assigning to agents/renters
};
exports.COMMISSION = {
    AGENT_PERCENTAGE: 0.25, // 25% commission for agents
    AGENT_AMOUNT: 5000, // 25% of 20,000
    PLATFORM_PERCENTAGE: 0.75, // 75% for platform
    PLATFORM_AMOUNT: 15000, // 75% of 20,000
};
exports.PARTIAL_PAYMENT = {
    INITIAL_AMOUNT: 1000, // Initial partial payment to agent
    REMAINING_AMOUNT: 4000, // Remaining amount after initial payment (5000 - 1000)
    INCREMENT_AMOUNT: 1000, // Amount paid per confirmation cycle
    MAX_CYCLES: 4, // Maximum number of partial payment cycles (1000 * 4 = 4000)
};
// Time-related Constants
exports.TIME_LIMITS = {
    TIME_SLOT_HOURS: 3, // Agent has 3 hours to complete marking
    TIME_SLOT_MINUTES: 180, // 3 hours in minutes
    TIME_SLOT_MILLISECONDS: 10800000, // 3 hours in milliseconds
    MAX_COMPLETION_DAYS: 3, // Maximum 3 days from job creation
    CONFIRMATION_WINDOW_DAYS: 2, // Property owner has 2-3 days to confirm
    CONFIRMATION_WINDOW_HOURS: 48, // 2 days in hours
    TIME_SLOT_EXPIRY_WARNING_MINUTES: 30, // Warn agent 30 minutes before expiry
    CONFIRMATION_REMINDER_HOURS: 24, // Remind owner 24 hours before deadline
};
// Queue Constants
exports.QUEUE_CONFIG = {
    MAX_QUEUE_SIZE: 50, // Maximum agents in queue per job
    MIN_RELIABILITY_SCORE: 3.0, // Minimum reliability score to join queue
    MAX_DISTANCE_KM: 50, // Maximum distance from property (km)
    PRIORITY_WEIGHT_DISTANCE: 0.3, // Weight for distance in priority calculation
    PRIORITY_WEIGHT_RELIABILITY: 0.4, // Weight for reliability in priority calculation
    PRIORITY_WEIGHT_TIME: 0.3, // Weight for time waiting in priority calculation
};
// Image Requirements
exports.IMAGE_REQUIREMENTS = {
    MIN_COMPLETION_IMAGES: 3, // Minimum images required for completion
    MAX_COMPLETION_IMAGES: 10, // Maximum images allowed
    MIN_PROPERTY_IMAGES: 1, // Minimum property images for identification
    MAX_PROPERTY_IMAGES: 5, // Maximum property identification images
    SUPPORTED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    MAX_FILE_SIZE_MB: 5, // Maximum file size in MB
    MAX_FILE_SIZE_BYTES: 5242880, // 5MB in bytes
};
// Boundary Requirements
exports.BOUNDARY_REQUIREMENTS = {
    MIN_COORDINATES: 3, // Minimum polygon points
    MAX_COORDINATES: 100, // Maximum polygon points
    MIN_AREA_SQM: 10, // Minimum property area in square meters
    MAX_AREA_SQM: 10000, // Maximum property area in square meters
    COORDINATE_PRECISION: 6, // Decimal places for lat/lng
};
// Status Constants
exports.MARKING_STATUSES = {
    QUEUED: 'QUEUED',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
};
exports.PAYMENT_STATUSES = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
    HELD: 'HELD',
    RELEASED: 'RELEASED',
};
exports.QUEUE_ENTRY_STATUSES = {
    WAITING: 'WAITING',
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
    COMPLETED: 'COMPLETED',
    REMOVED: 'REMOVED',
};
// Urgency Levels
exports.URGENCY_LEVELS = {
    LOW: 'LOW',
    NORMAL: 'NORMAL',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
};
// Urgency Priority Scores
exports.URGENCY_PRIORITY_SCORES = {
    [exports.URGENCY_LEVELS.URGENT]: 1000,
    [exports.URGENCY_LEVELS.HIGH]: 500,
    [exports.URGENCY_LEVELS.NORMAL]: 100,
    [exports.URGENCY_LEVELS.LOW]: 50,
};
// Notification Triggers
exports.MARKING_NOTIFICATION_TRIGGERS = {
    JOB_CREATED: 'JOB_CREATED',
    JOB_ASSIGNED: 'JOB_ASSIGNED',
    JOB_AVAILABLE: 'JOB_AVAILABLE',
    JOB_COMPLETED: 'JOB_COMPLETED',
    JOB_CONFIRMED: 'JOB_CONFIRMED',
    JOB_REJECTED: 'JOB_REJECTED',
    TIME_SLOT_EXPIRING: 'TIME_SLOT_EXPIRING',
    CONFIRMATION_REMINDER: 'CONFIRMATION_REMINDER',
    QUEUE_JOINED: 'QUEUE_JOINED',
    QUEUE_YOUR_TURN: 'QUEUE_YOUR_TURN',
    PARTIAL_PAYMENT: 'PARTIAL_PAYMENT',
    FULL_PAYMENT: 'FULL_PAYMENT',
};
// Shareable Link Constants
exports.SHAREABLE_LINK = {
    TOKEN_LENGTH: 32,
    EXPIRY_HOURS: 72, // Link expires after 3 days
    EXPIRY_DAYS: 3,
    MAX_USES: 1, // Single use only
    BASE_PATH: '/mark-property',
};
// Validation Messages
exports.VALIDATION_MESSAGES = {
    MISSING_CONTACT_PERSON: 'Contact person name is required',
    MISSING_CONTACT_PHONE: 'Contact person phone is required',
    INVALID_PHONE_FORMAT: 'Invalid phone number format',
    MISSING_COMPLETION_IMAGES: 'Completion images are required',
    INSUFFICIENT_IMAGES: `At least ${exports.IMAGE_REQUIREMENTS.MIN_COMPLETION_IMAGES} completion images required`,
    MISSING_BOUNDARY_DATA: 'Boundary data is required',
    INVALID_BOUNDARY_COORDINATES: 'Invalid boundary coordinates',
    INSUFFICIENT_COORDINATES: `At least ${exports.BOUNDARY_REQUIREMENTS.MIN_COORDINATES} coordinates required`,
    TIME_SLOT_EXPIRED: 'Your time slot has expired',
    JOB_ALREADY_COMPLETED: 'This marking job is already completed',
    JOB_ALREADY_ASSIGNED: 'This job is already assigned to another agent',
    AGENT_NOT_AVAILABLE: 'Agent is not available for marking jobs',
    QUEUE_FULL: 'The queue for this job is full',
    ALREADY_IN_QUEUE: 'You are already in the queue for this job',
    NOT_IN_QUEUE: 'You are not in the queue for this job',
    PAYMENT_REQUIRED: 'Payment is required before proceeding',
    CONFIRMATION_DEADLINE_PASSED: 'Confirmation deadline has passed',
    UNAUTHORIZED_ACCESS: 'You are not authorized to access this marking job',
};
// Error Codes
exports.MARKING_ERROR_CODES = {
    JOB_NOT_FOUND: 'MARKING_JOB_NOT_FOUND',
    JOB_ALREADY_ASSIGNED: 'MARKING_JOB_ALREADY_ASSIGNED',
    JOB_ALREADY_COMPLETED: 'MARKING_JOB_ALREADY_COMPLETED',
    AGENT_NOT_AVAILABLE: 'AGENT_NOT_AVAILABLE',
    TIME_SLOT_EXPIRED: 'TIME_SLOT_EXPIRED',
    INVALID_COMPLETION_DATA: 'INVALID_COMPLETION_DATA',
    PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    QUEUE_FULL: 'QUEUE_FULL',
    ALREADY_IN_QUEUE: 'ALREADY_IN_QUEUE',
    NOT_IN_QUEUE: 'NOT_IN_QUEUE',
    UNAUTHORIZED: 'UNAUTHORIZED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    CONFIRMATION_DEADLINE_PASSED: 'CONFIRMATION_DEADLINE_PASSED',
    SHAREABLE_LINK_EXPIRED: 'SHAREABLE_LINK_EXPIRED',
    SHAREABLE_LINK_ALREADY_USED: 'SHAREABLE_LINK_ALREADY_USED',
};
// API Rate Limits
exports.RATE_LIMITS = {
    CREATE_JOB: {
        MAX_REQUESTS: 5,
        WINDOW_MINUTES: 60,
    },
    JOIN_QUEUE: {
        MAX_REQUESTS: 10,
        WINDOW_MINUTES: 60,
    },
    COMPLETE_JOB: {
        MAX_REQUESTS: 3,
        WINDOW_MINUTES: 60,
    },
    UPLOAD_IMAGE: {
        MAX_REQUESTS: 20,
        WINDOW_MINUTES: 60,
    },
};
// Agent Performance Thresholds
exports.AGENT_PERFORMANCE = {
    MIN_RELIABILITY_SCORE: 0.0,
    MAX_RELIABILITY_SCORE: 5.0,
    GOOD_RELIABILITY_THRESHOLD: 4.0,
    EXCELLENT_RELIABILITY_THRESHOLD: 4.5,
    CANCELLATION_PENALTY: 0.5, // Reduce score by 0.5 for cancellations
    COMPLETION_REWARD: 0.1, // Increase score by 0.1 for completions
    EXPIRY_PENALTY: 0.3, // Reduce score by 0.3 for time slot expiries
    MAX_CANCELLATIONS_BEFORE_SUSPENSION: 3,
    SUSPENSION_DURATION_DAYS: 7,
};
// Distance Calculation
exports.DISTANCE = {
    EARTH_RADIUS_KM: 6371,
    NEARBY_THRESHOLD_KM: 10, // Consider "nearby" if within 10km
    LOCAL_THRESHOLD_KM: 25, // Consider "local" if within 25km
    REGIONAL_THRESHOLD_KM: 50, // Consider "regional" if within 50km
};
// Currency
exports.CURRENCY = {
    DEFAULT: 'NGN',
    SYMBOL: '₦',
    CODE: 'NGN',
    NAME: 'Nigerian Naira',
};
// Pagination
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1,
};
// Caching
exports.CACHE = {
    QUEUE_STATE_TTL_SECONDS: 30, // Cache queue state for 30 seconds
    JOB_DETAILS_TTL_SECONDS: 300, // Cache job details for 5 minutes
    AGENT_LOCATION_TTL_SECONDS: 600, // Cache agent location for 10 minutes
    STATS_TTL_SECONDS: 1800, // Cache statistics for 30 minutes
};
// Property Location Accuracy
exports.LOCATION_ACCURACY = {
    HIGH: 'HIGH', // GPS coordinates with high accuracy
    MEDIUM: 'MEDIUM', // Address-based geocoding
    LOW: 'LOW', // City/state level only
    MIN_ACCURACY_METERS: 50, // Minimum acceptable GPS accuracy
    PREFERRED_ACCURACY_METERS: 10, // Preferred GPS accuracy
};
// Marking Job Metadata
exports.JOB_METADATA = {
    MAX_ACCESS_INSTRUCTIONS_LENGTH: 500,
    MAX_COMPLETION_NOTES_LENGTH: 1000,
    MAX_REJECTION_REASON_LENGTH: 500,
};
// Confirmation Cycles
exports.CONFIRMATION_CYCLES = {
    MAX_UNCONFIRMED_CYCLES: 4, // Maximum number of times owner can miss deadline
    TOTAL_CYCLES_TO_DEPLETE_FEE: 4, // Number of cycles to fully pay out the fee
    CYCLE_PAYMENT: exports.PARTIAL_PAYMENT.INCREMENT_AMOUNT, // Payment per cycle
};
// Agent Eligibility
exports.AGENT_ELIGIBILITY = {
    MIN_COMPLETED_VERIFICATIONS: 1, // Must have verified account
    MIN_ACCOUNT_AGE_DAYS: 7, // Account must be at least 7 days old
    REQUIRES_PREMIUM_FOR_RENTERS: true, // Renters must have premium
    BLOCKED_AFTER_CANCELLATIONS: 3, // Block after 3 cancellations
};
// Webhook Configuration
exports.WEBHOOK = {
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY_SECONDS: 60,
    TIMEOUT_SECONDS: 30,
};
// File Upload
exports.UPLOAD = {
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    MAX_IMAGE_SIZE_MB: 5,
    MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024,
    IMAGE_QUALITY: 0.85, // Compression quality
    THUMBNAIL_WIDTH: 300,
    THUMBNAIL_HEIGHT: 300,
};
// Analytics Periods
exports.ANALYTICS_PERIODS = {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY',
    YEARLY: 'YEARLY',
    CUSTOM: 'CUSTOM',
};
// Real-time Updates
exports.REALTIME = {
    QUEUE_UPDATE_INTERVAL_MS: 5000, // Update queue every 5 seconds
    TIME_SLOT_CHECK_INTERVAL_MS: 60000, // Check time slots every minute
    LOCATION_UPDATE_INTERVAL_MS: 300000, // Update location every 5 minutes
};
// Success Messages
exports.SUCCESS_MESSAGES = {
    JOB_CREATED: 'Marking job created successfully',
    JOB_ASSIGNED: 'Job assigned to agent successfully',
    JOB_COMPLETED: 'Marking job completed successfully',
    JOB_CONFIRMED: 'Marking job confirmed successfully',
    JOINED_QUEUE: 'Successfully joined the queue',
    LEFT_QUEUE: 'Successfully left the queue',
    PAYMENT_SUCCESS: 'Payment processed successfully',
    SHAREABLE_LINK_CREATED: 'Shareable link created successfully',
};
// Admin Constants
exports.ADMIN = {
    NEWCONDO_ADMIN_COMMISSION: exports.MARKING_FEES.NEWCONDO, // 25,000 for Newcondo to mark
    MANUAL_ASSIGNMENT_ALLOWED: true,
    CAN_OVERRIDE_QUEUE: true,
    CAN_EXTEND_TIME_SLOTS: true,
    MAX_TIME_SLOT_EXTENSION_HOURS: 2,
};
// Feature Flags
exports.FEATURES = {
    ENABLE_QUEUE_SYSTEM: true,
    ENABLE_PARTIAL_PAYMENTS: true,
    ENABLE_SHAREABLE_LINKS: true,
    ENABLE_REAL_TIME_UPDATES: true,
    ENABLE_LOCATION_TRACKING: true,
    ENABLE_AGENT_RATINGS: true,
    ENABLE_AUTOMATIC_REASSIGNMENT: true,
    ENABLE_CONFIRMATION_REMINDERS: true,
};
// Database Field Limits
exports.DB_LIMITS = {
    VARCHAR_SHORT: 255,
    VARCHAR_MEDIUM: 500,
    VARCHAR_LONG: 1000,
    TEXT: 5000,
};
// Coordinate Validation
exports.MARKING_COORDINATES = {
    MIN_LATITUDE: -90,
    MAX_LATITUDE: 90,
    MIN_LONGITUDE: -180,
    MAX_LONGITUDE: 180,
    NIGERIA_BOUNDS: {
        MIN_LAT: 4.0,
        MAX_LAT: 14.0,
        MIN_LNG: 2.5,
        MAX_LNG: 15.0,
    },
};
// Phone Number Validation
exports.PHONE = {
    NIGERIA_COUNTRY_CODE: '+234',
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
    PATTERN: /^(\+234|0)[789][01]\d{8}$/,
};
// Email Validation
exports.EMAIL = {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 255,
};
// Logging
exports.LOGGING = {
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_QUEUE_EVENTS: true,
    LOG_PAYMENT_EVENTS: true,
    LOG_NOTIFICATION_EVENTS: true,
    LOG_TIME_SLOT_EVENTS: true,
};
// Export grouped constants
exports.MARKING_CONSTANTS = {
    FEES: exports.MARKING_FEES,
    COMMISSION: exports.COMMISSION,
    PARTIAL_PAYMENT: exports.PARTIAL_PAYMENT,
    TIME_LIMITS: exports.TIME_LIMITS,
    QUEUE_CONFIG: exports.QUEUE_CONFIG,
    IMAGE_REQUIREMENTS: exports.IMAGE_REQUIREMENTS,
    BOUNDARY_REQUIREMENTS: exports.BOUNDARY_REQUIREMENTS,
    STATUSES: {
        MARKING: exports.MARKING_STATUSES,
        PAYMENT: exports.PAYMENT_STATUSES,
        QUEUE_ENTRY: exports.QUEUE_ENTRY_STATUSES,
    },
    URGENCY: {
        LEVELS: exports.URGENCY_LEVELS,
        PRIORITY_SCORES: exports.URGENCY_PRIORITY_SCORES,
    },
    NOTIFICATIONS: exports.MARKING_NOTIFICATION_TRIGGERS,
    SHAREABLE_LINK: exports.SHAREABLE_LINK,
    VALIDATION: exports.VALIDATION_MESSAGES,
    ERRORS: exports.MARKING_ERROR_CODES,
    RATE_LIMITS: exports.RATE_LIMITS,
    AGENT_PERFORMANCE: exports.AGENT_PERFORMANCE,
    DISTANCE: exports.DISTANCE,
    CURRENCY: exports.CURRENCY,
    PAGINATION: exports.PAGINATION,
    CACHE: exports.CACHE,
    LOCATION_ACCURACY: exports.LOCATION_ACCURACY,
    JOB_METADATA: exports.JOB_METADATA,
    CONFIRMATION_CYCLES: exports.CONFIRMATION_CYCLES,
    AGENT_ELIGIBILITY: exports.AGENT_ELIGIBILITY,
    WEBHOOK: exports.WEBHOOK,
    UPLOAD: exports.UPLOAD,
    ANALYTICS_PERIODS: exports.ANALYTICS_PERIODS,
    REALTIME: exports.REALTIME,
    SUCCESS: exports.SUCCESS_MESSAGES,
    ADMIN: exports.ADMIN,
    FEATURES: exports.FEATURES,
    DB_LIMITS: exports.DB_LIMITS,
    MARKING_COORDINATES: exports.MARKING_COORDINATES,
    PHONE: exports.PHONE,
    EMAIL: exports.EMAIL,
    LOGGING: exports.LOGGING,
};
// Default export
exports.default = exports.MARKING_CONSTANTS;
//# sourceMappingURL=marking.js.map