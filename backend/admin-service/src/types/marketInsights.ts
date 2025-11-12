export interface MarketOverview {
  summary: {
    totalProperties: number;
    activeListings: number;
    averagePrice: number;
    medianPrice: number;
    totalRentals: number;
    averageTimeToRent: number;
  };
  topCities: {
    city: string;
    count: number;
  }[];
  propertyTypeDistribution: {
    propertyType: string;
    _count: number;
  }[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface PricingTrends {
  trends: {
    month: string;
    averagePrice: number;
    count: number;
  }[];
  priceChange: {
    percentage: number;
    amount: number;
  };
  priceByType: {
    type: string;
    averagePrice: number;
    count: number;
  }[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface DemandAnalysis {
  newListings: number;
  rentedProperties: number;
  viewCount: number;
  averageDaysOnMarket: number;
  demandScore: number;
  supplyDemandRatio: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface VacancyRates {
  totalProperties: number;
  vacantProperties: number;
  vacancyRate: number;
  vacancyByLocation: {
    location: string;
    total: number;
    vacant: number;
    rate: number;
  }[];
}

export interface PropertyTypeDistribution {
  distribution: {
    type: string;
    count: number;
    percentage: number;
    averagePrice: number;
  }[];
  total: number;
}

export interface PopularLocations {
  locations: {
    location: string;
    count: number;
    metric: string;
  }[];
  metric: 'listings' | 'rentals' | 'views';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface TimeToRent {
  averageDays: number;
  medianDays: number;
  byPropertyType: {
    type: string;
    averageDays: number;
    count: number;
  }[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface SeasonalTrends {
  trends: {
    month: string;
    count: number;
    averageRent: number;
  }[];
  peakSeason: {
    month: string;
    count: number;
    averageRent: number;
  };
  lowSeason: {
    month: string;
    count: number;
    averageRent: number;
  };
  analysisYears: number;
}

export interface MarketCompetitiveness {
  totalListings: number;
  activeAgents: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
    range: number;
  };
  competitionScore: number;
  marketDensity: number;
}