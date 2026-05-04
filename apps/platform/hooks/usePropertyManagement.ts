// apps/platform/hooks/usePropertyManagement.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPropertyManagementDashboard,
  updatePropertyStatus,
  deleteProperty,
  togglePropertyAvailability,
  updatePropertyBoundary
} from '@/lib/api/propertyManagement';
import { toast } from '@newcondo/ui';
import { PropertyStatus } from '@/types/enums';
import type { PropertyManagementFilters } from '@/lib/api/propertyManagement';


export const usePropertyManagement = (filters?: PropertyManagementFilters) => {
  const queryClient = useQueryClient();

  // Fetch property management dashboard
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['property-management', filters],
    queryFn: () => getPropertyManagementDashboard(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update property status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ propertyId, status }: { propertyId: string; status: PropertyStatus }) =>
      updatePropertyStatus(propertyId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property-management'] });
      queryClient.invalidateQueries({ queryKey: ['property-details', variables.propertyId] });
      toast.success('Success', {
        description: 'Property status updated successfully',
      });
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to update property status',
      });
    },
  });

  // Toggle property availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ propertyId, isAvailable }: { propertyId: string; isAvailable: boolean }) =>
      togglePropertyAvailability(propertyId, isAvailable),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property-management'] });
      queryClient.invalidateQueries({ queryKey: ['property-details', variables.propertyId] });
      toast.success('Success', {
        description: `Property ${variables.isAvailable ? 'activated' : 'deactivated'} successfully`,
      });
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to update property availability',
      });
    },
  });

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: (propertyId: string) => deleteProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-management'] });
      toast.success('Success', {
        description: 'Property deleted successfully',
      });
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to delete property',
      });
    },
  });

  // Update property boundary mutation
  const updateBoundaryMutation = useMutation({
    mutationFn: ({ propertyId, boundaryData }: {
      propertyId: string;
      boundaryData: {
        boundaryCoordinates: any;
        boundaryImages?: string[];
        buildingFingerprint?: string;
      }
    }) => updatePropertyBoundary(propertyId, boundaryData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property-management'] });
      queryClient.invalidateQueries({ queryKey: ['property-details', variables.propertyId] });
      toast.success('Success', {
        description: 'Property boundary updated successfully',
      });
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to update property boundary',
      });
    },
  });

  return {
    // Data
    properties: data?.properties || [],
    totalCount: data?.totalCount || 0,
    stats: data?.stats,
    pagination: data?.pagination,

    // States
    isLoading,
    error,

    // Actions
    refetch,
    updateStatus: updateStatusMutation.mutate,
    toggleAvailability: toggleAvailabilityMutation.mutate,
    deleteProperty: deletePropertyMutation.mutate,
    updateBoundary: updateBoundaryMutation.mutate,

    // Mutation states
    isUpdatingStatus: updateStatusMutation.isPending,
    isTogglingAvailability: toggleAvailabilityMutation.isPending,
    isDeletingProperty: deletePropertyMutation.isPending,
    isUpdatingBoundary: updateBoundaryMutation.isPending,
  };
};