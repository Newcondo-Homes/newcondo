// apps/platform/lib/utils/searchHelpers.ts

import { PropertyType, PropertyStructure } from '@newcondo/db'
import { SearchFilters, SearchOptions, SortOption } from '@/types/search'
import { PropertySearchResult } from '@/types/property'

/**
 * Debounce function to limit API calls during search
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Build search query parameters for API requests
 */
export function buildSearchQuery(
  searchTerm?: string,
  filters?: SearchFilters,
  options?: SearchOptions
): URLSearchParams {
  const params = new URLSearchParams()

  // Search term
  if (searchTerm?.trim()) {
    params.append('q', searchTerm.trim())
  }

  // Location filters
  if (filters?.city) {
    params.append('city', filters.city)
  }
  if (filters?.state) {
    params.append('state', filters.state)
  }

  // Property type filter
  if (filters?.propertyType?.length) {
    filters.propertyType.forEach(type => {
      params.append('propertyType', type)
    })
  }

  // Structure filter (single unit vs multi-family)
  if (filters?.structure?.length) {
    filters.structure.forEach(struct => {
      params.append('structure', struct)
    })
  }

  // Price range
  if (filters?.priceRange?.min !== undefined) {
    params.append('minPrice', filters.priceRange.min.toString())
  }
  if (filters?.priceRange?.max !== undefined) {
    params.append('maxPrice', filters.priceRange.max.toString())
  }

  // Bedrooms and bathrooms
  if (filters?.bedrooms?.length) {
    filters.bedrooms.forEach(bed => {
      params.append('bedrooms', bed.toString())
    })
  }
  if (filters?.bathrooms?.length) {
    filters.bathrooms.forEach(bath => {
      params.append('bathrooms', bath.toString())
    })
  }

  // Features/amenities
  if (filters?.features?.length) {
    filters.features.forEach(feature => {
      params.append('features', feature)
    })
  }

  // Availability
  if (filters?.availableFrom) {
    params.append('availableFrom', filters.availableFrom.toISOString())
  }
  if (filters?.isAvailableNow !== undefined) {
    params.append('isAvailableNow', filters.isAvailableNow.toString())
  }

  // Sorting
  if (options?.sortBy) {
    params.append('sortBy', options.sortBy)
  }
  if (options?.sortOrder) {
    params.append('sortOrder', options.sortOrder)
  }

  // Pagination
  if (options?.page !== undefined) {
    params.append('page', options.page.toString())
  }
  if (options?.limit !== undefined) {
    params.append('limit', options.limit.toString())
  }

  // Geographic search
  if (filters?.radius && filters?.coordinates) {
    params.append('radius', filters.radius.toString())
    params.append('lat', filters.coordinates.lat.toString())
    params.append('lng', filters.coordinates.lng.toString())
  }

  return params
}

/**
 * Parse search query from URL parameters
 */
export function parseSearchQuery(searchParams: URLSearchParams): {
  searchTerm?: string
  filters: SearchFilters
  options: SearchOptions
} {
  const filters: SearchFilters = {}
  const options: SearchOptions = {}

  // Search term
  const searchTerm = searchParams.get('q') || undefined

  // Location
  const city = searchParams.get('city')
  if (city) filters.city = city

  const state = searchParams.get('state')
  if (state) filters.state = state

  // Property types
  const propertyTypes = searchParams.getAll('propertyType') as PropertyType[]
  if (propertyTypes.length) filters.propertyType = propertyTypes

  // Structure types
  const structures = searchParams.getAll('structure') as PropertyStructure[]
  if (structures.length) filters.structure = structures

  // Price range
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  if (minPrice || maxPrice) {
    filters.priceRange = {
      min: minPrice ? parseFloat(minPrice) : undefined,
      max: maxPrice ? parseFloat(maxPrice) : undefined
    }
  }

  // Bedrooms and bathrooms
  const bedrooms = searchParams.getAll('bedrooms').map(Number).filter(n => !isNaN(n))
  if (bedrooms.length) filters.bedrooms = bedrooms

  const bathrooms = searchParams.getAll('bathrooms').map(Number).filter(n => !isNaN(n))
  if (bathrooms.length) filters.bathrooms = bathrooms

  // Features
  const features = searchParams.getAll('features')
  if (features.length) filters.features = features

  // Availability
  const availableFrom = searchParams.get('availableFrom')
  if (availableFrom) {
    filters.availableFrom = new Date(availableFrom)
  }

  const isAvailableNow = searchParams.get('isAvailableNow')
  if (isAvailableNow !== null) {
    filters.isAvailableNow = isAvailableNow === 'true'
  }

  // Geographic search
  const radius = searchParams.get('radius')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  if (radius && lat && lng) {
    filters.radius = parseFloat(radius)
    filters.coordinates = {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    }
  }

  // Sorting
  const sortBy = searchParams.get('sortBy') as SortOption
  if (sortBy) options.sortBy = sortBy

  const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc'
  if (sortOrder) options.sortOrder = sortOrder

  // Pagination
  const page = searchParams.get('page')
  if (page) options.page = parseInt(page)

  const limit = searchParams.get('limit')
  if (limit) options.limit = parseInt(limit)

  return { searchTerm, filters, options }
}

