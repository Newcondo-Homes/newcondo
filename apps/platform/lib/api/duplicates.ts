// apps/platform/lib/api/duplicates.ts
import { PropertyDuplicate, DuplicateStatus } from '@newcondo/db'
import { apiClient } from './client'

export interface DuplicateDetectionRequest {
  propertyId: string
  gpsCoordinates: {
    lat: number
    lng: number
  }
  boundaryCoordinates?: {
    type: 'Polygon'
    coordinates: number[][][]
  }
  buildingFingerprint?: string
  searchRadius?: number // in meters, default 50m
}

export interface PotentialDuplicate {
  propertyId: string
  title: string
  address: string
  gpsCoordinates: {
    lat: number
    lng: number
  }
  boundaryCoordinates?: {
    type: 'Polygon'
    coordinates: number[][][]
  }
  distance: number // distance in meters
  similarity: number // 0-1 similarity score
  matchReasons: string[] // reasons why it's considered a duplicate
  owner: {
    id: string
    name: string | null
    email: string
    phone: string | null
  }
  images: Array<{
    id: string
    url: string
    isPrimary: boolean
  }>
  createdAt: string
  boundaryVerified: boolean
}

export interface DuplicateDetectionResponse {
  hasConflicts: boolean
  conflictCount: number
  potentialDuplicates: PotentialDuplicate[]
  canProceed: boolean
  recommendedAction: 'proceed' | 'verify_boundary' | 'contact_admin' | 'mark_remotely'
  message: string
}

export interface ReportDuplicatePayload {
  originalPropertyId: string
  duplicatePropertyId: string
  reason: string
  additionalNotes?: string
}

export interface DuplicateReportResponse extends PropertyDuplicate {
  originalProperty: {
    id: string
    title: string
    address: string
    owner: {
      id: string
      name: string | null
      email: string
    }
  }
  duplicateProperty?: {
    id: string
    title: string
    address: string
    owner: {
      id: string
      name: string | null
      email: string
    }
  }
  reportedByUser?: {
    id: string
    name: string | null
    email: string
  }
}

export interface BoundaryConflictArea {
  conflictType: 'overlap' | 'complete_coverage' | 'suspicious_proximity'
  severity: 'low' | 'medium' | 'high'
  overlapPercentage?: number
  affectedProperties: string[]
  conflictCoordinates: {
    type: 'Polygon'
    coordinates: number[][][]
  }
}

export interface BoundaryValidationResponse {
  isValid: boolean
  conflicts: BoundaryConflictArea[]
  warnings: string[]
  suggestions: string[]
  maxAllowedArea?: number // in square meters
  currentArea: number
  exceedsMaxArea: boolean
}

