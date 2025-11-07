import { apiClient } from './client';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface MarketFilters {
  state?: string;
  city?: string;
  propertyType?: string;
  priceRange?: { min: number; max: number };
}

export interface MarketOverview {
  totalListings: number;
  activeListings: number;
  averagePrice: number;
  medianPrice: number;
  priceGrowth: number;
  listingsGrowth: number;
  rentalsGrowth: number;
  occupancyRate: number;
  averageDaysOnMarket: number;
  supplyDemandRatio: number;
  healthScore: number;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface PropertyTrends {
  direction: 'up' | 'down' | 'stable';
  growthRate: number;
  byPropertyType: Array<{
    propertyType: string;
    count: number;
    averagePrice: number;
    priceChange: number;
    occupancyRate: number;
    averageDaysToRent: number;
    priceGrowth: number;
  }>;
  byPriceRange: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  emerging: Array<{
    type: string;
    growth: number;
    reason: string;
  }>;
  declining: Array<{
    type: string;
    decline: number;
    reason: string;
  }>;
}

export interface PricingAnalysis {
  averagePrice: number;
  medianPrice: number;
  pricePerSqm: number;
  distribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  byPropertyType: Array<{
    type: string;
    averagePrice: number;
    medianPrice: number;
    priceChange: number;
  }>;
  byLocation: Array<{
    location: string;
    averagePrice: number;
    medianPrice: number;
    affordabilityIndex: number;
  }>;
  trends: Array<{
    date: string;
    averagePrice: number;
    medianPrice: number;
  }>;
  outliers: Array<{
    propertyId: string;
    price: number;
    reason: string;
  }>;
}

export interface DemandAnalysis {
  totalDemand: number;
  demandGrowth: number;
  demandSupplyRatio: number;
  hotspots: Array<{
    location: string;
    demandScore: number;
    viewsPerListing: number;
    inquiriesPerListing: number;
    averageTimeToRent: number;
  }>;
  byPropertyType: Array<{
    type: string;
    demand: number;
    supply: number;
    ratio: number;
  }>;
  seasonality: Array<{
    month: string;
    demand: number;
    supply: number;
  }>;
  competitiveness: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'very high';
    factors: string[];
  };
}

export interface LocationInsights {
  locations: Array<{
    state: string;
    city: string;
    count: number;
    averagePrice: number;
    demandScore: number;
    coordinates?: { lat: number; lng: number };
    growthRate: number;
    occupancyRate: number;
    investmentScore: number;
  }>;
  topCities: Array<{
    city: string;
    state: string;
    listings: number;
    averagePrice: number;
    growth: number;
  }>;
  emergingMarkets: Array<{
    location: string;
    growthRate: number;
    potentialScore: number;
    reasons: string[];
  }>;
}

export interface SeasonalTrends {
  byMonth: Array<{
    month: string;
    listings: number;
    rentals: number;
    averagePrice: number;
    demand: number;
  }>;
  peakSeasons: Array<{
    period: string;
    demand: number;
    priceIncrease: number;
  }>;
  offPeakSeasons: Array<{
    period: string;
    demand: number;
    priceDecrease: number;
  }>;
  recommendations: Array<{
    period: string;
    action: string;
    expectedImpact: string;
  }>;
}

