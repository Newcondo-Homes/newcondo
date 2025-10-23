// apps/platform/lib/validations/completion.ts
import { z } from 'zod';

// Image type enum
export const ImageTypeEnum = z.enum([
  'BOUNDARY',
  'EXTERIOR_FRONT',
  'EXTERIOR_BACK',
  'EXTERIOR_SIDE',
  'LIVING_ROOM',
  'BEDROOM',
  'KITCHEN',
  'BATHROOM',
  'COMPOUND',
  'STREET_VIEW',
  'OTHER'
]);

// Boundary coordinate schema
const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

// Polygon boundary schema (minimum 3 points for a valid polygon)
const polygonBoundarySchema = z
  .array(coordinateSchema)
  .min(3, 'Boundary must have at least 3 points')
  .max(100, 'Boundary cannot exceed 100 points')
  .refine(
    (coords) => {
      // Check if polygon is closed (first and last points are the same)
      const first = coords[0];
      const last = coords[coords.length - 1];
      return first.lat === last.lat && first.lng === last.lng;
    },
    { message: 'Boundary polygon must be closed (first and last points must match)' }
  );

// Upload completion image schema
export const uploadCompletionImageSchema = z.object({
  imageType: ImageTypeEnum,
  description: z
    .string()
    .max(200, 'Image description is too long')
    .optional(),
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: 'Image size must be less than 10MB'
    })
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      { message: 'Only JPEG, PNG, and WebP images are allowed' }
    )
});

export type UploadCompletionImageInput = z.infer<typeof uploadCompletionImageSchema>;

// Upload multiple images schema
export const uploadCompletionImagesSchema = z.object({
  images: z
    .array(uploadCompletionImageSchema)
    .min(5, 'Minimum 5 images required (boundary + key rooms)')
    .max(20, 'Maximum 20 images allowed'),
  
  notes: z.string().max(1000).optional()
});

export type UploadCompletionImagesInput = z.infer<typeof uploadCompletionImagesSchema>;

// Submit boundary data schema
export const submitBoundaryDataSchema = z.object({
  boundaryCoordinates: polygonBoundarySchema,
  
  centerPoint: coordinateSchema,
  
  // Building metadata
  buildingArea: z
    .number()
    .positive('Building area must be positive')
    .max(100000, 'Building area seems too large')
    .optional(), // in square meters
  
  buildingHeight: z
    .number()
    .positive()
    .max(1000, 'Building height seems too large')
    .optional(), // in meters
  
  numberOfFloors: z
    .number()
    .int()
    .positive()
    .max(200, 'Number of floors seems too large')
    .optional(),
  
  // Boundary accuracy confidence
  accuracyLevel: z
    .enum(['HIGH', 'MEDIUM', 'LOW'])
    .default('HIGH'),
  
  notes: z.string().max(500).optional()
});

export type SubmitBoundaryDataInput = z.infer<typeof submitBoundaryDataSchema>;

// Complete marking job schema
export const completeMarkingJobSchema = z.object({
  // Completion notes (mandatory)
  completionNotes: z
    .string()
    .min(20, 'Please provide detailed completion notes (minimum 20 characters)')
    .max(2000, 'Completion notes are too long'),
  
  // Confirm all required steps completed
  boundaryMarked: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Boundary must be marked before completing'
    }),
  
  imagesUploaded: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Required images must be uploaded before completing'
    }),
  
  // Property condition
  propertyCondition: z.enum([
    'EXCELLENT',
    'GOOD',
    'FAIR',
    'POOR',
    'UNDER_CONSTRUCTION'
  ]),
  
  // Property occupancy
  isOccupied: z.boolean(),
  
  // Access issues
  accessIssues: z
    .string()
    .max(500)
    .optional(),
  
  // Additional observations
  observations: z
    .string()
    .max(1000)
    .optional(),
  
  // Completion timestamp
  completedAt: z.string().datetime()
});

export type CompleteMarkingJobInput = z.infer<typeof completeMarkingJobSchema>;

// Update completion notes schema
export const updateCompletionNotesSchema = z.object({
  notes: z
    .string()
    .min(1, 'Notes cannot be empty')
    .max(2000, 'Notes are too long')
});

export type UpdateCompletionNotesInput = z.infer<typeof updateCompletionNotesSchema>;

// Save draft schema
export const saveDraftSchema = z.object({
  completionNotes: z.string().max(2000).optional(),
  
  propertyCondition: z
    .enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'UNDER_CONSTRUCTION'])
    .optional(),
  
  isOccupied: z.boolean().optional(),
  
  accessIssues: z.string().max(500).optional(),
  
  observations: z.string().max(1000).optional()
});

export type SaveDraftInput = z.infer<typeof saveDraftSchema>;

// Start marking job schema
export const startMarkingJobSchema = z.object({
  startLocation: coordinateSchema,
  
  estimatedCompletionTime: z
    .string()
    .datetime()
    .refine(
      (date) => {
        const completion = new Date(date);
        const now = new Date();
        const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        return completion <= threeHoursFromNow;
      },
      { message: 'Estimated completion must be within 3 hours' }
    )
});

export type StartMarkingJobInput = z.infer<typeof startMarkingJobSchema>;

// Validation helpers
export const validateImageCount = (images: unknown[], minRequired: number = 5) => {
  if (!Array.isArray(images)) {
    return { valid: false, message: 'Images must be an array' };
  }
  
  if (images.length < minRequired) {
    return {
      valid: false,
      message: `Minimum ${minRequired} images required. You have ${images.length}.`
    };
  }
  
  return { valid: true, message: 'Image count is valid' };
};

export const validateBoundaryPolygon = (coordinates: Array<{ lat: number; lng: number }>) => {
  if (coordinates.length < 3) {
    return { valid: false, message: 'Boundary must have at least 3 points' };
  }
  
  // Check if closed
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (first.lat !== last.lat || first.lng !== last.lng) {
    return { valid: false, message: 'Boundary polygon must be closed' };
  }
  
  // Calculate area to ensure it's not too small or too large
  const area = calculatePolygonArea(coordinates);
  if (area < 10) {
    // Less than 10 sq meters
    return { valid: false, message: 'Boundary area seems too small' };
  }
  
  if (area > 100000) {
    // More than 100,000 sq meters (10 hectares)
    return { valid: false, message: 'Boundary area seems too large' };
  }
  
  return { valid: true, message: 'Boundary is valid', area };
};

// Calculate polygon area using Shoelace formula
function calculatePolygonArea(coordinates: Array<{ lat: number; lng: number }>): number {
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n - 1; i++) {
    area += coordinates[i].lng * coordinates[i + 1].lat;
    area -= coordinates[i + 1].lng * coordinates[i].lat;
  }
  
  area = Math.abs(area) / 2;
  
  // Convert to approximate square meters (rough approximation)
  const metersPerDegree = 111320; // at equator
  return area * metersPerDegree * metersPerDegree;
}