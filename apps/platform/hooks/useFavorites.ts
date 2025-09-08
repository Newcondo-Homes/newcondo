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
  const {
    favorites,
    isLoading,
    error,
    addFavorite,
    removeFavorite,
    setFavorites,
    setLoading,
    setError,
    clearFavorites,
  } = useFavoritesStore();

  /**
   * Check if a property is in favorites
   */
  const isFavorite = useCallback((propertyId: string): boolean => {
    return favorites.includes(propertyId);
  }, [favorites]);

  /**
   * Toggle favorite status of a property
   */
  const toggleFavorite = useCallback(async (propertyId: string) => {
    if (!session?.user) {
      toast.error('Please login to save favorites');
      return;
    }

    const isCurrentlyFavorite = isFavorite(propertyId);
    setLoading(true);
    setError(null);

    try {
      if (isCurrentlyFavorite) {
        // Optimistic update - remove immediately
        removeFavorite(propertyId);
        
        // API call
        await removeFromFavoritesAPI(propertyId);
        
        toast.success('Removed from favorites');
      } else {
        // Optimistic update - add immediately
        addFavorite(propertyId);
        
        // API call
        await addToFavoritesAPI(propertyId);
        
        toast.success('Added to favorites');
      }
    } catch (error) {
      // Revert optimistic update on error
      if (isCurrentlyFavorite) {
        addFavorite(propertyId);
      } else {
        removeFavorite(propertyId);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    session,
    isFavorite,
    addFavorite,
    removeFavorite,
    setLoading,
    setError,
  ]);

  /**
   * Load user's favorites from the server
   */
  const loadFavorites = useCallback(async () => {
    if (!session?.user) {
      clearFavorites();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const favoriteIds = await getFavoritesAPI();
      setFavorites(favoriteIds);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load favorites';
      setError(errorMessage);
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [session, setFavorites, setLoading, setError, clearFavorites]);

  /**
   * Add multiple properties to favorites
   */
  const addMultipleFavorites = useCallback(async (propertyIds: string[]) => {
    if (!session?.user) {
      toast.error('Please login to save favorites');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Add all properties optimistically
      propertyIds.forEach(id => addFavorite(id));

      // API calls for each property (in practice, you'd want a batch API)
      await Promise.all(
        propertyIds.map(id => addToFavoritesAPI(id))
      );

      toast.success(`Added ${propertyIds.length} properties to favorites`);
    } catch (error) {
      // Revert optimistic updates on error
      propertyIds.forEach(id => removeFavorite(id));
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to add favorites';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [session, addFavorite, removeFavorite, setLoading, setError]);

  /**
   * Remove multiple properties from favorites
   */
  const removeMultipleFavorites = useCallback(async (propertyIds: string[]) => {
    if (!session?.user) return;

    setLoading(true);
    setError(null);

    try {
      // Remove all properties optimistically
      propertyIds.forEach(id => removeFavorite(id));

      // API calls for each property
      await Promise.all(
        propertyIds.map(id => removeFromFavoritesAPI(id))
      );

      toast.success(`Removed ${propertyIds.length} properties from favorites`);
    } catch (error) {
      // Revert optimistic updates on error
      propertyIds.forEach(id => addFavorite(id));
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove favorites';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [session, addFavorite, removeFavorite, setLoading, setError]);

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

    await removeMultipleFavorites(favorites);
  }, [session, favorites, removeMultipleFavorites]);

  return {
    // State
    favorites,
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