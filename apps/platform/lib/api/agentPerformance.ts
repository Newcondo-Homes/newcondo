/**
 * Agent Performance API Client
 * Handles agent performance metrics, reliability scoring, and analytics
 * Location: apps/platform/lib/api/agentPerformance.ts
 */

import client from './client';

// Types for performance tracking
export interface AgentPerformanceMetrics {
  agentId: string;
  agentName: string;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  completionRate: number; // percentage
  averageCompletionTime: number; // in minutes
  onTimeCompletionRate: number; // percentage
  reliabilityScore: number; // 0.00 to 5.00
  averageRating: number; // 1 to 5 stars
  totalRatings: number;
  acceptanceRate: number; // percentage of jobs accepted vs offered
  declineRate: number; // percentage of jobs declined
  averageResponseTime: number; // in minutes
  cancelledJobs: number;
  expiredTimeSlots: number;
}

export interface PerformanceHistory {
  date: Date;
  jobsCompleted: number;
  jobsOffered: number;
  averageCompletionTime: number;
  onTimeCount: number;
  averageRating: number;
}

export interface ReliabilityScoreBreakdown {
  completionRate: {
    weight: number; // percentage weight in final score
    contribution: number; // actual contribution to score
    value: number; // raw value
  };
  onTimeRate: {
    weight: number;
    contribution: number;
    value: number;
  };
  acceptanceRate: {
    weight: number;
    contribution: number;
    value: number;
  };
  customerRating: {
    weight: number;
    contribution: number;
    value: number;
  };
  totalScore: number;
}

export interface AgentRating {
  jobId: string;
  ratedBy: string; // property owner ID
  rating: number; // 1 to 5 stars
  review: string;
  ratedAt: Date;
  tags?: string[]; // e.g., ["professional", "on-time", "friendly"]
}

export interface PerformanceTrend {
  period: 'daily' | 'weekly' | 'monthly';
  data: PerformanceHistory[];
  trend: 'improving' | 'stable' | 'declining';
  trendPercentage: number;
}

export interface TopPerformingAgents {
  agentId: string;
  agentName: string;
  reliabilityScore: number;
  completedJobs: number;
  averageRating: number;
  rank: number;
}

export interface AgentLeaderboard {
  period: 'weekly' | 'monthly' | 'allTime';
  topAgents: TopPerformingAgents[];
  totalAgents: number;
  generatedAt: Date;
}

/**
 * Get comprehensive performance metrics for a specific agent
 * @param agentId - Agent user ID
 * @returns Complete performance metrics
 */
export async function getAgentPerformanceMetrics(
  agentId: string
): Promise<AgentPerformanceMetrics> {
  try {
    const response = await client.get(`/marking-service/agents/${agentId}/performance`);
    return response.data as AgentPerformanceMetrics;
  } catch (error) {
    throw new Error(`Failed to fetch agent performance metrics: ${error}`);
  }
}

/**
 * Get reliability score breakdown for an agent
 * Shows how different factors contribute to overall score
 * @param agentId - Agent user ID
 * @returns Breakdown of reliability score calculation
 */
export async function getReliabilityScoreBreakdown(
  agentId: string
): Promise<ReliabilityScoreBreakdown> {
  try {
    const response = await client.get(
      `/marking-service/agents/${agentId}/reliability-score/breakdown`
    );
    return response.data as ReliabilityScoreBreakdown;
  } catch (error) {
    throw new Error(`Failed to fetch reliability score breakdown: ${error}`);
  }
}

/**
 * Get performance history for an agent over time
 * @param agentId - Agent user ID
 * @param period - Time period to fetch ('daily', 'weekly', 'monthly')
 * @param days - Number of days to look back (default: 30)
 * @returns Historical performance data
 */
export async function getPerformanceHistory(
  agentId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  days: number = 30
): Promise<PerformanceHistory[]> {
  try {
    const response = await client.get(
      `/marking-service/agents/${agentId}/performance/history?period=${period}&days=${days}`
    );
    return response.data as PerformanceHistory[];
  } catch (error) {
    throw new Error(`Failed to fetch performance history: ${error}`);
  }
}

/**
 * Get performance trend analysis
 * Analyzes if agent performance is improving, stable, or declining
 * @param agentId - Agent user ID
 * @param period - Period for trend analysis
 * @returns Trend data with direction and percentage
 */
