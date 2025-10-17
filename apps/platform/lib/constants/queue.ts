// apps/platform/lib/constants/queue.ts

// Queue Time Management
export const QUEUE_TIMING = {
  // Time slot durations
  TIME_SLOT_DURATION: 3 * 60 * 60 * 1000, // 3 hours in milliseconds
  TIME_SLOT_DURATION_MINUTES: 180,
  TIME_SLOT_DURATION_HOURS: 3,

  // Acceptance window
  AGENT_ACCEPTANCE_WINDOW: 5 * 60 * 1000, // 5 minutes to accept
  AGENT_ACCEPTANCE_WINDOW_SECONDS: 300,

  // Property owner confirmation
  OWNER_CONFIRMATION_DEADLINE: 2 * 24 * 60 * 60 * 1000, // 2 days
  OWNER_MAX_CONFIRMATION_DEADLINE: 3 * 24 * 60 * 60 * 1000, // 3 days max
  OWNER_CONFIRMATION_DEADLINE_HOURS: 48,

  // Time alerts
  ALERT_BEFORE_TIMEOUT: 30 * 60 * 1000, // Alert 30 mins before timeout
  ALERT_BEFORE_CONFIRMATION_DEADLINE: 12 * 60 * 60 * 1000, // Alert 12 hours before
  LATE_COMPLETION_GRACE_PERIOD: 15 * 60 * 1000, // 15 mins grace period
} as const;

// Queue Position Thresholds
export const QUEUE_THRESHOLDS = {
  // Maximum queue length
  MAX_QUEUE_SIZE: 10,
  PRIORITY_QUEUE_SIZE: 3,

  // Distance-based queue ordering
  PRIORITY_DISTANCES: {
    SAME_LOCATION: 2, // Priority multiplier for same exact location
    SAME_LGA: 1.5,
    ADJACENT_LGA: 1.2,
    SAME_STATE: 1.0,
  },

  // Performance-based queue ordering
  EXCELLENT_RATING_PRIORITY: 2.5,
  GOOD_RATING_PRIORITY: 1.8,
  AVERAGE_RATING_PRIORITY: 1.0,
  POOR_RATING_PRIORITY: 0.5,

  // Capacity thresholds
  MAX_CONCURRENT_JOBS_PER_AGENT: 5,
  MAX_PENDING_JOBS_PER_AGENT: 3,
  WARNING_THRESHOLD: 0.8, // 80% capacity warning
} as const;

// Queue Status States
export const QUEUE_STATUSES = {
  WAITING: "WAITING",
  ACCEPTED: "ACCEPTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  EXPIRED: "EXPIRED",
  ABANDONED: "ABANDONED",
  SKIPPED: "SKIPPED",
  CANCELLED: "CANCELLED",
} as const;

// Time Slot Status
export const TIME_SLOT_STATUSES = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  IN_USE: "IN_USE",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
} as const;

// Queue Event Types
export const QUEUE_EVENTS = {
  AGENT_ADDED: "AGENT_ADDED_TO_QUEUE",
  AGENT_ACCEPTED: "AGENT_ACCEPTED_POSITION",
  AGENT_STARTED: "AGENT_STARTED_MARKING",
  AGENT_COMPLETED: "AGENT_COMPLETED_MARKING",
  AGENT_ABANDONED: "AGENT_ABANDONED_POSITION",
  AGENT_SKIPPED: "AGENT_SKIPPED_TO_NEXT",
  TIME_SLOT_EXPIRED: "TIME_SLOT_EXPIRED",
  OWNER_CONFIRMED: "OWNER_CONFIRMED_MARKING",
  OWNER_REJECTED: "OWNER_REJECTED_MARKING",
  QUEUE_CLOSED: "QUEUE_CLOSED",
  NEXT_AGENT_NOTIFIED: "NEXT_AGENT_NOTIFIED",
} as const;

// Agent Eligibility Criteria
export const AGENT_ELIGIBILITY = {
  // Minimum rating
  MIN_RATING: 3.5,
  MIN_COMPLETED_JOBS: 5,

  // Reliability requirements
  MAX_MISSED_SLOTS: 2,
  MAX_REJECTION_RATE: 0.2, // 20% of jobs can be rejected

  // Availability requirements
  MUST_BE_ACTIVE: true,
  MUST_HAVE_SERVICE_AREA: true,

  // Recent performance (last 30 days)
  MIN_30_DAY_COMPLETION_RATE: 0.7,
  MAX_30_DAY_ABANDONMENT_RATE: 0.15,
} as const;

