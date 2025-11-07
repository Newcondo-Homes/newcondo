// apps/admin/src/types/marketInsights.ts

/**
 * Market overview
 */
export interface MarketOverview {
  totalSupply: number;
  totalDemand: number;
  demandSupplyRatio: number;
  marketTrend: 'growing' | 'stable' | 'declining';
  averagePrice: number;
  medianPrice: number;
  priceGrowthRate: number;
  occupancyRate: number;
  avgTimeToRent: number;
}

/**
 * Price trends
 */
export interface PriceTrends {
  overall: {
    currentAverage: number;
    previousAverage: number;
    change: number;
    changePercentage: number;
    trend: 'up' | 'down' | 'stable';
  };
  
  byPropertyType: Array<{
    type: string;
    averagePrice: number;
    medianPrice: number;
    priceRange: { min: number; max: number };
    change: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  
  byLocation: Array<{
    state: string;
    city?: string;
    averagePrice: number;
    medianPrice: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
    volumeChange: number;
  }>;
  
  priceDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  
  historicalTrend: Array<{
    period: string;
    averagePrice: number;
    medianPrice: number;
  }>;
}

/**
 * Demand analysis
 */
export interface DemandAnalysis {
  totalDemand: number;
  demandGrowthRate: number;
  
  demandByPropertyType: Array<{
    type: string;
    searchCount: number;
    viewCount: number;
    inquiryCount: number;
    demandScore: number;
    supplyCount: number;
    demandSupplyRatio: number;
  }>;
  
  demandByLocation: Array<{
    state: string;
    city?: string;
    searchCount: number;
    viewCount: number;
    inquiryCount: number;
    demandScore: number;
  }>;
  
  demandByPriceRange: Array<{
    range: string;
    demandCount: number;
    supplyCount: number;
    ratio: number;
  }>;
  
  demandByBedrooms: Array<{
    bedrooms: number;
    demandCount: number;
    supplyCount: number;
    ratio: number;
  }>;
  
  demandTrend: Array<{
    period: string;
    demandScore: number;
  }>;
}

/**
 * Supply analysis
 */
export interface SupplyAnalysis {
  totalSupply: number;
  supplyGrowthRate: number;
  
  supplyByPropertyType: Array<{
    type: string;
    totalCount: number;
    availableCount: number;
    occupiedCount: number;
    occupancyRate: number;
  }>;
  
  supplyByLocation: Array<{
    state: string;
    city?: string;
    totalCount: number;
    availableCount: number;
    occupancyRate: number;
    growthRate: number;
  }>;
  
  supplyByPriceRange: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  
  newSupply: {
    lastMonth: number;
    lastQuarter: number;
    lastYear: number;
    trendDirection: 'increasing' | 'decreasing' | 'stable';
  };
  
  supplyTrend: Array<{
    period: string;
    totalSupply: number;
    newListings: number;
  }>;
}

/**
 * Occupancy insights
 */
export interface OccupancyInsights {
  overallOccupancyRate: number;
  
  occupancyByPropertyType: Array<{
    type: string;
    occupancyRate: number;
    avgTimeToRent: number;
    turnoverRate: number;
  }>;
  
  occupancyByLocation: Array<{
    state: string;
    city?: string;
    occupancyRate: number;
    avgTimeToRent: number;
  }>;
  
  occupancyByPriceRange: Array<{
    range: string;
    occupancyRate: number;
    avgTimeToRent: number;
  }>;
  
  seasonalOccupancy: Array<{
    month: string;
    occupancyRate: number;
  }>;
  
  occupancyTrend: Array<{
    period: string;
    occupancyRate: number;
  }>;
}

/**
 * Popular property features
 */
export interface PopularPropertyFeatures {
  mostSearchedFeatures: Array<{
    feature: string;
    searchCount: number;
    percentage: number;
  }>;
  
  mostViewedFeatures: Array<{
    feature: string;
    viewCount: number;
    conversionRate: number;
  }>;
  
  premiumFeatures: Array<{
    feature: string;
    averagePriceIncrease: number;
    demandIncrease: number;
  }>;
  
  emergingFeatures: Array<{
    feature: string;
    growthRate: number;
    adoptionRate: number;
  }>;
}

/**
 * Location hotspots
 */
export interface LocationHotspots {
  topLocations: Array<{
    state: string;
    city: string;
    demandScore: number;
    supplyScore: number;
    priceGrowth: number;
    occupancyRate: number;
    avgTimeToRent: number;
    hotspotRank: number;
    reason: string[];
  }>;
  
  emergingLocations: Array<{
    state: string;
    city: string;
    growthRate: number;
    newListingsCount: number;
    priceChange: number;
  }>;
  
