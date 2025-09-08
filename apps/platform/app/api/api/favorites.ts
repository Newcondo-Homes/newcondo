import { ApiResponse } from '../types/api';

export interface FavoriteProperty {
  id: string;
  propertyId: string;
  userId: string;
  createdAt: string;
  property: {
    id: string;
    title: string;
    price: number;
    currency: string;
    address: string;
    city: string;
    state: string;
    propertyType: string;
    bedrooms?: number;
    bathrooms?: number;
    images: Array<{
      id: string;
      url: string;
      isPrimary: boolean;
    }>;
    isAvailable: boolean;
  };
}

export interface FavoritesResponse {
  favorites: FavoriteProperty[];
  totalCount: number;
}

// Add/remove favorite
export async function toggleFavorite(
  propertyId: string
): Promise<ApiResponse<{ isFavorited: boolean }>> {
  try {
    const response = await fetch(`/api/favorites/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ propertyId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to toggle favorite: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle favorite',
    };
  }
}

// Get user's favorite properties
export async function getFavorites(params: {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'price' | 'title';
  sortOrder?: 'asc' | 'desc';
}): Promise<ApiResponse<FavoritesResponse>> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const response = await fetch(`/api/favorites?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch favorites: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch favorites',
    };
  }
}

// Check if property is favorited
export async function checkFavoriteStatus(
  propertyId: string
): Promise<ApiResponse<{ isFavorited: boolean }>> {
  try {
    const response = await fetch(`/api/favorites/check/${propertyId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to check favorite status: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check favorite status',
    };
  }
}

// Get favorite property IDs (for efficient checking)
export async function getFavoriteIds(): Promise<ApiResponse<{ favoriteIds: string[] }>> {
  try {
    const response = await fetch('/api/favorites/ids');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch favorite IDs: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching favorite IDs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch favorite IDs',
    };
  }
}

// Remove multiple favorites
export async function removeFavorites(
  propertyIds: string[]
): Promise<ApiResponse<{ removedCount: number }>> {
  try {
    const response = await fetch('/api/favorites/bulk-remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ propertyIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to remove favorites: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error removing favorites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove favorites',
    };
  }
}