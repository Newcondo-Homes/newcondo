/**
 * Admin Dashboard - Property Types
 * Location: apps/admin/src/types/property.ts
 */

export enum PropertyType {
  APARTMENT = "APARTMENT",
  HOUSE = "HOUSE",
  DUPLEX = "DUPLEX",
  ROOM = "ROOM",
  SHARED_APARTMENT = "SHARED_APARTMENT",
  OFFICE = "OFFICE",
  SHOP = "SHOP",
  WAREHOUSE = "WAREHOUSE",
}

export enum PropertyStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  PUBLISHED = "PUBLISHED",
  RENTED = "RENTED",
  UNAVAILABLE = "UNAVAILABLE",
}

export enum AdminApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum PropertyStructure {
  SINGLE_UNIT = "SINGLE_UNIT",
  MULTI_FAMILY = "MULTI_FAMILY",
}

export enum UnitStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  MAINTENANCE = "MAINTENANCE",
  RESERVED = "RESERVED",
}

export interface Property {
  id: string;
  title: string;
  description: string;
  structure: PropertyStructure;
  
  // Pricing
  price: number | null;
  currency: string;
  
  // Location
  address: string;
  city: string;
  state: string;
  country: string;
  gpsCoordinates: string | null;
  
  // Boundary Information
  boundaryCoordinates: any | null;
  boundaryVerified: boolean;
  boundaryMarkedBy: string | null;
  boundaryMarkedAt: Date | null;
  boundaryImages: string[];
  buildingFingerprint: string | null;
  
  // Building-level (multi-family)
  totalUnits: number | null;
  availableUnits: number | null;
  buildingFeatures: string[];
  
  // Property details (single unit)
  propertyType: PropertyType;
  bedrooms: number | null;
  bathrooms: number | null;
  area: string | null;
  features: string[];
  
  // Ownership
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string;
  agentId: string | null;
  agentName: string | null;
  isOwnerListing: boolean;
  
  // Media
  images: PropertyImage[];
  
  // Status
  status: PropertyStatus;
  adminApprovalStatus: AdminApprovalStatus;
  rejectionReason: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  
  // Availability
  isAvailable: boolean;
  availableFrom: Date | null;
  isPaymentLocked: boolean;
  paymentLockExpiry: Date | null;
  
  // Sharing
  shareableLink: string | null;
  viewCount: number;
  favoriteCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyImage {
  id: string;
  propertyId: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  order: number;
  createdAt: Date;
}

export interface PropertyUnit {
  id: string;
  propertyId: string;
  unitNumber: string;
  floor: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: string | null;
  features: string[];
  price: number;
  currency: string;
  status: UnitStatus;
  isAvailable: boolean;
  availableFrom: Date | null;
  isPaymentLocked: boolean;
  paymentLockExpiry: Date | null;
  images: PropertyUnitImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyUnitImage {
  id: string;
  unitId: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  order: number;
  createdAt: Date;
}

export interface PropertyListItem {
  id: string;
  title: string;
  propertyType: PropertyType;
  structure: PropertyStructure;
  price: number | null;
  city: string;
  state: string;
  ownerName: string | null;
  adminApprovalStatus: AdminApprovalStatus;
  status: PropertyStatus;
  boundaryVerified: boolean;
  createdAt: Date;
}

export interface PropertyDetails extends Property {
  units: PropertyUnit[];
  documents: any[];
  rentals: number;
  totalRevenue: number;
  duplicateReports: number;
}

export interface PropertyApprovalAction {
  propertyId: string;
  action: "approve" | "reject";
  reason?: string;
  notes?: string;
  approvedBy: string;
}

export interface BulkPropertyAction {
  propertyIds: string[];
  action: "approve" | "reject" | "delete" | "unpublish";
  reason?: string;
  notes?: string;
}

export interface PropertyFilters {
  search?: string;
  status?: PropertyStatus;
  adminApprovalStatus?: AdminApprovalStatus;
  propertyType?: PropertyType;
  structure?: PropertyStructure;
  city?: string;
  state?: string;
  boundaryVerified?: boolean;
  priceMin?: number;
  priceMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  ownerId?: string;
  agentId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PropertyStats {
  totalProperties: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  published: number;
  rented: number;
  boundaryVerified: number;
  boundaryUnverified: number;
  multiFamily: number;
  singleUnit: number;
}

export interface BoundaryInfo {
  propertyId: string;
  coordinates: any;
  verified: boolean;
  markedBy: string | null;
  markedAt: Date | null;
  images: string[];
  fingerprint: string | null;
}

export interface PropertyValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  boundaryChecks: {
    hasCoordinates: boolean;
    isVerified: boolean;
    hasFingerprint: boolean;
    hasImages: boolean;
  };
  documentChecks: {
    hasOwnershipDoc: boolean;
    hasConsentDoc: boolean;
    hasUndertaking: boolean;
  };
}