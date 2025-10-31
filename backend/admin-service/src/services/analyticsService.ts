// backend/admin-service/src/services/analyticsService.ts

import { PrismaClient } from '@newcondo/db';
import { adminService } from './adminService';

const prisma = new PrismaClient();

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface RevenueBreakdown {
  totalRevenue: number;
  rentPayments: number;
  markingFees: number;
  premiumSubscriptions: number;
  platformFees: number;
  agentCommissions: number;
}

class AnalyticsService {
  /**
   * Get platform overview analytics
   */
  async getPlatformOverview(adminId: string, dateRange?: DateRange) {
    await adminService.verifyAdminAccess(adminId);

    const range = dateRange || this.getDefaultDateRange('month');

    const [
      userGrowth,
      propertyGrowth,
      revenueData,
      transactionData,
      markingJobsData
    ] = await Promise.all([
      this.getUserGrowth(range),
      this.getPropertyGrowth(range),
      this.getRevenueData(range),
      this.getTransactionData(range),
      this.getMarkingJobsData(range)
    ]);

    return {
      period: {
        startDate: range.startDate,
        endDate: range.endDate
      },
      userGrowth,
      propertyGrowth,
      revenue: revenueData,
      transactions: transactionData,
      markingJobs: markingJobsData
    };
  }

