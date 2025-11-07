import { apiClient } from './client';

export interface AgentFilters {
  minReliabilityScore?: number;
  serviceArea?: string;
  isAvailable?: boolean;
  searchQuery?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  isAvailableForMarking: boolean;
  agentServiceAreas: string[];
  agentReliabilityScore: number | null;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  createdAt: Date;
  totalCommission?: number;
  activeListings?: number;
  successRate?: number;
}

export interface AgentStats {
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  cancelledJobs: number;
  averageCompletionTime: number;
  totalCommission: number;
  averageCommission: number;
  reliabilityScore: number;
  successRate: number;
  totalListings: number;
  activeListings: number;
  rentedListings: number;
  totalRentCollected: number;
  customerSatisfactionScore: number;
  responseTime: number;
  activityHistory?: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
    metadata?: any;
  }>;
}

export interface AgentCommission {
  total: number;
  fromListings: number;
  fromSubAgentActivity: number;
  fromMarkingJobs: number;
  pending: number;
  released: number;
  byProperty: Array<{
    propertyId: string;
    propertyTitle: string;
    commission: number;
    date: Date;
  }>;
  byMonth: Array<{
    month: string;
    commission: number;
  }>;
}

export interface MarkingJob {
  id: string;
  propertyId: string;
  property?: {
    id: string;
    title: string;
    address: string;
  };
  status: string;
  markingFee: number;
  assignedAt: Date | null;
  completedAt: Date | null;
  completionNotes: string | null;
  rating?: number;
  feedback?: string;
}

export interface AgentRating {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: Array<{ stars: number; count: number }>;
  recentReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    propertyId: string;
    propertyTitle: string;
    createdAt: Date;
    reviewerName: string;
  }>;
}

// Get agent performance data
export async function getAgentPerformance(
  filters?: AgentFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<{ agents: Agent[]; total: number; page: number; pageSize: number }> {
  const response = await apiClient.get('/admin/agents/performance', {
    params: {
      ...filters,
      dateFrom: filters?.dateFrom?.toISOString(),
      dateTo: filters?.dateTo?.toISOString(),
      page,
      pageSize,
    },
  });
  return response.data;
}

// Get agent by ID
export async function getAgentById(agentId: string): Promise<Agent> {
  const response = await apiClient.get(`/admin/agents/${agentId}`);
  return response.data;
}

// Get agent statistics
export async function getAgentStats(agentId: string, dateRange?: DateRange): Promise<AgentStats> {
  const response = await apiClient.get(`/admin/agents/${agentId}/stats`, {
    params: dateRange
      ? {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        }
      : undefined,
  });
  return response.data;
}

// Get agent commissions
export async function getAgentCommissions(agentId: string, dateRange?: DateRange): Promise<AgentCommission> {
  const response = await apiClient.get(`/admin/agents/${agentId}/commissions`, {
    params: dateRange
      ? {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        }
      : undefined,
  });
  return response.data;
}

// Get agent marking history
export async function getAgentMarkingHistory(
  agentId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ jobs: MarkingJob[]; total: number; page: number; pageSize: number }> {
  const response = await apiClient.get(`/admin/agents/${agentId}/marking-history`, {
    params: { page, pageSize },
  });
  return response.data;
}

// Get agent ratings
export async function getAgentRatings(agentId: string): Promise<AgentRating> {
  const response = await apiClient.get(`/admin/agents/${agentId}/ratings`);
  return response.data;
}

// Get top performing agents
export async function getTopPerformingAgents(
  dateRange?: DateRange,
  limit: number = 10
): Promise<Agent[]> {
  const response = await apiClient.get('/admin/agents/top-performers', {
    params: {
      startDate: dateRange?.startDate.toISOString(),
      endDate: dateRange?.endDate.toISOString(),
      limit,
    },
  });
  return response.data;
}

// Update agent reliability score
export async function updateAgentReliabilityScore(
  agentId: string,
  score: number,
  reason: string
): Promise<{ message: string }> {
  const response = await apiClient.patch(`/admin/agents/${agentId}/reliability-score`, {
    score,
    reason,
  });
  return response.data;
}

// Suspend agent
export async function suspendAgent(agentId: string, reason: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/admin/agents/${agentId}/suspend`, { reason });
  return response.data;
}

// Unsuspend agent
export async function unsuspendAgent(agentId: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/admin/agents/${agentId}/unsuspend`);
  return response.data;
}

// Export agent report
export async function exportAgentReport(
  agentId: string,
  dateRange: DateRange,
  format: 'csv' | 'pdf'
): Promise<Blob> {
  const response = await apiClient.get(`/admin/agents/${agentId}/export`, {
    params: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      format,
    },
    responseType: 'blob',
  });
  return response.data;
}

// Get agent properties
export async function getAgentProperties(
  agentId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<any> {
  const response = await apiClient.get(`/admin/agents/${agentId}/properties`, {
    params: { page, pageSize },
  });
  return response.data;
}

// Get agent sub-agents (if applicable)
export async function getAgentSubAgents(agentId: string): Promise<any[]> {
  const response = await apiClient.get(`/admin/agents/${agentId}/sub-agents`);
  return response.data;
}

// Update agent service areas
export async function updateAgentServiceAreas(
  agentId: string,
  serviceAreas: string[]
): Promise<{ message: string }> {
  const response = await apiClient.patch(`/admin/agents/${agentId}/service-areas`, {
    serviceAreas,
  });
  return response.data;
}

// Get agent availability
export async function getAgentAvailability(agentId: string): Promise<{
  isAvailable: boolean;
  currentJobs: number;
  maxCapacity: number;
  nextAvailable: Date | null;
}> {
  const response = await apiClient.get(`/admin/agents/${agentId}/availability`);
  return response.data;
}

// Set agent availability
export async function setAgentAvailability(
  agentId: string,
  isAvailable: boolean
): Promise<{ message: string }> {
  const response = await apiClient.patch(`/admin/agents/${agentId}/availability`, {
    isAvailable,
  });
  return response.data;
}