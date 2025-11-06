import { PrismaClient } from '@prisma/client';
import { CacheService } from './cacheService';
import { AggregationService } from './aggregationService';
import { getDateRange } from '../../../shared/src/utils/dateRangeHelper';

const prisma = new PrismaClient();

export class DashboardService {
  private cacheService: CacheService;
  private aggregationService: AggregationService;

  constructor() {
    this.cacheService = new CacheService();
    this.aggregationService = new AggregationService();
  }

  /**
   * Get comprehensive dashboard overview
   */
  async getOverview(dateRange: string) {
    const cacheKey = `dashboard:overview:${dateRange}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = getDateRange(dateRange);

    const [
      userStats,
      propertyStats,
      revenueStats,
      markingStats,
      engagementStats
    ] = await Promise.all([
      this.getUserStats(startDate, endDate),
      this.getPropertyStats(startDate, endDate),
      this.getRevenueStats(startDate, endDate),
      this.getMarkingStats(startDate, endDate),
      this.getEngagementStats(startDate, endDate)
    ]);

    const overview = {
      period: { startDate, endDate, range: dateRange },
      users: userStats,
      properties: propertyStats,
      revenue: revenueStats,
      markingService: markingStats,
      engagement: engagementStats,
      timestamp: new Date()
    };

    await this.cacheService.set(cacheKey, overview, 300); // Cache for 5 minutes
    return overview;
  }

  /**
   * Get real-time metrics (no caching)
   */
  async getRealTimeMetrics() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      activeUsers,
      recentSignups,
      propertiesViewed,
      paymentsInProgress,
      markingJobsActive
    ] = await Promise.all([
      // Active users in last hour
      prisma.eventLog.groupBy({
        by: ['userId'],
        where: {
          timestamp: { gte: oneHourAgo },
          userId: { not: null }
        }
      }).then(result => result.length),

      // Signups in last 24 hours
      prisma.user.count({
        where: {
          createdAt: { gte: oneDayAgo }
        }
      }),

      // Properties viewed in last hour
      prisma.eventLog.count({
        where: {
          type: 'PROPERTY_VIEWED',
          timestamp: { gte: oneHourAgo }
        }
      }),

      // Payments in progress
      prisma.payment.count({
        where: {
          status: 'PENDING'
        }
      }),

      // Active marking jobs
      prisma.propertyMarkingJob.count({
        where: {
          status: { in: ['QUEUED', 'ASSIGNED', 'IN_PROGRESS'] }
        }
      })
    ]);

    return {
      activeUsers,
      recentSignups,
      propertiesViewed,
      paymentsInProgress,
      markingJobsActive,
      timestamp: now
    };
  }

  /**
   * Get platform health status
   */
  async getPlatformHealth() {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [
      databaseHealth,
      apiHealth,
      paymentSystemHealth,
      markingSystemHealth
    ] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkAPIHealth(fiveMinutesAgo),
      this.checkPaymentSystemHealth(),
      this.checkMarkingSystemHealth()
    ]);

    const overallHealth = this.calculateOverallHealth([
      databaseHealth,
      apiHealth,
      paymentSystemHealth,
      markingSystemHealth
    ]);

    return {
      overall: overallHealth,
      components: {
        database: databaseHealth,
        api: apiHealth,
        paymentSystem: paymentSystemHealth,
        markingSystem: markingSystemHealth
      },
      timestamp: now
    };
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(dateRange: string) {
    const { startDate, endDate } = getDateRange(dateRange);

    const activities = await prisma.eventLog.groupBy({
      by: ['type'],
      where: {
        timestamp: { gte: startDate, lte: endDate }
      },
      _count: true
    });

    const dailyActivity = await this.aggregationService.aggregateByDay(
      'eventLog',
      startDate,
      endDate,
      'timestamp'
    );

    const topUsers = await prisma.eventLog.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: startDate, lte: endDate },
        userId: { not: null }
      },
      _count: true,
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 10
    });

    return {
      period: { startDate, endDate },
      totalEvents: activities.reduce((sum, a) => sum + a._count, 0),
      byType: activities.map(a => ({
        type: a.type,
        count: a._count
      })),
      dailyActivity,
      topUsers: await this.enrichUsersData(topUsers)
    };
  }

  /**
   * Get property performance summary
   */
  async getPropertyPerformance(dateRange: string) {
    const { startDate, endDate } = getDateRange(dateRange);

    const [
      topViewed,
      topRented,
      conversionRate,
      averageTimeToRent
    ] = await Promise.all([
      this.getTopViewedProperties(startDate, endDate),
      this.getTopRentedProperties(startDate, endDate),
      this.calculatePropertyConversionRate(startDate, endDate),
      this.calculateAverageTimeToRent(startDate, endDate)
    ]);

    return {
      period: { startDate, endDate },
      topViewed,
      topRented,
      conversionRate,
      averageTimeToRent
    };
  }

  /**
   * Get revenue summary
   */
  async getRevenueSummary(dateRange: string) {
    const { startDate, endDate } = getDateRange(dateRange);

    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startDate, lte: endDate }
      },
      select: {
        amount: true,
        paymentType: true,
        platformFee: true,
        agentCommission: true,
        paidAt: true
      }
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const platformFees = payments.reduce((sum, p) => sum + Number(p.platformFee || 0), 0);
    const agentCommissions = payments.reduce((sum, p) => sum + Number(p.agentCommission || 0), 0);

    const revenueByType = this.groupPaymentsByType(payments);
    const dailyRevenue = await this.aggregationService.aggregateRevenue(
      startDate,
      endDate,
      'day'
    );

    return {
      period: { startDate, endDate },
      totalRevenue,
      platformFees,
      agentCommissions,
      netRevenue: platformFees,
      transactionCount: payments.length,
      averageTransactionValue: payments.length > 0 ? totalRevenue / payments.length : 0,
      revenueByType,
      dailyRevenue
    };
  }

  /**
   * Get agent performance summary
   */
  async getAgentPerformance(dateRange: string, limit: number = 10) {
    const { startDate, endDate } = getDateRange(dateRange);

    const agents = await prisma.user.findMany({
      where: {
        role: 'AGENT',
        createdAt: { lte: endDate }
      },
      select: {
        id: true,
        name: true,
        email: true,
        agentReliabilityScore: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true,
        agentListings: {
          where: {
            createdAt: { gte: startDate, lte: endDate }
          },
          select: {
            id: true,
            status: true,
            rentals: {
              where: {
                createdAt: { gte: startDate, lte: endDate }
              }
            }
          }
        },
        assignedMarkingJobs: {
          where: {
            createdAt: { gte: startDate, lte: endDate }
          },
          select: {
            id: true,
            status: true,
            markingFee: true
          }
        }
      },
      take: limit
    });

    const performanceData = agents.map(agent => {
      const listingsCount = agent.agentListings.length;
      const rentalsCount = agent.agentListings.reduce(
        (sum, prop) => sum + prop.rentals.length,
        0
      );
      const markingJobsCount = agent.assignedMarkingJobs.length;
      const completedMarkingJobs = agent.assignedMarkingJobs.filter(
        job => job.status === 'COMPLETED'
      ).length;
      const markingRevenue = agent.assignedMarkingJobs
        .filter(job => job.status === 'COMPLETED')
        .reduce((sum, job) => sum + Number(job.markingFee) * 0.25, 0); // 25% commission

      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        reliabilityScore: Number(agent.agentReliabilityScore || 0),
        listingsCount,
        rentalsCount,
        conversionRate: listingsCount > 0 ? (rentalsCount / listingsCount) * 100 : 0,
        markingJobsCount,
        completedMarkingJobs,
        markingCompletionRate: markingJobsCount > 0 
          ? (completedMarkingJobs / markingJobsCount) * 100 
          : 0,
        estimatedEarnings: markingRevenue
      };
    });

    // Sort by a composite score
    performanceData.sort((a, b) => {
      const scoreA = a.rentalsCount * 2 + a.completedMarkingJobs + a.reliabilityScore;
      const scoreB = b.rentalsCount * 2 + b.completedMarkingJobs + b.reliabilityScore;
      return scoreB - scoreA;
    });

    return performanceData.slice(0, limit);
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(limit: number = 20) {
    const activities = await prisma.eventLog.findMany({
      where: {
        type: {
          in: [
            'USER_REGISTERED',
            'PROPERTY_CREATED',
            'PROPERTY_APPROVED',
            'PAYMENT_SUCCESS',
            'MARKING_JOB_COMPLETED',
            'RENTAL_CREATED'
          ]
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      timestamp: activity.timestamp,
      user: activity.user,
      metadata: activity.metadata,
      description: this.generateActivityDescription(activity)
    }));
  }

  /**
   * Get system alerts
   */
  async getAlerts() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      pendingVerifications,
      failedPayments,
      expiredMarkingJobs,
      lowPerformingAgents,
      suspiciousActivity
    ] = await Promise.all([
      prisma.user.count({
        where: {
          verificationStatus: 'PENDING',
          createdAt: { lte: oneDayAgo }
        }
      }),
      prisma.payment.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: oneDayAgo }
        }
      }),
      prisma.propertyMarkingJob.count({
        where: {
          status: 'EXPIRED'
        }
      }),
      prisma.user.count({
        where: {
          role: 'AGENT',
          agentReliabilityScore: { lt: 2.0 },
          totalMarkingJobs: { gt: 5 }
        }
      }),
      this.detectSuspiciousActivity(oneDayAgo)
    ]);

    const alerts = [];

    if (pendingVerifications > 0) {
      alerts.push({
        type: 'warning',
        category: 'verifications',
        message: `${pendingVerifications} user verification(s) pending for over 24 hours`,
        count: pendingVerifications,
        priority: 'medium'
      });
    }

    if (failedPayments > 0) {
      alerts.push({
        type: 'error',
        category: 'payments',
        message: `${failedPayments} failed payment(s) in the last 24 hours`,
        count: failedPayments,
        priority: 'high'
      });
    }

    if (expiredMarkingJobs > 0) {
      alerts.push({
        type: 'warning',
        category: 'marking',
        message: `${expiredMarkingJobs} expired marking job(s) need attention`,
        count: expiredMarkingJobs,
        priority: 'medium'
      });
    }

    if (lowPerformingAgents > 0) {
      alerts.push({
        type: 'info',
        category: 'agents',
        message: `${lowPerformingAgents} agent(s) with low reliability scores`,
        count: lowPerformingAgents,
        priority: 'low'
      });
    }

    if (suspiciousActivity > 0) {
      alerts.push({
        type: 'error',
        category: 'security',
        message: `${suspiciousActivity} suspicious activity pattern(s) detected`,
        count: suspiciousActivity,
        priority: 'critical'
      });
    }

    return alerts;
  }

  // Private helper methods

  private async getUserStats(startDate: Date, endDate: Date) {
    const [total, newUsers, verified, byRole] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { lte: endDate } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.user.count({
        where: { 
          verificationStatus: 'VERIFIED',
          verifiedAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.user.groupBy({
        by: ['role'],
        where: { createdAt: { lte: endDate } },
        _count: true
      })
    ]);

    return {
      total,
      new: newUsers,
      verified,
      byRole: byRole.reduce((acc, r) => ({ ...acc, [r.role]: r._count }), {})
    };
  }

  private async getPropertyStats(startDate: Date, endDate: Date) {
    const [total, newProperties, published, rented] = await Promise.all([
      prisma.property.count({
        where: { createdAt: { lte: endDate } }
      }),
      prisma.property.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.property.count({
        where: { 
          status: 'PUBLISHED',
          createdAt: { lte: endDate }
        }
      }),
      prisma.property.count({
        where: { 
          status: 'RENTED',
          updatedAt: { gte: startDate, lte: endDate }
        }
      })
    ]);

    return { total, new: newProperties, published, rented };
  }

  private async getRevenueStats(startDate: Date, endDate: Date) {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startDate, lte: endDate }
      },
      select: {
        amount: true,
        platformFee: true
      }
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const platformFees = payments.reduce((sum, p) => sum + Number(p.platformFee || 0), 0);

    return {
      total: totalRevenue,
      platformFees,
      transactionCount: payments.length
    };
  }

  private async getMarkingStats(startDate: Date, endDate: Date) {
    const [total, completed, pending] = await Promise.all([
      prisma.propertyMarkingJob.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.propertyMarkingJob.count({
        where: { 
          status: 'COMPLETED',
          completedAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.propertyMarkingJob.count({
        where: { status: { in: ['QUEUED', 'ASSIGNED'] } }
      })
    ]);

    return { total, completed, pending };
  }

  private async getEngagementStats(startDate: Date, endDate: Date) {
    const [views, searches, favorites] = await Promise.all([
      prisma.eventLog.count({
        where: {
          type: 'PROPERTY_VIEWED',
          timestamp: { gte: startDate, lte: endDate }
        }
      }),
      prisma.eventLog.count({
        where: {
          type: 'PROPERTY_SEARCHED',
          timestamp: { gte: startDate, lte: endDate }
        }
      }),
      prisma.eventLog.count({
        where: {
          type: 'PROPERTY_FAVORITED',
          timestamp: { gte: startDate, lte: endDate }
        }
      })
    ]);

    return { views, searches, favorites };
  }

  private async checkDatabaseHealth() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', message: 'Database is responsive' };
    } catch (error) {
      return { status: 'unhealthy', message: 'Database connection failed' };
    }
  }

  private async checkAPIHealth(since: Date) {
    const errorCount = await prisma.eventLog.count({
      where: {
        type: 'API_ERROR',
        timestamp: { gte: since }
      }
    });

    if (errorCount > 100) {
      return { status: 'degraded', message: `${errorCount} API errors in last 5 minutes` };
    }

    return { status: 'healthy', message: 'API is functioning normally' };
  }

  private async checkPaymentSystemHealth() {
    const recentFailures = await prisma.payment.count({
      where: {
        status: 'FAILED',
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
      }
    });

    if (recentFailures > 10) {
      return { status: 'degraded', message: `${recentFailures} payment failures in last hour` };
    }

    return { status: 'healthy', message: 'Payment system is functioning normally' };
  }

  private async checkMarkingSystemHealth() {
    const expiredJobs = await prisma.propertyMarkingJob.count({
      where: { status: 'EXPIRED' }
    });

    if (expiredJobs > 20) {
      return { status: 'degraded', message: `${expiredJobs} expired marking jobs` };
    }

    return { status: 'healthy', message: 'Marking system is functioning normally' };
  }

  private calculateOverallHealth(components: any[]) {
    const unhealthy = components.filter(c => c.status === 'unhealthy').length;
    const degraded = components.filter(c => c.status === 'degraded').length;

    if (unhealthy > 0) return 'unhealthy';
    if (degraded > 1) return 'degraded';
    if (degraded === 1) return 'partial';
    return 'healthy';
  }

  private async getTopViewedProperties(startDate: Date, endDate: Date) {
    const views = await prisma.eventLog.groupBy({
      by: ['metadata'],
      where: {
        type: 'PROPERTY_VIEWED',
        timestamp: { gte: startDate, lte: endDate }
      },
      _count: true,
      orderBy: {
        _count: {
          metadata: 'desc'
        }
      },
      take: 10
    });

    // Note: This is simplified. In production, you'd parse metadata to extract propertyId
    return views.map(v => ({
      propertyId: (v.metadata as any)?.propertyId,
      viewCount: v._count
    }));
  }

  private async getTopRentedProperties(startDate: Date, endDate: Date) {
    const rentals = await prisma.rental.groupBy({
      by: ['propertyId'],
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: true,
      orderBy: {
        _count: {
          propertyId: 'desc'
        }
      },
      take: 10
    });

    return rentals.map(r => ({
      propertyId: r.propertyId,
      rentalCount: r._count
    }));
  }

  private async calculatePropertyConversionRate(startDate: Date, endDate: Date) {
    const [views, rentals] = await Promise.all([
      prisma.eventLog.count({
        where: {
          type: 'PROPERTY_VIEWED',
          timestamp: { gte: startDate, lte: endDate }
        }
      }),
      prisma.rental.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      })
    ]);

    return views > 0 ? (rentals / views) * 100 : 0;
  }

  private async calculateAverageTimeToRent(startDate: Date, endDate: Date) {
    const properties = await prisma.property.findMany({
      where: {
        status: 'RENTED',
        updatedAt: { gte: startDate, lte: endDate }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    if (properties.length === 0) return 0;

    const totalDays = properties.reduce((sum, p) => {
      const days = Math.floor(
        (p.updatedAt.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);

    return totalDays / properties.length;
  }

  private groupPaymentsByType(payments: any[]) {
    const grouped = payments.reduce((acc, payment) => {
      const type = payment.paymentType;
      if (!acc[type]) {
        acc[type] = { count: 0, amount: 0 };
      }
      acc[type].count++;
      acc[type].amount += Number(payment.amount);
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    return grouped;
  }

  private async enrichUsersData(topUsers: any[]) {
    const userIds = topUsers.map(u => u.userId).filter(Boolean);
    
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return topUsers.map(tu => ({
      user: userMap.get(tu.userId),
      eventCount: tu._count
    }));
  }

  private generateActivityDescription(activity: any): string {
    const userName = activity.user?.name || 'Unknown user';
    
    switch (activity.type) {
      case 'USER_REGISTERED':
        return `${userName} registered as ${activity.user?.role}`;
      case 'PROPERTY_CREATED':
        return `${userName} created a new property listing`;
      case 'PROPERTY_APPROVED':
        return `Property was approved by admin`;
      case 'PAYMENT_SUCCESS':
        return `${userName} completed a payment`;
      case 'MARKING_JOB_COMPLETED':
        return `Marking job completed by ${userName}`;
      case 'RENTAL_CREATED':
        return `${userName} rented a property`;
      default:
        return `${activity.type} event occurred`;
    }
  }

  private async detectSuspiciousActivity(since: Date): Promise<number> {
    // Detect multiple failed login attempts
    const failedLogins = await prisma.eventLog.groupBy({
      by: ['userId'],
      where: {
        type: 'LOGIN_FAILED',
        timestamp: { gte: since }
      },
      _count: true,
      having: {
        userId: {
          _count: {
            gt: 5
          }
        }
      }
    });

    // Detect multiple failed payment attempts
    const failedPayments = await prisma.payment.groupBy({
      by: ['userId'],
      where: {
        status: 'FAILED',
        createdAt: { gte: since }
      },
      _count: true,
      having: {
        userId: {
          _count: {
            gt: 3
          }
        }
      }
    });

    return failedLogins.length + failedPayments.length;
  }
}