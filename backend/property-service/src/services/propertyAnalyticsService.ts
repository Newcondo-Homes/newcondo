// backend/property-service/src/services/propertyAnalyticsService.ts

import { PrismaClient } from '@prisma/client';
import {
  PropertyPerformanceMetrics,
  PropertyComparisonMetrics,
  EarningsAnalytics,
  AgentReferralAnalytics,
  PropertyListingAnalytics,
  DashboardAnalytics,
  TimeSeriesData,
  MetricComparison
} from '../types/analytics';

const prisma = new PrismaClient();

export class PropertyAnalyticsService {
  /**
   * Get comprehensive property performance metrics
   */
  async getPropertyPerformance(propertyId: string, userId: string): Promise<PropertyPerformanceMetrics> {
    // Verify access
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: { select: { id: true, name: true } },
        agent: { select: { id: true, name: true } },
        rentals: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!property || (property.ownerId !== userId && property.agentId !== userId)) {
      throw new Error('Unauthorized access to property analytics');
    }

    // Get view metrics
    const viewEvents = await prisma.eventLog.findMany({
      where: {
        type: 'PROPERTY_VIEWED',
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
        },
      },
    });

    const uniqueViewers = new Set(viewEvents.map(e => e.userId).filter(Boolean)).size;
    const viewTrend = await this.calculateViewTrend(propertyId, 'daily');

    // Calculate engagement metrics
    const favoriteCount = property.favoriteCount || 0;
    const shareCount = await this.getShareCount(propertyId);
    const inquiryCount = await this.getInquiryCount(propertyId);

    // Calculate conversion metrics
    const totalApplications = property.rentals.length;
    const successfulRentals = property.rentals.filter(r => r.status === 'ACTIVE' || r.status === 'EXPIRED').length;
    const conversionRate = totalApplications > 0 ? (successfulRentals / totalApplications) * 100 : 0;

    // Calculate revenue metrics
    const totalRevenue = property.rentals.reduce((sum, rental) => {
      const rentalRevenue = rental.payments
        .filter(p => p.status === 'SUCCESS')
        .reduce((pSum, payment) => pSum + payment.amount.toNumber(), 0);
      return sum + rentalRevenue;
    }, 0);

    const averageRentalDuration = this.calculateAverageRentalDuration(property.rentals);
    const occupancyRate = await this.calculateOccupancyRate(propertyId);

    // Get top referral sources
    const topReferralSources = await this.getTopReferralSources(propertyId);

    return {
      propertyId,
      propertyTitle: property.title,
      totalViews: property.viewCount,
      uniqueViewers,
      viewTrend,
      averageTimeOnListing: 0, // Implement if you track session durations
      favoriteCount,
      shareCount,
      inquiryCount,
      conversionRate,
      totalApplications,
      successfulRentals,
      totalRevenue,
      averageRentalDuration,
      occupancyRate,
      topReferralSources,
      listingAgent: property.agent ? {
        id: property.agent.id,
        name: property.agent.name!,
        totalPromotions: 0, // Implement based on promotion tracking
        generatedViews: 0,
      } : undefined,
    };
  }

  /**
   * Get property comparison metrics vs market
   */
  async getPropertyComparison(propertyId: string): Promise<PropertyComparisonMetrics> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Get similar properties in the area
    const similarProperties = await prisma.property.findMany({
      where: {
        city: property.city,
        state: property.state,
        propertyType: property.propertyType,
        bedrooms: property.bedrooms,
        id: { not: propertyId },
        status: 'PUBLISHED',
      },
    });

    const averageViewsInArea = similarProperties.length > 0
      ? similarProperties.reduce((sum, p) => sum + p.viewCount, 0) / similarProperties.length
      : 0;

    const averageRentInArea = similarProperties.length > 0
      ? similarProperties.reduce((sum, p) => sum + (p.price?.toNumber() || 0), 0) / similarProperties.length
      : 0;

    const averageDaysToRent = await this.calculateAverageDaysToRent(similarProperties);

    // Determine price position
    const propertyPrice = property.price?.toNumber() || 0;
    let pricePosition: 'BELOW_MARKET' | 'AT_MARKET' | 'ABOVE_MARKET' = 'AT_MARKET';
    
    if (propertyPrice < averageRentInArea * 0.9) {
      pricePosition = 'BELOW_MARKET';
    } else if (propertyPrice > averageRentInArea * 1.1) {
      pricePosition = 'ABOVE_MARKET';
    }

    return {
      averageViewsInArea,
      averageRentInArea,
      averageDaysToRent,
      competitorCount: similarProperties.length,
      pricePosition,
      suggestedPrice: pricePosition !== 'AT_MARKET' ? averageRentInArea : undefined,
    };
  }

  /**
   * Get earnings analytics for owner or agent
   */
  async getEarningsAnalytics(userId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<EarningsAnalytics> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        virtualAccounts: true,
        properties: {
          include: {
            rentals: {
              include: {
                payments: {
                  where: {
                    status: 'SUCCESS',
                  },
                },
              },
            },
          },
        },
        agentListings: {
          include: {
            rentals: {
              include: {
                payments: {
                  where: {
                    status: 'SUCCESS',
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate total earnings
    const totalEarnings = user.virtualAccounts.reduce((sum, va) => sum + va.balance.toNumber(), 0);
    
    // Get payments
    const allPayments = await prisma.payment.findMany({
      where: {
        userId,
        status: 'SUCCESS',
      },
      orderBy: { paidAt: 'desc' },
    });

    const pendingEarnings = allPayments
      .filter(p => !p.isReleased)
      .reduce((sum, p) => sum + (p.ownerAmount?.toNumber() || p.agentCommission?.toNumber() || 0), 0);

    const availableForWithdrawal = totalEarnings - pendingEarnings;

    // Calculate earnings by period
    const earningsByPeriod = this.groupEarningsByPeriod(allPayments, period);

    // Calculate projections
    const projectedMonthlyIncome = this.calculateProjectedIncome(allPayments, 'month');
    const projectedYearlyIncome = this.calculateProjectedIncome(allPayments, 'year');

    return {
      userId,
      userRole: user.role === 'AGENT' ? 'AGENT' : 'OWNER',
      totalEarnings,
      pendingEarnings,
      availableForWithdrawal,
      earningsByPeriod,
      projectedMonthlyIncome,
      projectedYearlyIncome,
    };
  }

  /**
   * Get agent referral analytics
   */
  async getAgentReferralAnalytics(agentId: string): Promise<AgentReferralAnalytics> {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      include: {
        agentListings: true,
      },
    });

    if (!agent || agent.role !== 'AGENT') {
      throw new Error('User is not an agent');
    }

    // Implement referral tracking logic here
    // This is a placeholder implementation
    return {
      agentId,
      agentName: agent.name || 'Agent',
      totalPropertiesPromoted: agent.agentListings.length,
      activePromotions: agent.agentListings.filter(p => p.isAvailable).length,
      totalReferralLinks: 0,
      totalViewsGenerated: 0,
      totalConversions: 0,
      conversionRate: 0,
      totalCommissionEarned: 0,
      pendingCommission: 0,
      averageCommissionPerConversion: 0,
      topProperties: [],
      referralSourceBreakdown: [],
    };
  }

  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(userId: string, period: 'week' | 'month' | 'quarter' | 'year'): Promise<DashboardAnalytics> {
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { agentId: userId },
        ],
      },
      include: {
        rentals: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            payments: {
              where: {
                status: 'SUCCESS',
              },
            },
          },
        },
      },
    });

    const totalProperties = properties.length;
    const activeListings = properties.filter(p => p.isAvailable).length;
    const totalViews = properties.reduce((sum, p) => sum + p.viewCount, 0);
    const totalRevenue = properties.reduce((sum, p) => {
      return sum + p.rentals.reduce((rSum: number, rental: any) => {
        return rSum + rental.payments.reduce((pSum: number, payment: any) => {
          return pSum + payment.amount.toNumber();
        }, 0);
      }, 0);
    }, 0);

    // Calculate trends
    const viewsTrend = await this.calculateAggregateTrend(properties, 'views', period);
    const revenueTrend = await this.calculateAggregateTrend(properties, 'revenue', period);
    const occupancyTrend = await this.calculateAggregateTrend(properties, 'occupancy', period);

    // Get top performing properties
    const topPerformingProperties = properties
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)
      .map(p => ({
        propertyId: p.id,
        title: p.title,
        views: p.viewCount,
        revenue: p.rentals.reduce((sum: number, r: any) => {
          return sum + r.payments.reduce((pSum: number, p: any) => pSum + p.amount.toNumber(), 0);
        }, 0),
      }));

    // Generate alerts
    const alerts = this.generateAlerts(properties);

    return {
      userId,
      period,
      totalProperties,
      activeListings,
      totalViews,
      totalRevenue,
      viewsTrend,
      revenueTrend,
      occupancyTrend,
      topPerformingProperties,
      alerts,
    };
  }

  // Helper methods

  private async calculateViewTrend(propertyId: string, period: 'daily' | 'weekly' | 'monthly') {
    const events = await prisma.eventLog.findMany({
      where: {
        type: 'PROPERTY_VIEWED',
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    const grouped = this.groupByPeriod(events, period);
    
    return {
      period,
      data: grouped,
    };
  }

  private groupByPeriod(events: any[], period: string): TimeSeriesData[] {
    const groups: { [key: string]: number } = {};
    
    events.forEach(event => {
      const date = new Date(event.timestamp);
      let key: string;
      
      if (period === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      groups[key] = (groups[key] || 0) + 1;
    });

    return Object.entries(groups).map(([date, views]) => ({
      date,
      value: views,
    }));
  }

  private calculateAverageRentalDuration(rentals: any[]): number {
    if (rentals.length === 0) return 0;
    
    const durations = rentals
      .filter(r => r.endDate)
      .map(r => {
        const start = new Date(r.startDate).getTime();
        const end = new Date(r.endDate).getTime();
        return (end - start) / (1000 * 60 * 60 * 24); // days
      });

    return durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;
  }

  private async calculateOccupancyRate(propertyId: string): Promise<number> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        createdAt: true,
        rentals: {
          select: {
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!property) return 0;

    const totalDays = Math.floor(
      (Date.now() - property.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    let occupiedDays = 0;
    property.rentals.forEach(rental => {
      const start = rental.startDate.getTime();
      const end = rental.endDate ? rental.endDate.getTime() : Date.now();
      occupiedDays += Math.floor((end - start) / (1000 * 60 * 60 * 24));
    });

    return totalDays > 0 ? (occupiedDays / totalDays) * 100 : 0;
  }

  private async getShareCount(propertyId: string): Promise<number> {
    return await prisma.eventLog.count({
      where: {
        type: 'PROPERTY_SHARED',
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
        },
      },
    });
  }

  private async getInquiryCount(propertyId: string): Promise<number> {
    return await prisma.eventLog.count({
      where: {
        type: 'PROPERTY_INQUIRY',
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
        },
      },
    });
  }

  private async getTopReferralSources(propertyId: string) {
    const events = await prisma.eventLog.findMany({
      where: {
        type: 'PROPERTY_VIEWED',
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
        },
      },
    });

    const sources: { [key: string]: { views: number; conversions: number } } = {};
    
    events.forEach(event => {
      const metadata = event.metadata as any;
      const source = metadata?.referralSource || 'Direct';
      
      if (!sources[source]) {
        sources[source] = { views: 0, conversions: 0 };
      }
      sources[source].views++;
    });

    return Object.entries(sources)
      .map(([source, data]) => ({ source, ...data }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }

  private async calculateAverageDaysToRent(properties: any[]): Promise<number> {
    const daysToRent = await Promise.all(
      properties.map(async (p) => {
        const firstRental = await prisma.rental.findFirst({
          where: { propertyId: p.id },
          orderBy: { createdAt: 'asc' },
        });

        if (!firstRental) return null;

        const created = new Date(p.createdAt).getTime();
        const rented = new Date(firstRental.createdAt).getTime();
        return (rented - created) / (1000 * 60 * 60 * 24);
      })
    );

    const validDays = daysToRent.filter(d => d !== null) as number[];
    return validDays.length > 0
      ? validDays.reduce((sum, d) => sum + d, 0) / validDays.length
      : 0;
  }

  private groupEarningsByPeriod(payments: any[], period: string) {
    return {
      period,
      data: [], // Implement grouping logic
    };
  }

  private calculateProjectedIncome(payments: any[], period: 'month' | 'year'): number {
    // Simple projection based on recent payments
    const recentPayments = payments.slice(0, 30); // Last 30 payments
    const avgPayment = recentPayments.reduce((sum, p) => sum + p.amount.toNumber(), 0) / recentPayments.length;
    
    return period === 'month' ? avgPayment * 4 : avgPayment * 52;
  }

  private async calculateAggregateTrend(properties: any[], metric: string, period: string): Promise<TimeSeriesData[]> {
    // Implement aggregate trend calculation
    return [];
  }

  private generateAlerts(properties: any[]) {
    const alerts: any[] = [];

    properties.forEach(property => {
      // Low views alert
      if (property.viewCount < 10 && property.status === 'PUBLISHED') {
        alerts.push({
          type: 'LOW_VIEWS',
          severity: 'WARNING',
          message: `Property "${property.title}" has low views. Consider updating images or description.`,
          propertyId: property.id,
        });
      }

      // Vacancy alert
      if (!property.isAvailable && property.status === 'PUBLISHED') {
        alerts.push({
          type: 'VACANCY',
          severity: 'INFO',
          message: `Property "${property.title}" is marked as unavailable but published.`,
          propertyId: property.id,
        });
      }
    });

    return alerts;
  }
}

export default new PropertyAnalyticsService();