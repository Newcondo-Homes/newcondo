import { apiClient } from './client';
import type { 
  Property, 
  PropertyFilters, 
  PropertySearchParams,
  SearchSuggestion,
  SearchResult,
  PaginatedResponse 
} from '@/types/api';

// Main search function
export async function searchProperties(
  searchParams: PropertySearchParams
): Promise<PaginatedResponse<Property>> {
  const params = new URLSearchParams();

  // Search query
  if (searchParams.query) {
    params.append('q', searchParams.query);
  }

  // Location search
  if (searchParams.location) {
    params.append('location', searchParams.location);
  }

  // Pagination
  params.append('page', (searchParams.page || 1).toString());
  params.append('limit', (searchParams.limit || 24).toString());

  // Filters
  if (searchParams.filters) {
    const filters = searchParams.filters;
    
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.propertyType) params.append('propertyType', filters.propertyType);
    if (filters.bedrooms) params.append('bedrooms', filters.bedrooms.toString());
    if (filters.bathrooms) params.append('bathrooms', filters.bathrooms.toString());
    if (filters.amenities?.length) {
      filters.amenities.forEach(amenity => params.append('amenities[]', amenity));
    }
    if (filters.isAvailable !== undefined) {
      params.append('isAvailable', filters.isAvailable.toString());
    }
    if (filters.structure) params.append('structure', filters.structure);
    if (filters.boundaryVerified !== undefined) {
      params.append('boundaryVerified', filters.boundaryVerified.toString());
    }
  }

  // Sorting
  if (searchParams.sortBy) params.append('sortBy', searchParams.sortBy);
  if (searchParams.sortOrder) params.append('sortOrder', searchParams.sortOrder);

  const response = await apiClient.get(`/api/search/properties?${params.toString()}`);
  return response.data;
}

// Quick search with autocomplete
export async function quickSearch(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const response = await apiClient.get(`/api/search/quick?q=${encodeURIComponent(query)}&limit=${limit}`);
  return response.data;
}

// Search suggestions/autocomplete
export async function getSearchSuggestions(
  query: string,
  limit: number = 8
): Promise<SearchSuggestion[]> {
  if (!query.trim()) return [];
  
  const response = await apiClient.get(
    `/api/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  return response.data;
}

// Location-based search suggestions
export async function getLocationSuggestions(
  query: string,
  limit: number = 5
): Promise<Array<{
  id: string;
  name: string;
  type: 'city' | 'state' | 'area';
  fullName: string;
  propertyCount: number;
}>> {
  if (!query.trim()) return [];
  
  const response = await apiClient.get(
    `/api/search/locations?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  return response.data;
}

// Advanced search with multiple criteria
export async function advancedSearch(
  params: PropertySearchParams
): Promise<PaginatedResponse<Property>> {
  const urlParams = new URLSearchParams();

  if (params.query) {
    urlParams.append('q', params.query);
  }

  if (params.location) {
    urlParams.append('location', params.location);
  }

  // Pagination
  urlParams.append('page', (params.page || 1).toString());
  urlParams.append('limit', (params.limit || 24).toString());

  // Filters
  if (params.filters) {
    const filters = params.filters;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => urlParams.append(`${key}[]`, v.toString()));
        } else {
          urlParams.append(key, value.toString());
        }
      }
    });
  }

  const response = await apiClient.get(`/api/search/advanced?${urlParams.toString()}`);
  return response.data;
}
