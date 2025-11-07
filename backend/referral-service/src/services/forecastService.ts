import { PrismaClient } from '@prisma/client';
import { CacheService } from './cacheService';
import { getDateRange } from '../../../shared/src/utils/dateRangeHelper';

const prisma = new PrismaClient();

export class ForecastService {
  private cacheService: CacheService;

  constructor() {
    this.cacheService = new CacheService();
  }

  /**
   * Get revenue forecast using simple linear regression
   */
  async getRevenueForecast(horizon: string, confidenceLevel: number = 0.95) {
    const cacheKey = `forecast:revenue:${horizon}:${confidenceLevel}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    // Get historical data (last 90 days)
    const historicalPeriod = getDateRange('90d');
    const forecastPeriod = getDateRange(horizon);

    const historicalRevenue = await this.getHistoricalRevenue(
      historicalPeriod.startDate,
      historicalPeriod.endDate
    );

    const forecast = this.generateForecast(
      historicalRevenue,
      forecastPeriod.endDate,
      confidenceLevel
    );

    const result = {
      metric: 'revenue',
      historicalPeriod,
      forecastPeriod,
      confidenceLevel,
      historical: historicalRevenue,
      forecast,
      summary: {
        expectedRevenue: forecast.reduce((sum, f) => sum + f.predicted, 0),
        lowerBound: forecast.reduce((sum, f) => sum + f.lowerBound, 0),
        upperBound: forecast.reduce((sum, f) => sum + f.upperBound, 0),
        trend: this.calculateTrend(historicalRevenue)
      },
      generatedAt: new Date()
    };

    await this.cacheService.set(cacheKey, result, 1800); // Cache for 30 minutes
    return result;
  }

  /**
   * Get user growth forecast
   */
  async getUserGrowthForecast(horizon: string, confidenceLevel: number = 0.95) {
    const cacheKey = `forecast:user-growth:${horizon}:${confidenceLevel}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const historicalPeriod = getDateRange('90d');
    const forecastPeriod = getDateRange(horizon);

    const historicalGrowth = await this.getHistoricalUserGrowth(
      historicalPeriod.startDate,
      historicalPeriod.endDate
    );

    const forecast = this.generateForecast(
      historicalGrowth,
      forecastPeriod.endDate,
      confidenceLevel
    );

    const result = {
      metric: 'userGrowth',
      historicalPeriod,
      forecastPeriod,
      confidenceLevel,
      historical: historicalGrowth,
      forecast,
      summary: {
        expectedNewUsers: Math.round(forecast.reduce((sum, f) => sum + f.predicted, 0)),
        lowerBound: Math.round(forecast.reduce((sum, f) => sum + f.lowerBound, 0)),
        upperBound: Math.round(forecast.reduce((sum, f) => sum + f.upperBound, 0)),
        growthRate: this.calculateGrowthRate(historicalGrowth)
      },
      generatedAt: new Date()
    };

    await this.cacheService.set(cacheKey, result, 1800);
    return result;
  }

  /**
   * Get property listing forecast
   */
  async getPropertyForecast(horizon: string, confidenceLevel: number = 0.95) {
    const cacheKey = `forecast:property:${horizon}:${confidenceLevel}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const historicalPeriod = getDateRange('90d');
    const forecastPeriod = getDateRange(horizon);

    const historicalListings = await this.getHistoricalListings(
      historicalPeriod.startDate,
      historicalPeriod.endDate
    );

    const forecast = this.generateForecast(
      historicalListings,
      forecastPeriod.endDate,
      confidenceLevel
    );

    const result = {
      metric: 'propertyListings',
      historicalPeriod,
      forecastPeriod,
      confidenceLevel,
      historical: historicalListings,
      forecast,
      summary: {
        expectedListings: Math.round(forecast.reduce((sum, f) => sum + f.predicted, 0)),
        lowerBound: Math.round(forecast.reduce((sum, f) => sum + f.lowerBound, 0)),
        upperBound: Math.round(forecast.reduce((sum, f) => sum + f.upperBound, 0)),
        trend: this.calculateTrend(historicalListings)
      },
      generatedAt: new Date()
    };

    await this.cacheService.set(cacheKey, result, 1800);
    return result;
  }

  /**
   * Get demand forecast by location
   */
  async getDemandForecast(location: string, horizon: string) {
    const cacheKey = `forecast:demand:${location}:${horizon}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const historicalPeriod = getDateRange('90d');
    const forecastPeriod = getDateRange(horizon);

    const historicalDemand = await this.getHistoricalDemandByLocation(
      location,
      historicalPeriod.startDate,
      historicalPeriod.endDate
    );

    const forecast = this.generateForecast(
      historicalDemand,
      forecastPeriod.endDate,
      0.95
    );

    const result = {
      metric: 'locationDemand',
      location,
      historicalPeriod,
      forecastPeriod,
      historical: historicalDemand,
      forecast,
      summary: {
        expectedDemand: Math.round(forecast.reduce((sum, f) => sum + f.predicted, 0)),
        demandTrend: this.calculateTrend(historicalDemand),
        recommendation: this.generateLocationRecommendation(historicalDemand, forecast)
      },
      generatedAt: new Date()
    };

    await this.cacheService.set(cacheKey, result, 1800);
    return result;
  }

