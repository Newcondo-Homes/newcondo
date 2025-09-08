// apps/platform/types/filters.ts

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface RangeFilter {
  min: number;
  max: number;
  step?: number;
  formatter?: (value: number) => string;
}

export interface PropertyFilters {
  priceRange: {
    min: number;
    max: number;
  };
  propertyTypes: string[];
  bedrooms: number[];
  bathrooms: number[];
  features: string[];
  location: LocationFilter;
  availability: AvailabilityFilter;
  verification: VerificationFilter;
}

export interface LocationFilter {
  city?: string;
  state?: string;
  coordinates?: {
    lat: number;
    lng: number;
    radius?: number;
  };
  boundaryVerified?: boolean;
}

export interface AvailabilityFilter {
  isAvailable?: boolean;
  availableFrom?: string;
  moveInDate?: string;
}

export interface VerificationFilter {
  ownerVerified?: boolean;
  boundaryVerified?: boolean;
  documentsVerified?: boolean;
}

export interface FilterState {
  active: PropertyFilters;
  applied: PropertyFilters;
  hasChanges: boolean;
}

export interface FilterConfig {
  priceRange: RangeFilter;
  propertyTypes: FilterOption[];
  bedrooms: FilterOption[];
  bathrooms: FilterOption[];
  features: FilterOption[];
  cities: FilterOption[];
  states: FilterOption[];
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: PropertyFilters;
  isDefault?: boolean;
  category?: 'budget' | 'family' | 'luxury' | 'student' | 'professional' | 'custom';
}

export const DEFAULT_FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'budget_friendly',
    name: 'Budget Friendly',
    description: 'Affordable properties under ₦500K',
    category: 'budget',
    filters: {
      priceRange: { min: 0, max: 500000 },
      propertyTypes: ['ROOM', 'SHARED_APARTMENT'],
      bedrooms: [],
      bathrooms: [],
      features: [],
      location: {},
      availability: { isAvailable: true },
      verification: {}
    }
  },
  {
    id: 'family_home',
    name: 'Family Home',
    description: '2+ bedrooms with family amenities',
    category: 'family',
    filters: {
      priceRange: { min: 0, max: Number.MAX_SAFE_INTEGER },
      propertyTypes: ['APARTMENT', 'HOUSE', 'DUPLEX'],
      bedrooms: [2, 3, 4],
      bathrooms: [2, 3, 4],
      features: ['Parking', 'Security', 'Generator'],
      location: {},
      availability: { isAvailable: true },
      verification: { ownerVerified: true }
    }
  },
  {
    id: 'luxury_properties',
    name: 'Luxury Properties',
    description: 'Premium properties with top amenities',
    category: 'luxury',
    filters: {
      priceRange: { min: 2000000, max: Number.MAX_SAFE_INTEGER },
      propertyTypes: ['DUPLEX', 'HOUSE'],
      bedrooms: [3, 4, 5],
      bathrooms: [3, 4, 5],
      features: ['Pool', 'Gym', 'Security', 'Generator', 'Parking', 'Garden'],
      location: {},
      availability: { isAvailable: true },
      verification: { 
        ownerVerified: true, 
        boundaryVerified: true,
        documentsVerified: true 
      }
    }
  },
  {
    id: 'student_accommodation',
    name: 'Student Friendly',
    description: 'Affordable rooms and shared spaces',
    category: 'student',
    filters: {
      priceRange: { min: 0, max: 800000 },
      propertyTypes: ['ROOM', 'SHARED_APARTMENT'],
      bedrooms: [1, 2],
      bathrooms: [1, 2],
      features: ['WiFi', 'Security'],
      location: {},
      availability: { isAvailable: true },
      verification: {}
    }
  },
  {
    id: 'professional_living',
    name: 'Professional Living',
    description: 'Quality apartments for working professionals',
    category: 'professional',
    filters: {
      priceRange: { min: 800000, max: 3000000 },
      propertyTypes: ['APARTMENT'],
      bedrooms: [1, 2, 3],
      bathrooms: [1, 2, 3],
      features: ['Parking', 'Security', 'Generator', 'WiFi'],
      location: {},
      availability: { isAvailable: true },
      verification: { ownerVerified: true }
    }
  }
];

export const PROPERTY_FEATURES = [
  'Parking',
  'Generator',
  'Security',
  'WiFi',
  'Pool',
  'Gym',
  'Garden',
  'Balcony',
  'AC',
  'Kitchen',
  'Furnished',
  'Pet Friendly',
  'Laundry',
  'Elevator'
];

export const NIGERIAN_STATES = [
  'Lagos',
  'Abuja',
  'Rivers',
  'Kano',
  'Oyo',
  'Delta',
  'Edo',
  'Kaduna',
  'Ogun',
  'Imo',
  'Plateau',
  'Kwara',
  'Anambra',
  'Borno',
  'Niger',
  'Akwa Ibom',
  'Ondo',
  'Osun',
  'Kogi',
  'Zamfara',
  'Enugu',
  'Kebbi',
  'Sokoto',
  'Bauchi',
  'Adamawa',
  'Cross River',
  'Gombe',
  'Imo',
  'Jigawa',
  'Nasarawa',
  'Yobe',
  'Abia',
  'Bayelsa',
  'Benue',
  'Ebonyi',
  'Taraba'
];