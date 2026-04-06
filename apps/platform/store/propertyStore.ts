import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  address: string;
  city: string;
  state: string;
  country: string;
  gpsCoordinates?: string;
  propertyType: 'APARTMENT' | 'HOUSE' | 'DUPLEX' | 'ROOM' | 'SHARED_APARTMENT' | 'OFFICE' | 'SHOP' | 'WAREHOUSE';
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  images: PropertyImage[];
  structure: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  totalUnits?: number;
  availableUnits?: number;
  buildingFeatures?: string[];
  units?: PropertyUnit[];
  isAvailable: boolean;
  availableFrom?: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'RENTED' | 'UNAVAILABLE';
  adminApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  shareableLink?: string;
  viewCount: number;
  favoriteCount: number;
  boundaryCoordinates?: any;
  boundaryVerified: boolean;
  boundaryImages?: string[];
  owner: {
    id: string;
    name?: string;
    email: string;
    phone?: string;
    image?: string;
  };
  agent?: {
    id: string;
    name?: string;
    email: string;
    phone?: string;
    image?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

export interface PropertyUnit {
  id: string;
  unitNumber: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  price: number;
  currency: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
  isAvailable: boolean;
  availableFrom?: string;
  images: PropertyUnitImage[];
}

export interface PropertyUnitImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

export interface PropertyFilters {
  priceRange: [number, number];
  propertyType: string[];
  bedrooms?: number;
  bathrooms?: number;
  features: string[];
  city: string;
  state: string;
  structure?: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  availableFrom?: string;
}

export interface PropertySortOption {
  field: 'price' | 'createdAt' | 'viewCount' | 'favoriteCount';
  order: 'asc' | 'desc';
}

interface PropertyState {
  // Properties data
  properties: Property[];
  featuredProperties: Property[];
  recentlyViewed: Property[];

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  isFetching: boolean;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalProperties: number;
  hasNextPage: boolean;

  // Current property details
  currentProperty: Property | null;
  isLoadingProperty: boolean;

  // Filters and search
  filters: PropertyFilters;
  activeSort: PropertySortOption;
  searchQuery: string;

  // UI states
  viewMode: 'grid' | 'list' | 'map';
  showFilters: boolean;
  selectedPropertyIds: string[];
  favorites: string[];

  // Error handling
  error: string | null;
  lastFetchTime: number | null;
  cacheExpiry: number; // 5 minutes default

  selectedForComparison: string[];

}

interface PropertyActions {
  // Fetching actions
  fetchProperties: (params?: {
    page?: number;
    limit?: number;
    reset?: boolean;
    useCache?: boolean;
  }) => Promise<void>;
  fetchFeaturedProperties: () => Promise<void>;
  fetchPropertyById: (id: string) => Promise<Property | null>;
  refreshProperties: () => Promise<void>;


  // Property management
  addProperty: (property: Property) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  removeProperty: (id: string) => void;
  clearProperties: () => void;
  clearComparison: () => void;


  // Viewing and interaction
  addToRecentlyViewed: (property: Property) => void;
  incrementViewCount: (propertyId: string) => void;
  setCurrentProperty: (property: Property | null) => void;

  // Filters and search
  setFilters: (filters: Partial<PropertyFilters>) => void;
  resetFilters: () => void;
  setSearchQuery: (query: string) => void;
  setSortOption: (sort: PropertySortOption) => void;

  // UI actions
  setViewMode: (mode: 'grid' | 'list' | 'map') => void;
  toggleFilters: () => void;
  setShowFilters: (show: boolean) => void;
  togglePropertySelection: (propertyId: string) => void;
  clearPropertySelection: () => void;
  toggleFavorite: (propertyId: string) => void;
  toggleComparison: (propertyId: string) => void;

  // Loading states
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setFetching: (fetching: boolean) => void;
  setError: (error: string | null) => void;

  // Cache management
  shouldRefetch: () => boolean;
  clearCache: () => void;

}

const defaultFilters: PropertyFilters = {
  priceRange: [0, 10000000],
  propertyType: [],
  features: [],
  city: '',
  state: '',
};

const defaultSort: PropertySortOption = {
  field: 'createdAt',
  order: 'desc',
};

export const usePropertyStore = create<PropertyState & PropertyActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        properties: [],
        featuredProperties: [],
        recentlyViewed: [],

        isLoading: false,
        isLoadingMore: false,
        isFetching: false,

        currentPage: 1,
        totalPages: 0,
        totalProperties: 0,
        hasNextPage: false,

        currentProperty: null,
        isLoadingProperty: false,

        filters: defaultFilters,
        activeSort: defaultSort,
        searchQuery: '',

        viewMode: 'grid',
        showFilters: false,
        selectedPropertyIds: [],
        favorites: [],
        selectedForComparison: [],

        error: null,
        lastFetchTime: null,
        cacheExpiry: 5 * 60 * 1000, // 5 minutes

        // Actions
        fetchProperties: async (params = {}) => {
          const { page = 1, limit = 48, reset = false, useCache = true } = params;
          const state = get();

          // Check cache validity
          if (useCache && !state.shouldRefetch() && state.properties.length > 0) {
            return;
          }

          try {
            if (reset || page === 1) {
              set((draft) => {
                draft.isLoading = true;
                draft.error = null;
                if (reset) {
                  draft.properties = [];
                  draft.currentPage = 1;
                }
              });
            } else {
              set((draft) => {
                draft.isLoadingMore = true;
              });
            }

            // Build query parameters
            const queryParams = new URLSearchParams({
              page: page.toString(),
              limit: limit.toString(),
              ...(state.searchQuery && { search: state.searchQuery }),
              ...(state.filters.city && { city: state.filters.city }),
              ...(state.filters.state && { state: state.filters.state }),
              ...(state.filters.priceRange[0] > 0 && { minPrice: state.filters.priceRange[0].toString() }),
              ...(state.filters.priceRange[1] < 10000000 && { maxPrice: state.filters.priceRange[1].toString() }),
              ...(state.filters.propertyType.length > 0 && { type: state.filters.propertyType.join(',') }),
              ...(state.filters.bedrooms && { bedrooms: state.filters.bedrooms.toString() }),
              ...(state.filters.bathrooms && { bathrooms: state.filters.bathrooms.toString() }),
              ...(state.filters.features.length > 0 && { features: state.filters.features.join(',') }),
              ...(state.filters.structure && { structure: state.filters.structure }),
              sortBy: state.activeSort.field,
              sortOrder: state.activeSort.order,
            });

            // Make API call
            const response = await fetch(`/api/properties?${queryParams}`);
            if (!response.ok) {
              throw new Error('Failed to fetch properties');
            }

            const data = await response.json();

            set((draft) => {
              if (reset || page === 1) {
                draft.properties = data.properties;
              } else {
                draft.properties.push(...data.properties);
              }

              draft.currentPage = data.currentPage;
              draft.totalPages = data.totalPages;
              draft.totalProperties = data.total;
              draft.hasNextPage = data.hasNextPage;
              draft.lastFetchTime = Date.now();
              draft.isLoading = false;
              draft.isLoadingMore = false;
              draft.error = null;
            });
          } catch (error) {
            set((draft) => {
              draft.error = error instanceof Error ? error.message : 'Failed to fetch properties';
              draft.isLoading = false;
              draft.isLoadingMore = false;
            });
          }
        },

        fetchFeaturedProperties: async () => {
          try {
            set((draft) => {
              draft.isFetching = true;
            });

            const response = await fetch('/api/properties/featured');
            if (!response.ok) {
              throw new Error('Failed to fetch featured properties');
            }

            const data = await response.json();

            set((draft) => {
              draft.featuredProperties = data.properties;
              draft.isFetching = false;
            });
          } catch (error) {
            set((draft) => {
              draft.error = error instanceof Error ? error.message : 'Failed to fetch featured properties';
              draft.isFetching = false;
            });
          }
        },

        fetchPropertyById: async (id: string) => {
          try {
            set((draft) => {
              draft.isLoadingProperty = true;
              draft.error = null;
            });

            const response = await fetch(`/api/properties/${id}`);
            if (!response.ok) {
              throw new Error('Property not found');
            }

            const property = await response.json();

            set((draft) => {
              draft.currentProperty = property;
              draft.isLoadingProperty = false;

              // Update in properties list if exists
              const index = draft.properties.findIndex((p: Property) => p.id === id);
              if (index !== -1) {
                draft.properties[index] = property;
              }
            });

            return property;
          } catch (error) {
            set((draft) => {
              draft.error = error instanceof Error ? error.message : 'Failed to fetch property';
              draft.isLoadingProperty = false;
            });
            return null;
          }
        },

        refreshProperties: async () => {
          await get().fetchProperties({ reset: true, useCache: false });
        },

        addProperty: (property: Property) => {
          set((draft) => {
            draft.properties.unshift(property);
            draft.totalProperties += 1;
          });
        },

        updateProperty: (id: string, updates: Partial<Property>) => {
          set((draft) => {
            const index = draft.properties.findIndex((p: Property) => p.id === id);
            if (index !== -1) {
              Object.assign(draft.properties[index], updates);
            }

            if (draft.currentProperty?.id === id) {
              Object.assign(draft.currentProperty, updates);
            }
          });
        },

        removeProperty: (id: string) => {
          set((draft) => {
            draft.properties = draft.properties.filter((p: Property) => p.id !== id);
            draft.totalProperties = Math.max(0, draft.totalProperties - 1);

            if (draft.currentProperty?.id === id) {
              draft.currentProperty = null;
            }
          });
        },

        clearProperties: () => {
          set((draft) => {
            draft.properties = [];
            draft.currentPage = 1;
            draft.totalPages = 0;
            draft.totalProperties = 0;
            draft.hasNextPage = false;
            draft.lastFetchTime = null;
          });
        },

        addToRecentlyViewed: (property: Property) => {
          set((draft) => {
            // Remove if already exists
            draft.recentlyViewed = draft.recentlyViewed.filter((p: Property) => p.id !== property.id);
            // Add to beginning
            draft.recentlyViewed.unshift(property);
            // Keep only last 20
            draft.recentlyViewed = draft.recentlyViewed.slice(0, 20);
          });
        },

        incrementViewCount: (propertyId: string) => {
          set((draft) => {
            const property = draft.properties.find((p: Property) => p.id === propertyId);
            if (property) {
              property.viewCount += 1;
            }

            if (draft.currentProperty?.id === propertyId) {
              draft.currentProperty.viewCount += 1;
            }
          });

          // Also update on server
          fetch(`/api/properties/${propertyId}/view`, { method: 'POST' }).catch(() => { });
        },

        setCurrentProperty: (property: Property | null) => {
          set((draft) => {
            draft.currentProperty = property;
          });
        },

        toggleComparison: (propertyId: string) => {
          set((draft) => {
            const index = draft.selectedForComparison.indexOf(propertyId);
            if (index === -1) {
              draft.selectedForComparison.push(propertyId);
            } else {
              draft.selectedForComparison.splice(index, 1);
            }
          });
        },
        
        clearComparison: () => {
          set((draft) => {
            draft.selectedForComparison = [];
          });
        },

        setFilters: (newFilters: Partial<PropertyFilters>) => {
          set((draft) => {
            draft.filters = { ...draft.filters, ...newFilters };
            draft.currentPage = 1;
            draft.lastFetchTime = null; // Force refetch
          });
        },

        resetFilters: () => {
          set((draft) => {
            draft.filters = defaultFilters;
            draft.currentPage = 1;
            draft.lastFetchTime = null;
          });
        },

        setSearchQuery: (query: string) => {
          set((draft) => {
            draft.searchQuery = query;
            draft.currentPage = 1;
            draft.lastFetchTime = null;
          });
        },

        setSortOption: (sort: PropertySortOption) => {
          set((draft) => {
            draft.activeSort = sort;
            draft.currentPage = 1;
            draft.lastFetchTime = null;
          });
        },

        setViewMode: (mode: 'grid' | 'list' | 'map') => {
          set((draft) => {
            draft.viewMode = mode;
          });
        },

        toggleFilters: () => {
          set((draft) => {
            draft.showFilters = !draft.showFilters;
          });
        },

        setShowFilters: (show: boolean) => {
          set((draft) => {
            draft.showFilters = show;
          });
        },

        togglePropertySelection: (propertyId: string) => {
          set((draft) => {
            const index = draft.selectedPropertyIds.indexOf(propertyId);
            if (index === -1) {
              draft.selectedPropertyIds.push(propertyId);
            } else {
              draft.selectedPropertyIds.splice(index, 1);
            }
          });
        },

        clearPropertySelection: () => {
          set((draft) => {
            draft.selectedPropertyIds = [];
          });
        },

        setLoading: (loading: boolean) => {
          set((draft) => {
            draft.isLoading = loading;
          });
        },

        setLoadingMore: (loading: boolean) => {
          set((draft) => {
            draft.isLoadingMore = loading;
          });
        },

        setFetching: (fetching: boolean) => {
          set((draft) => {
            draft.isFetching = fetching;
          });
        },

        setError: (error: string | null) => {
          set((draft) => {
            draft.error = error;
          });
        },

        shouldRefetch: () => {
          const state = get();
          if (!state.lastFetchTime) return true;
          return Date.now() - state.lastFetchTime > state.cacheExpiry;
        },

        clearCache: () => {
          set((draft) => {
            draft.lastFetchTime = null;
          });
        },

        toggleFavorite: (propertyId: string) => {
          set((draft) => {
            const index = draft.favorites.indexOf(propertyId);
            if (index === -1) {
              draft.favorites.push(propertyId);
            } else {
              draft.favorites.splice(index, 1);
            }
          });
        },

      })),
      {
        name: 'property-store',
        partialize: (state) => ({
          favorites: state.favorites,
          recentlyViewed: state.recentlyViewed,
          filters: state.filters,
          activeSort: state.activeSort,
          viewMode: state.viewMode,
          selectedPropertyIds: state.selectedPropertyIds,
        }),
      }
    ),
    { name: 'property-store' }
  )
);