  oversaturatedLocations: Array<{
    state: string;
    city: string;
    supplyExcess: number;
    avgTimeToRent: number;
    recommendation: string;
  }>;
}

/**
 * Pricing recommendations
 */
export interface PricingRecommendations {
  propertyId?: string;
  
  recommendedPrice: number;
  priceRange: {
    min: number;
    max: number;
    optimal: number;
  };
  
  competitivePricing: {
    belowMarket: number;
    atMarket: number;
    aboveMarket: number;
  };
  
  priceFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  
  similarProperties: Array<{
    propertyId: string;
    price: number;
    timeToRent: number;
    location: string;
  }>;
  
  strategyRecommendation: string;
}

/**
 * Seasonal trends
 */
export interface SeasonalTrends {
  seasonalityIndex: number;
  
  demandByMonth: Array<{
    month: string;
    demandScore: number;
    percentageOfAverage: number;
  }>;
  
  priceByMonth: Array<{
    month: string;
    averagePrice: number;
    percentageOfAverage: number;
  }>;
  
  occupancyByMonth: Array<{
    month: string;
    occupancyRate: number;
  }>;
  
  peakSeasons: Array<{
    season: string;
    months: string[];
    avgDemandIncrease: number;
    avgPriceIncrease: number;
  }>;
  
  offPeakSeasons: Array<{
    season: string;
    months: string[];
    avgDemandDecrease: number;
    avgPriceDecrease: number;
  }>;
}

/**
 * Competitor analysis
 */
export interface CompetitorAnalysis {
  platformMarketShare: number;
  
  competitors: Array<{
    name: string;
    estimatedListings: number;
    estimatedMarketShare: number;
    strengthAreas: string[];
    weaknessAreas: string[];
  }>;
  
  competitiveAdvantages: string[];
  competitiveDisadvantages: string[];
  
  benchmarking: {
    avgListingPrice: {
      platform: number;
      market: number;
      difference: number;
    };
    avgTimeToRent: {
      platform: number;
      market: number;
      difference: number;
    };
    occupancyRate: {
      platform: number;
      market: number;
      difference: number;
    };
  };
}

/**
 * Market forecast
 */
export interface MarketForecast {
  forecastPeriods: Array<{
    period: string;
    
    priceforecast: {
      predicted: number;
      lowerBound: number;
      upperBound: number;
      confidence: number;
    };
    
    demandForecast: {
      predicted: number;
      lowerBound: number;
      upperBound: number;
      confidence: number;
    };
    
    supplyForecast: {
      predicted: number;
      lowerBound: number;
      upperBound: number;
      confidence: number;
    };
  }>;
  
  keyAssumptions: string[];
  riskFactors: string[];
  opportunities: string[];
}

/**
 * Investment insights
 */
export interface InvestmentInsights {
  attractiveSegments: Array<{
    segment: string;
    roi: number;
    riskLevel: 'low' | 'medium' | 'high';
    timeframe: string;
    recommendation: string;
  }>;
  
  highGrowthAreas: Array<{
    location: string;
    growthRate: number;
    currentPrice: number;
    projectedPrice: number;
  }>;
  
  undervaluedMarkets: Array<{
    location: string;
    currentPrice: number;
    fairValue: number;
    upside: number;
  }>;
  
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high';
    factors: Array<{
      factor: string;
      riskLevel: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
  };
}

/**
 * User behavior insights
 */
export interface UserBehaviorInsights {
  searchPatterns: Array<{
    searchTerm: string;
    frequency: number;
    conversionRate: number;
  }>;
  
  browsingBehavior: {
    avgPropertiesViewed: number;
    avgSessionDuration: number;
    bounceRate: number;
    returnVisitorRate: number;
  };
  
  preferredPropertyTypes: Array<{
    type: string;
    viewCount: number;
    inquiryRate: number;
  }>;
  
  pricePreferences: Array<{
    range: string;
    searchCount: number;
    percentage: number;
  }>;
  
  locationPreferences: Array<{
    location: string;
    searchCount: number;
    conversionRate: number;
  }>;
}

/**
 * Market health indicators
 */
export interface MarketHealthIndicators {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  healthScore: number;
  
  indicators: {
    demandSupplyBalance: {
      score: number;
      status: 'balanced' | 'oversupply' | 'undersupply';
    };
    
    priceStability: {
      score: number;
      volatility: number;
      status: 'stable' | 'volatile';
    };
    
    transactionVelocity: {
      score: number;
      avgTimeToRent: number;
      status: 'fast' | 'normal' | 'slow';
    };
    
    marketLiquidity: {
      score: number;
      turnoverRate: number;
      status: 'liquid' | 'moderate' | 'illiquid';
    };
    
    growthMomentum: {
      score: number;
      growthRate: number;
      status: 'accelerating' | 'steady' | 'decelerating';
    };
  };
  
  recommendations: string[];
}