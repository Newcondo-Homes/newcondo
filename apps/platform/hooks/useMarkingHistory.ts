// apps/platform/hooks/useMarkingHistory.ts
import { useQuery } from '@tanstack/react-query';
import {
  getMarkingHistory,
  getMarkingJobDetails,
  type MarkingHistoryResponse,
  type MarkingJobDetailsResponse
} from '@/lib/api/markingHistory';

export interface MarkingHistoryFilters {
  propertyId?: string;
  status?: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export const useMarkingHistory = (filters?: MarkingHistoryFilters) => {
  const query = useQuery<MarkingHistoryResponse>({
    queryKey: ['marking-history', filters],
    queryFn: () => getMarkingHistory(filters),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });

  return {
    // Data
    markingJobs: query.data?.markingJobs || [],
    totalCount: query.data?.totalCount || 0,
    totalPages: query.data?.totalPages || 0,
    currentPage: query.data?.currentPage || 1,

    // Summary by status
    queuedCount: query.data?.queuedCount || 0,
    assignedCount: query.data?.assignedCount || 0,
    inProgressCount: query.data?.inProgressCount || 0,
    completedCount: query.data?.completedCount || 0,
    cancelledCount: query.data?.cancelledCount || 0,
    expiredCount: query.data?.expiredCount || 0,

    // Financial summary
    totalPaid: query.data?.totalPaid || 0,
    totalPending: query.data?.totalPending || 0,
    avgCompletionTime: query.data?.avgCompletionTime || 0,

    // States
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,

    // Actions
    refetch: query.refetch,
  };
};

// Hook for single marking job details
export const useMarkingJobDetails = (jobId: string | undefined) => {
  const query = useQuery<MarkingJobDetailsResponse>({
    queryKey: ['marking-job-details', jobId],
    queryFn: () => getMarkingJobDetails(jobId!),
    enabled: !!jobId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: (query) => {
      // Auto-refresh if job is in progress
      const status = query.state.data?.job?.status;
      const inProgress = ['QUEUED', 'ASSIGNED', 'IN_PROGRESS'].includes(status || '');
      return inProgress ? 1000 * 30 : false;
    },
  });

  return {
    // Job details
    job: query.data?.job,
    property: query.data?.property,
    assignedAgent: query.data?.assignedAgent,
    completionImages: query.data?.completionImages || [],
    boundaryData: query.data?.boundaryData,

    // Status helpers
    isQueued: query.data?.job?.status === 'QUEUED',
    isAssigned: query.data?.job?.status === 'ASSIGNED',
    isInProgress: query.data?.job?.status === 'IN_PROGRESS',
    isCompleted: query.data?.job?.status === 'COMPLETED',
    isCancelled: query.data?.job?.status === 'CANCELLED',
    isExpired: query.data?.job?.status === 'EXPIRED',

    // Time tracking
    timeRemaining: query.data?.timeRemaining,
    isTimeExpired: query.data?.isTimeExpired || false,
    queuePosition: query.data?.queuePosition,
    estimatedCompletion: query.data?.estimatedCompletion,

    // Payment info
    markingFee: query.data?.job?.markingFee || 0,
    paymentStatus: query.data?.job?.paymentStatus,

    // States
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,

    // Actions
    refetch: query.refetch,
  };
};

// Hook for property-specific marking history
export const usePropertyMarkingHistory = (propertyId: string) => {
  return useMarkingHistory({ propertyId, limit: 100 });
};

// Hook for marking statistics
export const useMarkingStats = () => {
  const {
    totalCount,
    completedCount,
    queuedCount,
    assignedCount,
    inProgressCount,
    totalPaid,
    avgCompletionTime,
  } = useMarkingHistory({ limit: 1 });

  return {
    totalJobs: totalCount,
    completedJobs: completedCount,
    pendingJobs: queuedCount + assignedCount + inProgressCount,
    successRate: totalCount ? (completedCount / totalCount) * 100 : 0,
    totalSpent: totalPaid,
    avgCompletionTime: avgCompletionTime,
  };
};