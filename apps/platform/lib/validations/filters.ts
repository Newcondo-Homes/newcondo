import { z } from 'zod';

// Price range filter validation
export const priceFilterSchema = z.object({
  min: z
    .number()
    .min(0, 'Minimum price cannot be negative')
    .max(50000000, 'Minimum price too high')
    .optional(),
  max: z
    .number()
    .min(0, 'Maximum price cannot be negative')
    .max(100000000, 'Maximum price too high')
    .optional(),
}).refine(
  (data) => {
    if (data.min && data.max) {
      return data.min <= data.max;
    }
    return true;
  },
  {
    message: 'Minimum price cannot be greater than maximum price',
    path: ['min'],
  }
);

// Room count filter validation
export const roomFilterSchema = z.object({
  bedrooms: z.object({
    min: z.number().int().min(0).max(20).optional(),
    max: z.number().int().min(0).max(20).optional(),
  }).optional(),
  bathrooms: z.object({
    min: z.number().int().min(0).max(20).optional(),
    max: z.number().int().min(0).max(20).optional(),
  }).optional(),
}).refine(
  (data) => {
    if (data.bedrooms?.min && data.bedrooms?.max) {
      return data.bedrooms.min <= data.bedrooms.max;
    }
    return true;
  },
  {
    message: 'Minimum bedrooms cannot be greater than maximum bedrooms',
    path: ['bedrooms', 'min'],
  }
).refine(
  (data) => {
    if (data.bathrooms?.min && data.bathrooms?.max) {
      return data.bathrooms.min <= data.bathrooms.max;
    }
    return true;
  },
  {
    message: 'Minimum bathrooms cannot be greater than maximum bathrooms',
    path: ['bathrooms', 'min'],
  }
);

// Location filter validation
export const locationFilterSchema = z.object({
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    radius: z.number().min(0.1).max(50), // km
  }).optional(),
  country: z.string().max(50).optional(),
  state: z.string().max(50).optional(),
  city: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
});

// Property type filter validation
export const propertyTypeFilterSchema = z.object({
  types: z
    .array(z.enum(['APARTMENT', 'HOUSE', 'DUPLEX', 'ROOM', 'SHARED_APARTMENT', 'OFFICE', 'SHOP', 'WAREHOUSE']))
    .min(1, 'At least one property type must be selected')
    .max(8, 'Too many property types selected'),
});

// Amenities/Features filter validation
export const featuresFilterSchema = z.object({
  required: z
    .array(z.string().max(50))
    .max(20, 'Too many required features')
    .optional(),
  preferred: z
    .array(z.string().max(50))
    .max(20, 'Too many preferred features')
    .optional(),
});

// Availability filter validation
export const availabilityFilterSchema = z.object({
  availableFrom: z.string().datetime().optional(),
  availableTo: z.string().datetime().optional(),
  isAvailableNow: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.availableFrom && data.availableTo) {
      return new Date(data.availableFrom) <= new Date(data.availableTo);
    }
    return true;
  },
  {
    message: 'Available from date cannot be after available to date',
    path: ['availableFrom'],
  }
);

// Property characteristics filter validation
export const characteristicsFilterSchema = z.object({
  isOwnerListing: z.boolean().optional(),
  hasImages: z.boolean().optional(),
  isBoundaryVerified: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  isNewListing: z.boolean().optional(), // Listed within last 7 days
});

// Comprehensive filter schema
export const propertyFiltersSchema = z.object({
  price: priceFilterSchema.optional(),
  rooms: roomFilterSchema.optional(),
  location: locationFilterSchema.optional(),
  propertyType: propertyTypeFilterSchema.optional(),
  features: featuresFilterSchema.optional(),
  availability: availabilityFilterSchema.optional(),
  characteristics: characteristicsFilterSchema.optional(),
});

// Filter state management validation
export const filterStateSchema = z.object({
  activeFilters: propertyFiltersSchema,
  isAdvancedMode: z.boolean().default(false),
  savedFilters: z.array(z.object({
    id: z.string(),
    name: z.string().min(1).max(100),
    filters: propertyFiltersSchema,
    createdAt: z.string().datetime(),
  })).max(10, 'Cannot save more than 10 filter sets').optional(),
});

// Quick filter presets validation
export const quickFilterSchema = z.object({
  type: z.enum([
    'under-500k',
    'under-1m',
    'under-2m',
    'studio',
    '1-bedroom',
    '2-bedroom',
    '3-bedroom',
    'luxury',
    'new-listings',
    'verified-boundary',
    'owner-listings',
    'agent-listings'
  ]),
  label: z.string().min(1).max(50),
  filters: propertyFiltersSchema,
});

// Filter comparison validation (for A/B testing)
export const filterComparisonSchema = z.object({
  filterSetA: propertyFiltersSchema,
  filterSetB: propertyFiltersSchema,
  comparisonName: z.string().min(1).max(100).optional(),
});

