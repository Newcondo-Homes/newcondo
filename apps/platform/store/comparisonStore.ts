import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types based on the Prisma schema
export interface PropertyForComparison {
  id: string;
  title: string;
  price: number;
  currency: string;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: string | null;
  features: string[];
  images: {
    id: string;
    url: string;
    isPrimary: boolean;
  }[];
  isAvailable: boolean;
  structure: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  totalUnits?: number;
  availableUnits?: number;
  buildingFeatures?: string[];
  owner: {
    id: string;
    name: string | null;
  };
  agent?: {
    id: string;
    name: string | null;
  } | null;
  createdAt: string;
}

interface ComparisonItem {
  property: PropertyForComparison;
  addedAt: Date;
}

interface ComparisonState {
  // State
  comparisonItems: ComparisonItem[];
  isComparisonOpen: boolean;
  maxItems: number;
  
  // Actions
  addToComparison: (property: PropertyForComparison) => boolean;
  removeFromComparison: (propertyId: string) => void;
  clearComparison: () => void;
  toggleComparison: (property: PropertyForComparison) => boolean;
  isInComparison: (propertyId: string) => boolean;
  getComparisonCount: () => number;
  getComparisonProperties: () => PropertyForComparison[];
  
  // UI Actions
  openComparison: () => void;
  closeComparison: () => void;
  toggleComparisonPanel: () => void;
  
  // Utility Actions
  reorderComparison: (fromIndex: number, toIndex: number) => void;
  getOldestItem: () => ComparisonItem | null;
  canAddMore: () => boolean;
  
  // Comparison Analytics
  getComparisonStats: () => {
    avgPrice: number;
    priceRange: { min: number; max: number };
    commonFeatures: string[];
    locationSummary: string[];
    propertyTypes: string[];
  };
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      comparisonItems: [],
      isComparisonOpen: false,
      maxItems: 4, // Maximum properties to compare at once

      // Actions
      addToComparison: (property: PropertyForComparison) => {
        const state = get();
        
        // Check if already in comparison
        if (state.isInComparison(property.id)) {
          return false;
        }

        set((draft) => {
          const newItem: ComparisonItem = {
            property,
            addedAt: new Date(),
          };

          // If at max capacity, remove the oldest item
          if (draft.comparisonItems.length >= draft.maxItems) {
            // Find and remove the oldest item
            const oldestIndex = draft.comparisonItems.reduce(
              (oldestIdx, item, index, items) =>
                item.addedAt < items[oldestIdx].addedAt ? index : oldestIdx,
              0
            );
            draft.comparisonItems.splice(oldestIndex, 1);
          }

          // Add the new item
          draft.comparisonItems.push(newItem);
        });

        return true;
      },

      removeFromComparison: (propertyId: string) => {
        set((draft) => {
          const index = draft.comparisonItems.findIndex(
            (item) => item.property.id === propertyId
          );
          
          if (index !== -1) {
            draft.comparisonItems.splice(index, 1);
          }

          // Close comparison panel if no items left
          if (draft.comparisonItems.length === 0) {
            draft.isComparisonOpen = false;
          }
        });
      },

      clearComparison: () => {
        set((draft) => {
          draft.comparisonItems = [];
          draft.isComparisonOpen = false;
        });
      },

      toggleComparison: (property: PropertyForComparison) => {
        const { isInComparison, addToComparison, removeFromComparison } = get();
        
        if (isInComparison(property.id)) {
          removeFromComparison(property.id);
          return false;
        } else {
          return addToComparison(property);
        }
      },

      isInComparison: (propertyId: string) => {
        return get().comparisonItems.some((item) => item.property.id === propertyId);
      },

      getComparisonCount: () => {
        return get().comparisonItems.length;
      },

