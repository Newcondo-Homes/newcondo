// apps/platform/lib/utils/performanceCalculations.ts

/**
 * Performance Calculations Utility
 * Handles agent reliability scoring, performance metrics, and ranking calculations
 */

// Performance constants
export const MAX_RELIABILITY_SCORE = 5.0;
export const MIN_RELIABILITY_SCORE = 0.0;
export const INITIAL_RELIABILITY_SCORE = 4.0;
export const MIN_JOBS_FOR_SCORE = 3; // Minimum jobs before score is meaningful

// Weight factors for reliability calculation
export const WEIGHTS = {
  completionRate: 0.35,      // 35% weight
  timelinessScore: 0.25,     // 25% weight
  confirmationRate: 0.25,    // 25% weight
  responseTime: 0.15,        // 15% weight
};

/**
 * Calculate agent reliability score (0.00 to 5.00)
 */
export function calculateReliabilityScore(metrics: {
  totalJobs: number;
  completedJobs: number;
  onTimeCompletions: number;
  confirmedJobs: number;
  averageResponseMinutes: number;
  cancelledJobs?: number;
}): number {
  const {
    totalJobs,
    completedJobs,
    onTimeCompletions,
    confirmedJobs,
    averageResponseMinutes,
    cancelledJobs = 0,
  } = metrics;

  // Return initial score if not enough jobs
  if (totalJobs < MIN_JOBS_FOR_SCORE) {
    return INITIAL_RELIABILITY_SCORE;
  }

  // Calculate individual scores
  const completionRate = calculateCompletionRate(completedJobs, totalJobs, cancelledJobs);
  const timelinessScore = calculateTimelinessScore(onTimeCompletions, completedJobs);
  const confirmationRate = calculateConfirmationRate(confirmedJobs, completedJobs);
  const responseScore = calculateResponseScore(averageResponseMinutes);

  // Calculate weighted score
  const weightedScore = 
    (completionRate * WEIGHTS.completionRate) +
    (timelinessScore * WEIGHTS.timelinessScore) +
    (confirmationRate * WEIGHTS.confirmationRate) +
    (responseScore * WEIGHTS.responseTime);

  // Scale to 0-5 range and round to 2 decimals
  const finalScore = weightedScore * MAX_RELIABILITY_SCORE;
  return Math.max(MIN_RELIABILITY_SCORE, Math.min(MAX_RELIABILITY_SCORE, parseFloat(finalScore.toFixed(2))));
}

/**
 * Calculate completion rate (0-1)
 */
export function calculateCompletionRate(
  completedJobs: number,
  totalJobs: number,
  cancelledJobs: number = 0
): number {
  if (totalJobs === 0) return 0;
  
  // Penalize cancellations more heavily
  const effectiveCompleted = completedJobs - (cancelledJobs * 0.5);
  const rate = effectiveCompleted / totalJobs;
  
  return Math.max(0, Math.min(1, rate));
}

/**
 * Calculate timeliness score (0-1)
 */
export function calculateTimelinessScore(
  onTimeCompletions: number,
  completedJobs: number
): number {
  if (completedJobs === 0) return 0;
  
  return onTimeCompletions / completedJobs;
}

/**
 * Calculate confirmation rate (0-1)
 */
export function calculateConfirmationRate(
  confirmedJobs: number,
  completedJobs: number
): number {
  if (completedJobs === 0) return 0;
  
  return confirmedJobs / completedJobs;
}

/**
 * Calculate response time score (0-1)
 * Lower response time = higher score
 */
export function calculateResponseScore(averageResponseMinutes: number): number {
  // Optimal response time: within 30 minutes = 1.0
  // Acceptable: up to 120 minutes = 0.5
  // Poor: over 240 minutes = 0.0
  
  if (averageResponseMinutes <= 30) return 1.0;
  if (averageResponseMinutes >= 240) return 0.0;
  
  // Linear interpolation between 30 and 240 minutes
  return 1 - ((averageResponseMinutes - 30) / 210);
}

