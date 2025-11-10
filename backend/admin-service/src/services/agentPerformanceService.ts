import { PrismaClient } from '@newcondo/db';

const prisma = new PrismaClient();

interface AgentOverviewParams {
  startDate?: Date;
  endDate?: Date;
}

interface AgentPerformanceParams {
  agentId: string;
  startDate?: Date;
  endDate?: Date;
}

interface TopAgentsParams {
  limit: number;
  metric: 'revenue' | 'listings' | 'rentals' | 'markings';
  startDate?: Date;
  endDate?: Date;
}

interface AgentListingStatsParams {
  agentId: string;
  startDate?: Date;
  endDate?: Date;
}

interface AgentMarkingPerformanceParams {
  agentId: string;
  startDate?: Date;
  endDate?: Date;
}

interface AgentCommissionsParams {
  agentId: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

interface AgentReferralPerformanceParams {
  agentId: string;
  startDate?: Date;
  endDate?: Date;
}

interface CompareAgentsParams {
  agentIds: string[];
  startDate?: Date;
  endDate?: Date;
}

class AgentPerformanceService {
  /**
   * Get agent performance overview
   */
  async getAgentOverview(params: AgentOverviewParams) {
    const { startDate, endDate } = this.getDateRange(params.startDate, params.endDate);

    const [
      totalAgents,
      activeAgents,
      topPerformers,
      averageListingsPerAgent,
      averageCommissionPerAgent,
      totalCommissionsPaid,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'AGENT' } }),
      this.getActiveAgents(startDate, endDate),
      this.getTopPerformers(10, startDate, endDate),
      this.getAverageListingsPerAgent(),
      this.getAverageCommissionPerAgent(startDate, endDate),
      this.getTotalCommissions(startDate, endDate),
    ]);

    return {
      totalAgents,
      activeAgents: activeAgents.length,
      topPerformers,
      averageListingsPerAgent,
      averageCommissionPerAgent,
      totalCommissionsPaid,
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Get individual agent performance
   */
  async getAgentPerformance(params: AgentPerformanceParams) {
    const { agentId, startDate, endDate } = params;
    const dateRange = this.getDateRange(startDate, endDate);

    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      include: {
        agentListings: {
          where: {
            createdAt: {
              gte: dateRange.startDate,
              lte: dateRange.endDate,
            },
          },
        },
        assignedMarkingJobs: {
          where: {
            status: 'COMPLETED',
            completedAt: {
              gte: dateRange.startDate,
              lte: dateRange.endDate,
            },
          },
        },
      },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    const [
      totalCommissions,
      totalRentals,
      averagePropertyPrice,
      conversionRate,
      markingJobStats,
    ] = await Promise.all([
      this.getAgentCommissions(agentId, dateRange.startDate, dateRange.endDate),
      this.getAgentRentals(agentId, dateRange.startDate, dateRange.endDate),
      this.getAgentAveragePropertyPrice(agentId),
      this.calculateConversionRate(agentId, dateRange.startDate, dateRange.endDate),
      this.getMarkingJobStats(agentId, dateRange.startDate, dateRange.endDate),
    ]);

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        reliabilityScore: agent.agentReliabilityScore,
      },
      performance: {
        listingsCount: agent.agentListings.length,
        totalCommissions,
        totalRentals,
        averagePropertyPrice,
        conversionRate,
        markingJobStats,
      },
      dateRange: dateRange,
    };
  }

  /**
   * Get top performing agents
   */
  async getTopAgents(params: TopAgentsParams) {
    const { limit, metric, startDate, endDate } = params;
    const dateRange = this.getDateRange(startDate, endDate);

    let topAgents;

    switch (metric) {
      case 'revenue':
        topAgents = await this.getTopAgentsByRevenue(limit, dateRange.startDate, dateRange.endDate);
        break;
      case 'listings':
        topAgents = await this.getTopAgentsByListings(limit, dateRange.startDate, dateRange.endDate);
        break;
      case 'rentals':
        topAgents = await this.getTopAgentsByRentals(limit, dateRange.startDate, dateRange.endDate);
        break;
      case 'markings':
        topAgents = await this.getTopAgentsByMarkings(limit, dateRange.startDate, dateRange.endDate);
        break;
      default:
        throw new Error('Invalid metric');
    }

    return {
      topAgents,
      metric,
      dateRange: dateRange,
    };
  }

  /**
   * Get agent listing statistics
   */
  async getAgentListingStats(params: AgentListingStatsParams) {
    const { agentId, startDate, endDate } = params;
    const dateRange = this.getDateRange(startDate, endDate);

    const [
      totalListings,
      activeListings,
      rentedListings,
      averageTimeToRent,
      listingsByStatus,
      listingsByType,
    ] = await Promise.all([
      prisma.property.count({
        where: {
          agentId,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
      }),

      prisma.property.count({
        where: {
          agentId,
          status: 'PUBLISHED',
          isAvailable: true,
        },
      }),

      prisma.property.count({
        where: {
          agentId,
          status: 'RENTED',
        },
      }),this.calculateAverageTimeToRent(agentId, dateRange.startDate, dateRange.endDate),

      prisma.property.groupBy({
        by: ['status'],
        where: {
          agentId,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
        _count: true,
      }),

      prisma.property.groupBy({
        by: ['propertyType'],
        where: {
          agentId,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
        _count: true,
      }),
    ]);

    return {
      totalListings,
      activeListings,
      rentedListings,
      averageTimeToRent,
      successRate: totalListings > 0 ? (rentedListings / totalListings) * 100 : 0,
      listingsByStatus,
      listingsByType,
      dateRange: dateRange,
    };
  }

  /**
   * Get agent marking job performance
   */
  async getAgentMarkingPerformance(params: AgentMarkingPerformanceParams) {
    const { agentId, startDate, endDate } = params;
    const dateRange = this.getDateRange(startDate, endDate);

    const [
      totalJobs,
      completedJobs,
      cancelledJobs,
      averageCompletionTime,
      totalEarnings,
      jobsByStatus,
    ] = await Promise.all([
      prisma.propertyMarkingJob.count({
        where: {
          assignedAgentId: agentId,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
      }),

      prisma.propertyMarkingJob.count({
        where: {
          assignedAgentId: agentId,
          status: 'COMPLETED',
          completedAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
      }),

      prisma.propertyMarkingJob.count({
        where: {
          assignedAgentId: agentId,
          status: 'CANCELLED',
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
      }),

      this.calculateAverageMarkingTime(agentId, dateRange.startDate, dateRange.endDate),

      this.calculateMarkingEarnings(agentId, dateRange.startDate, dateRange.endDate),

      prisma.propertyMarkingJob.groupBy({
        by: ['status'],
        where: {
          assignedAgentId: agentId,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
        _count: true,
      }),
    ]);

    return {
      totalJobs,
      completedJobs,
      cancelledJobs,
      completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      averageCompletionTime,
      totalEarnings,
      jobsByStatus,
      dateRange: dateRange,
    };
  }

  /**
   * Get agent commission earnings
   */
  async getAgentCommissions(params: AgentCommissionsParams) {
    const { agentId, startDate, endDate, status } = params;
    const dateRange = this.getDateRange(startDate, endDate);

    const where: any = {
      status: status || 'SUCCESS',
      agentCommission: { gt: 0 },
      rental: {
        property: {
          agentId,
        },
      },
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    };

    const [commissions, totalAmount, averageCommission] = await Promise.all([
      prisma.payment.findMany({
        where,
        select: {
          id: true,
          amount: true,
          agentCommission: true,
          createdAt: true,
          rental: {
            select: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      prisma.payment.aggregate({
        where,
        _sum: { agentCommission: true },
      }),

      prisma.payment.aggregate({
        where,
        _avg: { agentCommission: true },
      }),
    ]);

    return {
      commissions,
      totalAmount: totalAmount._sum.agentCommission || 0,
      averageCommission: averageCommission._avg.agentCommission || 0,
      count: commissions.length,
      dateRange: dateRange,
    };
  }

  /**
   * Get agent reliability score breakdown
   */
  async getAgentReliabilityScore(agentId: string) {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        agentReliabilityScore: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true,
      },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Calculate score components
    const [
      completionRate,
      averageResponseTime,
      customerRating,
      verificationSuccessRate,
    ] = await Promise.all([
      this.calculateCompletionRate(agentId),
      this.calculateAverageResponseTime(agentId),
      this.getCustomerRating(agentId),
      this.calculateVerificationSuccessRate(agentId),
    ]);

    return {
      overallScore: agent.agentReliabilityScore || 0,
      components: {
        completionRate,
        averageResponseTime,
        customerRating,
        verificationSuccessRate,
      },
      jobStats: {
        total: agent.totalMarkingJobs,
        completed: agent.completedMarkingJobs,
      },
    };
  }

  /**
   * Get agent referral performance
   */
  async getAgentReferralPerformance(params: AgentReferralPerformanceParams) {
    const { agentId, startDate, endDate } = params;
    const dateRange = this.getDateRange(startDate, endDate);

    // Get referrals made by agent
    const referrals = await prisma.referral.findMany({
      where: {
        referrerId: agentId,
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      include: {
        referred: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            verificationStatus: true,
          },
        },
      },
    });

    const [totalRewards, activeReferrals] = await Promise.all([
      prisma.referral.aggregate({
        where: {
          referrerId: agentId,
          rewardPaid: true,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
        _sum: { reward: true },
      }),

      prisma.referral.count({
        where: {
          referrerId: agentId,
          isActive: true,
        },
      }),
    ]);

    return {
      totalReferrals: referrals.length,
      activeReferrals,
      totalRewards: totalRewards._sum.reward || 0,
      referrals,
      dateRange: dateRange,
    };
  }

  /**
   * Compare agents performance
   */
  async compareAgents(params: CompareAgentsParams) {
    const { agentIds, startDate, endDate } = params;
    const dateRange = this.getDateRange(startDate, endDate);

    const comparisons = await Promise.all(
      agentIds.map(async (agentId) => {
        const [agent, listings, commissions, markingJobs] = await Promise.all([
          prisma.user.findUnique({
            where: { id: agentId },
            select: {
              id: true,
              name: true,
              email: true,
              agentReliabilityScore: true,
            },
          }),

          prisma.property.count({
            where: {
              agentId,
              createdAt: {
                gte: dateRange.startDate,
                lte: dateRange.endDate,
              },
            },
          }),

          prisma.payment.aggregate({
            where: {
              status: 'SUCCESS',
              agentCommission: { gt: 0 },
              rental: {
                property: {
                  agentId,
                },
              },
              createdAt: {
                gte: dateRange.startDate,
                lte: dateRange.endDate,
              },
            },
            _sum: { agentCommission: true },
          }),

          prisma.propertyMarkingJob.count({
            where: {
              assignedAgentId: agentId,
              status: 'COMPLETED',
              completedAt: {
                gte: dateRange.startDate,
                lte: dateRange.endDate,
              },
            },
          }),
        ]);

        return {
          agent,
          metrics: {
            listings,
            totalCommissions: commissions._sum.agentCommission || 0,
            completedMarkingJobs: markingJobs,
          },
        };
      })
    );

    // Rank agents by different metrics
    const rankings = {
      byCommissions: [...comparisons].sort(
        (a, b) => Number(b.metrics.totalCommissions) - Number(a.metrics.totalCommissions)
      ),
      byListings: [...comparisons].sort((a, b) => b.metrics.listings - a.metrics.listings),
      byMarkingJobs: [...comparisons].sort(
        (a, b) => b.metrics.completedMarkingJobs - a.metrics.completedMarkingJobs
      ),
    };

    return {
      comparisons,
      rankings,
      dateRange: dateRange,
    };
  }

  // Helper methods
  private getDateRange(startDate?: Date, endDate?: Date) {
    return {
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate || new Date(),
    };
  }

  private async getActiveAgents(startDate: Date, endDate: Date) {
    // Agents who had activity in the period
    const activeAgentIds = await prisma.property.findMany({
      where: {
        agentId: { not: null },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { agentId: true },
      distinct: ['agentId'],
    });

    return activeAgentIds.map((a) => a.agentId).filter(Boolean);
  }

  private async getTopPerformers(limit: number, startDate: Date, endDate: Date) {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      select: {
        id: true,
        name: true,
        email: true,
        agentReliabilityScore: true,
      },
    });

    const performanceData = await Promise.all(
      agents.map(async (agent) => {
        const commissions = await prisma.payment.aggregate({
          where: {
            status: 'SUCCESS',
            agentCommission: { gt: 0 },
            rental: {
              property: {
                agentId: agent.id,
              },
            },
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: { agentCommission: true },
        });

        return {
          ...agent,
          totalCommissions: commissions._sum.agentCommission || 0,
        };
      })
    );

    return performanceData
      .sort((a, b) => Number(b.totalCommissions) - Number(a.totalCommissions))
      .slice(0, limit);
  }

  private async getAverageListingsPerAgent() {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      include: {
        _count: {
          select: {
            agentListings: true,
          },
        },
      },
    });

    if (agents.length === 0) return 0;

    const totalListings = agents.reduce((sum, agent) => sum + agent._count.agentListings, 0);
    return totalListings / agents.length;
  }

  private async getAverageCommissionPerAgent(startDate: Date, endDate: Date) {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
    });

    if (agents.length === 0) return 0;

    const totalCommissions = await prisma.payment.aggregate({
      where: {
        status: 'SUCCESS',
        agentCommission: { gt: 0 },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { agentCommission: true },
    });

    return Number(totalCommissions._sum.agentCommission || 0) / agents.length;
  }

  private async getTotalCommissions(startDate: Date, endDate: Date) {
    const result = await prisma.payment.aggregate({
      where: {
        status: 'SUCCESS',
        agentCommission: { gt: 0 },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { agentCommission: true },
    });

    return result._sum.agentCommission || 0;
  }

  private async getAgentCommissions(agentId: string, startDate: Date, endDate: Date) {
    const result = await prisma.payment.aggregate({
      where: {
        status: 'SUCCESS',
        agentCommission: { gt: 0 },
        rental: {
          property: {
            agentId,
          },
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { agentCommission: true },
    });

    return result._sum.agentCommission || 0;
  }

  private async getAgentRentals(agentId: string, startDate: Date, endDate: Date) {
    return prisma.rental.count({
      where: {
        property: {
          agentId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'ACTIVE',
      },
    });
  }

  private async getAgentAveragePropertyPrice(agentId: string) {
    const result = await prisma.property.aggregate({
      where: {
        agentId,
        price: { not: null },
      },
      _avg: { price: true },
    });

    return result._avg.price || 0;
  }

  private async calculateConversionRate(agentId: string, startDate: Date, endDate: Date) {
    const [totalListings, rentedListings] = await Promise.all([
      prisma.property.count({
        where: {
          agentId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      prisma.rental.count({
        where: {
          property: {
            agentId,
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    if (totalListings === 0) return 0;
    return (rentedListings / totalListings) * 100;
  }

  private async getMarkingJobStats(agentId: string, startDate: Date, endDate: Date) {
    const [total, completed, cancelled] = await Promise.all([
      prisma.propertyMarkingJob.count({
        where: {
          assignedAgentId: agentId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      prisma.propertyMarkingJob.count({
        where: {
          assignedAgentId: agentId,
          status: 'COMPLETED',
          completedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      prisma.propertyMarkingJob.count({
        where: {
          assignedAgentId: agentId,
          status: 'CANCELLED',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    return {
      total,
      completed,
      cancelled,
      successRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  private async getTopAgentsByRevenue(limit: number, startDate: Date, endDate: Date) {
    return this.getTopPerformers(limit, startDate, endDate);
  }

  private async getTopAgentsByListings(limit: number, startDate: Date, endDate: Date) {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const agentsWithListings = await Promise.all(
      agents.map(async (agent) => {
        const listingCount = await prisma.property.count({
          where: {
            agentId: agent.id,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        return {
          ...agent,
          listingCount,
        };
      })
    );

    return agentsWithListings
      .sort((a, b) => b.listingCount - a.listingCount)
      .slice(0, limit);
  }

  private async getTopAgentsByRentals(limit: number, startDate: Date, endDate: Date) {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const agentsWithRentals = await Promise.all(
      agents.map(async (agent) => {
        const rentalCount = await prisma.rental.count({
          where: {
            property: {
              agentId: agent.id,
            },
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        return {
          ...agent,
          rentalCount,
        };
      })
    );

    return agentsWithRentals.sort((a, b) => b.rentalCount - a.rentalCount).slice(0, limit);
  }

  private async getTopAgentsByMarkings(limit: number, startDate: Date, endDate: Date) {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const agentsWithMarkings = await Promise.all(
      agents.map(async (agent) => {
        const markingCount = await prisma.propertyMarkingJob.count({
          where: {
            assignedAgentId: agent.id,
            status: 'COMPLETED',
            completedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        return {
          ...agent,
          markingCount,
        };
      })
    );

    return agentsWithMarkings.sort((a, b) => b.markingCount - a.markingCount).slice(0, limit);
  }

  private async calculateAverageTimeToRent(agentId: string, startDate: Date, endDate: Date) {
    const rentals = await prisma.rental.findMany({
      where: {
        property: {
          agentId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        property: {
          select: {
            createdAt: true,
          },
        },
      },
    });

    if (rentals.length === 0) return 0;

    const totalDays = rentals.reduce((sum, rental) => {
      const days = Math.floor(
        (rental.createdAt.getTime() - rental.property.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);

    return totalDays / rentals.length;
  }

  private async calculateAverageMarkingTime(agentId: string, startDate: Date, endDate: Date) {
    const jobs = await prisma.propertyMarkingJob.findMany({
      where: {
        assignedAgentId: agentId,
        status: 'COMPLETED',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
        assignedAt: { not: null },
      },
      select: {
        assignedAt: true,
        completedAt: true,
      },
    });

    if (jobs.length === 0) return 0;

    const totalHours = jobs.reduce((sum, job) => {
      const hours = (job.completedAt!.getTime() - job.assignedAt!.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return totalHours / jobs.length;
  }

  private async calculateMarkingEarnings(agentId: string, startDate: Date, endDate: Date) {
    const jobs = await prisma.propertyMarkingJob.findMany({
      where: {
        assignedAgentId: agentId,
        status: 'COMPLETED',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        markingFee: true,
      },
    });

    // Agent gets 25% of marking fee
    const totalEarnings = jobs.reduce((sum, job) => sum + Number(job.markingFee) * 0.25, 0);
    return totalEarnings;
  }

  private async calculateCompletionRate(agentId: string) {
    const [total, completed] = await Promise.all([
      prisma.propertyMarkingJob.count({
        where: { assignedAgentId: agentId },
      }),

      prisma.propertyMarkingJob.count({
        where: {
          assignedAgentId: agentId,
          status: 'COMPLETED',
        },
      }),
    ]);

    if (total === 0) return 100;
    return (completed / total) * 100;
  }

  private async calculateAverageResponseTime(agentId: string) {
    // Calculate average time to accept a marking job
    const jobs = await prisma.propertyMarkingJob.findMany({
      where: {
        assignedAgentId: agentId,
        assignedAt: { not: null },
      },
      select: {
        createdAt: true,
        assignedAt: true,
      },
      take: 50,
    });

    if (jobs.length === 0) return 0;

    const totalMinutes = jobs.reduce((sum, job) => {
      const minutes = (job.assignedAt!.getTime() - job.createdAt.getTime()) / (1000 * 60);
      return sum + minutes;
    }, 0);

    return totalMinutes / jobs.length;
  }

  private async getCustomerRating(agentId: string) {
    // This would come from a rating/review system
    // For now, return a placeholder based on completion rate
    const completionRate = await this.calculateCompletionRate(agentId);
    return (completionRate / 100) * 5; // Convert to 5-star rating
  }

  private async calculateVerificationSuccessRate(agentId: string) {
    const properties = await prisma.property.findMany({
      where: {
        agentId,
        adminApprovalStatus: { in: ['APPROVED', 'REJECTED'] },
      },
      select: {
        adminApprovalStatus: true,
      },
    });

    if (properties.length === 0) return 100;

    const approved = properties.filter((p) => p.adminApprovalStatus === 'APPROVED').length;
    return (approved / properties.length) * 100;
  }
}

export const agentPerformanceService = new AgentPerformanceService();