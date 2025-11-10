export interface TrendDataPoint {
  date: string;
  count?: number;
  value?: number;
  cumulative?: number;
}

export interface RevenueTrendDataPoint {
  date: string;
  revenue: number;
  platformFee: number;
  transactionCount: number;
}

export interface UserGrowthTrends {
  period: {
    startDate: Date;
    endDate: Date;
  };
  interval: 'day' | 'week' | 'month';
  data: Array<{
    date: string;
    newUsers: number;
    cumulative: number;
  }>;
  totalGrowth: number;
  averageDaily: number;
}

export interface RevenueTrends {
  period: {
    startDate: Date;
    endDate: Date;
  };
  interval: 'day' | 'week' | 'month';
  data: RevenueTrendDataPoint[];
  breakdown?: any;
  totalRevenue: number;
  totalPlatformFees: number;
  transactionCount: number;
}

export interface GeographicTrend {
  location: string;
  propertyCount: number;
  rentalCount: number;
}

export interface PropertyTypeTrend {
  type: string;
  listingCount: number;
  averagePrice: number;
  rentalCount: number;
  conversionRate: number;
}

export interface SeasonalTrends {
  metric: string;
  period: {
    startDate: Date;
    endDate: Date;
    years: number;
  };
  data: Array<{
    month: string;
    value: number;
  }>;
  insights: {
    peakMonth: string;
    peakValue: number;
    lowMonth: string;
    lowValue: number;
    variation: number;
  };
}

export interface Anomaly {
  date: string;
  value: number;
  expected: number;
  deviation: number;
  zScore: number;
  severity: 'high' | 'medium' | 'low';
}