      getComparisonProperties: () => {
        return get().comparisonItems
          .sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime())
          .map((item) => item.property);
      },

      // UI Actions
      openComparison: () => {
        set((draft) => {
          draft.isComparisonOpen = true;
        });
      },

      closeComparison: () => {
        set((draft) => {
          draft.isComparisonOpen = false;
        });
      },

      toggleComparisonPanel: () => {
        set((draft) => {
          draft.isComparisonOpen = !draft.isComparisonOpen;
        });
      },

      // Utility Actions
      reorderComparison: (fromIndex: number, toIndex: number) => {
        set((draft) => {
          const items = draft.comparisonItems;
          if (fromIndex < 0 || fromIndex >= items.length || 
              toIndex < 0 || toIndex >= items.length) {
            return;
          }

          const [movedItem] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, movedItem);
        });
      },

      getOldestItem: () => {
        const items = get().comparisonItems;
        if (items.length === 0) return null;

        return items.reduce((oldest, item) =>
          item.addedAt < oldest.addedAt ? item : oldest
        );
      },

      canAddMore: () => {
        return get().comparisonItems.length < get().maxItems;
      },

      // Comparison Analytics
      getComparisonStats: () => {
        const properties = get().getComparisonProperties();
        
        if (properties.length === 0) {
          return {
            avgPrice: 0,
            priceRange: { min: 0, max: 0 },
            commonFeatures: [],
            locationSummary: [],
            propertyTypes: [],
          };
        }

        // Calculate average price
        const prices = properties
          .map(p => Number(p.price))
          .filter(p => !isNaN(p) && p > 0);
        
        const avgPrice = prices.length > 0 
          ? prices.reduce((sum, price) => sum + price, 0) / prices.length 
          : 0;

        // Calculate price range
        const priceRange = prices.length > 0 
          ? { min: Math.min(...prices), max: Math.max(...prices) }
          : { min: 0, max: 0 };

        // Find common features
        const allFeatures = properties.flatMap(p => [
          ...p.features,
          ...(p.buildingFeatures || [])
        ]);
        
        const featureCounts = allFeatures.reduce((acc, feature) => {
          acc[feature] = (acc[feature] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const commonFeatures = Object.entries(featureCounts)
          .filter(([, count]) => count >= Math.ceil(properties.length / 2))
          .map(([feature]) => feature)
          .sort((a, b) => featureCounts[b] - featureCounts[a]);

        // Location summary
        const locations = properties.map(p => `${p.city}, ${p.state}`);
        const uniqueLocations = [...new Set(locations)];
        
        // Property types
        const propertyTypes = [...new Set(properties.map(p => p.propertyType))];

        return {
          avgPrice,
          priceRange,
          commonFeatures,
          locationSummary: uniqueLocations,
          propertyTypes,
        };
      },
    })),
    {
      name: 'newcondo-comparison',
      storage: createJSONStorage(() => localStorage),
      // Custom serialization for Date objects
      serialize: (state) => {
        return JSON.stringify({
          ...state,
          comparisonItems: state.comparisonItems.map(item => ({
            ...item,
            addedAt: item.addedAt.toISOString(),
          })),
        });
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          ...parsed,
          comparisonItems: (parsed.comparisonItems || []).map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt),
          })),
        };
      },
      // Only persist essential data
      partialize: (state) => ({
        comparisonItems: state.comparisonItems,
        // Don't persist UI state like isComparisonOpen
      }),
    }
  )
);

// Selector hooks for better performance
export const useComparisonItems = () => 
  useComparisonStore((state) => state.getComparisonProperties());

export const useComparisonCount = () => 
  useComparisonStore((state) => state.getComparisonCount());

export const useIsInComparison = (propertyId: string) =>
  useComparisonStore((state) => state.isInComparison(propertyId));

export const useComparisonPanelState = () =>
  useComparisonStore((state) => state.isComparisonOpen);

export const useCanAddMoreToComparison = () =>
  useComparisonStore((state) => state.canAddMore());

export const useComparisonStats = () =>
  useComparisonStore((state) => state.getComparisonStats());

// Action hooks
export const useComparisonActions = () => useComparisonStore((state) => ({
  addToComparison: state.addToComparison,
  removeFromComparison: state.removeFromComparison,
  toggleComparison: state.toggleComparison,
  clearComparison: state.clearComparison,
  openComparison: state.openComparison,
  closeComparison: state.closeComparison,
  toggleComparisonPanel: state.toggleComparisonPanel,
  reorderComparison: state.reorderComparison,
}));