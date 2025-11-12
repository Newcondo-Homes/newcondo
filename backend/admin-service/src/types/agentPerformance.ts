export interface AgentOverview {
  totalAgents: number;
  activeAgents: number;
  topPerformers: TopPerformer[];
  averageListingsPerAgent: number;
  averageCommissionPerAgent: number;
  totalCommissionsPaid: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface TopPerformer {
  id: string;
  name: string | null;
  email: string;
  agentReliabilityScore: number | null;
  totalCommissions: number;
}

export interface AgentPerformance {
  agent: {
    id: string;
    name: string | null;
    email: string;
    reliabilityScore: number | null;
  };
  performance: {
    listingsCount: number;
    totalCommissions: number;
    totalRentals: number;
    averagePropertyPrice: number;
    conversionRate: number;
    markingJobStats: {
      total: number;
      completed: number;
      cancelled: number;
      successRate: number;
    };
  };
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface TopAgents {
  topAgents: any[];
  metric: 'revenue' | 'listings' | 'rentals' | 'markings';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface AgentListingStats {
  totalListings: number;
  activeListings: number;
  rentedListings: number;
  averageTimeToRent: number;
  successRate: number;
  listingsByStatus: {
    status: string;
    _count: number;
  }[];
  listingsByType: {
    propertyType: string;
    _count: number;
  }[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface AgentMarkingPerformance {
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  completionRate: number;
  averageCompletionTime: number;
  totalEarnings: number;
  jobsByStatus: {
    status: string;
    _count: number;
  }[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface AgentCommissions {
  commissions: {
    id: string;
    amount: number;
    agentCommission: number;
    createdAt: Date;
    rental: {
      property: {
        id: string;
        title: string;
        address: string;
      };
    } | null;
  }[];
  totalAmount: number;
  averageCommission: number;
  count: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface AgentReliabilityScore {
  overallScore: number;
  components: {
    completionRate: number;
    averageResponseTime: number;
    customerRating: number;
    verificationSuccessRate: number;
  };
  jobStats: {
    total: number;
    completed: number;
  };
}

export interface AgentReferralPerformance {
  totalReferrals: number;
  activeReferrals: number;
  totalRewards: number;
  referrals: {
    id: string;
    referralCode: string;
    isActive: boolean;
    reward: number | null;
    rewardPaid: boolean;
    createdAt: Date;
    referred: {
      id: string;
      name: string | null;
      email: string;
      role: string;
      verificationStatus: string;
    };
  }[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface AgentComparison {
  comparisons: {
    agent: {
      id: string;
      name: string | null;
      email: string;
      agentReliabilityScore: number | null;
    } | null;
    metrics: {
      listings: number;
      totalCommissions: number;
      completedMarkingJobs: number;
    };
  }[];
  rankings: {
    byCommissions: any[];
    byListings: any[];
    byMarkingJobs: any[];
  };
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}