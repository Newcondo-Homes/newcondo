// apps/platform/hooks/usePropertyManagement.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPropertyManagementDashboard,
  updatePropertyStatus,
  deleteProperty,
  togglePropertyAvailability,
  updatePropertyBoundary
} from '@/lib/api/propertyManagement';
import { useToast } from '@/hooks/useToast';
import { PropertyStatus } from '@prisma/client';

export interface PropertyManagementFilters {
  status?: PropertyStatus;
  structure?: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  isAvailable?: boolean;
  searchQuery?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'viewCount' | 'price';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const usePropertyManagement = (filters?: PropertyManagementFilters) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      toast({
        title: 'Success',
        description: 'Property status updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update property status',
        variant: 'destructive',
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
      toast({
        title: 'Success',
        description: `Property ${variables.isAvailable ? 'activated' : 'deactivated'} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update property availability',
        variant: 'destructive',
      });
    },
  });

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: (propertyId: string) => deleteProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-management'] });
      toast({
        title: 'Success',
        description: 'Property deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete property',
        variant: 'destructive',
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
      toast({
        title: 'Success',
        description: 'Property boundary updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update property boundary',
        variant: 'destructive',
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