// apps/platform/lib/constants/marking.ts

// Marking Job Fees (in Naira)
export const MARKING_FEES = {
  PROPERTY_OWNER_COST: 20000, // Cost for property owner to get house marked
  AGENT_COMPENSATION: 5000, // 25% of 20,000 = 5,000
  NEWCONDO_AGENT_COST: 25000, // Cost when Newcondo marks the house
  NEWCONDO_CUT: 15000, // Newcondo's portion from marking fee
  FIRST_COMPLETION_BONUS: 1000, // Initial bonus when agent marks
  CONFIRMATION_COMPENSATION: 4000, // Remaining compensation after confirmation
} as const;

// Marking Job Statuses
export const MARKING_JOB_STATUSES = {
  QUEUED: "QUEUED",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;

// Marker Types
export const MARKER_TYPES = {
  SELF: "SELF",
  KNOWN_PERSON: "KNOWN_PERSON",
  NEWCONDO_AGENT: "NEWCONDO_AGENT",
  NEWCONDO_PREMIUM: "NEWCONDO_PREMIUM",
} as const;

// Urgency Levels
export const URGENCY_LEVELS = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

// Time Windows (in milliseconds)
export const TIME_WINDOWS = {
  QUEUE_TIME_SLOT: 3 * 60 * 60 * 1000, // 3 hours
  OWNER_CONFIRMATION_WINDOW: 2 * 24 * 60 * 60 * 1000, // 2-3 days (using 2)
  OWNER_MAX_CONFIRMATION_WINDOW: 3 * 24 * 60 * 60 * 1000, // 3 days
  NOTIFICATION_DISPLAY: 10 * 60 * 1000, // 10 minutes
  QUEUE_ACCEPT_TIMEOUT: 5 * 60 * 1000, // 5 minutes to accept queue position
} as const;

// Time Windows (in human-readable format)
export const TIME_WINDOW_LABELS = {
  QUEUE_TIME_SLOT: "3 hours",
  OWNER_CONFIRMATION: "2-3 days",
  NOTIFICATION_DISPLAY: "10 minutes",
  QUEUE_ACCEPT: "5 minutes",
} as const;

// Maximum retries and attempts
export const MAX_ATTEMPTS = {
  MARKING_RETRIES: 3, // Property owner can request marking up to 3 times
  AGENT_QUEUE_REJECTIONS: 2, // Agent can miss queue 2 times before suspension
  NOTIFICATION_RESEND: 3, // Resend notification 3 times
} as const;

// Distance thresholds for agent matching (in kilometers)
export const DISTANCE_THRESHOLDS = {
  SAME_LGA: 5, // Within same LGA
  ADJACENT_LGA: 15, // Between adjacent LGAs
  SAME_STATE: 50, // Within same state
  CROSS_STATE: 100, // Between states (only for urgent)
} as const;

// Agent performance metrics thresholds
export const AGENT_PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 4.5, // 4.5/5.0 stars
  GOOD: 4.0,
  AVERAGE: 3.5,
  POOR: 2.5,
  SUSPENDED: 2.0,
} as const;

// Payment status for marking jobs
export const PAYMENT_STATUS_MARKING = {
  PENDING: "PENDING",
  PARTIAL_PAID: "PARTIAL_PAID", // Initial bonus paid
  FULLY_PAID: "FULLY_PAID", // Full payment released
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

// Queue position messages
export const QUEUE_MESSAGES = {
  JOINED: "You have been added to the queue",
  ACCEPTED: "Queue position accepted",
  ASSIGNED: "You are assigned to mark this property",
  COMPLETED: "Marking completed successfully",
  TIMEOUT: "Your time slot has expired",
  SKIPPED: "Moved to next agent in queue",
  ABANDONED: "Agent abandoned queue position",
  PENDING_CONFIRMATION: "Awaiting property owner confirmation",
  CONFIRMED: "Property owner confirmed your marking",
  REJECTED: "Property owner rejected your marking",
} as const;

// Notification types for marking
export const MARKING_NOTIFICATION_TYPES = {
  JOB_AVAILABLE: "MARKING_JOB_AVAILABLE",
  ACCEPTED_IN_QUEUE: "MARKING_ACCEPTED_IN_QUEUE",
  YOUR_TURN: "MARKING_YOUR_TURN",
  TIME_SLOT_EXPIRING: "MARKING_TIME_SLOT_EXPIRING",
  EXPIRED: "MARKING_TIME_SLOT_EXPIRED",
  COMPLETED_BONUS: "MARKING_COMPLETED_BONUS",
  OWNER_CONFIRMED: "MARKING_OWNER_CONFIRMED",
  OWNER_REJECTED: "MARKING_OWNER_REJECTED",
  FULL_PAYMENT_RELEASED: "MARKING_FULL_PAYMENT_RELEASED",
  NEW_REQUEST: "MARKING_NEW_REQUEST_ADMIN",
} as const;

// Queue entry reasons
export const QUEUE_ENTRY_REASONS = {
  AVAILABLE: "Agent is available",
  PROXIMITY: "Within service area",
  RATING: "High reliability rating",
  CAPACITY: "Has marking capacity",
} as const;

// Boundary marking validation
export const BOUNDARY_VALIDATION = {
  MIN_POINTS: 3, // Minimum points for polygon
  MIN_AREA: 50, // Minimum area in square meters
  MAX_AREA: 50000, // Maximum area (50,000 sqm = 5 hectares)
  ACCURACY_TOLERANCE: 10, // GPS accuracy tolerance in meters
} as const;

// Image requirements for marking
export const IMAGE_REQUIREMENTS = {
  MIN_IMAGES: 3,
  MAX_IMAGES: 15,
  REQUIRED_ANGLES: [
    "FRONT_VIEW",
    "SIDE_VIEW",
    "BACK_VIEW",
  ],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ["image/jpeg", "image/png", "image/webp"],
} as const;

// Compensation calculation helpers
export const COMPENSATION_CALCULATION = {
  INITIAL_PERCENTAGE: 0.2, // 20% upfront (1000 from 5000)
  REMAINING_PERCENTAGE: 0.8, // 80% on confirmation
  CALCULATE_INITIAL: (fee: number) => Math.round(fee * 0.2),
  CALCULATE_REMAINING: (fee: number) => Math.round(fee * 0.8),
} as const;

// Alert/Warning conditions
export const ALERT_CONDITIONS = {
  APPROACHING_TIMEOUT: 30 * 60 * 1000, // Alert 30 mins before timeout
  OWNER_CONFIRMATION_URGENT: 12 * 60 * 60 * 1000, // Alert 12 hrs before deadline
  MULTIPLE_REJECTIONS: 2, // Alert after 2 rejections
} as const;