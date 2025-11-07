// apps/admin/src/types/userManagement.ts

/**
 * User overview
 */
export interface UserOverview {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: 'OWNER' | 'AGENT' | 'RENTER' | 'ADMIN';
  userType?: 'LANDLORD' | 'PROPERTY_MANAGER' | 'AGENT' | 'RENTER' | 'ADMIN';
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isPremium: boolean;
  registrationDate: string;
  lastActive?: string;
  status: 'active' | 'inactive' | 'suspended' | 'banned';
}

/**
 * Detailed user profile
 */
export interface UserProfile extends UserOverview {
  image?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  
  // B2B specific
  isB2BCustomer: boolean;
  companyName?: string;
  businessRegNumber?: string;
  
  // Agent specific
  isAvailableForMarking: boolean;
  agentServiceAreas: string[];
  agentReliabilityScore?: number;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  
  // Premium
  premiumExpiresAt?: string;
  
  // Referral
  referralCode: string;
  
  // Verification
  verifiedAt?: string;
  verifiedBy?: string;
  verificationRejectionReason?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * User statistics
 */
export interface UserStatistics {
  userId: string;
  propertiesListed: number;
  propertiesRented: number;
  totalTransactions: number;
  totalSpent: number;
  totalEarned: number;
  averageRating?: number;
  reviewCount: number;
  referralsCount: number;
  loginCount: number;
  lastLoginDate?: string;
}

/**
 * User activity log
 */
export interface UserActivityLog {
  activityId: string;
  userId: string;
  type: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * User verification details
 */
export interface UserVerificationDetails {
  userId: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documents: Array<{
    documentId: string;
    documentType: string;
    documentNumber?: string;
    fileUrl?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    uploadedAt: string;
    verifiedAt?: string;
    rejectionReason?: string;
  }>;
  verificationNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

/**
 * User permissions
 */
export interface UserPermissions {
  userId: string;
  role: string;
  permissions: string[];
  customPermissions?: string[];
  restrictedActions?: string[];
}

/**
 * User engagement metrics
 */
export interface UserEngagementMetrics {
  userId: string;
  sessionCount: number;
  averageSessionDuration: number;
  lastSessionDate?: string;
  propertyViews: number;
  searchQueries: number;
  favoriteProperties: number;
  contactsInitiated: number;
  engagementScore: number;
}

/**
 * User notification preferences
 */
export interface UserNotificationPreferences {
  userId: string;
  emailNotifications: {
    marketing: boolean;
    transactional: boolean;
    propertyUpdates: boolean;
    paymentReminders: boolean;
    systemAlerts: boolean;
  };
  smsNotifications: {
    transactional: boolean;
    paymentReminders: boolean;
    securityAlerts: boolean;
  };
  pushNotifications: {
    enabled: boolean;
    propertyUpdates: boolean;
    messages: boolean;
    systemAlerts: boolean;
  };
}

/**
 * User financial summary
 */
export interface UserFinancialSummary {
  userId: string;
  totalRevenue: number;
  totalExpenses: number;
  netBalance: number;
  pendingPayments: number;
  completedTransactions: number;
  failedTransactions: number;
  refunds: number;
  commissions: {
    earned: number;
    paid: number;
    pending: number;
  };
  virtualAccount?: {
    accountNumber: string;
    balance: number;
    heldFunds: number;
  };
}

/**
 * User search filters
 */
export interface UserSearchFilters {
  searchTerm?: string;
  role?: 'OWNER' | 'AGENT' | 'RENTER' | 'ADMIN';
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isPremium?: boolean;
  isActive?: boolean;
  state?: string;
  city?: string;
  registeredAfter?: string;
  registeredBefore?: string;
  minReliabilityScore?: number;
  sortBy?: 'name' | 'registrationDate' | 'lastActive' | 'totalTransactions';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * User bulk action
 */
export interface UserBulkAction {
  action: 'verify' | 'reject' | 'suspend' | 'activate' | 'delete' | 'export' | 'notify';
  userIds: string[];
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * User growth analytics
 */
export interface UserGrowthAnalytics {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  growthRate: number;
  retentionRate: number;
  churnRate: number;
  usersByRole: Array<{
    role: string;
    count: number;
    percentage: number;
    growth: number;
  }>;
  usersByLocation: Array<{
    state: string;
    count: number;
    percentage: number;
  }>;
  registrationTrend: Array<{
    period: string;
    count: number;
  }>;
}

/**
 * User cohort data
 */
export interface UserCohortData {
  cohortDate: string;
  cohortSize: number;
  activeUsers: Array<{
    period: number;
    count: number;
    percentage: number;
  }>;
  revenue: Array<{
    period: number;
    amount: number;
  }>;
}

/**
 * User segment
 */
export interface UserSegment {
  segmentId: string;
  name: string;
  description?: string;
  criteria: {
    role?: string[];
    verificationStatus?: string[];
    isPremium?: boolean;
    minTransactions?: number;
    minRevenue?: number;
    registeredAfter?: string;
    locations?: string[];
  };
  userCount: number;
  createdAt: string;
}

/**
 * User action history
 */
export interface UserActionHistory {
  actionId: string;
  userId: string;
  performedBy: string;
  performedByName: string;
  action: string;
  description: string;
  previousValue?: any;
  newValue?: any;
  timestamp: string;
}

/**
 * User risk assessment
 */
export interface UserRiskAssessment {
  userId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  recommendations: string[];
  lastAssessed: string;
}

/**
 * User support tickets summary
 */
export interface UserSupportSummary {
  userId: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  lastTicketDate?: string;
  commonIssues: Array<{
    category: string;
    count: number;
  }>;
}

/**
 * User retention analysis
 */
export interface UserRetentionAnalysis {
  cohort: string;
  initialUsers: number;
  retentionByPeriod: Array<{
    period: number;
    retainedUsers: number;
    retentionRate: number;
  }>;
  averageRetentionRate: number;
  churnByPeriod: Array<{
    period: number;
    churnedUsers: number;
    churnRate: number;
  }>;
}

/**
 * User lifetime value
 */
export interface UserLifetimeValue {
  userId: string;
  lifetimeRevenue: number;
  lifetimeProfitability: number;
  averageOrderValue: number;
  purchaseFrequency: number;
  customerLifespan: number;
  projectedLifetimeValue: number;
}

/**
 * Admin action on user
 */
export interface AdminUserAction {
  actionType: 'VERIFY' | 'REJECT' | 'SUSPEND' | 'ACTIVATE' | 'DELETE' | 'UPDATE_ROLE' | 'RESET_PASSWORD';
  userId: string;
  adminId: string;
  reason?: string;
  notes?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * User export options
 */
export interface UserExportOptions {
  format: 'csv' | 'excel' | 'json';
  filters: UserSearchFilters;
  fields: string[];
  includeStatistics: boolean;
  includeTransactions: boolean;
}