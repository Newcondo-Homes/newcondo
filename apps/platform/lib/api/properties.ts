// apps/platform/lib/api/properties.ts
import { Property, PropertyStatus, PropertyType, PropertyStructure } from '@newcondo/db'
import { apiClient } from './client'

export interface CreatePropertyPayload {
  title: string
  description: string
  structure: PropertyStructure
  price?: number
  currency?: string
  address: string
  city: string
  state: string
  country?: string
  gpsCoordinates?: string
  propertyType: PropertyType
  bedrooms?: number
  bathrooms?: number
  area?: string
  features: string[]
  buildingFeatures?: string[]
  totalUnits?: number
  availableUnits?: number
  isOwnerListing: boolean
  agentId?: string
  availableFrom?: string
  shareableLink?: string
}

export interface UpdatePropertyPayload extends Partial<CreatePropertyPayload> {
  id: string
}

export interface PropertyFilters {
  status?: PropertyStatus
  city?: string
  state?: string
  propertyType?: PropertyType
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  amenities?: string[]
  features?: string[]
  isAvailable?: boolean
  ownerId?: string
  agentId?: string
  structure?: PropertyStructure
  page?: number
  limit?: number
  sortBy?: 'price' | 'createdAt' | 'updatedAt' | 'viewCount'
  sortOrder?: 'asc' | 'desc'
}

export interface PropertyBoundaryData {
  boundaryCoordinates: {
    type: 'Polygon'
    coordinates: number[][][]
  }
  gpsCoordinates: {
    lat: number
    lng: number
  }
  boundaryImages?: string[]
  buildingFingerprint: string
}

export interface PropertyResponse extends Property {
  owner: {
    id: string
    name: string | null
    email: string
    phone: string | null
    verificationStatus: string
  }
  agent?: {
    id: string
    name: string | null
    email: string
    phone: string | null
  }
  images: Array<{
    id: string
    url: string
    altText: string | null
    isPrimary: boolean
    order: number
  }>
  units?: Array<{
    id: string
    unitNumber: string
    floor: number | null
    bedrooms: number | null
    bathrooms: number | null
    area: string | null
    price: number
    status: string
    isAvailable: boolean
    features: string[]
  }>
  _count?: {
    rentals: number
    duplicateReports: number
  }
}

export interface PropertyListResponse {
  properties: PropertyResponse[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Property CRUD Operations
export const propertyApi = {
  // Create new property
  async create(data: CreatePropertyPayload): Promise<PropertyResponse> {
    const response = await apiClient.post('/properties', data)
    return response.data as PropertyResponse
  },

  // Get property by ID
  async getById(id: string): Promise<PropertyResponse> {
    const response = await apiClient.get(`/properties/${id}`)
    return response.data as PropertyResponse
  },

  // Update property
  async update(data: UpdatePropertyPayload): Promise<PropertyResponse> {
    const { id, ...updateData } = data
    const response = await apiClient.put(`/properties/${id}`, updateData)
    return response.data as PropertyResponse
  },

  // Delete property
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/properties/${id}`)
  },

  // Get properties with filters and pagination
  async getAll(filters?: PropertyFilters): Promise<PropertyListResponse> {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(`${key}[]`, v.toString()))
          } else {
            params.append(key, value.toString())
          }
        }
      })
    }

    const response = await apiClient.get(`/properties?${params.toString()}`)
    return response.data as PropertyListResponse
  },

  // Get user's properties (owner or agent)
  async getUserProperties(userId: string, filters?: Omit<PropertyFilters, 'ownerId' | 'agentId'>): Promise<PropertyListResponse> {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(`${key}[]`, v.toString()))
          } else {
            params.append(key, value.toString())
          }
        }
      })
    }

    const response = await apiClient.get(`/properties/user/${userId}?${params.toString()}`)
    return response.data as PropertyListResponse
  },

  // Update property boundary data
  async updateBoundary(propertyId: string, boundaryData: PropertyBoundaryData): Promise<PropertyResponse> {
    const response = await apiClient.put(`/properties/${propertyId}/boundary`, boundaryData)
    return response.data as PropertyResponse
  },

  // Verify property boundary
  async verifyBoundary(propertyId: string): Promise<PropertyResponse> {
    const response = await apiClient.post(`/properties/${propertyId}/boundary/verify`)
    return response.data as PropertyResponse
  },

  // Update property status
  async updateStatus(propertyId: string, status: PropertyStatus): Promise<PropertyResponse> {
    const response = await apiClient.patch(`/properties/${propertyId}/status`, { status })
    return response.data as PropertyResponse
  },

  // Toggle property availability
  async toggleAvailability(propertyId: string, isAvailable: boolean): Promise<PropertyResponse> {
    const response = await apiClient.patch(`/properties/${propertyId}/availability`, { isAvailable })
    return response.data as PropertyResponse
  },

  // Increment property view count
  async incrementViewCount(propertyId: string): Promise<void> {
    await apiClient.post(`/properties/${propertyId}/view`)
  },

  // Search properties by location
  async searchByLocation(
    lat: number,
    lng: number,
    radius: number,
    filters?: Omit<PropertyFilters, 'city' | 'state'>
  ): Promise<PropertyListResponse> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString()
    })

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(`${key}[]`, v.toString()))
          } else {
            params.append(key, value.toString())
          }
        }
      })
    }

    const response = await apiClient.get(`/properties/search/location?${params.toString()}`)
    return response.data as PropertyListResponse
  },

  // Get property suggestions based on user preferences
  async getSuggestions(userId: string, limit: number = 10): Promise<PropertyResponse[]> {
    const response = await apiClient.get(`/properties/suggestions/${userId}?limit=${limit}`)
    return response.data as PropertyResponse[]
  },

  // Get similar properties
  async getSimilar(propertyId: string, limit: number = 5): Promise<PropertyResponse[]> {
    const response = await apiClient.get(`/properties/${propertyId}/similar?limit=${limit}`)
    return response.data as PropertyResponse[]
  },

  // Lock property for payment (prevent double booking)
  async lockForPayment(propertyId: string, unitId?: string): Promise<{ success: boolean; lockExpiry: string }> {
    const response = await apiClient.post(`/properties/${propertyId}/lock`, { unitId })
    return response.data as { success: boolean; lockExpiry: string }
  },

  // Release property payment lock
  async releaseLock(propertyId: string, unitId?: string): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/properties/${propertyId}/unlock`, { unitId })
    return response.data as { success: boolean }
  },

