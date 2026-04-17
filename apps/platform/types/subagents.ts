export interface SubAgent {
  id: string;
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentPhone?: string;
  agentImage?: string;
  propertyId: string;
  propertyTitle: string;
  status: 'PENDING' | 'APPROVED' | 'REVOKED';
  views: number;
  conversions: number;
  earnings: number;
  approvedAt?: string;
  createdAt: string;
}

export interface SubAgentsResponse {
  subAgents: SubAgent[];
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  revokedCount: number;
  totalEarnings: number;
  totalViews: number;
  totalConversions: number;
  page: number;
  totalPages: number;
}

export interface SubAgentPerformanceResponse {
  totalViews: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  propertiesPromoted: number;
  activePromotions: number;
  viewsByDay: { date: string; count: number }[];
  conversionsByDay: { date: string; count: number }[];
  earningsByMonth: { month: string; amount: number }[];
  performanceRank?: number;
  percentile?: number;
}


export interface SubAgentFilters {
  propertyId?: string;
  status?: 'PENDING' | 'APPROVED' | 'REVOKED';
  sortBy?: 'earnings' | 'views' | 'conversions' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PromotionLinkResponse {
  promotionLink: string;
  linkId: string;
}

export interface PromotionLinkStatsResponse {
  totalClicks: number;
  totalViews: number;
  totalConversions: number;
  conversionRate: number;
  totalEarnings: number;
  pendingEarnings: number;
  recentClicks: any[];
  recentConversions: any[];
  clicksByDay: any[];
  viewsByDay: any[];
  createdAt: string;
  isActive: boolean;
}

export interface PromotionSettingsResponse {
  allowPublicPromotion: boolean;
  allowPermissionBasedPromotion: boolean;
  requireApproval: boolean;
  commissionSplitPercentage: number;
}