/**
 * Generate property search suggestions based on input
 */
export function generateSearchSuggestions(
  input: string,
  properties: PropertySearchResult[]
): string[] {
  const suggestions = new Set<string>()
  const lowercaseInput = input.toLowerCase()

  properties.forEach(property => {
    // City suggestions
    if (property.city.toLowerCase().includes(lowercaseInput)) {
      suggestions.add(property.city)
    }

    // Address suggestions
    if (property.address.toLowerCase().includes(lowercaseInput)) {
      suggestions.add(property.address)
    }

    // State suggestions
    if (property.state.toLowerCase().includes(lowercaseInput)) {
      suggestions.add(property.state)
    }

    // Title suggestions (property names)
    if (property.title.toLowerCase().includes(lowercaseInput)) {
      suggestions.add(property.title)
    }
  })

  return Array.from(suggestions).slice(0, 8) // Limit to 8 suggestions
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Format search results for display
 */
export function formatSearchResults(
  results: PropertySearchResult[],
  userLocation?: { lat: number; lng: number }
): PropertySearchResult[] {
  return results.map(property => ({
    ...property,
    distance: userLocation && property.gpsCoordinates
      ? calculateDistance(
          userLocation.lat,
          userLocation.lng,
          property.gpsCoordinates.lat,
          property.gpsCoordinates.lng
        )
      : undefined
  }))
}

/**
 * Create shareable search URL
 */
export function createSearchUrl(
  baseUrl: string,
  searchTerm?: string,
  filters?: SearchFilters,
  options?: SearchOptions
): string {
  const params = buildSearchQuery(searchTerm, filters, options)
  return `${baseUrl}/properties?${params.toString()}`
}

/**
 * Validate search filters
 */
export function validateSearchFilters(filters: SearchFilters): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Price range validation
  if (filters.priceRange) {
    const { min, max } = filters.priceRange
    if (min !== undefined && min < 0) {
      errors.push('Minimum price cannot be negative')
    }
    if (max !== undefined && max < 0) {
      errors.push('Maximum price cannot be negative')
    }
    if (min !== undefined && max !== undefined && min > max) {
      errors.push('Minimum price cannot be greater than maximum price')
    }
  }

  // Bedrooms validation
  if (filters.bedrooms?.some(bed => bed < 0 || bed > 10)) {
    errors.push('Bedrooms must be between 0 and 10')
  }

  // Bathrooms validation
  if (filters.bathrooms?.some(bath => bath < 0 || bath > 10)) {
    errors.push('Bathrooms must be between 0 and 10')
  }

  // Radius validation
  if (filters.radius !== undefined && (filters.radius < 0 || filters.radius > 100)) {
    errors.push('Search radius must be between 0 and 100 km')
  }

  // Coordinates validation
  if (filters.coordinates) {
    const { lat, lng } = filters.coordinates
    if (lat < -90 || lat > 90) {
      errors.push('Latitude must be between -90 and 90')
    }
    if (lng < -180 || lng > 180) {
      errors.push('Longitude must be between -180 and 180')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get popular search terms/filters for suggestions
 */
export function getPopularSearches(): {
  terms: string[]
  locations: string[]
  propertyTypes: PropertyType[]
} {
  return {
    terms: [
      'furnished apartment',
      'duplex with parking',
      'serviced apartment',
      'studio apartment',
      '2 bedroom flat'
    ],
    locations: [
      'Lagos',
      'Abuja',
      'Port Harcourt',
      'Kano',
      'Ibadan',
      'Kaduna',
      'Jos',
      'Warri'
    ],
    propertyTypes: [
      PropertyType.APARTMENT,
      PropertyType.HOUSE,
      PropertyType.DUPLEX,
      PropertyType.ROOM
    ]
  }
}