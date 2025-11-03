import { PrismaClient, PropertyStatus } from '@prisma/client';
import { ViewTrackingService } from './viewTrackingService';

const prisma = new PrismaClient();

interface PerformanceFilters {
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

interface PropertyPerformanceMetrics {
  propertyId: string;
  propertyTitle: string;
  totalViews: number;
  uniqueViews: number;
  totalRentals: number;
  activeRentals: number;
  totalRevenue: number;
  averageViewsPerDay: number;
  conversionRate: number;
  daysOnMarket: number;
  lastViewedAt: Date | null;
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

interface ViewAnalytics {
  propertyId: string;
  period: string;
  totalViews: number;
  uniqueViews: number;
  viewsByDate: Array<{ date: string; views: number }>;
  peakViewingTime: string;
  averageViewDuration: number;
  bounceRate: number;
}

interface ConversionRate {
  propertyId: string;
  totalViews: number;
  totalRentals: number;
  conversionRate: number;
  comparisonToAverage: number;
  trend: 'improving' | 'declining' | 'stable';
}

export class PropertyPerformanceService {
  private viewTrackingService: ViewTrackingService;

  constructor() {
    this.viewTrackingService = new ViewTrackingService();
  }

  /**
   * Get comprehensive performance metrics for a property
   */
  async getPropertyPerformance(
    propertyId: string,
    userId: string
  ): Promise<PropertyPerformanceMetrics> {
    // Verify ownership
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ ownerId: userId }, { agentId: userId }],
      },
      include: {
        rentals: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!property) {
      throw new Error('Property not found or access denied');
    }

    // Calculate metrics
    const totalViews = property.viewCount || 0;
    const uniqueViews = await this.viewTrackingService.getUniqueViewCount(propertyId);
    
    const totalRentals = property.rentals.length;
    const activeRentals = property.rentals.filter(
      (r) => r.status === 'ACTIVE'
    ).length;

    const totalRevenue = property.rentals.reduce((sum, rental) => {
      const paidPayments = rental.payments.filter(
        (p) => p.status === 'SUCCESS' || p.status === 'RELEASED'
      );
      return sum + paidPayments.reduce((pSum, p) => pSum + Number(p.amount), 0);
    }, 0);

