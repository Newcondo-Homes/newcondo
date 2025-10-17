// backend/marking-service/src/services/performanceService.ts

import prisma from '@newcondo/db';
import { Decimal } from '@prisma/client/runtime/library';

interface PerformanceMetrics {
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  cancelledMarkingJobs: number;
  expiredMarkingJobs: number;
  averageCompletionTime: number; // in minutes
  onTimeCompletionRate: number; // percentage
  propertyOwnerConfirmationRate: number; // percentage of jobs confirmed by owners
  averageRating: number; // 0-5
  reliabilityScore: number; // 0-5
  lastMarkingJobDate: Date | null;
}

interface CompletionRecord {
  jobId: string;
  completedAt: Date;
  assignedAt: Date;
  confirmedByOwner: boolean;
}

interface AgentPerformanceUpdate {
  agentId: string;
  totalJobs: number;
  completedJobs: number;
  newReliabilityScore: Decimal;
}

/**
 * Performance Service - Handles agent reliability metrics and scoring
 * Used for agent qualification and queue prioritization
 */
export class PerformanceService {
  /**
   * Calculate comprehensive performance metrics for an agent
   */
  async getAgentPerformanceMetrics(
    agentId: string
  ): Promise<PerformanceMetrics> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: agentId },
      });

      if (!user) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      // Fetch all marking jobs for the agent
      const markingJobs = await prisma.propertyMarkingJob.findMany({
        where: {
          assignedAgentId: agentId,
        },
        include: {
          property: true,
          requestingUser: true,
        },
      });

      // Categorize jobs by status
      const completedJobs = markingJobs.filter(
        (job) => job.status === 'COMPLETED'
      );
      const cancelledJobs = markingJobs.filter(
        (job) => job.status === 'CANCELLED'
      );
      const expiredJobs = markingJobs.filter(
        (job) => job.status === 'EXPIRED'
      );

      // Calculate average completion time (for completed jobs)
      const completionTimes = completedJobs
        .map((job) => {
          if (job.assignedAt && job.completedAt) {
            return (
              (job.completedAt.getTime() - job.assignedAt.getTime()) /
              (1000 * 60)
            );
          }
          return 0;
        })
        .filter((time) => time > 0);

      const averageCompletionTime =
        completionTimes.length > 0
          ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
          : 0;

      // Calculate on-time completion rate (within 3-hour window)
      const onTimeCompletions = completedJobs.filter((job) => {
        if (!job.assignedAt || !job.completedAt || !job.timeSlotExpiry) {
          return false;
        }
        return job.completedAt <= job.timeSlotExpiry;
      }).length;

      const onTimeCompletionRate =
        completedJobs.length > 0
          ? (onTimeCompletions / completedJobs.length) * 100
          : 0;

      // Calculate property owner confirmation rate
      // This tracks if property owners confirmed the marking work
      const confirmedJobs = completedJobs.filter((job) => {
        // Assuming confirmation is tracked via job status progression
        // or via completion verification
        return job.completedAt !== null;
      }).length;

      const propertyOwnerConfirmationRate =
        completedJobs.length > 0
          ? (confirmedJobs / completedJobs.length) * 100
          : 0;

      // Calculate reliability score based on multiple factors
      const reliabilityScore = this.calculateReliabilityScore({
        totalJobs: markingJobs.length,
        completedJobs: completedJobs.length,
        cancelledJobs: cancelledJobs.length,
        expiredJobs: expiredJobs.length,
        onTimeCompletionRate,
        propertyOwnerConfirmationRate,
      });

      const lastMarkingJobDate = markingJobs.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )[0]?.createdAt;

      return {
        totalMarkingJobs: markingJobs.length,
        completedMarkingJobs: completedJobs.length,
        cancelledMarkingJobs: cancelledJobs.length,
        expiredMarkingJobs: expiredJobs.length,
        averageCompletionTime,
        onTimeCompletionRate,
        propertyOwnerConfirmationRate,
        averageRating: 0, // Placeholder for future rating system
        reliabilityScore,
        lastMarkingJobDate,
      };
    } catch (error) {
      console.error(
        `Error calculating performance metrics for agent ${agentId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Calculate reliability score (0-5 scale)
   * Factors:
   * - Completion rate (40%)
   * - On-time performance (35%)
   * - Owner confirmation rate (25%)
   */
  private calculateReliabilityScore(metrics: {
    totalJobs: number;
    completedJobs: number;
    cancelledJobs: number;
    expiredJobs: number;
    onTimeCompletionRate: number;
    propertyOwnerConfirmationRate: number;
  }): number {
    if (metrics.totalJobs === 0) {
      return 3.0; // Default score for new agents
    }

    // Completion rate (40% weight)
    const completionRate =
      (metrics.completedJobs / metrics.totalJobs) * 100;
    const completionScore = (completionRate / 100) * 5 * 0.4;

    // On-time performance (35% weight)
    const onTimeScore = (metrics.onTimeCompletionRate / 100) * 5 * 0.35;

    // Owner confirmation rate (25% weight)
    const confirmationScore =
      (metrics.propertyOwnerConfirmationRate / 100) * 5 * 0.25;

    // Penalty for cancellations and expirations
    const penaltyRate =
      (metrics.cancelledJobs + metrics.expiredJobs) / metrics.totalJobs;
    const penalty = Math.min(penaltyRate * 1.5, 1.0); // Max 1 point penalty

    const totalScore = completionScore + onTimeScore + confirmationScore;
    const finalScore = Math.max(0, Math.min(5, totalScore - penalty));

    return Math.round(finalScore * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Update agent performance in database
   * Called after job completion
   */
  async updateAgentPerformance(
    agentId: string
  ): Promise<AgentPerformanceUpdate> {
    try {
      const metrics = await this.getAgentPerformanceMetrics(agentId);

      // Update user record with new metrics
      const updatedUser = await prisma.user.update({
        where: { id: agentId },
        data: {
          totalMarkingJobs: metrics.totalMarkingJobs,
          completedMarkingJobs: metrics.completedMarkingJobs,
          agentReliabilityScore: new Decimal(metrics.reliabilityScore),
        },
      });

      return {
        agentId,
        totalJobs: metrics.totalMarkingJobs,
        completedJobs: metrics.completedMarkingJobs,
        newReliabilityScore: updatedUser.agentReliabilityScore || new Decimal(0),
      };
    } catch (error) {
      console.error(`Error updating performance for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get agents ranked by reliability score
   * Used for agent qualification in queue assignment
   */
  async getTopPerformingAgents(
    limit: number = 10,
    minReliabilityScore: number = 2.5
  ): Promise<
    Array<{
      id: string;
      name: string;
      reliabilityScore: number;
      completedJobs: number;
      serviceAreas: string[];
    }>
  > {
    try {
      const topAgents = await prisma.user.findMany({
        where: {
          role: 'AGENT',
          isAvailableForMarking: true,
          agentReliabilityScore: {
            gte: new Decimal(minReliabilityScore),
          },
        },
        select: {
          id: true,
          name: true,
          agentReliabilityScore: true,
          completedMarkingJobs: true,
          agentServiceAreas: true,
        },
        orderBy: {
          agentReliabilityScore: 'desc',
        },
        take: limit,
      });

      return topAgents.map((agent) => ({
        id: agent.id,
        name: agent.name || 'Unknown',
        reliabilityScore: agent.agentReliabilityScore
          ? parseFloat(agent.agentReliabilityScore.toString())
          : 0,
        completedJobs: agent.completedMarkingJobs,
        serviceAreas: agent.agentServiceAreas,
      }));
    } catch (error) {
      console.error('Error fetching top performing agents:', error);
      throw error;
    }
  }

  /**
   * Disqualify agent from new marking jobs if reliability score drops below threshold
   */
  async checkAgentQualification(agentId: string): Promise<boolean> {
    try {
      const metrics = await this.getAgentPerformanceMetrics(agentId);

      // Minimum reliability score threshold
      const MIN_QUALIFICATION_SCORE = 2.0;

      if (metrics.reliabilityScore < MIN_QUALIFICATION_SCORE) {
        // Disable agent from receiving new marking jobs
        await prisma.user.update({
          where: { id: agentId },
          data: {
            isAvailableForMarking: false,
          },
        });

        console.warn(
          `Agent ${agentId} disqualified - reliability score: ${metrics.reliabilityScore}`
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error checking qualification for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Re-qualify agent if they improve performance
   */
  async requalifyAgent(agentId: string): Promise<boolean> {
    try {
      const metrics = await this.getAgentPerformanceMetrics(agentId);

      // Threshold for re-qualification
      const REQUALIFICATION_SCORE = 3.0;

      if (metrics.reliabilityScore >= REQUALIFICATION_SCORE) {
        await prisma.user.update({
          where: { id: agentId },
          data: {
            isAvailableForMarking: true,
          },
        });

        console.info(
          `Agent ${agentId} re-qualified - reliability score: ${metrics.reliabilityScore}`
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error re-qualifying agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get performance analytics for dashboard/admin panel
   */
  async getPlatformPerformanceAnalytics(): Promise<{
    totalActiveAgents: number;
    averagePlatformReliabilityScore: number;
    topAgents: Array<{
      id: string;
      name: string;
      reliabilityScore: number;
    }>;
    agentsNeedingSupport: Array<{
      id: string;
      name: string;
      reliabilityScore: number;
      reason: string;
    }>;
  }> {
    try {
      const activeAgents = await prisma.user.findMany({
        where: {
          role: 'AGENT',
          isAvailableForMarking: true,
        },
        select: {
          id: true,
          name: true,
          agentReliabilityScore: true,
          totalMarkingJobs: true,
        },
      });

      const avgScore =
        activeAgents.length > 0
          ? activeAgents.reduce(
              (sum, agent) =>
                sum + (agent.agentReliabilityScore?.toNumber() || 0),
              0
            ) / activeAgents.length
          : 0;

      const topAgents = activeAgents
        .sort(
          (a, b) =>
            (b.agentReliabilityScore?.toNumber() || 0) -
            (a.agentReliabilityScore?.toNumber() || 0)
        )
        .slice(0, 5)
        .map((agent) => ({
          id: agent.id,
          name: agent.name || 'Unknown',
          reliabilityScore: agent.agentReliabilityScore?.toNumber() || 0,
        }));

      const agentsNeedingSupport = activeAgents
        .filter((agent) => {
          const score = agent.agentReliabilityScore?.toNumber() || 0;
          return score < 3.0 && agent.totalMarkingJobs > 5;
        })
        .map((agent) => ({
          id: agent.id,
          name: agent.name || 'Unknown',
          reliabilityScore: agent.agentReliabilityScore?.toNumber() || 0,
          reason:
            agent.agentReliabilityScore?.toNumber() || 0 < 2.5
              ? 'Below minimum threshold'
              : 'Performance declining',
        }));

      return {
        totalActiveAgents: activeAgents.length,
        averagePlatformReliabilityScore: Math.round(avgScore * 100) / 100,
        topAgents,
        agentsNeedingSupport,
      };
    } catch (error) {
      console.error(
        'Error fetching platform performance analytics:',
        error
      );
      throw error;
    }
  }
}

export default new PerformanceService();