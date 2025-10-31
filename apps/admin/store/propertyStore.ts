// apps/admin/src/store/propertyStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface PropertyOwner {
  id: string;
  name: string;
  email: string;
}

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  structure: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'RENTED' | 'UNAVAILABLE';
  adminApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  boundaryVerified: boolean;
  buildingFingerprint?: string;
  owner: PropertyOwner;
  images: { url: string; isPrimary: boolean }[];
  createdAt: string;
  updatedAt: string;
}

interface PropertyStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  boundaryVerified: number;
}

interface PropertyFilters {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  propertyType?: string;
  city?: string;
  state?: string;
  boundaryVerified?: boolean;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

interface PropertyState {
  // Data
  properties: Property[];
  selectedProperty: Property | null;
  stats: PropertyStats;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  filters: PropertyFilters;
  
  // Actions
  fetchProperties: (filters?: PropertyFilters) => Promise<void>;
  fetchPropertyById: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  approveProperty: (propertyId: string, notes?: string) => Promise<void>;
  rejectProperty: (propertyId: string, reason: string) => Promise<void>;
  verifyBoundary: (propertyId: string) => Promise<void>;
  flagDuplicate: (propertyId: string, duplicateId: string, reason: string) => Promise<void>;
  setFilters: (filters: PropertyFilters) => void;
  clearFilters: () => void;
  setSelectedProperty: (property: Property | null) => void;
  reset: () => void;
}

const initialFilters: PropertyFilters = {
  status: undefined,
  propertyType: undefined,
  city: undefined,
  state: undefined,
  boundaryVerified: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  searchQuery: undefined,
};

export const usePropertyStore = create<PropertyState>()(
  devtools(
    (set, get) => ({
      // Initial State
      properties: [],
      selectedProperty: null,
      stats: {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        boundaryVerified: 0,
      },
      isLoading: false,
      error: null,
      filters: initialFilters,

      // Fetch all properties
      fetchProperties: async (filters) => {
        set({ isLoading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams();
          const currentFilters = filters || get().filters;
          
          if (currentFilters.status) queryParams.append('status', currentFilters.status);
          if (currentFilters.propertyType) queryParams.append('propertyType', currentFilters.propertyType);
          if (currentFilters.city) queryParams.append('city', currentFilters.city);
          if (currentFilters.state) queryParams.append('state', currentFilters.state);
          if (currentFilters.boundaryVerified !== undefined) {
            queryParams.append('boundaryVerified', String(currentFilters.boundaryVerified));
          }
          if (currentFilters.dateFrom) queryParams.append('dateFrom', currentFilters.dateFrom);
          if (currentFilters.dateTo) queryParams.append('dateTo', currentFilters.dateTo);
          if (currentFilters.searchQuery) queryParams.append('search', currentFilters.searchQuery);

          const response = await fetch(`/api/admin/properties?${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch properties');
          }

          const data = await response.json();
          
          set({ 
            properties: data.properties,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Fetch single property
      fetchPropertyById: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/properties/${id}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch property');
          }

          const data = await response.json();
          
          set({ 
            selectedProperty: data.property,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Fetch stats
      fetchStats: async () => {
        try {
          const response = await fetch('/api/admin/properties/stats');
          
          if (!response.ok) {
            throw new Error('Failed to fetch stats');
          }

          const data = await response.json();
          
          set({ stats: data.stats });
        } catch (error) {
          console.error('Failed to fetch property stats:', error);
        }
      },

      // Approve property
      approveProperty: async (propertyId, notes) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/properties/${propertyId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to approve property');
          }

          // Refresh data
          await get().fetchProperties();
          await get().fetchStats();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Reject property
      rejectProperty: async (propertyId, reason) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/properties/${propertyId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to reject property');
          }

          // Refresh data
          await get().fetchProperties();
          await get().fetchStats();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Verify boundary
      verifyBoundary: async (propertyId) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/properties/${propertyId}/verify-boundary`, {
            method: 'POST',
          });
          
          if (!response.ok) {
            throw new Error('Failed to verify boundary');
          }

          // Refresh current property if selected
          if (get().selectedProperty?.id === propertyId) {
            await get().fetchPropertyById(propertyId);
          }
          
          await get().fetchProperties();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Flag duplicate
      flagDuplicate: async (propertyId, duplicateId, reason) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/properties/${propertyId}/flag-duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duplicateId, reason }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to flag duplicate');
          }

          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Set filters
      setFilters: (filters) => {
        set({ filters: { ...get().filters, ...filters } });
      },

      // Clear filters
      clearFilters: () => {
        set({ filters: initialFilters });
      },

      // Set selected property
      setSelectedProperty: (property) => {
        set({ selectedProperty: property });
      },

      // Reset store
      reset: () => {
        set({
          properties: [],
          selectedProperty: null,
          stats: {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: 0,
            boundaryVerified: 0,
          },
          isLoading: false,
          error: null,
          filters: initialFilters,
        });
      },
    }),
    { name: 'PropertyStore' }
  )
);