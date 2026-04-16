// apps/platform/lib/api/search.ts
import { propertyApi } from './properties'
import type { PropertySearchParams } from '@/types/api'

export interface SearchResult {
  data: Awaited<ReturnType<typeof propertyApi.getAll>>['properties']
  pagination: {
    currentPage: number
    totalPages: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export async function searchProperties(
  params: PropertySearchParams
): Promise<SearchResult> {
  const { query, type, category, city, state, minPrice, maxPrice, bedrooms, bathrooms, page, limit, sortBy, sortOrder } = params

  const result = await propertyApi.getAll({
    city,
    state,
    propertyType: type,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    page,
    limit,
    sortBy: sortBy === 'rating' ? 'viewCount' : sortBy, // map 'rating' -> 'viewCount'
    sortOrder,
  })

  return {
    data: result.properties,
    pagination: {
      currentPage: result.pagination.page,
      totalPages: result.pagination.totalPages,
      total: result.pagination.total,
      hasNext: result.pagination.hasNext,
      hasPrev: result.pagination.hasPrev,
    },
  }
}