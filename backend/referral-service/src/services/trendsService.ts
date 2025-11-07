import { PrismaClient } from '@prisma/client';
import { CacheService } from './cacheService';
import { AggregationService } from './aggregationService';
import { getDateRange } from '../../../shared/src/utils/dateRangeHelper';

const prisma = new PrismaClient();

type IntervalType = 'day' | 'week' | 'month';

export class TrendsService {
  private cacheService: CacheService;
  private aggregationService: AggregationService;

  constructor() {
    this.cacheService = new CacheService();
    this.aggregationService = new AggregationService();
  }

  /**
   * Get user growth trends
   */
  async getUserGrowthTrends(dateRange: string, interval: IntervalType = 'day') {
    const cacheKey = `trends:user-growth:${dateRange}:${interval}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = getDateRange(dateRange);

    const data = await this.aggregationService.aggregateByInterval(
      'user',
      startDate,
      endDate,
      'createdAt',
      interval
    );

    const trends = {
      period: { startDate, endDate },
      interval,
      data: data.map(d => ({
        date: d.date,
        newUsers: d.count,
        cumulative: d.cumulative
      })),
      totalGrowth: data.length > 0 ? data[data.length - 1].cumulative : 0,
      averageDaily: this.calculateAverage(data.map(d => d.count))
    };

    await this.cacheService.set(cacheKey, trends, 600);
    return trends;
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(
    dateRange: string,
    interval: IntervalType = 'day',
    breakdown?: string
  ) {
    const cacheKey = `trends:revenue:${dateRange}:${interval}:${breakdown || 'none'}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = getDateRange(dateRange);

    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startDate, lte: endDate }
      },
      select: {
        amount: true,
        platformFee: true,
        paymentType: true,
        paidAt: true
      },
      orderBy: { paidAt: 'asc' }
    });

    const aggregated = this.aggregateRevenue(payments, interval);

    let breakdownData;
    if (breakdown === 'type') {
      breakdownData = this.aggregateRevenueByType(payments, interval);
    }

    const trends = {
      period: { startDate, endDate },
      interval,
      data: aggregated,
      breakdown: breakdownData,
      totalRevenue: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      totalPlatformFees: payments.reduce((sum, p) => sum + Number(p.platformFee || 0), 0),
      transactionCount: payments.length
    };

    await this.cacheService.set(cacheKey, trends, 600);
    return trends;
  }

  /**
   * Get property listing trends
   */
  async getPropertyTrends(dateRange: string, interval: IntervalType = 'day') {
    const cacheKey = `trends:property:${dateRange}:${interval}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = getDateRange(dateRange);

    const [created, published, rented] = await Promise.all([
      this.aggregationService.aggregateByInterval(
        'property',
        startDate,
        endDate,
        'createdAt',
        interval
      ),
      this.aggregatePropertyByStatus('PUBLISHED', startDate, endDate, interval),
      this.aggregatePropertyByStatus('RENTED', startDate, endDate, interval)
    ]);

    const trends = {
      period: { startDate, endDate },
      interval,
      created,
      published,
      rented,
      summary: {
        totalCreated: created.reduce((sum, d) => sum + d.count, 0),totalPublished: published.reduce((sum, d) => sum + d.count, 0),
        totalRented: rented.reduce((sum, d) => sum + d.count, 0)
      }
    };

    await this.cacheService.set(cacheKey, trends, 600);
    return trends;
  }

  /**
   * Get engagement trends
   */
  async getEngagementTrends(dateRange: string, interval: IntervalType = 'day') {
    const cacheKey = `trends:engagement:${dateRange}:${interval}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = getDateRange(dateRange);

    const [views, searches, favorites] = await Promise.all([
      this.aggregateEventsByType('PROPERTY_VIEWED', startDate, endDate, interval),
      this.aggregateEventsByType('PROPERTY_SEARCHED', startDate, endDate, interval),
      this.aggregateEventsByType('PROPERTY_FAVORITED', startDate, endDate, interval)
    ]);

    const trends = {
      period: { startDate, endDate },
      interval,
      views,
      searches,
      favorites,
      summary: {
        totalViews: views.reduce((sum, d) => sum + d.count, 0),
        totalSearches: searches.reduce((sum, d) => sum + d.count, 0),
        totalFavorites: favorites.reduce((sum, d) => sum + d.count, 0)
      }
    };

    await this.cacheService.set(cacheKey, trends, 600);
    return trends;
  }

  /**
   * Get geographic trends
   */
  async getGeographicTrends(dateRange: string, groupBy: 'state' | 'city' = 'state') {
    const cacheKey = `trends:geographic:${dateRange}:${groupBy}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = getDateRange(dateRange);

    const properties = await prisma.property.groupBy({
      by: [groupBy],
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: true
    });

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

    const rentalsByLocation = this.groupRentalsByLocation(rentals, groupBy);

    const trends = properties.map(p => ({
      location: p[groupBy],
      propertyCount: p._count,
      rentalCount: rentalsByLocation[p[groupBy] as string] || 0
    }))
    .sort((a, b) => b.propertyCount - a.propertyCount);

    const result = {
      period: { startDate, endDate },
      groupBy,
      data: trends,
      topLocations: trends.slice(0, 10)
    };

    await this.cacheService.set(cacheKey, result, 600);
    return result;
  }

  /**
   * Get property type trends
   */
  async getPropertyTypeTrends(dateRange: string) {
    const cacheKey = `trends:property-types:${dateRange}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = getDateRange(dateRange);

    const properties = await prisma.property.groupBy({
      by: ['propertyType'],
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: true,
      _avg: { price: true }
    });

    const rentals = await prisma.rental.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      include: {
        property: {
          select: { propertyType: true }
        }
      }
    });

    const rentalsByType = rentals.reduce((acc, rental) => {
      const type = rental.property.propertyType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const trends = properties.map(p => ({
      type: p.propertyType,
      listingCount: p._count,
      averagePrice: Number(p._avg.price || 0),
      rentalCount: rentalsByType[p.propertyType] || 0,
      conversionRate: p._count > 0 
        ? ((rentalsByType[p.propertyType] || 0) / p._count) * 100 
        : 0
    }))
    .sort((a, b) => b.listingCount - a.listingCount);

    const result = {
      period: { startDate, endDate },
      data: trends
    };

    await this.cacheService.set(cacheKey, result, 600);
    return result;
  }

  /**
   * Get payment method trends
   */
  async getPaymentMethodTrends(dateRange: string) {
    const cacheKey = `trends:payment-methods:${dateRange}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = getDateRange(dateRange);

    const payments = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startDate, lte: endDate }
      },
      _count: true,
      _sum: { amount: true }
    });

    const trends = payments
      .filter(p => p.paymentMethod) // Filter out null payment methods
      .map(p => ({
        method: p.paymentMethod!,
        transactionCount: p._count,
        totalAmount: Number(p._sum.amount || 0),
        averageAmount: p._count > 0 ? Number(p._sum.amount || 0) / p._count : 0
      }))
      .sort((a, b) => b.transactionCount - a.transactionCount);

    const result = {
      period: { startDate, endDate },
      data: trends,
      totalTransactions: trends.reduce((sum, t) => sum + t.transactionCount, 0),
      totalAmount: trends.reduce((sum, t) => sum + t.totalAmount, 0)
    };

    await this.cacheService.set(cacheKey, result, 600);
    return result;
  }

  /**
   * Get seasonal trends
   */
  async getSeasonalTrends(metric: string, years: number = 2) {
    const cacheKey = `trends:seasonal:${metric}:${years}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - years);

    let data;
    switch (metric) {
      case 'rentals':
        data = await this.getSeasonalRentalData(startDate, endDate);
        break;
      case 'listings':
        data = await this.getSeasonalListingData(startDate, endDate);
        break;
      case 'revenue':
        data = await this.getSeasonalRevenueData(startDate, endDate);
        break;
      default:
        throw new Error(`Unsupported metric: ${metric}`);
    }

    const result = {
      metric,
      period: { startDate, endDate, years },
      data,
      insights: this.generateSeasonalInsights(data)
    };

    await this.cacheService.set(cacheKey, result, 3600); // Cache for 1 hour
    return result;
  }

  /**
   * Detect anomalies in metrics
   */
  async detectAnomalies(
    metric: string,
    dateRange: string,
    sensitivity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    const { startDate, endDate } = getDateRange(dateRange);

    let data;
    switch (metric) {
      case 'revenue':
        data = await this.getRevenueTimeSeries(startDate, endDate);
        break;
      case 'signups':
        data = await this.getSignupTimeSeries(startDate, endDate);
        break;
      case 'payments':
        data = await this.getPaymentTimeSeries(startDate, endDate);
        break;
      default:
        throw new Error(`Unsupported metric: ${metric}`);
    }

    const anomalies = this.detectAnomaliesInData(data, sensitivity);

    return {
      metric,
      period: { startDate, endDate },
      sensitivity,
      anomaliesDetected: anomalies.length,
      anomalies,
      data
    };
  }

  // Private helper methods

  private aggregateRevenue(payments: any[], interval: IntervalType) {
    const grouped = new Map<string, { revenue: number; platformFee: number; count: number }>();

    payments.forEach(payment => {
      const key = this.getIntervalKey(payment.paidAt, interval);
      const existing = grouped.get(key) || { revenue: 0, platformFee: 0, count: 0 };
      
      grouped.set(key, {
        revenue: existing.revenue + Number(payment.amount),
        platformFee: existing.platformFee + Number(payment.platformFee || 0),
        count: existing.count + 1
      });
    });

    return Array.from(grouped.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        platformFee: data.platformFee,
        transactionCount: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private aggregateRevenueByType(payments: any[], interval: IntervalType) {
    const grouped = new Map<string, Map<string, number>>();

    payments.forEach(payment => {
      const key = this.getIntervalKey(payment.paidAt, interval);
      if (!grouped.has(key)) {
        grouped.set(key, new Map());
      }
      
      const typeMap = grouped.get(key)!;
      const currentAmount = typeMap.get(payment.paymentType) || 0;
      typeMap.set(payment.paymentType, currentAmount + Number(payment.amount));
    });

    return Array.from(grouped.entries())
      .map(([date, typeMap]) => ({
        date,
        byType: Object.fromEntries(typeMap)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async aggregatePropertyByStatus(
    status: string,
    startDate: Date,
    endDate: Date,
    interval: IntervalType
  ) {
    const properties = await prisma.property.findMany({
      where: {
        status: status as any,
        updatedAt: { gte: startDate, lte: endDate }
      },
      select: { updatedAt: true }
    });

    const grouped = new Map<string, number>();

    properties.forEach(property => {
      const key = this.getIntervalKey(property.updatedAt, interval);
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async aggregateEventsByType(
    eventType: string,
    startDate: Date,
    endDate: Date,
    interval: IntervalType
  ) {
    const events = await prisma.eventLog.findMany({
      where: {
        type: eventType,
        timestamp: { gte: startDate, lte: endDate }
      },
      select: { timestamp: true }
    });

    const grouped = new Map<string, number>();

    events.forEach(event => {
      const key = this.getIntervalKey(event.timestamp, interval);
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private groupRentalsByLocation(rentals: any[], groupBy: 'state' | 'city') {
    return rentals.reduce((acc, rental) => {
      const location = rental.property[groupBy];
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getIntervalKey(date: Date, interval: IntervalType): string {
    const d = new Date(date);
    
    switch (interval) {
      case 'day':
        return d.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      default:
        return d.toISOString().split('T')[0];
    }
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private async getSeasonalRentalData(startDate: Date, endDate: Date) {
    const rentals = await prisma.rental.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      select: { createdAt: true }
    });

    return this.groupByMonth(rentals, 'createdAt');
  }

  private async getSeasonalListingData(startDate: Date, endDate: Date) {
    const properties = await prisma.property.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      select: { createdAt: true }
    });

    return this.groupByMonth(properties, 'createdAt');
  }

  private async getSeasonalRevenueData(startDate: Date, endDate: Date) {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startDate, lte: endDate }
      },
      select: { paidAt: true, amount: true }
    });

    const grouped = new Map<string, number>();

    payments.forEach(payment => {
      const month = payment.paidAt.toLocaleString('default', { month: 'long' });
      grouped.set(month, (grouped.get(month) || 0) + Number(payment.amount));
    });

    return Array.from(grouped.entries()).map(([month, total]) => ({
      month,
      value: total
    }));
  }

  private groupByMonth(items: any[], dateField: string) {
    const grouped = new Map<string, number>();

    items.forEach(item => {
      const month = item[dateField].toLocaleString('default', { month: 'long' });
      grouped.set(month, (grouped.get(month) || 0) + 1);
    });

    const monthOrder = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return monthOrder.map(month => ({
      month,
      value: grouped.get(month) || 0
    }));
  }

  private generateSeasonalInsights(data: any[]) {
    const values = data.map(d => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxMonth = data.find(d => d.value === max)?.month;
    const minMonth = data.find(d => d.value === min)?.month;

    return {
      peakMonth: maxMonth,
      peakValue: max,
      lowMonth: minMonth,
      lowValue: min,
      variation: max > 0 ? ((max - min) / max) * 100 : 0
    };
  }

  private async getRevenueTimeSeries(startDate: Date, endDate: Date) {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startDate, lte: endDate }
      },
      select: { paidAt: true, amount: true },
      orderBy: { paidAt: 'asc' }
    });

    const grouped = new Map<string, number>();

    payments.forEach(payment => {
      const date = payment.paidAt.toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) || 0) + Number(payment.amount));
    });

    return Array.from(grouped.entries()).map(([date, value]) => ({ date, value }));
  }

  private async getSignupTimeSeries(startDate: Date, endDate: Date) {
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    const grouped = new Map<string, number>();

    users.forEach(user => {
      const date = user.createdAt.toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) || 0) + 1);
    });

    return Array.from(grouped.entries()).map(([date, value]) => ({ date, value }));
  }

  private async getPaymentTimeSeries(startDate: Date, endDate: Date) {
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    const grouped = new Map<string, number>();

    payments.forEach(payment => {
      const date = payment.createdAt.toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) || 0) + 1);
    });

    return Array.from(grouped.entries()).map(([date, value]) => ({ date, value }));
  }

  private detectAnomaliesInData(
    data: Array<{ date: string; value: number }>,
    sensitivity: 'low' | 'medium' | 'high'
  ) {
    if (data.length < 7) return []; // Need at least a week of data

    const values = data.map(d => d.value);
    const mean = this.calculateAverage(values);
    const stdDev = this.calculateStdDev(values, mean);

    // Set threshold based on sensitivity
    const thresholds = {
      low: 3,
      medium: 2,
      high: 1.5
    };
    const threshold = thresholds[sensitivity];

    return data
      .map((d, index) => {
        const zScore = stdDev > 0 ? Math.abs((d.value - mean) / stdDev) : 0;
        if (zScore > threshold) {
          return {
            date: d.date,
            value: d.value,
            expected: mean,
            deviation: d.value - mean,
            zScore,
            severity: zScore > 3 ? 'high' : zScore > 2 ? 'medium' : 'low'
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  private calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = this.calculateAverage(squaredDiffs);
    return Math.sqrt(avgSquaredDiff);
  }
}