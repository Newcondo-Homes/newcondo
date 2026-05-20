import { PropertyStatus, PropertyType, PropertyStructure, UnitStatus } from '@newcondo/db';

export interface PropertyManagementFilters {
  status?: PropertyStatus;
  propertyType?: PropertyType;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface PropertyListingData {
  id: string;
  title: string;
  description: string;
  status: PropertyStatus;
  propertyType: PropertyType;
  structure: PropertyStructure;
  price?: number;
  currency: string;
  address: string;
  city: string;
  state: string;
  images: PropertyImageData[];
  viewCount: number;
  favoriteCount: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyImageData {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

export interface PropertyUnitData {
  id: string;
  unitNumber: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  price: number;
  status: UnitStatus;
  isAvailable: boolean;
  images: PropertyUnitImageData[];
}

export interface PropertyUnitImageData {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

export interface PropertyDashboardStats {
  totalProperties: number;
  activeListings: number;
  draftListings: number;
  rentedProperties: number;
  pendingApproval: number;
  totalViews: number;
  totalRevenue: number;
  occupancyRate: number;
}

export interface RentalHistoryData {
  id: string;
  propertyId: string;
  propertyTitle: string;
  unitId?: string;
  unitNumber?: string;
  renterId: string;
  renterName: string;
  renterEmail: string;
  startDate: Date;
  endDate?: Date;
  monthlyRent: number;
  status: string;
  isConfirmed: boolean;
  confirmedAt?: Date;
  totalPaid: number;
}

export interface PropertyPerformanceData {
  propertyId: string;
  views: number;
  favorites: number;
  rentals: number;
  revenue: number;
  averageRating?: number;
  conversionRate: number;
}

export interface PropertyAgentReferralData {
  agentId: string;
  agentName: string;
  agentEmail: string;
  propertyId: string;
  propertyTitle: string;
  referralLink: string;
  viewCount: number;
  conversionCount: number;
  totalCommission: number;
  isActive: boolean;
  createdAt: Date;
}

export interface CommissionEarningData {
  propertyId: string;
  propertyTitle: string;
  rentalId: string;
  rentAmount: number;
  commissionAmount: number;
  commissionType: 'listing_agent' | 'sub_agent';
  isPaid: boolean;
  paidAt?: Date;
  status: string;
}

export interface PropertyBoundaryData {
  propertyId: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  boundaryCoordinates: Array<{
    lat: number;
    lng: number;
  }>;
  boundaryVerified: boolean;
  boundaryMarkedBy?: string;
  boundaryMarkedAt?: Date;
  buildingFingerprint?: string;
}

export interface PropertyMarketingData {
  propertyId: string;
  shareableLink: string;
  promotionLinks: Array<{
    agentId: string;
    link: string;
    createdAt: Date;
  }>;
  socialShareLinks: {
    facebook: string;
    twitter: string;
    whatsapp: string;
    telegram: string;
    linkedin: string;
  };
  qrCodeUrl?: string;
}

export interface TenantManagementData {
  rentalId: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  propertyTitle: string;
  unitNumber?: string;
  startDate: Date;
  endDate?: Date;
  monthlyRent: number;
  status: string;
  paymentHistory: TenantPaymentData[];
}

export interface TenantPaymentData {
  paymentId: string;
  amount: number;
  paymentDate: Date;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
}

export interface PropertyUpdateData {
  title?: string;
  description?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features?: string[];
  isAvailable?: boolean;
  availableFrom?: Date;
}

export interface PropertyShareSettings {
  allowPublicSharing: boolean;
  allowAgentPromotion: boolean;
  promotionType: 'public' | 'permission_based' | 'restricted' | 'request_based';
  approvedAgents?: string[];
}

export interface MarkingServiceHistory {
  jobId: string;
  propertyId: string;
  propertyTitle: string;
  status: string;
  requestedAt: Date;
  assignedAgentId?: string;
  assignedAgentName?: string;
  completedAt?: Date;
  markingFee: number;
  paymentStatus: string;
}

export interface PropertyAnalyticsData {
  propertyId: string;
  period: string;
  metrics: {
    views: number;
    uniqueViews: number;
    favorites: number;
    shares: number;
    inquiries: number;
    bookings: number;
    conversionRate: number;
  };
  demographics?: {
    topCities: Array<{ city: string; count: number }>;
    deviceTypes: Array<{ type: string; count: number }>;
    sources: Array<{ source: string; count: number }>;
  };
}

export interface PropertyComparisonData {
  properties: Array<{
    id: string;
    title: string;
    price: number;
    views: number;
    rentals: number;
    revenue: number;
    conversionRate: number;
  }>;
  averages: {
    avgPrice: number;
    avgViews: number;
    avgRentals: number;
    avgRevenue: number;
    avgConversionRate: number;
  };
}