// apps/platform/hooks/useCommissions.ts
import { useQuery } from '@tanstack/react-query';
import { getCommissions, getCommissionSummary } from '@/lib/api/commissions';

export interface CommissionFilters {
  status?: 'PENDING' | 'RELEASED' | 'WITHDRAWN' | 'ALL';
  startDate?: Date;
  endDate?: Date;
  propertyId?: string;
  type?: 'LISTING_AGENT' | 'SUB_AGENT' | 'MARKING_SERVICE';
  page?: number;
  limit?: number;
}

export const useCommissions = (filters?: CommissionFilters) => {
  const query = useQuery({
    queryKey: ['commissions', filters],
    queryFn: () => getCommissions(filters),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });

  return {
    // Data
    commissions: query.data?.commissions || [],
    totalCount: query.data?.totalCount || 0,
    totalPages: query.data?.totalPages || 0,
    currentPage: query.data?.currentPage || 1,
    
    // Aggregated data
    totalPendingAmount: query.data?.totalPendingAmount || 0,
    totalReleasedAmount: query.data?.totalReleasedAmount || 0,
    totalWithdrawnAmount: query.data?.totalWithdrawnAmount || 0,
    
    // States
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
  };
};

// Hook for commission summary/dashboard
export const useCommissionSummary = () => {
  const query = useQuery({
    queryKey: ['commission-summary'],
    queryFn: () => getCommissionSummary(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    // Summary data
    totalEarned: query.data?.totalEarned || 0,
    availableBalance: query.data?.availableBalance || 0,
    pendingBalance: query.data?.pendingBalance || 0,
    withdrawnTotal: query.data?.withdrawnTotal || 0,
    
    // Breakdown by type
    listingAgentEarnings: query.data?.listingAgentEarnings || 0,
    subAgentEarnings: query.data?.subAgentEarnings || 0,
    markingServiceEarnings: query.data?.markingServiceEarnings || 0,
    
    // Recent activity
    recentCommissions: query.data?.recentCommissions || [],
    
    // Performance metrics
    totalProperties: query.data?.totalProperties || 0,
    totalReferrals: query.data?.totalReferrals || 0,
    conversionRate: query.data?.conversionRate || 0,
    avgCommissionPerProperty: query.data?.avgCommissionPerProperty || 0,
    
    // Monthly breakdown
    monthlyEarnings: query.data?.monthlyEarnings || [],
    earningsTrend: query.data?.earningsTrend || 'stable',
    
    // States
    isLoading: query.isLoading,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
  };
};

// Hook for property-specific commissions
export const usePropertyCommissions = (propertyId: string) => {
  return useCommissions({ propertyId, limit: 100 });
};