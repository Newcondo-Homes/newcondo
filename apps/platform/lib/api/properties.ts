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
  city?: string
  state?: string
  propertyType?: PropertyType
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
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