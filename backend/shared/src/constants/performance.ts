/**
 * Agent Performance Scoring Constants
 * Tracks and calculates agent reliability scores for queue assignment
 */

export const PERFORMANCE_CONSTANTS = {
  // Reliability score range
  MIN_SCORE: 0,
  MAX_SCORE: 5.0,
  DECIMAL_PLACES: 2,
  
  // Score tiers and thresholds
  SCORE_TIERS: {
    EXCELLENT: {
      min: 4.5,
      max: 5.0,
      label: 'Excellent',
      multiplier: 1.5, // Higher priority in queue
    },
    GOOD: {
      min: 3.5,
      max: 4.49,
      label: 'Good',
      multiplier: 1.2,
    },
    AVERAGE: {
      min: 2.5,
      max: 3.49,
      label: 'Average',
      multiplier: 1.0,
    },
    BELOW_AVERAGE: {
      min: 1.5,
      max: 2.49,
      label: 'Below Average',
      multiplier: 0.7,
    },
    POOR: {
      min: 0,
      max: 1.49,
      label: 'Poor',
      multiplier: 0.3, // Lower priority, may be excluded
    },
  } as const,
  
  // Metrics that contribute to score
  METRICS: {
    COMPLETION_RATE: {
      weight: 0.4, // 40% of total score
      description: 'Percentage of jobs completed vs assigned',
      threshold: 0.8, // 80% minimum
    },
    TIMELINESS: {
      weight: 0.25, // 25% of total score
      description: 'Completed within time slot',
      threshold: 0.85, // 85% on-time completion
    },
    QUALITY: {
      weight: 0.2, // 20% of total score
      description: 'Property owner confirmation rate',
      threshold: 0.9, // 90% confirmation rate
    },
    RESPONSE_TIME: {
      weight: 0.15, // 15% of total score
      description: 'Time taken to accept job assignment',
      threshold: 0.5, // 30 minutes max response time
    },
  } as const,
  
  // Points and penalties
  SCORING_RULES: {
    // Positive actions (add points)
    JOB_COMPLETED_ON_TIME: 1.0,
    JOB_COMPLETED_LATE: 0.5,
    QUICK_RESPONSE_ACCEPTANCE: 0.5, // Within 5 minutes
    PROPERTY_OWNER_CONFIRMATION: 0.75, // Owner confirmed the marking
    EXCELLENT_COMPLETION_QUALITY: 0.5,
    
    // Negative actions (deduct points)
    JOB_CANCELLED: -0.5,
    JOB_ABANDONED: -1.0,
    PROPERTY_OWNER_REJECTION: -0.75,
    POOR_QUALITY_SUBMISSION: -0.5,
    MISSED_TIME_SLOT: -1.0,
    MULTIPLE_REJECTIONS: -1.5, // Multiple owner rejections
    
    // Minimum penalties
    MINIMUM_SCORE_CAP: 0, // Never go below 0
  } as const,
  
  // Initial scores for new agents
  NEW_AGENT_INITIAL_SCORE: 3.0, // Start at Average
  NEW_AGENT_TRIAL_PERIOD_JOBS: 5, // First 5 jobs are trial
  
  // Score calculation intervals
  SCORE_RECALCULATION_INTERVAL_MS: 24 * 60 * 60 * 1000, // Daily
  SCORE_HISTORY_RETENTION_DAYS: 90, // Keep 90 days of history
  
  // Queue assignment rules based on score
  QUEUE_ASSIGNMENT_RULES: {
    EXCELLENT: {
      priorityBoost: 1000, // First in queue
      maxConcurrentJobs: 5,
      serviceAreaRadius: 20, // km
      canSkipAreaRestrictions: true,
    },
    GOOD: {
      priorityBoost: 500,
      maxConcurrentJobs: 3,
      serviceAreaRadius: 15,
      canSkipAreaRestrictions: false,
    },
    AVERAGE: {
      priorityBoost: 0,
      maxConcurrentJobs: 2,
      serviceAreaRadius: 10,
      canSkipAreaRestrictions: false,
    },
    BELOW_AVERAGE: {
      priorityBoost: -500,
      maxConcurrentJobs: 1,
      serviceAreaRadius: 5,
      canSkipAreaRestrictions: false,
    },
    POOR: {
      priorityBoost: -1000,
      maxConcurrentJobs: 0, // Cannot accept new jobs
      serviceAreaRadius: 0,
      canSkipAreaRestrictions: false,
    },
  } as const,
  
  // Suspension and warning thresholds
  WARNINGS_AND_SUSPENSIONS: {
    WARNING_THRESHOLD: 1.5, // Score below this triggers warning
    PROBATION_THRESHOLD: 1.0, // Score below this = probation
    SUSPENSION_THRESHOLD: 0.5, // Score below this = suspension
    
    WARNING_NOTIFICATION: 'Your performance score is declining',
    PROBATION_NOTIFICATION: 'You are on probation - limited job access',
    SUSPENSION_NOTIFICATION: 'Your account has been suspended',
    
    PROBATION_DURATION_DAYS: 14,
    SUSPENSION_DURATION_DAYS: 30,
  } as const,
  
  // Performance tracking metrics
  TRACKED_METRICS: {
    TOTAL_JOBS_ASSIGNED: 'totalJobsAssigned',
    TOTAL_JOBS_COMPLETED: 'totalJobsCompleted',
    TOTAL_JOBS_CANCELLED: 'totalJobsCancelled',
    AVERAGE_RESPONSE_TIME: 'avgResponseTimeMs',
    ON_TIME_COMPLETION_RATE: 'onTimeCompletionRate',
    OWNER_CONFIRMATION_RATE: 'ownerConfirmationRate',
    AVERAGE_QUALITY_RATING: 'avgQualityRating',
    TOTAL_REJECTIONS: 'totalRejections',
    CURRENT_SCORE: 'currentScore',
    LAST_SCORE_UPDATE: 'lastScoreUpdate',
  } as const,
  
  // Benchmark comparisons
  BENCHMARKS: {
    EXCELLENT_COMPLETION_RATE: 0.95,
    GOOD_COMPLETION_RATE: 0.85,
    ACCEPTABLE_COMPLETION_RATE: 0.7,
    AVERAGE_RESPONSE_TIME_MINUTES: 15,
    TARGET_ON_TIME_RATE: 0.9,
  } as const,
  
  // Error messages
  ERROR_MESSAGES: {
    INVALID_SCORE: 'Invalid performance score',
    AGENT_SUSPENDED: 'Agent account is suspended',
    AGENT_ON_PROBATION: 'Agent is on probation with limited access',
    INSUFFICIENT_JOBS_FOR_RATING: 'Not enough completed jobs to calculate rating',
    SCORE_CALCULATION_ERROR: 'Error calculating performance score',
  } as const,
} as const;

export type ScoreTier = keyof typeof PERFORMANCE_CONSTANTS.SCORE_TIERS;
export type MetricKey = keyof typeof PERFORMANCE_CONSTANTS.TRACKED_METRICS;