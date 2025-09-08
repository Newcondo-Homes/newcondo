import { z } from 'zod';

// Search input validation
export const searchQuerySchema = z.object({
  query: z
    .string()
    .max(200, 'Search query too long')
    .transform((val) => val.trim())
    .optional(),
  location: z
    .string()
    .max(100, 'Location query too long')
    .transform((val) => val.trim())
    .optional(),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page number too high')
    .default(1),
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit cannot exceed 50')
    .default(24), // 4 rows of 6 properties for 15" screen
});

// Sort options validation
export const sortSchema = z.object({
  sortBy: z
    .enum(['relevance', 'price', 'createdAt', 'bedrooms', 'area', 'distance'])
    .default('relevance'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

// Advanced search parameters
export const advancedSearchSchema = z.object({
  // Basic search
  ...searchQuerySchema.shape,
  
  // Pagination and sorting
  ...paginationSchema.shape,
  ...sortSchema.shape,
  
  // Location-based search
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      radius: z.number().min(0.1).max(50).optional(), // km radius
    })
    .optional(),
  
  // Property type filters
  propertyTypes: z
    .array(z.enum(['APARTMENT', 'HOUSE', 'DUPLEX', 'ROOM', 'SHARED_APARTMENT', 'OFFICE', 'SHOP', 'WAREHOUSE']))
    .max(8, 'Too many property types selected')
    .optional(),
  
  // Price range
  minPrice: z
    .number()
    .min(0, 'Minimum price cannot be negative')
    .max(50000000, 'Minimum price too high')
    .optional(),
  maxPrice: z
    .number()
    .min(0, 'Maximum price cannot be negative')
    .max(100000000, 'Maximum price too high')
    .optional(),
  
  // Room filters
  minBedrooms: z
    .number()
    .int()
    .min(0, 'Bedrooms cannot be negative')
    .max(20, 'Too many bedrooms')
    .optional(),
  maxBedrooms: z
    .number()
    .int()
    .min(0, 'Bedrooms cannot be negative')
    .max(20, 'Too many bedrooms')
    .optional(),
  minBathrooms: z
    .number()
    .int()
    .min(0, 'Bathrooms cannot be negative')
    .max(20, 'Too many bathrooms')
    .optional(),
  maxBathrooms: z
    .number()
    .int()
    .min(0, 'Bathrooms cannot be negative')
    .max(20, 'Too many bathrooms')
    .optional(),
  
  // Amenities/Features
  features: z
    .array(z.string().max(50))
    .max(20, 'Too many features selected')
    .optional(),
  
  // Availability filters
  availableFrom: z
    .string()
    .datetime()
    .optional(),
  availableTo: z
    .string()
    .datetime()
    .optional(),
  
  // Ownership type
  isOwnerListing: z.boolean().optional(),
  
  // Special filters
  hasImages: z.boolean().optional(),
  isBoundaryVerified: z.boolean().optional(),
  
  // Location hierarchy
  country: z.string().max(50).optional(),
  state: z.string().max(50).optional(),
  city: z.string().max(50).optional(),
});

// Refine the schema to add cross-field validations
export const searchParamsSchema = advancedSearchSchema.refine(
  (data) => {
    if (data.minPrice && data.maxPrice) {
      return data.minPrice <= data.maxPrice;
    }
    return true;
  },
  {
    message: 'Minimum price cannot be greater than maximum price',
    path: ['minPrice'],
  }
).refine(
  (data) => {
    if (data.minBedrooms && data.maxBedrooms) {
      return data.minBedrooms <= data.maxBedrooms;
    }
    return true;
  },
  {
    message: 'Minimum bedrooms cannot be greater than maximum bedrooms',
    path: ['minBedrooms'],
  }
).refine(
  (data) => {
    if (data.minBathrooms && data.maxBathrooms) {
      return data.minBathrooms <= data.maxBathrooms;
    }
    return true;
  },
  {
    message: 'Minimum bathrooms cannot be greater than maximum bathrooms',
    path: ['minBathrooms'],
  }
).refine(
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

// Quick search validation (for landing page search bar)
export const quickSearchSchema = z.object({
  query: z
    .string()
    .max(100, 'Search query too long')
    .transform((val) => val.trim()),
});

// Saved search validation
export const savedSearchSchema = z.object({
  name: z
    .string()
    .min(1, 'Search name is required')
    .max(100, 'Search name too long')
    .transform((val) => val.trim()),
  searchParams: searchParamsSchema,
  isActive: z.boolean().default(true),
});

// Property comparison validation
export const comparisonSchema = z.object({
  propertyIds: z
    .array(z.string().cuid())
    .min(2, 'At least 2 properties required for comparison')
    .max(4, 'Cannot compare more than 4 properties'),
});

// Types derived from schemas
export type SearchParams = z.infer<typeof searchParamsSchema>;
export type QuickSearch = z.infer<typeof quickSearchSchema>;
export type SavedSearch = z.infer<typeof savedSearchSchema>;
export type PropertyComparison = z.infer<typeof comparisonSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type SortOptions = z.infer<typeof sortSchema>;

// Validation helper functions
export function validateSearchParams(params: unknown): SearchParams {
  return searchParamsSchema.parse(params);
}

export function validateQuickSearch(query: unknown): QuickSearch {
  return quickSearchSchema.parse(query);
}

export function validateSavedSearch(search: unknown): SavedSearch {
  return savedSearchSchema.parse(search);
}

export function validateComparison(comparison: unknown): PropertyComparison {
  return comparisonSchema.parse(comparison);
}

// Safe validation that returns errors instead of throwing
export function safeValidateSearchParams(params: unknown) {
  const result = searchParamsSchema.safeParse(params);
  if (result.success) {
    return { data: result.data, error: null };
  }
  return { data: null, error: result.error };
}

export function safeValidateQuickSearch(query: unknown) {
  const result = quickSearchSchema.safeParse(query);
  if (result.success) {
    return { data: result.data, error: null };
  }
  return { data: null, error: result.error };
}