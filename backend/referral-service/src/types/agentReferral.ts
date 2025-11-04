// backend/referral-service/src/types/agentReferral.ts

export interface ReferralDashboard {
  summary: {
    totalReferrals: number;
    activeReferrals: number;
    totalClicks: number;
    uniqueClicks: number;
    totalConversions: number;
    totalEarnings: string;
    conversionRate: string;
  };
  recentActivity: {
    clicks: RecentClick[];
    conversions: RecentConversion[];
  };
}

export interface RecentClick {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string | null;
  ipAddress: string | null;
  country: string | null;
  city: string | null;
  createdAt: string;
}

export interface RecentConversion {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string | null;
  amount: string;
  commission: string;
  isPaid: boolean;
  createdAt: string;
}

export interface PropertyReferralTracking {
  referral: {
    id: string;
    referralCode: string;
    referralLink: string;
    clicks: number;
    uniqueClicks: number;
    conversions: number;
    totalEarnings: string;
    isActive: boolean;
    createdAt: string;
  };
  property: {
    id: string;
    title: string;
    address: string;
    image: string | null;
  };
  recentClicks: Array<{
    id: string;
    ipAddress: string | null;
    country: string | null;
    city: string | null;
    referrerUrl: string | null;
    createdAt: string;
  }>;
  recentConversions: Array<{
    id: string;
    amount: string;
    commission: string;
    isPaid: boolean;
    paidAt: string | null;
    createdAt: string;
  }>;
}

export interface ReferralAnalytics {
  summary: {
    totalClicks: number;
    uniqueClicks: number;
    totalConversions: number;
    totalEarnings: string;
    conversionRate: string;
  };
  clicksOverTime: Array<{
    date: string;
    count: number;
  }>;
  conversionsOverTime: Array<{
    date: string;
    count: number;
    amount: string;
    commission: string;
  }>;
}

export interface ReferralPerformanceItem {
  referralId: string;
  property: {
    id: string;
    title: string;
    address: string;
    price: string | null;
    image: string | null;
  };
  metrics: {
    clicks: number;
    uniqueClicks: number;
    conversions: number;
    conversionRate: string;
    totalEarnings: string;
  };
  referralCode: string;
  referralLink: string;
  isActive: boolean;
  createdAt: string;
}

export interface ReferralPerformanceResponse {
  properties: ReferralPerformanceItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface TopPerformingReferral {
  referralId: string;
  property: {
    id: string;
    title: string;
    address: string;
    image: string | null;
  };
  metrics: {
    clicks: number;
    conversions: number;
    conversionRate: string;
    totalEarnings: string;
  };
  referralLink: string;
}

export interface ReferralEarning {
  id: string;
  property: {
    id: string;
    title: string;
    address: string;
    image: string | null;
  };
  amount: string;
  commission: string;
  isPaid: boolean;
  paidAt: string | null;
  paymentStatus: string;
  createdAt: string;
}

export interface ReferralEarningsResponse {
  earnings: ReferralEarning[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface TrackReferralClickData {
  referralCode: string;
  propertyId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TrackReferralConversionData {
  referralCode: string;
  propertyId: string;
  paymentId: string;
  amount: number;
}