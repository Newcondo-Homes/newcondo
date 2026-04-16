// apps/platform/types/propertyManagement.ts

import type {
  PropertyPromotionType,
  PropertyManagementView,
  AnalyticsTimePeriod,
} from '@/lib/constants/propertyManagement';
import type {
  PropertyStatus,
  AdminApprovalStatus,
  UnitStatus,
  PropertyStructure,
} from '@/lib/constants/propertyStatus';

/**
 * Property Management Types
 * Type definitions for property management features
 */
export interface PropertyDetailsResponse {
  property: ManagedProperty;
  units: PropertyUnit[];
  owner: {
    id: string;
    name: string | null;
    email: string;
    phone?: string | null;
    image?: string | null;
  };
  agent?: {
    id: string;
    name: string | null;
    email: string;
    phone?: string | null;
    image?: string | null;
  } | null;
  analytics?: {
    totalViews: number;
    totalFavorites: number;
    totalShares: number;
    totalInquiries: number;
  };
  rentals: {
    id: string;
    startDate: Date;
    endDate?: Date;
    monthlyRent: number;
    status: string;
    renter: { id: string; name: string | null; email: string };
  }[];
  markingHistory: {
    id: string;
    status: string;
    createdAt: Date;
    completedAt?: Date;
    assignedAgent?: { id: string; name: string | null } | null;
  }[];
  isOwner: boolean;
  isAgent: boolean;
  canEdit: boolean;
}


// Base property interface for management
export interface ManagedProperty {
  id: string;
  title: string;
  description: string;
  structure: PropertyStructure;
  price?: number;
  currency: string;
  
  // Location
  address: string;
  city: string;
  state: string;
  country: string;
  gpsCoordinates?: string;
  
  // Boundary information
  boundaryCoordinates?: Record<string, any>;
  boundaryVerified: boolean;
  boundaryMarkedBy?: string;
  boundaryMarkedAt?: Date;
  boundaryImages: string[];
  
  // Building details (for multi-family)
  totalUnits?: number;
  availableUnits?: number;
  buildingFeatures: string[];
  
  // Property details (for single units)
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  
  // Ownership & Agency
  ownerId: string;
  agentId?: string;
  isOwnerListing: boolean;
  
  // Media
  images: PropertyImage[];
  
  // Status
  status: PropertyStatus;
  adminApprovalStatus: AdminApprovalStatus;
  rejectionReason?: string;
  approvedAt?: Date;
  
  // Availability
  isAvailable: boolean;
  availableFrom?: Date;
  isPaymentLocked: boolean;
  
  // Marketing
  shareableLink?: string;
  viewCount: number;
  favoriteCount: number;
  promotionType?: PropertyPromotionType;
  allowPromotion: boolean;
  
