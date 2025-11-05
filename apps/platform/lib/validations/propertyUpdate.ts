import { z } from 'zod';
import { PropertyType, PropertyStructure, PropertyStatus } from '@newcondo/db';

export const updatePropertyBasicInfoSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200).optional(),
  description: z.string().min(50, 'Description must be at least 50 characters').max(2000).optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  address: z.string().min(10).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
});

export const updatePropertyPricingSchema = z.object({
  price: z.number().positive('Price must be positive').optional(),
  currency: z.string().length(3).default('NGN').optional(),
});

export const updatePropertyDetailsSchema = z.object({
  bedrooms: z.number().int().min(0).max(50).optional(),
  bathrooms: z.number().int().min(0).max(50).optional(),
  area: z.string().optional(),
  features: z.array(z.string()).max(20, 'Maximum 20 features allowed').optional(),
  buildingFeatures: z.array(z.string()).max(30, 'Maximum 30 building features allowed').optional(),
});

export const updatePropertyAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  availableFrom: z.string().datetime().optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
});

export const updatePropertyBoundarySchema = z.object({
  boundaryCoordinates: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number().finite()))),
  }),
  boundaryImages: z.array(z.string().url()).max(10, 'Maximum 10 boundary images allowed'),
});

export const reorderPropertyImagesSchema = z.object({
  imageOrders: z.array(
    z.object({
      imageId: z.string().cuid(),
      order: z.number().int().min(0),
    })
  ),
});

export const setPrimaryImageSchema = z.object({
  imageId: z.string().cuid(),
});

export const removePropertyImageSchema = z.object({
  imageId: z.string().cuid(),
});

export const updatePropertyStatusSchema = z.object({
  status: z.nativeEnum(PropertyStatus),
  reason: z.string().min(10).max(500).optional(), // Required for certain status changes
});

export const updatePropertyStructureSchema = z.object({
  structure: z.nativeEnum(PropertyStructure),
  totalUnits: z.number().int().positive().max(500).optional(), // Required for MULTI_FAMILY
});

export type UpdatePropertyBasicInfo = z.infer<typeof updatePropertyBasicInfoSchema>;
export type UpdatePropertyPricing = z.infer<typeof updatePropertyPricingSchema>;
export type UpdatePropertyDetails = z.infer<typeof updatePropertyDetailsSchema>;
export type UpdatePropertyAvailability = z.infer<typeof updatePropertyAvailabilitySchema>;
export type UpdatePropertyBoundary = z.infer<typeof updatePropertyBoundarySchema>;
export type ReorderPropertyImages = z.infer<typeof reorderPropertyImagesSchema>;
export type SetPrimaryImage = z.infer<typeof setPrimaryImageSchema>;
export type RemovePropertyImage = z.infer<typeof removePropertyImageSchema>;
export type UpdatePropertyStatus = z.infer<typeof updatePropertyStatusSchema>;
export type UpdatePropertyStructure = z.infer<typeof updatePropertyStructureSchema>;