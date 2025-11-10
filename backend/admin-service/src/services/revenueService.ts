import { PrismaClient } from '@newcondo/db';
import { forecastingService } from './forecastingService';
import { reportingService } from './reportingService';

const prisma = new PrismaClient();

interface RevenueOverviewParams {
  startDate?: Date;
  endDate?: Date;
}

interface RevenueBreakdownParams {
  startDate?: Date;
  endDate?: Date;
  groupBy: 'category' | 'source' | 'property';
}

interface RevenueTrendsParams {
  startDate?: Date;
  endDate?: Date;
  interval: 'day' | 'week' | 'month';
}

interface CommissionAnalyticsParams {
  startDate?: Date;
  endDate?: Date;
  agentId?: string;
}

interface VirtualAccountBalancesParams {
  userType?: string;
  minBalance?: number;
  maxBalance?: number;
}

interface RevenueForecastingParams {
  forecastPeriod: number;
  method: 'linear' | 'exponential' | 'moving_average';
}

interface MarkingServiceRevenueParams {
  startDate?: Date;
  endDate?: Date;
}

interface PremiumRevenueParams {
  startDate?: Date;
  endDate?: Date;
}

interface ExportRevenueReportParams {
  startDate?: Date;
  endDate?: Date;
  format: 'pdf' | 'excel' | 'csv';
  reportType: string;
}

class RevenueService {
  /**
   * Get revenue overview
   */
  async getRevenueOverview(params: RevenueOverviewParams) {
    const { startDate, endDate } = this.getDateRange(params.startDate, params.endDate);

    const [
      totalRevenue,
      platformFees,
      agentCommissions,
      propertyOwnerEarnings,
      markingServiceRevenue,
      premiumSubscriptionRevenue,
      revenueByPaymentType,
    ] = await Promise.all([
      // Total revenue (all successful payments)
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),

      // Platform fees
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { platformFee: true },
      }),

