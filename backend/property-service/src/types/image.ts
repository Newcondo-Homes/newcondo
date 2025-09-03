// Image types for property service
export interface PropertyImageUpload {
  file: Buffer | Express.Multer.File;
  filename: string;
  mimetype: string;
  size: number;
  altText?: string;
  isPrimary?: boolean;
}

export interface PropertyImageResponse {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
  propertyId: string;
  createdAt: Date;
}

export interface PropertyUnitImageResponse {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
  unitId: string;
  createdAt: Date;
}

// Image upload request types
export interface ImageUploadRequest {
  propertyId?: string;
  unitId?: string; // For unit-specific images
  altText?: string;
  isPrimary?: boolean;
  order?: number;
}

// Bulk image upload
export interface BulkImageUploadRequest {
  propertyId?: string;
  unitId?: string;
  images: {
    file: Express.Multer.File;
    altText?: string;
    isPrimary?: boolean;
    order?: number;
  }[];
}

export interface BulkImageUploadResponse {
  uploaded: PropertyImageResponse[] | PropertyUnitImageResponse[];
  failed: {
    index: number;
    filename: string;
    error: string;
  }[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Image update request
export interface ImageUpdateRequest {
  altText?: string;
  isPrimary?: boolean;
  order?: number;
}

// Image reordering
export interface ImageReorderRequest {
  imageId: string;
  newOrder: number;
}

export interface BulkImageReorderRequest {
  propertyId?: string;
  unitId?: string;
  images: {
    imageId: string;
    order: number;
  }[];
}

// Image optimization options
export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'jpg' | 'png' | 'webp';
  crop?: 'fit' | 'fill' | 'crop' | 'thumb';
}

// Image variant types for different use cases
export interface ImageVariant {
  name: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
  url: string;
  width: number;
  height: number;
  size: number; // file size in bytes
}

export interface ImageWithVariants extends PropertyImageResponse {
  variants: ImageVariant[];
}

// Image validation types
export interface ImageValidationOptions {
  maxSize: number; // in bytes
  allowedTypes: string[]; // MIME types
  maxCount?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Image metadata
export interface ImageMetadata {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  width: number;
  height: number;
  format: string;
  uploadedBy: string; // user ID
  uploadedAt: Date;
  lastModified?: Date;
  exifData?: Record<string, any>;
}

export interface DetailedImageResponse extends PropertyImageResponse {
  metadata: ImageMetadata;
  variants: ImageVariant[];
}

// Image gallery types
export interface ImageGallery {
  propertyId?: string;
  unitId?: string;
  images: PropertyImageResponse[] | PropertyUnitImageResponse[];
  primaryImage?: PropertyImageResponse | PropertyUnitImageResponse;
  totalCount: number;
}

// Image compression/processing job types
export interface ImageProcessingJob {
  id: string;
  imageId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  operations: ImageOptimizationOptions[];
  progress: number; // 0-100
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Image search/filter types
export interface ImageSearchFilters {
  propertyId?: string;
  unitId?: string;
  isPrimary?: boolean;
  mimetype?: string;
  minSize?: number;
  maxSize?: number;
  uploadedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ImageSearchResponse {
  images: PropertyImageResponse[] | PropertyUnitImageResponse[];
  total: number;
  page: number;
  limit: number;
}

// Boundary marking image types (for property marking feature)
export interface BoundaryMarkingImage {
  id: string;
  propertyId: string;
  url: string;
  imageType: 'satellite' | 'street_view' | 'ground_level';
  coordinates?: {
    latitude: number;
    longitude: number;
    zoom?: number;
    heading?: number; // for street view
    pitch?: number; // for street view
  };
  markingData?: {
    boundaryPoints: Array<{
      lat: number;
      lng: number;
    }>;
    maskCoordinates?: Array<{
      lat: number;
      lng: number;
    }>;
  };
  verifiedBy?: string; // agent or user ID
  verifiedAt?: Date;
  createdAt: Date;
}

// Image deletion types
export interface ImageDeletionRequest {
  imageId: string;
  reason?: string;
}

export interface BulkImageDeletionRequest {
  imageIds: string[];
  reason?: string;
}

export interface ImageDeletionResponse {
  deleted: string[];
  failed: {
    imageId: string;
    error: string;
  }[];
}

// Error types specific to images
export type ImageError = {
  code: 'INVALID_FILE' | 'FILE_TOO_LARGE' | 'UNSUPPORTED_TYPE' | 'UPLOAD_FAILED' | 'NOT_FOUND' | 'PROCESSING_FAILED';
  message: string;
  field?: string;
  details?: Record<string, any>;
};