/**
 * Get reliability score label
 */
export function getReliabilityLabel(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 4.5) {
    return {
      label: 'Excellent',
      color: 'green',
      description: 'Top performing agent with exceptional reliability',
    };
  }
  
  if (score >= 4.0) {
    return {
      label: 'Very Good',
      color: 'blue',
      description: 'Highly reliable agent with consistent performance',
    };
  }
  
  if (score >= 3.5) {
    return {
      label: 'Good',
      color: 'cyan',
      description: 'Reliable agent with solid track record',
    };
  }
  
  if (score >= 3.0) {
    return {
      label: 'Satisfactory',
      color: 'yellow',
      description: 'Adequate performance with room for improvement',
    };
  }
  
  if (score >= 2.0) {
    return {
      label: 'Needs Improvement',
      color: 'orange',
      description: 'Below average performance, improvement needed',
    };
  }
  
  return {
    label: 'Poor',
    color: 'red',
    description: 'Significant performance issues, may face restrictions',
  };
}

/**
 * Calculate agent ranking score for queue prioritization
 * Higher score = higher priority in queue
 */
export function calculateQueuePriorityScore(metrics: {
  reliabilityScore: number;
  totalCompletedJobs: number;
  responseTimeMinutes: number;
  proximityKm: number;
}): number {
  const {
    reliabilityScore,
    totalCompletedJobs,
    responseTimeMinutes,
    proximityKm,
  } = metrics;

  // Factor weights
  const reliabilityWeight = 0.40;  // 40%
  const experienceWeight = 0.20;   // 20%
  const speedWeight = 0.20;        // 20%
  const proximityWeight = 0.20;    // 20%

  // Normalize reliability score (0-5 to 0-1)
  const reliabilityNorm = reliabilityScore / MAX_RELIABILITY_SCORE;

  // Normalize experience (cap at 50 jobs = 1.0)
  const experienceNorm = Math.min(totalCompletedJobs / 50, 1.0);

  // Normalize response speed (30 min = 1.0, 240 min = 0.0)
  const speedNorm = Math.max(0, Math.min(1, 1 - (responseTimeMinutes - 30) / 210));

  // Normalize proximity (0km = 1.0, 20km = 0.0)
  const proximityNorm = Math.max(0, Math.min(1, 1 - (proximityKm / 20)));

  // Calculate weighted priority score
  const priorityScore = 
    (reliabilityNorm * reliabilityWeight) +
    (experienceNorm * experienceWeight) +
    (speedNorm * speedWeight) +
    (proximityNorm * proximityWeight);

  return parseFloat((priorityScore * 100).toFixed(2)); // Return as 0-100 score
}

/**
 * Calculate success rate percentage
 */
export function calculateSuccessRate(completedJobs: number, totalJobs: number): number {
  if (totalJobs === 0) return 0;
  
  return parseFloat(((completedJobs / totalJobs) * 100).toFixed(2));
}

/**
 * Calculate average completion time in hours
 */
export function calculateAverageCompletionTime(
  completionTimes: number[] // Array of completion times in minutes
): number {
  if (completionTimes.length === 0) return 0;
  
  const totalMinutes = completionTimes.reduce((sum, time) => sum + time, 0);
  const avgMinutes = totalMinutes / completionTimes.length;
  
  return parseFloat((avgMinutes / 60).toFixed(2)); // Return in hours
}

/**
 * Determine if agent qualifies for premium jobs
 */
export function qualifiesForPremiumJobs(reliabilityScore: number, completedJobs: number): boolean {
  return reliabilityScore >= 4.0 && completedJobs >= 10;
}

/**
 * Calculate penalty for late completion
 */
export function calculateLatePenalty(minutesLate: number): number {
  // Penalty: 0.1 points per 30 minutes late, max 1.0 point penalty
  const penaltyPoints = Math.min(1.0, (minutesLate / 30) * 0.1);
  return parseFloat(penaltyPoints.toFixed(2));
}