      // Agent commissions
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { agentCommission: true },
      }),

      // Property owner earnings
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { ownerAmount: true },
      }),

      // Marking service revenue
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paymentType: 'PROPERTY_MARKING',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),

      // Premium subscription revenue
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paymentType: 'PREMIUM_UPGRADE',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),

      // Revenue by payment type
      prisma.payment.groupBy({
        by: ['paymentType'],
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Calculate growth compared to previous period
    const previousPeriod = this.getPreviousPeriod(startDate, endDate);
    const previousRevenue = await this.getPreviousPeriodRevenue(previousPeriod);

    return {
      summary: {
        totalRevenue: totalRevenue._sum.amount || 0,
        platformFees: platformFees._sum.platformFee || 0,
        agentCommissions: agentCommissions._sum.agentCommission || 0,
        propertyOwnerEarnings: propertyOwnerEarnings._sum.ownerAmount || 0,
        markingServiceRevenue: markingServiceRevenue._sum.amount || 0,
        premiumSubscriptionRevenue: premiumSubscriptionRevenue._sum.amount || 0,
      },
      breakdown: revenueByPaymentType.map((item) => ({
        type: item.paymentType,
        amount: item._sum.amount || 0,
        count: item._count,
      })),
      growth: {
        percentage: this.calculateGrowth(
          Number(totalRevenue._sum.amount || 0),
          Number(previousRevenue)
        ),
        amount: Number(totalRevenue._sum.amount || 0) - Number(previousRevenue),
      },
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Get revenue breakdown by category
   */
  async getRevenueBreakdown(params: RevenueBreakdownParams) {
    const { startDate, endDate, groupBy } = params;
    const dateRange = this.getDateRange(startDate, endDate);

    let breakdown;

    switch (groupBy) {
      case 'category':
        breakdown = await this.getRevenueByCategory(dateRange.startDate, dateRange.endDate);
        break;
      case 'source':
        breakdown = await this.getRevenueBySource(dateRange.startDate, dateRange.endDate);
        break;
      case 'property':
        breakdown = await this.getRevenueByProperty(dateRange.startDate, dateRange.endDate);
        break;
      default:
        throw new Error('Invalid groupBy parameter');
    }

    return {
      breakdown,
      dateRange: dateRange,
    };
  }

  /**
   * Get revenue trends over time
   */
  async getRevenueTrends(params: RevenueTrendsParams) {
    const { startDate, endDate, interval } = params;
    const dateRange = this.getDateRange(startDate, endDate);

    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      select: {
        createdAt: true,
        amount: true,
        platformFee: true,
        paymentType: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const trends = this.groupRevenueByInterval(payments, interval);

    // Calculate moving average
    const movingAverage = this.calculateMovingAverage(trends, 7);

    return {
      trends,
      movingAverage,
      dateRange: dateRange,
    };
  }

  /**
   * Get commission analytics
   */
  async getCommissionAnalytics(params: CommissionAnalyticsParams) {
    const { startDate, endDate, agentId } = params;
    const dateRange = this.getDateRange(startDate, endDate);

    const where: any = {
      status: 'SUCCESS',
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    };

    if (agentId) {
      where.rental = {
        property: {
          agentId: agentId,
        },
      };
    }

    const [totalCommissions, commissionsByAgent, topEarningAgents] = await Promise.all([
      // Total commissions paid
      prisma.payment.aggregate({
        where,
        _sum: { agentCommission: true },
      }),

      // Commissions by agent (if no specific agent)
      !agentId
        ? this.getCommissionsByAgent(dateRange.startDate, dateRange.endDate)
        : null,

      // Top earning agents
      !agentId
        ? this.getTopEarningAgents(dateRange.startDate, dateRange.endDate, 10)
        : null,
    ]);

    return {
      totalCommissions: totalCommissions._sum.agentCommission || 0,
      commissionsByAgent: commissionsByAgent || [],
      topEarningAgents: topEarningAgents || [],
      dateRange: dateRange,
    };
  }

  /**
   * Get virtual account balances
   */
  async getVirtualAccountBalances(params: VirtualAccountBalancesParams) {
    const { userType, minBalance, maxBalance } = params;

    const where: any = { isActive: true };

    if (minBalance !== undefined || maxBalance !== undefined) {
      where.balance = {};
      if (minBalance !== undefined) where.balance.gte = minBalance;
      if (maxBalance !== undefined) where.balance.lte = maxBalance;
    }

    // Filter by user type if specified
    if (userType) {
      where.user = {
        role: userType,
      };
    }

    const [accounts, totalBalance, accountStats] = await Promise.all([
      prisma.virtualAccount.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { balance: 'desc' },
        take: 100,
      }),

      prisma.virtualAccount.aggregate({
        where,
        _sum: { balance: true },
      }),

      prisma.virtualAccount.groupBy({
        by: ['currency'],
        where,
        _sum: { balance: true },
        _count: true,
      }),
    ]);

    return {
      accounts,
      totalBalance: totalBalance._sum.balance || 0,
      accountStats: accountStats.map((stat) => ({
        currency: stat.currency,
        balance: stat._sum.balance || 0,
        count: stat._count,
      })),
    };
  }

  /**
   * Get revenue forecasting
   */
  async getRevenueForecasting(params: RevenueForecastingParams) {
    const { forecastPeriod, method } = params;

    // Get historical revenue data (last 90 days)
    const historicalData = await this.getHistoricalRevenue(90);

    // Generate forecast
    const forecast = await forecastingService.forecastRevenue({
      historicalData,
      forecastPeriod,
      method,
    });

    return {
      historical: historicalData,
      forecast,
      method,
      forecastPeriod,
    };
  }

  /**
   * Get marking service revenue
   */
  async getMarkingServiceRevenue(params: MarkingServiceRevenueParams) {
    const { startDate, endDate } = params;
    const dateRange = this.getDateRange(startDate, endDate);

    const [totalRevenue, jobCount, agentEarnings, platformEarnings] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paymentType: 'PROPERTY_MARKING',
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
        _sum: { amount: true },
      }),

      prisma.propertyMarkingJob.count({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
      }),

      // Calculate agent earnings (25% of marking fee)
      this.calculateMarkingAgentEarnings(dateRange.startDate, dateRange.endDate),

      // Calculate platform earnings (75% of marking fee)
      this.calculateMarkingPlatformEarnings(dateRange.startDate, dateRange.endDate),
    ]);

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      jobCount,
      agentEarnings,
      platformEarnings,
      averageJobValue: jobCount > 0 ? Number(totalRevenue._sum.amount || 0) / jobCount : 0,
      dateRange: dateRange,
    };
  }

  /**
   * Get premium subscription revenue
   */
  async getPremiumRevenue(params: PremiumRevenueParams) {
    const { startDate, endDate } = params;
    const dateRange = this.getDateRange(startDate, endDate);

    const [totalRevenue, subscriptionCount, activeSubscribers, churnRate] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paymentType: 'PREMIUM_UPGRADE',
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
        _sum: { amount: true },
      }),

      prisma.payment.count({
        where: {
          status: 'SUCCESS',
          paymentType: 'PREMIUM_UPGRADE',
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
      }),

      prisma.user.count({
        where: {
          isPremium: true,
          premiumExpiresAt: { gt: new Date() },
        },
      }),

      this.calculateChurnRate(dateRange.startDate, dateRange.endDate),
    ]);

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      subscriptionCount,
      activeSubscribers,
      churnRate,
      monthlyRecurringRevenue: this.calculateMRR(totalRevenue._sum.amount || 0, subscriptionCount),
      dateRange: dateRange,
    };
  }

  /**
   * Export revenue report
   */
  async exportRevenueReport(params: ExportRevenueReportParams) {
    const { startDate, endDate, format, reportType } = params;
    const dateRange = this.getDateRange(startDate, endDate);

    let data;
    switch (reportType) {
      case 'overview':
        data = await this.getRevenueOverview({ startDate: dateRange.startDate, endDate: dateRange.endDate });
        break;
      case 'breakdown':
        data = await this.getRevenueBreakdown({ 
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate, 
          groupBy: 'category' 
        });
        break;
      case 'trends':
        data = await this.getRevenueTrends({ 
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate, 
          interval: 'day' 
        });
        break;
      default:
        throw new Error('Invalid report type');
    }

    return reportingService.generateReport({
      data,
      format,
      reportType: `revenue_${reportType}`,
      dateRange: dateRange,
    });
  }

  // Helper methods
  private getDateRange(startDate?: Date, endDate?: Date) {
    return {
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate || new Date(),
    };
  }

  private getPreviousPeriod(startDate: Date, endDate: Date) {
    const duration = endDate.getTime() - startDate.getTime();
    return {
      startDate: new Date(startDate.getTime() - duration),
      endDate: new Date(startDate.getTime()),
    };
  }

  private async getPreviousPeriodRevenue(period: { startDate: Date; endDate: Date }) {
    const result = await prisma.payment.aggregate({
      where: {
        status: 'SUCCESS',
        createdAt: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
      _sum: { amount: true },
    });

    return result._sum.amount || 0;
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private async getRevenueByCategory(startDate: Date, endDate: Date) {
    return prisma.payment.groupBy({
      by: ['paymentType'],
      where: {
        status: 'SUCCESS',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true, platformFee: true },
      _count: true,
    });
  }

  private async getRevenueBySource(startDate: Date, endDate: Date) {
    // Revenue by payment method
    return prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: {
        status: 'SUCCESS',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    });
  }

  private async getRevenueByProperty(startDate: Date, endDate: Date) {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: startDate, lte: endDate },
        rental: { isNot: null },
      },
      include: {
        rental: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    // Group by property
    const grouped: { [key: string]: any } = {};
    payments.forEach((payment) => {
      if (payment.rental?.property) {
        const propertyId = payment.rental.property.id;
        if (!grouped[propertyId]) {
          grouped[propertyId] = {
            property: payment.rental.property,
            revenue: 0,
            count: 0,
          };
        }
        grouped[propertyId].revenue += Number(payment.amount);
        grouped[propertyId].count++;
      }
    });

    return Object.values(grouped).sort((a, b) => b.revenue - a.revenue);
  }

  private groupRevenueByInterval(payments: any[], interval: string) {
    const grouped: any = {};

    payments.forEach((payment) => {
      let key: string;
      const date = new Date(payment.createdAt);

      switch (interval) {
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
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          revenue: 0,
          platformFees: 0,
          count: 0,
        };
      }

      grouped[key].revenue += Number(payment.amount);
      grouped[key].platformFees += Number(payment.platformFee || 0);
      grouped[key].count++;
    });

    return Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }

  private calculateMovingAverage(data: any[], window: number) {
    const result: any[] = [];

    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - window + 1);
      const subset = data.slice(start, i + 1);
      const avg = subset.reduce((sum, item) => sum + item.revenue, 0) / subset.length;
      result.push({
        date: data[i].date,
        movingAverage: avg,
      });
    }

    return result;
  }

  private async getCommissionsByAgent(startDate: Date, endDate: Date) {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: startDate, lte: endDate },
        agentCommission: { gt: 0 },
        rental: {
          property: {
            agent: { isNot: null },
          },
        },
      },
      include: {
        rental: {
          include: {
            property: {
              include: {
                agent: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Group by agent
    const grouped: { [key: string]: any } = {};
    payments.forEach((payment) => {
      const agent = payment.rental?.property?.agent;
      if (agent) {
        if (!grouped[agent.id]) {
          grouped[agent.id] = {
            agent,
            totalCommission: 0,
            count: 0,
          };
        }
        grouped[agent.id].totalCommission += Number(payment.agentCommission || 0);
        grouped[agent.id].count++;
      }
    });

    return Object.values(grouped).sort((a, b) => b.totalCommission - a.totalCommission);
  }

  private async getTopEarningAgents(startDate: Date, endDate: Date, limit: number) {
    const commissions = await this.getCommissionsByAgent(startDate, endDate);
    return commissions.slice(0, limit);
  }

  private async getHistoricalRevenue(days: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        amount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return this.groupRevenueByInterval(payments, 'day');
  }

  private async calculateMarkingAgentEarnings(startDate: Date, endDate: Date) {
    const payments = await prisma.payment.aggregate({
      where: {
        status: 'SUCCESS',
        paymentType: 'PROPERTY_MARKING',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    // Agents get 25% of marking fee
    return Number(payments._sum.amount || 0) * 0.25;
  }

  private async calculateMarkingPlatformEarnings(startDate: Date, endDate: Date) {
    const payments = await prisma.payment.aggregate({
      where: {
        status: 'SUCCESS',
        paymentType: 'PROPERTY_MARKING',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    // Platform gets 75% of marking fee
    return Number(payments._sum.amount || 0) * 0.75;
  }

  private async calculateChurnRate(startDate: Date, endDate: Date) {
    // Get users who were premium at start of period
    const premiumAtStart = await prisma.user.count({
      where: {
        isPremium: true,
        premiumExpiresAt: { gte: startDate },
      },
    });

    // Get users who cancelled/expired during period
    const cancelled = await prisma.user.count({
      where: {
        isPremium: false,
        premiumExpiresAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    if (premiumAtStart === 0) return 0;
    return (cancelled / premiumAtStart) * 100;
  }

  private calculateMRR(totalRevenue: number, subscriptionCount: number) {
    // Assuming annual subscriptions, divide by 12
    return totalRevenue / 12;
  }
}

export const revenueService = new RevenueService();