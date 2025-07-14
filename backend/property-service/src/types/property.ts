// backend/property-service/src/types/property.ts

import { Property, PropertyType, PropertyStructure, PropertyStatus, AdminApprovalStatus, PropertyImage, PropertyUnit, User } from '@newcondo/db';

export interface GPSCoordinates {
  lat: number;
  lng: number;
}

export interface BoundaryData {
  isVerified: boolean;
  markedBy?: string;
  markedAt?: Date;
  images: string[];
}

export interface PropertyWithBoundary extends Omit<Property, 'gpsCoordinates'> {
  gpsCoordinates: GPSCoordinates | null;
  boundaryCoordinates: any;
  boundaryData: BoundaryData;
  owner: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  agent?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  images: PropertyImage[];
  units: (PropertyUnit & { images: any[] })[];
}

export interface PropertyCreateData {
  title: string;
  description: string;
  price?: number;
  currency?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  gpsCoordinates?: GPSCoordinates;
  boundaryCoordinates?: any;
  structure?: PropertyStructure;
  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features?: string[];
  buildingFeatures?: string[];
  totalUnits?: number;
  availableUnits?: number;
  agentId?: string;
  isOwnerListing?: boolean;
  isAvailable?: boolean;
  availableFrom?: Date;
  units?: PropertyUnitCreateData[];
}

export interface PropertyUpdateData {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  gpsCoordinates?: GPSCoordinates;
  boundaryCoordinates?: any;
  structure?: PropertyStructure;
  propertyType?: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features?: string[];
  buildingFeatures?: string[];
  totalUnits?: number;
  availableUnits?: number;
  isAvailable?: boolean;
  availableFrom?: Date;
}

export interface PropertyUnitCreateData {
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

export interface PropertySearchFilters {
  query?: string;
  city?: string;
  state?: string;
  propertyType?: PropertyType;
  structure?: PropertyStructure;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  features?: string[];
  boundingBox?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  onlyVerifiedBoundaries?: boolean;
  page?: number;
  limit?: number;
}

export interface PropertyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PropertyStatistics {
  totalProperties: number;
  publishedProperties: number;
  pendingApproval: number;
  verifiedBoundaries: number;
  propertiesWithImages: number;
  averagePrice: number;
  propertiesByType: Record<PropertyType, number>;
  propertiesByCity: Record<string, number>;
  propertiesByState: Record<string, number>;
}

export interface PropertyAnalytics {
  propertyId: string;
  views: number;
  favorites: number;
  inquiries: number;
  bookings: number;
  averageViewTime: number;
  conversionRate: number;
  topSources: string[];
  peakViewingTimes: string[];
}

export interface PropertyLocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  gpsCoordinates: GPSCoordinates;
  boundaryCoordinates?: any;
  neighborhood?: string;
  landmarks?: string[];
  nearbyPlaces?: {
    name: string;
    type: string;
    distance: number;
  }[];
}

export interface PropertyMarketData {
  averagePriceInArea: number;
  pricePerSqm: number;
  marketTrend: 'rising' | 'falling' | 'stable';
  daysOnMarket: number;
  competitiveProperties: number;
  priceRecommendation: {
    min: number;
    max: number;
    recommended: number;
  };
}

export interface PropertyVerificationData {
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  documentsSubmitted: string[];
  boundaryVerified: boolean;
  ownershipVerified: boolean;
  legalDocsVerified: boolean;
  structuralIntegrityVerified: boolean;
}