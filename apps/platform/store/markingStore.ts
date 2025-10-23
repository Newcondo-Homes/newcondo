// apps/platform/store/markingStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type MarkingMethod = 'SELF' | 'NEWCONDO_ADMIN' | 'KNOWN_PERSON' | 'ASSIGN_AGENT';

export type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type MarkingJobStatus = 
  | 'QUEUED' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'EXPIRED';

export interface ContactPerson {
  name: string;
  phone: string;
  relationship?: string;
}

export interface PropertyAddress {
  state: string;
  lga: string;
  city: string;
  location: string;
  streetAddress?: string;
}

export interface MarkingJobData {
  propertyId: string;
  markingMethod: MarkingMethod;
  contactPerson: ContactPerson;
  address: PropertyAddress;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel: UrgencyLevel;
  propertyImages?: string[];
  hasPropertyImages: boolean;
}

export interface MarkingJob {
  id: string;
  propertyId: string;
  requestedBy: string;
  assignedAgentId?: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: UrgencyLevel;
  markingFee: number;
  paymentStatus: string;
  status: MarkingJobStatus;
  assignedAt?: string;
  completedAt?: string;
  timeSlotExpiry?: string;
  completionNotes?: string;
  completionImages?: string[];
  boundaryData?: any;
  queuePosition?: number;
  maxCompletionTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarkingStoreState {
  // Current marking job being created
  currentJobData: Partial<MarkingJobData> | null;
  
  // All marking jobs (for the current user)
  markingJobs: MarkingJob[];
  
  // Selected job for viewing details
  selectedJob: MarkingJob | null;
  
  // Loading states
  isCreatingJob: boolean;
  isLoadingJobs: boolean;
  isLoadingJobDetails: boolean;
  
  // Error states
  error: string | null;
  
  // Shareable link for known person marking
  shareableLink: string | null;
  
  // Actions
  setCurrentJobData: (data: Partial<MarkingJobData>) => void;
  updateCurrentJobData: (data: Partial<MarkingJobData>) => void;
  clearCurrentJobData: () => void;
  
  setMarkingJobs: (jobs: MarkingJob[]) => void;
  addMarkingJob: (job: MarkingJob) => void;
  updateMarkingJob: (jobId: string, updates: Partial<MarkingJob>) => void;
  
  setSelectedJob: (job: MarkingJob | null) => void;
  
  setIsCreatingJob: (isCreating: boolean) => void;
  setIsLoadingJobs: (isLoading: boolean) => void;
  setIsLoadingJobDetails: (isLoading: boolean) => void;
  
  setError: (error: string | null) => void;
  
  setShareableLink: (link: string | null) => void;
  
  // Reset store
  reset: () => void;
}

const initialState = {
  currentJobData: null,
  markingJobs: [],
  selectedJob: null,
  isCreatingJob: false,
  isLoadingJobs: false,
  isLoadingJobDetails: false,
  error: null,
  shareableLink: null,
};

export const useMarkingStore = create<MarkingStoreState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setCurrentJobData: (data) =>
          set({ currentJobData: data }, false, 'setCurrentJobData'),

        updateCurrentJobData: (data) =>
          set(
            (state) => ({
              currentJobData: {
                ...state.currentJobData,
                ...data,
              },
            }),
            false,
            'updateCurrentJobData'
          ),

        clearCurrentJobData: () =>
          set({ currentJobData: null, shareableLink: null }, false, 'clearCurrentJobData'),

        setMarkingJobs: (jobs) =>
          set({ markingJobs: jobs }, false, 'setMarkingJobs'),

        addMarkingJob: (job) =>
          set(
            (state) => ({
              markingJobs: [job, ...state.markingJobs],
            }),
            false,
            'addMarkingJob'
          ),

        updateMarkingJob: (jobId, updates) =>
          set(
            (state) => ({
              markingJobs: state.markingJobs.map((job) =>
                job.id === jobId ? { ...job, ...updates } : job
              ),
              selectedJob:
                state.selectedJob?.id === jobId
                  ? { ...state.selectedJob, ...updates }
                  : state.selectedJob,
            }),
            false,
            'updateMarkingJob'
          ),

