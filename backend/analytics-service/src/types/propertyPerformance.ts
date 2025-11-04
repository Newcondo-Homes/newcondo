export interface PropertyPerformanceMetrics {
  propertyId: string;
  propertyTitle: string;
  totalViews: number;
  uniqueViews: number;
  totalRentals: number;
  activeRentals: number;
  totalRevenue: number;
  averageViewsPerDay: number;
  conversionRate: number;
  daysOnMarket: number;
  lastViewedAt: Date | null;
  performance: PerformanceRating;
}

export type PerformanceRating = 'excellent' | 'good' | 'average' | 'poor';

export interface ViewAnalytics {
  propertyId: string;
  period: string;
  totalViews: number;
  uniqueViews: number;
  viewsByDate: ViewsByDate[];
  peakViewingTime: string;
  averageViewDuration: number;
  bounceRate: number;
}

export interface ViewsByDate {
  date: string;
  views: number;
}

export interface ConversionRate {
  propertyId: string;
  totalViews: number;
  totalRentals: number;
  conversionRate: number;
  comparisonToAverage: number;
  trend: ConversionTrend;
}

export type ConversionTrend = 'improving' | 'declining' | 'stable';

export interface PropertyComparison {
  properties: PropertyPerformanceMetrics[];
  averageMetrics: {
    avgViews: number;
    avgRentals: number;
    avgRevenue: number;
    avgConversionRate: number;
  };
}

export interface PerformanceRanking {
  best: PropertyPerformanceMetrics[];
  worst: PropertyPerformanceMetrics[];
  metric: RankingMetric;
}

export type RankingMetric = 'views' | 'rentals' | 'revenue' | 'conversion';

export interface MarketingEffectiveness {
  propertyId: string;
  totalViews: number;
  organicViews: number;
  referralViews: number;
  directViews: number;
  favoriteCount: number;
  shareCount: number;
  engagementRate: number;
  viralityScore: number;
}

export interface TimeOnMarketAnalytics {
  propertyId: string;
  daysOnMarket: number;
  daysToFirstRental: number | null;
  platformAverage: number;
  comparisonToAverage: number | null;
  status: TimeOnMarketStatus;
}

export type TimeOnMarketStatus = 'long' | 'medium' | 'short';

export interface PerformanceFilters {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  propertyType?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface ViewTrackingMetadata {
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  agentId?: string;
  sessionId?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  source?: 'organic' | 'referral' | 'direct' | 'social';
}

export interface PropertyViewEvent {
  eventId: string;
  propertyId: string;
  userId: string | null;
  timestamp: Date;
  metadata: ViewTrackingMetadata;
}