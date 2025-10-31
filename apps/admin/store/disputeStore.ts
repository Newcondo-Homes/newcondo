// apps/admin/src/store/disputeStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface DisputeProperty {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
}

interface DisputeReporter {
  id: string;
  name: string;
  email: string;
}

interface BoundaryDispute {
  id: string;
  originalPropertyId: string;
  duplicatePropertyId: string;
  reportedBy?: string;
  status: 'PENDING' | 'CONFIRMED_DUPLICATE' | 'NOT_DUPLICATE' | 'RESOLVED';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  originalProperty: DisputeProperty;
  duplicateProperty: DisputeProperty;
  reporter?: DisputeReporter;
  createdAt: string;
}

interface DisputeStats {
  pending: number;
  confirmedDuplicates: number;
  notDuplicates: number;
  resolved: number;
  total: number;
}

interface DisputeFilters {
  status?: 'PENDING' | 'CONFIRMED_DUPLICATE' | 'NOT_DUPLICATE' | 'RESOLVED';
  city?: string;
  state?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

interface DisputeState {
  // Data
  disputes: BoundaryDispute[];
  selectedDispute: BoundaryDispute | null;
  stats: DisputeStats;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  filters: DisputeFilters;
  
  // Actions
  fetchDisputes: (filters?: DisputeFilters) => Promise<void>;
  fetchDisputeById: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  resolveDispute: (
    disputeId: string,
    status: 'CONFIRMED_DUPLICATE' | 'NOT_DUPLICATE' | 'RESOLVED',
    resolution: string
  ) => Promise<void>;
  mergeProperties: (disputeId: string, keepPropertyId: string) => Promise<void>;
  setFilters: (filters: DisputeFilters) => void;
  clearFilters: () => void;
  setSelectedDispute: (dispute: BoundaryDispute | null) => void;
  reset: () => void;
}

const initialFilters: DisputeFilters = {
  status: undefined,
  city: undefined,
  state: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  searchQuery: undefined,
};

export const useDisputeStore = create<DisputeState>()(
  devtools(
    (set, get) => ({
      // Initial State
      disputes: [],
      selectedDispute: null,
      stats: {
        pending: 0,
        confirmedDuplicates: 0,
        notDuplicates: 0,
        resolved: 0,
        total: 0,
      },
      isLoading: false,
      error: null,
      filters: initialFilters,

      // Fetch all disputes
      fetchDisputes: async (filters) => {
        set({ isLoading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams();
          const currentFilters = filters || get().filters;
          
          if (currentFilters.status) queryParams.append('status', currentFilters.status);
          if (currentFilters.city) queryParams.append('city', currentFilters.city);
          if (currentFilters.state) queryParams.append('state', currentFilters.state);
          if (currentFilters.dateFrom) queryParams.append('dateFrom', currentFilters.dateFrom);
          if (currentFilters.dateTo) queryParams.append('dateTo', currentFilters.dateTo);
          if (currentFilters.searchQuery) queryParams.append('search', currentFilters.searchQuery);

          const response = await fetch(`/api/admin/disputes?${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch disputes');
          }

          const data = await response.json();
          
          set({ 
            disputes: data.disputes,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Fetch single dispute
      fetchDisputeById: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/disputes/${id}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch dispute');
          }

          const data = await response.json();
          
          set({ 
            selectedDispute: data.dispute,
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
          const response = await fetch('/api/admin/disputes/stats');
          
          if (!response.ok) {
            throw new Error('Failed to fetch stats');
          }

          const data = await response.json();
          
          set({ stats: data.stats });
        } catch (error) {
          console.error('Failed to fetch dispute stats:', error);
        }
      },

      // Resolve dispute
      resolveDispute: async (disputeId, status, resolution) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, resolution }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to resolve dispute');
          }

          // Refresh data
          await get().fetchDisputes();
          await get().fetchStats();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Merge duplicate properties
      mergeProperties: async (disputeId, keepPropertyId) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/disputes/${disputeId}/merge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keepPropertyId }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to merge properties');
          }

          // Refresh data
          await get().fetchDisputes();
          await get().fetchStats();
          
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

      // Set selected dispute
      setSelectedDispute: (dispute) => {
        set({ selectedDispute: dispute });
      },

      // Reset store
      reset: () => {
        set({
          disputes: [],
          selectedDispute: null,
          stats: {
            pending: 0,
            confirmedDuplicates: 0,
            notDuplicates: 0,
            resolved: 0,
            total: 0,
          },
          isLoading: false,
          error: null,
          filters: initialFilters,
        });
      },
    }),
    { name: 'DisputeStore' }
  )
);