/**
 * Calculate bonus for early completion
 */
export function calculateEarlyBonus(minutesEarly: number): number {
  // Bonus: 0.05 points per 30 minutes early, max 0.5 point bonus
  const bonusPoints = Math.min(0.5, (minutesEarly / 30) * 0.05);
  return parseFloat(bonusPoints.toFixed(2));
}

/**
 * Update reliability score after job completion
 */
export function updateReliabilityScoreAfterJob(
  currentScore: number,
  wasOnTime: boolean,
  wasConfirmed: boolean,
  totalJobs: number
): number {
  // Newer jobs have more impact (recency bias)
  const recencyFactor = Math.min(0.2, 1 / Math.sqrt(totalJobs));
  
  let adjustment = 0;
  
  // On-time completion bonus/penalty
  if (wasOnTime) {
    adjustment += 0.1;
  } else {
    adjustment -= 0.15;
  }
  
  // Confirmation bonus/penalty
  if (wasConfirmed) {
    adjustment += 0.1;
  } else {
    adjustment -= 0.2;
  }
  
  // Apply recency factor
  adjustment *= recencyFactor;
  
  // Update score
  const newScore = currentScore + adjustment;
  
  return Math.max(MIN_RELIABILITY_SCORE, Math.min(MAX_RELIABILITY_SCORE, parseFloat(newScore.toFixed(2))));
}

/**
 * Format reliability score for display
 */
export function formatReliabilityScore(score: number): string {
  return `${score.toFixed(2)}/5.00`;
}

/**
 * Calculate earnings for an agent
 */
export function calculateAgentEarnings(markingFee: number, commissionRate: number = 0.25): {
  agentCommission: number;
  platformFee: number;
} {
  const agentCommission = parseFloat((markingFee * commissionRate).toFixed(2));
  const platformFee = parseFloat((markingFee - agentCommission).toFixed(2));
  
  return {
    agentCommission,
    platformFee,
  };
}

/**
 * Calculate estimated earnings for display
 */
export function formatEstimatedEarnings(markingFee: number, commissionRate: number = 0.25): string {
  const { agentCommission } = calculateAgentEarnings(markingFee, commissionRate);
  return `₦${agentCommission.toLocaleString()}`;
}

/**
 * Performance metrics summary
 */
export interface PerformanceMetrics {
  reliabilityScore: number;
  reliabilityLabel: string;
  successRate: number;
  completionRate: number;
  timelinessRate: number;
  confirmationRate: number;
  averageResponseTime: number;
  totalJobs: number;
  completedJobs: number;
  qualifiesForPremium: boolean;
}

export function calculatePerformanceMetrics(agentData: {
  reliabilityScore?: number;
  totalJobs: number;
  completedJobs: number;
  onTimeCompletions: number;
  confirmedJobs: number;
  averageResponseMinutes: number;
  cancelledJobs?: number;
}): PerformanceMetrics {
  const score = agentData.reliabilityScore || calculateReliabilityScore(agentData);
  const { label } = getReliabilityLabel(score);
  
  return {
    reliabilityScore: score,
    reliabilityLabel: label,
    successRate: calculateSuccessRate(agentData.completedJobs, agentData.totalJobs),
    completionRate: calculateCompletionRate(agentData.completedJobs, agentData.totalJobs, agentData.cancelledJobs),
    timelinessRate: calculateTimelinessScore(agentData.onTimeCompletions, agentData.completedJobs) * 100,
    confirmationRate: calculateConfirmationRate(agentData.confirmedJobs, agentData.completedJobs) * 100,
    averageResponseTime: agentData.averageResponseMinutes,
    totalJobs: agentData.totalJobs,
    completedJobs: agentData.completedJobs,
    qualifiesForPremium: qualifiesForPremiumJobs(score, agentData.completedJobs),
  };
}