export async function getPerformanceTrend(
  agentId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
): Promise<PerformanceTrend> {
  try {
    const response = await client.get(
      `/marking-service/agents/${agentId}/performance/trend?period=${period}`
    );
    return response.data as PerformanceTrend;
  } catch (error) {
    throw new Error(`Failed to fetch performance trend: ${error}`);
  }
}

/**
 * Get all ratings for an agent
 * @param agentId - Agent user ID
 * @param limit - Number of ratings to fetch
 * @param offset - Pagination offset
 * @returns Array of ratings
 */
export async function getAgentRatings(
  agentId: string,
  limit: number = 10,
  offset: number = 0
): Promise<{
  total: number;
  ratings: AgentRating[];
  averageRating: number;
}> {
  try {
    const response = await client.get(
      `/marking-service/agents/${agentId}/ratings?limit=${limit}&offset=${offset}`
    );
    return response.data as {
      total: number;
      ratings: AgentRating[];
      averageRating: number;
    };
  } catch (error) {
    throw new Error(`Failed to fetch agent ratings: ${error}`);
  }
}

/**
 * Submit a rating for an agent after marking job completion
 * Called by property owner after job completion
 * @param agentId - Agent user ID
 * @param jobId - Completed marking job ID
 * @param rating - Rating from 1 to 5
 * @param review - Optional written review
 * @param tags - Optional performance tags
 * @returns Confirmation response
 */
export async function submitAgentRating(
  agentId: string,
  jobId: string,
  rating: number,
  review?: string,
  tags?: string[]
): Promise<{
  success: boolean;
  message: string;
  averageRatingUpdated: number;
}> {
  try {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const response = await client.post(`/marking-service/agents/${agentId}/rate`, {
      jobId,
      rating,
      review,
      tags,
      ratedAt: new Date().toISOString(),
    });
    return response.data as {
      success: boolean;
      message: string;
      averageRatingUpdated: number;
    };
  } catch (error) {
    throw new Error(`Failed to submit agent rating: ${error}`);
  }
}

/**
 * Get agent leaderboard
 * Shows top performing agents based on reliability score
 * @param period - Time period for leaderboard ('weekly', 'monthly', 'allTime')
 * @param limit - Number of top agents to return
 * @returns Leaderboard data
 */
export async function getAgentLeaderboard(
  period: 'weekly' | 'monthly' | 'allTime' = 'monthly',
  limit: number = 10
): Promise<AgentLeaderboard> {
  try {
    const response = await client.get(
      `/marking-service/leaderboard?period=${period}&limit=${limit}`
    );
    return response.data as AgentLeaderboard;
  } catch (error) {
    throw new Error(`Failed to fetch agent leaderboard: ${error}`);
  }
}

/**
 * Check if an agent is eligible for premium opportunities
 * Agents above reliability threshold get priority in job assignments
 * @param agentId - Agent user ID
 * @param minReliabilityScore - Minimum score required (default: 4.0)
 * @returns Eligibility status
 */
export async function checkPremiumEligibility(
  agentId: string,
  minReliabilityScore: number = 4.0
): Promise<{
  isEligible: boolean;
  currentScore: number;
  scoreGap: number;
  monthsToNextEvaluation: number;
}> {
  try {
    const response = await client.get(
      `/marking-service/agents/${agentId}/premium-eligibility?minScore=${minReliabilityScore}`
    );
    return response.data as {
      isEligible: boolean;
      currentScore: number;
      scoreGap: number;
      monthsToNextEvaluation: number;
    };
  } catch (error) {
    throw new Error(`Failed to check premium eligibility: ${error}`);
  }
}

/**
 * Get performance badge/achievement data for an agent
 * Used for gamification and recognition
 * @param agentId - Agent user ID
 * @returns Array of earned badges and achievements
 */
export async function getAgentAchievements(
  agentId: string
): Promise<{
  badges: Array<{
    name: string;
    description: string;
    icon: string;
    unlockedAt: Date;
  }>;
  totalPoints: number;
  level: number;
}> {
  try {
    const response = await client.get(`/marking-service/agents/${agentId}/achievements`);
    return response.data as {
      badges: Array<{
        name: string;
        description: string;
        icon: string;
        unlockedAt: Date;
      }>;
      totalPoints: number;
      level: number;
    };
  } catch (error) {
    throw new Error(`Failed to fetch agent achievements: ${error}`);
  }
}

