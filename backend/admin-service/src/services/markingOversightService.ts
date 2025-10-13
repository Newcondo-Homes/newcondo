// backend/admin-service/src/services/markingOversightService.ts

import { PrismaClient } from "@newcondo/db";
import {
  PropertyMarkingJob,
  MarkingJobStatus,
  User,
  UrgencyLevel,
} from "@newcondo/db";

interface MarkingOversightStats {
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  expiredJobs: number;
  averageCompletionTime: number;
  agentPerformanceMetrics: AgentMetrics[];
  overallCompletionRate: number;
}

interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalJobsAssigned: number;
  completedJobs: number;
  pendingJobs: number;
  averageCompletionTime: number;
  completionRate: number;
  reliabilityScore: number;
  lastActivity: Date;
}

interface MarkingJobAlert {
  jobId: string;
  propertyId: string;
  status: string;
  assignedAgent: User | null;
  timeSlotExpiry: Date | null;
  urgencyLevel: UrgencyLevel;
  flagged: boolean;
  reason?: string;
}

class MarkingOversightService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get comprehensive marking job oversight statistics
   */
  async getMarkingOversightStats(
    filters?: {
      startDate?: Date;
      endDate?: Date;
      state?: string;
      agentId?: string;
    }
  ): Promise<MarkingOversightStats> {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate)
        where.createdAt.gte = filters.startDate;
      if (filters.endDate)
        where.createdAt.lte = filters.endDate;
    }

    if (filters?.agentId) {
      where.assignedAgentId = filters.agentId;
    }

    const allJobs = await this.prisma.propertyMarkingJob.findMany({
      where,
      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
            agentReliabilityScore: true,
            completedMarkingJobs: true,
            totalMarkingJobs: true,
          },
        },
        property: {
          select: {
            state: true,
            city: true,
          },
        },
      },
    });

    const completedJobs = allJobs.filter(
      (j) => j.status === MarkingJobStatus.COMPLETED
    );
    const pendingJobs = allJobs.filter(
      (j) =>
        j.status === MarkingJobStatus.ASSIGNED ||
        j.status === MarkingJobStatus.IN_PROGRESS
    );
    const expiredJobs = allJobs.filter(
      (j) => j.status === MarkingJobStatus.EXPIRED
    );

    const completionTimes = completedJobs
      .filter((j) => j.completedAt && j.createdAt)
      .map(
        (j) =>
          (new Date(j.completedAt!).getTime() -
            new Date(j.createdAt).getTime()) /
          (1000 * 60 * 60)
      );

    const avgCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;

    const agentMetrics = await this.getAgentPerformanceMetrics(
      allJobs,
      filters?.startDate,
      filters?.endDate
    );

    const completionRate =
      allJobs.length > 0 ? (completedJobs.length / allJobs.length) * 100 : 0;

    return {
      totalJobs: allJobs.length,
      completedJobs: completedJobs.length,
      pendingJobs: pendingJobs.length,
      expiredJobs: expiredJobs.length,
      averageCompletionTime: Math.round(avgCompletionTime * 100) / 100,
      agentPerformanceMetrics: agentMetrics,
      overallCompletionRate:
        Math.round(completionRate * 100) / 100,
    };
  }

  /**
   * Get individual agent performance metrics
   */
  private async getAgentPerformanceMetrics(
    jobs: any[],
    startDate?: Date,
    endDate?: Date
  ): Promise<AgentMetrics[]> {
    const agentMap = new Map<string, AgentMetrics>();

    for (const job of jobs) {
      if (!job.assignedAgent) continue;

      const agentId = job.assignedAgent.id;
      if (!agentMap.has(agentId)) {
        agentMap.set(agentId, {
          agentId,
          agentName: job.assignedAgent.name || "Unknown",
          totalJobsAssigned: 0,
          completedJobs: 0,
          pendingJobs: 0,
          averageCompletionTime: 0,
          completionRate: 0,
          reliabilityScore: Number(job.assignedAgent.agentReliabilityScore) || 0,
          lastActivity: new Date(0),
        });
      }

      const metrics = agentMap.get(agentId)!;
      metrics.totalJobsAssigned++;

      if (job.status === MarkingJobStatus.COMPLETED) {
        metrics.completedJobs++;
      } else if (
        job.status === MarkingJobStatus.ASSIGNED ||
        job.status === MarkingJobStatus.IN_PROGRESS
      ) {
        metrics.pendingJobs++;
      }

      if (job.updatedAt > metrics.lastActivity) {
        metrics.lastActivity = job.updatedAt;
      }
    }

    const metricsArray = Array.from(agentMap.values());

    for (const metrics of metricsArray) {
      metrics.completionRate =
        metrics.totalJobsAssigned > 0
          ? (metrics.completedJobs / metrics.totalJobsAssigned) * 100
          : 0;

      const agentJobs = jobs.filter(
        (j) => j.assignedAgent?.id === metrics.agentId
      );
      const completionTimes = agentJobs
        .filter(
          (j) =>
            j.status === MarkingJobStatus.COMPLETED &&
            j.completedAt &&
            j.createdAt
        )
        .map(
          (j) =>
            (new Date(j.completedAt).getTime() -
              new Date(j.createdAt).getTime()) /
            (1000 * 60 * 60)
        );

      metrics.averageCompletionTime =
        completionTimes.length > 0
          ? Math.round(
              (completionTimes.reduce((a, b) => a + b, 0) /
                completionTimes.length) *
                100
            ) / 100
          : 0;
    }

    return metricsArray.sort((a, b) => b.completionRate - a.completionRate);
  }

  /**
   * Identify critical marking jobs requiring admin intervention
   */
  async getAlertedMarkingJobs(): Promise<MarkingJobAlert[]> {
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    const jobs = await this.prisma.propertyMarkingJob.findMany({
      where: {
        OR: [
          { status: MarkingJobStatus.EXPIRED },
          {
            AND: [
              { timeSlotExpiry: { lte: now } },
              {
                status: {
                  in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS],
                },
              },
            ],
          },
          {
            AND: [
              { urgencyLevel: UrgencyLevel.URGENT },
              { status: MarkingJobStatus.QUEUED },
            ],
          },
          {
            AND: [
              { maxCompletionTime: { lte: now } },
              {
                status: {
                  in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS],
                },
              },
            ],
          },
        ],
      },
      include: {
        assignedAgent: true,
      },
    });

    return jobs.map((job) => {
      const reasons: string[] = [];

      if (job.status === MarkingJobStatus.EXPIRED) {
        reasons.push("Job expired");
      }

      if (job.timeSlotExpiry && job.timeSlotExpiry <= now) {
        reasons.push("Time slot expired");
      }

      if (job.maxCompletionTime && job.maxCompletionTime <= now) {
        reasons.push("Max completion time exceeded");
      }

      if (job.urgencyLevel === UrgencyLevel.URGENT && job.status === MarkingJobStatus.QUEUED) {
        reasons.push("Urgent job still queued");
      }

      return {
        jobId: job.id,
        propertyId: job.propertyId,
        status: job.status,
        assignedAgent: job.assignedAgent,
        timeSlotExpiry: job.timeSlotExpiry,
        urgencyLevel: job.urgencyLevel,
        flagged: true,
        reason: reasons.join("; "),
      };
    });
  }

  /**
   * Get marking jobs by agent for performance monitoring
   */
  async getAgentMarkingJobHistory(
    agentId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: MarkingJobStatus;
    }
  ) {
    const jobs = await this.prisma.propertyMarkingJob.findMany({
      where: {
        assignedAgentId: agentId,
        ...(options?.status && { status: options.status }),
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true,
          },
        },
        requestingUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return jobs;
  }

  /**
   * Calculate agent reliability score based on performance
   */
  async updateAgentReliabilityScore(agentId: string): Promise<number> {
    const agentJobs = await this.prisma.propertyMarkingJob.findMany({
      where: { assignedAgentId: agentId },
    });

    const completedJobs = agentJobs.filter(
      (j) => j.status === MarkingJobStatus.COMPLETED
    ).length;
    const expiredJobs = agentJobs.filter(
      (j) => j.status === MarkingJobStatus.EXPIRED
    ).length;
    const totalJobs = agentJobs.length;

    if (totalJobs === 0) return 0;

    const completionRate = (completedJobs / totalJobs) * 100;
    const reliabilityScore = (completionRate - (expiredJobs / totalJobs) * 100) / 20;

    const clampedScore = Math.max(0, Math.min(5, reliabilityScore));

    await this.prisma.user.update({
      where: { id: agentId },
      data: {
        agentReliabilityScore: clampedScore,
        completedMarkingJobs: completedJobs,
        totalMarkingJobs: totalJobs,
      },
    });

    return clampedScore;
  }

  /**
   * Monitor and flag underperforming agents
   */
  async getUnderperformingAgents(threshold: number = 50): Promise<AgentMetrics[]> {
    const stats = await this.getMarkingOversightStats();
    return stats.agentPerformanceMetrics.filter(
      (agent) => agent.completionRate < threshold
    );
  }

  /**
   * Get marking job distribution by region
   */
  async getMarkingJobDistribution() {
    const distribution = await this.prisma.propertyMarkingJob.groupBy({
      by: ["propertyId"],
      _count: {
        id: true,
      },
    });

    const properties = await this.prisma.property.findMany({
      where: {
        id: {
          in: distribution.map((d) => d.propertyId),
        },
      },
      select: {
        id: true,
        state: true,
        city: true,
      },
    });

    const stateDistribution: Record<string, number> = {};
    for (const prop of properties) {
      const key = `${prop.state} (${prop.city})`;
      stateDistribution[key] =
        (stateDistribution[key] || 0) +
        (distribution.find((d) => d.propertyId === prop.id)?._count.id || 0);
    }

    return stateDistribution;
  }
}

export default MarkingOversightService;