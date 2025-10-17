import { PrismaClient, MarkingJobStatus, PropertyMarkingJob } from '@newcondo/db';

const prisma = new PrismaClient();

interface QueuePerformanceMetrics {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  averageCompletionTime: number; // in hours
  averageQueueTime: number; // in hours
  successRate: number; // percentage
  agentUtilization: number; // percentage
}

interface AgentPerformanceMetrics {
  agentId: string;
  agentName: string;
  totalAssignedJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  averageCompletionTime: number; // in hours
  reliabilityScore: number;
  successRate: number;
  totalEarnings: number;
}

interface TimeSlotAnalytics {
  totalTimeSlots: number;
  expiredTimeSlots: number;
  averageSlotUtilization: number; // percentage
  slotsCompletedOnTime: number;
  slotsExpired: number;
}

interface GeographicAnalytics {
  state: string;
  city: string;
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  averageCompletionTime: number;
  availableAgents: number;
}

interface RevenueAnalytics {
  totalMarkingRevenue: number;
  totalAgentPayouts: number;
  platformRevenue: number;
  averageJobValue: number;
  projectedMonthlyRevenue: number;
}

interface QueueTrendData {
  date: string;
  jobsCreated: number;
  jobsCompleted: number;
  jobsCancelled: number;
  averageQueueTime: number;
  averageCompletionTime: number;
}