  // Units (for multi-family)
  units?: PropertyUnit[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Property image interface
export interface PropertyImage {
  id: string;
  propertyId: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
  createdAt: Date;
}

// Property unit interface
export interface PropertyUnit {
  id: string;
  propertyId: string;
  unitNumber: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  price: number;
  currency: string;
  status: UnitStatus;
  isAvailable: boolean;
  availableFrom?: Date;
  isPaymentLocked: boolean;
  images: PropertyUnitImage[];
  createdAt: Date;
  updatedAt: Date;
}

// Property unit image interface
export interface PropertyUnitImage {
  id: string;
  unitId: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
  createdAt: Date;
}

// Property list filters
export interface PropertyListFilters {
  status?: PropertyStatus[];
  structure?: PropertyStructure[];
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  hasAgent?: boolean;
  boundaryVerified?: boolean;
  search?: string
  isAvailable?: boolean;
  searchQuery?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'viewCount' | 'price' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Property list response
export interface PropertyListResponse {
  properties: ManagedProperty[];
  totalCount: number;         // was: total
  totalPages: number;
  currentPage: number;        // was: page
  pageSize: number;
  hasNextPage: boolean;       // add
  hasPreviousPage: boolean;   // add
  stats: {
    totalProperties: number;
    publishedProperties: number;
    draftProperties: number;
    rentedProperties: number;
    availableProperties: number;
    totalViews: number;
    totalUnits: number;
    availableUnits: number;
  };
}

// Property statistics
export interface PropertyStatistics {
  totalProperties: number;
  publishedProperties: number;
  draftProperties: number;
  rentedProperties: number;
  totalViews: number;
  totalFavorites: number;
  totalEarnings: number;
  averageConversionRate: number;
}

// Property promotion settings
export interface PropertyPromotionSettings {
  propertyId: string;
  promotionType: PropertyPromotionType;
  allowPublicSharing: boolean;
  requirePermission: boolean;
  approvedAgents: string[];
  pendingRequests: SubAgentRequest[];
}

// Sub-agent request
export interface SubAgentRequest {
  id: string;
  propertyId: string;
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentPhone?: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  requestedAt: Date;
  respondedAt?: Date;
}

// Property boundary update
export interface PropertyBoundaryUpdate {
  propertyId: string;
  boundaryCoordinates: Record<string, any>;
  boundaryImages: string[];
  notes?: string;
}

// Property marketing data
export interface PropertyMarketingData {
  propertyId: string;
  shareableLink: string;
  qrCodeUrl?: string;
  socialMediaLinks: {
    facebook?: string;
    twitter?: string;
    whatsapp?: string;
    instagram?: string;
  };
  emailTemplate?: string;
}

// Property dashboard data
export interface PropertyDashboardData {
  properties: ManagedProperty[];
  totalCount: number;
  stats: {
    totalProperties: number;
    publishedProperties: number;
    draftProperties: number;
    rentedProperties: number;
    availableProperties: number;
    totalViews: number;
    totalUnits: number;
    availableUnits: number;
  };
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  // Keep summary fields for dashboard widgets
  pendingApprovals: number;
  unverifiedBoundaries: number;
  activeRentals: number;
  pendingConfirmations: number;
  topPerformingProperties: ManagedProperty[];
  recentProperties: ManagedProperty[];
}

// Property management action
export interface PropertyManagementAction {
  type: 'edit' | 'view' | 'share' | 'archive' | 'delete' | 'promote' | 'boundary';
  propertyId: string;
  metadata?: Record<string, any>;
}

// Property update payload
export interface PropertyUpdatePayload {
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
  availableFrom?: Date;
  promotionType?: PropertyPromotionType;
}

// Unit creation payload
export interface UnitCreationPayload {
  propertyId: string;
  unitNumber: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  price: number;
  availableFrom?: Date;
  images?: File[];
}

// Unit update payload
export interface UnitUpdatePayload {
  unitNumber?: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features?: string[];
  price?: number;
  status?: UnitStatus;
  availableFrom?: Date;
}

// Property view data for management interface
export interface PropertyManagementViewData {
  currentView: PropertyManagementView;
  filters: PropertyListFilters;
  selectedProperties: string[];
  sortBy: 'createdAt' | 'updatedAt' | 'price' | 'views' | 'title';
  sortOrder: 'asc' | 'desc';
}

// Bulk action payload
export interface BulkPropertyAction {
  action: 'publish' | 'unpublish' | 'archive' | 'delete' | 'update_promotion';
  propertyIds: string[];
  payload?: Record<string, any>;
}

// Property validation errors
export interface PropertyValidationErrors {
  title?: string;
  description?: string;
  price?: string;
  address?: string;
  propertyType?: string;
  images?: string;
  boundary?: string;
  units?: Record<string, string>;
}

// Export type for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Property management context type
export interface PropertyManagementContextType {
  properties: ManagedProperty[];
  loading: boolean;
  error: string | null;
  filters: PropertyListFilters;
  statistics: PropertyStatistics | null;
  selectedView: PropertyManagementView;
  fetchProperties: (filters?: PropertyListFilters) => Promise<void>;
  refreshProperties: () => Promise<void>;
  updateProperty: (id: string, payload: PropertyUpdatePayload) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  setFilters: (filters: PropertyListFilters) => void;
  setSelectedView: (view: PropertyManagementView) => void;
}

// Export all types
export type {
  PropertyPromotionType,
  PropertyManagementView,
  PropertyStatus,
  AdminApprovalStatus,
  UnitStatus,
  PropertyStructure,
  AnalyticsTimePeriod,
};