// Duplicate Detection API
export const duplicateApi = {
  // Check for potential duplicates before property creation/update
  async detectDuplicates(request: DuplicateDetectionRequest): Promise<DuplicateDetectionResponse> {
    const response = await apiClient.post('/duplicates/detect', request)
    return response.data as DuplicateDetectionResponse
  },

  // Validate property boundary against existing properties
  async validateBoundary(
    boundaryCoordinates: { type: 'Polygon'; coordinates: number[][][] },
    gpsCoordinates: { lat: number; lng: number },
    excludePropertyId?: string
  ): Promise<BoundaryValidationResponse> {
    const response = await apiClient.post('/duplicates/validate-boundary', {
      boundaryCoordinates,
      gpsCoordinates,
      excludePropertyId
    })
    return response.data as BoundaryValidationResponse
  },

  // Get existing boundary masks in an area (for visual overlay)
  async getBoundaryMasks(
    centerLat: number,
    centerLng: number,
    radius: number = 200 // meters
  ): Promise<Array<{
    propertyId: string
    boundaryCoordinates: { type: 'Polygon'; coordinates: number[][][] }
    verified: boolean
    overlayColor: string // 'red' for conflicts, 'yellow' for warnings, 'green' for verified
  }>> {
    const response = await apiClient.get('/duplicates/boundary-masks', {
      params: { lat: centerLat, lng: centerLng, radius }
    })
    return response.data as Array<{
      propertyId: string
      boundaryCoordinates: { type: 'Polygon'; coordinates: number[][][] }
      verified: boolean
      overlayColor: string // 'red' for conflicts, 'yellow' for warnings, 'green' for verified
    }>
  },

  // Report a property as duplicate
  async reportDuplicate(data: ReportDuplicatePayload): Promise<DuplicateReportResponse> {
    const response = await apiClient.post('/duplicates/report', data)
    return response.data as DuplicateReportResponse
  },

  // Get user's duplicate reports
  async getUserReports(userId: string): Promise<DuplicateReportResponse[]> {
    const response = await apiClient.get(`/duplicates/reports/user/${userId}`)
    return response.data as DuplicateReportResponse[]
  },

  // Get duplicate reports for a property
  async getPropertyReports(propertyId: string): Promise<DuplicateReportResponse[]> {
    const response = await apiClient.get(`/duplicates/reports/property/${propertyId}`)
    return response.data as DuplicateReportResponse[]
  },

  // Generate building fingerprint from property data
  async generateFingerprint(propertyData: {
    gpsCoordinates: { lat: number; lng: number }
    address: string
    boundaryCoordinates?: { type: 'Polygon'; coordinates: number[][][] }
    buildingImages?: string[]
    propertyType: string
    area?: string
  }): Promise<{ fingerprint: string; confidence: number }> {
    const response = await apiClient.post('/duplicates/generate-fingerprint', propertyData)
    return response.data as { fingerprint: string; confidence: number }
  },

  // Search for properties by fingerprint
  async searchByFingerprint(
    fingerprint: string,
    threshold: number = 0.8
  ): Promise<Array<{
    propertyId: string
    similarity: number
    title: string
    address: string
    owner: { id: string; name: string | null }
  }>> {
    const response = await apiClient.get('/duplicates/search-fingerprint', {
      params: { fingerprint, threshold }
    })
    return response.data as Array<{
      propertyId: string
      similarity: number
      title: string
      address: string
      owner: { id: string; name: string | null }
    }>
  },

  // Check if coordinates fall within existing property boundaries
  async checkCoordinatesConflict(
    lat: number,
    lng: number
  ): Promise<{
    hasConflict: boolean
    conflictingProperties: Array<{
      propertyId: string
      title: string
      address: string
      distanceFromCenter: number
      owner: { id: string; name: string | null }
    }>
  }> {
    const response = await apiClient.get('/duplicates/check-coordinates', {
      params: { lat, lng }
    })
    return response.data as {
      hasConflict: boolean
      conflictingProperties: Array<{
        propertyId: string
        title: string
        address: string
        distanceFromCenter: number
        owner: { id: string; name: string | null }
      }>
    }
  },

  // Get duplicate statistics for analytics
  async getDuplicateStats(): Promise<{
    totalReports: number
    pendingReports: number
    resolvedReports: number
    confirmedDuplicates: number
    falsePositives: number
    recentReports: Array<{
      id: string
      createdAt: string
      status: DuplicateStatus
      originalProperty: { title: string; address: string }
    }>
  }> {
    const response = await apiClient.get('/duplicates/stats')
    return response.data as {
      totalReports: number
      pendingReports: number
      resolvedReports: number
      confirmedDuplicates: number
      falsePositives: number
      recentReports: Array<{
        id: string
        createdAt: string
        status: DuplicateStatus
        originalProperty: { title: string; address: string }
      }>
    }
  },

  // Bulk validate multiple boundaries (for batch operations)
  async bulkValidateBoundaries(
    boundaries: Array<{
      propertyId?: string
      boundaryCoordinates: { type: 'Polygon'; coordinates: number[][][] }
      gpsCoordinates: { lat: number; lng: number }
    }>
  ): Promise<Array<{
    index: number
    propertyId?: string
    isValid: boolean
    conflicts: BoundaryConflictArea[]
    warnings: string[]
  }>> {
    const response = await apiClient.post('/duplicates/bulk-validate', { boundaries })
    return response.data as Array<{
      index: number
      propertyId?: string
      isValid: boolean
      conflicts: BoundaryConflictArea[]
      warnings: string[]
    }>
  },

  // Get boundary overlap analysis between two properties
  async analyzeBoundaryOverlap(
    property1Id: string,
    property2Id: string
  ): Promise<{
    hasOverlap: boolean
    overlapPercentage: number
    overlapArea: number // square meters
    overlapCoordinates?: { type: 'Polygon'; coordinates: number[][][] }
    resolution: 'merge' | 'adjust_boundaries' | 'admin_review'
  }> {
    const response = await apiClient.get(`/duplicates/overlap-analysis/${property1Id}/${property2Id}`)
    return response.data as {
      hasOverlap: boolean
      overlapPercentage: number
      overlapArea: number // square meters
      overlapCoordinates?: { type: 'Polygon'; coordinates: number[][][] }
      resolution: 'merge' | 'adjust_boundaries' | 'admin_review'
    }
  },

  // Suggest boundary adjustments to resolve conflicts
  async suggestBoundaryAdjustment(
    propertyId: string,
    conflictingPropertyIds: string[]
  ): Promise<{
    suggestedBoundary: { type: 'Polygon'; coordinates: number[][][] }
    adjustmentReason: string
    areaReduction: number // percentage
    confidence: number // 0-1
  }> {
    const response = await apiClient.post(`/duplicates/suggest-adjustment/${propertyId}`, {
      conflictingPropertyIds
    })
    return response.data as {
      suggestedBoundary: { type: 'Polygon'; coordinates: number[][][] }
      adjustmentReason: string
      areaReduction: number // percentage
      confidence: number // 0-1
    }
  }
}