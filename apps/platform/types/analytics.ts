// apps/platform/types/analytics.ts

import type {
  MetricType,
  ChartType,
  TimeAggregation,
  ComparisonPeriod,
  PerformanceIndicator,
  DashboardWidget,
  EventType,
  FunnelStage,
} from '@/lib/constants/analytics';
import type { AnalyticsTimePeriod } from '@/lib/constants/propertyManagement';

/**
 * Analytics Types
 * Type definitions for property analytics and performance tracking
 */

// Base metric data point
export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

// Time series data
export interface TimeSeriesData {
  metric: MetricType;
  data: MetricDataPoint[];
  aggregation: TimeAggregation;
  total: number;
  average: number;
  peak: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange?: number;
}

// Comparison data
export interface ComparisonData {
  current: TimeSeriesData;
  previous: TimeSeriesData;
  comparisonPeriod: ComparisonPeriod;
  percentageChange: number;
  absoluteChange: number;
}

// Property performance metrics
export interface PropertyPerformanceMetrics {
  propertyId: string;
  propertyTitle: string;
  views: number;
  uniqueViewers: number;
  favorites: number;
  shares: number;
  inquiries: number;
  applications: number;
  conversionRate: number;
  earnings: number;
  performanceIndicator: PerformanceIndicator;
  lastUpdated: Date;
}

// Aggregated analytics
export interface AggregatedAnalytics {
  timePeriod: AnalyticsTimePeriod;
  totalViews: number;
  totalUniqueViewers: number;
  totalFavorites: number;
  totalShares: number;
  totalInquiries: number;
  totalApplications: number;
  totalEarnings: number;
  averageConversionRate: number;
  topPerformingProperty?: string;
  viewsByDay: MetricDataPoint[];
  earningsByDay: MetricDataPoint[];
}

// Conversion funnel data
export interface ConversionFunnelData {
  propertyId?: string;
  stages: {
    stage: FunnelStage;
    count: number;
    percentage: number;
    dropoffRate?: number;
  }[];
  totalViews: number;
  totalConversions: number;
  overallConversionRate: number;
}

// Geographic distribution
export interface GeographicDistribution {
  state: string;
  city?: string;
  views: number;
  applications: number;
  percentage: number;
}

// Top property analytics
export interface TopPropertyAnalytics {
  propertyId: string;
  propertyTitle: string;
  propertyImage?: string;
  rank: number;
  metric: MetricType;
  value: number;
  percentageOfTotal: number;
}

// Recent activity item
export interface RecentActivityItem {
  id: string;
  type: EventType;
  propertyId: string;
  propertyTitle: string;
  userId?: string;
  userName?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Analytics dashboard widget data
export interface WidgetData {
  widget: DashboardWidget;
  title: string;
  data: any;
  loading: boolean;
  error?: string;
  lastUpdated?: Date;
}

// Analytics filter options
export interface AnalyticsFilters {
  timePeriod: AnalyticsTimePeriod;
  propertyIds?: string[];
  cities?: string[];
  states?: string[];
  metrics?: MetricType[];
  comparisonPeriod?: ComparisonPeriod;
  aggregation?: TimeAggregation;
}

// Analytics export options
export interface AnalyticsExportOptions {
  format: 'csv' | 'pdf' | 'excel' | 'json';
  timePeriod: AnalyticsTimePeriod;
  metrics: MetricType[];
  propertyIds?: string[];
  includeCharts: boolean;
  includeComparison: boolean;
}

// Chart configuration
export interface ChartConfiguration {
  type: ChartType;
  data: any[];
  xAxis?: string;
  yAxis?: string;
  colors?: string[];
  labels?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  height?: number;
  width?: number;
}

// Performance summary
export interface PerformanceSummary {
  propertyId?: string;
  timePeriod: AnalyticsTimePeriod;
  overallPerformance: PerformanceIndicator;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  score: number; // 0-100
}

// Earnings breakdown
export interface EarningsBreakdown {
  propertyId?: string;
  timePeriod: AnalyticsTimePeriod;
  totalEarnings: number;
  rentIncome: number;
  commissionEarned: number;
  referralIncome: number;
  byProperty: {
    propertyId: string;
    propertyTitle: string;
    earnings: number;
    percentage: number;
  }[];
  byMonth: {
    month: string;
    earnings: number;
  }[];
}

// Viewer demographics
export interface ViewerDemographics {
  propertyId?: string;
  timePeriod: AnalyticsTimePeriod;
  totalViewers: number;
  byLocation: GeographicDistribution[];
  byDevice: {
    device: 'mobile' | 'desktop' | 'tablet';
    count: number;
    percentage: number;
  }[];
  byTimeOfDay: {
    hour: number;
    count: number;
  }[];
}

// Analytics API response
export interface AnalyticsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    cached: boolean;
    cacheExpiry?: Date;
    generatedAt: Date;
  };
}

// Analytics query parameters
export interface AnalyticsQueryParams {
  propertyId?: string;
  startDate?: string;
  endDate?: string;
  timePeriod?: AnalyticsTimePeriod;
  metrics?: MetricType[];
  aggregation?: TimeAggregation;
  comparison?: ComparisonPeriod;
  limit?: number;
  offset?: number;
}

// Real-time analytics update
export interface RealTimeAnalyticsUpdate {
  propertyId: string;
  metric: MetricType;
  value: number;
  change: number;
  timestamp: Date;
}

// Analytics context type
export interface AnalyticsContextType {
  analytics: AggregatedAnalytics | null;
  propertyPerformance: PropertyPerformanceMetrics[];
  loading: boolean;
  error: string | null;
  filters: AnalyticsFilters;
  fetchAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  exportAnalytics: (options: AnalyticsExportOptions) => Promise<void>;
  setFilters: (filters: AnalyticsFilters) => void;
}

// Analytics event tracking
export interface AnalyticsEvent {
  eventType: EventType;
  propertyId: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  metadata?: {
    source?: string;
    referrer?: string;
    device?: string;
    location?: string;
    [key: string]: any;
  };
}

// Property insights
export interface PropertyInsights {
  propertyId: string;
  timePeriod: AnalyticsTimePeriod;
  insights: {
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    metric?: MetricType;
    value?: number;
    action?: string;
  }[];
  lastGenerated: Date;
}

// Benchmark comparison
export interface BenchmarkComparison {
  propertyId: string;
  metric: MetricType;
  value: number;
  platformAverage: number;
  categoryAverage: number;
  topPerformerValue: number;
  percentile: number;
  performanceLevel: PerformanceIndicator;
}

// Export all types
export type {
  MetricType,
  ChartType,
  TimeAggregation,
  ComparisonPeriod,
  PerformanceIndicator,
  DashboardWidget,
  EventType,
  FunnelStage,
  AnalyticsTimePeriod,
};