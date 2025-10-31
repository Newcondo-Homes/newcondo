// apps/admin/src/hooks/useDuplicates.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { duplicatesApi } from '@/lib/api/duplicates';
import { DuplicateStatus } from '@newcondo/db';

interface DuplicateFilters {
  page?: number;
  limit?: number;
  status?: DuplicateStatus;
  propertyId?: string;
  reportedBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const useDuplicates = (filters?: DuplicateFilters) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch duplicate reports
   */
  const {
    data: duplicatesData,
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['duplicates', filters],
    queryFn: () => duplicatesApi.getDuplicates(filters),
    staleTime: 30000,
  });

  /**
   * Fetch single duplicate details
   */
  const useDuplicateDetails = (duplicateId: string) => {
    return useQuery({
      queryKey: ['duplicate', duplicateId],
      queryFn: () => duplicatesApi.getDuplicateById(duplicateId),
      enabled: !!duplicateId,
    });
  };

  /**
   * Review duplicate mutation
   */
  const reviewDuplicateMutation = useMutation({
    mutationFn: ({ 
      duplicateId, 
      status, 
      resolution 
    }: { 
      duplicateId: string; 
      status: DuplicateStatus; 
      resolution: string;
    }) => duplicatesApi.reviewDuplicate(duplicateId, status, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicates'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to review duplicate');
    }
  });

  /**
   * Merge duplicates mutation
   */
  const mergeDuplicatesMutation = useMutation({
    mutationFn: ({ 
      propertyIds, 
      primaryId,
      mergeData
    }: { 
      propertyIds: string[]; 
      primaryId: string;
      mergeData?: {
        keepImages?: 'PRIMARY' | 'ALL' | 'BEST';
        keepPricing?: 'PRIMARY' | 'LOWEST' | 'HIGHEST';
        keepFeatures?: 'PRIMARY' | 'MERGE';
      };
    }) => duplicatesApi.mergeDuplicates(propertyIds, primaryId, mergeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicates'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to merge duplicates');
    }
  });

  /**
   * Dismiss duplicate mutation
   */
  const dismissDuplicateMutation = useMutation({
    mutationFn: ({ 
      duplicateId, 
      reason 
    }: { 
      duplicateId: string; 
      reason: string;
    }) => duplicatesApi.dismissDuplicate(duplicateId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicates'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to dismiss duplicate');
    }
  });

  /**
   * Scan for duplicates mutation
   */
  const scanForDuplicatesMutation = useMutation({
    mutationFn: (propertyId?: string) => duplicatesApi.scanForDuplicates(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicates'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to scan for duplicates');
    }
  });

  /**
   * Review duplicate
   */
  const reviewDuplicate = useCallback(async (
    duplicateId: string,
    status: DuplicateStatus,
    resolution: string
  ) => {
    setError(null);
    return reviewDuplicateMutation.mutateAsync({ duplicateId, status, resolution });
  }, [reviewDuplicateMutation]);

  /**
   * Merge duplicates
   */
  const mergeDuplicates = useCallback(async (
    propertyIds: string[],
    primaryId: string,
    mergeData?: {
      keepImages?: 'PRIMARY' | 'ALL' | 'BEST';
      keepPricing?: 'PRIMARY' | 'LOWEST' | 'HIGHEST';
      keepFeatures?: 'PRIMARY' | 'MERGE';
    }
  ) => {
    setError(null);
    return mergeDuplicatesMutation.mutateAsync({ propertyIds, primaryId, mergeData });
  }, [mergeDuplicatesMutation]);

  /**
   * Dismiss duplicate
   */
  const dismissDuplicate = useCallback(async (
    duplicateId: string,
    reason: string
  ) => {
    setError(null);
    return dismissDuplicateMutation.mutateAsync({ duplicateId, reason });
  }, [dismissDuplicateMutation]);

  /**
   * Scan for duplicates
   */
  const scanForDuplicates = useCallback(async (propertyId?: string) => {
    setError(null);
    return scanForDuplicatesMutation.mutateAsync(propertyId);
  }, [scanForDuplicatesMutation]);

  /**
   * Get duplicate statistics
   */
  const getStatistics = useCallback(() => {
    const stats = duplicatesData?.data?.statistics;
    return {
      total: stats?.total || 0,
      pending: stats?.pending || 0,
      confirmed: stats?.confirmed || 0,
      dismissed: stats?.dismissed || 0,
      resolved: stats?.resolved || 0,
      detectionRate: stats?.detectionRate || 0
    };
  }, [duplicatesData]);

  return {
    // Data
    duplicates: duplicatesData?.data?.duplicates || [],
    pagination: duplicatesData?.data?.pagination,
    statistics: getStatistics(),
    
    // Loading states
    isLoading,
    isFetching,
    
    // Mutations loading states
    isReviewing: reviewDuplicateMutation.isPending,
    isMerging: mergeDuplicatesMutation.isPending,
    isDismissing: dismissDuplicateMutation.isPending,
    isScanning: scanForDuplicatesMutation.isPending,
    
    // Actions
    reviewDuplicate,
    mergeDuplicates,
    dismissDuplicate,
    scanForDuplicates,
    refetch,
    
    // Duplicate details hook
    useDuplicateDetails,
    
    // State
    error,
    clearError: () => setError(null)
  };
};