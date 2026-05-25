"use strict";
/**
 * Performance Scoring Utilities
 * Calculate and manage agent reliability scores
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePerformanceScore = calculatePerformanceScore;
exports.meetsMinimumRequirements = meetsMinimumRequirements;
exports.getPriorityMultiplier = getPriorityMultiplier;
exports.updateMetricsAfterJob = updateMetricsAfterJob;
exports.getRecommendedActions = getRecommendedActions;
/**
 * Calculate comprehensive agent performance score
 * @param metrics - Agent performance metrics
 * @returns Performance score with breakdown
 */
function calculatePerformanceScore(metrics) {
    const completionRate = calculateCompletionRate(metrics);
    const timelinessScore = calculateTimelinessScore(metrics);
    const reliabilityScore = calculateReliabilityScore(metrics);
    const customerRatingScore = calculateCustomerRatingScore(metrics);
    // Weighted average: Completion (35%), Timeliness (25%), Reliability (25%), Ratings (15%)
    const score = completionRate * 0.35 +
        timelinessScore * 0.25 +
        reliabilityScore * 0.25 +
        customerRatingScore * 0.15;
    const tier = getPerformanceTier(score);
    const description = getScoreDescription(score);
    return {
        score: Number(score.toFixed(2)),
        breakdown: {
            completionRate,
            timelinessScore,
            reliabilityScore,
            customerRatingScore,
        },
        tier,
        description,
    };
}
/**
 * Calculate completion rate score (0-5)
 */
function calculateCompletionRate(metrics) {
    if (metrics.totalMarkingJobs === 0) {
        return 3.0; // Neutral score for new agents
    }
    const rate = metrics.completedMarkingJobs / metrics.totalMarkingJobs;
    // Convert rate to 0-5 scale
    if (rate >= 0.95)
        return 5.0;
    if (rate >= 0.9)
        return 4.5;
    if (rate >= 0.85)
        return 4.0;
    if (rate >= 0.8)
        return 3.5;
    if (rate >= 0.75)
        return 3.0;
    if (rate >= 0.7)
        return 2.5;
    if (rate >= 0.6)
        return 2.0;
    if (rate >= 0.5)
        return 1.5;
    return 1.0;
}
/**
 * Calculate timeliness score based on on-time completions (0-5)
 */
function calculateTimelinessScore(metrics) {
    const totalCompletions = metrics.onTimeCompletions + metrics.lateCompletions;
    if (totalCompletions === 0) {
        return 3.0; // Neutral score for new agents
    }
    const onTimeRate = metrics.onTimeCompletions / totalCompletions;
    if (onTimeRate >= 0.95)
        return 5.0;
    if (onTimeRate >= 0.9)
        return 4.5;
    if (onTimeRate >= 0.85)
        return 4.0;
    if (onTimeRate >= 0.8)
        return 3.5;
    if (onTimeRate >= 0.75)
        return 3.0;
    if (onTimeRate >= 0.7)
        return 2.5;
    if (onTimeRate >= 0.6)
        return 2.0;
    return 1.0;
}
/**
 * Calculate reliability score based on cancellations and expiries (0-5)
 */
function calculateReliabilityScore(metrics) {
    if (metrics.totalMarkingJobs === 0) {
        return 3.0; // Neutral score for new agents
    }
    const problematicJobs = metrics.cancelledJobs + metrics.expiredJobs + metrics.disputedJobs;
    const problematicRate = problematicJobs / metrics.totalMarkingJobs;
    // Lower problematic rate = higher score
    if (problematicRate <= 0.02)
        return 5.0;
    if (problematicRate <= 0.05)
        return 4.5;
    if (problematicRate <= 0.08)
        return 4.0;
    if (problematicRate <= 0.1)
        return 3.5;
    if (problematicRate <= 0.15)
        return 3.0;
    if (problematicRate <= 0.2)
        return 2.5;
    if (problematicRate <= 0.25)
        return 2.0;
    return 1.0;
}
/**
 * Calculate customer rating score (0-5)
 */
