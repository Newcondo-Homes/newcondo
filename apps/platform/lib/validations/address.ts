// apps/platform/lib/validations/address.ts

import { z } from 'zod';

/**
 * Nigerian states enum
 */
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'Federal Capital Territory', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
  'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun',
  'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
] as const;

/**
 * Hierarchical address schema for Nigerian locations
 */
export const hierarchicalAddressSchema = z.object({
  // Country (fixed)
  country: z.literal('Nigeria'),
  
  // State (top level)
  state: z.enum([...NIGERIAN_STATES], {
    errorMap: () => ({ message: 'Please select a valid Nigerian state' }),
  }),
  
  // City/LGA (second level)
  lga: z
    .string()
    .min(2, 'LGA must be at least 2 characters')
    .max(100, 'LGA must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'LGA can only contain letters, spaces, hyphens, and apostrophes'),
  
  // Location/Area (third level - most specific)
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(150, 'Location must not exceed 150 characters'),
  
  // Street address (optional additional detail)
  streetAddress: z
    .string()
    .max(200, 'Street address must not exceed 200 characters')
    .optional(),
  
  // Landmark (optional)
  landmark: z
    .string()
    .max(150, 'Landmark must not exceed 150 characters')
    .optional(),
  
  // Postal code (optional for Nigeria)
  postalCode: z
    .string()
    .regex(/^\d{6}$/, 'Postal code must be 6 digits')
    .optional(),
});

/**
 * GPS coordinates schema
 */
export const gpsCoordinatesSchema = z.object({
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  
  accuracy: z
    .number()
    .positive('Accuracy must be positive')
    .optional(),
  
  altitude: z.number().optional(),
  
  heading: z
    .number()
    .min(0)
    .max(360)
    .optional(),
});

/**
 * Complete property address schema (with GPS)
 */
export const propertyAddressSchema = z.object({
  // Hierarchical address
  hierarchicalAddress: hierarchicalAddressSchema,
  
  // GPS coordinates
  coordinates: gpsCoordinatesSchema,
  
  // Formatted full address (generated)
  formattedAddress: z.string().optional(),
  
  // Plus code (Google Maps)
  plusCode: z.string().optional(),
  
  // Place ID (Google Maps)
  placeId: z.string().optional(),
});

/**
 * Address search/autocomplete schema
 */
export const addressSearchSchema = z.object({
  query: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(200, 'Search query must not exceed 200 characters'),
  
  state: z.enum([...NIGERIAN_STATES]).optional(),
  
  lga: z.string().optional(),
  
  limit: z
    .number()
    .int()
    .positive()
    .max(20)
    .default(10),
  
  includeCoordinates: z.boolean().default(false),
});

/**
 * Service area schema (for agents)
 */
export const serviceAreaSchema = z.object({
  state: z.enum([...NIGERIAN_STATES]),
  
  lgas: z
    .array(z.string())
    .min(1, 'At least one LGA must be selected')
    .max(50, 'Maximum 50 LGAs allowed'),
  
  locations: z
    .array(z.string())
    .optional(),
  
  // Radius from central point (in kilometers)
  serviceRadius: z
    .number()
    .positive('Service radius must be positive')
    .max(100, 'Service radius cannot exceed 100km')
    .optional(),
  
  // Central coordinates for radius-based coverage
  centerCoordinates: gpsCoordinatesSchema.optional(),
});

/**
 * Update service areas schema (for agents)
 */
export const updateServiceAreasSchema = z.object({
  serviceAreas: z
    .array(serviceAreaSchema)
    .min(1, 'At least one service area is required')
    .max(10, 'Maximum 10 service areas allowed'),
  
  isAvailableForMarking: z.boolean().default(true),
});

/**
 * Proximity search schema
 */
export const proximitySearchSchema = z.object({
  // Target location
  targetCoordinates: gpsCoordinatesSchema,
  
  // Search radius in kilometers
  radiusKm: z
    .number()
    .positive('Radius must be positive')
    .max(50, 'Maximum radius is 50km')
    .default(10),
  
  // Filter by state/LGA
  state: z.enum([...NIGERIAN_STATES]).optional(),
  
  lga: z.string().optional(),
  
  // Filter by agent availability
  availableAgentsOnly: z.boolean().default(true),
  
  // Filter by agent rating
  minRating: z
    .number()
    .min(0)
    .max(5)
    .optional(),
  
  // Pagination
  page: z.number().int().positive().default(1),
  
  limit: z.number().int().positive().max(50).default(20),
});

/**
 * Validate address schema
 */
export const validateAddressSchema = z.object({
  address: hierarchicalAddressSchema,
  
  coordinates: gpsCoordinatesSchema.optional(),
  
  verifyWithGoogleMaps: z.boolean().default(true),
});

/**
 * Geocode address schema (convert address to coordinates)
 */
export const geocodeAddressSchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters'),
  
  state: z.enum([...NIGERIAN_STATES]).optional(),
  
  country: z.literal('Nigeria').default('Nigeria'),
});

/**
 * Reverse geocode schema (convert coordinates to address)
 */
export const reverseGeocodeSchema = z.object({
  coordinates: gpsCoordinatesSchema,
  
  language: z.enum(['en', 'yo', 'ig', 'ha']).default('en'),
});

// Type exports
export type HierarchicalAddress = z.infer<typeof hierarchicalAddressSchema>;
export type GPSCoordinates = z.infer<typeof gpsCoordinatesSchema>;
export type PropertyAddress = z.infer<typeof propertyAddressSchema>;
export type AddressSearchInput = z.infer<typeof addressSearchSchema>;
export type ServiceArea = z.infer<typeof serviceAreaSchema>;
export type UpdateServiceAreasInput = z.infer<typeof updateServiceAreasSchema>;
export type ProximitySearchInput = z.infer<typeof proximitySearchSchema>;
export type ValidateAddressInput = z.infer<typeof validateAddressSchema>;
export type GeocodeAddressInput = z.infer<typeof geocodeAddressSchema>;
export type ReverseGeocodeInput = z.infer<typeof reverseGeocodeSchema>;

// Helper type for state selection
export type NigerianState = typeof NIGERIAN_STATES[number];