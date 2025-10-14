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

