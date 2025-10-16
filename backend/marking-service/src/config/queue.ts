// backend/marking-service/src/config/queue.ts
// Queue configuration for first-come-first-served (FCFS) system with time limits

export const QUEUE_CONFIG = {
  // Time slot configuration
  TIME_SLOT_DURATION_MINUTES: 180, // 3 hours per agent
  TIME_SLOT_DURATION_MS: 180 * 60 * 1000, // 3 hours in milliseconds
  
  // Maximum completion time for property owners
  MAX_COMPLETION_DAYS: 3,
  MAX_COMPLETION_HOURS: 72,
  MAX_COMPLETION_MS: 3 * 24 * 60 * 60 * 1000, // 3 days in milliseconds
  
  // Queue behavior
  MAX_QUEUE_SIZE: 50, // Maximum number of agents in queue per job
  MIN_AGENTS_TO_NOTIFY: 5, // Minimum agents to notify initially
  MAX_AGENTS_TO_NOTIFY: 20, // Maximum agents to notify in first batch
  
  // Notification intervals
  NOTIFICATION_BATCH_INTERVAL_MINUTES: 30, // Send to more agents every 30 mins if no response
  NOTIFICATION_BATCH_SIZE: 5, // How many additional agents to notify each batch
  
  // Agent response times
  AGENT_RESPONSE_TIMEOUT_MINUTES: 15, // Agent must respond within 15 minutes
  AGENT_RESPONSE_TIMEOUT_MS: 15 * 60 * 1000,
  
  // Queue rotation
  AUTO_ROTATION_ENABLED: true, // Automatically rotate to next agent when time expires
  ROTATION_GRACE_PERIOD_MINUTES: 5, // Grace period before rotating
  ROTATION_GRACE_PERIOD_MS: 5 * 60 * 1000,
  
  // Queue priorities
  PRIORITY_MULTIPLIERS: {
    LOW: 1.0, // Standard time slot
    NORMAL: 1.0,
    HIGH: 0.8, // 20% less time (2.4 hours)
    URGENT: 0.6, // 40% less time (1.8 hours)
  },
  
  // Position tracking
  UPDATE_POSITION_INTERVAL_SECONDS: 30, // Update queue positions every 30 seconds
  NOTIFY_POSITION_CHANGE: true, // Notify agents when their position changes
  
  // Completion incentives
  EARLY_COMPLETION_BONUS_PERCENT: 10, // 10% bonus for completing in first hour
  EARLY_COMPLETION_THRESHOLD_MINUTES: 60,
  
  // Partial payment configuration
  INITIAL_PAYMENT_PERCENT: 5, // 5% released when job is marked (1000 naira of 20000)
  INITIAL_PAYMENT_AMOUNT: 1000, // Fixed 1000 naira initial payment
  REMAINING_PAYMENT_PERCENT: 95, // 95% released after owner confirmation
  
  // Agent compensation
  AGENT_COMMISSION_PERCENT: 25, // 25% of 20,000 naira = 5,000 naira
  NEWCONDO_FEE_PERCENT: 75, // 75% goes to Newcondo
  MARKING_JOB_FEE: 20000, // Base fee in naira
  NEWCONDO_MARKING_FEE: 25000, // Fee when Newcondo marks directly
  
  // Queue eligibility
  ELIGIBILITY_CRITERIA: {
    MIN_RELIABILITY_SCORE: 2.5,
    MIN_COMPLETION_RATE: 0.7, // 70%
    MAX_CANCELLATION_RATE: 0.3, // 30%
    MAX_ACTIVE_JOBS: 5, // Maximum concurrent jobs per agent
  },
  
  // Performance tracking
  TRACK_QUEUE_PERFORMANCE: true,
  PERFORMANCE_CALCULATION_INTERVAL_HOURS: 24,
  
  // Retry and failure handling
  MAX_REASSIGNMENT_ATTEMPTS: 3, // Maximum times to reassign a job
  REASSIGNMENT_DELAY_MINUTES: 10, // Wait before reassigning
  
  // Distance and proximity
  MAX_PROXIMITY_RADIUS_KM: 50, // Only notify agents within 50km
  PREFERRED_PROXIMITY_KM: 20, // Prefer agents within 20km
  PROXIMITY_BONUS_ENABLED: true,
  
  // Queue cleanup
  CLEANUP_EXPIRED_ENTRIES_INTERVAL_HOURS: 1,
  REMOVE_STALE_ENTRIES_AFTER_DAYS: 7,
} as const;

// Queue status definitions
export const QUEUE_STATUS = {
  WAITING: 'WAITING', // Agent in queue, waiting for turn
  ACTIVE: 'ACTIVE', // Agent's turn to complete the job
  EXPIRED: 'EXPIRED', // Agent's time slot expired
  COMPLETED: 'COMPLETED', // Job completed by this agent
  WITHDRAWN: 'WITHDRAWN', // Agent withdrew from queue
  ROTATED: 'ROTATED', // Moved to next agent
} as const;

export type QueueStatusType = typeof QUEUE_STATUS[keyof typeof QUEUE_STATUS];

// Queue event types
export const QUEUE_EVENTS = {
  AGENT_JOINED: 'AGENT_JOINED',
  AGENT_WITHDRAWN: 'AGENT_WITHDRAWN',
  POSITION_CHANGED: 'POSITION_CHANGED',
  TURN_STARTED: 'TURN_STARTED',
  TURN_EXPIRING: 'TURN_EXPIRING', // Warning 30 mins before expiry
  TURN_EXPIRED: 'TURN_EXPIRED',
  JOB_COMPLETED: 'JOB_COMPLETED',
  JOB_CANCELLED: 'JOB_CANCELLED',
  QUEUE_ROTATED: 'QUEUE_ROTATED',
  PAYMENT_RELEASED: 'PAYMENT_RELEASED',
} as const;

