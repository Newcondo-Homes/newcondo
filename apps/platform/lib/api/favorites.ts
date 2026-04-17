// apps/platform/lib/api/favorites.ts
import { apiClient } from './client'
import type { PropertyResponse } from './properties'

export interface FavoritesResponse {
  favorites: PropertyResponse[]
  total: number
}

export async function getFavorites(): Promise<FavoritesResponse> {
  const response = await apiClient.get('/favorites')
  return response.data as FavoritesResponse
}

export async function addFavorite(propertyId: string): Promise<{ success: boolean }> {
  const response = await apiClient.post(`/favorites/${propertyId}`)
  return response.data as { success: boolean }
}

export async function removeFavorite(propertyId: string): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/favorites/${propertyId}`)
  return response.data as { success: boolean }
}

export async function isFavorited(propertyId: string): Promise<{ isFavorite: boolean }> {
  const response = await apiClient.get(`/favorites/${propertyId}/status`)
  return response.data as { isFavorite: boolean }
}