'use client'

import { useCallback } from 'react';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// API functions for favorites (these would be implemented in the API layer)
const addToFavoritesAPI = async (propertyId: string): Promise<void> => {
  // This would make an API call to add property to user's favorites
  const response = await fetch('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ propertyId }),
  });

  if (!response.ok) {
    throw new Error('Failed to add to favorites');
  }
};

const removeFromFavoritesAPI = async (propertyId: string): Promise<void> => {
  // This would make an API call to remove property from user's favorites
  const response = await fetch(`/api/favorites/${propertyId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to remove from favorites');
  }
};

const getFavoritesAPI = async (): Promise<string[]> => {
  // This would make an API call to get user's favorite property IDs
  const response = await fetch('/api/favorites');

  if (!response.ok) {
    throw new Error('Failed to fetch favorites');
  }

  const data = await response.json();
  return data.favoriteIds || [];
};

/**
 * Custom hook for managing user favorites
 * Handles both local state and API synchronization
 * 
 * @returns Object with favorites management functions and state
 */
export function useFavorites() {
  const { session } = useAuth();
  // const {
  //   favorites,
  //   isLoading,
  //   error,
  //   addFavorite,
  //   removeFavorite,
  //   setFavorites,
  //   setLoading,
  //   setError,
  //   clearFavorites,
  // } = useFavoritesStore();

  const {
    favoriteIds,
    isLoading,
    error,
    addToFavorites,
    removeFromFavorites,
    clearFavorites,
    getFavoriteProperties,
    getFavoriteCount,
    loadFavoritesFromServer,
  } = useFavoritesStore();

  /**
   * Check if a property is in favorites
   */

  const favorites = Array.from(favoriteIds);

  const isFavorite = useCallback((propertyId: string): boolean => {
    return favorites.includes(propertyId);
  }, [favorites]);

  /**
   * Toggle favorite status of a property
   */
  const toggleFavorite = useCallback(async (propertyId: string, property?: any) => {
    if (!session?.user) {
      toast.error('Please login to save favorites');
      return;
    }

    const isCurrentlyFavorite = favoriteIds.has(propertyId);


    try {
      if (isCurrentlyFavorite) {
        removeFromFavorites(propertyId);

        toast.success('Removed from favorites');
      } else {
        // Optimistic update - add immediately
        if (!property) {
          toast.error('Property data required to add to favorites');
          return;
        }

        // API call
        addToFavorites(property);
        toast.success('Added to favorites');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(errorMessage);
    }
  }, [
    session,
    favoriteIds,
    addToFavorites,
    removeFromFavorites,
  ]);

  /**
   * Load user's favorites from the server
   */
  const loadFavorites = useCallback(async () => {
    if (!session?.user) {
      clearFavorites();
      return;
    }

    try {
      await loadFavoritesFromServer();
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  }, [session, loadFavoritesFromServer, clearFavorites,]);

  /**
   * Add multiple properties to favorites
   */
  const addMultipleFavorites = useCallback(async (properties: any[]) => {
    if (!session?.user) {
      toast.error('Please login to save favorites');
      return;
    }

    try {
      // Add all properties optimistically
      properties.forEach(property => addToFavorites(property));
      toast.success(`Added ${properties.length} properties to favorites`);

    } catch (err) {
      // Revert optimistic updates on error
      properties.forEach(p => removeFromFavorites(p.id));
      const errorMessage = err instanceof Error ? err.message : 'Failed to add favorites';
      toast.error(errorMessage);
    }
  }, [session, addToFavorites, removeFromFavorites]);

  /**
   * Remove multiple properties from favorites
   */
  const removeMultipleFavorites = useCallback(async (propertyIds: string[]) => {
    if (!session?.user) return;

    try {
      propertyIds.forEach(id => removeFromFavorites(id));
      toast.success(`Removed ${propertyIds.length} properties from favorites`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove favorites';
      toast.error(errorMessage);
    }
  }, [session, removeFromFavorites]);

  /**
   * Get count of favorites
   */
  const favoritesCount = useCallback((): number => {
    return favorites.length;
  }, [favorites]);

  /**
   * Clear all favorites
   */
  const clearAllFavorites = useCallback(async () => {
    if (!session?.user) return;

    if (favorites.length === 0) {
      toast.info('No favorites to clear');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove all ${favorites.length} favorite properties?`
    );

    if (!confirmed) return;

    clearFavorites();
    toast.success('All favorites cleared');

    // await removeMultipleFavorites(favorites);
  }, [session, favorites, removeMultipleFavorites]);

  return {
    // State
    favorites,
    favoriteProperties: getFavoriteProperties(),
    isLoading,
    error,
    favoritesCount: favoritesCount(),

    // Actions
    isFavorite,
    toggleFavorite,
    loadFavorites,
    addMultipleFavorites,
    removeMultipleFavorites,
    clearAllFavorites,
  };
}