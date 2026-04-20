import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'location' | 'property_type' | 'feature' | 'recent';
  metadata?: {
    city?: string;
    state?: string;
    propertyCount?: number;
  };
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: {
    priceRange: [number, number];
    propertyType: string[];
    bedrooms?: number;
    bathrooms?: number;
    features: string[];
    city: string;
    state: string;
    structure?: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  };
  alertsEnabled: boolean;
  createdAt: string;
  lastNotified?: string;
  resultCount: number;
}

export interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
  clickedPropertyId?: string;
}

export interface LocationSuggestion {
  id: string;
  name: string;
  city: string;
  state: string;
  type: 'city' | 'area' | 'landmark';
  propertyCount: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface SearchState {
  // Current search
  query: string;
  isSearching: boolean;
  searchResults: any[];
  searchResultsCount: number;
  
  // Suggestions and autocomplete
  suggestions: SearchSuggestion[];
  isLoadingSuggestions: boolean;
  locationSuggestions: LocationSuggestion[];
  showSuggestions: boolean;
  
  // Search history
  searchHistory: SearchHistory[];
  recentSearches: string[];
  
  // Saved searches
  savedSearches: SavedSearch[];
  
  // Popular searches
  popularSearches: string[];
  trendingLocations: LocationSuggestion[];
  
  // Quick filters (for landing page)
  quickFilters: {
    propertyTypes: { label: string; value: string; count: number }[];
    priceRanges: { label: string; min: number; max: number; count: number }[];
    locations: LocationSuggestion[];
  };
  
  // Search context
  searchContext: {
    fromPage: string;
    timestamp: string;
    userLocation?: {
      lat: number;
      lng: number;
      city?: string;
      state?: string;
    };
  };
  
  // Error handling
  error: string | null;
  lastSearchTime: number | null;
}

interface SearchActions {
  // Search operations
  setQuery: (query: string) => void;
  performSearch: (query?: string, context?: Partial<SearchState['searchContext']>) => Promise<void>;
  clearSearch: () => void;
  
  // Suggestions
  fetchSuggestions: (query: string) => Promise<void>;
  fetchLocationSuggestions: (query: string) => Promise<void>;
  clearSuggestions: () => void;
  setShowSuggestions: (show: boolean) => void;
  
  // Search history
  addToHistory: (query: string, resultCount: number, clickedPropertyId?: string) => void;
  clearHistory: () => void;
  removeFromHistory: (historyId: string) => void;
  
  // Recent searches
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  
  // Saved searches
  saveSearch: (search: Omit<SavedSearch, 'id' | 'createdAt'>) => void;
  removeSavedSearch: (searchId: string) => void;
  updateSavedSearch: (searchId: string, updates: Partial<SavedSearch>) => void;
  toggleSearchAlerts: (searchId: string) => void;
  
  // Quick filters and popular data
  fetchQuickFilters: () => Promise<void>;
  fetchPopularSearches: () => Promise<void>;
  fetchTrendingLocations: () => Promise<void>;
  
  // Search context
  setSearchContext: (context: Partial<SearchState['searchContext']>) => void;
  setUserLocation: (location: SearchState['searchContext']['userLocation']) => void;
  
  // Utility functions
  getSearchSuggestions: (query: string) => SearchSuggestion[];
  isRecentSearch: (query: string) => boolean;
  hasSavedSearches: () => boolean;
  
  // Error handling
  setError: (error: string | null) => void;
  setSearching: (searching: boolean) => void;
}

const POPULAR_SEARCHES = [
  'Apartment in Lagos',
  'House in Abuja',
  'Duplex',
  'Self-contained',
  'Mini flat',
  '2 bedroom flat',
  'Serviced apartment',
  'Office space',
];

const QUICK_PROPERTY_TYPES = [
  { label: 'Apartments', value: 'APARTMENT', count: 0 },
  { label: 'Houses', value: 'HOUSE', count: 0 },
  { label: 'Duplexes', value: 'DUPLEX', count: 0 },
  { label: 'Rooms', value: 'ROOM', count: 0 },
  { label: 'Shared Apartments', value: 'SHARED_APARTMENT', count: 0 },
  { label: 'Office Spaces', value: 'OFFICE', count: 0 },
];

const QUICK_PRICE_RANGES = [
  { label: 'Under ₦500k', min: 0, max: 500000, count: 0 },
  { label: '₦500k - ₦1M', min: 500000, max: 1000000, count: 0 },
  { label: '₦1M - ₦2M', min: 1000000, max: 2000000, count: 0 },
  { label: '₦2M - ₦5M', min: 2000000, max: 5000000, count: 0 },
  { label: 'Above ₦5M', min: 5000000, max: 10000000, count: 0 },
];

export const useSearchStore = create<SearchState & SearchActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        query: '',
        isSearching: false,
        searchResults: [],
        searchResultsCount: 0,
        
