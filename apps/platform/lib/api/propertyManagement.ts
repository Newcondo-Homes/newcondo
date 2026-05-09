// apps/platform/lib/api/propertyManagement.ts
import { apiClient } from './client';
import { PropertyStatus } from '@newcondo/db';
import type {
  PropertyDetailsResponse,
  PropertyListResponse,
  PropertyDashboardData,
  ApiResponse,
  PropertyUnitsResponse
} from '@/types/propertyManagement';

export interface PropertyManagementFilters {
  status?: PropertyStatus | PropertyStatus[];
  structure?: 'SINGLE_UNIT' | 'MULTI_FAMILY' | ('SINGLE_UNIT' | 'MULTI_FAMILY')[];
  isAvailable?: boolean;
  searchQuery?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
}

// fix line 103: typed boundary coordinates instead of `any`
export interface BoundaryCoordinate {
  lat: number;
  lng: number;
}

// fix lines 139, 144: typed unit data payloads instead of `any`
export interface UnitData {
  unitNumber?: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  price?: number;
  isAvailable?: boolean;
  features?: string[];
  description?: string;
  images?: { url: string; altText?: string; isPrimary?: boolean }[];
}

// Get property management dashboard data
export const getPropertyManagementDashboard = async (filters?: PropertyManagementFilters): Promise<PropertyDashboardData> => {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }

  const response = await apiClient.get<PropertyDashboardData>(`/properties/management?${params.toString()}`);
  return response.data as PropertyDashboardData;
};

// Get user's properties list
export const getMyProperties = async (filters?: PropertyManagementFilters): Promise<PropertyListResponse> => {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }

  const response = await apiClient.get<PropertyListResponse>(`/properties/my-properties?${params.toString()}`);
  return response.data as PropertyListResponse;
};

// Get single property details
export const getPropertyDetails = async (
  propertyId: string,
  options?: { basicOnly?: boolean }
): Promise<PropertyDetailsResponse> => {
  const params = options?.basicOnly ? '?basicOnly=true' : '';
  const response = await apiClient.get<PropertyDetailsResponse>(`/properties/${propertyId}${params}`);
  return response.data as PropertyDetailsResponse;
};

// Update property
export const updateProperty = async (
  propertyId: string,
  data: Partial<import('@/types/propertyManagement').PropertyUpdatePayload>
): Promise<ApiResponse<import('@/types/propertyManagement').ManagedProperty>> => {
  const response = await apiClient.patch(`/properties/${propertyId}`, data);
  return response.data as ApiResponse<import('@/types/propertyManagement').ManagedProperty>;
};

// Update property status
export const updatePropertyStatus = async (
  propertyId: string,
  status: PropertyStatus
): Promise<ApiResponse<import('@/types/propertyManagement').ManagedProperty>> => {
  const response = await apiClient.patch(`/properties/${propertyId}/status`, { status });
  return response.data as ApiResponse<import('@/types/propertyManagement').ManagedProperty>;
};

// Toggle property availability
export const togglePropertyAvailability = async (propertyId: string, isAvailable: boolean) => {
  const response = await apiClient.patch(`/properties/${propertyId}/availability`, { isAvailable });
  return response.data;
};

// Delete property
export const deleteProperty = async (propertyId: string) => {
  const response = await apiClient.delete(`/properties/${propertyId}`);
  return response.data;
};

// Update property boundary
export const updatePropertyBoundary = async (
  propertyId: string,
  boundaryData: {
    boundaryCoordinates: BoundaryCoordinate[];  // fix line 103
    boundaryImages?: string[];
    buildingFingerprint?: string;
  }
) => {
  const response = await apiClient.patch(`/properties/${propertyId}/boundary`, boundaryData);
  return response.data;
};

// Property images management
export const updatePropertyImages = async (
  propertyId: string,
  images: { url: string; altText?: string; isPrimary?: boolean }[]
) => {
  const response = await apiClient.post(`/properties/${propertyId}/images`, { images });
  return response.data;
};

export const reorderPropertyImages = async (propertyId: string, imageIds: string[]) => {
  const response = await apiClient.patch(`/properties/${propertyId}/images/reorder`, { imageIds });
  return response.data;
};

export const deletePropertyImage = async (propertyId: string, imageId: string) => {
  const response = await apiClient.delete(`/properties/${propertyId}/images/${imageId}`);
  return response.data;
};

// Unit management for multi-family properties
export const getPropertyUnits = async (
  propertyId: string
): Promise<PropertyUnitsResponse> => {
  const response = await apiClient.get<PropertyUnitsResponse>(`/properties/${propertyId}/units`);
  return response.data as PropertyUnitsResponse;
};

export const createUnit = async (propertyId: string, unitData: UnitData) => {  // fix line 139
  const response = await apiClient.post(`/properties/${propertyId}/units`, unitData);
  return response.data;
};

export const updateUnit = async (propertyId: string, unitId: string, data: Partial<UnitData>) => {  // fix line 144
  const response = await apiClient.patch(`/properties/${propertyId}/units/${unitId}`, data);
  return response.data;
};

export const deleteUnit = async (propertyId: string, unitId: string) => {
  const response = await apiClient.delete(`/properties/${propertyId}/units/${unitId}`);
  return response.data;
};

export const toggleUnitAvailability = async (
  propertyId: string,
  unitId: string,
  isAvailable: boolean
) => {
  const response = await apiClient.patch(
    `/properties/${propertyId}/units/${unitId}/availability`,
    { isAvailable }
  );
  return response.data;
};

export const updateUnitImages = async (
  propertyId: string,
  unitId: string,
  images: { url: string; altText?: string; isPrimary?: boolean }[]
) => {
  const response = await apiClient.post(
    `/properties/${propertyId}/units/${unitId}/images`,
    { images }
  );
  return response.data;
};