/**
 * Get performance comparison between agents
 * Admin/analytics feature
 * @param agentIds - Array of agent IDs to compare
 * @returns Comparative metrics
 */
export async function compareAgentPerformance(
  agentIds: string[]
): Promise<{
  agents: AgentPerformanceMetrics[];
  topPerformer: string;
  lowestPerformer: string;
  averageMetrics: Partial<AgentPerformanceMetrics>;
}> {
  try {
    const response = await client.post(`/marking-service/agents/compare-performance`, {
      agentIds,
    });
    return response.data as {
      agents: AgentPerformanceMetrics[];
      topPerformer: string;
      lowestPerformer: string;
      averageMetrics: Partial<AgentPerformanceMetrics>;
    };
  } catch (error) {
    throw new Error(`Failed to compare agent performance: ${error}`);
  }
}

/**
 * Get agent performance report for a date range
 * Used for monthly/periodic evaluations
 * @param agentId - Agent user ID
 * @param startDate - Report start date
 * @param endDate - Report end date
 * @returns Detailed performance report
 */
export async function getPerformanceReport(
  agentId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  agentId: string;
  agentName: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: AgentPerformanceMetrics;
  highlights: string[];
  areasForImprovement: string[];
  recommendations: string[];
  generatedAt: Date;
}> {
  try {
    const response = await client.get(`/marking-service/agents/${agentId}/performance/report`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
    return response.data as {
      agentId: string;
      agentName: string;
      period: {
        start: Date;
        end: Date;
      };
      metrics: AgentPerformanceMetrics;
      highlights: string[];
      areasForImprovement: string[];
      recommendations: string[];
      generatedAt: Date;
    };
  } catch (error) {
    throw new Error(`Failed to fetch performance report: ${error}`);
  }
}

/**
 * Update agent availability status
 * Affects whether agent receives new job opportunities
 * @param agentId - Agent user ID
 * @param isAvailable - Availability status
 * @param reason - Optional reason for status change
 * @returns Updated status confirmation
 */
export async function updateAgentAvailability(
  agentId: string,
  isAvailable: boolean,
  reason?: string
): Promise<{
  success: boolean;
  message: string;
  previousStatus: boolean;
  newStatus: boolean;
}> {
  try {
    const response = await client.post(
      `/marking-service/agents/${agentId}/availability`,
      {
        isAvailable,
        reason,
        updatedAt: new Date().toISOString(),
      }
    );
    return response.data as {
      success: boolean;
      message: string;
      previousStatus: boolean;
      newStatus: boolean;
    };
  } catch (error) {
    throw new Error(`Failed to update agent availability: ${error}`);
  }
}

/**
 * Get service area coverage for an agent
 * Shows geographic areas where agent operates
 * @param agentId - Agent user ID
 * @returns Service area details
 */
export async function getAgentServiceAreas(
  agentId: string
): Promise<{
  agentId: string;
  serviceAreas: Array<{
    state: string;
    cities: string[];
  }>;
  maxOperatingRadius: number; // in kilometers
}> {
  try {
    const response = await client.get(`/marking-service/agents/${agentId}/service-areas`);
    return response.data as {
      agentId: string;
      serviceAreas: Array<{
        state: string;
        cities: string[];
      }>;
      maxOperatingRadius: number; // in kilometers
    };
  } catch (error) {
    throw new Error(`Failed to fetch agent service areas: ${error}`);
  }
}

/**
 * Get average completion metrics by location
 * Helps optimize agent assignment
 * @param agentId - Agent user ID
 * @returns Completion metrics by location
 */
export async function getCompletionMetricsByLocation(
  agentId: string
): Promise<{
  agentId: string;
  metrics: Array<{
    location: string;
    jobsCompleted: number;
    averageCompletionTime: number;
    onTimeRate: number;
    averageRating: number;
  }>;
}> {
  try {
    const response = await client.get(
      `/marking-service/agents/${agentId}/performance/by-location`
    );
    return response.data as {
      agentId: string;
      metrics: Array<{
        location: string;
        jobsCompleted: number;
        averageCompletionTime: number;
        onTimeRate: number;
        averageRating: number;
      }>;
    };
  } catch (error) {
    throw new Error(`Failed to fetch location-based metrics: ${error}`);
  }
}