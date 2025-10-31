// apps/admin/src/hooks/useDisputes.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputesApi } from '@/lib/api/disputes';
import { useDisputeStore } from '@/store/disputeStore';
import { DuplicateStatus } from '@newcondo/db';

interface DisputeFilters {
  page?: number;
  limit?: number;
  status?: DuplicateStatus;
  propertyId?: string;
  reportedBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

type ActionTaken = 
  | 'APPROVED_ORIGINAL' 
  | 'APPROVED_DISPUTED' 
  | 'REQUIRED_REMARKING' 
  | 'MERGED_PROPERTIES' 
  | 'OTHER';

export const useDisputes = (filters?: DisputeFilters) => {
  const queryClient = useQueryClient();
  const { setSelectedDispute } = useDisputeStore();
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch boundary disputes
   */
  const {
    data: disputesData,
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['disputes', filters],
    queryFn: () => disputesApi.getDisputes(filters),
    staleTime: 30000,
  });

  /**
   * Fetch single dispute details
   */
  const useDisputeDetails = (disputeId: string) => {
    return useQuery({
      queryKey: ['dispute', disputeId],
      queryFn: () => disputesApi.getDisputeById(disputeId),
      enabled: !!disputeId,
    });
  };

  /**
   * Resolve dispute mutation
   */
  const resolveDisputeMutation = useMutation({
    mutationFn: ({ 
      disputeId, 
      resolution, 
      actionTaken 
    }: { 
      disputeId: string; 
      resolution: string; 
      actionTaken: ActionTaken;
    }) => disputesApi.resolveDispute(disputeId, resolution, actionTaken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to resolve dispute');
    }
  });

  /**
   * Merge properties mutation
   */
  const mergePropertiesMutation = useMutation({
    mutationFn: ({ 
      propertyIds, 
      primaryPropertyId,
      mergeStrategy 
    }: { 
      propertyIds: string[]; 
      primaryPropertyId: string;
      mergeStrategy?: 'KEEP_PRIMARY' | 'MERGE_DATA';
    }) => disputesApi.mergeProperties(propertyIds, primaryPropertyId, mergeStrategy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['duplicates'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to merge properties');
    }
  });

  /**
   * Escalate dispute mutation
   */
  const escalateDisputeMutation = useMutation({
    mutationFn: ({ 
      disputeId, 
      reason 
    }: { 
      disputeId: string; 
      reason: string;
    }) => disputesApi.escalateDispute(disputeId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to escalate dispute');
    }
  });

  /**
   * Request additional evidence mutation
   */
  const requestEvidenceMutation = useMutation({
    mutationFn: ({ 
      disputeId, 
      userId,
      evidenceType,
      instructions 
    }: { 
      disputeId: string; 
      userId: string;
      evidenceType: string[];
      instructions: string;
    }) => disputesApi.requestAdditionalEvidence(disputeId, userId, evidenceType, instructions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to request evidence');
    }
  });

  /**
   * Reject dispute mutation
   */
  const rejectDisputeMutation = useMutation({
    mutationFn: ({ 
      disputeId, 
      reason 
    }: { 
      disputeId: string; 
      reason: string;
    }) => disputesApi.rejectDispute(disputeId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to reject dispute');
    }
  });

  /**
   * Resolve dispute
   */
  const resolveDispute = useCallback(async (
    disputeId: string,
    resolution: string,
    actionTaken: ActionTaken
  ) => {
    setError(null);
    return resolveDisputeMutation.mutateAsync({ disputeId, resolution, actionTaken });
  }, [resolveDisputeMutation]);

  /**
   * Merge properties
   */
  const mergeProperties = useCallback(async (
    propertyIds: string[],
    primaryPropertyId: string,
    mergeStrategy?: 'KEEP_PRIMARY' | 'MERGE_DATA'
  ) => {
    setError(null);
    return mergePropertiesMutation.mutateAsync({ propertyIds, primaryPropertyId, mergeStrategy });
  }, [mergePropertiesMutation]);

  /**
   * Escalate dispute
   */
  const escalateDispute = useCallback(async (
    disputeId: string,
    reason: string
  ) => {
    setError(null);
    return escalateDisputeMutation.mutateAsync({ disputeId, reason });
  }, [escalateDisputeMutation]);

  /**
   * Request additional evidence
   */
  const requestAdditionalEvidence = useCallback(async (
    disputeId: string,
    userId: string,
    evidenceType: string[],
    instructions: string
  ) => {
    setError(null);
    return requestEvidenceMutation.mutateAsync({ disputeId, userId, evidenceType, instructions });
  }, [requestEvidenceMutation]);

  /**
   * Reject dispute
   */
  const rejectDispute = useCallback(async (
    disputeId: string,
    reason: string
  ) => {
    setError(null);
    return rejectDisputeMutation.mutateAsync({ disputeId, reason });
  }, [rejectDisputeMutation]);

  /**
   * Get dispute statistics
   */
  const getStatistics = useCallback(() => {
    const stats = disputesData?.data?.statistics;
    return {
      total: stats?.total || 0,
      pending: stats?.pending || 0,
      resolved: stats?.resolved || 0,
      escalated: stats?.escalated || 0,
      averageResolutionTime: stats?.averageResolutionTime || 0
    };
  }, [disputesData]);

  return {
    // Data
    disputes: disputesData?.data?.disputes || [],
    pagination: disputesData?.data?.pagination,
    statistics: getStatistics(),
    
    // Loading states
    isLoading,
    isFetching,
    
    // Mutations loading states
    isResolving: resolveDisputeMutation.isPending,
    isMerging: mergePropertiesMutation.isPending,
    isEscalating: escalateDisputeMutation.isPending,
    isRequestingEvidence: requestEvidenceMutation.isPending,
    isRejecting: rejectDisputeMutation.isPending,
    
    // Actions
    resolveDispute,
    mergeProperties,
    escalateDispute,
    requestAdditionalEvidence,
    rejectDispute,
    refetch,
    
    // Dispute details hook
    useDisputeDetails,
    
    // State
    error,
    clearError: () => setError(null)
  };
};