  /**
   * Get user growth analytics
   */
  private async getUserGrowth(range: DateRange) {
    const [totalUsers, newUsers, usersByRole, verificationRate] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: range.startDate,
            lte: range.endDate
          }
        }
      }),
      prisma.user.groupBy({
        by: ['role'],
        where: {
          createdAt: {
            gte: range.startDate,
            lte: range.endDate
          }
        },
        _count: true
      }),
      this.getVerificationRate(range)
    ]);

    return {
      totalUsers,
      newUsers,
      byRole: usersByRole.map(u => ({
        role: u.role,
        count: u._count
      })),
      verificationRate
    };
  }

  /**
   * Get property growth analytics
   */
  private async getPropertyGrowth(range: DateRange) {
    const [totalProperties, newProperties, propertiesByType, propertiesByStatus] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({
        where: {
          createdAt: {
            gte: range.startDate,
            lte: range.endDate
          }
        }
      }),
      prisma.property.groupBy({
        by: ['propertyType'],
        where: {
          createdAt: {
            gte: range.startDate,
            lte: range.endDate
          }
        },
        _count: true
      }),
      prisma.property.groupBy({
        by: ['status'],
        _count: true
      })
    ]);

    return {
      totalProperties,
      newProperties,
      byType: propertiesByType.map(p => ({
        type: p.propertyType,
        count: p._count
      })),
      byStatus: propertiesByStatus.map(p => ({
        status: p.status,
        count: p._count
      }))
    };
  }

  /**
   * Get revenue analytics
   */
  private async getRevenueData(range: DateRange): Promise<RevenueBreakdown> {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        createdAt: {
          gte: range.startDate,
          lte: range.endDate
        }
      },
      select: {
        amount: true,
        paymentType: true,
        platformFee: true,
        agentCommission: true
      }
    });

    const breakdown = payments.reduce((acc, payment) => {
      const amount = Number(payment.amount);
      acc.totalRevenue += amount;

      switch (payment.paymentType) {
        case 'RENT':
          acc.rentPayments += amount;
          break;
        case 'PROPERTY_MARKING':
          acc.markingFees += amount;
          break;
        case 'PREMIUM_UPGRADE':
          acc.premiumSubscriptions += amount;
          break;
      }

      if (payment.platformFee) {
        acc.platformFees += Number(payment.platformFee);
      }
      if (payment.agentCommission) {
        acc.agentCommissions += Number(payment.agentCommission);
      }

      return acc;
    }, {
      totalRevenue: 0,
      rentPayments: 0,
      markingFees: 0,
      premiumSubscriptions: 0,
      platformFees: 0,
      agentCommissions: 0
    } as RevenueBreakdown);

    return breakdown;
  }

  /**
   * Get transaction analytics
   */
  private async getTransactionData(range: DateRange) {
    const [totalTransactions, successfulTransactions, failedTransactions, avgTransactionValue] = await Promise.all([
      prisma.payment.count({
        where: {
          createdAt: {
            gte: range.startDate,
            lte: range.endDate
          }
        }
      }),
      prisma.payment.count({
        where: {
          status: 'SUCCESS',
          createdAt: {
            gte: range.startDate,
            lte: range.endDate
          }
        }
      }),
      prisma.payment.count({
        where: {
          status: 'FAILED',
          createdAt: {
            gte: range.startDate,
            lte: range.endDate
          }
        }
      }),
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: {
            gte: range.startDate,
            lte: range.endDate
          }
        },
        _avg: {
          amount: true
        }
      })
    ]);

    const successRate = totalTransactions > 0 
      ? (successfulTransactions / totalTransactions) * 100 
      : 0;

    return {
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      successRate: Math.round(successRate * 100) / 100,
      avgTransactionValue: Number(avgTransactionValue._avg.amount || 0)
    };
  }

  /**
   * Get marking jobs analytics
   */
  private async getMarkingJobsData(range: DateRange) {
    const [totalJobs, completedJobs, pendingJobs, jobsByStatus, avgCompletionTime] = await Promise.all([
      prisma.propertyMarkingJob.count({
        where: {
          createdAt: {
            gte: range.startDate,
            lte: range.endDate
          }
        }
      }),
      prisma.propertyMarkingJob.count({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: range.startDate,
            lte: range.endDate
          }
        }
      }),
      prisma.propertyMarkingJob.count({
        where: {
          status: { in: ['QUEUED', 'ASSIGNED', 'IN_PROGRESS'] }
        }
      }),
      prisma.propertyMarkingJob.groupBy({
        by: ['status'],
        where: {
          createdAt: {
            gte: range.startDate,
            lte: range.endDate
          }
        },
        _count: true
      }),
      this.getAvgMarkingCompletionTime(range)
    ]);

    const completionRate = totalJobs > 0 
      ? (completedJobs / totalJobs) * 100 
      : 0;

    return {
      totalJobs,
      completedJobs,
      pendingJobs,
      completionRate: Math.round(completionRate * 100) / 100,
      byStatus: jobsByStatus.map(j => ({
        status: j.status,
        count: j._count
      })),
      avgCompletionTime: avgCompletionTime || 0
    };
  }

  /**
   * Get verification rate
   */
  private async getVerificationRate(range: DateRange): Promise<number> {
    const [total, verified] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: range.startDate,
            lte: range.endDate
          }
        }
      }),
      prisma.user.count({
        where: {
          verificationStatus: 'VERIFIED',
          createdAt: {
            gte: range.startDate,
            lte: range.endDate
          }
        }
      })
    ]);

    return total > 0 ? (verified / total) * 100 : 0;
  }

  /**
   * Get average marking completion time (in hours)
   */
  private async getAvgMarkingCompletionTime(range: DateRange): Promise<number | null> {
    const jobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { not: null },
        createdAt: {
          gte: range.startDate,
          lte: range.endDate
        }
      },
      select: {
        createdAt: true,
        completedAt: true
      },
      take: 100
    });

    if (jobs.length === 0) return null;

    const totalTime = jobs.reduce((sum, job) => {
      const timeDiff = job.completedAt!.getTime() - job.createdAt.getTime();
      return sum + timeDiff;
    }, 0);

    return totalTime / jobs.length / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Get property analytics by location
   */
  async getPropertyAnalyticsByLocation(adminId: string) {
    await adminService.verifyAdminAccess(adminId);

    const [byState, byCity, topLocations] = await Promise.all([
      prisma.property.groupBy({
        by: ['state'],
        _count: true,
        _avg: { price: true },
        orderBy: { _count: { _all: 'desc' } }
      }),
      prisma.property.groupBy({
        by: ['city'],
        _count: true,
        _avg: { price: true },
        orderBy: { _count: { _all: 'desc' } },
        take: 20
      }),
      this.getTopLocations()
    ]);

    return {
      byState: byState.map(s => ({
        state: s.state,
        count: s._count,
        avgPrice: Number(s._avg.price || 0)
      })),
      byCity: byCity.map(c => ({
        city: c.city,
        count: c._count,
        avgPrice: Number(c._avg.price || 0)
      })),
      topLocations
    };
  }

  /**
   * Get top performing locations
   */
  private async getTopLocations() {
    const rentals = await prisma.rental.findMany({
      where: { status: 'ACTIVE' },
      include: {
        property: {
          select: {
            state: true,
            city: true
          }
        }
      }
    });

    const locationCounts = rentals.reduce((acc, rental) => {
      const key = `${rental.property.city}, ${rental.property.state}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(locationCounts)
      .map(([location, count]) => ({ location, activeRentals: count }))
      .sort((a, b) => b.activeRentals - a.activeRentals)
      .slice(0, 10);
  }

  /**
   * Get agent performance analytics
   */
  async getAgentPerformanceAnalytics(adminId: string, dateRange?: DateRange) {
    await adminService.verifyAdminAccess(adminId);

    const range = dateRange || this.getDefaultDateRange('month');

    const agents = await prisma.user.findMany({
      where: {
        role: 'AGENT',
        totalMarkingJobs: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        email: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true,
        agentReliabilityScore: true,
        assignedMarkingJobs: {
          where: {
            createdAt: {
              gte: range.startDate,
              lte: range.endDate
            }
          },
          select: {
            status: true,
            markingFee: true,
            createdAt: true,
            completedAt: true
          }
        }
      },
      orderBy: { agentReliabilityScore: 'desc' },
      take: 50
    });

    return agents.map(agent => {
      const completedJobs = agent.assignedMarkingJobs.filter(j => j.status === 'COMPLETED');
      const totalEarnings = completedJobs.reduce((sum, j) => sum + Number(j.markingFee) * 0.25, 0);
      const avgCompletionTime = this.calculateAvgCompletionTime(completedJobs);

      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        reliabilityScore: Number(agent.agentReliabilityScore || 0),
        totalJobs: agent.totalMarkingJobs,
        completedJobs: agent.completedMarkingJobs,
        completionRate: agent.totalMarkingJobs > 0 
          ? (agent.completedMarkingJobs / agent.totalMarkingJobs) * 100 
          : 0,
        periodJobs: agent.assignedMarkingJobs.length,
        periodCompletedJobs: completedJobs.length,
        totalEarnings,
        avgCompletionTime
      };
    });
  }

  /**
   * Calculate average completion time for jobs
   */
  private calculateAvgCompletionTime(jobs: any[]): number | null {
    const completedWithTime = jobs.filter(j => j.completedAt);
    if (completedWithTime.length === 0) return null;

    const totalTime = completedWithTime.reduce((sum, job) => {
      const timeDiff = job.completedAt.getTime() - job.createdAt.getTime();
      return sum + timeDiff;
    }, 0);

    return totalTime / completedWithTime.length / (1000 * 60 * 60); // Hours
  }

  /**
   * Get revenue trends over time
   */
  async getRevenueTrends(adminId: string, period: 'day' | 'week' | 'month' = 'day', days: number = 30) {
    await adminService.verifyAdminAccess(adminId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: startDate }
      },
      select: {
        amount: true,
        paymentType: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by period
    const trends = payments.reduce((acc, payment) => {
      const date = this.formatDateByPeriod(payment.createdAt, period);
      if (!acc[date]) {
        acc[date] = {
          date,
          totalRevenue: 0,
          rentPayments: 0,
          markingFees: 0,
          premiumSubscriptions: 0,
          transactionCount: 0
        };
      }

      const amount = Number(payment.amount);
      acc[date].totalRevenue += amount;
      acc[date].transactionCount += 1;

      switch (payment.paymentType) {
        case 'RENT':
          acc[date].rentPayments += amount;
          break;
        case 'PROPERTY_MARKING':
          acc[date].markingFees += amount;
          break;
        case 'PREMIUM_UPGRADE':
          acc[date].premiumSubscriptions += amount;
          break;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(trends);
  }

  /**
   * Format date by period
   */
  private formatDateByPeriod(date: Date, period: 'day' | 'week' | 'month'): string {
    switch (period) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  }

  /**
   * Get default date range
   */
  private getDefaultDateRange(period: 'day' | 'week' | 'month' | 'year'): DateRange {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Export analytics report
   */
  async exportAnalyticsReport(adminId: string, dateRange: DateRange, format: 'json' | 'csv' = 'json') {
    await adminService.verifyAdminAccess(adminId);

    const data = await this.getPlatformOverview(adminId, dateRange);

    if (format === 'json') {
      return data;
    }

    // CSV export would be implemented here
    return data;
  }
}

export const analyticsService = new AnalyticsService();