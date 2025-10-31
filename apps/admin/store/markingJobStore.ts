// apps/admin/src/store/markingJobStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface MarkingProperty {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
}

interface MarkingAgent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  agentReliabilityScore?: number;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
}

interface MarkingJobRequester {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface MarkingJob {
  id: string;
  propertyId: string;
  requestedBy: string;
  assignedAgentId?: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  markingFee: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'HELD' | 'RELEASED';
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  assignedAt?: string;
  completedAt?: string;
  timeSlotExpiry?: string;
  completionNotes?: string;
  completionImages: string[];
  queuePosition?: number;
  maxCompletionTime?: string;
  property: MarkingProperty;
  requestingUser: MarkingJobRequester;
  assignedAgent?: MarkingAgent;
  createdAt: string;
  updatedAt: string;
}

interface MarkingJobStats {
  queued: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  expired: number;
  total: number;
  avgCompletionTime: number;
}

interface MarkingJobFilters {
  status?: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  paymentStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'HELD' | 'RELEASED';
  city?: string;
  state?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

interface MarkingJobState {
  // Data
  markingJobs: MarkingJob[];
  selectedJob: MarkingJob | null;
  stats: MarkingJobStats;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  filters: MarkingJobFilters;
  
  // Actions
  fetchMarkingJobs: (filters?: MarkingJobFilters) => Promise<void>;
  fetchMarkingJobById: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  assignAgent: (jobId: string, agentId: string) => Promise<void>;
  reassignAgent: (jobId: string, newAgentId: string, reason: string) => Promise<void>;
  approveCompletion: (jobId: string, notes?: string) => Promise<void>;
  rejectCompletion: (jobId: string, reason: string) => Promise<void>;
  cancelJob: (jobId: string, reason: string) => Promise<void>;
  extendDeadline: (jobId: string, newDeadline: string) => Promise<void>;
  setFilters: (filters: MarkingJobFilters) => void;
  clearFilters: () => void;
  setSelectedJob: (job: MarkingJob | null) => void;
  reset: () => void;
}

const initialFilters: MarkingJobFilters = {
  status: undefined,
  urgencyLevel: undefined,
  paymentStatus: undefined,
  city: undefined,
  state: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  searchQuery: undefined,
};

export const useMarkingJobStore = create<MarkingJobState>()(
  devtools(
    (set, get) => ({
      // Initial State
      markingJobs: [],
      selectedJob: null,
      stats: {
        queued: 0,
        assigned: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        expired: 0,
        total: 0,
        avgCompletionTime: 0,
      },
      isLoading: false,
      error: null,
      filters: initialFilters,

      // Fetch all marking jobs
      fetchMarkingJobs: async (filters) => {
        set({ isLoading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams();
          const currentFilters = filters || get().filters;
          
          if (currentFilters.status) queryParams.append('status', currentFilters.status);
          if (currentFilters.urgencyLevel) queryParams.append('urgencyLevel', currentFilters.urgencyLevel);
          if (currentFilters.paymentStatus) queryParams.append('paymentStatus', currentFilters.paymentStatus);
          if (currentFilters.city) queryParams.append('city', currentFilters.city);
          if (currentFilters.state) queryParams.append('state', currentFilters.state);
          if (currentFilters.dateFrom) queryParams.append('dateFrom', currentFilters.dateFrom);
          if (currentFilters.dateTo) queryParams.append('dateTo', currentFilters.dateTo);
          if (currentFilters.searchQuery) queryParams.append('search', currentFilters.searchQuery);

          const response = await fetch(`/api/admin/marking-jobs?${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch marking jobs');
          }

          const data = await response.json();
          
          set({ 
            markingJobs: data.markingJobs,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Fetch single marking job
      fetchMarkingJobById: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/marking-jobs/${id}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch marking job');
          }

          const data = await response.json();
          
          set({ 
            selectedJob: data.markingJob,
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
          const response = await fetch('/api/admin/marking-jobs/stats');
          
          if (!response.ok) {
            throw new Error('Failed to fetch stats');
          }

          const data = await response.json();
          
          set({ stats: data.stats });
        } catch (error) {
          console.error('Failed to fetch marking job stats:', error);
        }
      },

      // Assign agent
      assignAgent: async (jobId, agentId) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/marking-jobs/${jobId}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to assign agent');
          }

          // Refresh data
          await get().fetchMarkingJobs();
          await get().fetchStats();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Reassign agent
      reassignAgent: async (jobId, newAgentId, reason) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/marking-jobs/${jobId}/reassign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: newAgentId, reason }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to reassign agent');
          }

          // Refresh data
          await get().fetchMarkingJobs();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Approve completion
      approveCompletion: async (jobId, notes) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/marking-jobs/${jobId}/approve-completion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to approve completion');
          }

          // Refresh data
          await get().fetchMarkingJobs();
          await get().fetchStats();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Reject completion
      rejectCompletion: async (jobId, reason) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/marking-jobs/${jobId}/reject-completion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to reject completion');
          }

          // Refresh data
          await get().fetchMarkingJobs();
          await get().fetchStats();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Cancel job
      cancelJob: async (jobId, reason) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/marking-jobs/${jobId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to cancel job');
          }

          // Refresh data
          await get().fetchMarkingJobs();
          await get().fetchStats();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Extend deadline
      extendDeadline: async (jobId, newDeadline) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/marking-jobs/${jobId}/extend-deadline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newDeadline }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to extend deadline');
          }

          // Refresh current job if selected
          if (get().selectedJob?.id === jobId) {
            await get().fetchMarkingJobById(jobId);
          }
          
          await get().fetchMarkingJobs();
          
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

      // Set selected job
      setSelectedJob: (job) => {
        set({ selectedJob: job });
      },

      // Reset store
      reset: () => {
        set({
          markingJobs: [],
          selectedJob: null,
          stats: {
            queued: 0,
            assigned: 0,
            inProgress: 0,
            completed: 0,
            cancelled: 0,
            expired: 0,
            total: 0,
            avgCompletionTime: 0,
          },
          isLoading: false,
          error: null,
          filters: initialFilters,
        });
      },
    }),
    { name: 'MarkingJobStore' }
  )
);