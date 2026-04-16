import type {
  AggregatedAnalytics,
  PropertyPerformanceMetrics,
  TimeSeriesData,
  ComparisonData,
  ConversionFunnelData,
  GeographicDistribution,
  TopPropertyAnalytics,
  RecentActivityItem,
  ViewerDemographics,
  EarningsBreakdown,
  PerformanceSummary,
  BenchmarkComparison,
  PropertyInsights,
} from '@/types/analytics';

import type { AnalyticsTimePeriod } from '@/lib/constants/propertyManagement';
import type { MetricType, ComparisonPeriod, TimeAggregation } from '@/lib/constants/analytics';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  period?: 'day' | 'week' | 'month' | 'year' | 'all';
  metrics?: MetricType[];
  timePeriod?: AnalyticsTimePeriod;
  aggregation?: TimeAggregation;
  comparison?: ComparisonPeriod;
}

// ─── Per-property response ─────────────────────────────────────────────────

export interface PropertyAnalyticsSummary {
  totalViews: number;
  totalFavorites: number;
  totalShares: number;
  totalInquiries: number;
  avgViewDuration: number; // seconds
}

export interface PropertyAnalyticsResponse {
  analytics: PropertyAnalyticsSummary;
  views: TimeSeriesData;
  favorites: TimeSeriesData;
  shares: TimeSeriesData;
  conversionRate: number;
  trends: {
    views: 'up' | 'down' | 'stable';
    favorites: 'up' | 'down' | 'stable';
  };
  comparison: ComparisonData[];
  performance: PropertyPerformanceMetrics;
  funnel: ConversionFunnelData;
  demographics: ViewerDemographics;
  insights: PropertyInsights;
  benchmark: BenchmarkComparison[];
}

// ─── Portfolio response ────────────────────────────────────────────────────

export interface PortfolioAnalyticsResponse {
  portfolioStats: AggregatedAnalytics;
  topPerformers: TopPropertyAnalytics[];
  underPerformers: TopPropertyAnalytics[];
  totalViews: number;
  totalProperties: number;
  avgViewsPerProperty: number;
  recentActivity: RecentActivityItem[];
  earnings: EarningsBreakdown;
  geographic: GeographicDistribution[];
  performanceSummary: PerformanceSummary;
}