        setSelectedJob: (job) =>
          set({ selectedJob: job }, false, 'setSelectedJob'),

        setIsCreatingJob: (isCreating) =>
          set({ isCreatingJob: isCreating }, false, 'setIsCreatingJob'),

        setIsLoadingJobs: (isLoading) =>
          set({ isLoadingJobs: isLoading }, false, 'setIsLoadingJobs'),

        setIsLoadingJobDetails: (isLoading) =>
          set({ isLoadingJobDetails: isLoading }, false, 'setIsLoadingJobDetails'),

        setError: (error) =>
          set({ error }, false, 'setError'),

        setShareableLink: (link) =>
          set({ shareableLink: link }, false, 'setShareableLink'),

        reset: () =>
          set(initialState, false, 'reset'),
      }),
      {
        name: 'marking-store',
        partialize: (state) => ({
          currentJobData: state.currentJobData,
          shareableLink: state.shareableLink,
        }),
      }
    ),
    { name: 'MarkingStore' }
  )
);




// // apps/platform/store/markingStore.ts
// import { create } from 'zustand';
// import { devtools, persist } from 'zustand/middleware';

// export type MarkingMethod = 'SELF' | 'NEWCONDO_ADMIN' | 'KNOWN_PERSON' | 'ASSIGN_AGENT';

// export type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// export type MarkingJobStatus = 
//   | 'QUEUED' 
//   | 'ASSIGNED' 
//   | 'IN_PROGRESS' 
//   | 'COMPLETED' 
//   | 'CANCELLED' 
//   | 'EXPIRED';

// export interface ContactPerson {
//   name: string;
//   phone: string;
//   relationship?: string;
// }

// export interface PropertyAddress {
//   state: string;
//   lga: string;
//   city: string;
//   location: string;
//   streetAddress?: string;
// }

// export interface MarkingJobData {
//   propertyId: string;
//   markingMethod: MarkingMethod;
//   contactPerson: ContactPerson;
//   address: PropertyAddress;
//   accessInstructions?: string;
//   preferredTime?: Date;
//   urgencyLevel: UrgencyLevel;
//   propertyImages?: string[];
//   hasPropertyImages: boolean;
// }

// export interface MarkingJob {
//   id: string;
//   propertyId: string;
//   requestedBy: string;
//   assignedAgentId?: string;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: string;
//   urgencyLevel: UrgencyLevel;
//   markingFee: number;
//   paymentStatus: string;
//   status: MarkingJobStatus;
//   assignedAt?: string;
//   completedAt?: string;
//   timeSlotExpiry?: string;
//   completionNotes?: string;
//   completionImages?: string[];
//   boundaryData?: any;
//   queuePosition?: number;
//   maxCompletionTime?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface MarkingStoreState {
//   // Current marking job being created
//   currentJobData: Partial<MarkingJobData> | null;
  
//   // All marking jobs (for the current user)
//   markingJobs: MarkingJob[];
  
//   // Selected job for viewing details
//   selectedJob: MarkingJob | null;
  
//   // Loading states
//   isCreatingJob: boolean;
//   isLoadingJobs: boolean;
//   isLoadingJobDetails: boolean;
  
//   // Error states
//   error: string | null;
  
//   // Shareable link for known person marking
//   shareableLink: string | null;
  
//   // Actions
//   setCurrentJobData: (data: Partial<MarkingJobData>) => void;
//   updateCurrentJobData: (data: Partial<MarkingJobData>) => void;
//   clearCurrentJobData: () => void;
  
//   setMarkingJobs: (jobs: MarkingJob[]) => void;
//   addMarkingJob: (job: MarkingJob) => void;
//   updateMarkingJob: (jobId: string, updates: Partial<MarkingJob>) => void;
  
//   setSelectedJob: (job: MarkingJob | null) => void;
  
