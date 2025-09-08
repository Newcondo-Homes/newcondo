import { apiClient } from './client';
import type { 
  Property, 
  PropertyFilters, 
  PaginatedResponse, 
  PropertyCreateRequest,
  PropertyUpdateRequest 
} from '@/types/api';

// Get properties with filters and pagination
export async function getProperties(
  filters?: PropertyFilters,
  page: number = 1,
  limit: number = 24
): Promise<PaginatedResponse<Property>> {
  const params = new URLSearchParams();
  
  // Add pagination
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  // Add filters if provided
  if (filters) {
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
    if (filters.isAvailable !== undefined) params.append('isAvailable', filters.isAvailable.toString());
    if (filters.structure) params.append('structure', filters.structure);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  }

  const response = await apiClient.get(`/api/properties?${params.toString()}`);
  return response.data;
}

// Get recent/featured properties for landing page
export async function getRecentProperties(limit: number = 48): Promise<Property[]> {
  const response = await apiClient.get(`/api/properties/recent?limit=${limit}`);
  return response.data;
}

// Get featured properties
export async function getFeaturedProperties(limit: number = 12): Promise<Property[]> {
  const response = await apiClient.get(`/api/properties/featured?limit=${limit}`);
  return response.data;
}

// Get single property by ID
export async function getProperty(id: string): Promise<Property> {
  const response = await apiClient.get(`/api/properties/${id}`);
  return response.data;
}

// Get property with units (for multi-family properties)
export async function getPropertyWithUnits(id: string): Promise<Property> {
  const response = await apiClient.get(`/api/properties/${id}/units`);
  return response.data;
}

// Get similar properties
export async function getSimilarProperties(
  id: string, 
  limit: number = 6
): Promise<Property[]> {
  const response = await apiClient.get(`/api/properties/${id}/similar?limit=${limit}`);
  return response.data;
}

// Increment property view count
export async function incrementViewCount(propertyId: string): Promise<{ viewCount: number }> {
  const response = await apiClient.post(`/api/properties/${propertyId}/view`);
  return response.data;
}

// Generate shareable link
export async function shareProperty(propertyId: string): Promise<{ shareableLink: string }> {
  const response = await apiClient.post(`/api/properties/${propertyId}/share`);
  return response.data;
}

// Get property availability status
export async function getPropertyAvailability(propertyId: string): Promise<{
  isAvailable: boolean;
  availableUnits?: number;
  totalUnits?: number;
  availableFrom?: string;
}> {
  const response = await apiClient.get(`/api/properties/${propertyId}/availability`);
  return response.data;
}

// Get property boundary data for map display
export async function getPropertyBoundary(propertyId: string): Promise<{
  boundaryCoordinates: any;
  boundaryVerified: boolean;
  boundaryImages: string[];
}> {
  const response = await apiClient.get(`/api/properties/${propertyId}/boundary`);
  return response.data;
}

// Property filtering helpers
export async function getFilterOptions(): Promise<{
  cities: Array<{ value: string; label: string; count: number }>;
  states: Array<{ value: string; label: string; count: number }>;
  priceRange: { min: number; max: number };
  amenities: Array<{ value: string; label: string; count: number }>;
}> {
  const response = await apiClient.get('/api/properties/filter-options');
  return response.data;
}

// Get properties by location (for map view)
export async function getPropertiesByBounds(
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  filters?: PropertyFilters
): Promise<Property[]> {
  const params = new URLSearchParams();
  params.append('north', bounds.north.toString());
  params.append('south', bounds.south.toString());
  params.append('east', bounds.east.toString());
  params.append('west', bounds.west.toString());

  if (filters) {
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.propertyType) params.append('propertyType', filters.propertyType);
    if (filters.bedrooms) params.append('bedrooms', filters.bedrooms.toString());
    if (filters.bathrooms) params.append('bathrooms', filters.bathrooms.toString());
    if (filters.amenities?.length) {
      filters.amenities.forEach(amenity => params.append('amenities[]', amenity));
    }
  }

  const response = await apiClient.get(`/api/properties/by-bounds?${params.toString()}`);
  return response.data;
}

// Get popular searches/properties
export async function getPopularProperties(limit: number = 12): Promise<Property[]> {
  const response = await apiClient.get(`/api/properties/popular?limit=${limit}`);
  return response.data;
}

// Get properties by city
export async function getPropertiesByCity(
  city: string, 
  limit: number = 12
): Promise<Property[]> {
  const response = await apiClient.get(`/api/properties/city/${encodeURIComponent(city)}?limit=${limit}`);
  return response.data;
}

// Property creation and management (for property owners)
export async function createProperty(data: PropertyCreateRequest): Promise<Property> {
  const response = await apiClient.post('/api/properties', data);
  return response.data;
}

export async function updateProperty(
  id: string, 
  data: PropertyUpdateRequest
): Promise<Property> {
  const response = await apiClient.put(`/api/properties/${id}`, data);
  return response.data;
}

export async function deleteProperty(id: string): Promise<void> {
  await apiClient.delete(`/api/properties/${id}`);
}

// Property image management
export async function uploadPropertyImage(
  propertyId: string, 
  formData: FormData
): Promise<{ imageUrl: string; imageId: string }> {
  const response = await apiClient.post(
    `/api/properties/${propertyId}/images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

export async function deletePropertyImage(
  propertyId: string, 
  imageId: string
): Promise<void> {
  await apiClient.delete(`/api/properties/${propertyId}/images/${imageId}`);
}

export async function reorderPropertyImages(
  propertyId: string, 
  imageIds: string[]
): Promise<void> {
  await apiClient.put(`/api/properties/${propertyId}/images/reorder`, {
    imageIds,
  });
}

// Property status management
export async function publishProperty(id: string): Promise<Property> {
  const response = await apiClient.post(`/api/properties/${id}/publish`);
  return response.data;
}

export async function unpublishProperty(id: string): Promise<Property> {
  const response = await apiClient.post(`/api/properties/${id}/unpublish`);
  return response.data;
}

// Property analytics
export async function getPropertyAnalytics(
  id: string, 
  period: '7d' | '30d' | '90d' = '30d'
): Promise<{
  views: number;
  favorites: number;
  inquiries: number;
  viewsHistory: Array<{ date: string; views: number }>;
}> {
  const response = await apiClient.get(`/api/properties/${id}/analytics?period=${period}`);
  return response.data;
}

// Bulk operations
export async function getMultipleProperties(ids: string[]): Promise<Property[]> {
  const params = new URLSearchParams();
  ids.forEach(id => params.append('ids[]', id));
  
  const response = await apiClient.get(`/api/properties/bulk?${params.toString()}`);
  return response.data;
}

// Property comparison data
export async function getPropertyComparison(ids: string[]): Promise<{
  properties: Property[];
  comparisonData: {
    priceComparison: any;
    featureComparison: any;
    locationComparison: any;
  };
}> {
  const response = await apiClient.post('/api/properties/compare', { ids });
  return response.data;
}