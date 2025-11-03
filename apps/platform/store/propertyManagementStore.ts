// apps/platform/store/propertyManagementStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Property {
  id: string;
  title: string;
  status: string;
  structure: string;
  price?: number;
  isAvailable: boolean;
  viewCount: number;
  city: string;
  state: string;
  createdAt: string;
  updatedAt: string;
}

interface PropertyManagementState {
  // Selected properties for bulk actions
  selectedProperties: string[];
  
  // View mode
  viewMode: 'grid' | 'list';
  
  // Current property being edited
  currentProperty: Property | null;
  
  // Bulk action state
  isBulkActionMode: boolean;
  
  // Actions
  setSelectedProperties: (ids: string[]) => void;
  togglePropertySelection: (id: string) => void;
  selectAllProperties: (ids: string[]) => void;
  clearSelection: () => void;
  
  setViewMode: (mode: 'grid' | 'list') => void;
  setCurrentProperty: (property: Property | null) => void;
  
  toggleBulkActionMode: () => void;
  
  // Bulk operations
  bulkUpdateStatus: (status: string) => Promise<void>;
  bulkToggleAvailability: (isAvailable: boolean) => Promise<void>;
  bulkDelete: () => Promise<void>;
}

export const usePropertyManagementStore = create<PropertyManagementState>()(
  devtools(
    persist(
      (set, get) => ({
        selectedProperties: [],
        viewMode: 'grid',
        currentProperty: null,
        isBulkActionMode: false,

        setSelectedProperties: (ids) =>
          set({ selectedProperties: ids }, false, 'setSelectedProperties'),

        togglePropertySelection: (id) =>
          set(
            (state) => ({
              selectedProperties: state.selectedProperties.includes(id)
                ? state.selectedProperties.filter((propId) => propId !== id)
                : [...state.selectedProperties, id],
            }),
            false,
            'togglePropertySelection'
          ),

        selectAllProperties: (ids) =>
          set({ selectedProperties: ids }, false, 'selectAllProperties'),

        clearSelection: () =>
          set({ selectedProperties: [] }, false, 'clearSelection'),

        setViewMode: (mode) => set({ viewMode: mode }, false, 'setViewMode'),

        setCurrentProperty: (property) =>
          set({ currentProperty: property }, false, 'setCurrentProperty'),

        toggleBulkActionMode: () =>
          set(
            (state) => ({ 
              isBulkActionMode: !state.isBulkActionMode,
              selectedProperties: !state.isBulkActionMode ? [] : state.selectedProperties
            }),
            false,
            'toggleBulkActionMode'
          ),

        bulkUpdateStatus: async (status) => {
          const { selectedProperties } = get();
          // Implementation would call API endpoint
          // For now, just clear selection after action
          set({ selectedProperties: [] }, false, 'bulkUpdateStatus');
        },

        bulkToggleAvailability: async (isAvailable) => {
          const { selectedProperties } = get();
          // Implementation would call API endpoint
          set({ selectedProperties: [] }, false, 'bulkToggleAvailability');
        },

        bulkDelete: async () => {
          const { selectedProperties } = get();
          // Implementation would call API endpoint
          set({ selectedProperties: [] }, false, 'bulkDelete');
        },
      }),
      {
        name: 'property-management-storage',
        partialize: (state) => ({
          viewMode: state.viewMode,
        }),
      }
    ),
    { name: 'PropertyManagementStore' }
  )
);