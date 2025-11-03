// apps/platform/hooks/useUnitManagement.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPropertyUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  toggleUnitAvailability,
  updateUnitImages,
} from '@/lib/api/propertyManagement';
import { useToast } from '@/hooks/useToast';

export interface UnitData {
  unitNumber: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features?: string[];
  price: number;
  currency?: string;
  isAvailable?: boolean;
  availableFrom?: Date;
}

export interface UnitImageData {
  url: string;
  altText?: string;
  isPrimary?: boolean;
}

export const useUnitManagement = (propertyId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch units query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['property-units', propertyId],
    queryFn: () => getPropertyUnits(propertyId),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });

  // Create unit mutation
  const createMutation = useMutation({
    mutationFn: (unitData: UnitData) => createUnit(propertyId, unitData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-units', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-details', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-management'] });
      toast({
        title: 'Success',
        description: 'Unit created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create unit',
        variant: 'destructive',
      });
    },
  });

  // Update unit mutation
  const updateMutation = useMutation({
    mutationFn: ({ unitId, data }: { unitId: string; data: Partial<UnitData> }) =>
      updateUnit(propertyId, unitId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-units', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-details', propertyId] });
      toast({
        title: 'Success',
        description: 'Unit updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update unit',
        variant: 'destructive',
      });
    },
  });

  // Delete unit mutation
  const deleteMutation = useMutation({
    mutationFn: (unitId: string) => deleteUnit(propertyId, unitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-units', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-details', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-management'] });
      toast({
        title: 'Success',
        description: 'Unit deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete unit',
        variant: 'destructive',
      });
    },
  });

  // Toggle unit availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ unitId, isAvailable }: { unitId: string; isAvailable: boolean }) =>
      toggleUnitAvailability(propertyId, unitId, isAvailable),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property-units', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-details', propertyId] });
      toast({
        title: 'Success',
        description: `Unit ${variables.isAvailable ? 'activated' : 'deactivated'} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update unit availability',
        variant: 'destructive',
      });
    },
  });

  // Update unit images mutation
  const updateImagesMutation = useMutation({
    mutationFn: ({ unitId, images }: { unitId: string; images: UnitImageData[] }) =>
      updateUnitImages(propertyId, unitId, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-units', propertyId] });
      toast({
        title: 'Success',
        description: 'Unit images updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update unit images',
        variant: 'destructive',
      });
    },
  });

  return {
    // Data
    units: data?.units || [],
    totalUnits: data?.totalCount || 0,
    availableUnits: data?.availableCount || 0,
    occupiedUnits: data?.occupiedCount || 0,
    
    // States
    isLoading,
    error,
    
    // Actions
    refetch,
    createUnit: createMutation.mutate,
    createUnitAsync: createMutation.mutateAsync,
    updateUnit: updateMutation.mutate,
    deleteUnit: deleteMutation.mutate,
    toggleAvailability: toggleAvailabilityMutation.mutate,
    updateImages: updateImagesMutation.mutate,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTogglingAvailability: toggleAvailabilityMutation.isPending,
    isUpdatingImages: updateImagesMutation.isPending,
  };
};