// Types derived from schemas
export type PriceFilter = z.infer<typeof priceFilterSchema>;
export type RoomFilter = z.infer<typeof roomFilterSchema>;
export type LocationFilter = z.infer<typeof locationFilterSchema>;
export type PropertyTypeFilter = z.infer<typeof propertyTypeFilterSchema>;
export type FeaturesFilter = z.infer<typeof featuresFilterSchema>;
export type AvailabilityFilter = z.infer<typeof availabilityFilterSchema>;
export type CharacteristicsFilter = z.infer<typeof characteristicsFilterSchema>;
export type PropertyFilters = z.infer<typeof propertyFiltersSchema>;
export type FilterState = z.infer<typeof filterStateSchema>;
export type QuickFilter = z.infer<typeof quickFilterSchema>;
export type FilterComparison = z.infer<typeof filterComparisonSchema>;

// Validation helper functions
export function validatePropertyFilters(filters: unknown): PropertyFilters {
  return propertyFiltersSchema.parse(filters);
}

export function validateFilterState(state: unknown): FilterState {
  return filterStateSchema.parse(state);
}

export function validateQuickFilter(filter: unknown): QuickFilter {
  return quickFilterSchema.parse(filter);
}

// Safe validation helpers
export function safeValidatePropertyFilters(filters: unknown) {
  const result = propertyFiltersSchema.safeParse(filters);
  if (result.success) {
    return { data: result.data, error: null };
  }
  return { data: null, error: result.error };
}

export function safeValidateFilterState(state: unknown) {
  const result = filterStateSchema.safeParse(state);
  if (result.success) {
    return { data: result.data, error: null };
  }
  return { data: null, error: result.error };
}

// Filter transformation helpers
export function convertFiltersToQueryParams(filters: PropertyFilters): Record<string, string> {
  const params: Record<string, string> = {};
  
  // Price filters
  if (filters.price?.min) params.minPrice = filters.price.min.toString();
  if (filters.price?.max) params.maxPrice = filters.price.max.toString();
  
  // Room filters
  if (filters.rooms?.bedrooms?.min) params.minBedrooms = filters.rooms.bedrooms.min.toString();
  if (filters.rooms?.bedrooms?.max) params.maxBedrooms = filters.rooms.bedrooms.max.toString();
  if (filters.rooms?.bathrooms?.min) params.minBathrooms = filters.rooms.bathrooms.min.toString();
  if (filters.rooms?.bathrooms?.max) params.maxBathrooms = filters.rooms.bathrooms.max.toString();
  
  // Location filters
  if (filters.location?.country) params.country = filters.location.country;
  if (filters.location?.state) params.state = filters.location.state;
  if (filters.location?.city) params.city = filters.location.city;
  if (filters.location?.coordinates) {
    params.lat = filters.location.coordinates.lat.toString();
    params.lng = filters.location.coordinates.lng.toString();
    if (filters.location.coordinates.radius) {
      params.radius = filters.location.coordinates.radius.toString();
    }
  }
  
  // Property type filters
  if (filters.propertyType?.types) {
    params.propertyTypes = filters.propertyType.types.join(',');
  }
  
  // Features filters
  if (filters.features?.required) {
    params.requiredFeatures = filters.features.required.join(',');
  }
  if (filters.features?.preferred) {
    params.preferredFeatures = filters.features.preferred.join(',');
  }
  
  // Availability filters
  if (filters.availability?.availableFrom) {
    params.availableFrom = filters.availability.availableFrom;
  }
  if (filters.availability?.availableTo) {
    params.availableTo = filters.availability.availableTo;
  }
  if (filters.availability?.isAvailableNow !== undefined) {
    params.isAvailableNow = filters.availability.isAvailableNow.toString();
  }
  
  // Characteristics filters
  if (filters.characteristics?.isOwnerListing !== undefined) {
    params.isOwnerListing = filters.characteristics.isOwnerListing.toString();
  }
  if (filters.characteristics?.hasImages !== undefined) {
    params.hasImages = filters.characteristics.hasImages.toString();
  }
  if (filters.characteristics?.isBoundaryVerified !== undefined) {
    params.isBoundaryVerified = filters.characteristics.isBoundaryVerified.toString();
  }
  
  return params;
}

// Check if filters are empty
export function areFiltersEmpty(filters: PropertyFilters): boolean {
  return Object.values(filters).every(filter => {
    if (!filter) return true;
    if (typeof filter === 'object') {
      return Object.values(filter).every(value => {
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).every(v => v === undefined || v === null);
        }
        return value === undefined || value === null;
      });
    }
    return false;
  });
}

// Count active filters
export function countActiveFilters(filters: PropertyFilters): number {
  let count = 0;
  
  if (filters.price?.min !== undefined || filters.price?.max !== undefined) count++;
  if (filters.rooms?.bedrooms?.min !== undefined || filters.rooms?.bedrooms?.max !== undefined) count++;
  if (filters.rooms?.bathrooms?.min !== undefined || filters.rooms?.bathrooms?.max !== undefined) count++;
  if (filters.location && Object.values(filters.location).some(v => v !== undefined)) count++;
  if (filters.propertyType?.types && filters.propertyType.types.length > 0) count++;
  if (filters.features?.required && filters.features.required.length > 0) count++;
  if (filters.features?.preferred && filters.features.preferred.length > 0) count++;
  if (filters.availability && Object.values(filters.availability).some(v => v !== undefined)) count++;
  if (filters.characteristics && Object.values(filters.characteristics).some(v => v !== undefined)) count++;
  
  return count;
}