        suggestions: [],
        isLoadingSuggestions: false,
        locationSuggestions: [],
        showSuggestions: false,
        
        searchHistory: [],
        recentSearches: [],
        
        savedSearches: [],
        
        popularSearches: POPULAR_SEARCHES,
        trendingLocations: [],
        
        quickFilters: {
          propertyTypes: QUICK_PROPERTY_TYPES,
          priceRanges: QUICK_PRICE_RANGES,
          locations: [],
        },
        
        searchContext: {
          fromPage: '',
          timestamp: new Date().toISOString(),
          userLocation: undefined,
        },
        
        error: null,
        lastSearchTime: null,

        // Actions
        setQuery: (query) => set({ query }),
        
        performSearch: async (query, context) => {
          set((state) => {
            state.isSearching = true;
            state.error = null;
            if (query !== undefined) {
              state.query = query;
            }
            if (context) {
              state.searchContext = { ...state.searchContext, ...context };
            }
          });

          const currentQuery = query || get().query;
          const searchCount = Math.floor(Math.random() * 500) + 50;

          // Simulate an API call
          await new Promise((resolve) => setTimeout(resolve, 1000));

          set((state) => {
            state.isSearching = false;
            state.searchResults = Array.from({ length: searchCount }, (_, i) => ({ id: i, name: `Mock Property ${i}` }));
            state.searchResultsCount = searchCount;
            state.lastSearchTime = Date.now();
            state.addRecentSearch(currentQuery);
            state.addToHistory(currentQuery, searchCount);
          });
        },
        
        clearSearch: () => {
          set((state) => {
            state.query = '';
            state.isSearching = false;
            state.searchResults = [];
            state.searchResultsCount = 0;
            state.error = null;
          });
        },
        
        fetchSuggestions: async (query) => {
          if (!query) {
            get().clearSuggestions();
            return;
          }

          set((state) => {
            state.isLoadingSuggestions = true;
          });

          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          const mockSuggestions = [
            { id: '1', text: `${query} in Lagos`, type: 'location', metadata: { city: 'Lagos', state: 'Lagos' } },
            { id: '2', text: `${query} near Lekki`, type: 'location', metadata: { city: 'Lekki', state: 'Lagos' } },
            { id: '3', text: `Mini flat in ${query}`, type: 'property_type' },
          ];
          
          set((state) => {
            state.suggestions = mockSuggestions;
            state.isLoadingSuggestions = false;
          });
        },
        
        fetchLocationSuggestions: async (query) => {
          set({ isLoadingSuggestions: true });
          
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          const mockLocations = [
            { id: '1', name: 'Lekki', city: 'Lagos', state: 'Lagos', type: 'area', propertyCount: 1500 },
            { id: '2', name: 'Victoria Island', city: 'Lagos', state: 'Lagos', type: 'area', propertyCount: 900 },
            { id: '3', name: 'Abuja', city: 'Abuja', state: 'FCT', type: 'city', propertyCount: 2500 },
          ];

          set((state) => {
            state.locationSuggestions = mockLocations.filter(loc => loc.name.toLowerCase().includes(query.toLowerCase()));
            state.isLoadingSuggestions = false;
          });
        },
        
        clearSuggestions: () => {
          set((state) => {
            state.suggestions = [];
            state.locationSuggestions = [];
            state.showSuggestions = false;
          });
        },
        
        setShowSuggestions: (show) => set({ showSuggestions: show }),
        
        addToHistory: (query, resultCount, clickedPropertyId) => {
          set((state) => {
            state.searchHistory.unshift({
              id: Math.random().toString(),
              query,
              timestamp: new Date().toISOString(),
              resultCount,
              clickedPropertyId,
            });
            // Cap history at 10 items
            if (state.searchHistory.length > 10) {
              state.searchHistory.pop();
            }
          });
        },
        
