import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types based on the Prisma schema
interface PropertyBasic {
  id: string;
  title: string;
  price: number;
  currency: string;
  city: string;
  state: string;
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  images: {
    id: string;
    url: string;
    isPrimary: boolean;
  }[];
  isAvailable: boolean;
  structure: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  totalUnits?: number;
  availableUnits?: number;
}

interface FavoritesState {
  // State
  favoriteIds: Set<string>;
  favoriteProperties: Map<string, PropertyBasic>;
  isLoading: boolean;
  error: string | null;

  // Actions
  addToFavorites: (property: PropertyBasic) => void;
  removeFromFavorites: (propertyId: string) => void;
  toggleFavorite: (property: PropertyBasic) => void;
  isFavorite: (propertyId: string) => boolean;
  getFavoriteProperties: () => PropertyBasic[];
  clearFavorites: () => void;
  getFavoriteCount: () => number;
  
  // Async actions
  syncFavoritesWithServer: () => Promise<void>;
  loadFavoritesFromServer: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      favoriteIds: new Set(),
      favoriteProperties: new Map(),
      isLoading: false,
      error: null,

      // Actions
      addToFavorites: (property: PropertyBasic) => {
        set((state) => {
          state.favoriteIds.add(property.id);
          state.favoriteProperties.set(property.id, property);
          state.error = null;
        });

        // Sync with server in background (fire and forget)
        get().syncFavoritesWithServer().catch(console.error);
      },

      removeFromFavorites: (propertyId: string) => {
        set((state) => {
          state.favoriteIds.delete(propertyId);
          state.favoriteProperties.delete(propertyId);
          state.error = null;
        });

        // Sync with server in background
        get().syncFavoritesWithServer().catch(console.error);
      },

      toggleFavorite: (property: PropertyBasic) => {
        const { isFavorite, addToFavorites, removeFromFavorites } = get();
        
        if (isFavorite(property.id)) {
          removeFromFavorites(property.id);
        } else {
          addToFavorites(property);
        }
      },

      isFavorite: (propertyId: string) => {
        return get().favoriteIds.has(propertyId);
      },

      getFavoriteProperties: () => {
        return Array.from(get().favoriteProperties.values());
      },

      clearFavorites: () => {
        set((state) => {
          state.favoriteIds.clear();
          state.favoriteProperties.clear();
          state.error = null;
        });

        // Sync with server
        get().syncFavoritesWithServer().catch(console.error);
      },

      getFavoriteCount: () => {
        return get().favoriteIds.size;
      },

      // Server sync functions
      syncFavoritesWithServer: async () => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const { favoriteIds } = get();
          const favoriteIdsArray = Array.from(favoriteIds);

          // API call to sync favorites with server
          const response = await fetch('/api/favorites/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              favoritePropertyIds: favoriteIdsArray,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to sync favorites with server');
          }

          set((state) => {
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = error instanceof Error ? error.message : 'Failed to sync favorites';
          });
        }
      },

      loadFavoritesFromServer: async () => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const response = await fetch('/api/favorites');
          
          if (!response.ok) {
            throw new Error('Failed to load favorites from server');
          }

          const { favoriteProperties } = await response.json();

          set((state) => {
            // Clear existing favorites
            state.favoriteIds.clear();
            state.favoriteProperties.clear();

            // Add favorites from server
            favoriteProperties.forEach((property: PropertyBasic) => {
              state.favoriteIds.add(property.id);
              state.favoriteProperties.set(property.id, property);
            });

            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = error instanceof Error ? error.message : 'Failed to load favorites';
          });
        }
      },
    })),
    {
      name: 'newcondo-favorites',
      storage: createJSONStorage(() => localStorage),
      // Custom serialization for Set and Map
      serialize: (state) => {
        return JSON.stringify({
          ...state,
          favoriteIds: Array.from(state.favoriteIds),
          favoriteProperties: Array.from(state.favoriteProperties.entries()),
        });
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          ...parsed,
          favoriteIds: new Set(parsed.favoriteIds || []),
          favoriteProperties: new Map(parsed.favoriteProperties || []),
        };
      },
      // Only persist essential data
      partialize: (state) => ({
        favoriteIds: state.favoriteIds,
        favoriteProperties: state.favoriteProperties,
      }),
    }
  )
);

// Selector hooks for better performance
export const useFavoriteIds = () => useFavoritesStore((state) => state.favoriteIds);
export const useFavoriteProperties = () => useFavoritesStore((state) => state.getFavoriteProperties());
export const useFavoriteCount = () => useFavoritesStore((state) => state.getFavoriteCount());
export const useIsFavorite = (propertyId: string) => 
  useFavoritesStore((state) => state.isFavorite(propertyId));

// Action hooks
export const useFavoriteActions = () => useFavoritesStore((state) => ({
  addToFavorites: state.addToFavorites,
  removeFromFavorites: state.removeFromFavorites,
  toggleFavorite: state.toggleFavorite,
  clearFavorites: state.clearFavorites,
  syncFavoritesWithServer: state.syncFavoritesWithServer,
  loadFavoritesFromServer: state.loadFavoritesFromServer,
}));