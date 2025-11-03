// backend/property-service/src/types/propertyManagement.ts

import { Property, PropertyUnit, PropertyStatus, PropertyStructure, UnitStatus } from '@prisma/client';

export interface PropertyWithDetails extends Property {
  units?: PropertyUnit[];
  images: Array<{
    id: string;
    url: string;
    altText?: string;
    isPrimary: boolean;
  }>;
  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  agent?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  _count?: {
    rentals: number;
    views: number;
  };
}

export interface PropertyUpdateInput {
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
  isAvailable?: boolean;
  availableFrom?: Date;
  structure?: PropertyStructure;
  totalUnits?: number;
}

export interface PropertyUnitUpdateInput {
  unitNumber?: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features?: string[];
  price?: number;
  isAvailable?: boolean;
  availableFrom?: Date;
  status?: UnitStatus;
}

export interface PropertyManagementFilters {
  status?: PropertyStatus;
  isAvailable?: boolean;
  propertyType?: string;
  city?: string;
  state?: string;
  structure?: PropertyStructure;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'price' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface BoundaryUpdateInput {
  boundaryCoordinates: {
    type: 'Polygon';
    coordinates: number[][][]; // GeoJSON format
  };
  boundaryImages: string[];
}

export interface PropertyOwnershipVerification {
  isOwner: boolean;
  isAgent: boolean;
  hasAccess: boolean;
  role: 'OWNER' | 'AGENT' | null;
}

export interface PropertyManagementDashboard {
  totalProperties: number;
  activeProperties: number;
  rentedProperties: number;
  draftProperties: number;
  pendingApproval: number;
  totalViews: number;
  totalEarnings: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
}

export interface UnitManagementData {
  propertyId: string;
  totalUnits: number;
  availableUnits: number;
  occupiedUnits: number;
  units: Array<PropertyUnit & {
    currentRental?: {
      id: string;
      startDate: Date;
      endDate?: Date;
      renter: {
        name: string;
        email: string;
      };
    } | null;
  }>;
}

export interface PropertyMarketingData {
  shareableLink: string;
  qrCodeUrl?: string;
  promotionStatus: 'PUBLIC' | 'PERMISSION_BASED' | 'RESTRICTED' | 'REQUEST_BASED';
  totalShares: number;
  sharesByPlatform: {
    platform: string;
    count: number;
  }[];
  subAgents?: Array<{
    id: string;
    name: string;
    sharesCount: number;
    viewsGenerated: number;
    conversions: number;
  }>;
}

export interface PropertyHistoricalData {
  property: PropertyWithDetails;
  rentalHistory: Array<{
    id: string;
    startDate: Date;
    endDate?: Date;
    monthlyRent: number;
    renterName: string;
    status: string;
  }>;
  maintenanceHistory?: Array<{
    date: Date;
    description: string;
    cost?: number;
  }>;
  priceHistory: Array<{
    date: Date;
    price: number;
    reason?: string;
  }>;
}

export interface MarkingServiceHistory {
  propertyId: string;
  markingJobs: Array<{
    id: string;
    status: string;
    requestedAt: Date;
    completedAt?: Date;
    assignedAgent?: {
      name: string;
      phone?: string;
    };
    markingFee: number;
    completionImages: string[];
    completionNotes?: string;
  }>;
}