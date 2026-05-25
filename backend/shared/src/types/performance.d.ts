/**
 * File: backend/shared/src/types/performance.ts
 * Shared performance and reliability scoring types for agents
 */
/**
 * Agent reliability score breakdown
 */
export interface AgentReliabilityScore {
    agentId: string;
    overallScore: number;
    breakdown: {
        completionRate: ScoreComponent;
        responseTime: ScoreComponent;
        qualityRating: ScoreComponent;
        punctuality: ScoreComponent;
        propertyOwnerFeedback: ScoreComponent;
    };
    totalJobs: number;
    completedJobs: number;
    cancelledJobs: number;
    expiredJobs: number;
    lastUpdated: Date;
}
/**
 * Individual score component
 */
export interface ScoreComponent {
    score: number;
    weight: number;
    details?: string;
}
/**
 * Agent performance metrics
 */
export interface AgentPerformanceMetrics {
    agentId: string;
    totalJobsAssigned: number;
    totalJobsCompleted: number;
    totalJobsCancelled: number;
    totalJobsExpired: number;
    completionRate: number;
    averageCompletionTime: number;
    firstTimeCompletionRate: number;
    averageResponseTime: number;
    averageTimeSlotUtilization: number;
    averageQualityRating: number;
    boundaryAccuracyRate: number;
    photoQualityRating: number;
    punctualityScore: number;
    noShowRate: number;
    lateArrivalRate: number;
    totalEarnings: number;
    averageJobEarnings: number;
    partialPaymentsReceived: number;
    fullPaymentsReceived: number;
    performanceTrend: PerformanceTrend;
    lastJobCompletedAt?: Date;
    lastActiveAt: Date;
    totalFeedbackReceived: number;
    positiveFeedbackCount: number;
    negativeFeedbackCount: number;
    updatedAt: Date;
}
/**
 * Performance trend indicator
 */
export declare enum PerformanceTrend {
    IMPROVING = "IMPROVING",
    STABLE = "STABLE",
    DECLINING = "DECLINING",
    NEW = "NEW"
}
/**
 * Performance scoring weights configuration
 */
export interface ScoringWeightsConfig {
    completionRate: number;
    responseTime: number;
    qualityRating: number;
    punctuality: number;
    propertyOwnerFeedback: number;
}
/**
 * Job completion quality assessment
 */
export interface JobQualityAssessment {
    jobId: string;
    agentId: string;
    assessedBy: string;
    overallRating: number;
    boundaryAccuracy: number;
    photoQuality: number;
    punctuality: number;
    professionalism: number;
    arrivedOnTime: boolean;
    completedWithinTimeSlot: boolean;
    followedInstructions: boolean;
    respectfulBehavior: boolean;
    positiveComments?: string;
    improvementAreas?: string;
    wouldRecommend: boolean;
    assessedAt: Date;
}
/**
 * Agent performance badge/tier
 */
export declare enum AgentTier {
    ROOKIE = "ROOKIE",// 0-5 jobs, score < 3.5
    STANDARD = "STANDARD",// 5-20 jobs, score 3.5-4.0
    PROFESSIONAL = "PROFESSIONAL",// 20-50 jobs, score 4.0-4.5
    EXPERT = "EXPERT",// 50+ jobs, score 4.5-4.8
    ELITE = "ELITE"
}
/**
 * Performance milestone
 */
export interface PerformanceMilestone {
    type: MilestoneType;
    achieved: boolean;
    achievedAt?: Date;
    requirements: string;
    reward?: string;
}
/**
 * Milestone types
 */
export declare enum MilestoneType {
    FIRST_JOB = "FIRST_JOB",
    FIVE_JOBS = "FIVE_JOBS",
    TEN_JOBS = "TEN_JOBS",
    FIFTY_JOBS = "FIFTY_JOBS",
    HUNDRED_JOBS = "HUNDRED_JOBS",
    PERFECT_MONTH = "PERFECT_MONTH",// 100% completion rate for a month
    SPEED_DEMON = "SPEED_DEMON",// Consistently fast completion
    QUALITY_CHAMPION = "QUALITY_CHAMPION",// High quality ratings
    RELIABLE_STAR = "RELIABLE_STAR"
}
/**
 * Performance alert
 */
