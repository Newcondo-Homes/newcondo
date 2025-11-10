export interface KPIValue {
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  target?: number;
  status?: 'on-track' | 'needs-attention' | 'critical';
  unit?: string;
  currency?: string;
  description?: string;
}

export interface UserKPIs {
  totalUsers: KPIValue;
  newUsers: KPIValue;
  activeUsers: KPIValue;
  verificationRate: KPIValue;
  retentionRate: KPIValue;
  churnRate: KPIValue;
  usersByRole: Record<string, number>;
}

export interface PropertyKPIs {
  totalProperties: KPIValue;
  newListings: KPIValue;
  publishedProperties: KPIValue;
  rentedProperties: KPIValue;
  occupancyRate: KPIValue;
  avgTimeToRent: KPIValue;
  listingQualityScore: KPIValue;
}

export interface RevenueKPIs {
  totalRevenue: KPIValue;
  platformFees: KPIValue;
  transactionCount: KPIValue;
  avgTransactionValue: KPIValue;
  mrr: KPIValue;
  arpu: KPIValue;
  ltv: KPIValue;
}

export interface EngagementKPIs {
  propertyViews: KPIValue;
  searches: KPIValue;
  favorites: KPIValue;
  dau: KPIValue;
  mau: KPIValue;
  dauMauRatio: KPIValue;
  avgSessionDuration: KPIValue;
}

export interface ConversionKPIs {
  signupConversion: KPIValue;
  verificationConversion: KPIValue;
  listingConversion: KPIValue;
  rentalConversion: KPIValue;
  paymentConversion: KPIValue;
}

export interface MarkingServiceKPIs {
  totalJobs: KPIValue;
  completedJobs: KPIValue;
  pendingJobs: KPIValue;
  completionRate: KPIValue;
  avgCompletionTime: KPIValue;
  agentUtilization: KPIValue;
  revenue: KPIValue;
}

export interface AllKPIs {
  period: {
    startDate: Date;
    endDate: Date;
  };
  comparisonPeriod?: {
    startDate: Date;
    endDate: Date;
  };
  users: UserKPIs;
  properties: PropertyKPIs;
  revenue: RevenueKPIs;
  engagement: EngagementKPIs;
  conversions: ConversionKPIs;
  timestamp: Date;
}