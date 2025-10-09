/**
 * Queue Configuration
 * Settings for job queue management in marking service
 */

export const queueConfig = {
  // Queue Strategy
  QUEUE_STRATEGY: 'first-come-first-served', // FCFS for fairness
  
  // Time Slot Configuration
  TIME_SLOT: {
    // Duration of each time slot for marking (in hours)
    DURATION_HOURS: 3,
    
    // Time window for marking completion
    COMPLETION_WINDOW_HOURS: 3,
    
    // Maximum number of concurrent slots per agent
    MAX_CONCURRENT_SLOTS: 2,

    // Buffer time between slots (in minutes)
    SLOT_BUFFER_MINUTES: 15,

    // Slot assignment strategy
    ASSIGNMENT_STRATEGY: 'nearest-available', // nearest-available or load-balanced
  },

  // Queue Position Management
  QUEUE_POSITION: {
    // Initial queue position when job is created
    INITIAL_POSITION: null, // Auto-assigned based on priority

    // Priority queue configuration
    PRIORITY_ENABLED: true,
    
    // Priority weights (higher = more priority)
    PRIORITY_WEIGHTS: {
      URGENT: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1,
    },

    // Position update frequency (in seconds)
    UPDATE_FREQUENCY: 60,

    // Notification on position change
    NOTIFY_ON_POSITION_CHANGE: true,
  },

  // Queue Timeout Configuration
  TIMEOUT: {
    // Time before job expires if not assigned (in hours)
    EXPIRY_TIME_HOURS: 24,

    // Time before job times out after assignment (in hours)
    COMPLETION_DEADLINE_HOURS: 72, // 3 days

    // Grace period for late completion (in hours)
    GRACE_PERIOD_HOURS: 2,

    // Timeout check frequency (in seconds)
    CHECK_FREQUENCY: 300, // Every 5 minutes

    // Action on timeout
    AUTO_REASSIGN_ON_TIMEOUT: true,
    AUTO_CANCEL_ON_EXPIRY: true,
  },

  // Assignment Rules
  ASSIGNMENT: {
    // Match criteria for agent assignment
    MATCH_CRITERIA: [
      'proximity', // Geographic proximity
      'availability', // Agent availability
      'specialization', // Agent skills/experience
      'reliability_score', // Historical performance
      'workload', // Current workload
    ],

    // Agent availability check
    AVAILABILITY_CHECK: {
      ENABLED: true,
      CHECK_INTERVAL_SECONDS: 30,
      ONLINE_STATUS_TIMEOUT_MINUTES: 5,
    },

    // Load balancing
    LOAD_BALANCING: {
      ENABLED: true,
      MAX_JOBS_PER_AGENT: 10, // Maximum concurrent jobs
      PREFERRED_MAX_JOBS: 3, // Preferred max for work-life balance
      REBALANCE_THRESHOLD: 0.8, // Rebalance when 80% capacity reached
    },

    // Skill-based routing
    SKILL_ROUTING: {
      ENABLED: false, // For future use if different marking types
      SKILL_LEVELS: ['junior', 'senior', 'expert'],
      DEFAULT_SKILL: 'junior',
    },

    // Automatic retry on assignment failure
    AUTO_RETRY: {
      ENABLED: true,
      MAX_RETRIES: 3,
      RETRY_DELAY_SECONDS: 30,
    },
  },

  // Queue Status Tracking
  STATUS_TRACKING: {
    // Status update frequency
    UPDATE_FREQUENCY_SECONDS: 60,

    // Statuses in queue lifecycle
    STATUSES: {
      PENDING: 'pending', // Waiting to be processed
      QUEUED: 'queued', // In queue, waiting for agent
      ASSIGNED: 'assigned', // Assigned to agent
      IN_PROGRESS: 'in_progress', // Agent working on job
      COMPLETED: 'completed', // Job completed
      CANCELLED: 'cancelled', // Job cancelled
      EXPIRED: 'expired', // Job expired
      FAILED: 'failed', // Job failed
    },

    // Status transition rules
    ALLOWED_TRANSITIONS: {
      pending: ['queued', 'cancelled'],
      queued: ['assigned', 'expired', 'cancelled'],
      assigned: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'failed', 'cancelled'],
      completed: [], // Terminal state
      cancelled: [], // Terminal state
      expired: [], // Terminal state
      failed: ['queued', 'cancelled'], // Can retry or cancel
    },
  },

  // Queue Persistence
  PERSISTENCE: {
    // Store queue data in database
    PERSIST_TO_DB: true,

    // Backup frequency (in seconds)
    BACKUP_FREQUENCY: 300, // Every 5 minutes

    // Recovery on service restart
    AUTO_RECOVERY: true,
    RECOVERY_TIMEOUT_SECONDS: 30,
  },

  // Queue Monitoring & Alerts
  MONITORING: {
    // Alert thresholds
    ALERTS: {
      // Queue length alert
      QUEUE_LENGTH_THRESHOLD: 50,
      
      // Average wait time alert (in minutes)
      AVG_WAIT_TIME_THRESHOLD: 120, // 2 hours

      // High priority backlog alert
      HIGH_PRIORITY_BACKLOG_THRESHOLD: 10,

      // Agent unavailability alert
      AGENT_UNAVAILABILITY_THRESHOLD: 0.3, // 30% unavailable

      // Job failure rate alert
      JOB_FAILURE_RATE_THRESHOLD: 0.1, // 10% failure rate
    },

    // Metrics collection
    COLLECT_METRICS: true,
    METRICS_RETENTION_DAYS: 30,

    // Dashboard updates
    DASHBOARD_UPDATE_FREQUENCY: 60, // seconds

    // Logging
    LOG_QUEUE_EVENTS: true,
    LOG_LEVEL: 'info', // debug, info, warn, error
  },

  // Queue Optimization
  OPTIMIZATION: {
    // Batch processing
    BATCH_PROCESSING: {
      ENABLED: true,
      BATCH_SIZE: 10,
      BATCH_TIMEOUT_SECONDS: 30,
    },

    // Caching
    CACHE_ENABLED: true,
    CACHE_TTL_SECONDS: 300, // 5 minutes

    // Performance tuning
    INDEX_OPTIMIZATION: true,
    QUERY_OPTIMIZATION: true,
  },

  // Testing & Development
  DEVELOPMENT: {
    // Mock queue mode (for testing)
    MOCK_MODE: false,
    
    // Simulated delays (in milliseconds)
    SIMULATED_DELAY: 0,

    // Debug logging
    DEBUG_MODE: process.env.NODE_ENV === 'development',

    // Test data generation
    GENERATE_TEST_DATA: false,
  },
} as const;

export default queueConfig;