  // Bulk operations for multi-family properties
  async bulkUpdateUnits(propertyId: string, units: Array<{
    id?: string
    unitNumber: string
    floor?: number
    bedrooms?: number
    bathrooms?: number
    area?: string
    price: number
    features?: string[]
    isAvailable?: boolean
  }>): Promise<PropertyResponse> {
    const response = await apiClient.put(`/properties/${propertyId}/units/bulk`, { units })
    return response.data as PropertyResponse
  },



  // Get property analytics
  async getAnalytics(propertyId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<{
    views: number
    inquiries: number
    rentals: number
    revenue: number
    viewsOverTime: Array<{ date: string; count: number }>
    popularFeatures: Array<{ feature: string; count: number }>
  }> {
    const response = await apiClient.get(`/properties/${propertyId}/analytics?period=${period}`)
    return response.data as {
      views: number
      inquiries: number
      rentals: number
      revenue: number
      viewsOverTime: Array<{ date: string; count: number }>
      popularFeatures: Array<{ feature: string; count: number }>
    }
  }
}


export async function searchProperties(
  params: PropertyFilters & { q?: string; retryAttempt?: number; page?: number }
) {
  const { q, retryAttempt, ...filters } = params;
  const result = await propertyApi.getAll(filters);
  return {
    data: result.properties,
    pagination: {
      currentPage: result.pagination.page,
      totalPages: result.pagination.totalPages,
    },
  };
}

/** Fetch a paginated/filtered list of properties */
export async function getProperties(filters?: PropertyFilters) {
  return propertyApi.getAll(filters)
}

/** Fetch a single property by ID */
export async function getProperty(id: string): Promise<PropertyResponse> {
  return propertyApi.getById(id)
}

/** Fetch recent / featured properties for the landing page */
export async function getRecentProperties(): Promise<PropertyListResponse> {
  return propertyApi.getAll({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 12,
    isAvailable: true,
  })
}

/** Increment the view counter for a property and return the new count */
export async function incrementViewCount(
  propertyId: string
): Promise<{ viewCount: number }> {
  // The base API fires-and-forgets; here we call it then return
  // a best-effort count from the cached property detail.
  await propertyApi.incrementViewCount(propertyId)
  // Return a placeholder — the hook merges this with cached data.
  return { viewCount: 0 }
}

/** Generate / retrieve a shareable link for a property */
export async function shareProperty(
  propertyId: string
): Promise<{ shareableLink: string }> {
  const response = await apiClient.post(`/properties/${propertyId}/share`)
  return response.data as { shareableLink: string }
}

/**
 * Save boundary / marking data for a property.
 * Called by useMarkProperty in useProperties.ts.
 */
export async function markProperty(
  propertyId: string,
  data: {
    boundaryCoordinates: { lat: number; lng: number }[]
    boundaryImages: string[]
    boundaryVerified: boolean
    boundaryMarkedAt: Date
  }
): Promise<PropertyResponse> {
  const payload: PropertyBoundaryData = {
    boundaryCoordinates: {
      type: 'Polygon',
      // Convert flat {lat,lng}[] to GeoJSON coordinate ring
      coordinates: [data.boundaryCoordinates.map((c) => [c.lng, c.lat])],
    },
    gpsCoordinates: data.boundaryCoordinates[0] ?? { lat: 0, lng: 0 },
    boundaryImages: data.boundaryImages,
    buildingFingerprint: `fp-${propertyId}-${Date.now()}`,
  }

  return propertyApi.updateBoundary(propertyId, payload)
}


// TODO: you may merge this api below to the main api above


// import { apiClient } from '@/lib/api/client';
// import type { 
//   Property, 
//   PropertyFilters, 
//   PaginatedResponse, 
//   PropertyCreateRequest,
//   PropertyUpdateRequest 
// } from '@/types/api';

// // Get properties with filters and pagination
// export async function getProperties(
//   filters?: PropertyFilters,
//   page: number = 1,
//   limit: number = 24
// ): Promise<PaginatedResponse<Property>> {
//   const params = new URLSearchParams();
  
//   // Add pagination
//   params.append('page', page.toString());
//   params.append('limit', limit.toString());
  
//   // Add filters if provided
//   if (filters) {
//     if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
//     if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
//     if (filters.city) params.append('city', filters.city);
//     if (filters.state) params.append('state', filters.state);
//     if (filters.propertyType) params.append('propertyType', filters.propertyType);
//     if (filters.bedrooms) params.append('bedrooms', filters.bedrooms.toString());
//     if (filters.bathrooms) params.append('bathrooms', filters.bathrooms.toString());
//     if (filters.amenities?.length) {
//       filters.amenities.forEach(amenity => params.append('amenities[]', amenity));
//     }
//     if (filters.isAvailable !== undefined) params.append('isAvailable', filters.isAvailable.toString());
//     if (filters.structure) params.append('structure', filters.structure);
//     if (filters.sortBy) params.append('sortBy', filters.sortBy);
//     if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
//   }

//   const response = await apiClient.get(`/api/properties?${params.toString()}`);
//   return response.data;
// }

// // Get recent/featured properties for landing page
// export async function getRecentProperties(limit: number = 48): Promise<Property[]> {
//   const response = await apiClient.get(`/api/properties/recent?limit=${limit}`);
//   return response.data;
// }

// // Get featured properties
// export async function getFeaturedProperties(limit: number = 12): Promise<Property[]> {
//   const response = await apiClient.get(`/api/properties/featured?limit=${limit}`);
//   return response.data;
// }

// // Get single property by ID
// export async function getProperty(id: string): Promise<Property> {
//   const response = await apiClient.get(`/api/properties/${id}`);
//   return response.data;
// }

// // Get property with units (for multi-family properties)
// export async function getPropertyWithUnits(id: string): Promise<Property> {
//   const response = await apiClient.get(`/api/properties/${id}/units`);
//   return response.data;
// }

// // Get similar properties
// export async function getSimilarProperties(
//   id: string, 
//   limit: number = 6
// ): Promise<Property[]> {
//   const response = await apiClient.get(`/api/properties/${id}/similar?limit=${limit}`);
//   return response.data;
// }

// // Increment property view count
// export async function incrementViewCount(propertyId: string): Promise<{ viewCount: number }> {
//   const response = await apiClient.post(`/api/properties/${propertyId}/view`);
//   return response.data;
// }

// // Generate shareable link
// export async function shareProperty(propertyId: string): Promise<{ shareableLink: string }> {
//   const response = await apiClient.post(`/api/properties/${propertyId}/share`);
//   return response.data;
// }

// // Get property availability status
// export async function getPropertyAvailability(propertyId: string): Promise<{
//   isAvailable: boolean;
//   availableUnits?: number;
//   totalUnits?: number;
//   availableFrom?: string;
// }> {
//   const response = await apiClient.get(`/api/properties/${propertyId}/availability`);
//   return response.data;
// }

// // Get property boundary data for map display
// export async function getPropertyBoundary(propertyId: string): Promise<{
//   boundaryCoordinates: any;
//   boundaryVerified: boolean;
//   boundaryImages: string[];
// }> {
//   const response = await apiClient.get(`/api/properties/${propertyId}/boundary`);
//   return response.data;
// }

// // Property filtering helpers
// export async function getFilterOptions(): Promise<{
//   cities: Array<{ value: string; label: string; count: number }>;
//   states: Array<{ value: string; label: string; count: number }>;
//   priceRange: { min: number; max: number };
//   amenities: Array<{ value: string; label: string; count: number }>;
// }> {
//   const response = await apiClient.get('/api/properties/filter-options');
//   return response.data;
// }

// // Get properties by location (for map view)
// export async function getPropertiesByBounds(
//   bounds: {
//     north: number;
//     south: number;
//     east: number;
//     west: number;
//   },
//   filters?: PropertyFilters
// ): Promise<Property[]> {
//   const params = new URLSearchParams();
//   params.append('north', bounds.north.toString());
//   params.append('south', bounds.south.toString());
//   params.append('east', bounds.east.toString());
//   params.append('west', bounds.west.toString());

//   if (filters) {
//     if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
//     if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
//     if (filters.propertyType) params.append('propertyType', filters.propertyType);
//     if (filters.bedrooms) params.append('bedrooms', filters.bedrooms.toString());
//     if (filters.bathrooms) params.append('bathrooms', filters.bathrooms.toString());
//     if (filters.amenities?.length) {
//       filters.amenities.forEach(amenity => params.append('amenities[]', amenity));
//     }
//   }

//   const response = await apiClient.get(`/api/properties/by-bounds?${params.toString()}`);
//   return response.data;
// }

// // Get popular searches/properties
// export async function getPopularProperties(limit: number = 12): Promise<Property[]> {
//   const response = await apiClient.get(`/api/properties/popular?limit=${limit}`);
//   return response.data;
// }

// // Get properties by city
// export async function getPropertiesByCity(
//   city: string, 
//   limit: number = 12
// ): Promise<Property[]> {
//   const response = await apiClient.get(`/api/properties/city/${encodeURIComponent(city)}?limit=${limit}`);
//   return response.data;
// }

// // Property creation and management (for property owners)
// export async function createProperty(data: PropertyCreateRequest): Promise<Property> {
//   const response = await apiClient.post('/api/properties', data);
//   return response.data;
// }

// export async function updateProperty(
//   id: string, 
//   data: PropertyUpdateRequest
// ): Promise<Property> {
//   const response = await apiClient.put(`/api/properties/${id}`, data);
//   return response.data;
// }

// export async function deleteProperty(id: string): Promise<void> {
//   await apiClient.delete(`/api/properties/${id}`);
// }

// // Property image management
// export async function uploadPropertyImage(
//   propertyId: string, 
//   formData: FormData
// ): Promise<{ imageUrl: string; imageId: string }> {
//   const response = await apiClient.post(
//     `/api/properties/${propertyId}/images`,
//     {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//     }
//   );
//   return response.data;
// }

// export async function deletePropertyImage(
//   propertyId: string, 
//   imageId: string
// ): Promise<void> {
//   await apiClient.delete(`/api/properties/${propertyId}/images/${imageId}`);
// }

// export async function reorderPropertyImages(
//   propertyId: string, 
//   imageIds: string[]
// ): Promise<void> {
//   await apiClient.put(`/api/properties/${propertyId}/images/reorder`, {
//     imageIds,
//   });
// }

// // Property status management
// export async function publishProperty(id: string): Promise<Property> {
//   const response = await apiClient.post(`/api/properties/${id}/publish`);
//   return response.data;
// }

// export async function unpublishProperty(id: string): Promise<Property> {
//   const response = await apiClient.post(`/api/properties/${id}/unpublish`);
//   return response.data;
// }

// // Property analytics
// export async function getPropertyAnalytics(
//   id: string, 
//   period: '7d' | '30d' | '90d' = '30d'
// ): Promise<{
//   views: number;
//   favorites: number;
//   inquiries: number;
//   viewsHistory: Array<{ date: string; views: number }>;
// }> {
//   const response = await apiClient.get(`/api/properties/${id}/analytics?period=${period}`);
//   return response.data;
// }

// // Bulk operations
// export async function getMultipleProperties(ids: string[]): Promise<Property[]> {
//   const params = new URLSearchParams();
//   ids.forEach(id => params.append('ids[]', id));
  
//   const response = await apiClient.get(`/api/properties/bulk?${params.toString()}`);
//   return response.data;
// }

// // Property comparison data
// export async function getPropertyComparison(ids: string[]): Promise<{
//   properties: Property[];
//   comparisonData: {
//     priceComparison: any;
//     featureComparison: any;
//     locationComparison: any;
//   };
// }> {
//   const response = await apiClient.post('/api/properties/compare', { ids });
//   return response.data;
// }