export interface CompetitiveAnalysis {
  marketShare: Array<{
    entity: string;
    share: number;
    listings: number;
  }>;
  topCompetitors: Array<{
    name: string;
    listings: number;
    averagePrice: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  competitiveAdvantages: string[];
  threats: string[];
  opportunities: string[];
}

export interface ForecastData {
  forecasts: Array<{
    period: string;
    projected: number;
    confidence: number;
  }>;
  nextMonth: {
    listings: number;
    rentals: number;
    averagePrice: number;
    confidence: number;
  };
  nextQuarter: {
    listings: number;
    rentals: number;
    averagePrice: number;
    confidence: number;
  };
  nextYear: {
    listings: number;
    rentals: number;
    averagePrice: number;
    confidence: number;
  };
  assumptions: string[];
  risks: string[];
}

// Get market overview
export async function getMarketOverview(
  dateRange?: DateRange,
  filters?: MarketFilters
): Promise<MarketOverview> {
  const response = await apiClient.get('/admin/market/overview', {
    params: {
      startDate: dateRange?.startDate.toISOString(),
      endDate: dateRange?.endDate.toISOString(),
      ...filters,
    },
  });
  return response.data;
}

// Get property trends
export async function getPropertyTrends(
  dateRange?: DateRange,
  filters?: MarketFilters
): Promise<PropertyTrends> {
  const response = await apiClient.get('/admin/market/trends', {
    params: {
      startDate: dateRange?.startDate.toISOString(),
      endDate: dateRange?.endDate.toISOString(),
      ...filters,
    },
  });
  return response.data;
}

// Get pricing analysis
export async function getPricingAnalysis(
  dateRange?: DateRange,
  filters?: MarketFilters
): Promise<PricingAnalysis> {
  const response = await apiClient.get('/admin/market/pricing', {
    params: {
      startDate: dateRange?.startDate.toISOString(),
      endDate: dateRange?.endDate.toISOString(),
      ...filters,
    },
  });
  return response.data;
}

// Get demand analysis
export async function getDemandAnalysis(
  dateRange?: DateRange,
  filters?: MarketFilters
): Promise<DemandAnalysis> {
  const response = await apiClient.get('/admin/market/demand', {
    params: {
      startDate: dateRange?.startDate.toISOString(),
      endDate: dateRange?.endDate.toISOString(),
      ...filters,
    },
  });
  return response.data;
}

// Get location insights
export async function getLocationInsights(
  location?: string,
  dateRange?: DateRange
): Promise<LocationInsights> {
  const response = await apiClient.get('/admin/market/location-insights', {
    params: {
      location,
      startDate: dateRange?.startDate.toISOString(),
      endDate: dateRange?.endDate.toISOString(),
    },
  });
  return response.data;
}

// Get seasonal trends
export async function getSeasonalTrends(dateRange?: DateRange): Promise<SeasonalTrends> {
  const response = await apiClient.get('/admin/market/seasonal', {
    params: {
      startDate: dateRange?.startDate.toISOString(),
      endDate: dateRange?.endDate.toISOString(),
    },
  });
  return response.data;
}

// Get competitive analysis
export async function getCompetitiveAnalysis(filters?: MarketFilters): Promise<CompetitiveAnalysis> {
  const response = await apiClient.get('/admin/market/competitive', {
    params: filters,
  });
  return response.data;
}

// Get forecast data
export async function getForecastData(months: number = 6): Promise<ForecastData> {
  const response = await apiClient.get('/admin/market/forecasts', {
    params: { months },
  });
  return response.data;
}

// Export market report
export async function exportMarketReport(
  dateRange?: DateRange,
  filters?: MarketFilters,
  format: 'csv' | 'pdf' = 'pdf'
): Promise<Blob> {
  const response = await apiClient.get('/admin/market/export', {
    params: {
      startDate: dateRange?.startDate.toISOString(),
      endDate: dateRange?.endDate.toISOString(),
      ...filters,
      format,
    },
    responseType: 'blob',
  });
  return response.data;
}

// Get market comparison
export async function getMarketComparison(
  locations: string[],
  dateRange?: DateRange
): Promise<Array<{
  location: string;
  metrics: MarketOverview;
}>> {
  const response = await apiClient.post('/admin/market/compare', {
    locations,
    startDate: dateRange?.startDate.toISOString(),
    endDate: dateRange?.endDate.toISOString(),
  });
  return response.data;
}

// Get investment score
export async function getInvestmentScore(
  location: string,
  propertyType?: string
): Promise<{
  score: number;
  rating: string;
  factors: Array<{ factor: string; impact: number; description: string }>;
  recommendation: string;
}> {
  const response = await apiClient.get('/admin/market/investment-score', {
    params: { location, propertyType },
  });
  return response.data;
}