  /**
   * Get churn prediction
   */
  async getChurnPrediction(userType?: string, horizon: string = '30d') {
    const cacheKey = `forecast:churn:${userType || 'all'}:${horizon}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const historicalPeriod = getDateRange('90d');
    const forecastPeriod = getDateRange(horizon);

    const churnData = await this.calculateHistoricalChurn(
      historicalPeriod.startDate,
      historicalPeriod.endDate,
      userType
    );

    const forecast = this.generateChurnForecast(
      churnData,
      forecastPeriod.endDate
    );

    const result = {
      metric: 'churnRate',
      userType: userType || 'all',
      historicalPeriod,
      forecastPeriod,
      historical: churnData,
      forecast,
      summary: {
        currentChurnRate: churnData.length > 0 ? churnData[churnData.length - 1].value : 0,
        predictedChurnRate: forecast.length > 0 ? forecast[forecast.length - 1].predicted : 0,
        atRiskUsers: await this.identifyAtRiskUsers(userType),
        recommendations: this.generateChurnRecommendations(churnData, forecast)
      },
      generatedAt: new Date()
    };

    await this.cacheService.set(cacheKey, result, 1800);
    return result;
  }

  /**
   * Get agent performance forecast
   */
  async getAgentPerformanceForecast(agentId?: string, horizon: string = '30d') {
    const cacheKey = `forecast:agent-performance:${agentId || 'all'}:${horizon}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const historicalPeriod = getDateRange('90d');
    const forecastPeriod = getDateRange(horizon);

    const performanceData = await this.getHistoricalAgentPerformance(
      historicalPeriod.startDate,
      historicalPeriod.endDate,
      agentId
    );

    const forecast = this.generateForecast(
      performanceData,
      forecastPeriod.endDate,
      0.95
    );

    const result = {
      metric: 'agentPerformance',
      agentId: agentId || 'all',
      historicalPeriod,
      forecastPeriod,
      historical: performanceData,
      forecast,
      summary: {
        expectedListings: Math.round(forecast.reduce((sum, f) => sum + f.predicted, 0)),
        performanceTrend: this.calculateTrend(performanceData),
        recommendations: this.generateAgentRecommendations(performanceData, forecast)
      },
      generatedAt: new Date()
    };

    await this.cacheService.set(cacheKey, result, 1800);
    return result;
  }

  /**
   * Get custom metric forecast
   */
  async getCustomForecast(metric: any, horizon: string, method: string = 'auto') {
    // This would implement custom forecasting logic based on the metric
    // For now, return a placeholder
    return {
      metric,
      horizon,
      method,
      forecast: [],
      message: 'Custom forecast not yet implemented'
    };
  }

  /**
   * Get forecast accuracy metrics
   */
  async getForecastAccuracy(metric: string, dateRange: string) {
    const { startDate, endDate } = getDateRange(dateRange);

    // This would compare historical forecasts with actual results
    // For now, return placeholder data
    return {
      metric,
      period: { startDate, endDate },
      accuracy: {
        mape: 0, // Mean Absolute Percentage Error
        rmse: 0, // Root Mean Square Error
        mae: 0   // Mean Absolute Error
      },
      message: 'Forecast accuracy calculation not yet implemented'
    };
  }

