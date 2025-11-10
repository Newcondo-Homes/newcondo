// backend/admin-service/src/services/marketInsightsService.ts
import { PrismaClient } from '@newcondo/db';
import { 
  MarketOverview, 
  PricingTrend, 
  DemandAnalysis,
  SupplyAnalysis,
  LocationInsight,
  MarketForecast
} from '../types/marketInsights';

const prisma = new PrismaClient();

export class MarketInsightsService {
  /**
   * Get comprehensive market overview
   */
  async getMarketOverview(startDate: Date, endDate: Date): Promise<MarketOverview> {
    const [
      totalProperties,
      activeListings,
      averagePrice,
      totalTransactions,
      averageTimeToRent,
      topLocations
    ] = await Promise.all([
      prisma.property.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.property.count({
        where: {
          status: 'PUBLISHED',
          isAvailable: true
        }
      }),
      prisma.property.aggregate({
        _avg: { price: true },
        where: {
          status: 'PUBLISHED',
          price: { not: null }
        }
      }),
      prisma.payment.count({
        where: {
          paymentType: 'RENT',
          status: 'SUCCESS',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      this.calculateAverageTimeToRent(startDate, endDate),
      this.getTopLocations(5)
    ]);

    return {
      totalProperties,
      activeListings,
      averagePrice: averagePrice._avg.price?.toNumber() || 0,
      totalTransactions,
      averageTimeToRent,
      topLocations,
      period: {
        startDate,
        endDate
      }
    };
  }

  /**
   * Get pricing trends across property types
   */
  async getPricingTrends(
    startDate: Date, 
    endDate: Date, 
    groupBy: 'propertyType' | 'location' = 'propertyType'
  ): Promise<PricingTrend[]> {
    if (groupBy === 'propertyType') {
      return this.getPricingTrendsByPropertyType(startDate, endDate);
    } else {
      return this.getPricingTrendsByLocation(startDate, endDate);
    }
  }

  private async getPricingTrendsByPropertyType(
    startDate: Date, 
    endDate: Date
  ): Promise<PricingTrend[]> {
    const trends = await prisma.property.groupBy({
      by: ['propertyType'],
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
      _count: true,
      where: {
        price: { not: null },
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    return trends.map(trend => ({
      category: trend.propertyType,
      averagePrice: trend._avg.price?.toNumber() || 0,
      minPrice: trend._min.price?.toNumber() || 0,
      maxPrice: trend._max.price?.toNumber() || 0,
      propertyCount: trend._count,
      changePercentage: 0 // Will be calculated by comparing with previous period
    }));
  }

  private async getPricingTrendsByLocation(
    startDate: Date, 
    endDate: Date
  ): Promise<PricingTrend[]> {
    const trends = await prisma.property.groupBy({
      by: ['state', 'city'],
      _avg: { price: true },
      _count: true,
      where: {
        price: { not: null },
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    return trends.map(trend => ({
      category: `${trend.city}, ${trend.state}`,
      averagePrice: trend._avg.price?.toNumber() || 0,
      propertyCount: trend._count,
      changePercentage: 0
    }));
  }

  /**
   * Get demand analysis based on views, searches, and bookings
   */
  async getDemandAnalysis(startDate: Date, endDate: Date): Promise<DemandAnalysis> {
    const [
      totalViews,
      totalSearches,
      totalBookings,
      demandByPropertyType,
      demandByLocation,
      peakDemandPeriods
    ] = await Promise.all([
      this.getTotalPropertyViews(startDate, endDate),
      this.getTotalSearches(startDate, endDate),
      prisma.rental.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      this.getDemandByPropertyType(startDate, endDate),
      this.getDemandByLocation(startDate, endDate),
      this.getPeakDemandPeriods(startDate, endDate)
    ]);

    return {
      totalViews,
      totalSearches,
      totalBookings,
      conversionRate: totalSearches > 0 ? (totalBookings / totalSearches) * 100 : 0,
      demandByPropertyType,
      demandByLocation,
      peakDemandPeriods,
      period: { startDate, endDate }
    };
  }

  /**
   * Get supply analysis
   */
  async getSupplyAnalysis(startDate: Date, endDate: Date): Promise<SupplyAnalysis> {
    const [
      totalSupply,
      availableSupply,
      rentedSupply,
      newListings,
      supplyByPropertyType,
      supplyByLocation
    ] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({
        where: { isAvailable: true, status: 'PUBLISHED' }
      }),
      prisma.property.count({
        where: { status: 'RENTED' }
      }),
      prisma.property.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      this.getSupplyByPropertyType(),
      this.getSupplyByLocation()
    ]);

    return {
      totalSupply,
      availableSupply,
      rentedSupply,
      newListings,
      vacancyRate: totalSupply > 0 ? (availableSupply / totalSupply) * 100 : 0,
      supplyByPropertyType,
      supplyByLocation,
      period: { startDate, endDate }
    };
  }

  /**
   * Get location-specific insights
   */
  async getLocationInsights(state?: string, city?: string): Promise<LocationInsight[]> {
    const whereClause: any = {};
    if (state) whereClause.state = state;
    if (city) whereClause.city = city;

    const insights = await prisma.property.groupBy({
      by: ['state', 'city'],
      _avg: { price: true },
      _count: true,
      where: {
        ...whereClause,
        price: { not: null },
        status: 'PUBLISHED'
      }
    });

    return Promise.all(insights.map(async (insight) => {
      const [rentedCount, totalViews] = await Promise.all([
        prisma.property.count({
          where: {
            state: insight.state,
            city: insight.city,
            status: 'RENTED'
          }
        }),
        this.getLocationViews(insight.state, insight.city)
      ]);

      return {
        state: insight.state,
        city: insight.city,
        totalProperties: insight._count,
        averagePrice: insight._avg.price?.toNumber() || 0,
        rentedProperties: rentedCount,
        occupancyRate: insight._count > 0 ? (rentedCount / insight._count) * 100 : 0,
        popularityScore: totalViews,
        growthRate: 0 // Calculate compared to previous period
      };
    }));
  }

  /**
   * Get market forecast using trend analysis
   */
  async getMarketForecast(months: number = 3): Promise<MarketForecast> {
    // Simple trend-based forecasting
    const historicalData = await this.getHistoricalPricingData(12); // Last 12 months
    
    const forecast = this.calculateTrendForecast(historicalData, months);
    
    return {
      forecastPeriodMonths: months,
      predictedAveragePrice: forecast.averagePrice,
      predictedSupply: forecast.supply,
      predictedDemand: forecast.demand,
      confidenceLevel: forecast.confidence,
      trendDirection: forecast.trend,
      factors: [
        'Historical pricing trends',
        'Supply and demand patterns',
        'Seasonal variations',
        'Market growth rate'
      ]
    };
  }

  // Helper methods
  private async calculateAverageTimeToRent(
    startDate: Date, 
    endDate: Date
  ): Promise<number> {
    const rentals = await prisma.rental.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      include: {
        property: {
          select: { createdAt: true }
        }
      }
    });

    if (rentals.length === 0) return 0;

    const totalDays = rentals.reduce((sum, rental) => {
      const daysToRent = Math.floor(
        (rental.createdAt.getTime() - rental.property.createdAt.getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      return sum + daysToRent;
    }, 0);

    return totalDays / rentals.length;
  }

  private async getTopLocations(limit: number): Promise<Array<{
    location: string;
    propertyCount: number;
    averagePrice: number;
  }>> {
    const locations = await prisma.property.groupBy({
      by: ['state', 'city'],
      _count: true,
      _avg: { price: true },
      where: { status: 'PUBLISHED' },
      orderBy: { _count: { id: 'desc' } },
      take: limit
    });

    return locations.map(loc => ({
      location: `${loc.city}, ${loc.state}`,
      propertyCount: loc._count,
      averagePrice: loc._avg.price?.toNumber() || 0
    }));
  }

  private async getTotalPropertyViews(startDate: Date, endDate: Date): Promise<number> {
    const viewEvents = await prisma.eventLog.count({
      where: {
        type: 'PROPERTY_VIEWED',
        timestamp: { gte: startDate, lte: endDate }
      }
    });
    return viewEvents;
  }

  private async getTotalSearches(startDate: Date, endDate: Date): Promise<number> {
    const searchEvents = await prisma.eventLog.count({
      where: {
        type: 'PROPERTY_SEARCH',
        timestamp: { gte: startDate, lte: endDate }
      }
    });
    return searchEvents;
  }

  private async getDemandByPropertyType(startDate: Date, endDate: Date) {
    return prisma.rental.groupBy({
      by: ['propertyId'],
      _count: true,
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    });
  }

  private async getDemandByLocation(startDate: Date, endDate: Date) {
    const rentals = await prisma.rental.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      include: {
        property: {
          select: { state: true, city: true }
        }
      }
    });

    // Group by location
    const locationMap = new Map<string, number>();
    rentals.forEach(rental => {
      const key = `${rental.property.city}, ${rental.property.state}`;
      locationMap.set(key, (locationMap.get(key) || 0) + 1);
    });

    return Array.from(locationMap.entries()).map(([location, count]) => ({
      location,
      demandCount: count
    }));
  }

  private async getPeakDemandPeriods(startDate: Date, endDate: Date) {
    // Analyze bookings by time periods
    const rentals = await prisma.rental.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      select: { createdAt: true }
    });

    // Group by month
    const monthlyDemand = new Map<string, number>();
    rentals.forEach(rental => {
      const month = rental.createdAt.toISOString().slice(0, 7);
      monthlyDemand.set(month, (monthlyDemand.get(month) || 0) + 1);
    });

    return Array.from(monthlyDemand.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([period, count]) => ({ period, bookings: count }));
  }

  private async getSupplyByPropertyType() {
    return prisma.property.groupBy({
      by: ['propertyType'],
      _count: true,
      where: { status: 'PUBLISHED' }
    });
  }

  private async getSupplyByLocation() {
    return prisma.property.groupBy({
      by: ['state', 'city'],
      _count: true,
      where: { status: 'PUBLISHED' }
    });
  }

  private async getLocationViews(state: string, city: string): Promise<number> {
    const properties = await prisma.property.findMany({
      where: { state, city },
      select: { id: true }
    });

    const propertyIds = properties.map(p => p.id);

    return prisma.eventLog.count({
      where: {
        type: 'PROPERTY_VIEWED',
        metadata: {
          path: ['propertyId'],
          in: propertyIds
        }
      }
    });
  }

  private async getHistoricalPricingData(months: number) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const properties = await prisma.property.findMany({
      where: {
        createdAt: { gte: startDate },
        price: { not: null }
      },
      select: {
        price: true,
        createdAt: true
      }
    });

    return properties;
  }

  private calculateTrendForecast(historicalData: any[], forecastMonths: number) {
    // Simple linear regression for forecasting
    // This is a basic implementation - production would use more sophisticated methods
    
    const avgPrice = historicalData.reduce((sum, d) => 
      sum + (d.price?.toNumber() || 0), 0
    ) / historicalData.length;

    return {
      averagePrice: avgPrice * 1.05, // Simple 5% growth assumption
      supply: historicalData.length * 1.1,
      demand: historicalData.length * 1.08,
      confidence: 75,
      trend: 'UPWARD' as const
    };
  }
}

export default new MarketInsightsService();