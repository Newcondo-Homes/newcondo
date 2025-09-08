// apps/platform/types/property.ts

import { PropertyType, PropertyStatus, PropertyStructure, UnitStatus, AdminApprovalStatus } from '@newcondo/db';

// Base property interface matching Prisma schema
export interface Property {
  id: string;
  title: string;
  description: string;
  structure: PropertyStructure;
  
  // Pricing (for single units)
  price?: number;
  currency: string;
  
  // Location
  address: string;
  city: string;
  state: string;
  country: string;
  gpsCoordinates?: string;
  
  // Property boundaries
  boundaryCoordinates?: any;
  boundaryVerified: boolean;
  boundaryMarkedBy?: string;
  boundaryMarkedAt?: Date;
  boundaryImages: string[];
  buildingFingerprint?: string;
  
  // Multi-family building details
  totalUnits?: number;
  availableUnits?: number;
  buildingFeatures: string[];
  
  // Single unit details
  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  
  // Ownership
  ownerId: string;
  agentId?: string;
  isOwnerListing: boolean;
  
  // Status
  status: PropertyStatus;
  adminApprovalStatus: AdminApprovalStatus;
  rejectionReason?: string;
  approvedAt?: Date;
  approvedBy?: string;
  
  // Availability
  isAvailable: boolean;
  availableFrom?: Date;
  isPaymentLocked: boolean;
  paymentLockExpiry?: Date;
  
  // Marketing
  shareableLink?: string;
  viewCount: number;
  favoriteCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Property unit interface for multi-family buildings
export interface PropertyUnit {
  id: string;
  propertyId: string;
  unitNumber: string;
  floor?: number;
  
  // Unit details
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  
  // Pricing
  price: number;
  currency: string;
  
  // Availability
  status: UnitStatus;
  isAvailable: boolean;
  availableFrom?: Date;
  isPaymentLocked: boolean;
  paymentLockExpiry?: Date;
  
  // Images
  images: PropertyUnitImage[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyUnitImage {
  id: string;
  unitId: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
  createdAt: Date;
}

export interface PropertyImage {
  id: string;
  propertyId: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
  createdAt: Date;
}

// Enhanced property interface with related data
export interface PropertyWithDetails extends Property {
  images: PropertyImage[];
  units?: PropertyUnit[];
  owner?: {
    id: string;
    name?: string;
    email: string;
    verificationStatus: string;
  };
  agent?: {
    id: string;
    name?: string;
    email: string;
    verificationStatus: string;
  };
  _count?: {
    images: number;
    units: number;
  };
}

// Property card interface for listings
export interface PropertyCard {
  id: string;
  title: string;
  price?: number;
  currency: string;
  city: string;
  state: string;
  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  primaryImage?: string;
  imagesCount: number;
  isAvailable: boolean;
  structure: PropertyStructure;
  totalUnits?: number;
  availableUnits?: number;
  viewCount: number;
  favoriteCount: number;
  createdAt: Date;
  
  // For multi-family properties, show price range
  priceRange?: {
    min: number;
    max: number;
  };
  
  // Units preview for multi-family
  unitsPreviw?: Array<{
    unitNumber: string;
    bedrooms?: number;
    price: number;
    isAvailable: boolean;
  }>;
}

// Property comparison interface
export interface PropertyComparison {
  properties: PropertyWithDetails[];
  comparisonFields: ComparisonField[];
}

export interface ComparisonField {
  field: keyof PropertyWithDetails;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'array' | 'currency' | 'date';
  important?: boolean;
}

// Property sharing interface
export interface PropertyShare {
  id: string;
  propertyId: string;
  shareableLink: string;
  platform?: 'whatsapp' | 'telegram' | 'email' | 'sms' | 'copy';
  sharedAt: Date;
}

// Property favorites interface
export interface PropertyFavorite {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: Date;
  property?: PropertyCard;
}

// Form interfaces for creating/editing properties
export interface PropertyFormData {
  title: string;
  description: string;
  structure: PropertyStructure;
  
  // Location
  address: string;
  city: string;
  state: string;
  country?: string;
  gpsCoordinates?: {
    lat: number;
    lng: number;
  };
  
  // For single units
  price?: number;
  currency?: string;
  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  
  // For multi-family buildings
  totalUnits?: number;
  buildingFeatures: string[];
  units?: Array<{
    unitNumber: string;
    floor?: number;
    bedrooms?: number;
    bathrooms?: number;
    area?: string;
    features: string[];
    price: number;
  }>;
  
  // Images
  images: File[] | string[];
  unitImages?: Record<string, File[] | string[]>; // keyed by unit number
  
  // Ownership
  isOwnerListing: boolean;
  agentId?: string;
  
  // Availability
  isAvailable: boolean;
  availableFrom?: Date;
}

// Property listing status
export interface PropertyListingStatus {
  status: PropertyStatus;
  adminApprovalStatus: AdminApprovalStatus;
  isPublic: boolean;
  canEdit: boolean;
  canDelete: boolean;
  pendingChanges?: string[];
  rejectionReason?: string;
}

// Property analytics
export interface PropertyAnalytics {
  propertyId: string;
  views: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
  };
  favorites: {
    total: number;
    thisMonth: number;
  };
  inquiries: {
    total: number;
    thisMonth: number;
  };
  performanceScore: number; // 0-100
  suggestedImprovements: string[];
}

// Boundary verification
export interface PropertyBoundary {
  coordinates: Array<{
    lat: number;
    lng: number;
  }>;
  verified: boolean;
  markedBy?: string;
  markedAt?: Date;
  images: string[];
  area?: number; // in square meters
}

// Property availability schedule
export interface PropertyAvailability {
  propertyId: string;
  unitId?: string;
  isAvailable: boolean;
  availableFrom?: Date;
  availableUntil?: Date;
  restrictions?: string[];
  minimumStay?: number; // in months
  maximumStay?: number; // in months
}

// Export commonly used types
export type {
  PropertyType,
  PropertyStatus,
  PropertyStructure,
  UnitStatus,
  AdminApprovalStatus
} from '@newcondo/db';