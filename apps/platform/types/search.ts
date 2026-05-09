// apps/platform/types/search.ts

export interface SearchOptions {
  sortBy?: SortOption;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Update SearchFilters to match what searchHelpers.ts expects
export interface SearchFilters {
  city?: string;
  state?: string;
  propertyType?: string[];
  structure?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  bedrooms?: number[];
  bathrooms?: number[];
  features?: string[];
  availableFrom?: Date;
  isAvailableNow?: boolean;
  radius?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  // Keep existing fields
  propertyTypes?: string[];
  location?: {
    city?: string;
    state?: string;
    coordinates?: {
      lat: number;
      lng: number;
      radius?: number;
    };
  };
}

export interface SearchParams {
  query?: string;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string[];
  bedrooms?: number[];
  bathrooms?: number[];
  features?: string[];
  page?: number;
  limit?: number;
  sortBy?: SortOption;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResults {
  properties: SearchProperty[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    availablePriceRange: {
      min: number;
      max: number;
    };
    availablePropertyTypes: string[];
    availableFeatures: string[];
    availableCities: string[];
    availableStates: string[];
  };
}

export interface SearchProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  
  // Location
  address: string;
  city: string;
  state: string;
  country: string;
  gpsCoordinates?: string;
  
  // Media
  images: {
    id: string;
    url: string;
    altText?: string;
    isPrimary: boolean;
  }[];
  
  // Status
  isAvailable: boolean;
  availableFrom?: string;
  status: string;
  
  // Ownership
  owner: {
    id: string;
    name?: string;
    image?: string;
    isVerified: boolean;
  };
  agent?: {
    id: string;
    name?: string;
    image?: string;
    isVerified: boolean;
  };
  
  // Metadata
  viewCount: number;
  favoriteCount: number;
  isFavorited?: boolean;
  shareableLink?: string;
  
  // Boundary info
  boundaryVerified: boolean;
  boundaryCoordinates?: any;
  
  createdAt: string;
  updatedAt: string;
}

export interface SearchSuggestion {
  type: 'location' | 'property' | 'feature';
  value: string;
  label: string;
  count?: number;
}

export interface SearchHistory {
  id: string;
  query: string;
  filters: SearchFilters;
  resultCount: number;
  searchedAt: string;
}

export type SortOption = 
  | 'price_low_high'
  | 'price_high_low'
  | 'newest'
  | 'oldest'
  | 'most_viewed'
  | 'most_favorited'
  | 'distance'
  | 'relevance';

export interface SavedSearch {
  id: string;
  name: string;
  params: SearchParams;
  filters: SearchFilters;
  isActive: boolean;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}