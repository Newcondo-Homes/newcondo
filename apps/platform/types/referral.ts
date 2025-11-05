// apps/platform/types/referral.ts

import type { AnalyticsTimePeriod } from '@/lib/constants/propertyManagement';

/**
 * Referral Types
 * Type definitions for agent referral tracking and sub-agent management
 */

// Agent referral tracking record
export interface AgentReferral {
  id: string;
  propertyId: string;
  listingAgentId: string;
  subAgentId: string;
  
  // Property details
  propertyTitle: string;
  propertyAddress: string;
  propertyImage?: string;
  rentAmount: number;
  
  // Agent details
  listingAgentName: string;
  subAgentName: string;
  subAgentEmail: string;
  subAgentPhone?: string;
  
  // Tracking data
  uniqueLink: string;
  linkClicks: number;
  uniqueVisitors: number;
  propertyViews: number;
  inquiries: number;
  applications: number;
  successfulRentals: number;
  
  // Financial data
  totalRevenue: number;
  commissionEarned: number;
  
  // Status
  status: 'active' | 'paused' | 'expired';
  isApproved: boolean;
  
  // Timestamps
  createdAt: Date;
  expiresAt?: Date;
  lastActivityAt?: Date;
  updatedAt: Date;
}

// Sub-agent details
export interface SubAgent {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  
  // Performance metrics
  totalPromotions: number;
  activePromotions: number;
  successfulReferrals: number;
  totalRevenue: number;
  totalCommission: number;
  conversionRate: number;
  
  // Rating and reliability
  rating?: number;
  reviewCount: number;
  reliabilityScore?: number;
  
  // Status
  isVerified: boolean;
  isActive: boolean;
  
  // Timestamps
  joinedAt: Date;
  lastActiveAt?: Date;
}

// Property promotion request
export interface PropertyPromotionRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyOwnerId: string;
  propertyOwnerName: string;
  agentId: string;
  agentName: string;
  agentEmail: string;
  
  // Request details
  message?: string;
  proposedStrategy?: string;
  expectedReach?: number;
  
  // Status
  status: 'pending' | 'approved' | 'rejected';
  respondedAt?: Date;
  rejectionReason?: string;
  
  // Timestamps
  requestedAt: Date;
  updatedAt: Date;
}

// Referral link details
export interface ReferralLinkDetails {
  id: string;
  propertyId: string;
  agentId: string;
  uniqueCode: string;
  fullUrl: string;
  shortUrl?: string;
  qrCodeUrl?: string;
  
  // Tracking
  isActive: boolean;
  expiresAt?: Date;
  
  // Analytics
  totalClicks: number;
  uniqueClicks: number;
  conversionCount: number;
  lastClickedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Referral activity log
export interface ReferralActivityLog {
  id: string;
  referralId: string;
  activityType: 'click' | 'view' | 'inquiry' | 'application' | 'rental' | 'share';
  propertyId: string;
  agentId: string;
  
  // User details (if available)
  userId?: string;
  userEmail?: string;
  userName?: string;
  
  // Activity metadata
  source?: string; // 'whatsapp', 'facebook', 'direct', etc.
  device?: string;
  location?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Timestamps
  timestamp: Date;
}

// Referral statistics
export interface ReferralStatistics {
  agentId: string;
  timePeriod: AnalyticsTimePeriod;
  
  // Overview
  totalReferrals: number;
  activeReferrals: number;
  totalClicks: number;
  uniqueVisitors: number;
  totalViews: number;
  
  // Conversions
  inquiries: number;
  applications: number;
  successfulRentals: number;
  conversionRate: number;
  
  // Financial
  totalRevenue: number;
  totalCommissionEarned: number;
  averageCommissionPerRental: number;
  
  // Top performers
  topProperty?: {
    propertyId: string;
    propertyTitle: string;
    clicks: number;
    conversions: number;
  };
  
  // Trends
  clicksTrend: 'up' | 'down' | 'stable';
  conversionTrend: 'up' | 'down' | 'stable';
  
  // By property
  byProperty: {
    propertyId: string;
    propertyTitle: string;
    clicks: number;
    views: number;
    conversions: number;
    revenue: number;
    commission: number;
  }[];
}

// Sub-agent performance comparison
export interface SubAgentPerformance {
  agentId: string;
  agentName: string;
  
