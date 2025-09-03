// Search types for property service
export interface SearchFilters {
  // Location filters
  city?: string;
  state?: string;
  country?: string;
  
  // Property type filters
  propertyType?: string[];
  structure?: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  
  // Price filters
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  
  // Property features
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  features?: string[];
  
  // Availability
  isAvailable?: boolean;
  availableFrom?: Date;
  
  // Status filters
  status?: string[];
  adminApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  
  // Boundary verification
  boundaryVerified?: boolean;
  
  // Multi-family specific
  minUnits?: number;
  maxUnits?: number;
  minAvailableUnits?: number;
  
  // Geolocation filters
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  
  // Owner/Agent filters
  ownerId?: string;
  agentId?: string;
  isOwnerListing?: boolean;
}

export interface SortOptions {
  field: 'price' | 'createdAt' | 'updatedAt' | 'viewCount' | 'favoriteCount' | 'city';
  order: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

export interface SearchQuery {
  query?: string; // General search term
  filters?: SearchFilters;
  sort?: SortOptions;
  pagination: PaginationOptions;
}

export interface PropertySearchResult {
  id: string;
  title: string;
  description: string;
  structure: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  price?: number;
  currency: string;
  
  // Location
  address: string;
  city: string;
  state: string;
  country: string;
  gpsCoordinates?: string;
  
  // Property details
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  
  // Multi-family specific
  totalUnits?: number;
  availableUnits?: number;
  buildingFeatures?: string[];
  
  // Ownership
  ownerId: string;
  agentId?: string;
  isOwnerListing: boolean;
  
  // Status
  status: string;
  adminApprovalStatus: string;
  isAvailable: boolean;
  availableFrom?: Date;
  
  // Boundary info
  boundaryVerified: boolean;
  boundaryMarkedBy?: string;
  boundaryMarkedAt?: Date;
  
  // Media
  primaryImage?: {
    id: string;
    url: string;
    altText?: string;
  };
  imageCount: number;
  
  // Metrics
  viewCount: number;
  favoriteCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Distance (if location-based search)
  distance?: number;
}

export interface SearchResponse {
  properties: PropertySearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    applied: SearchFilters;
    available: {
      cities: string[];
      states: string[];
      propertyTypes: string[];
      priceRange: {
        min: number;
        max: number;
      };
      featuresList: string[];
    };
  };
  sort: SortOptions;
}

// For search suggestions/autocomplete
export interface SearchSuggestion {
  type: 'city' | 'state' | 'property' | 'address';
  value: string;
  label: string;
  count?: number;
}

export interface SearchSuggestionResponse {
  suggestions: SearchSuggestion[];
}

// For popular searches/trending
export interface TrendingSearch {
  query: string;
  count: number;
  category: 'location' | 'property_type' | 'feature';
}

export interface TrendingSearchResponse {
  trending: TrendingSearch[];
}

// For saved searches (future feature)
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: SearchQuery;
  isActive: boolean;
  alertFrequency?: 'daily' | 'weekly' | 'monthly';
  lastAlertSent?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Geolocation search types
export interface LocationBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeolocationSearchOptions {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in kilometers
  bounds?: LocationBounds;
}

// Property clustering for map view
export interface PropertyCluster {
  id: string;
  count: number;
  center: {
    latitude: number;
    longitude: number;
  };
  bounds: LocationBounds;
  properties?: PropertySearchResult[]; // Only included if cluster is expanded
}

export interface ClusterSearchResponse {
  clusters: PropertyCluster[];
  totalProperties: number;
  zoom: number;
}

export type SearchError = {
  code: string;
  message: string;
  field?: string;
};