export interface PerformanceAlert {
    agentId: string;
    alertType: AlertType;
    severity: AlertSeverity;
    message: string;
    triggeredBy: string;
    threshold: number;
    currentValue: number;
    actionRequired?: string;
    createdAt: Date;
}
/**
 * Alert types
 */
export declare enum AlertType {
    LOW_COMPLETION_RATE = "LOW_COMPLETION_RATE",
    HIGH_CANCELLATION_RATE = "HIGH_CANCELLATION_RATE",
    SLOW_RESPONSE_TIME = "SLOW_RESPONSE_TIME",
    LOW_QUALITY_RATING = "LOW_QUALITY_RATING",
    HIGH_NO_SHOW_RATE = "HIGH_NO_SHOW_RATE",
    DECLINING_PERFORMANCE = "DECLINING_PERFORMANCE"
}
/**
 * Alert severity levels
 */
export declare enum AlertSeverity {
    INFO = "INFO",
    WARNING = "WARNING",
    CRITICAL = "CRITICAL"
}
/**
 * Performance improvement plan
 */
export interface PerformanceImprovementPlan {
    agentId: string;
    startDate: Date;
    endDate: Date;
    status: PIPStatus;
    identifiedIssues: string[];
    currentMetrics: {
        completionRate: number;
        qualityRating: number;
        responseTime: number;
    };
    targetMetrics: {
        completionRate: number;
        qualityRating: number;
        responseTime: number;
    };
    progressChecks: ProgressCheck[];
    finalOutcome?: PIPOutcome;
    createdBy: string;
    notes?: string;
}
/**
 * PIP status
 */
export declare enum PIPStatus {
    ACTIVE = "ACTIVE",
    COMPLETED_SUCCESS = "COMPLETED_SUCCESS",
    COMPLETED_FAILED = "COMPLETED_FAILED",
    CANCELLED = "CANCELLED"
}
/**
 * Progress check
 */
export interface ProgressCheck {
    date: Date;
    metrics: {
        completionRate: number;
        qualityRating: number;
        responseTime: number;
    };
    notes: string;
    isOnTrack: boolean;
}
/**
 * PIP outcome
 */
export declare enum PIPOutcome {
    TARGETS_MET = "TARGETS_MET",
    SIGNIFICANT_IMPROVEMENT = "SIGNIFICANT_IMPROVEMENT",
    MINIMAL_IMPROVEMENT = "MINIMAL_IMPROVEMENT",
    NO_IMPROVEMENT = "NO_IMPROVEMENT",
    AGENT_SUSPENDED = "AGENT_SUSPENDED"
}
/**
 * Agent ranking
 */
export interface AgentRanking {
    rank: number;
    agentId: string;
    agentName: string;
    reliabilityScore: number;
    tier: AgentTier;
    totalJobsCompleted: number;
    completionRate: number;
    averageRating: number;
    serviceAreas: string[];
}
/**
 * Performance comparison
 */
export interface PerformanceComparison {
    agentId: string;
    currentPeriod: AgentPerformanceMetrics;
    previousPeriod: AgentPerformanceMetrics;
    changes: {
        completionRate: number;
        responseTime: number;
        qualityRating: number;
        overallScore: number;
    };
    trend: PerformanceTrend;
}
/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
    position: number;
    agentId: string;
    agentName: string;
    score: number;
    category: LeaderboardCategory;
    periodStart: Date;
    periodEnd: Date;
}
/**
 * Leaderboard categories
 */
export declare enum LeaderboardCategory {
    OVERALL_SCORE = "OVERALL_SCORE",
    COMPLETION_RATE = "COMPLETION_RATE",
    QUALITY_RATING = "QUALITY_RATING",
    SPEED = "SPEED",
    TOTAL_JOBS = "TOTAL_JOBS"
}
declare const _default: {
    PerformanceTrend: typeof PerformanceTrend;
    AgentTier: typeof AgentTier;
    MilestoneType: typeof MilestoneType;
    AlertType: typeof AlertType;
    AlertSeverity: typeof AlertSeverity;
    PIPStatus: typeof PIPStatus;
    PIPOutcome: typeof PIPOutcome;
    LeaderboardCategory: typeof LeaderboardCategory;
};
export default _default;
//# sourceMappingURL=performance.d.ts.map