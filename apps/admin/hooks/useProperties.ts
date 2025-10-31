// apps/admin/src/hooks/useProperties.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api/properties';
import { usePropertyStore } from '@/store/propertyStore';
import { AdminApprovalStatus, PropertyType, PropertyStatus } from '@newcondo/db';

interface PropertyFilters {
  page?: number;
  limit?: number;
  search?: string;
  adminApprovalStatus?: AdminApprovalStatus;
  propertyType?: PropertyType;
  status?: PropertyStatus;
  city?: string;
  state?: string;
  boundaryVerified?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const useProperties = (filters?: PropertyFilters) => {
  const queryClient = useQueryClient();
  const { setSelectedProperty } = usePropertyStore();
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch paginated properties
   */
  const {
    data: propertiesData,
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['properties', filters],
    queryFn: () => propertiesApi.getProperties(filters),
    staleTime: 30000,
  });

  /**
   * Fetch single property details
   */
  const usePropertyDetails = (propertyId: string) => {
    return useQuery({
      queryKey: ['property', propertyId],
      queryFn: () => propertiesApi.getPropertyById(propertyId),
      enabled: !!propertyId,
    });
  };

  /**
   * Approve property mutation
   */
  const approvePropertyMutation = useMutation({
    mutationFn: ({ 
      propertyId, 
      notes 
    }: { 
      propertyId: string; 
      notes?: string;
    }) => propertiesApi.approveProperty(propertyId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to approve property');
    }
  });

  /**
   * Reject property mutation
   */
  const rejectPropertyMutation = useMutation({
    mutationFn: ({ 
      propertyId, 
      reason 
    }: { 
      propertyId: string; 
      reason: string;
    }) => propertiesApi.rejectProperty(propertyId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to reject property');
    }
  });

  /**
   * Delete property mutation
   */
  const deletePropertyMutation = useMutation({
    mutationFn: (propertyId: string) => propertiesApi.deleteProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to delete property');
    }
  });

  /**
   * Verify property boundary mutation
   */
  const verifyBoundaryMutation = useMutation({
    mutationFn: ({ 
      propertyId, 
      verified 
    }: { 
      propertyId: string; 
      verified: boolean;
    }) => propertiesApi.verifyBoundary(propertyId, verified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to verify boundary');
    }
  });

  /**
   * Flag property as duplicate mutation
   */
  const flagAsDuplicateMutation = useMutation({
    mutationFn: ({ 
      propertyId, 
      originalPropertyId, 
      reason 
    }: { 
      propertyId: string; 
      originalPropertyId: string; 
      reason: string;
    }) => propertiesApi.flagAsDuplicate(propertyId, originalPropertyId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['duplicates'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to flag as duplicate');
    }
  });

  /**
   * Approve property
   */
  const approveProperty = useCallback(async (
    propertyId: string,
    notes?: string
  ) => {
    setError(null);
    return approvePropertyMutation.mutateAsync({ propertyId, notes });
  }, [approvePropertyMutation]);

  /**
   * Reject property
   */
  const rejectProperty = useCallback(async (
    propertyId: string,
    reason: string
  ) => {
    setError(null);
    return rejectPropertyMutation.mutateAsync({ propertyId, reason });
  }, [rejectPropertyMutation]);

  /**
   * Delete property
   */
  const deleteProperty = useCallback(async (propertyId: string) => {
    setError(null);
    return deletePropertyMutation.mutateAsync(propertyId);
  }, [deletePropertyMutation]);

  /**
   * Verify property boundary
   */
  const verifyBoundary = useCallback(async (
    propertyId: string,
    verified: boolean
  ) => {
    setError(null);
    return verifyBoundaryMutation.mutateAsync({ propertyId, verified });
  }, [verifyBoundaryMutation]);

  /**
   * Flag property as duplicate
   */
  const flagAsDuplicate = useCallback(async (
    propertyId: string,
    originalPropertyId: string,
    reason: string
  ) => {
    setError(null);
    return flagAsDuplicateMutation.mutateAsync({ propertyId, originalPropertyId, reason });
  }, [flagAsDuplicateMutation]);

  /**
   * Export properties data
   */
  const exportProperties = useCallback(async (filters?: PropertyFilters) => {
    setError(null);
    try {
      const blob = await propertiesApi.exportProperties(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `properties-export-${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to export properties';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  return {
    // Data
    properties: propertiesData?.data?.properties || [],
    pagination: propertiesData?.data?.pagination,
    statistics: propertiesData?.data?.statistics,
    
    // Loading states
    isLoading,
    isFetching,
    
    // Mutations loading states
    isApproving: approvePropertyMutation.isPending,
    isRejecting: rejectPropertyMutation.isPending,
    isDeleting: deletePropertyMutation.isPending,
    isVerifyingBoundary: verifyBoundaryMutation.isPending,
    isFlaggingDuplicate: flagAsDuplicateMutation.isPending,
    
    // Actions
    approveProperty,
    rejectProperty,
    deleteProperty,
    verifyBoundary,
    flagAsDuplicate,
    exportProperties,
    refetch,
    
    // Property details hook
    usePropertyDetails,
    
    // State
    error,
    clearError: () => setError(null)
  };
};