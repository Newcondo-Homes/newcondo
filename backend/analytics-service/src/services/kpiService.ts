// backend/analytics-service/src/services/kpiService.ts

import { PrismaClient, Prisma } from '@prisma/client';
import { CacheService } from './cacheService';
import { getDateRange } from '../../../shared/src/utils/dateRangeHelper';
import { calculatePercentageChange, calculateGrowthRate } from '../../../shared/src/utils/percentageCalculator';

const prisma = new PrismaClient();

// Define necessary enums/types from your shared package or Prisma client for clarity/type safety
type UserRole = 'ADMIN' | 'AGENT' | 'OWNER' | 'RENTER'; // Adjust based on your actual Role enum
type PropertyStatus = 'DRAFT' | 'PENDING_VERIFICATION' | 'PUBLISHED' | 'RENTED' | 'ARCHIVED'; // Adjust based on your actual PropertyStatus enum
type PaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'RELEASED'; // Adjust based on your actual PaymentStatus enum
type MarkingJobStatus = 'QUEUED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED'; // Adjust based on your actual MarkingJobStatus enum

export class KPIService {
  private cacheService: CacheService;

  constructor() {
    // Assuming CacheService is properly defined elsewhere
    this.cacheService = new CacheService();
  }

  /**
   * Get all KPIs for specified period
   */
  async getAllKPIs(dateRange: string, compareWith?: string) {
    const cacheKey = `kpis:all:${dateRange}:${compareWith || 'none'}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = getDateRange(dateRange);
    let comparisonPeriod;

    if (compareWith) {
      comparisonPeriod = getDateRange(compareWith);
    }

    const [userKPIs, propertyKPIs, revenueKPIs, engagementKPIs, conversionKPIs, markingServiceKPIs] =
      await Promise.all([
        this.getUserKPIs(dateRange),
        this.getPropertyKPIs(dateRange),
        this.getRevenueKPIs(dateRange),
        this.getEngagementKPIs(dateRange),
        this.getConversionKPIs(dateRange),
        this.getMarkingServiceKPIs(dateRange) // Added Marking Service KPIs
      ]);

    const allKPIs = {
      period: { startDate, endDate },
      comparisonPeriod,
      users: userKPIs,
      properties: propertyKPIs,
      revenue: revenueKPIs,
      engagement: engagementKPIs,
      conversions: conversionKPIs,
      markingService: markingServiceKPIs, // Included
      timestamp: new Date()
    };

    await this.cacheService.set(cacheKey, allKPIs, 600); // Cache for 10 minutes
    return allKPIs;
  }

  /**
   * Get user-related KPIs
   */
  async getUserKPIs(dateRange: string) {
    const { startDate, endDate } = getDateRange(dateRange);
    const previousPeriod = this.getPreviousPeriod(startDate, endDate);

    const [
      currentStats,
      previousStats,
      verificationRate,
      retentionRate,
      churnRate
    ] = await Promise.all([
      this.getUserStats(startDate, endDate),
      this.getUserStats(previousPeriod.startDate, previousPeriod.endDate),
      this.calculateVerificationRate(startDate, endDate),
      this.calculateRetentionRate(startDate, endDate),
      this.calculateChurnRate(startDate, endDate)
    ]);

    return {
      totalUsers: {
        value: currentStats.total,
        change: calculatePercentageChange(previousStats.total, currentStats.total),
        trend: this.getTrend(previousStats.total, currentStats.total)
      },
      newUsers: {
        value: currentStats.new,
        change: calculatePercentageChange(previousStats.new, currentStats.new),
        trend: this.getTrend(previousStats.new, currentStats.new)
      },
      activeUsers: {
        value: currentStats.active,
        change: calculatePercentageChange(previousStats.active, currentStats.active),
        trend: this.getTrend(previousStats.active, currentStats.active)
      },
      verificationRate: {
        value: verificationRate,
        target: 80, // Target 80% verification rate
        status: verificationRate >= 80 ? 'on-track' : 'needs-attention'
      },
      retentionRate: {
        value: retentionRate,
        target: 75,
        status: retentionRate >= 75 ? 'on-track' : 'needs-attention'
      },
      churnRate: {
        value: churnRate,
        target: 10, // Target less than 10% churn
        status: churnRate <= 10 ? 'on-track' : 'needs-attention'
      },
      usersByRole: currentStats.byRole
    };
  }

  /**
   * Get property-related KPIs
   */
  async getPropertyKPIs(dateRange: string) {
    const { startDate, endDate } = getDateRange(dateRange);
    const previousPeriod = this.getPreviousPeriod(startDate, endDate);

    const [
      currentStats,
      previousStats,
      occupancyRate,
      avgTimeToRent,
      listingQuality
    ] = await Promise.all([
      this.getPropertyStats(startDate, endDate),
      this.getPropertyStats(previousPeriod.startDate, previousPeriod.endDate),
      this.calculateOccupancyRate(),
      this.calculateAvgTimeToRent(startDate, endDate),
      this.calculateListingQualityScore(startDate, endDate)
    ]);

    return {
      totalProperties: {
        value: currentStats.total,
        change: calculatePercentageChange(previousStats.total, currentStats.total),
        trend: this.getTrend(previousStats.total, currentStats.total)
      },
      newListings: {
        value: currentStats.new,
        change: calculatePercentageChange(previousStats.new, currentStats.new),
        trend: this.getTrend(previousStats.new, currentStats.new)
      },
      publishedProperties: {
        value: currentStats.published,
        change: calculatePercentageChange(previousStats.published, currentStats.published),
        trend: this.getTrend(previousStats.published, currentStats.published)
      },
      rentedProperties: {
        value: currentStats.rented,
        change: calculatePercentageChange(previousStats.rented, currentStats.rented),
        trend: this.getTrend(previousStats.rented, currentStats.rented)
      },
      occupancyRate: {
        value: occupancyRate,
        target: 70,
        status: occupancyRate >= 70 ? 'on-track' : 'needs-attention'
      },
      avgTimeToRent: {
        value: avgTimeToRent,
        unit: 'days',
        target: 14,
        status: avgTimeToRent <= 14 ? 'on-track' : 'needs-attention'
      },
      listingQualityScore: {
        value: listingQuality,
        target: 80,
        status: listingQuality >= 80 ? 'on-track' : 'needs-attention'
      }
    };
  }

  /**
   * Get revenue-related KPIs
   */
  async getRevenueKPIs(dateRange: string) {
    const { startDate, endDate } = getDateRange(dateRange);
    const previousPeriod = this.getPreviousPeriod(startDate, endDate);

    const [
      currentRevenue,
      previousRevenue,
      mrr,
      arpu,
      ltv
    ] = await Promise.all([
      this.getRevenueStats(startDate, endDate),
      this.getRevenueStats(previousPeriod.startDate, previousPeriod.endDate),
      this.calculateMRR(endDate),
      this.calculateARPU(startDate, endDate),
      this.calculateLTV()
    ]);

    return {
      totalRevenue: {
        value: currentRevenue.total,
        change: calculatePercentageChange(previousRevenue.total, currentRevenue.total),
        trend: this.getTrend(previousRevenue.total, currentRevenue.total),
        currency: 'NGN'
      },
      platformFees: {
        value: currentRevenue.platformFees,
        change: calculatePercentageChange(previousRevenue.platformFees, currentRevenue.platformFees),
        trend: this.getTrend(previousRevenue.platformFees, currentRevenue.platformFees),
        currency: 'NGN'
      },
      transactionCount: {
        value: currentRevenue.transactionCount,
        change: calculatePercentageChange(
          previousRevenue.transactionCount,
          currentRevenue.transactionCount
        ),
        trend: this.getTrend(previousRevenue.transactionCount, currentRevenue.transactionCount)
      },
      avgTransactionValue: {
        value: currentRevenue.avgTransactionValue,
        change: calculatePercentageChange(
          previousRevenue.avgTransactionValue,
          currentRevenue.avgTransactionValue
        ),
        trend: this.getTrend(
          previousRevenue.avgTransactionValue,
          currentRevenue.avgTransactionValue
        ),
        currency: 'NGN'
      },
      mrr: {
        value: mrr,
        currency: 'NGN',
        description: 'Monthly Recurring Revenue'
      },
      arpu: {
        value: arpu,
        currency: 'NGN',
        description: 'Average Revenue Per User'
      },
      ltv: {
        value: ltv,
        currency: 'NGN',
        description: 'Customer Lifetime Value'
      }
    };
  }

  /**
   * Get engagement KPIs
   */
  async getEngagementKPIs(dateRange: string) {
    const { startDate, endDate } = getDateRange(dateRange);
    const previousPeriod = this.getPreviousPeriod(startDate, endDate);

    const [
      currentEngagement,
      previousEngagement,
      dau,
      mau,
      sessionDuration
    ] = await Promise.all([
      this.getEngagementStats(startDate, endDate),
      this.getEngagementStats(previousPeriod.startDate, previousPeriod.endDate),
      this.calculateDAU(endDate),
      this.calculateMAU(endDate),
      this.calculateAvgSessionDuration(startDate, endDate)
    ]);

    return {
      propertyViews: {
        value: currentEngagement.views,
        change: calculatePercentageChange(previousEngagement.views, currentEngagement.views),
        trend: this.getTrend(previousEngagement.views, currentEngagement.views)
      },
      searches: {
        value: currentEngagement.searches,
        change: calculatePercentageChange(previousEngagement.searches, currentEngagement.searches),
        trend: this.getTrend(previousEngagement.searches, currentEngagement.searches)
      },
      favorites: {
        value: currentEngagement.favorites,
        change: calculatePercentageChange(previousEngagement.favorites, currentEngagement.favorites),
        trend: this.getTrend(previousEngagement.favorites, currentEngagement.favorites)
      },
      dau: {
        value: dau,
        description: 'Daily Active Users'
      },
      mau: {
        value: mau,
        description: 'Monthly Active Users'
      },
      dauMauRatio: {
        value: mau > 0 ? (dau / mau) * 100 : 0,
        target: 20,
        status: (mau > 0 ? (dau / mau) * 100 : 0) >= 20 ? 'on-track' : 'needs-attention',
        description: 'DAU/MAU Ratio - Stickiness metric'
      },
      avgSessionDuration: {
        value: sessionDuration,
        unit: 'minutes',
        target: 10
      }
    };
  }

  /**
   * Get conversion rate KPIs
   */
  async getConversionKPIs(dateRange: string) {
    const { startDate, endDate } = getDateRange(dateRange);

    const [
      signupConversion,
      verificationConversion,
      listingConversion,
      rentalConversion,
      paymentConversion
    ] = await Promise.all([
      this.calculateSignupConversion(startDate, endDate),
      this.calculateVerificationConversion(startDate, endDate),
      this.calculateListingConversion(startDate, endDate),
      this.calculateRentalConversion(startDate, endDate),
      this.calculatePaymentConversion(startDate, endDate)
    ]);

    return {
      signupConversion: {
        value: signupConversion,
        target: 30,
        status: signupConversion >= 30 ? 'on-track' : 'needs-attention',
        description: 'Visitors to signup'
      },
      verificationConversion: {
        value: verificationConversion,
        target: 70,
        status: verificationConversion >= 70 ? 'on-track' : 'needs-attention',
        description: 'Signup to verified'
      },
      listingConversion: {
        value: listingConversion,
        target: 40,
        status: listingConversion >= 40 ? 'on-track' : 'needs-attention',
        description: 'Property owners creating listings'
      },
      rentalConversion: {
        value: rentalConversion,
        target: 15,
        status: rentalConversion >= 15 ? 'on-track' : 'needs-attention',
        description: 'Property views to rentals'
      },
      paymentConversion: {
        value: paymentConversion,
        target: 90,
        status: paymentConversion >= 90 ? 'on-track' : 'needs-attention',
        description: 'Initiated to successful payments'
      }
    };
  }

  /**
   * Get marking service KPIs
   */
  async getMarkingServiceKPIs(dateRange: string) {
    const { startDate, endDate } = getDateRange(dateRange);
    const previousPeriod = this.getPreviousPeriod(startDate, endDate);

    const [
      currentStats,
      previousStats,
      completionRate,
      avgCompletionTime,
      agentUtilization
    ] = await Promise.all([
      this.getMarkingStats(startDate, endDate),
      this.getMarkingStats(previousPeriod.startDate, previousPeriod.endDate),
      this.calculateMarkingCompletionRate(startDate, endDate),
      this.calculateAvgMarkingCompletionTime(startDate, endDate),
      this.calculateAgentUtilization(startDate, endDate)
    ]);

    return {
      totalJobs: {
        value: currentStats.total,
        change: calculatePercentageChange(previousStats.total, currentStats.total),
        trend: this.getTrend(previousStats.total, currentStats.total)
      },
      completedJobs: {
        value: currentStats.completed,
        change: calculatePercentageChange(previousStats.completed, currentStats.completed),
        trend: this.getTrend(previousStats.completed, currentStats.completed)
      },
      pendingJobs: {
        value: currentStats.pending,
        target: 20,
        status: currentStats.pending <= 20 ? 'on-track' : 'needs-attention'
      },
      completionRate: {
        value: completionRate,
        target: 85,
        status: completionRate >= 85 ? 'on-track' : 'needs-attention'
      },
      avgCompletionTime: {
        value: avgCompletionTime,
        unit: 'hours',
        target: 24,
        status: avgCompletionTime <= 24 ? 'on-track' : 'needs-attention'
      },
      agentUtilization: {
        value: agentUtilization,
        target: 60,
        status: agentUtilization >= 60 ? 'on-track' : 'needs-attention',
        description: 'Percentage of available agents actively working'
      },
      revenue: {
        value: currentStats.revenue,
        change: calculatePercentageChange(previousStats.revenue, currentStats.revenue),
        trend: this.getTrend(previousStats.revenue, currentStats.revenue),
        currency: 'NGN'
      }
    };
  }

  /**
   * Calculate custom KPI
   */
  async calculateCustomKPI(metric: string, dateRange: string, filters?: any) {
    const { startDate, endDate } = getDateRange(dateRange);

    // This would be implemented based on the specific metric requested
    // For now, return a placeholder structure
    return {
      metric,
      period: { startDate, endDate },
      value: 0,
      filters,
      calculatedAt: new Date()
    };
  }

  // Private helper methods

  private getPreviousPeriod(startDate: Date, endDate: Date) {
    const duration = endDate.getTime() - startDate.getTime();
    return {
      startDate: new Date(startDate.getTime() - duration),
      endDate: new Date(startDate.getTime())
    };
  }

  private getTrend(previous: number, current: number): 'up' | 'down' | 'stable' {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  }

  private async getUserStats(startDate: Date, endDate: Date) {
    const [total, newUsers, active, byRole] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { lte: endDate } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.eventLog.groupBy({
        by: ['userId'],
        where: {
          timestamp: { gte: startDate, lte: endDate },
          userId: { not: null }
        }
      }).then(result => result.length),
      prisma.user.groupBy({
        by: ['role'],
        where: { createdAt: { lte: endDate } },
        _count: true
      })
    ]);

    return {
      total,
      new: newUsers,
      active,
      byRole: byRole.reduce((acc, r) => ({ ...acc, [r.role]: r._count }), {})
    };
  }

  private async getPropertyStats(startDate: Date, endDate: Date) {
    const [total, newProps, published, rented] = await Promise.all([
      prisma.property.count({
        where: { createdAt: { lte: endDate } }
      }),
      prisma.property.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.property.count({
        where: {
          status: 'PUBLISHED' as PropertyStatus,
          createdAt: { lte: endDate }
        }
      }),
      prisma.property.count({
        where: {
          status: 'RENTED' as PropertyStatus,
          updatedAt: { gte: startDate, lte: endDate }
        }
      })
    ]);

    return { total, new: newProps, published, rented };
  }

  private async getRevenueStats(startDate: Date, endDate: Date) {
    // NOTE: platformFee is assumed to be stored as Decimal or BigInt and must be converted to Number for JS math
    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS' as PaymentStatus,
        paidAt: { gte: startDate, lte: endDate }
      },
      select: {
        amount: true,
        platformFee: true // This is the Newcondo revenue portion
      }
    });

    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const platformFees = payments.reduce((sum, p) => sum + Number(p.platformFee || 0), 0);
    const transactionCount = payments.length;
    const avgTransactionValue = transactionCount > 0 ? total / transactionCount : 0;

    return { total, platformFees, transactionCount, avgTransactionValue };
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

  private async getMarkingStats(startDate: Date, endDate: Date) {
    // Assuming PropertyMarkingJob model exists in Prisma
    const jobs = await prisma.propertyMarkingJob.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      select: {
        status: true,
        markingFee: true
      }
    });

    const total = jobs.length;
    const completed = jobs.filter(j => j.status === 'COMPLETED').length;
    const pending = jobs.filter(j => ['QUEUED', 'ASSIGNED'].includes(j.status)).length;
    // Assuming platform keeps 50% of the markingFee as revenue based on typical service split
    // NOTE: Adjust 0.75 if your platform revenue share is different for marking services.
    const revenue = jobs
      .filter(j => j.status === 'COMPLETED')
      .reduce((sum, j) => sum + Number(j.markingFee) * 0.75, 0);

    return { total, completed, pending, revenue };
  }

  private async calculateVerificationRate(startDate: Date, endDate: Date): Promise<number> {
    const [total, verified] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          verificationStatus: 'VERIFIED'
        }
      })
    ]);

    return total > 0 ? (verified / total) * 100 : 0;
  }

  private async calculateRetentionRate(startDate: Date, endDate: Date): Promise<number> {
    // Users who signed up before the period and were active during the period
    const usersBeforePeriod = await prisma.user.findMany({
      where: { createdAt: { lt: startDate } },
      select: { id: true }
    });

    const activeUsers = await prisma.eventLog.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: startDate, lte: endDate },
        userId: { in: usersBeforePeriod.map(u => u.id) }
      }
    });

    return usersBeforePeriod.length > 0
      ? (activeUsers.length / usersBeforePeriod.length) * 100
      : 0;
  }

  private async calculateChurnRate(startDate: Date, endDate: Date): Promise<number> {
    // Users who were active before but not during the period
    const monthBefore = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeBeforePeriod = await prisma.eventLog.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: monthBefore, lt: startDate },
        userId: { not: null }
      }
    });

    const activeDuringPeriod = await prisma.eventLog.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: startDate, lte: endDate },
        userId: { not: null }
      }
    });

    const activeDuringSet = new Set(activeDuringPeriod.map(a => a.userId));
    const churned = activeBeforePeriod.filter(u => !activeDuringSet.has(u.userId)).length;

    return activeBeforePeriod.length > 0
      ? (churned / activeBeforePeriod.length) * 100
      : 0;
  }

  private async calculateOccupancyRate(): Promise<number> {
    // NOTE: This assumes 'RENTED' and 'PUBLISHED' are the relevant statuses for the denominator.
    const [total, rented] = await Promise.all([
      prisma.property.count({
        where: { status: { in: ['PUBLISHED' as PropertyStatus, 'RENTED' as PropertyStatus] } }
      }),
      prisma.property.count({
        where: { status: 'RENTED' as PropertyStatus }
      })
    ]);

    return total > 0 ? (rented / total) * 100 : 0;
  }

  private async calculateAvgTimeToRent(startDate: Date, endDate: Date): Promise<number> {
    const rentedProperties = await prisma.property.findMany({
      where: {
        status: 'RENTED' as PropertyStatus,
        updatedAt: { gte: startDate, lte: endDate } // Assuming updatedAt reflects the rent date
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    if (rentedProperties.length === 0) return 0;

    const totalDays = rentedProperties.reduce((sum, p) => {
      // Calculate the difference in milliseconds and convert to days
      const days = (p.updatedAt.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return totalDays / rentedProperties.length;
  }

  private async calculateListingQualityScore(startDate: Date, endDate: Date): Promise<number> {
    const properties = await prisma.property.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      select: {
        description: true,
        images: true, // Assuming this is an array field (e.g., Json)
        features: true, // Assuming this is an array field (e.g., Json)
        boundaryVerified: true
      }
    });

    if (properties.length === 0) return 0;

    const scores = properties.map(p => {
      let score = 0;
      // Weighting logic (25% each)
      if (p.description && p.description.length >= 100) score += 25;
      if (p.images && Array.isArray(p.images) && p.images.length >= 5) score += 25;
      if (p.features && Array.isArray(p.features) && p.features.length >= 3) score += 25;
      if (p.boundaryVerified) score += 25;
      return score;
    });

    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }

  private async calculateMRR(endDate: Date): Promise<number> {
    const oneMonthAgo = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // MRR is based on recurring revenue (platform fees from rent payments)
    const monthlyRevenue = await prisma.payment.aggregate({
      where: {
        status: 'SUCCESS' as PaymentStatus,
        paymentType: 'RENT',
        paidAt: { gte: oneMonthAgo, lte: endDate }
      },
      _sum: { platformFee: true }
    });

    // NOTE: Convert from Decimal/BigInt to Number
    return Number(monthlyRevenue._sum.platformFee || 0);
  }

  private async calculateARPU(startDate: Date, endDate: Date): Promise<number> {
    const [revenue, activeUsers] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS' as PaymentStatus,
          paidAt: { gte: startDate, lte: endDate }
        },
        _sum: { platformFee: true }
      }),
      prisma.eventLog.groupBy({
        by: ['userId'],
        where: {
          timestamp: { gte: startDate, lte: endDate },
          userId: { not: null }
        }
      }).then(result => result.length)
    ]);

    const totalRevenue = Number(revenue._sum.platformFee || 0);
    return activeUsers > 0 ? totalRevenue / activeUsers : 0;
  }

  private async calculateLTV(): Promise<number> {
    // Simplified LTV calculation: ARPU * Average customer lifespan
    // Using a trailing 30-day ARPU for calculation
    const arpu = await this.calculateARPU(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );

    // Assume average customer lifespan of 12 months for now (Industry Benchmark)
    const avgLifespanMonths = 12;
    return arpu * avgLifespanMonths;
  }

  private async calculateDAU(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const activeUsers = await prisma.eventLog.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: startOfDay, lte: endOfDay },
        userId: { not: null }
      }
    });

    return activeUsers.length;
  }

  private async calculateMAU(date: Date): Promise<number> {
    const oneMonthAgo = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeUsers = await prisma.eventLog.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: oneMonthAgo, lte: date },
        userId: { not: null }
      }
    });

    return activeUsers.length;
  }

  private async calculateAvgSessionDuration(startDate: Date, endDate: Date): Promise<number> {
    // This is simplified, as true session duration requires robust client-side tracking.
    // In a production environment, you would use event logs (SESSION_START, SESSION_END)
    // or external analytics data. Returning a placeholder or estimate.
    return 15; // Placeholder: Average of 15 minutes per session
  }

  private async calculateSignupConversion(startDate: Date, endDate: Date): Promise<number> {
    // Visitors to signups requires a 'VISITOR_LANDED' event log, which is typically high volume.
    // Placeholder logic relies on a presumed estimate of visitors/signups.
    const signups = await prisma.user.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });
    
    // Estimate a visitor count (e.g., 3x signups) if no proper visitor tracking exists
    const estimatedVisitors = signups * 3; 

    return estimatedVisitors > 0 ? (signups / estimatedVisitors) * 100 : 0;
  }

  private async calculateVerificationConversion(startDate: Date, endDate: Date): Promise<number> {
    const [signups, verified] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          verificationStatus: 'VERIFIED'
        }
      })
    ]);

    return signups > 0 ? (verified / signups) * 100 : 0;
  }

  private async calculateListingConversion(startDate: Date, endDate: Date): Promise<number> {
    const [owners, withListings] = await Promise.all([
      prisma.user.count({
        where: {
          role: { in: ['OWNER' as UserRole, 'AGENT' as UserRole] },
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.user.count({
        where: {
          role: { in: ['OWNER' as UserRole, 'AGENT' as UserRole] },
          createdAt: { gte: startDate, lte: endDate },
          properties: { some: {} } // Checks if the user has any listed properties
        }
      })
    ]);

    return owners > 0 ? (withListings / owners) * 100 : 0;
  }

  private async calculateRentalConversion(startDate: Date, endDate: Date): Promise<number> {
    const [propertyViews, successfulRentals] = await Promise.all([
      prisma.eventLog.count({
        where: {
          type: 'PROPERTY_VIEWED',
          timestamp: { gte: startDate, lte: endDate }
        }
      }),
      prisma.rental.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          isConfirmed: true // Use isConfirmed to denote a successful, non-cancelled rental
        }
      })
    ]);

    return propertyViews > 0 ? (successfulRentals / propertyViews) * 100 : 0;
  }

  private async calculatePaymentConversion(startDate: Date, endDate: Date): Promise<number> {
    const [initiatedPayments, successfulPayments] = await Promise.all([
      prisma.payment.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.payment.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'SUCCESS' as PaymentStatus
        }
      })
    ]);

    return initiatedPayments > 0 ? (successfulPayments / initiatedPayments) * 100 : 0;
  }

  private async calculateMarkingCompletionRate(startDate: Date, endDate: Date): Promise<number> {
    // Assuming PropertyMarkingJob model exists
    const [totalJobs, completedJobs] = await Promise.all([
      prisma.propertyMarkingJob.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.propertyMarkingJob.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED' as MarkingJobStatus
        }
      })
    ]);

    return totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
  }

  private async calculateAvgMarkingCompletionTime(startDate: Date, endDate: Date): Promise<number> {
    // Assuming PropertyMarkingJob has createdAt and completedAt fields
    const completedJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: 'COMPLETED' as MarkingJobStatus,
        completedAt: { gte: startDate, lte: endDate }
      },
      select: {
        createdAt: true,
        completedAt: true
      }
    });

    if (completedJobs.length === 0) return 0;

    const totalHours = completedJobs.reduce((sum, job) => {
      // Calculate the difference in milliseconds and convert to hours
      const hours = (job.completedAt!.getTime() - job.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return totalHours / completedJobs.length;
  }

  private async calculateAgentUtilization(startDate: Date, endDate: Date): Promise<number> {
    // Total agents registered
    const totalAgents = await prisma.user.count({
      where: { role: 'AGENT' as UserRole }
    });

    if (totalAgents === 0) return 0;

    // Agents assigned/completed jobs during the period
    const activeAgents = await prisma.propertyMarkingJob.groupBy({
      by: ['agentId'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        agentId: { not: null }
      }
    }).then(result => result.length);

    return (activeAgents / totalAgents) * 100;
  }
}