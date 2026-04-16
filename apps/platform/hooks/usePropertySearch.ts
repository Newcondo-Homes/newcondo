import { useCallback, useEffect, useMemo } from 'react';
import { useSearchStore } from '@/store/searchStore';
import { useDebounce } from '@/hooks/useDebounce';
import { PropertyType, PropertyStatus } from '@newcondo/db';

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
  const query = useSearchStore(s => s.query);
  const setQuery = useSearchStore(s => s.setQuery);
  const isSearching = useSearchStore(s => s.isSearching);
  const setSearching = useSearchStore(s => s.setSearching);
  const searchResults = useSearchStore(s => s.searchResults);
  const searchResultsCount = useSearchStore(s => s.searchResultsCount);
  const error = useSearchStore(s => s.error);
  const setError = useSearchStore(s => s.setError);
  const searchHistory = useSearchStore(s => s.searchHistory);
  const addToHistory = useSearchStore(s => s.addToHistory);
  const savedSearches = useSearchStore(s => s.savedSearches);
  const saveSearch = useSearchStore(s => s.saveSearch);
  const removeSavedSearch = useSearchStore(s => s.removeSavedSearch);
  const clearHistory = useSearchStore(s => s.clearHistory);
  const clearSearch = useSearchStore(s => s.clearSearch);
  const quickFilters = useSearchStore(s => s.quickFilters);
  const locationSuggestions = useSearchStore(s => s.locationSuggestions);

  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 300);

  /**
   * Perform property search
   */
  const searchProperties = useCallback(async (
    searchFilters: PropertySearchFilters,
    page: number = 1,
  ) => {
    setSearching(true);
    setError(null);

    try {
      const response = await searchPropertiesAPI(searchFilters, page);

      useSearchStore.setState({
        searchResults: response.properties,
        searchResultsCount: response.totalCount,
        lastSearchTime: Date.now(),
      });

      if (searchFilters.query) {
        addToHistory(searchFilters.query, response.totalCount);
      }

      return response;



    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setError(errorMessage);
      console.error('Property search error:', error);
    } finally {
      setSearching(false);
    }
  }, [setSearching, setError, addToHistory]);

  /**
   * Effect to trigger a new search when filters change.
   * Resets to page 1.
   */
  useEffect(() => {
    // Only run if filters have meaningful values
    if (debouncedQuery) {
      searchProperties({ query: debouncedQuery });
    }
  }, [debouncedQuery, searchProperties]);


  /**
   * User-facing handlers for search state
   */
  const handleFilterChange = useCallback(<K extends keyof PropertySearchFilters>(
    key: K,
    value: PropertySearchFilters[K]
  ) => {
    // Update the query string in the store if the key is 'query',
    // otherwise trigger a one-off search with the new filter merged in.
    if (key === 'query' && typeof value === 'string') {
      setQuery(value);
    } else {
      searchProperties({ query, [key]: value });
    }
  }, [query, setQuery, searchProperties]);

  const handleSortChange = useCallback((sortBy: PropertySearchFilters['sortBy']) => {
    searchProperties({ query, sortBy });
  }, [query, searchProperties]);

  const handleClearFilters = useCallback(() => {
    setQuery('');
    clearSearch();
  }, [setQuery, clearSearch]);



  // Memoize the returned object to prevent unnecessary re-renders
  const api = useMemo(() => ({
    query,
    results: searchResults as PropertySearchResult[],
    isLoading: isSearching,
    error,
    totalCount: searchResultsCount,
    searchHistory,
    savedSearches,
    quickFilters,
    locationSuggestions,

    // Actions
    searchProperties,
    handleFilterChange,
    handleSortChange,
    handleClearFilters,
    addSavedSearch: saveSearch,
    removeSavedSearch,
    clearSearchHistory: clearHistory,
    resetSearch: clearSearch,
  }), [
    query,
    searchResults,
    isSearching,
    error,
    searchResultsCount,
    searchHistory,
    savedSearches,
    quickFilters,
    locationSuggestions,
    searchProperties,
    handleFilterChange,
    handleSortChange,
    handleClearFilters,
    saveSearch,
    removeSavedSearch,
    clearHistory,
    clearSearch,
  ]);

  return api;
}