    const daysOnMarket = Math.floor(
      (Date.now() - property.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const averageViewsPerDay = daysOnMarket > 0 ? totalViews / daysOnMarket : 0;

    const conversionRate = totalViews > 0 ? (totalRentals / totalViews) * 100 : 0;

    // Get last view timestamp
    const lastView = await this.viewTrackingService.getLastViewTime(propertyId);

    // Determine performance rating
    const performance = this.calculatePerformanceRating(
      conversionRate,
      averageViewsPerDay,
      daysOnMarket
    );

    return {
      propertyId: property.id,
      propertyTitle: property.title,
      totalViews,
      uniqueViews,
      totalRentals,
      activeRentals,
      totalRevenue,
      averageViewsPerDay: Math.round(averageViewsPerDay * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      daysOnMarket,
      lastViewedAt: lastView,
      performance,
    };
  }

  /**
   * Get performance for all properties owned by user
   */
  async getAllPropertiesPerformance(
    userId: string,
    filters: PerformanceFilters
  ): Promise<PropertyPerformanceMetrics[]> {
    const whereClause: any = {
      OR: [{ ownerId: userId }, { agentId: userId }],
    };

    if (filters.status) {
      whereClause.status = filters.status as PropertyStatus;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    const properties = await prisma.property.findMany({
      where: whereClause,
      include: {
        rentals: {
          include: {
            payments: true,
          },
        },
      },
    });

    const performanceMetrics = await Promise.all(
      properties.map((property) =>
        this.getPropertyPerformance(property.id, userId)
      )
    );

    return performanceMetrics;
  }

  /**
   * Get view analytics for a property
   */
  async getPropertyViewAnalytics(
    propertyId: string,
    userId: string,
    period: string
  ): Promise<ViewAnalytics> {
    // Verify ownership
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ ownerId: userId }, { agentId: userId }],
      },
    });

    if (!property) {
      throw new Error('Property not found or access denied');
    }

    const now = new Date();
    const startDate = this.getStartDateByPeriod(period);

    // Get view events from EventLog
    const viewEvents = await prisma.eventLog.findMany({
      where: {
        type: 'PROPERTY_VIEWED',
        timestamp: {
          gte: startDate,
          lte: now,
        },
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    const totalViews = viewEvents.length;
    const uniqueViews = new Set(viewEvents.map((e) => e.userId).filter(Boolean)).size;

    // Group views by date
    const viewsByDate = this.groupViewsByDate(viewEvents, period);

    // Calculate peak viewing time
    const peakViewingTime = this.calculatePeakViewingTime(viewEvents);

    // Calculate average view duration (mock data - would need session tracking)
    const averageViewDuration = 45; // seconds

    // Calculate bounce rate (mock data - would need interaction tracking)
    const bounceRate = 35; // percentage

    return {
      propertyId,
      period,
      totalViews,
      uniqueViews,
      viewsByDate,
      peakViewingTime,
      averageViewDuration,
      bounceRate,
    };
  }

  /**
   * Get rental conversion rate for a property
   */
  async getPropertyConversionRate(
    propertyId: string,
    userId: string
  ): Promise<ConversionRate> {
    // Verify ownership
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ ownerId: userId }, { agentId: userId }],
      },
      include: {
        rentals: true,
      },
    });

    if (!property) {
      throw new Error('Property not found or access denied');
    }

    const totalViews = property.viewCount || 0;
    const totalRentals = property.rentals.length;
    const conversionRate = totalViews > 0 ? (totalRentals / totalViews) * 100 : 0;

    // Get platform average conversion rate
    const platformAverage = await this.getPlatformAverageConversionRate();
    const comparisonToAverage = platformAverage > 0 
      ? ((conversionRate - platformAverage) / platformAverage) * 100 
      : 0;

    // Calculate trend
    const trend = await this.calculateConversionTrend(propertyId);

    return {
      propertyId,
      totalViews,
      totalRentals,
      conversionRate: Math.round(conversionRate * 100) / 100,
      comparisonToAverage: Math.round(comparisonToAverage * 100) / 100,
      trend,
    };
  }

  /**
   * Compare multiple properties
   */
  async getPropertyComparison(
    propertyIds: string[],
    userId: string
  ): Promise<PropertyPerformanceMetrics[]> {
    const comparisons = await Promise.all(
      propertyIds.map((id) => this.getPropertyPerformance(id, userId))
    );

    return comparisons;
  }

  /**
   * Get performance ranking
   */
  async getPerformanceRanking(
    userId: string,
    metric: string,
    limit: number
  ): Promise<{ best: PropertyPerformanceMetrics[]; worst: PropertyPerformanceMetrics[] }> {
    const allProperties = await this.getAllPropertiesPerformance(userId, {});

    // Sort by metric
    const sorted = [...allProperties].sort((a, b) => {
      switch (metric) {
        case 'views':
          return b.totalViews - a.totalViews;
        case 'rentals':
          return b.totalRentals - a.totalRentals;
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'conversion':
          return b.conversionRate - a.conversionRate;
        default:
          return b.totalViews - a.totalViews;
      }
    });

    return {
      best: sorted.slice(0, limit),
      worst: sorted.slice(-limit).reverse(),
    };
  }

  /**
   * Get marketing effectiveness
   */
  async getMarketingEffectiveness(
    propertyId: string,
    userId: string
  ): Promise<any> {
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ ownerId: userId }, { agentId: userId }],
      },
    });

    if (!property) {
      throw new Error('Property not found or access denied');
    }

    // Calculate various marketing metrics
    const viewCount = property.viewCount || 0;
    const favoriteCount = property.favoriteCount || 0;
    const shareCount = property.shareableLink ? viewCount * 0.15 : 0; // Estimate

    // Get referral traffic
    const referralViews = await this.viewTrackingService.getReferralViews(propertyId);

    return {
      propertyId,
      totalViews: viewCount,
      organicViews: Math.round(viewCount * 0.7),
      referralViews: Math.round(referralViews),
      directViews: Math.round(viewCount * 0.15),
      favoriteCount,
      shareCount: Math.round(shareCount),
      engagementRate: viewCount > 0 ? (favoriteCount / viewCount) * 100 : 0,
      viralityScore: this.calculateViralityScore(viewCount, shareCount, favoriteCount),
    };
  }

  /**
   * Get time on market analytics
   */
  async getTimeOnMarketAnalytics(
    propertyId: string,
    userId: string
  ): Promise<any> {
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ ownerId: userId }, { agentId: userId }],
      },
      include: {
        rentals: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!property) {
      throw new Error('Property not found or access denied');
    }

    const daysOnMarket = Math.floor(
      (Date.now() - property.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const firstRental = property.rentals[0];
    const daysToFirstRental = firstRental
      ? Math.floor(
          (firstRental.createdAt.getTime() - property.createdAt.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    // Get platform average
    const platformAverage = await this.getPlatformAverageDaysToRental();

    return {
      propertyId,
      daysOnMarket,
      daysToFirstRental,
      platformAverage,
      comparisonToAverage: daysToFirstRental && platformAverage
        ? daysToFirstRental - platformAverage
        : null,
      status: daysOnMarket > 90 ? 'long' : daysOnMarket > 30 ? 'medium' : 'short',
    };
  }

  // Helper methods

  private calculatePerformanceRating(
    conversionRate: number,
    avgViewsPerDay: number,
    daysOnMarket: number
  ): 'excellent' | 'good' | 'average' | 'poor' {
    const score =
      conversionRate * 0.5 +
      Math.min(avgViewsPerDay / 10, 10) * 0.3 +
      Math.max(0, 10 - daysOnMarket / 30) * 0.2;

    if (score >= 7) return 'excellent';
    if (score >= 5) return 'good';
    if (score >= 3) return 'average';
    return 'poor';
  }

  private getStartDateByPeriod(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.setDate(now.getDate() - 1));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setMonth(now.getMonth() - 1));
    }
  }

  private groupViewsByDate(events: any[], period: string): Array<{ date: string; views: number }> {
    const grouped = new Map<string, number>();

    events.forEach((event) => {
      const date = new Date(event.timestamp);
      let key: string;

      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0] + ' ' + date.getHours() + ':00';
          break;
        case 'week':
        case 'month':
          key = date.toISOString().split('T')[0];
          break;
        case 'year':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculatePeakViewingTime(events: any[]): string {
    const hourCounts = new Map<number, number>();

    events.forEach((event) => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    let peakHour = 0;
    let maxCount = 0;

    hourCounts.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    });

    return `${peakHour}:00 - ${peakHour + 1}:00`;
  }

  private async calculateConversionTrend(propertyId: string): Promise<'improving' | 'declining' | 'stable'> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get recent rentals
    const recentRentals = await prisma.rental.count({
      where: {
        propertyId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get older rentals
    const olderRentals = await prisma.rental.count({
      where: {
        propertyId,
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });

    if (recentRentals > olderRentals * 1.2) return 'improving';
    if (recentRentals < olderRentals * 0.8) return 'declining';
    return 'stable';
  }

  private async getPlatformAverageConversionRate(): Promise<number> {
    // Calculate platform-wide average conversion rate
    const properties = await prisma.property.findMany({
      where: {
        status: PropertyStatus.PUBLISHED,
      },
      include: {
        rentals: true,
      },
    });

    if (properties.length === 0) return 0;

    const totalViews = properties.reduce((sum, p) => sum + (p.viewCount || 0), 0);
    const totalRentals = properties.reduce((sum, p) => sum + p.rentals.length, 0);

    return totalViews > 0 ? (totalRentals / totalViews) * 100 : 0;
  }

  private async getPlatformAverageDaysToRental(): Promise<number> {
    // Get average days to first rental across platform
    const rentals = await prisma.rental.findMany({
      include: {
        property: true,
      },
      take: 100,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (rentals.length === 0) return 0;

    const totalDays = rentals.reduce((sum, rental) => {
      const days = Math.floor(
        (rental.createdAt.getTime() - rental.property.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);

    return Math.round(totalDays / rentals.length);
  }

  private calculateViralityScore(views: number, shares: number, favorites: number): number {
    // Simple virality score calculation
    const shareRate = views > 0 ? (shares / views) * 100 : 0;
    const favoriteRate = views > 0 ? (favorites / views) * 100 : 0;
    return Math.round((shareRate * 0.6 + favoriteRate * 0.4) * 10) / 10;
  }
}