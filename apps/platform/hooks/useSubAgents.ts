// apps/platform/hooks/useSubAgents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSubAgents,
  approveSubAgent,
  revokeSubAgent,
  getSubAgentPerformance,
} from '@/lib/api/subAgents';
import { useToast } from '@/hooks/useToast';

export interface SubAgentFilters {
  propertyId?: string;
  status?: 'PENDING' | 'APPROVED' | 'REVOKED';
  sortBy?: 'earnings' | 'views' | 'conversions' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const useSubAgents = (filters?: SubAgentFilters) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch sub-agents query
  const query = useQuery({
    queryKey: ['sub-agents', filters],
    queryFn: () => getSubAgents(filters),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });

  // Approve sub-agent mutation
  const approveMutation = useMutation({
    mutationFn: ({ subAgentId, propertyId }: { subAgentId: string; propertyId: string }) =>
      approveSubAgent(subAgentId, propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-agents'] });
      toast({
        title: 'Success',
        description: 'Sub-agent approved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve sub-agent',
        variant: 'destructive',
      });
    },
  });

  // Revoke sub-agent mutation
  const revokeMutation = useMutation({
    mutationFn: ({ subAgentId, propertyId }: { subAgentId: string; propertyId: string }) =>
      revokeSubAgent(subAgentId, propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-agents'] });
      toast({
        title: 'Success',
        description: 'Sub-agent access revoked successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke sub-agent',
        variant: 'destructive',
      });
    },
  });

  return {
    // Data
    subAgents: query.data?.subAgents || [],
    totalCount: query.data?.totalCount || 0,
    pendingCount: query.data?.pendingCount || 0,
    approvedCount: query.data?.approvedCount || 0,
    revokedCount: query.data?.revokedCount || 0,
    
    // Summary
    totalEarnings: query.data?.totalEarnings || 0,
    totalViews: query.data?.totalViews || 0,
    totalConversions: query.data?.totalConversions || 0,
    
    // States
    isLoading: query.isLoading,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
    approveSubAgent: approveMutation.mutate,
    revokeSubAgent: revokeMutation.mutate,
    
    // Mutation states
    isApproving: approveMutation.isPending,
    isRevoking: revokeMutation.isPending,
  };
};

// Hook for sub-agent performance metrics
export const useSubAgentPerformance = (subAgentId: string, propertyId?: string) => {
  const query = useQuery({
    queryKey: ['sub-agent-performance', subAgentId, propertyId],
    queryFn: () => getSubAgentPerformance(subAgentId, propertyId),
    enabled: !!subAgentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    // Performance metrics
    totalViews: query.data?.totalViews || 0,
    totalClicks: query.data?.totalClicks || 0,
    totalConversions: query.data?.totalConversions || 0,
    conversionRate: query.data?.conversionRate || 0,
    
    // Earnings
    totalEarnings: query.data?.totalEarnings || 0,
    pendingEarnings: query.data?.pendingEarnings || 0,
    paidEarnings: query.data?.paidEarnings || 0,
    
    // Activity breakdown
    propertiesPromoted: query.data?.propertiesPromoted || 0,
    activePromotions: query.data?.activePromotions || 0,
    
    // Time-series data
    viewsByDay: query.data?.viewsByDay || [],
    conversionsByDay: query.data?.conversionsByDay || [],
    earningsByMonth: query.data?.earningsByMonth || [],
    
    // Rankings
    performanceRank: query.data?.performanceRank,
    percentile: query.data?.percentile,
    
    // States
    isLoading: query.isLoading,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
  };
};

// Hook for property's sub-agent list
export const usePropertySubAgents = (propertyId: string) => {
  return useSubAgents({ propertyId, limit: 100 });
};

// Hook for top performing sub-agents
export const useTopSubAgents = (limit = 10) => {
  return useSubAgents({ 
    sortBy: 'earnings', 
    sortOrder: 'desc', 
    limit,
    status: 'APPROVED'
  });
};