//   setIsCreatingJob: (isCreating: boolean) => void;
//   setIsLoadingJobs: (isLoading: boolean) => void;
//   setIsLoadingJobDetails: (isLoading: boolean) => void;
  
//   setError: (error: string | null) => void;
  
//   setShareableLink: (link: string | null) => void;
  
//   // Reset store
//   reset: () => void;
// }

// const initialState = {
//   currentJobData: null,
//   markingJobs: [],
//   selectedJob: null,
//   isCreatingJob: false,
//   isLoadingJobs: false,
//   isLoadingJobDetails: false,
//   error: null,
//   shareableLink: null,
// };

// export const useMarkingStore = create<MarkingStoreState>()(
//   devtools(
//     persist(
//       (set) => ({
//         ...initialState,

//         setCurrentJobData: (data) =>
//           set({ currentJobData: data }, false, 'setCurrentJobData'),

//         updateCurrentJobData: (data) =>
//           set(
//             (state) => ({
//               currentJobData: {
//                 ...state.currentJobData,
//                 ...data,
//               },
//             }),
//             false,
//             'updateCurrentJobData'
//           ),

//         clearCurrentJobData: () =>
//           set({ currentJobData: null, shareableLink: null }, false, 'clearCurrentJobData'),

//         setMarkingJobs: (jobs) =>
//           set({ markingJobs: jobs }, false, 'setMarkingJobs'),

//         addMarkingJob: (job) =>
//           set(
//             (state) => ({
//               markingJobs: [job, ...state.markingJobs],
//             }),
//             false,
//             'addMarkingJob'
//           ),

//         updateMarkingJob: (jobId, updates) =>
//           set(
//             (state) => ({
//               markingJobs: state.markingJobs.map((job) =>
//                 job.id === jobId ? { ...job, ...updates } : job
//               ),
//               selectedJob:
//                 state.selectedJob?.id === jobId
//                   ? { ...state.selectedJob, ...updates }
//                   : state.selectedJob,
//             }),
//             false,
//             'updateMarkingJob'
//           ),

//         setSelectedJob: (job) =>
//           set({ selectedJob: job }, false, 'setSelectedJob'),

//         setIsCreatingJob: (isCreating) =>
//           set({ isCreatingJob: isCreating }, false, 'setIsCreatingJob'),

//         setIsLoadingJobs: (isLoading) =>
//           set({ isLoadingJobs: isLoading }, false, 'setIsLoadingJobs'),

//         setIsLoadingJobDetails: (isLoading) =>
//           set({ isLoadingJobDetails: isLoading }, false, 'setIsLoadingJobDetails'),

//         setError: (error) =>
//           set({ error }, false, 'setError'),

//         setShareableLink: (link) =>
//           set({ shareableLink: link }, false, 'setShareableLink'),

//         reset: () =>
//           set(initialState, false, 'reset'),
//       }),
//       {
//         name: 'marking-store',
//         partialize: (state) => ({
//           currentJobData: state.currentJobData,
//           shareableLink: state.shareableLink,
//         }),
//       }
//     ),
//     { name: 'MarkingStore' }
//   )
// );











// import { create } from 'zustand';
// import { devtools, persist } from 'zustand/middleware';