  // Metrics
  totalPromotions: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
  totalCommission: number;
  
  // Ranking
  rank: number;
  percentile: number;
  
  // Performance indicator
  performanceLevel: 'excellent' | 'good' | 'average' | 'poor';
}

// Referral dashboard data
export interface ReferralDashboard {
  statistics: ReferralStatistics;
  recentActivity: ReferralActivityLog[];
  activeReferrals: AgentReferral[];
  topPerformingLinks: ReferralLinkDetails[];
  pendingRequests: PropertyPromotionRequest[];
  subAgentPerformance: SubAgentPerformance[];
}

// Referral filters
export interface ReferralFilters {
  startDate?: Date;
  endDate?: Date;
  propertyIds?: string[];
  status?: ('active' | 'paused' | 'expired')[];
  minClicks?: number;
  minConversions?: number;
  agentIds?: string[];
  searchQuery?: string;
}

// Referral link creation payload
export interface CreateReferralLinkPayload {
  propertyId: string;
  agentId: string;
  expiresAt?: Date;
  customCode?: string;
}

// Promotion approval payload
export interface PromotionApprovalPayload {
  requestId: string;
  approved: boolean;
  rejectionReason?: string;
  notes?: string;
}

// Referral share options
export interface ReferralShareOptions {
  platform: 'whatsapp' | 'facebook' | 'twitter' | 'instagram' | 'email' | 'sms' | 'copy';
  referralLink: string;
  propertyTitle: string;
  propertyImage?: string;
  customMessage?: string;
}

// Referral notification
export interface ReferralNotification {
  id: string;
  agentId: string;
  type: 'new_click' | 'new_inquiry' | 'new_application' | 'successful_rental' | 'commission_earned' | 'request_approved' | 'request_rejected';
  title: string;
  message: string;
  propertyId?: string;
  amount?: number;
  read: boolean;
  createdAt: Date;
}

// Click tracking data
export interface ClickTrackingData {
  referralLinkId: string;
  clickedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
  source?: string;
  device?: string;
  location?: {
    country?: string;
    state?: string;
    city?: string;
  };
}

// Conversion tracking data
export interface ConversionTrackingData {
  referralId: string;
  conversionType: 'view' | 'inquiry' | 'application' | 'rental';
  propertyId: string;
  agentId: string;
  userId?: string;
  value?: number; // Monetary value if applicable
  metadata?: Record<string, any>;
  convertedAt: Date;
}

// Referral commission breakdown
export interface ReferralCommissionBreakdown {
  referralId: string;
  propertyId: string;
  propertyTitle: string;
  rentAmount: number;
  
  // Commission split
  totalCommission: number;
  listingAgentCommission: number;
  subAgentCommission: number;
  
  // Payment status
  status: 'pending' | 'held' | 'released' | 'paid';
  releaseDate?: Date;
  paidAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Referral API responses
export interface ReferralApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Referral context type
export interface ReferralContextType {
  referrals: AgentReferral[];
  statistics: ReferralStatistics | null;
  pendingRequests: PropertyPromotionRequest[];
  loading: boolean;
  error: string | null;
  fetchReferrals: (filters?: ReferralFilters) => Promise<void>;
  createReferralLink: (payload: CreateReferralLinkPayload) => Promise<ReferralLinkDetails>;
  requestPromotion: (propertyId: string, message?: string) => Promise<void>;
  trackClick: (linkId: string, data: ClickTrackingData) => Promise<void>;
  refreshData: () => Promise<void>;
}

// Referral leaderboard entry
export interface ReferralLeaderboardEntry {
  rank: number;
  agentId: string;
  agentName: string;
  agentImage?: string;
  totalReferrals: number;
  successfulConversions: number;
  totalRevenue: number;
  conversionRate: number;
  badge?: 'gold' | 'silver' | 'bronze';
}

// Referral insights
export interface ReferralInsights {
  agentId: string;
  timePeriod: AnalyticsTimePeriod;
  insights: {
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    metric?: string;
    value?: number;
    recommendation?: string;
  }[];
  lastGenerated: Date;
}

// Export all types
export type {
  AnalyticsTimePeriod,
};