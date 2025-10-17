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









// import { create } from 'zustand';
// import { devtools } from 'zustand/middleware';

// export type MarkingJobStatus = 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
// export type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// export interface QueuedMarkingJob {
//   id: string;
//   propertyId: string;
//   requestedBy: string;
//   assignedAgentId?: string;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: Date;
//   urgencyLevel: UrgencyLevel;
//   markingFee: number;
//   status: MarkingJobStatus;
//   assignedAt?: Date;
//   completedAt?: Date;
//   timeSlotExpiry?: Date;
//   queuePosition?: number;
//   maxCompletionTime?: Date;
//   propertyDetails?: {
//     title: string;
//     address: string;
//     city: string;
//     state: string;
//     images?: string[];
//   };
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface TimeSlot {
//   startTime: Date;
//   endTime: Date;
//   isActive: boolean;
//   remainingTime: number; // in seconds
// }

// export interface QueueStats {
//   totalJobs: number;
//   queuedJobs: number;
//   assignedJobs: number;
//   completedJobs: number;
//   expiredJobs: number;
//   averageCompletionTime: number; // in hours
//   estimatedWaitTime: number; // in hours
// }

// interface MarkingQueueState {
//   // Queue data
//   jobs: QueuedMarkingJob[];
//   currentJob: QueuedMarkingJob | null;
//   myPosition: number | null;
//   queueStats: QueueStats | null;
  
//   // Time slot management
//   activeTimeSlot: TimeSlot | null;
//   timeSlotInterval: NodeJS.Timeout | null;
  
//   // UI state
//   isLoading: boolean;
//   error: string | null;
  
//   // Filters
//   filters: {
//     status?: MarkingJobStatus[];
//     urgency?: UrgencyLevel[];
//     city?: string;
//     state?: string;
//   };
  
//   // Pagination
//   pagination: {
//     page: number;
//     limit: number;
//     total: number;
//     hasMore: boolean;
//   };
  
//   // Actions
//   setJobs: (jobs: QueuedMarkingJob[]) => void;
//   addJob: (job: QueuedMarkingJob) => void;
//   updateJob: (jobId: string, updates: Partial<QueuedMarkingJob>) => void;
//   removeJob: (jobId: string) => void;
//   setCurrentJob: (job: QueuedMarkingJob | null) => void;
  
//   // Queue management
//   setMyPosition: (position: number | null) => void;
//   setQueueStats: (stats: QueueStats) => void;
//   moveJobInQueue: (jobId: string, newPosition: number) => void;
  
//   // Time slot management
//   startTimeSlot: (startTime: Date, durationHours: number) => void;
//   updateTimeSlot: () => void;
//   clearTimeSlot: () => void;
  
//   // Filters and pagination
//   setFilters: (filters: Partial<MarkingQueueState['filters']>) => void;
//   clearFilters: () => void;
//   setPagination: (pagination: Partial<MarkingQueueState['pagination']>) => void;
  
//   // UI state
//   setLoading: (loading: boolean) => void;
//   setError: (error: string | null) => void;
  
//   // Utilities
//   getJobById: (jobId: string) => QueuedMarkingJob | undefined;
//   getJobsByStatus: (status: MarkingJobStatus) => QueuedMarkingJob[];
//   getExpiredJobs: () => QueuedMarkingJob[];
//   getAvailableJobs: () => QueuedMarkingJob[];
//   sortJobsByPriority: () => QueuedMarkingJob[];
  
//   // Reset
//   reset: () => void;
// }

// const initialPagination = {
//   page: 1,
//   limit: 20,
//   total: 0,
//   hasMore: false,
// };

// const initialFilters = {
//   status: undefined,
//   urgency: undefined,
//   city: undefined,
//   state: undefined,
// };

// export const useMarkingQueueStore = create<MarkingQueueState>()(
//   devtools(
//     (set, get) => ({
//       // Initial state
//       jobs: [],
//       currentJob: null,
//       myPosition: null,
//       queueStats: null,
//       activeTimeSlot: null,
//       timeSlotInterval: null,
//       isLoading: false,
//       error: null,
//       filters: initialFilters,
//       pagination: initialPagination,
      
//       // Set jobs
//       setJobs: (jobs) => set({ jobs, error: null }),
      
//       // Add job
//       addJob: (job) => set((state) => ({
//         jobs: [job, ...state.jobs],
//         error: null,
//       })),
      
//       // Update job
//       updateJob: (jobId, updates) => set((state) => ({
//         jobs: state.jobs.map((job) =>
//           job.id === jobId ? { ...job, ...updates, updatedAt: new Date() } : job
//         ),
//         currentJob: state.currentJob?.id === jobId 
//           ? { ...state.currentJob, ...updates, updatedAt: new Date() }
//           : state.currentJob,
//         error: null,
//       })),
      
//       // Remove job
//       removeJob: (jobId) => set((state) => ({
//         jobs: state.jobs.filter((job) => job.id !== jobId),
//         currentJob: state.currentJob?.id === jobId ? null : state.currentJob,
//         error: null,
//       })),
      
//       // Set current job
//       setCurrentJob: (job) => set({ currentJob: job }),
      
//       // Set my position
//       setMyPosition: (position) => set({ myPosition: position }),
      
//       // Set queue stats
//       setQueueStats: (stats) => set({ queueStats: stats }),
      
//       // Move job in queue
//       moveJobInQueue: (jobId, newPosition) => set((state) => {
//         const jobs = [...state.jobs];
//         const jobIndex = jobs.findIndex((job) => job.id === jobId);
        
//         if (jobIndex === -1) return state;
        
//         const [job] = jobs.splice(jobIndex, 1);
//         job.queuePosition = newPosition;
//         jobs.splice(newPosition - 1, 0, job);
        
//         // Update positions for all jobs
//         const updatedJobs = jobs.map((j, index) => ({
//           ...j,
//           queuePosition: index + 1,
//         }));
        
//         return { jobs: updatedJobs };
//       }),
      
//       // Start time slot
//       startTimeSlot: (startTime, durationHours) => {
//         const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
//         const remainingTime = Math.max(0, (endTime.getTime() - Date.now()) / 1000);
        
//         const timeSlot: TimeSlot = {
//           startTime,
//           endTime,
//           isActive: true,
//           remainingTime,
//         };
        
//         // Clear any existing interval
//         const currentInterval = get().timeSlotInterval;
//         if (currentInterval) {
//           clearInterval(currentInterval);
//         }
        
//         // Start new interval to update remaining time
//         const interval = setInterval(() => {
//           get().updateTimeSlot();
//         }, 1000);
        
//         set({ activeTimeSlot: timeSlot, timeSlotInterval: interval });
//       },
      
//       // Update time slot
//       updateTimeSlot: () => set((state) => {
//         if (!state.activeTimeSlot) return state;
        
//         const remainingTime = Math.max(
//           0,
//           (state.activeTimeSlot.endTime.getTime() - Date.now()) / 1000
//         );
        
//         const isActive = remainingTime > 0;
        
//         // Clear interval if time slot expired
//         if (!isActive && state.timeSlotInterval) {
//           clearInterval(state.timeSlotInterval);
//         }
        
//         return {
//           activeTimeSlot: {
//             ...state.activeTimeSlot,
//             remainingTime,
//             isActive,
//           },
//           timeSlotInterval: isActive ? state.timeSlotInterval : null,
//         };
//       }),
      
//       // Clear time slot
//       clearTimeSlot: () => {
//         const interval = get().timeSlotInterval;
//         if (interval) {
//           clearInterval(interval);
//         }
//         set({ activeTimeSlot: null, timeSlotInterval: null });
//       },
      
//       // Set filters
//       setFilters: (filters) => set((state) => ({
//         filters: { ...state.filters, ...filters },
//         pagination: { ...state.pagination, page: 1 }, // Reset to first page
//       })),
      
//       // Clear filters
//       clearFilters: () => set({
//         filters: initialFilters,
//         pagination: initialPagination,
//       }),
      
//       // Set pagination
//       setPagination: (pagination) => set((state) => ({
//         pagination: { ...state.pagination, ...pagination },
//       })),
      
//       // Set loading
//       setLoading: (loading) => set({ isLoading: loading }),
      
//       // Set error
//       setError: (error) => set({ error, isLoading: false }),
      
//       // Get job by ID
//       getJobById: (jobId) => {
//         return get().jobs.find((job) => job.id === jobId);
//       },
      
//       // Get jobs by status
//       getJobsByStatus: (status) => {
//         return get().jobs.filter((job) => job.status === status);
//       },
      
//       // Get expired jobs
//       getExpiredJobs: () => {
//         const now = Date.now();
//         return get().jobs.filter(
//           (job) => job.timeSlotExpiry && new Date(job.timeSlotExpiry).getTime() < now
//         );
//       },
      
//       // Get available jobs
//       getAvailableJobs: () => {
//         return get().jobs.filter(
//           (job) => job.status === 'QUEUED' && !job.assignedAgentId
//         );
//       },
      
//       // Sort jobs by priority
//       sortJobsByPriority: () => {
//         const urgencyPriority = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
        
//         return [...get().jobs].sort((a, b) => {
//           // First sort by urgency
//           const urgencyDiff = urgencyPriority[b.urgencyLevel] - urgencyPriority[a.urgencyLevel];
//           if (urgencyDiff !== 0) return urgencyDiff;
          
//           // Then sort by queue position
//           if (a.queuePosition && b.queuePosition) {
//             return a.queuePosition - b.queuePosition;
//           }
          
//           // Finally sort by creation time
//           return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
//         });
//       },
      
//       // Reset
//       reset: () => {
//         const interval = get().timeSlotInterval;
//         if (interval) {
//           clearInterval(interval);
//         }
        
//         set({
//           jobs: [],
//           currentJob: null,
//           myPosition: null,
//           queueStats: null,
//           activeTimeSlot: null,
//           timeSlotInterval: null,
//           isLoading: false,
//           error: null,
//           filters: initialFilters,
//           pagination: initialPagination,
//         });
//       },
//     }),
//     { name: 'MarkingQueueStore' }
//   )
// );