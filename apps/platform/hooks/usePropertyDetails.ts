// apps/platform/hooks/usePropertyDetails.ts
'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPropertyDetails } from '@/lib/api/propertyManagement';
import { useEffect } from 'react';

export const usePropertyDetails = (propertyId: string | undefined, enabled = true) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['property-details', propertyId],
    queryFn: () => getPropertyDetails(propertyId!),
    enabled: enabled && !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  // Prefetch related data when property details are loaded
  useEffect(() => {
    if (query.data?.property) {
      // Prefetch analytics for this property
      queryClient.prefetchQuery({
        queryKey: ['property-analytics', propertyId],
        staleTime: 1000 * 60 * 5,
      });
      
      // Prefetch rental history
      queryClient.prefetchQuery({
        queryKey: ['rental-history', propertyId],
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [query.data, propertyId, queryClient]);

  return {
    // Data
    property: query.data?.property,
    units: query.data?.units || [],
    owner: query.data?.owner,
    agent: query.data?.agent,
    analytics: query.data?.analytics,
    rentals: query.data?.rentals || [],
    markingHistory: query.data?.markingHistory || [],
    
    // Computed values
    isMultiFamily: query.data?.property?.structure === 'MULTI_FAMILY',
    hasUnits: (query.data?.units?.length || 0) > 0,
    isOwner: query.data?.isOwner || false,
    isAgent: query.data?.isAgent || false,
    canEdit: query.data?.canEdit || false,
    
    // States
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
  };
};

// Hook for getting basic property info (lighter weight)
export const usePropertyBasicInfo = (propertyId: string | undefined) => {
  const query = useQuery({
    queryKey: ['property-basic-info', propertyId],
    queryFn: () => getPropertyDetails(propertyId!, { basicOnly: true }),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    property: query.data?.property,
    isLoading: query.isLoading,
    error: query.error,
  };
};