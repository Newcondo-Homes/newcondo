// apps/admin/src/types/agentPerformance.ts

/**
 * Agent performance overview
 */
export interface AgentPerformanceOverview {
  agentId: string;
  agentName: string;
  email: string;
  phone?: string;
  performanceScore: number;
  reliabilityScore?: number;
  rank: number;
  totalAgents: number;
  status: 'active' | 'inactive' | 'suspended';
  joinedDate: string;
  lastActive?: string;
}

/**
 * Agent detailed performance
 */
export interface AgentDetailedPerformance extends AgentPerformanceOverview {
  listingMetrics: {
    totalListings: number;
    activeListings: number;
    rentedProperties: number;
    avgTimeToRent: number;
    listingSuccessRate: number;
  };
  
  markingJobMetrics: {
    totalJobs: number;
    completedJobs: number;
    inProgressJobs: number;
    cancelledJobs: number;
    completionRate: number;
    avgCompletionTime: number;
    onTimeCompletionRate: number;
  };
  
  commissionMetrics: {
    totalEarned: number;
    listingCommission: number;
    subAgentCommission: number;
    markingCommission: number;
    paid: number;
    pending: number;
    unpaid: number;
  };
  
  responseMetrics: {
    averageResponseTime: number;
    responseRate: number;
    firstResponseTime: number;
  };
  
  ratingMetrics: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
  
  activityMetrics: {
    propertiesViewed: number;
    searchesPerformed: number;
    messagesReceived: number;
    messagesSent: number;
    lastActivityDate?: string;
  };
}

/**
 * Agent performance score breakdown
 */
export interface AgentPerformanceScoreBreakdown {
  agentId: string;
  totalScore: number;
  components: {
    listingPerformance: {
      score: number;
      weight: number;
      factors: {
        successRate: number;
        timeToRent: number;
        propertyQuality: number;
      };
    };
    markingJobPerformance: {
      score: number;
      weight: number;
      factors: {
        completionRate: number;
        avgCompletionTime: number;
        qualityRating: number;
      };
    };
    customerSatisfaction: {
      score: number;
      weight: number;
      factors: {
        averageRating: number;
        reviewCount: number;
        complaintRate: number;
      };
    };
    responsiveness: {
      score: number;
      weight: number;
      factors: {
        responseTime: number;
        responseRate: number;
        availability: number;
      };
    };
    reliability: {
      score: number;
      weight: number;
      factors: {
        onTimeRate: number;
        cancellationRate: number;
        disputeRate: number;
      };
    };
  };
  lastCalculated: string;
}

/**
 * Agent commission breakdown
 */
export interface AgentCommissionBreakdown {
  agentId: string;
  agentName: string;
  period: string;
  
  listingCommissions: Array<{
    propertyId: string;
    propertyTitle: string;
    rentalAmount: number;
    commissionAmount: number;
    commissionPercentage: number;
    transactionDate: string;
    status: 'HELD' | 'RELEASED' | 'PAID';
  }>;
  
  subAgentCommissions: Array<{
    propertyId: string;
    propertyTitle: string;
    listingAgentId: string;
    listingAgentName: string;
    rentalAmount: number;
    commissionAmount: number;
    commissionPercentage: number;
    transactionDate: string;
    status: 'HELD' | 'RELEASED' | 'PAID';
  }>;
  
  markingCommissions: Array<{
    markingJobId: string;
    propertyId: string;
    markingFee: number;
    commissionAmount: number;
    commissionPercentage: number;
    completionDate: string;
    status: 'HELD' | 'RELEASED' | 'PAID';
  }>;
  
  summary: {
    totalEarned: number;
    totalPaid: number;
    totalPending: number;
    totalHeld: number;
    transactionCount: number;
  };
}

/**
 * Agent listing performance
 */
export interface AgentListingPerformance {
  agentId: string;
  totalListings: number;
  activeListings: number;
  rentedProperties: number;
  expiredListings: number;
  
  performanceByPropertyType: Array<{
    type: string;
    count: number;
    rentedCount: number;
    successRate: number;
    avgTimeToRent: number;
  }>;
  
  performanceByLocation: Array<{
    state: string;
    city?: string;
    count: number;
    rentedCount: number;
    successRate: number;
  }>;
  
  priceRangePerformance: Array<{
    range: string;
    count: number;
    rentedCount: number;
    successRate: number;
  }>;
  
  timeMetrics: {
    avgTimeToRent: number;
    medianTimeToRent: number;
    fastestRental: number;
    slowestRental: number;
  };
}

/**
 * Agent marking job performance
 */
