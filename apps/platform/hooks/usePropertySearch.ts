import { useCallback, useEffect, useMemo } from 'react';
import { useSearchStore } from '@/store/searchStore';
import { useDebounce } from '@/hooks/useDebounce';
import { PropertyType, PropertyStatus } from '@prisma/client';

// Search filters interface
export interface PropertySearchFilters {
  query?: string;
  city?: string;
  state?: string;
  propertyType?: PropertyType[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number[];
  bathrooms?: number[];
  features?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc' | 'relevance';
  availableOnly?: boolean;
  hasImages?: boolean;
  isOwnerListing?: boolean;
  boundaryVerified?: boolean;
  radius?: number; // Search radius in km for location-based search
  coordinates?: { lat: number; lng: number };
}

// Search result interface
export interface PropertySearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  address: string;
  city: string;
  state: string;
  features: string[];
  images: Array<{ url: string; altText?: string; isPrimary: boolean }>;
  isAvailable: boolean;
  status: PropertyStatus;
  ownerId: string;
  agentId?: string;
  isOwnerListing: boolean;
  boundaryVerified: boolean;
  viewCount: number;
  favoriteCount: number;
  shareableLink?: string;
  createdAt: string;
  updatedAt: string;
  // Distance from search coordinates (if location-based search)
  distance?: number;
}

// Search response interface
export interface PropertySearchResponse {
  properties: PropertySearchResult[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  filters: {
    appliedFilters: PropertySearchFilters;
    availableFilters: {
      cities: Array<{ name: string; count: number }>;
      states: Array<{ name: string; count: number }>;
      propertyTypes: Array<{ type: PropertyType; count: number }>;
      priceRange: { min: number; max: number };
      bedroomOptions: number[];
      bathroomOptions: number[];
      availableFeatures: Array<{ feature: string; count: number }>;
    };
  };
}

// API function for searching properties
const searchPropertiesAPI = async (
  filters: PropertySearchFilters,
  page: number = 1,
  limit: number = 48
): Promise<PropertySearchResponse> => {
  const searchParams = new URLSearchParams();
  
  // Add filters to search params
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v.toString()));
      } else if (typeof value === 'object') {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });

  searchParams.append('page', page.toString());
  searchParams.append('limit', limit.toString());

  const response = await fetch(`/api/properties/search?${searchParams}`);
  
  if (!response.ok) {
    throw new Error('Failed to search properties');
  }

  return response.json();
};

/**
 * Custom hook for property search functionality
 * Handles search filters, debouncing, and API calls
 * * @returns Object with search state and functions
 */
export function usePropertySearch() {
  const {
    filters,
    results,
    isLoading,
    error,
    totalCount,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    availableFilters,
    searchHistory,
    savedSearches,
    setFilters,
    setResults,
    setLoading,
    setError,
    setPagination,
    setAvailableFilters,
    addToSearchHistory,
    addSavedSearch,
    removeSavedSearch,
    clearSearchHistory,
    resetSearch,
  } = useSearchStore();

  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebounce(filters.query, 300);
  const debouncedFilters = useDebounce(filters, 500);

  /**
   * Perform property search
   */
  const searchProperties = useCallback(async (
    searchFilters: PropertySearchFilters,
    page: number = 1,
    replaceResults: boolean = true
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await searchPropertiesAPI(searchFilters, page);
      
      if (replaceResults) {
        setResults(response.properties);
      } else {
        // Append results for infinite scroll
        setResults([...results, ...response.properties]);
      }

      setPagination({
        totalCount: response.totalCount,
        totalPages: response.totalPages,
        currentPage: response.currentPage,
        hasNextPage: response.hasNextPage,
        hasPreviousPage: response.hasPreviousPage,
      });

      setAvailableFilters(response.filters.availableFilters);

      // Add to search history if it's a new search
      if (searchFilters.query && replaceResults) {
        addToSearchHistory({
          query: searchFilters.query,
          filters: searchFilters,
          timestamp: new Date().toISOString(),
          resultCount: response.totalCount,
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setError(errorMessage);
      console.error('Property search error:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setResults, setPagination, setAvailableFilters, addToSearchHistory, results]);

  /**
   * Effect to trigger a new search when filters change.
   * Resets to page 1.
   */
  useEffect(() => {
    // Only run if filters have meaningful values
    if (debouncedFilters && Object.keys(debouncedFilters).length > 0) {
      searchProperties(debouncedFilters, 1, true);
    }
  }, [debouncedFilters, searchProperties]);

  /**
   * Effect to handle pagination requests.
   * Triggers when currentPage changes and is not 1.
   */
  useEffect(() => {
    if (currentPage > 1) {
      searchProperties(filters, currentPage, false);
    }
  }, [currentPage, searchProperties, filters]);

  /**
   * User-facing handlers for search state
   */
  const handleFilterChange = useCallback(<K extends keyof PropertySearchFilters>(
    key: K,
    value: PropertySearchFilters[K]
  ) => {
    setFilters({ ...filters, [key]: value });
  }, [filters, setFilters]);

  const handleSortChange = useCallback((sortBy: PropertySearchFilters['sortBy']) => {
    setFilters({ ...filters, sortBy });
  }, [filters, setFilters]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      setPagination({ currentPage: currentPage + 1 });
    }
  }, [currentPage, hasNextPage, setPagination]);

  const goToPreviousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPagination({ currentPage: currentPage - 1 });
    }
  }, [currentPage, hasPreviousPage, setPagination]);

  // Memoize the returned object to prevent unnecessary re-renders
  const api = useMemo(() => ({
    filters,
    results,
    isLoading,
    error,
    totalCount,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    availableFilters,
    searchHistory,
    savedSearches,
    
    // Actions
    searchProperties,
    handleFilterChange,
    handleSortChange,
    handleClearFilters,
    goToNextPage,
    goToPreviousPage,
    addSavedSearch,
    removeSavedSearch,
    clearSearchHistory,
    resetSearch,
  }), [
    filters,
    results,
    isLoading,
    error,
    totalCount,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    availableFilters,
    searchHistory,
    savedSearches,
    searchProperties,
    handleFilterChange,
    handleSortChange,
    handleClearFilters,
    goToNextPage,
    goToPreviousPage,
    addSavedSearch,
    removeSavedSearch,
    clearSearchHistory,
    resetSearch,
  ]);

  return api;
}