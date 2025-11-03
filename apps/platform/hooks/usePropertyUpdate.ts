// apps/platform/hooks/usePropertyUpdate.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  updateProperty,
  updatePropertyImages,
  reorderPropertyImages,
  deletePropertyImage,
} from '@/lib/api/propertyManagement';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

export interface PropertyUpdateData {
  title?: string;
  description?: string;
  price?: number;
  address?: string;
  city?: string;
  state?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features?: string[];
  buildingFeatures?: string[];
  totalUnits?: number;
  availableFrom?: Date;
  status?: string;
}

export const usePropertyUpdate = (propertyId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  // Update property mutation
  const updateMutation = useMutation({
    mutationFn: (data: PropertyUpdateData) => updateProperty(propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-details', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-management'] });
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      toast({
        title: 'Success',
        description: 'Property updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update property',
        variant: 'destructive',
      });
    },
  });

  // Update property images mutation
  const updateImagesMutation = useMutation({
    mutationFn: (images: { url: string; altText?: string; isPrimary?: boolean }[]) =>
      updatePropertyImages(propertyId, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-details', propertyId] });
      toast({
        title: 'Success',
        description: 'Property images updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update property images',
        variant: 'destructive',
      });
    },
  });

  // Reorder images mutation
  const reorderImagesMutation = useMutation({
    mutationFn: (imageIds: string[]) => reorderPropertyImages(propertyId, imageIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-details', propertyId] });
      toast({
        title: 'Success',
        description: 'Images reordered successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reorder images',
        variant: 'destructive',
      });
    },
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => deletePropertyImage(propertyId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-details', propertyId] });
      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete image',
        variant: 'destructive',
      });
    },
  });

  return {
    // Update actions
    updateProperty: updateMutation.mutate,
    updatePropertyAsync: updateMutation.mutateAsync,
    updateImages: updateImagesMutation.mutate,
    reorderImages: reorderImagesMutation.mutate,
    deleteImage: deleteImageMutation.mutate,
    
    // States
    isUpdating: updateMutation.isPending,
    isUpdatingImages: updateImagesMutation.isPending,
    isReorderingImages: reorderImagesMutation.isPending,
    isDeletingImage: deleteImageMutation.isPending,
    
    // Errors
    updateError: updateMutation.error,
    imagesError: updateImagesMutation.error,
  };
};