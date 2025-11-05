import { z } from 'zod';
import { UnitStatus } from '@newcondo/db';

export const createPropertyUnitSchema = z.object({
  propertyId: z.string().cuid(),
  unitNumber: z.string().min(1).max(50, 'Unit number too long'),
  floor: z.number().int().min(-5).max(200).optional(), // Allow basement floors
  bedrooms: z.number().int().min(0).max(50).optional(),
  bathrooms: z.number().int().min(0).max(50).optional(),
  area: z.string().max(50).optional(),
  features: z.array(z.string()).max(20, 'Maximum 20 features allowed').default([]),
  price: z.number().positive('Price must be positive'),
  currency: z.string().length(3).default('NGN'),
  isAvailable: z.boolean().default(true),
  availableFrom: z.string().datetime().optional(),
});

export const updatePropertyUnitSchema = z.object({
  unitNumber: z.string().min(1).max(50).optional(),
  floor: z.number().int().min(-5).max(200).optional(),
  bedrooms: z.number().int().min(0).max(50).optional(),
  bathrooms: z.number().int().min(0).max(50).optional(),
  area: z.string().max(50).optional(),
  features: z.array(z.string()).max(20).optional(),
  price: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  status: z.nativeEnum(UnitStatus).optional(),
  isAvailable: z.boolean().optional(),
  availableFrom: z.string().datetime().optional(),
});

export const bulkUpdateUnitsSchema = z.object({
  unitIds: z.array(z.string().cuid()).min(1, 'At least one unit must be selected'),
  updates: z.object({
    status: z.nativeEnum(UnitStatus).optional(),
    isAvailable: z.boolean().optional(),
    price: z.number().positive().optional(),
    features: z.array(z.string()).optional(),
  }),
});

export const unitAvailabilitySchema = z.object({
  unitId: z.string().cuid(),
  isAvailable: z.boolean(),
  availableFrom: z.string().datetime().optional(),
  reason: z.string().max(500).optional(),
});

export const unitImageUploadSchema = z.object({
  unitId: z.string().cuid(),
  imageUrl: z.string().url(),
  altText: z.string().max(200).optional(),
  isPrimary: z.boolean().default(false),
});

export const reorderUnitImagesSchema = z.object({
  imageOrders: z.array(
    z.object({
      imageId: z.string().cuid(),
      order: z.number().int().min(0),
    })
  ),
});

export const deleteUnitSchema = z.object({
  unitId: z.string().cuid(),
  reason: z.string().min(10).max(500), // Required for audit purposes
});

export const unitFilterSchema = z.object({
  propertyId: z.string().cuid(),
  status: z.nativeEnum(UnitStatus).optional(),
  isAvailable: z.boolean().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  minBedrooms: z.number().int().min(0).optional(),
  maxBedrooms: z.number().int().max(50).optional(),
  floor: z.number().int().optional(),
  sortBy: z.enum(['unitNumber', 'price', 'floor', 'createdAt']).default('unitNumber'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreatePropertyUnit = z.infer<typeof createPropertyUnitSchema>;
export type UpdatePropertyUnit = z.infer<typeof updatePropertyUnitSchema>;
export type BulkUpdateUnits = z.infer<typeof bulkUpdateUnitsSchema>;
export type UnitAvailability = z.infer<typeof unitAvailabilitySchema>;
export type UnitImageUpload = z.infer<typeof unitImageUploadSchema>;
export type ReorderUnitImages = z.infer<typeof reorderUnitImagesSchema>;
export type DeleteUnit = z.infer<typeof deleteUnitSchema>;
export type UnitFilter = z.infer<typeof unitFilterSchema>;