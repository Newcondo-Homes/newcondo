// backend/property-service/src/types/filters.ts

export interface FilterOptions {
  priceRange: PriceRangeFilter;
  propertyTypes: PropertyTypeFilter[];
  bedrooms: BedroomFilter[];
  bathrooms: BathroomFilter[];
  features: FeatureFilter[];
  locations: LocationFilter[];
  verification: VerificationFilter;
  availability: AvailabilityFilter;
}

export interface PriceRangeFilter {
  min: number;
  max: number;
  step: number;
  currency: string;
  ranges: Array<{
    label: string;
    min: number;
    max: number;
    count: number;
  }>;
}

export interface PropertyTypeFilter {
  type: string;
  label: string;
  count: number;
  averagePrice: number;
  description?: string;
}

export interface BedroomFilter {
  count: number;
  label: string;
  propertyCount: number;
  averagePrice: number;
}

export interface BathroomFilter {
  count: number;
  label: string;
  propertyCount: number;
  averagePrice: number;
}

export interface FeatureFilter {
  feature: string;
  label: string;
  count: number;
  category: 'security' | 'convenience' | 'luxury' | 'utilities' | 'outdoor' | 'indoor';
  description?: string;
}

export interface LocationFilter {
  city: string;
  state: string;
  propertyCount: number;
  averagePrice: number;
  popularAreas?: string[];
}

export interface VerificationFilter {
  ownerVerified: {
    count: number;
    percentage: number;
  };
  boundaryVerified: {
    count: number;
    percentage: number;
  };
  documentsVerified: {
    count: number;
    percentage: number;
  };
}

export interface AvailabilityFilter {
  availableNow: {
    count: number;
    percentage: number;
  };
  availableWithin30Days: {
    count: number;
    percentage: number;
  };
  availableAfter30Days: {
    count: number;
    percentage: number;
  };
}

export interface AppliedFilters {
  priceRange?: {
    min: number;
    max: number;
  };
  propertyTypes?: string[];
  bedrooms?: number[];
  bathrooms?: number[];
  features?: string[];
  city?: string;
  state?: string;
  coordinates?: {
    lat: number;
    lng: number;
    radius: number;
  };
  ownerVerified?: boolean;
  boundaryVerified?: boolean;
  documentsVerified?: boolean;
  isAvailable?: boolean;
  availableFrom?: Date;
}

export interface FilterValidation {
  isValid: boolean;
  errors: FilterError[];
  warnings: FilterWarning[];
}

export interface FilterError {
  field: string;
  message: string;
  code: string;
}

export interface FilterWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: AppliedFilters;
  category: 'popular' | 'budget' | 'luxury' | 'family' | 'student' | 'professional';
  usageCount: number;
  isActive: boolean;
}

export const FILTER_CATEGORIES = {
  SECURITY: ['Security', 'CCTV', 'Gate', 'Security Guard', 'Access Control'],
  CONVENIENCE: ['Parking', 'Elevator', 'Laundry', 'Storage'],
  LUXURY: ['Pool', 'Gym', 'Spa', 'Concierge', 'Premium Finishes'],
  UTILITIES: ['Generator', 'Solar', 'Borehole', 'WiFi', 'Cable TV'],
  OUTDOOR: ['Garden', 'Balcony', 'Terrace', 'Patio', 'Playground'],
  INDOOR: ['AC', 'Kitchen', 'Furnished', 'Fireplace', 'Study Room']
} as const;

export const PRICE_RANGES = [
  { label: 'Under ₦300K', min: 0, max: 300000 },
  { label: '₦300K - ₦500K', min: 300000, max: 500000 },
  { label: '₦500K - ₦800K', min: 500000, max: 800000 },
  { label: '₦800K - ₦1.2M', min: 800000, max: 1200000 },
  { label: '₦1.2M - ₦2M', min: 1200000, max: 2000000 },
  { label: '₦2M - ₦3M', min: 2000000, max: 3000000 },
  { label: '₦3M - ₦5M', min: 3000000, max: 5000000 },
  { label: 'Above ₦5M', min: 5000000, max: Infinity }
];
