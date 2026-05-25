/**
 * Performance Scoring Utilities
 * Calculate and manage agent reliability scores
 */
interface AgentPerformanceMetrics {
    totalMarkingJobs: number;
    completedMarkingJobs: number;
    cancelledJobs: number;
    expiredJobs: number;
    averageCompletionTime?: number;
    onTimeCompletions: number;
    lateCompletions: number;
    customerRatings?: number[];
    disputedJobs: number;
}
interface PerformanceScore {
    score: number;
    breakdown: {
        completionRate: number;
        timelinessScore: number;
        reliabilityScore: number;
        customerRatingScore: number;
    };
    tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    description: string;
}
/**
 * Calculate comprehensive agent performance score
 * @param metrics - Agent performance metrics
 * @returns Performance score with breakdown
 */
export declare function calculatePerformanceScore(metrics: AgentPerformanceMetrics): PerformanceScore;
/**
 * Check if agent meets minimum requirements for job assignment
 * @param score - Agent's performance score
 * @param totalJobs - Total jobs completed
 * @returns True if agent meets requirements
 */
export declare function meetsMinimumRequirements(score: number, totalJobs: number): boolean;
/**
 * Calculate priority multiplier based on performance score
 * Higher performing agents get priority in queue
 * @param score - Agent's performance score
 * @returns Priority multiplier (0.5 to 1.5)
 */
export declare function getPriorityMultiplier(score: number): number;
/**
 * Update agent performance metrics after job completion
 * @param currentMetrics - Current agent metrics
 * @param jobOutcome - Outcome of the completed job
 * @returns Updated metrics
 */
export declare function updateMetricsAfterJob(currentMetrics: AgentPerformanceMetrics, jobOutcome: {
    completed: boolean;
    onTime: boolean;
    cancelled?: boolean;
    expired?: boolean;
    disputed?: boolean;
    customerRating?: number;
    completionTimeHours?: number;
}): AgentPerformanceMetrics;
/**
 * Get recommended actions for agent based on performance
 * @param score - Performance score
 * @returns Array of recommended actions
 */
export declare function getRecommendedActions(score: number): string[];
export {};
//# sourceMappingURL=performanceScoring.d.ts.map