        clearHistory: () => {
          set((state) => {
            state.searchHistory = [];
          });
        },
        
        removeFromHistory: (historyId) => {
          set((state) => {
            state.searchHistory = state.searchHistory.filter((item: SearchHistory) => item.id !== historyId);
          });
        },
        
        addRecentSearch: (query) => {
          set((state) => {
            // Remove if it already exists to move it to the front
            state.recentSearches = state.recentSearches.filter(
              (recentQuery: string) => recentQuery !== query
            );
            state.recentSearches.unshift(query);
            // Cap recent searches at 5
            if (state.recentSearches.length > 5) {
              state.recentSearches.pop();
            }
          });
        },
        
        clearRecentSearches: () => {
          set((state) => {
            state.recentSearches = [];
          });
        },
        
        saveSearch: (search) => {
          set((state) => {
            state.savedSearches.unshift({
              ...search,
              id: Math.random().toString(),
              createdAt: new Date().toISOString(),
            });
          });
        },
        
        removeSavedSearch: (searchId) => {
          set((state) => {
            state.savedSearches = state.savedSearches.filter((s: SavedSearch) => s.id !== searchId);
          });
        },
        
        updateSavedSearch: (searchId, updates) => {
          set((state) => {
            const searchToUpdate = state.savedSearches.find((s: SavedSearch) => s.id === searchId);
            if (searchToUpdate) {
              Object.assign(searchToUpdate, updates);
            }
          });
        },
        
        toggleSearchAlerts: (searchId) => {
          set((state) => {
            const searchToUpdate = state.savedSearches.find((s: SavedSearch) => s.id === searchId);
            if (searchToUpdate) {
              searchToUpdate.alertsEnabled = !searchToUpdate.alertsEnabled;
            }
          });
        },
        
        fetchQuickFilters: async () => {
          // Simulate an API call
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          set((state) => {
            state.quickFilters.propertyTypes = QUICK_PROPERTY_TYPES.map(type => ({
              ...type,
              count: Math.floor(Math.random() * 500) + 100
            }));
            state.quickFilters.priceRanges = QUICK_PRICE_RANGES.map(range => ({
              ...range,
              count: Math.floor(Math.random() * 500) + 100
            }));
          });
        },
        
        fetchPopularSearches: async () => {
          // No API call, just setting the constant data
          set({ popularSearches: POPULAR_SEARCHES });
        },
        
        fetchTrendingLocations: async () => {
          // Simulate an API call
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          const mockTrending: LocationSuggestion[] = [
            { id: '1', name: 'Lekki', city: 'Lagos', state: 'Lagos', type: 'area', propertyCount: 1500, coordinates: { lat: 6.4462, lng: 3.472 } },
            { id: '2', name: 'Wuse', city: 'Abuja', state: 'FCT', type: 'area', propertyCount: 1200, coordinates: { lat: 9.0628, lng: 7.464 } },
            { id: '3', name: 'Ikeja', city: 'Lagos', state: 'Lagos', type: 'area', propertyCount: 950, coordinates: { lat: 6.6018, lng: 3.351 } },
          ];
          
          set({ trendingLocations: mockTrending });
        },
        
        setSearchContext: (context) => {
          set((state) => {
            state.searchContext = { ...state.searchContext, ...context };
          });
        },
        
        setUserLocation: (location) => {
          set((state) => {
            state.searchContext.userLocation = location;
          });
        },
        
        getSearchSuggestions: (query) => {
          const state = get();
          const lowerQuery = query.toLowerCase();
          const recent = state.recentSearches
            .filter(q => q.toLowerCase().includes(lowerQuery))
            .slice(0, 3)
            .map(q => ({ id: `recent-${q}`, text: q, type: 'recent' as const }));

          const popular = state.popularSearches
            .filter(p => p.toLowerCase().includes(lowerQuery))
            .slice(0, 3)
            .map(p => ({ id: `popular-${p}`, text: p, type: 'property_type' as const }));

          return [...recent, ...popular];
        },
        
        isRecentSearch: (query) => {
          return get().recentSearches.includes(query);
        },
        
        hasSavedSearches: () => {
          return get().savedSearches.length > 0;
        },
        
        setError: (error) => set({ error }),
        
        setSearching: (searching) => set({ isSearching: searching }),
      }))
    , {
      name: 'newcondo-search-storage',
      version: 1,
    })
  )
);