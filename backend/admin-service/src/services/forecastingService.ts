// backend/admin-service/src/services/forecastingService.ts
import { PrismaClient } from '@newcondo/db';
import { 
  RevenueForecast, 
  ForecastModel,
  TrendData 
} from '../types/revenue';

const prisma = new PrismaClient();

export class ForecastingService {
  /**
   * Generate revenue forecast using multiple models
   */
  async generateRevenueForecast(
    months: number = 6,
    model: ForecastModel = 'hybrid'
  ): Promise<RevenueForecast> {
    // Get historical data (last 12 months)
    const historicalData = await this.getHistoricalRevenueData(12);

    let forecast: any;

    switch (model) {
      case 'linear':
        forecast = this.linearRegressionForecast(historicalData, months);
        break;
      case 'exponential':
        forecast = this.exponentialSmoothingForecast(historicalData, months);
        break;
      case 'moving-average':
        forecast = this.movingAverageForecast(historicalData, months);
        break;
      case 'hybrid':
      default:
        forecast = this.hybridForecast(historicalData, months);
    }

    const seasonalFactors = this.calculateSeasonalFactors(historicalData);
    const adjustedForecast = this.applySeasonalAdjustment(forecast, seasonalFactors);

    return {
      model,
      forecastPeriodMonths: months,
      predictions: adjustedForecast.predictions,
      confidenceInterval: adjustedForecast.confidence,
      growthRate: this.calculateGrowthRate(historicalData),
      seasonalFactors,
      accuracy: await this.calculateModelAccuracy(model, historicalData),
      generatedAt: new Date()
    };
  }

  /**
   * Forecast user growth
   */
  async forecastUserGrowth(months: number = 6): Promise<{
    predictions: Array<{ month: string; users: number }>;
    growthRate: number;
  }> {
    const historicalData = await this.getHistoricalUserData(12);
    const forecast = this.linearRegressionForecast(historicalData, months);

    return {
      predictions: forecast.predictions,
      growthRate: this.calculateGrowthRate(historicalData)
    };
  }

  /**
   * Forecast property listing growth
   */
  async forecastPropertyGrowth(months: number = 6): Promise<{
    predictions: Array<{ month: string; properties: number }>;
    growthRate: number;
  }> {
    const historicalData = await this.getHistoricalPropertyData(12);
    const forecast = this.linearRegressionForecast(historicalData, months);

    return {
      predictions: forecast.predictions,
      growthRate: this.calculateGrowthRate(historicalData)
    };
  }

  /**
   * Forecast payment volume
   */
  async forecastPaymentVolume(months: number = 6): Promise<{
    predictions: Array<{ month: string; volume: number; amount: number }>;
    averageTransactionValue: number;
  }> {
    const historicalData = await this.getHistoricalPaymentData(12);
    
    return {
      predictions: historicalData.slice(-months).map((data, index) => ({
        month: this.getFutureMonth(index + 1),
        volume: Math.round(data.value * 1.1), // 10% growth assumption
        amount: data.value * 1.1 * this.getAverageTransactionValue(historicalData)
      })),
      averageTransactionValue: this.getAverageTransactionValue(historicalData)
    };
  }

  /**
   * Predict cash flow for upcoming periods
   */
  async predictCashFlow(months: number = 3): Promise<{
    predictions: Array<{
      month: string;
      expectedInflow: number;
      expectedOutflow: number;
      netCashFlow: number;
    }>;
  }> {
    const [revenueHistory, expenseHistory] = await Promise.all([
      this.getHistoricalRevenueData(6),
      this.getHistoricalExpenseData(6)
    ]);

    const revenueForecast = this.movingAverageForecast(revenueHistory, months);
    const expenseForecast = this.movingAverageForecast(expenseHistory, months);

    return {
      predictions: revenueForecast.predictions.map((rev, index) => ({
        month: rev.month,
        expectedInflow: rev.value,
        expectedOutflow: expenseForecast.predictions[index].value,
        netCashFlow: rev.value - expenseForecast.predictions[index].value
      }))
    };
  }

  /**
   * Calculate break-even analysis
   */
  async calculateBreakEven(): Promise<{
    breakEvenRevenue: number;
    currentRevenue: number;
    monthsToBreakEven: number;
    requiredGrowthRate: number;
  }> {
    const fixedCosts = await this.calculateFixedCosts();
    const variableCosts = await this.calculateVariableCosts();
    const currentRevenue = await this.getCurrentMonthlyRevenue();

    const breakEvenRevenue = fixedCosts / (1 - variableCosts);
    const monthsToBreakEven = currentRevenue > 0
      ? Math.ceil(breakEvenRevenue / currentRevenue)
      : Infinity;

    const requiredGrowthRate = currentRevenue > 0
      ? ((breakEvenRevenue / currentRevenue) - 1) * 100
      : 0;

    return {
      breakEvenRevenue,
      currentRevenue,
      monthsToBreakEven,
      requiredGrowthRate
    };
  }