export interface AgentMarkingJobPerformance {
  agentId: string;
  totalJobs: number;
  completedJobs: number;
  inProgressJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  
  completionMetrics: {
    completionRate: number;
    avgCompletionTime: number;
    medianCompletionTime: number;
    fastestCompletion: number;
    slowestCompletion: number;
    onTimeRate: number;
  };
  
  qualityMetrics: {
    averageRating: number;
    acceptanceRate: number;
    revisionRate: number;
    complaintRate: number;
  };
  
  jobsByUrgency: Array<{
    urgency: string;
    count: number;
    completedCount: number;
    avgCompletionTime: number;
  }>;
  
  jobsByLocation: Array<{
    state: string;
    count: number;
    completedCount: number;
  }>;
  
  revenueMetrics: {
    totalRevenue: number;
    avgRevenuePerJob: number;
    totalCommission: number;
  };
}

/**
 * Agent comparison
 */
export interface AgentComparison {
  agents: Array<{
    agentId: string;
    agentName: string;
    performanceScore: number;
    totalListings: number;
    rentedProperties: number;
    totalCommission: number;
    completedMarkingJobs: number;
    averageRating: number;
  }>;
  metrics: string[];
  period: string;
}

/**
 * Agent ranking
 */
export interface AgentRanking {
  rankingType: 'performance' | 'earnings' | 'listings' | 'marking_jobs';
  period: string;
  rankings: Array<{
    rank: number;
    agentId: string;
    agentName: string;
    value: number;
    change: number;
    previousRank?: number;
  }>;
}

/**
 * Agent activity timeline
 */
export interface AgentActivityTimeline {
  agentId: string;
  activities: Array<{
    activityId: string;
    type: 'LISTING_CREATED' | 'PROPERTY_RENTED' | 'MARKING_JOB_COMPLETED' | 'COMMISSION_EARNED' | 'REVIEW_RECEIVED';
    title: string;
    description: string;
    metadata?: Record<string, any>;
    timestamp: string;
  }>;
  period: string;
}

/**
 * Agent earnings forecast
 */
export interface AgentEarningsForecast {
  agentId: string;
  currentEarnings: number;
  forecastedEarnings: Array<{
    period: string;
    forecastedAmount: number;
    lowerBound: number;
    upperBound: number;
    confidence: number;
  }>;
  factors: string[];
  assumptions: string[];
}

/**
 * Agent availability
 */
export interface AgentAvailability {
  agentId: string;
  isAvailableForMarking: boolean;
  serviceAreas: string[];
  maxConcurrentJobs: number;
  currentActiveJobs: number;
  availableCapacity: number;
  preferredJobTypes: string[];
  unavailableDates?: string[];
}

/**
 * Agent compliance status
 */
export interface AgentComplianceStatus {
  agentId: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documentsCompleted: boolean;
  backgroundCheckStatus: 'PENDING' | 'CLEARED' | 'FLAGGED';
  trainingCompleted: boolean;
  policyAgreement: boolean;
  lastReviewDate?: string;
  complianceScore: number;
  issues: Array<{
    issue: string;
    severity: 'low' | 'medium' | 'high';
    resolvedAt?: string;
  }>;
}

/**
 * Agent feedback
 */
export interface AgentFeedback {
  feedbackId: string;
  agentId: string;
  providedBy: string;
  providerName: string;
  rating: number;
  category: 'LISTING' | 'MARKING_JOB' | 'COMMUNICATION' | 'GENERAL';
  comment?: string;
  positiveAspects: string[];
  areasForImprovement: string[];
  createdAt: string;
}

/**
 * Agent improvement suggestions
 */
export interface AgentImprovementSuggestions {
  agentId: string;
  performanceGaps: Array<{
    area: string;
    currentScore: number;
    targetScore: number;
    gap: number;
    priority: 'low' | 'medium' | 'high';
  }>;
  recommendations: Array<{
    category: string;
    suggestion: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
  }>;
  trainingNeeds: string[];
  benchmarkComparison: {
    topPerformerAverage: number;
    agentScore: number;
    gap: number;
  };
}

/**
 * Agent retention risk
 */
export interface AgentRetentionRisk {
  agentId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  engagementTrend: 'increasing' | 'stable' | 'declining';
  earningsTrend: 'increasing' | 'stable' | 'declining';
  lastActivityDays: number;
  recommendations: string[];
}

/**
 * Agent export options
 */
export interface AgentPerformanceExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  agentIds?: string[];
  period: string;
  includeListingMetrics: boolean;
  includeMarkingMetrics: boolean;
  includeCommissionDetails: boolean;
  includeRatings: boolean;
  groupBy?: 'agent' | 'location' | 'performance_tier';
}