// // Types
// export interface MarkingJob {
//   id: string;
//   propertyId: string;
//   requestedBy: string;
//   assignedAgentId?: string;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: Date;
//   urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
//   markingFee: number;
//   paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'HELD' | 'RELEASED';
//   status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
//   assignedAt?: Date;
//   completedAt?: Date;
//   timeSlotExpiry?: Date;
//   completionNotes?: string;
//   completionImages: string[];
//   boundaryData?: any;
//   queuePosition?: number;
//   maxCompletionTime?: Date;
//   property?: {
//     id: string;
//     title: string;
//     address: string;
//     city: string;
//     state: string;
//     images: Array<{ url: string; isPrimary: boolean }>;
//   };
//   requestingUser?: {
//     id: string;
//     name: string;
//     phone: string;
//     email: string;
//   };
//   assignedAgent?: {
//     id: string;
//     name: string;
//     phone: string;
//     email: string;
//   };
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface MarkingJobFormData {
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions: string;
//   preferredTime?: Date;
//   urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
// }

// interface MarkingStore {
//   // State
//   jobs: MarkingJob[];
//   currentJob: MarkingJob | null;
//   isLoading: boolean;
//   error: string | null;
  
//   // Filters
//   filters: {
//     status: string[];
//     urgencyLevel: string[];
//     dateRange: { from?: Date; to?: Date };
//   };

//   // Actions
//   setJobs: (jobs: MarkingJob[]) => void;
//   setCurrentJob: (job: MarkingJob | null) => void;
//   addJob: (job: MarkingJob) => void;
//   updateJob: (id: string, updates: Partial<MarkingJob>) => void;
//   removeJob: (id: string) => void;
//   setLoading: (loading: boolean) => void;
//   setError: (error: string | null) => void;
//   clearError: () => void;
  
//   // Filter actions
//   setFilters: (filters: Partial<MarkingStore['filters']>) => void;
//   resetFilters: () => void;
  
//   // Utility actions
//   getJobById: (id: string) => MarkingJob | undefined;
//   getJobsByStatus: (status: MarkingJob['status']) => MarkingJob[];
//   getPendingJobs: () => MarkingJob[];
//   getActiveJobs: () => MarkingJob[];
//   getCompletedJobs: () => MarkingJob[];
//   reset: () => void;
// }

// const initialFilters = {
//   status: [],
//   urgencyLevel: [],
//   dateRange: {},
// };

// export const useMarkingStore = create<MarkingStore>()(
//   devtools(
//     persist(
//       (set, get) => ({
//         // Initial state
//         jobs: [],
//         currentJob: null,
//         isLoading: false,
//         error: null,
//         filters: initialFilters,

//         // Actions
//         setJobs: (jobs) => set({ jobs }),
        
//         setCurrentJob: (job) => set({ currentJob: job }),
        
//         addJob: (job) => set((state) => ({ 
//           jobs: [job, ...state.jobs] 
//         })),
        
//         updateJob: (id, updates) => set((state) => ({
//           jobs: state.jobs.map((job) =>
//             job.id === id ? { ...job, ...updates } : job
//           ),
//           currentJob: state.currentJob?.id === id 
//             ? { ...state.currentJob, ...updates } 
//             : state.currentJob,
//         })),
        
//         removeJob: (id) => set((state) => ({
//           jobs: state.jobs.filter((job) => job.id !== id),
//           currentJob: state.currentJob?.id === id ? null : state.currentJob,
//         })),
        
//         setLoading: (loading) => set({ isLoading: loading }),
        
//         setError: (error) => set({ error }),
        
//         clearError: () => set({ error: null }),
        
//         // Filter actions
//         setFilters: (filters) => set((state) => ({
//           filters: { ...state.filters, ...filters },
//         })),
        
//         resetFilters: () => set({ filters: initialFilters }),
        
//         // Utility actions
//         getJobById: (id) => {
//           return get().jobs.find((job) => job.id === id);
//         },
        
//         getJobsByStatus: (status) => {
//           return get().jobs.filter((job) => job.status === status);
//         },
        
//         getPendingJobs: () => {
//           return get().jobs.filter((job) => 
//             job.status === 'QUEUED' || job.status === 'ASSIGNED'
//           );
//         },
        
//         getActiveJobs: () => {
//           return get().jobs.filter((job) => 
//             job.status === 'IN_PROGRESS' || job.status === 'ASSIGNED'
//           );
//         },
        
//         getCompletedJobs: () => {
//           return get().jobs.filter((job) => job.status === 'COMPLETED');
//         },
        
//         reset: () => set({
//           jobs: [],
//           currentJob: null,
//           isLoading: false,
//           error: null,
//           filters: initialFilters,
//         }),
//       }),
//       {
//         name: 'marking-store',
//         partialize: (state) => ({
//           filters: state.filters,
//         }),
//       }
//     ),
//     { name: 'MarkingStore' }
//   )
// );