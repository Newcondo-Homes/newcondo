// apps/admin/src/store/verificationStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Document {
  id: string;
  userId: string;
  documentType: string;
  documentSide?: string;
  fileName?: string;
  fileUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserVerification {
  id: string;
  name: string;
  email: string;
  phone?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documents: Document[];
  verificationRejectionReason?: string;
  verifiedAt?: string;
  createdAt: string;
}

interface VerificationStats {
  pending: number;
  verified: number;
  rejected: number;
  total: number;
}

interface VerificationFilters {
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documentType?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

interface VerificationState {
  // Data
  verifications: UserVerification[];
  selectedVerification: UserVerification | null;
  stats: VerificationStats;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  filters: VerificationFilters;
  
  // Actions
  fetchVerifications: (filters?: VerificationFilters) => Promise<void>;
  fetchVerificationById: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  approveVerification: (userId: string, notes?: string) => Promise<void>;
  rejectVerification: (userId: string, reason: string) => Promise<void>;
  approveDocument: (documentId: string, notes?: string) => Promise<void>;
  rejectDocument: (documentId: string, reason: string) => Promise<void>;
  setFilters: (filters: VerificationFilters) => void;
  clearFilters: () => void;
  setSelectedVerification: (verification: UserVerification | null) => void;
  reset: () => void;
}

const initialFilters: VerificationFilters = {
  status: undefined,
  documentType: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  searchQuery: undefined,
};

export const useVerificationStore = create<VerificationState>()(
  devtools(
    (set, get) => ({
      // Initial State
      verifications: [],
      selectedVerification: null,
      stats: {
        pending: 0,
        verified: 0,
        rejected: 0,
        total: 0,
      },
      isLoading: false,
      error: null,
      filters: initialFilters,

      // Fetch all verifications
      fetchVerifications: async (filters) => {
        set({ isLoading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams();
          const currentFilters = filters || get().filters;
          
          if (currentFilters.status) queryParams.append('status', currentFilters.status);
          if (currentFilters.documentType) queryParams.append('documentType', currentFilters.documentType);
          if (currentFilters.dateFrom) queryParams.append('dateFrom', currentFilters.dateFrom);
          if (currentFilters.dateTo) queryParams.append('dateTo', currentFilters.dateTo);
          if (currentFilters.searchQuery) queryParams.append('search', currentFilters.searchQuery);

          const response = await fetch(`/api/admin/verifications?${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch verifications');
          }

          const data = await response.json();
          
          set({ 
            verifications: data.verifications,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Fetch single verification
      fetchVerificationById: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/verifications/${id}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch verification');
          }

          const data = await response.json();
          
          set({ 
            selectedVerification: data.verification,
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
          const response = await fetch('/api/admin/verifications/stats');
          
          if (!response.ok) {
            throw new Error('Failed to fetch stats');
          }

          const data = await response.json();
          
          set({ stats: data.stats });
        } catch (error) {
          console.error('Failed to fetch verification stats:', error);
        }
      },

      // Approve verification
      approveVerification: async (userId, notes) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/verifications/${userId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to approve verification');
          }

          // Refresh data
          await get().fetchVerifications();
          await get().fetchStats();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Reject verification
      rejectVerification: async (userId, reason) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/verifications/${userId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to reject verification');
          }

          // Refresh data
          await get().fetchVerifications();
          await get().fetchStats();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Approve document
      approveDocument: async (documentId, notes) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/documents/${documentId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to approve document');
          }

          // Refresh current verification if selected
          if (get().selectedVerification) {
            await get().fetchVerificationById(get().selectedVerification!.id);
          }
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Reject document
      rejectDocument: async (documentId, reason) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/documents/${documentId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to reject document');
          }

          // Refresh current verification if selected
          if (get().selectedVerification) {
            await get().fetchVerificationById(get().selectedVerification!.id);
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

      // Set selected verification
      setSelectedVerification: (verification) => {
        set({ selectedVerification: verification });
      },

      // Reset store
      reset: () => {
        set({
          verifications: [],
          selectedVerification: null,
          stats: {
            pending: 0,
            verified: 0,
            rejected: 0,
            total: 0,
          },
          isLoading: false,
          error: null,
          filters: initialFilters,
        });
      },
    }),
    { name: 'VerificationStore' }
  )
);