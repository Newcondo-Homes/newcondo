// backend/property-service/src/types/analytics.ts

export interface PropertyPerformanceMetrics {
  propertyId: string;
  propertyTitle: string;
  
  // View Metrics
  totalViews: number;
  uniqueViewers: number;
  viewTrend: {
    period: string; // 'daily', 'weekly', 'monthly'
    data: Array<{
      date: string;
      views: number;
    }>;
  };
  
  // Engagement Metrics
  averageTimeOnListing: number; // in seconds
  favoriteCount: number;
  shareCount: number;
  inquiryCount: number;
  
  // Conversion Metrics
  conversionRate: number; // percentage
  totalApplications: number;
  successfulRentals: number;
  
  // Revenue Metrics
  totalRevenue: number;
  averageRentalDuration: number; // in days
  occupancyRate: number; // percentage
  
  // Marketing Performance
  topReferralSources: Array<{
    source: string;
    views: number;
    conversions: number;
  }>;
  
  // Agent Performance (if applicable)
  listingAgent?: {
    id: string;
    name: string;
    totalPromotions: number;
    generatedViews: number;
  };
  subAgentPerformance?: Array<{
    agentId: string;
    agentName: string;
    promotionLink: string;
    views: number;
    conversions: number;
    earnedCommission: number;
  }>;
}

export interface PropertyComparisonMetrics {
  averageViewsInArea: number;
  averageRentInArea: number;
  averageDaysToRent: number;
  competitorCount: number;
  pricePosition: 'BELOW_MARKET' | 'AT_MARKET' | 'ABOVE_MARKET';
  suggestedPrice?: number;
}

export interface EarningsAnalytics {
  userId: string;
  userRole: 'OWNER' | 'AGENT';
  
  // Overall Earnings
  totalEarnings: number;
  pendingEarnings: number;
  availableForWithdrawal: number;
  
  // Period Breakdown
  earningsByPeriod: {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    data: Array<{
      date: string;
      amount: number;
      source: 'RENT' | 'COMMISSION' | 'MARKING_SERVICE';
    }>;
  };
  
  // Commission Details (for agents)
  commissionBreakdown?: {
    asListingAgent: number;
    asSubAgent: number;
    fromMarkingServices: number;
  };
  
  // Property Breakdown (for owners)
  earningsByProperty?: Array<{
    propertyId: string;
    propertyTitle: string;
    totalEarnings: number;
    activeRentals: number;
  }>;
  
  // Projections
  projectedMonthlyIncome: number;
  projectedYearlyIncome: number;
}

export interface AgentReferralAnalytics {
  agentId: string;
  agentName: string;
  
  // Referral Overview
  totalPropertiesPromoted: number;
  activePromotions: number;
  totalReferralLinks: number;
  
  // Performance Metrics
  totalViewsGenerated: number;
  totalConversions: number;
  conversionRate: number;
  
  // Earnings
  totalCommissionEarned: number;
  pendingCommission: number;
  averageCommissionPerConversion: number;
  
  // Top Performing Properties
  topProperties: Array<{
    propertyId: string;
    propertyTitle: string;
    views: number;
    conversions: number;
    commission: number;
  }>;
  
  // Referral Sources
  referralSourceBreakdown: Array<{
    source: string; // 'WhatsApp', 'Facebook', 'Direct', etc.
    clicks: number;
    conversions: number;
  }>;
}

export interface PropertyListingAnalytics {
  propertyId: string;
  
  // Time-based Analytics
  listingAge: number; // in days
  daysUntilFirstView: number;
  daysUntilFirstInquiry: number;
  daysUntilRented?: number;
  
  // Visitor Analytics
  visitorDemographics: {
    topCities: Array<{ city: string; count: number }>;
    topStates: Array<{ state: string; count: number }>;
    deviceTypes: Array<{ device: string; count: number }>;
  };
  
  // Search Performance
  searchAppearances: number;
  searchImpressions: number;
  searchClickThroughRate: number;
  topSearchKeywords: string[];
  
  // Competitive Analysis
  similarPropertiesCount: number;
  priceRanking: number; // position in price range
  viewsRanking: number; // compared to similar properties
  
  // Optimization Suggestions
  suggestions: Array<{
    type: 'PRICE' | 'IMAGES' | 'DESCRIPTION' | 'AMENITIES';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    expectedImpact?: string;
  }>;
}

export interface DashboardAnalytics {
  userId: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  
  // Summary
  totalProperties: number;
  activeListings: number;
  totalViews: number;
  totalRevenue: number;
  
  // Trends
  viewsTrend: Array<{ date: string; views: number }>;
  revenueTrend: Array<{ date: string; revenue: number }>;
  occupancyTrend: Array<{ date: string; rate: number }>;
  
  // Best Performers
  topPerformingProperties: Array<{
    propertyId: string;
    title: string;
    views: number;
    revenue: number;
  }>;
  
  // Alerts & Notifications
  alerts: Array<{
    type: 'VACANCY' | 'LOW_VIEWS' | 'PRICE_ALERT' | 'MAINTENANCE';
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
    propertyId?: string;
  }>;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface MetricComparison {
  current: number;
  previous: number;
  change: number; // percentage
  trend: 'UP' | 'DOWN' | 'STABLE';
}