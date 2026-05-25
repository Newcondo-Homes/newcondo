/**
 * Agent Performance Scoring Constants
 * Tracks and calculates agent reliability scores for queue assignment
 */
export declare const PERFORMANCE_CONSTANTS: {
    readonly MIN_SCORE: 0;
    readonly MAX_SCORE: 5;
    readonly DECIMAL_PLACES: 2;
    readonly SCORE_TIERS: {
        readonly EXCELLENT: {
            readonly min: 4.5;
            readonly max: 5;
            readonly label: "Excellent";
            readonly multiplier: 1.5;
        };
        readonly GOOD: {
            readonly min: 3.5;
            readonly max: 4.49;
            readonly label: "Good";
            readonly multiplier: 1.2;
        };
        readonly AVERAGE: {
            readonly min: 2.5;
            readonly max: 3.49;
            readonly label: "Average";
            readonly multiplier: 1;
        };
        readonly BELOW_AVERAGE: {
            readonly min: 1.5;
            readonly max: 2.49;
            readonly label: "Below Average";
            readonly multiplier: 0.7;
        };
        readonly POOR: {
            readonly min: 0;
            readonly max: 1.49;
            readonly label: "Poor";
            readonly multiplier: 0.3;
        };
    };
    readonly METRICS: {
        readonly COMPLETION_RATE: {
            readonly weight: 0.4;
            readonly description: "Percentage of jobs completed vs assigned";
            readonly threshold: 0.8;
        };
        readonly TIMELINESS: {
            readonly weight: 0.25;
            readonly description: "Completed within time slot";
            readonly threshold: 0.85;
        };
        readonly QUALITY: {
            readonly weight: 0.2;
            readonly description: "Property owner confirmation rate";
            readonly threshold: 0.9;
        };
        readonly RESPONSE_TIME: {
            readonly weight: 0.15;
            readonly description: "Time taken to accept job assignment";
            readonly threshold: 0.5;
        };
    };
    readonly SCORING_RULES: {
        readonly JOB_COMPLETED_ON_TIME: 1;
        readonly JOB_COMPLETED_LATE: 0.5;
        readonly QUICK_RESPONSE_ACCEPTANCE: 0.5;
        readonly PROPERTY_OWNER_CONFIRMATION: 0.75;
        readonly EXCELLENT_COMPLETION_QUALITY: 0.5;
        readonly JOB_CANCELLED: -0.5;
        readonly JOB_ABANDONED: -1;
        readonly PROPERTY_OWNER_REJECTION: -0.75;
        readonly POOR_QUALITY_SUBMISSION: -0.5;
        readonly MISSED_TIME_SLOT: -1;
        readonly MULTIPLE_REJECTIONS: -1.5;
        readonly MINIMUM_SCORE_CAP: 0;
    };
    readonly NEW_AGENT_INITIAL_SCORE: 3;
    readonly NEW_AGENT_TRIAL_PERIOD_JOBS: 5;
    readonly SCORE_RECALCULATION_INTERVAL_MS: number;
    readonly SCORE_HISTORY_RETENTION_DAYS: 90;
    readonly QUEUE_ASSIGNMENT_RULES: {
        readonly EXCELLENT: {
            readonly priorityBoost: 1000;
            readonly maxConcurrentJobs: 5;
            readonly serviceAreaRadius: 20;
            readonly canSkipAreaRestrictions: true;
        };
        readonly GOOD: {
            readonly priorityBoost: 500;
            readonly maxConcurrentJobs: 3;
            readonly serviceAreaRadius: 15;
            readonly canSkipAreaRestrictions: false;
        };
        readonly AVERAGE: {
            readonly priorityBoost: 0;
            readonly maxConcurrentJobs: 2;
            readonly serviceAreaRadius: 10;
            readonly canSkipAreaRestrictions: false;
        };
        readonly BELOW_AVERAGE: {
            readonly priorityBoost: -500;
            readonly maxConcurrentJobs: 1;
            readonly serviceAreaRadius: 5;
            readonly canSkipAreaRestrictions: false;
        };
        readonly POOR: {
            readonly priorityBoost: -1000;
            readonly maxConcurrentJobs: 0;
            readonly serviceAreaRadius: 0;
            readonly canSkipAreaRestrictions: false;
        };
    };
    readonly WARNINGS_AND_SUSPENSIONS: {
        readonly WARNING_THRESHOLD: 1.5;
        readonly PROBATION_THRESHOLD: 1;
        readonly SUSPENSION_THRESHOLD: 0.5;
        readonly WARNING_NOTIFICATION: "Your performance score is declining";
        readonly PROBATION_NOTIFICATION: "You are on probation - limited job access";
        readonly SUSPENSION_NOTIFICATION: "Your account has been suspended";
        readonly PROBATION_DURATION_DAYS: 14;
        readonly SUSPENSION_DURATION_DAYS: 30;
    };
    readonly TRACKED_METRICS: {
        readonly TOTAL_JOBS_ASSIGNED: "totalJobsAssigned";
        readonly TOTAL_JOBS_COMPLETED: "totalJobsCompleted";
        readonly TOTAL_JOBS_CANCELLED: "totalJobsCancelled";
        readonly AVERAGE_RESPONSE_TIME: "avgResponseTimeMs";
        readonly ON_TIME_COMPLETION_RATE: "onTimeCompletionRate";
        readonly OWNER_CONFIRMATION_RATE: "ownerConfirmationRate";
        readonly AVERAGE_QUALITY_RATING: "avgQualityRating";
        readonly TOTAL_REJECTIONS: "totalRejections";
        readonly CURRENT_SCORE: "currentScore";
        readonly LAST_SCORE_UPDATE: "lastScoreUpdate";
    };
    readonly BENCHMARKS: {
        readonly EXCELLENT_COMPLETION_RATE: 0.95;
        readonly GOOD_COMPLETION_RATE: 0.85;
        readonly ACCEPTABLE_COMPLETION_RATE: 0.7;
        readonly AVERAGE_RESPONSE_TIME_MINUTES: 15;
        readonly TARGET_ON_TIME_RATE: 0.9;
    };
    readonly ERROR_MESSAGES: {
        readonly INVALID_SCORE: "Invalid performance score";
        readonly AGENT_SUSPENDED: "Agent account is suspended";
        readonly AGENT_ON_PROBATION: "Agent is on probation with limited access";
        readonly INSUFFICIENT_JOBS_FOR_RATING: "Not enough completed jobs to calculate rating";
        readonly SCORE_CALCULATION_ERROR: "Error calculating performance score";
    };
};
export type ScoreTier = keyof typeof PERFORMANCE_CONSTANTS.SCORE_TIERS;
export type MetricKey = keyof typeof PERFORMANCE_CONSTANTS.TRACKED_METRICS;
//# sourceMappingURL=performance.d.ts.map