export class QueueAnalyticsService {
  /**
   * Get overall queue performance metrics
   */
  async getQueuePerformanceMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<QueuePerformanceMetrics> {
    const whereClause: any = {};
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    // Get all jobs with filters
    const allJobs = await prisma.propertyMarkingJob.findMany({
      where: whereClause,
      include: {
        assignedAgent: true,
      },
    });

    const totalJobs = allJobs.length;
    const activeJobs = allJobs.filter(
      (job) => job.status === MarkingJobStatus.QUEUED || 
               job.status === MarkingJobStatus.ASSIGNED || 
               job.status === MarkingJobStatus.IN_PROGRESS
    ).length;
    const completedJobs = allJobs.filter(
      (job) => job.status === MarkingJobStatus.COMPLETED
    ).length;
    const cancelledJobs = allJobs.filter(
      (job) => job.status === MarkingJobStatus.CANCELLED
    ).length;
    const expiredJobs = allJobs.filter(
      (job) => job.status === MarkingJobStatus.EXPIRED
    ).length;

    // Calculate average completion time (only for completed jobs)
    const completedJobsData = allJobs.filter(
      (job) => job.status === MarkingJobStatus.COMPLETED && job.completedAt
    );
    
    let averageCompletionTime = 0;
    if (completedJobsData.length > 0) {
      const totalCompletionTime = completedJobsData.reduce((sum, job) => {
        const createdAt = job.createdAt.getTime();
        const completedAt = job.completedAt!.getTime();
        const hours = (completedAt - createdAt) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      averageCompletionTime = totalCompletionTime / completedJobsData.length;
    }

    // Calculate average queue time (time from creation to assignment)
    const assignedJobs = allJobs.filter(
      (job) => job.assignedAt && job.status !== MarkingJobStatus.QUEUED
    );
    
    let averageQueueTime = 0;
    if (assignedJobs.length > 0) {
      const totalQueueTime = assignedJobs.reduce((sum, job) => {
        const createdAt = job.createdAt.getTime();
        const assignedAt = job.assignedAt!.getTime();
        const hours = (assignedAt - createdAt) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      averageQueueTime = totalQueueTime / assignedJobs.length;
    }

    // Calculate success rate
    const successfulJobs = completedJobs;
    const totalProcessedJobs = completedJobs + cancelledJobs + expiredJobs;
    const successRate = totalProcessedJobs > 0 
      ? (successfulJobs / totalProcessedJobs) * 100 
      : 0;

    // Calculate agent utilization
    const totalAgents = await prisma.user.count({
      where: {
        isAvailableForMarking: true,
      },
    });

    const activeAgents = await prisma.propertyMarkingJob.groupBy({
      by: ['assignedAgentId'],
      where: {
        status: {
          in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS],
        },
      },
    });

    const agentUtilization = totalAgents > 0 
      ? (activeAgents.length / totalAgents) * 100 
      : 0;

    return {
      totalJobs,
      activeJobs,
      completedJobs,
      cancelledJobs,
      expiredJobs,
      averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
      averageQueueTime: Math.round(averageQueueTime * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      agentUtilization: Math.round(agentUtilization * 100) / 100,
    };
  }

  /**
   * Get performance metrics for all agents
   */
  async getAgentPerformanceMetrics(
    limit: number = 50,
    sortBy: 'completedJobs' | 'successRate' | 'reliabilityScore' = 'completedJobs'
  ): Promise<AgentPerformanceMetrics[]> {
    // Get all agents with marking jobs
    const agents = await prisma.user.findMany({
      where: {
        isAvailableForMarking: true,
      },
      include: {
        assignedMarkingJobs: {
          include: {
            property: true,
          },
        },
      },
    });

    const agentMetrics: AgentPerformanceMetrics[] = agents.map((agent) => {
      const jobs = agent.assignedMarkingJobs;
      const totalAssignedJobs = jobs.length;
      const completedJobs = jobs.filter(
        (job) => job.status === MarkingJobStatus.COMPLETED
      ).length;
      const cancelledJobs = jobs.filter(
        (job) => job.status === MarkingJobStatus.CANCELLED
      ).length;
      const expiredJobs = jobs.filter(
        (job) => job.status === MarkingJobStatus.EXPIRED
      ).length;

      // Calculate average completion time
      const completedJobsData = jobs.filter(
        (job) => job.status === MarkingJobStatus.COMPLETED && job.completedAt
      );

      let averageCompletionTime = 0;
      if (completedJobsData.length > 0) {
        const totalTime = completedJobsData.reduce((sum, job) => {
          const hours = 
            (job.completedAt!.getTime() - job.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0);
        averageCompletionTime = totalTime / completedJobsData.length;
      }

      // Calculate success rate
      const totalProcessedJobs = completedJobs + cancelledJobs + expiredJobs;
      const successRate = totalProcessedJobs > 0 
        ? (completedJobs / totalProcessedJobs) * 100 
        : 0;

      // Calculate total earnings (25% of marking fee)
      const totalEarnings = completedJobsData.reduce((sum, job) => {
        const agentShare = Number(job.markingFee) * 0.25;
        return sum + agentShare;
      }, 0);

      return {
        agentId: agent.id,
        agentName: agent.name || 'Unknown Agent',
        totalAssignedJobs,
        completedJobs,
        cancelledJobs,
        expiredJobs,
        averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
        reliabilityScore: Number(agent.agentReliabilityScore) || 0,
        successRate: Math.round(successRate * 100) / 100,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
      };
    });

    // Sort by specified criteria
    agentMetrics.sort((a, b) => {
      if (sortBy === 'completedJobs') {
        return b.completedJobs - a.completedJobs;
      } else if (sortBy === 'successRate') {
        return b.successRate - a.successRate;
      } else {
        return b.reliabilityScore - a.reliabilityScore;
      }
    });

    return agentMetrics.slice(0, limit);
  }

  /**
   * Get time slot analytics
   */
  async getTimeSlotAnalytics(startDate?: Date, endDate?: Date): Promise<TimeSlotAnalytics> {
    const whereClause: any = {
      assignedAt: { not: null },
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const jobs = await prisma.propertyMarkingJob.findMany({
      where: whereClause,
    });

    const totalTimeSlots = jobs.length;
    const expiredTimeSlots = jobs.filter(
      (job) => job.timeSlotExpiry && new Date() > job.timeSlotExpiry
    ).length;

    // Slots completed within 3-hour window
    const slotsCompletedOnTime = jobs.filter((job) => {
      if (!job.assignedAt || !job.completedAt || !job.timeSlotExpiry) return false;
      return job.completedAt <= job.timeSlotExpiry;
    }).length;

    const slotsExpired = jobs.filter(
      (job) => job.status === MarkingJobStatus.EXPIRED
    ).length;

    const averageSlotUtilization = totalTimeSlots > 0 
      ? (slotsCompletedOnTime / totalTimeSlots) * 100 
      : 0;

    return {
      totalTimeSlots,
      expiredTimeSlots,
      averageSlotUtilization: Math.round(averageSlotUtilization * 100) / 100,
      slotsCompletedOnTime,
      slotsExpired,
    };
  }

  /**
   * Get geographic analytics
   */
  async getGeographicAnalytics(): Promise<GeographicAnalytics[]> {
    const properties = await prisma.property.findMany({
      include: {
        markingJobs: true,
      },
    });

    // Group by state and city
    const locationMap = new Map<string, GeographicAnalytics>();

    for (const property of properties) {
      const key = `${property.state}-${property.city}`;
      
      if (!locationMap.has(key)) {
        locationMap.set(key, {
          state: property.state,
          city: property.city,
          totalJobs: 0,
          activeJobs: 0,
          completedJobs: 0,
          averageCompletionTime: 0,
          availableAgents: 0,
        });
      }

      const location = locationMap.get(key)!;
      const jobs = property.markingJobs;

      location.totalJobs += jobs.length;
      location.activeJobs += jobs.filter(
        (job) => job.status === MarkingJobStatus.ASSIGNED || 
                 job.status === MarkingJobStatus.IN_PROGRESS
      ).length;
      location.completedJobs += jobs.filter(
        (job) => job.status === MarkingJobStatus.COMPLETED
      ).length;

      // Calculate average completion time for this location
      const completedJobs = jobs.filter(
        (job) => job.status === MarkingJobStatus.COMPLETED && job.completedAt
      );

      if (completedJobs.length > 0) {
        const totalTime = completedJobs.reduce((sum, job) => {
          const hours = 
            (job.completedAt!.getTime() - job.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0);
        location.averageCompletionTime = totalTime / completedJobs.length;
      }
    }

    // Get available agents per location
    const agents = await prisma.user.findMany({
      where: {
        isAvailableForMarking: true,
      },
      select: {
        agentServiceAreas: true,
      },
    });

    for (const [key, location] of locationMap) {
      const cityAgents = agents.filter((agent) => {
        return agent.agentServiceAreas.some((area) => 
          area.toLowerCase().includes(location.city.toLowerCase()) ||
          area.toLowerCase().includes(location.state.toLowerCase())
        );
      });
      location.availableAgents = cityAgents.length;
    }

    return Array.from(locationMap.values()).sort((a, b) => b.totalJobs - a.totalJobs);
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(startDate?: Date, endDate?: Date): Promise<RevenueAnalytics> {
    const whereClause: any = {
      status: MarkingJobStatus.COMPLETED,
    };

    if (startDate || endDate) {
      whereClause.completedAt = {};
      if (startDate) whereClause.completedAt.gte = startDate;
      if (endDate) whereClause.completedAt.lte = endDate;
    }

    const completedJobs = await prisma.propertyMarkingJob.findMany({
      where: whereClause,
    });

    const totalMarkingRevenue = completedJobs.reduce(
      (sum, job) => sum + Number(job.markingFee),
      0
    );

    // Agent gets 25%, platform gets 75%
    const totalAgentPayouts = totalMarkingRevenue * 0.25;
    const platformRevenue = totalMarkingRevenue * 0.75;

    const averageJobValue = completedJobs.length > 0 
      ? totalMarkingRevenue / completedJobs.length 
      : 0;

    // Project monthly revenue based on current month's data
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();

    const monthlyJobs = await prisma.propertyMarkingJob.count({
      where: {
        status: MarkingJobStatus.COMPLETED,
        completedAt: {
          gte: monthStart,
        },
      },
    });

    const projectedMonthlyJobs = (monthlyJobs / daysPassed) * daysInMonth;
    const projectedMonthlyRevenue = projectedMonthlyJobs * averageJobValue * 0.75;

    return {
      totalMarkingRevenue: Math.round(totalMarkingRevenue * 100) / 100,
      totalAgentPayouts: Math.round(totalAgentPayouts * 100) / 100,
      platformRevenue: Math.round(platformRevenue * 100) / 100,
      averageJobValue: Math.round(averageJobValue * 100) / 100,
      projectedMonthlyRevenue: Math.round(projectedMonthlyRevenue * 100) / 100,
    };
  }

  /**
   * Get queue trend data over time
   */
  async getQueueTrendData(days: number = 30): Promise<QueueTrendData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const jobs = await prisma.propertyMarkingJob.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by date
    const trendMap = new Map<string, QueueTrendData>();

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      trendMap.set(dateKey, {
        date: dateKey,
        jobsCreated: 0,
        jobsCompleted: 0,
        jobsCancelled: 0,
        averageQueueTime: 0,
        averageCompletionTime: 0,
      });
    }

    for (const job of jobs) {
      const createdDateKey = job.createdAt.toISOString().split('T')[0];
      
      if (trendMap.has(createdDateKey)) {
        const trend = trendMap.get(createdDateKey)!;
        trend.jobsCreated++;
      }

      if (job.completedAt) {
        const completedDateKey = job.completedAt.toISOString().split('T')[0];
        if (trendMap.has(completedDateKey)) {
          const trend = trendMap.get(completedDateKey)!;
          trend.jobsCompleted++;
        }
      }

      if (job.status === MarkingJobStatus.CANCELLED) {
        const cancelledDateKey = job.updatedAt.toISOString().split('T')[0];
        if (trendMap.has(cancelledDateKey)) {
          const trend = trendMap.get(cancelledDateKey)!;
          trend.jobsCancelled++;
        }
      }
    }

    return Array.from(trendMap.values());
  }

  /**
   * Get real-time queue statistics
   */
  async getRealTimeQueueStats() {
    const [
      totalQueued,
      totalAssigned,
      totalInProgress,
      averageWaitTime,
      agentsOnline,
    ] = await Promise.all([
      prisma.propertyMarkingJob.count({
        where: { status: MarkingJobStatus.QUEUED },
      }),
      prisma.propertyMarkingJob.count({
        where: { status: MarkingJobStatus.ASSIGNED },
      }),
      prisma.propertyMarkingJob.count({
        where: { status: MarkingJobStatus.IN_PROGRESS },
      }),
      this.calculateAverageWaitTime(),
      prisma.user.count({
        where: {
          isAvailableForMarking: true,
        },
      }),
    ]);

    return {
      totalQueued,
      totalAssigned,
      totalInProgress,
      averageWaitTime,
      agentsOnline,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate average wait time for jobs in queue
   */
  private async calculateAverageWaitTime(): Promise<number> {
    const queuedJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: MarkingJobStatus.QUEUED,
      },
    });

    if (queuedJobs.length === 0) return 0;

    const now = new Date().getTime();
    const totalWaitTime = queuedJobs.reduce((sum, job) => {
      const waitTime = (now - job.createdAt.getTime()) / (1000 * 60); // in minutes
      return sum + waitTime;
    }, 0);

    return Math.round(totalWaitTime / queuedJobs.length);
  }
}

export const queueAnalyticsService = new QueueAnalyticsService();