export type QueueEventType = typeof QUEUE_EVENTS[keyof typeof QUEUE_EVENTS];

// Notification priorities
export const NOTIFICATION_PRIORITY = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type NotificationPriorityType = typeof NOTIFICATION_PRIORITY[keyof typeof NOTIFICATION_PRIORITY];

// Queue sorting strategies
export const QUEUE_SORT_STRATEGY = {
  FCFS: 'FCFS', // First-come-first-served (default)
  RELIABILITY: 'RELIABILITY', // Sort by reliability score
  PROXIMITY: 'PROXIMITY', // Sort by distance to property
  HYBRID: 'HYBRID', // Combination of FCFS and reliability
} as const;

export type QueueSortStrategyType = typeof QUEUE_SORT_STRATEGY[keyof typeof QUEUE_SORT_STRATEGY];

// Default queue sort strategy
export const DEFAULT_SORT_STRATEGY: QueueSortStrategyType = QUEUE_SORT_STRATEGY.FCFS;

// Time slot warnings
export const TIME_SLOT_WARNINGS = {
  WARNING_AT_PERCENT: 75, // Warn when 75% of time used (2hr 15min)
  CRITICAL_AT_PERCENT: 90, // Critical warning at 90% (2hr 42min)
  WARNING_AT_MINUTES: 135, // 2 hours 15 minutes
  CRITICAL_AT_MINUTES: 162, // 2 hours 42 minutes
} as const;

// Queue limits per agent
export const AGENT_QUEUE_LIMITS = {
  MAX_CONCURRENT_QUEUES: 10, // Agent can be in max 10 queues at once
  MAX_DAILY_JOINS: 50, // Max 50 queue joins per day
  COOLDOWN_AFTER_COMPLETION_MINUTES: 0, // No cooldown (can join immediately)
  COOLDOWN_AFTER_EXPIRY_MINUTES: 30, // 30 min cooldown after expiry
  COOLDOWN_AFTER_CANCELLATION_MINUTES: 60, // 1 hour cooldown after cancellation
} as const;

// Validation rules
export const QUEUE_VALIDATION = {
  MIN_PROPERTY_DISTANCE_METERS: 100, // Properties must be 100m apart
  REQUIRE_GPS_COORDINATES: true,
  REQUIRE_CONTACT_PERSON: true,
  REQUIRE_ACCESS_INSTRUCTIONS: false, // Optional but recommended
  VALIDATE_SERVICE_AREA: true,
} as const;

// Redis cache configuration for queue
export const QUEUE_CACHE_CONFIG = {
  ENABLED: true,
  KEY_PREFIX: 'marking_queue:',
  TTL_SECONDS: 86400, // 24 hours
  UPDATE_FREQUENCY_SECONDS: 30,
} as const;

// Export utility function for calculating time slot duration
export function calculateTimeSlotDuration(
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
): number {
  const multiplier = QUEUE_CONFIG.PRIORITY_MULTIPLIERS[priority];
  return Math.floor(QUEUE_CONFIG.TIME_SLOT_DURATION_MINUTES * multiplier);
}

// Export utility function for calculating agent commission
export function calculateAgentCommission(markingFee: number): {
  agentAmount: number;
  newcondoAmount: number;
  initialPayment: number;
  remainingPayment: number;
} {
  const agentAmount = markingFee * (QUEUE_CONFIG.AGENT_COMMISSION_PERCENT / 100);
  const newcondoAmount = markingFee * (QUEUE_CONFIG.NEWCONDO_FEE_PERCENT / 100);
  const initialPayment = QUEUE_CONFIG.INITIAL_PAYMENT_AMOUNT;
  const remainingPayment = agentAmount - initialPayment;

  return {
    agentAmount,
    newcondoAmount,
    initialPayment,
    remainingPayment,
  };
}

// Export utility function for checking agent eligibility
export function isAgentEligibleForQueue(metrics: {
  reliabilityScore: number;
  completionRate: number;
  cancellationRate: number;
  activeJobs: number;
}): { eligible: boolean; reason?: string } {
  const criteria = QUEUE_CONFIG.ELIGIBILITY_CRITERIA;

  if (metrics.reliabilityScore < criteria.MIN_RELIABILITY_SCORE) {
    return {
      eligible: false,
      reason: `Reliability score too low (${metrics.reliabilityScore} < ${criteria.MIN_RELIABILITY_SCORE})`,
    };
  }

  if (metrics.completionRate < criteria.MIN_COMPLETION_RATE) {
    return {
      eligible: false,
      reason: `Completion rate too low (${metrics.completionRate * 100}% < ${criteria.MIN_COMPLETION_RATE * 100}%)`,
    };
  }

  if (metrics.cancellationRate > criteria.MAX_CANCELLATION_RATE) {
    return {
      eligible: false,
      reason: `Cancellation rate too high (${metrics.cancellationRate * 100}% > ${criteria.MAX_CANCELLATION_RATE * 100}%)`,
    };
  }

  if (metrics.activeJobs >= criteria.MAX_ACTIVE_JOBS) {
    return {
      eligible: false,
      reason: `Too many active jobs (${metrics.activeJobs} >= ${criteria.MAX_ACTIVE_JOBS})`,
    };
  }

  return { eligible: true };
}