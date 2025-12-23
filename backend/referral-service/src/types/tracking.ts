// backend/referral-service/src/types/tracking.ts

import { ReferralClick } from '@newcondo/db';

export interface CreateClickDTO {
  referralCode: string;
  ipAddress?: string;
  userAgent?: string;
  referrerUrl?: string;
  landingPage?: string;
  sessionId?: string;
  country?: string;
  city?: string;
}

export interface ClickAnalytics {
  totalClicks: number;
  uniqueClicks: number;
  conversionRate: number;
  clicksByChannel: Record<string, number>;
  clicksByCountry: Record<string, number>;
  clicksByDate: Array<{ date: string; clicks: number }>;
  topReferrers: Array<{
    referralCode: string;
    clicks: number;
    conversions: number;
  }>;
}

export interface ConversionDTO {
  referralCode: string;
  convertedUserId: string;
  sessionId?: string;
  ipAddress?: string;
}

export interface TrackingSessionDTO {
  sessionId: string;
  referralCode: string;
  startTime: Date;
  lastActivity: Date;
  events: Array<{
    type: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }>;
}

export interface AttributionData {
  referralCode: string;
  clickId: string;
  clickedAt: Date;
  convertedAt?: Date;
  conversionValue?: number;
  attributionWindow: number; // days
  isWithinWindow: boolean;
}

export interface ReferralPerformanceMetrics {
  referralCode: string;
  clicks: {
    total: number;
    unique: number;
    byChannel: Record<string, number>;
  };
  conversions: {
    total: number;
    rate: number;
    totalValue: number;
  };
  rewards: {
    earned: number;
    pending: number;
    paid: number;
  };
  timeline: Array<{
    date: string;
    clicks: number;
    conversions: number;
  }>;
}

export interface FraudDetectionResult {
  isSuspicious: boolean;
  riskScore: number; // 0-100
  flags: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  recommendation: 'allow' | 'review' | 'block';
}

export interface ClickHeatmapData {
  hour: number;
  day: number;
  clicks: number;
}

export interface GeographicDistribution {
  country: string;
  city?: string;
  clicks: number;
  conversions: number;
  percentage: number;
}