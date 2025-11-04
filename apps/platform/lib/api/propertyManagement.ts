// apps/platform/lib/api/propertyManagement.ts
import { apiClient } from './client';
import { PropertyStatus } from '@prisma/client';

export interface PropertyManagementFilters {
  status?: PropertyStatus;
  structure?: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  isAvailable?: boolean;
  searchQuery?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Get property management dashboard data
export const getPropertyManagementDashboard = async (filters?: PropertyManagementFilters) => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  
  const response = await apiClient.get(`/properties/management?${params.toString()}`);
  return response.data;
};

// Get user's properties list
export const getMyProperties = async (filters?: PropertyManagementFilters) => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  
  const response = await apiClient.get(`/properties/my-properties?${params.toString()}`);
  return response.data;
};

// Get single property details
export const getPropertyDetails = async (propertyId: string, options?: { basicOnly?: boolean }) => {
  const params = options?.basicOnly ? '?basicOnly=true' : '';
  const response = await apiClient.get(`/properties/${propertyId}${params}`);
  return response.data;
};

// Update property
export const updateProperty = async (propertyId: string, data: any) => {
  const response = await apiClient.patch(`/properties/${propertyId}`, data);
  return response.data;
};

// Update property status
export const updatePropertyStatus = async (propertyId: string, status: PropertyStatus) => {
  const response = await apiClient.patch(`/properties/${propertyId}/status`, { status });
  return response.data;
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
    boundaryCoordinates: any;
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
export const getPropertyUnits = async (propertyId: string) => {
  const response = await apiClient.get(`/properties/${propertyId}/units`);
  return response.data;
};

export const createUnit = async (propertyId: string, unitData: any) => {
  const response = await apiClient.post(`/properties/${propertyId}/units`, unitData);
  return response.data;
};

export const updateUnit = async (propertyId: string, unitId: string, data: any) => {
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