// Compensation Tiers based on Performance
export const COMPENSATION_TIERS = {
  BASE_COMPENSATION: 5000,
  PERFORMANCE_BONUS: {
    EXCELLENT: 1000, // ≥ 4.5 stars
    GOOD: 500, // ≥ 4.0 stars
    AVERAGE: 250, // ≥ 3.5 stars
  },
  SPEED_BONUS: {
    WITHIN_24_HOURS: 500,
    WITHIN_48_HOURS: 250,
  },
  RELIABILITY_BONUS: {
    NO_REJECTIONS_30_DAYS: 1000,
    NO_ABANDONMENTS_30_DAYS: 500,
  },
} as const;

// Penalty System
export const PENALTIES = {
  MISSED_ACCEPTANCE: 500, // Deducted from compensation
  ABANDONED_JOB: 1000,
  POOR_QUALITY_WORK: 1500,
  LATE_COMPLETION: 250,
  MULTIPLE_REJECTIONS: 2000, // Suspension risk
} as const;

// Suspension Thresholds
export const SUSPENSION_CRITERIA = {
  CONSECUTIVE_ABANDONMENTS: 3,
  REJECTION_RATE_THRESHOLD: 0.3, // 30%
  RATING_DROP_THRESHOLD: 2.5,
  PENALTY_ACCUMULATION: 5000, // Total penalties in 30 days
} as const;

// Notification Thresholds
export const NOTIFICATION_THRESHOLDS = {
  BROADCAST_RADIUS_KM: {
    URGENT: 50,
    HIGH: 30,
    NORMAL: 20,
    LOW: 15,
  },
  MIN_AGENTS_TO_NOTIFY: 5,
  MAX_AGENTS_TO_NOTIFY: 20,
  NOTIFICATION_BATCH_SIZE: 5,
  NOTIFICATION_BATCH_DELAY: 5000, // 5 seconds between batches
} as const;

// Queue Assignment Strategy
export const ASSIGNMENT_STRATEGY = {
  ALGORITHM: "PRIORITY_SCORING",
  FACTORS: {
    DISTANCE_WEIGHT: 0.3,
    RATING_WEIGHT: 0.4,
    AVAILABILITY_WEIGHT: 0.2,
    HISTORY_WEIGHT: 0.1,
  },
  PRIORITY_LEVELS: {
    URGENT: 1.5,
    HIGH: 1.25,
    NORMAL: 1.0,
    LOW: 0.75,
  },
} as const;

// Performance Metrics Collection
export const PERFORMANCE_METRICS = {
  TRACK_COMPLETION_TIME: true,
  TRACK_QUALITY_SCORE: true,
  TRACK_OWNER_SATISFACTION: true,
  TRACK_ABANDONMENT_RATE: true,
  TRACK_REJECTION_RATE: true,
  METRICS_RETENTION_DAYS: 180, // Keep 6 months of data
} as const;

// Logging and Auditing
export const AUDIT_CONFIG = {
  LOG_QUEUE_CHANGES: true,
  LOG_TIME_SLOT_EXPIRY: true,
  LOG_COMPENSATION_CALCULATIONS: true,
  LOG_AGENT_MOVEMENTS: true,
  AUDIT_RETENTION_DAYS: 365, // Keep 1 year of audit logs
} as const;

// Error Messages
export const QUEUE_ERRORS = {
  AGENT_NOT_ELIGIBLE: "Agent does not meet eligibility requirements",
  QUEUE_FULL: "Queue is at maximum capacity",
  INVALID_TIME_SLOT: "Invalid time slot parameters",
  JOB_ALREADY_ASSIGNED: "Job is already assigned to another agent",
  TIME_WINDOW_EXPIRED: "Time window for this action has expired",
  AGENT_SUSPENDED: "Agent account is currently suspended",
  INSUFFICIENT_RATING: "Agent rating below minimum requirement",
  SERVICE_AREA_MISMATCH: "Agent service area does not match job location",
  CONCURRENT_JOB_LIMIT: "Agent has reached concurrent job limit",
  JOB_NOT_FOUND: "Marking job not found",
  QUEUE_POSITION_NOT_FOUND: "Queue position not found",
} as const;

// Success Messages
export const QUEUE_SUCCESS = {
  AGENT_ADDED: "Agent successfully added to queue",
  POSITION_ACCEPTED: "Queue position accepted successfully",
  MARKING_COMPLETED: "Marking completed and submitted for review",
  POSITION_ABANDONED: "Queue position abandoned",
  COMPENSATION_RELEASED: "Full compensation released to agent",
  NEXT_AGENT_NOTIFIED: "Next agent notified of opportunity",
} as const;