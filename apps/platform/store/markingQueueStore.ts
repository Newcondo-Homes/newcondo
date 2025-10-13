// apps/platform/store/markingQueueStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface QueuedJob {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: string;
  markingFee: number;
  queuePosition: number;
  distance?: number; // Distance from agent in km
  estimatedTime?: number; // Estimated time to reach in minutes
  propertyImages?: string[];
  timeSlotExpiry?: string;
  createdAt: string;
}

export interface AcceptedJob extends QueuedJob {
  acceptedAt: string;
  timeSlotStart: string;
  timeSlotEnd: string; // 3 hours from start
}

export interface MarkingQueueStoreState {
  // Available jobs for agent
  availableJobs: QueuedJob[];
  
  // Jobs accepted by agent
  acceptedJobs: AcceptedJob[];
  
  // Currently active job
  activeJob: AcceptedJob | null;
  
  // Loading states
  isLoadingAvailableJobs: boolean;
  isLoadingAcceptedJobs: boolean;
  isAcceptingJob: boolean;
  isCompletingJob: boolean;
  
  // Filters
  filters: {
    maxDistance?: number;
    urgencyLevel?: string[];
    minFee?: number;
  };
  
  // Error states
  error: string | null;
  
  // Actions
  setAvailableJobs: (jobs: QueuedJob[]) => void;
  addAvailableJob: (job: QueuedJob) => void;
  removeAvailableJob: (jobId: string) => void;
  updateAvailableJob: (jobId: string, updates: Partial<QueuedJob>) => void;
  
  setAcceptedJobs: (jobs: AcceptedJob[]) => void;
  addAcceptedJob: (job: AcceptedJob) => void;
  removeAcceptedJob: (jobId: string) => void;
  updateAcceptedJob: (jobId: string, updates: Partial<AcceptedJob>) => void;
  
  setActiveJob: (job: AcceptedJob | null) => void;
  
  setIsLoadingAvailableJobs: (isLoading: boolean) => void;
  setIsLoadingAcceptedJobs: (isLoading: boolean) => void;
  setIsAcceptingJob: (isAccepting: boolean) => void;
  setIsCompletingJob: (isCompleting: boolean) => void;
  
  setFilters: (filters: Partial<MarkingQueueStoreState['filters']>) => void;
  clearFilters: () => void;
  
  setError: (error: string | null) => void;
  
  // Reset store
  reset: () => void;
}

const initialState = {
  availableJobs: [],
  acceptedJobs: [],
  activeJob: null,
  isLoadingAvailableJobs: false,
  isLoadingAcceptedJobs: false,
  isAcceptingJob: false,
  isCompletingJob: false,
  filters: {},
  error: null,
};

export const useMarkingQueueStore = create<MarkingQueueStoreState>()(
  devtools(
    (set) => ({
      ...initialState,

      setAvailableJobs: (jobs) =>
        set({ availableJobs: jobs }, false, 'setAvailableJobs'),

      addAvailableJob: (job) =>
        set(
          (state) => ({
            availableJobs: [...state.availableJobs, job].sort(
              (a, b) => a.queuePosition - b.queuePosition
            ),
          }),
          false,
          'addAvailableJob'
        ),

      removeAvailableJob: (jobId) =>
        set(
          (state) => ({
            availableJobs: state.availableJobs.filter((job) => job.id !== jobId),
          }),
          false,
          'removeAvailableJob'
        ),

      updateAvailableJob: (jobId, updates) =>
        set(
          (state) => ({
            availableJobs: state.availableJobs.map((job) =>
              job.id === jobId ? { ...job, ...updates } : job
            ),
          }),
          false,
          'updateAvailableJob'
        ),

      setAcceptedJobs: (jobs) =>
        set({ acceptedJobs: jobs }, false, 'setAcceptedJobs'),

      addAcceptedJob: (job) =>
        set(
          (state) => ({
            acceptedJobs: [job, ...state.acceptedJobs],
          }),
          false,
          'addAcceptedJob'
        ),

      removeAcceptedJob: (jobId) =>
        set(
          (state) => ({
            acceptedJobs: state.acceptedJobs.filter((job) => job.id !== jobId),
            activeJob: state.activeJob?.id === jobId ? null : state.activeJob,
          }),
          false,
          'removeAcceptedJob'
        ),

      updateAcceptedJob: (jobId, updates) =>
        set(
          (state) => ({
            acceptedJobs: state.acceptedJobs.map((job) =>
              job.id === jobId ? { ...job, ...updates } : job
            ),
            activeJob:
              state.activeJob?.id === jobId
                ? { ...state.activeJob, ...updates }
                : state.activeJob,
          }),
          false,
          'updateAcceptedJob'
        ),

      setActiveJob: (job) =>
        set({ activeJob: job }, false, 'setActiveJob'),

      setIsLoadingAvailableJobs: (isLoading) =>
        set({ isLoadingAvailableJobs: isLoading }, false, 'setIsLoadingAvailableJobs'),

      setIsLoadingAcceptedJobs: (isLoading) =>
        set({ isLoadingAcceptedJobs: isLoading }, false, 'setIsLoadingAcceptedJobs'),

      setIsAcceptingJob: (isAccepting) =>
        set({ isAcceptingJob: isAccepting }, false, 'setIsAcceptingJob'),

      setIsCompletingJob: (isCompleting) =>
        set({ isCompletingJob: isCompleting }, false, 'setIsCompletingJob'),

      setFilters: (filters) =>
        set(
          (state) => ({
            filters: { ...state.filters, ...filters },
          }),
          false,
          'setFilters'
        ),

      clearFilters: () =>
        set({ filters: {} }, false, 'clearFilters'),

      setError: (error) =>
        set({ error }, false, 'setError'),

      reset: () =>
        set(initialState, false, 'reset'),
    }),
    { name: 'MarkingQueueStore' }
  )
);