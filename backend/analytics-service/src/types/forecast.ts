export interface ForecastDataPoint {
  date: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
}

export interface RevenueForecast {
  metric: 'revenue';
  historicalPeriod: {
    startDate: Date;
    endDate: Date;
  };
  forecastPeriod: {
    startDate: Date;
    endDate: Date;
  };
  confidenceLevel: number;
  historical: Array<{
    date: string;
    value: number;
  }>;
  forecast: ForecastDataPoint[];
  summary: {
    expectedRevenue: number;
    lowerBound: number;
    upperBound: number;
    trend: string;
  };
  generatedAt: Date;
}

export interface UserGrowthForecast {
  metric: 'userGrowth';
  historicalPeriod: {
    startDate: Date;
    endDate: Date;
  };
  forecastPeriod: {
    startDate: Date;
    endDate: Date;
  };
  confidenceLevel: number;
  historical: Array<{
    date: string;
    value: number;
  }>;
  forecast: ForecastDataPoint[];
  summary: {
    expectedNewUsers: number;
    lowerBound: number;
    upperBound: number;
    growthRate: number;
  };
  generatedAt: Date;
}

export interface ChurnPrediction {
  metric: 'churnRate';
  userType: string;
  historicalPeriod: {
    startDate: Date;
    endDate: Date;
  };
  forecastPeriod: {
    startDate: Date;
    endDate: Date;
  };
  historical: Array<{
    date: string;
    value: number;
  }>;
  forecast: ForecastDataPoint[];
  summary: {
    currentChurnRate: number;
    predictedChurnRate: number;
    atRiskUsers: number;
    recommendations: string[];
  };
  generatedAt: Date;
}

export interface DemandForecast {
  metric: 'locationDemand';
  location: string;
  historicalPeriod: {
    startDate: Date;
    endDate: Date;
  };
  forecastPeriod: {
    startDate: Date;
    endDate: Date;
  };
  historical: Array<{
    date: string;
    value: number;
  }>;
  forecast: ForecastDataPoint[];
  summary: {
    expectedDemand: number;
    demandTrend: string;
    recommendation: string;
  };
  generatedAt: Date;
}