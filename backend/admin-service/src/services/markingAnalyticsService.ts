// backend/admin-service/src/services/markingAnalyticsService.ts

import { PrismaClient, MarkingJobStatus } from '@newcondo/db';

const prisma = new PrismaClient();

interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

class MarkingAnalyticsService {
  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(agentId: string, dateRange: DateRange = {}) {
    const where: any = {
      assignedAgentId: agentId
    };

    if (dateRange.startDate || dateRange.endDate) {
      where.createdAt = {};
      if (dateRange.startDate) {
        where.createdAt.gte = dateRange.startDate;
      }
      if (dateRange.endDate) {
        where.createdAt.lte = dateRange.endDate;
      }
    }

    // Get agent details
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        agentReliabilityScore: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true,
        agentServiceAreas: true,
        isAvailableForMarking: true
      }
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Get job statistics
    const [totalJobs, completedJobs, cancelledJobs, inProgressJobs] = await Promise.all([
      prisma.propertyMarkingJob.count({ where }),
      prisma.propertyMarkingJob.count({
        where: { ...where, status: MarkingJobStatus.COMPLETED }
      }),
      prisma.propertyMarkingJob.count({
        where: { ...where, status: MarkingJobStatus.CANCELLED }
      }),
      prisma.propertyMarkingJob.count({
        where: {
          ...where,
          status: {
            in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS]
          }
        }
      })
    ]);

    // Calculate completion rate
    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    // Get average completion time
    const completedJobsWithTime = await prisma.propertyMarkingJob.findMany({
      where: {
        ...where,
        status: MarkingJobStatus.COMPLETED,
        assignedAt: { not: null },
        completedAt: { not: null }
      },
      select: {
        assignedAt: true,
        completedAt: true
      }
    });

    const totalCompletionTime = completedJobsWithTime.reduce((sum, job) => {
      if (job.assignedAt && job.completedAt) {
        return sum + (job.completedAt.getTime() - job.assignedAt.getTime());
      }
      return sum;
    }, 0);

    const averageCompletionHours = completedJobsWithTime.length > 0
      ? (totalCompletionTime / completedJobsWithTime.length) / (1000 * 60 * 60)
      : 0;

    // Get expired/timeout jobs
    const now = new Date();
    const expiredJobs = await prisma.propertyMarkingJob.count({
      where: {
        ...where,
        status: MarkingJobStatus.ASSIGNED,
        timeSlotExpiry: { lte: now }
      }
    });

    // Calculate earnings
    const completedJobsWithPayment = await prisma.propertyMarkingJob.findMany({
      where: {
        ...where,
        status: MarkingJobStatus.COMPLETED
      },
      select: {
        markingFee: true
      }
    });

    const totalEarnings = completedJobsWithPayment.reduce((sum, job) => {
      // Agent gets 25% of marking fee
      return sum + (Number(job.markingFee) * 0.25);
    }, 0);

    // Get jobs by location
    const jobsByLocation = await prisma.propertyMarkingJob.groupBy({
      by: ['propertyId'],
      where,
      _count: true
    });

    const locationStats = await prisma.property.findMany({
      where: {
        id: {
          in: jobsByLocation.map(j => j.propertyId)
        }
      },
      select: {
        city: true,
        state: true
      }
    });

    const locationCounts = locationStats.reduce((acc, prop) => {
      const key = `${prop.city}, ${prop.state}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get recent jobs
    const recentJobs = await prisma.propertyMarkingJob.findMany({
      where,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            title: true,
            address: true,
            city: true,
            state: true
          }
        }
      }
    });

    return {
      agent,
      statistics: {
        totalJobs,
        completedJobs,
        cancelledJobs,
        inProgressJobs,
        expiredJobs,
        completionRate: Math.round(completionRate * 10) / 10,
        averageCompletionHours: Math.round(averageCompletionHours * 10) / 10,
        totalEarnings: Math.round(totalEarnings * 100) / 100
      },
      locationDistribution: locationCounts,
      recentJobs
    };
  }

  /**
   * Get overall marking analytics
   */
  async getMarkingAnalytics(dateRange: DateRange = {}, groupBy: 'day' | 'week' | 'month' = 'day') {
    const where: any = {};

    if (dateRange.startDate || dateRange.endDate) {
      where.createdAt = {};
      if (dateRange.startDate) {
        where.createdAt.gte = dateRange.startDate;
      }
      if (dateRange.endDate) {
        where.createdAt.lte = dateRange.endDate;
      }
    }

    // Get overall statistics
    const [
      totalJobs,
      queuedJobs,
      assignedJobs,
      inProgressJobs,
      completedJobs,
      cancelledJobs,
      expiredJobs
    ] = await Promise.all([
      prisma.propertyMarkingJob.count({ where }),
      prisma.propertyMarkingJob.count({
        where: { ...where, status: MarkingJobStatus.QUEUED }
      }),
      prisma.propertyMarkingJob.count({
        where: { ...where, status: MarkingJobStatus.ASSIGNED }
      }),
      prisma.propertyMarkingJob.count({
        where: { ...where, status: MarkingJobStatus.IN_PROGRESS }
      }),
      prisma.propertyMarkingJob.count({
        where: { ...where, status: MarkingJobStatus.COMPLETED }
      }),
      prisma.propertyMarkingJob.count({
        where: { ...where, status: MarkingJobStatus.CANCELLED }
      }),
      prisma.propertyMarkingJob.count({
        where: { ...where, status: MarkingJobStatus.EXPIRED }
      })
    ]);

    // Calculate revenue
    const allJobs = await prisma.propertyMarkingJob.findMany({
      where,
      select: {
        markingFee: true,
        status: true
      }
    });

    const totalRevenue = allJobs.reduce((sum, job) => {
      return sum + Number(job.markingFee);
    }, 0);

    const completedRevenue = allJobs
      .filter(job => job.status === MarkingJobStatus.COMPLETED)
      .reduce((sum, job) => {
        // Platform keeps 75% of marking fee
        return sum + (Number(job.markingFee) * 0.75);
      }, 0);

    const agentPayout = allJobs
      .filter(job => job.status === MarkingJobStatus.COMPLETED)
      .reduce((sum, job) => {
        // Agents get 25% of marking fee
        return sum + (Number(job.markingFee) * 0.25);
      }, 0);

    // Get jobs by urgency level
    const jobsByUrgency = await prisma.propertyMarkingJob.groupBy({
      by: ['urgencyLevel'],
      where,
      _count: true
    });

    const urgencyDistribution = jobsByUrgency.reduce((acc, item) => {
      acc[item.urgencyLevel] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Get active agents
    const activeAgents = await prisma.user.count({
      where: {
        isAvailableForMarking: true,
        role: { in: ['AGENT', 'RENTER'] }
      }
    });

    // Get top performing agents
    const topAgents = await prisma.user.findMany({
      where: {
        isAvailableForMarking: true,
        completedMarkingJobs: { gt: 0 }
      },
      orderBy: [
        { agentReliabilityScore: 'desc' },
        { completedMarkingJobs: 'desc' }
      ],
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true,
        agentReliabilityScore: true
      }
    });

    // Get time series data
    const timeSeriesData = await this.getTimeSeriesData(where, groupBy);

    // Get location distribution
    const jobsWithLocation = await prisma.propertyMarkingJob.findMany({
      where,
      include: {
        property: {
          select: {
            city: true,
            state: true
          }
        }
      }
    });

    const locationDistribution = jobsWithLocation.reduce((acc, job) => {
      const key = `${job.property.city}, ${job.property.state}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get average metrics
    const completedJobsWithTimes = await prisma.propertyMarkingJob.findMany({
      where: {
        ...where,
        status: MarkingJobStatus.COMPLETED,
        assignedAt: { not: null },
        completedAt: { not: null }
      },
      select: {
        assignedAt: true,
        completedAt: true,
        createdAt: true
      }
    });

    const avgCompletionTime = completedJobsWithTimes.length > 0
      ? completedJobsWithTimes.reduce((sum, job) => {
          if (job.assignedAt && job.completedAt) {
            return sum + (job.completedAt.getTime() - job.assignedAt.getTime());
          }
          return sum;
        }, 0) / completedJobsWithTimes.length / (1000 * 60 * 60)
      : 0;

    const avgWaitTime = completedJobsWithTimes.length > 0
      ? completedJobsWithTimes.reduce((sum, job) => {
          if (job.assignedAt) {
            return sum + (job.assignedAt.getTime() - job.createdAt.getTime());
          }
          return sum;
        }, 0) / completedJobsWithTimes.length / (1000 * 60 * 60)
      : 0;

    return {
      overview: {
        totalJobs,
        queuedJobs,
        assignedJobs,
        inProgressJobs,
        completedJobs,
        cancelledJobs,
        expiredJobs,
        activeAgents,
        completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0
      },
      revenue: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        completedRevenue: Math.round(completedRevenue * 100) / 100,
        agentPayout: Math.round(agentPayout * 100) / 100,
        platformProfit: Math.round((completedRevenue - agentPayout) * 100) / 100
      },
      distribution: {
        urgency: urgencyDistribution,
        location: Object.entries(locationDistribution)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {} as Record<string, number>)
      },
      averages: {
        completionTimeHours: Math.round(avgCompletionTime * 10) / 10,
        waitTimeHours: Math.round(avgWaitTime * 10) / 10
      },
      topAgents,
      timeSeries: timeSeriesData
    };
  }

  /**
   * Get time series data for charts
   */
  private async getTimeSeriesData(where: any, groupBy: 'day' | 'week' | 'month') {
    const jobs = await prisma.propertyMarkingJob.findMany({
      where,
      select: {
        createdAt: true,
        status: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group jobs by time period
    const grouped = jobs.reduce((acc, job) => {
      let key: string;
      const date = new Date(job.createdAt);

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!acc[key]) {
        acc[key] = {
          period: key,
          total: 0,
          completed: 0,
          cancelled: 0,
          queued: 0
        };
      }

      acc[key].total++;
      if (job.status === MarkingJobStatus.COMPLETED) {
        acc[key].completed++;
      } else if (job.status === MarkingJobStatus.CANCELLED) {
        acc[key].cancelled++;
      } else if (job.status === MarkingJobStatus.QUEUED) {
        acc[key].queued++;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  }

  /**
   * Get marking service health metrics
   */
  async getServiceHealthMetrics() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Jobs in the last 24 hours
    const last24HoursJobs = await prisma.propertyMarkingJob.count({
      where: {
        createdAt: { gte: oneDayAgo }
      }
    });

    // Jobs in the last week
    const lastWeekJobs = await prisma.propertyMarkingJob.count({
      where: {
        createdAt: { gte: oneWeekAgo }
      }
    });

    // Stuck jobs (assigned for more than 3 hours without progress)
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const stuckJobs = await prisma.propertyMarkingJob.count({
      where: {
        status: MarkingJobStatus.ASSIGNED,
        assignedAt: { lte: threeHoursAgo }
      }
    });

    // Overdue jobs (past max completion time)
    const overdueJobs = await prisma.propertyMarkingJob.count({
      where: {
        status: {
          in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS]
        },
        maxCompletionTime: { lte: now }
      }
    });

    // Queue backlog
    const queueBacklog = await prisma.propertyMarkingJob.count({
      where: {
        status: MarkingJobStatus.QUEUED
      }
    });

    // Average queue wait time
    const queuedJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: MarkingJobStatus.QUEUED
      },
      select: {
        createdAt: true
      }
    });

    const avgQueueWaitHours = queuedJobs.length > 0
      ? queuedJobs.reduce((sum, job) => {
          return sum + (now.getTime() - job.createdAt.getTime());
        }, 0) / queuedJobs.length / (1000 * 60 * 60)
      : 0;

    // Agent availability
    const [totalAgents, availableAgents, activeAgents] = await Promise.all([
      prisma.user.count({
        where: {
          role: { in: ['AGENT', 'RENTER'] }
        }
      }),
      prisma.user.count({
        where: {
          role: { in: ['AGENT', 'RENTER'] },
          isAvailableForMarking: true
        }
      }),
      prisma.user.count({
        where: {
          role: { in: ['AGENT', 'RENTER'] },
          isAvailableForMarking: true,
          assignedMarkingJobs: {
            some: {
              status: {
                in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS]
              }
            }
          }
        }
      })
    ]);

    // Success rate (last 7 days)
    const lastWeekCompleted = await prisma.propertyMarkingJob.count({
      where: {
        createdAt: { gte: oneWeekAgo },
        status: MarkingJobStatus.COMPLETED
      }
    });

    const successRate = lastWeekJobs > 0 ? (lastWeekCompleted / lastWeekJobs) * 100 : 0;

    return {
      activity: {
        last24Hours: last24HoursJobs,
        lastWeek: lastWeekJobs
      },
      queue: {
        backlog: queueBacklog,
        averageWaitHours: Math.round(avgQueueWaitHours * 10) / 10
      },
      issues: {
        stuckJobs,
        overdueJobs
      },
      agents: {
        total: totalAgents,
        available: availableAgents,
        active: activeAgents,
        utilizationRate: availableAgents > 0 ? (activeAgents / availableAgents) * 100 : 0
      },
      performance: {
        successRate: Math.round(successRate * 10) / 10
      },
      healthScore: this.calculateHealthScore({
        stuckJobs,
        overdueJobs,
        queueBacklog,
        avgQueueWaitHours,
        successRate,
        availableAgents
      })
    };
  }

  /**
   * Calculate overall service health score (0-100)
   */
  private calculateHealthScore(metrics: {
    stuckJobs: number;
    overdueJobs: number;
    queueBacklog: number;
    avgQueueWaitHours: number;
    successRate: number;
    availableAgents: number;
  }): number {
    let score = 100;

    // Deduct points for stuck jobs
    score -= metrics.stuckJobs * 5;

    // Deduct points for overdue jobs
    score -= metrics.overdueJobs * 3;

    // Deduct points for large queue backlog
    if (metrics.queueBacklog > 50) {
      score -= 10;
    } else if (metrics.queueBacklog > 20) {
      score -= 5;
    }

    // Deduct points for long queue wait times
    if (metrics.avgQueueWaitHours > 48) {
      score -= 15;
    } else if (metrics.avgQueueWaitHours > 24) {
      score -= 10;
    } else if (metrics.avgQueueWaitHours > 12) {
      score -= 5;
    }

    // Deduct points for low success rate
    if (metrics.successRate < 50) {
      score -= 20;
    } else if (metrics.successRate < 70) {
      score -= 10;
    }

    // Deduct points for low agent availability
    if (metrics.availableAgents < 5) {
      score -= 15;
    } else if (metrics.availableAgents < 10) {
      score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get marking service financial summary
   */
  async getFinancialSummary(dateRange: DateRange = {}) {
    const where: any = {};

    if (dateRange.startDate || dateRange.endDate) {
      where.completedAt = {};
      if (dateRange.startDate) {
        where.completedAt.gte = dateRange.startDate;
      }
      if (dateRange.endDate) {
        where.completedAt.lte = dateRange.endDate;
      }
    }

    where.status = MarkingJobStatus.COMPLETED;

    const completedJobs = await prisma.propertyMarkingJob.findMany({
      where,
      select: {
        markingFee: true,
        completedAt: true
      }
    });

    const totalRevenue = completedJobs.reduce((sum, job) => {
      return sum + Number(job.markingFee);
    }, 0);

    const agentPayouts = completedJobs.reduce((sum, job) => {
      return sum + (Number(job.markingFee) * 0.25);
    }, 0);

    const platformRevenue = completedJobs.reduce((sum, job) => {
      return sum + (Number(job.markingFee) * 0.75);
    }, 0);

    // Get refunds
    const refundedJobs = await prisma.propertyMarkingJob.count({
      where: {
        ...where,
        status: MarkingJobStatus.CANCELLED,
        paymentStatus: 'REFUNDED'
      }
    });

    const refundedAmount = await prisma.propertyMarkingJob.aggregate({
      where: {
        status: MarkingJobStatus.CANCELLED,
        paymentStatus: 'REFUNDED',
        ...(dateRange.startDate && { completedAt: { gte: dateRange.startDate } }),
        ...(dateRange.endDate && { completedAt: { lte: dateRange.endDate } })
      },
      _sum: {
        markingFee: true
      }
    });

    return {
      totalJobs: completedJobs.length,
      revenue: {
        gross: Math.round(totalRevenue * 100) / 100,
        agentPayouts: Math.round(agentPayouts * 100) / 100,
        platformRevenue: Math.round(platformRevenue * 100) / 100,
        netRevenue: Math.round((platformRevenue - (refundedAmount._sum.markingFee ? Number(refundedAmount._sum.markingFee) : 0)) * 100) / 100
      },
      refunds: {
        count: refundedJobs,
        amount: Math.round((refundedAmount._sum.markingFee ? Number(refundedAmount._sum.markingFee) : 0) * 100) / 100
      },
      averages: {
        revenuePerJob: completedJobs.length > 0 ? Math.round((totalRevenue / completedJobs.length) * 100) / 100 : 0,
        platformRevenuePerJob: completedJobs.length > 0 ? Math.round((platformRevenue / completedJobs.length) * 100) / 100 : 0
      }
    };
  }

  /**
   * Get agent leaderboard
   */
  async getAgentLeaderboard(limit: number = 20, dateRange: DateRange = {}) {
    const where: any = {
      status: MarkingJobStatus.COMPLETED
    };

    if (dateRange.startDate || dateRange.endDate) {
      where.completedAt = {};
      if (dateRange.startDate) {
        where.completedAt.gte = dateRange.startDate;
      }
      if (dateRange.endDate) {
        where.completedAt.lte = dateRange.endDate;
      }
    }

    const completedJobs = await prisma.propertyMarkingJob.groupBy({
      by: ['assignedAgentId'],
      where,
      _count: {
        id: true
      },
      _sum: {
        markingFee: true
      }
    });

    const agentIds = completedJobs
      .map(job => job.assignedAgentId)
      .filter((id): id is string => id !== null);

    const agents = await prisma.user.findMany({
      where: {
        id: { in: agentIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        agentReliabilityScore: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true
      }
    });

    const leaderboard = completedJobs
      .map(job => {
        const agent = agents.find(a => a.id === job.assignedAgentId);
        if (!agent) return null;

        return {
          agent: {
            id: agent.id,
            name: agent.name,
            email: agent.email,
            reliabilityScore: agent.agentReliabilityScore
          },
          metrics: {
            completedJobs: job._count.id,
            totalEarnings: Math.round((Number(job._sum.markingFee || 0) * 0.25) * 100) / 100,
            averageJobValue: job._count.id > 0 
              ? Math.round((Number(job._sum.markingFee || 0) / job._count.id) * 100) / 100 
              : 0
          }
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.metrics.completedJobs - a.metrics.completedJobs)
      .slice(0, limit);

    return leaderboard;
  }

  /**
   * Get property owner marking statistics
   */
  async getPropertyOwnerStats(ownerId: string, dateRange: DateRange = {}) {
    const where: any = {
      requestedBy: ownerId
    };

    if (dateRange.startDate || dateRange.endDate) {
      where.createdAt = {};
      if (dateRange.startDate) {
        where.createdAt.gte = dateRange.startDate;
      }
      if (dateRange.endDate) {
        where.createdAt.lte = dateRange.endDate;
      }
    }

    const [
      totalRequests,
      completedJobs,
      pendingJobs,
      cancelledJobs
    ] = await Promise.all([
      prisma.propertyMarkingJob.count({ where }),
      prisma.propertyMarkingJob.count({
        where: { ...where, status: MarkingJobStatus.COMPLETED }
      }),
      prisma.propertyMarkingJob.count({
        where: {
          ...where,
          status: {
            in: [MarkingJobStatus.QUEUED, MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS]
          }
        }
      }),
      prisma.propertyMarkingJob.count({
        where: { ...where, status: MarkingJobStatus.CANCELLED }
      })
    ]);

    const jobs = await prisma.propertyMarkingJob.findMany({
      where,
      select: {
        markingFee: true,
        status: true
      }
    });

    const totalSpent = jobs.reduce((sum, job) => {
      return sum + Number(job.markingFee);
    }, 0);

    return {
      totalRequests,
      completedJobs,
      pendingJobs,
      cancelledJobs,
      totalSpent: Math.round(totalSpent * 100) / 100,
      averageCost: totalRequests > 0 
        ? Math.round((totalSpent / totalRequests) * 100) / 100 
        : 0,
      completionRate: totalRequests > 0 
        ? Math.round((completedJobs / totalRequests) * 100 * 10) / 10 
        : 0
    };
  }
}

export const markingAnalyticsService = new MarkingAnalyticsService();