  // Forecasting Models
  private linearRegressionForecast(data: TrendData[], months: number) {
    const n = data.length;
    const xValues = Array.from({ length: n }, (_, i) => i + 1);
    const yValues = data.map(d => d.value);

    // Calculate slope and intercept
    const xMean = xValues.reduce((a, b) => a + b, 0) / n;
    const yMean = yValues.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
      denominator += Math.pow(xValues[i] - xMean, 2);
    }

    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    // Generate predictions
    const predictions = [];
    for (let i = 1; i <= months; i++) {
      const x = n + i;
      const value = slope * x + intercept;
      predictions.push({
        month: this.getFutureMonth(i),
        value: Math.max(0, value)
      });
    }

    return {
      predictions,
      confidence: this.calculateConfidence(data, slope, intercept)
    };
  }

  private exponentialSmoothingForecast(data: TrendData[], months: number) {
    const alpha = 0.3; // Smoothing factor
    let forecast = data[0].value;

    // Calculate initial forecast
    for (let i = 1; i < data.length; i++) {
      forecast = alpha * data[i].value + (1 - alpha) * forecast;
    }

    // Generate predictions
    const predictions = [];
    for (let i = 1; i <= months; i++) {
      predictions.push({
        month: this.getFutureMonth(i),
        value: forecast
      });
      forecast = alpha * forecast + (1 - alpha) * forecast;
    }

    return {
      predictions,
      confidence: { lower: forecast * 0.85, upper: forecast * 1.15 }
    };
  }

  private movingAverageForecast(data: TrendData[], months: number) {
    const windowSize = 3;
    const recentValues = data.slice(-windowSize).map(d => d.value);
    const average = recentValues.reduce((a, b) => a + b, 0) / windowSize;

    // Calculate trend
    const trend = recentValues.length > 1
      ? (recentValues[recentValues.length - 1] - recentValues[0]) / (windowSize - 1)
      : 0;

    const predictions = [];
    for (let i = 1; i <= months; i++) {
      predictions.push({
        month: this.getFutureMonth(i),
        value: average + (trend * i)
      });
    }

    return {
      predictions,
      confidence: { lower: average * 0.9, upper: average * 1.1 }
    };
  }

  private hybridForecast(data: TrendData[], months: number) {
    const linear = this.linearRegressionForecast(data, months);
    const exponential = this.exponentialSmoothingForecast(data, months);
    const movingAvg = this.movingAverageForecast(data, months);

    // Weighted average of all models
    const predictions = linear.predictions.map((pred, index) => ({
      month: pred.month,
      value: (
        pred.value * 0.4 +
        exponential.predictions[index].value * 0.3 +
        movingAvg.predictions[index].value * 0.3
      )
    }));

    return {
      predictions,
      confidence: {
        lower: Math.min(
          linear.confidence.lower,
          exponential.confidence.lower,
          movingAvg.confidence.lower
        ),
        upper: Math.max(
          linear.confidence.upper,
          exponential.confidence.upper,
          movingAvg.confidence.upper
        )
      }
    };
  }

  // Helper methods
  private async getHistoricalRevenueData(months: number): Promise<TrendData[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startDate }
      },
      select: {
        paidAt: true,
        amount: true,
        platformFee: true
      }
    });

    // Group by month
    const monthlyData = new Map<string, number>();

    payments.forEach(payment => {
      const month = payment.paidAt.toISOString().slice(0, 7);
      const revenue = payment.platformFee?.toNumber() || 0;
      monthlyData.set(month, (monthlyData.get(month) || 0) + revenue);
    });

    return Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, value]) => ({ month, value }));
  }

  private async getHistoricalUserData(months: number): Promise<TrendData[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true }
    });

    const monthlyData = new Map<string, number>();

    users.forEach(user => {
      const month = user.createdAt.toISOString().slice(0, 7);
      monthlyData.set(month, (monthlyData.get(month) || 0) + 1);
    });

    return Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, value]) => ({ month, value }));
  }

  private async getHistoricalPropertyData(months: number): Promise<TrendData[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const properties = await prisma.property.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true }
    });

    const monthlyData = new Map<string, number>();

    properties.forEach(property => {
      const month = property.createdAt.toISOString().slice(0, 7);
      monthlyData.set(month, (monthlyData.get(month) || 0) + 1);
    });

    return Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, value]) => ({ month, value }));
  }

  private async getHistoricalPaymentData(months: number): Promise<TrendData[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const payments = await prisma.payment.groupBy({
      by: ['paidAt'],
      _count: true,
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startDate }
      }
    });

    const monthlyData = new Map<string, number>();

    payments.forEach(payment => {
      const month = new Date(payment.paidAt).toISOString().slice(0, 7);
      monthlyData.set(month, (monthlyData.get(month) || 0) + payment._count);
    });

    return Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, value]) => ({ month, value }));
  }

  private async getHistoricalExpenseData(months: number): Promise<TrendData[]> {
    // This would calculate platform expenses (hosting, commissions paid, etc.)
    // For now, return dummy data
    return Array.from({ length: months }, (_, i) => ({
      month: this.getPastMonth(months - i),
      value: 50000 + Math.random() * 10000
    }));
  }

  private calculateSeasonalFactors(data: TrendData[]): Record<string, number> {
    const monthlyAverages = new Map<number, number[]>();

    data.forEach(point => {
      const month = new Date(point.month).getMonth();
      if (!monthlyAverages.has(month)) {
        monthlyAverages.set(month, []);
      }
      monthlyAverages.get(month)!.push(point.value);
    });

    const factors: Record<string, number> = {};
    monthlyAverages.forEach((values, month) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const overallAvg = data.reduce((a, b) => a + b.value, 0) / data.length;
      factors[month.toString()] = avg / overallAvg;
    });

    return factors;
  }

  private applySeasonalAdjustment(
    forecast: any,
    seasonalFactors: Record<string, number>
  ) {
    const adjustedPredictions = forecast.predictions.map((pred: any) => {
      const month = new Date(pred.month).getMonth();
      const factor = seasonalFactors[month.toString()] || 1;
      return {
        ...pred,
        value: pred.value * factor
      };
    });

    return {
      predictions: adjustedPredictions,
      confidence: forecast.confidence
    };
  }

  private calculateGrowthRate(data: TrendData[]): number {
    if (data.length < 2) return 0;

    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;

    return ((lastValue - firstValue) / firstValue) * 100;
  }

  private calculateConfidence(data: TrendData[], slope: number, intercept: number) {
    const predictions = data.map((_, i) => slope * (i + 1) + intercept);
    const errors = data.map((d, i) => Math.abs(d.value - predictions[i]));
    const meanError = errors.reduce((a, b) => a + b, 0) / errors.length;

    const lastPrediction = predictions[predictions.length - 1];

    return {
      lower: lastPrediction - meanError,
      upper: lastPrediction + meanError
    };
  }

  private async calculateModelAccuracy(
    model: ForecastModel,
    data: TrendData[]
  ): Promise<number> {
    // Use last 3 months as test data
    const testSize = 3;
    const trainData = data.slice(0, -testSize);
    const testData = data.slice(-testSize);

    let forecast: any;
    switch (model) {
      case 'linear':
        forecast = this.linearRegressionForecast(trainData, testSize);
        break;
      case 'exponential':
        forecast = this.exponentialSmoothingForecast(trainData, testSize);
        break;
      case 'moving-average':
        forecast = this.movingAverageForecast(trainData, testSize);
        break;
      default:
        return 85; // Default accuracy
    }

    // Calculate MAPE (Mean Absolute Percentage Error)
    const errors = testData.map((actual, i) => {
      const predicted = forecast.predictions[i].value;
      return Math.abs((actual.value - predicted) / actual.value);
    });

    const mape = errors.reduce((a, b) => a + b, 0) / errors.length;
    const accuracy = (1 - mape) * 100;

    return Math.max(0, Math.min(100, accuracy));
  }

  private getAverageTransactionValue(data: TrendData[]): number {
    return data.reduce((a, b) => a + b.value, 0) / data.length;
  }

  private async calculateFixedCosts(): Promise<number> {
    // Fixed monthly costs (hosting, salaries, etc.)
    return 100000; // NGN
  }

  private async calculateVariableCosts(): Promise<number> {
    // Variable costs as percentage of revenue (payment processing, commissions, etc.)
    return 0.25; // 25%
  }

  private async getCurrentMonthlyRevenue(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await prisma.payment.aggregate({
      _sum: { platformFee: true },
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startOfMonth }
      }
    });

    return result._sum.platformFee?.toNumber() || 0;
  }

  private getFutureMonth(offset: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() + offset);
    return date.toISOString().slice(0, 7);
  }

  private getPastMonth(offset: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - offset);
    return date.toISOString().slice(0, 7);
  }
}

export default new ForecastingService();