function calculateCustomerRatingScore(metrics) {
    if (!metrics.customerRatings || metrics.customerRatings.length === 0) {
        return 3.0; // Neutral score for agents without ratings
    }
    const sum = metrics.customerRatings.reduce((acc, rating) => acc + rating, 0);
    const average = sum / metrics.customerRatings.length;
    return Number(average.toFixed(2));
}
/**
 * Get performance tier based on score
 */
function getPerformanceTier(score) {
    if (score >= 4.5)
        return 'PLATINUM';
    if (score >= 3.5)
        return 'GOLD';
    if (score >= 2.5)
        return 'SILVER';
    return 'BRONZE';
}
/**
 * Get human-readable description of score
 */
function getScoreDescription(score) {
    if (score >= 4.5)
        return 'Excellent - Highly reliable agent';
    if (score >= 4.0)
        return 'Very Good - Consistently reliable';
    if (score >= 3.5)
        return 'Good - Generally reliable';
    if (score >= 3.0)
        return 'Average - Acceptable performance';
    if (score >= 2.0)
        return 'Below Average - Needs improvement';
    return 'Poor - Requires attention';
}
/**
 * Check if agent meets minimum requirements for job assignment
 * @param score - Agent's performance score
 * @param totalJobs - Total jobs completed
 * @returns True if agent meets requirements
 */
function meetsMinimumRequirements(score, totalJobs) {
    // New agents (< 5 jobs) are given a chance
    if (totalJobs < 5)
        return true;
    // Established agents must maintain minimum score of 2.0
    return score >= 2.0;
}
/**
 * Calculate priority multiplier based on performance score
 * Higher performing agents get priority in queue
 * @param score - Agent's performance score
 * @returns Priority multiplier (0.5 to 1.5)
 */
function getPriorityMultiplier(score) {
    if (score >= 4.5)
        return 1.5; // Platinum agents get 50% priority boost
    if (score >= 4.0)
        return 1.3; // Gold agents get 30% priority boost
    if (score >= 3.5)
        return 1.2; // Silver+ agents get 20% priority boost
    if (score >= 3.0)
        return 1.0; // Average agents - no boost
    if (score >= 2.5)
        return 0.9; // Below average - slight penalty
    return 0.8; // Poor performers - 20% penalty
}
/**
 * Update agent performance metrics after job completion
 * @param currentMetrics - Current agent metrics
 * @param jobOutcome - Outcome of the completed job
 * @returns Updated metrics
 */
function updateMetricsAfterJob(currentMetrics, jobOutcome) {
    const updated = { ...currentMetrics };
    updated.totalMarkingJobs += 1;
    if (jobOutcome.completed) {
        updated.completedMarkingJobs += 1;
        if (jobOutcome.onTime) {
            updated.onTimeCompletions += 1;
        }
        else {
            updated.lateCompletions += 1;
        }
        if (jobOutcome.completionTimeHours !== undefined) {
            const currentAvg = updated.averageCompletionTime || 0;
            const count = updated.completedMarkingJobs;
            updated.averageCompletionTime =
                (currentAvg * (count - 1) + jobOutcome.completionTimeHours) / count;
        }
        if (jobOutcome.customerRating !== undefined) {
            updated.customerRatings = updated.customerRatings || [];
            updated.customerRatings.push(jobOutcome.customerRating);
        }
    }
    if (jobOutcome.cancelled) {
        updated.cancelledJobs += 1;
    }
    if (jobOutcome.expired) {
        updated.expiredJobs += 1;
    }
    if (jobOutcome.disputed) {
        updated.disputedJobs += 1;
    }
    return updated;
}
/**
 * Get recommended actions for agent based on performance
 * @param score - Performance score
 * @returns Array of recommended actions
 */
function getRecommendedActions(score) {
    const actions = [];
    if (score < 2.0) {
        actions.push('Performance review required');
        actions.push('Additional training recommended');
        actions.push('Limited job assignment');
    }
    else if (score < 3.0) {
        actions.push('Monitor performance closely');
        actions.push('Provide feedback and support');
    }
    else if (score >= 4.5) {
        actions.push('Eligible for bonus incentives');
        actions.push('Priority job assignment');
        actions.push('Featured agent status');
    }
    return actions;
}
//# sourceMappingURL=performanceScoring.js.map