  // Private helper methods

  private async getHistoricalRevenue(startDate: Date, endDate: Date) {
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

    return Array.from(grouped.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async getHistoricalUserGrowth(startDate: Date, endDate: Date) {
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

    return Array.from(grouped.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async getHistoricalListings(startDate: Date, endDate: Date) {
    const properties = await prisma.property.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    const grouped = new Map<string, number>();

    properties.forEach(property => {
      const date = property.createdAt.toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) || 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async getHistoricalDemandByLocation(
    location: string,
    startDate: Date,
    endDate: Date
  ) {
    const rentals = await prisma.rental.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        property: {
          OR: [
            { city: location },
            { state: location }
          ]
        }
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    const grouped = new Map<string, number>();

    rentals.forEach(rental => {
      const date = rental.createdAt.toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) || 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async calculateHistoricalChurn(
    startDate: Date,
    endDate: Date,
    userType?: string
  ) {
    // Calculate weekly churn rates
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    const weeks: Array<{ date: string; value: number }> = [];

    let currentWeekStart = new Date(startDate);

    while (currentWeekStart < endDate) {
      const weekEnd = new Date(currentWeekStart.getTime() + weekInMs);
      const churnRate = await this.calculateWeeklyChurn(
        currentWeekStart,
        weekEnd,
        userType
      );

      weeks.push({
        date: currentWeekStart.toISOString().split('T')[0],
        value: churnRate
      });

      currentWeekStart = weekEnd;
    }

    return weeks;
  }

  private async calculateWeeklyChurn(
    startDate: Date,
    endDate: Date,
    userType?: string
  ): Promise<number> {
    const previousWeekStart = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    const whereClause: any = {};
    if (userType) {
      whereClause.role = userType;
    }

    const [activeLastWeek, activeThisWeek] = await Promise.all([
      prisma.eventLog.groupBy({
        by: ['userId'],
        where: {
          timestamp: { gte: previousWeekStart, lt: startDate },
          userId: { not: null },
          user: whereClause
        }
      }),
      prisma.eventLog.groupBy({
        by: ['userId'],
        where: {
          timestamp: { gte: startDate, lte: endDate },
          userId: { not: null },
          user: whereClause
        }
      })
    ]);

    const activeThisWeekSet = new Set(activeThisWeek.map(e => e.userId));
    const churned = activeLastWeek.filter(e => !activeThisWeekSet.has(e.userId)).length;

    return activeLastWeek.length > 0 ? (churned / activeLastWeek.length) * 100 : 0;
  }

  private async getHistoricalAgentPerformance(
    startDate: Date,
    endDate: Date,
    agentId?: string
  ) {
    const whereClause: any = {
      createdAt: { gte: startDate, lte: endDate }
    };

    if (agentId) {
      whereClause.agentId = agentId;
    } else {
      whereClause.agentId = { not: null };
    }

    const properties = await prisma.property.findMany({
      where: whereClause,
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    const grouped = new Map<string, number>();

    properties.forEach(property => {
      const date = property.createdAt.toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) || 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private generateForecast(
    historical: Array<{ date: string; value: number }>,
    endDate: Date,
    confidenceLevel: number
  ) {
    if (historical.length < 7) {
      return []; // Need at least a week of data
    }

    // Simple linear regression
    const n = historical.length;
    const x = historical.map((_, i) => i);
    const y = historical.map(h => h.value);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate standard error
    const predictions = x.map(xi => slope * xi + intercept);
    const residuals = y.map((yi, i) => yi - predictions[i]);
    const mse = residuals.reduce((sum, r) => sum + r * r, 0) / n;
    const standardError = Math.sqrt(mse);

    // Z-score for confidence level (approximation)
    const zScore = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.90 ? 1.645 : 2.576;
    const margin = zScore * standardError;

    // Generate forecast
    const lastDate = new Date(historical[historical.length - 1].date);
    const forecast: Array<{
      date: string;
      predicted: number;
      lowerBound: number;
      upperBound: number;
    }> = [];

    let forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + 1);

    let forecastIndex = n;

    while (forecastDate <= endDate) {
      const predicted = Math.max(0, slope * forecastIndex + intercept);
      
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted,
        lowerBound: Math.max(0, predicted - margin),
        upperBound: predicted + margin
      });

      forecastDate.setDate(forecastDate.getDate() + 1);
      forecastIndex++;
    }

    return forecast;
  }

  private generateChurnForecast(
    historical: Array<{ date: string; value: number }>,
    endDate: Date
  ) {
    // Similar to generateForecast but for churn rate
    return this.generateForecast(historical, endDate, 0.95);
  }

  private calculateTrend(data: Array<{ date: string; value: number }>): string {
    if (data.length < 2) return 'insufficient-data';

    const recentValues = data.slice(-7); // Last week
    const olderValues = data.slice(0, 7); // First week

    const recentAvg = recentValues.reduce((sum, d) => sum + d.value, 0) / recentValues.length;
    const olderAvg = olderValues.reduce((sum, d) => sum + d.value, 0) / olderValues.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 10) return 'strong-growth';
    if (change > 2) return 'moderate-growth';
    if (change < -10) return 'strong-decline';
    if (change < -2) return 'moderate-decline';
    return 'stable';
  }

  private calculateGrowthRate(data: Array<{ date: string; value: number }>): number {
    if (data.length < 2) return 0;

    const recent = data.slice(-7).reduce((sum, d) => sum + d.value, 0);
    const older = data.slice(0, 7).reduce((sum, d) => sum + d.value, 0);

    return older > 0 ? ((recent - older) / older) * 100 : 0;
  }

  private generateLocationRecommendation(
    historical: Array<{ date: string; value: number }>,
    forecast: Array<{ date: string; predicted: number }>
  ): string {
    const trend = this.calculateTrend(historical);
    const avgForecast = forecast.reduce((sum, f) => sum + f.predicted, 0) / forecast.length;

    if (trend === 'strong-growth' && avgForecast > 5) {
      return 'High demand area - Consider increasing marketing efforts';
    } else if (trend === 'moderate-growth') {
      return 'Growing market - Good opportunity for expansion';
    } else if (trend === 'stable') {
      return 'Stable market - Maintain current strategy';
    } else {
      return 'Declining demand - Review pricing and marketing strategy';
    }
  }

  private async identifyAtRiskUsers(userType?: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const whereClause: any = {
      createdAt: { lt: thirtyDaysAgo }
    };

    if (userType) {
      whereClause.role = userType;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true }
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentlyActive = await prisma.eventLog.groupBy({
      by: ['userId'],
      where: {
        userId: { in: users.map(u => u.id) },
        timestamp: { gte: sevenDaysAgo }
      }
    });

    const activeSet = new Set(recentlyActive.map(e => e.userId));
    return users.filter(u => !activeSet.has(u.id)).length;
  }

  private generateChurnRecommendations(
    historical: Array<{ date: string; value: number }>,
    forecast: Array<{ date: string; predicted: number }>
  ): string[] {
    const currentChurn = historical.length > 0 ? historical[historical.length - 1].value : 0;
    const predictedChurn = forecast.length > 0 ? forecast[forecast.length - 1].predicted : 0;
    const recommendations: string[] = [];

    if (predictedChurn > 15) {
      recommendations.push('Implement user retention campaign');
      recommendations.push('Review user experience and identify pain points');
    }

    if (predictedChurn > currentChurn) {
      recommendations.push('Churn rate is predicted to increase - take proactive measures');
      recommendations.push('Consider launching re-engagement email campaigns');
    }

    if (currentChurn > 10) {
      recommendations.push('Current churn rate is above healthy threshold');
      recommendations.push('Conduct user surveys to understand churn reasons');
    }

    return recommendations;
  }

  private generateAgentRecommendations(
    historical: Array<{ date: string; value: number }>,
    forecast: Array<{ date: string; predicted: number }>
  ): string[] {
    const trend = this.calculateTrend(historical);
    const recommendations: string[] = [];

    if (trend === 'strong-decline') {
      recommendations.push('Agent performance declining - provide additional training');
      recommendations.push('Review agent incentive structure');
    } else if (trend === 'stable' || trend === 'moderate-growth') {
      recommendations.push('Maintain current support and training programs');
    } else if (trend === 'strong-growth') {
      recommendations.push('High-performing agents - consider recognition program');
      recommendations.push('Document best practices for training others');
    }

    return recommendations;
  }
}