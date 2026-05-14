// apps/platform/store/markingServiceStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface MarkingJob {
  id: string;
  propertyId: string;
  propertyTitle: string;
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  assignedAgentId?: string;
  assignedAgentName?: string;
  markingFee: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  queuePosition?: number;
  timeSlotExpiry?: string;
  completedAt?: string;
  createdAt: string;
}

// interface MarkingJobDetails {
//   jobId: string;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   completionImages: string[];
//   boundaryData?: any;
// }

interface MarkingServiceState {
  // Marking jobs
  markingJobs: MarkingJob[];
  currentJobId: string | null;
  
  // Filters
  statusFilter: 'ALL' | 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  
  // Job creation state
  isCreatingJob: boolean;
  currentStep: 'assignment-type' | 'contact-details' | 'payment' | 'confirmation';
  jobCreationData: {
    propertyId?: string;
    assignmentType?: 'SELF' | 'NEWCONDO_ADMIN' | 'SEND_LINK' | 'ASSIGN_AGENTS';
    contactPersonName?: string;
    contactPersonPhone?: string;
    accessInstructions?: string;
    preferredTime?: Date;
    urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  };
  
  // Job completion state (for agents)
  isCompletingJob: boolean;
  completionData: {
    jobId?: string;
    completionImages: string[];
    boundaryCoordinates?: any;
    completionNotes?: string;
  };
  
  // Shareable link (for 'SEND_LINK' option)
  shareableLink: string | null;
  
  // Confirmation state (for property owners)
  pendingConfirmations: string[];
  
  // UI state
  showJobDetailsModal: boolean;
  showConfirmationModal: boolean;
  selectedJobForConfirmation: string | null;
  
  // Actions - Marking jobs
  setMarkingJobs: (jobs: MarkingJob[]) => void;
  addMarkingJob: (job: MarkingJob) => void;
  updateMarkingJob: (id: string, updates: Partial<MarkingJob>) => void;
  removeMarkingJob: (id: string) => void;
  
  setCurrentJobId: (id: string | null) => void;
  setStatusFilter: (status: MarkingServiceState['statusFilter']) => void;
  
  // Actions - Job creation
  startJobCreation: (propertyId: string) => void;
  setCurrentStep: (step: MarkingServiceState['currentStep']) => void;
  updateJobCreationData: (data: Partial<MarkingServiceState['jobCreationData']>) => void;
  resetJobCreation: () => void;
  
  // Actions - Job completion
  startJobCompletion: (jobId: string) => void;
  addCompletionImage: (imageUrl: string) => void;
  removeCompletionImage: (imageUrl: string) => void;
  updateCompletionData: (data: Partial<MarkingServiceState['completionData']>) => void;
  resetJobCompletion: () => void;
  
  // Actions - Shareable link
  setShareableLink: (link: string | null) => void;
  copyShareableLink: () => Promise<boolean>;
  
  // Actions - Confirmation
  addPendingConfirmation: (jobId: string) => void;
  removePendingConfirmation: (jobId: string) => void;
  
  // Actions - UI
  toggleJobDetailsModal: () => void;
  toggleConfirmationModal: (jobId?: string) => void;
  
  // Computed values
  getFilteredJobs: () => MarkingJob[];
  getJobsByStatus: (status: MarkingJob['status']) => MarkingJob[];
  getTotalPendingPayment: () => number;
  getActiveJobsCount: () => number;
}

export const useMarkingServiceStore = create<MarkingServiceState>()(
  devtools(
    persist(
      (set, get) => ({
        markingJobs: [],
        currentJobId: null,
        statusFilter: 'ALL',
        isCreatingJob: false,
        currentStep: 'assignment-type',
        jobCreationData: {},
        isCompletingJob: false,
        completionData: {
          completionImages: [],
        },
        shareableLink: null,
        pendingConfirmations: [],
        showJobDetailsModal: false,
        showConfirmationModal: false,
        selectedJobForConfirmation: null,

        // Marking jobs actions
        setMarkingJobs: (jobs) =>
          set({ markingJobs: jobs }, false, 'setMarkingJobs'),

        addMarkingJob: (job) =>
          set(
            (state) => ({ markingJobs: [job, ...state.markingJobs] }),
            false,
            'addMarkingJob'
          ),

        updateMarkingJob: (id, updates) =>
          set(
            (state) => ({
              markingJobs: state.markingJobs.map((j) =>
                j.id === id ? { ...j, ...updates } : j
              ),
            }),
            false,
            'updateMarkingJob'
          ),

        removeMarkingJob: (id) =>
          set(
            (state) => ({
              markingJobs: state.markingJobs.filter((j) => j.id !== id),
            }),
            false,
            'removeMarkingJob'
          ),

        setCurrentJobId: (id) =>
          set({ currentJobId: id }, false, 'setCurrentJobId'),

        setStatusFilter: (status) =>
          set({ statusFilter: status }, false, 'setStatusFilter'),

        // Job creation actions
        startJobCreation: (propertyId) =>
          set(
            {
              isCreatingJob: true,
              currentStep: 'assignment-type',
              jobCreationData: { propertyId },
            },
            false,
            'startJobCreation'
          ),

        setCurrentStep: (step) =>
          set({ currentStep: step }, false, 'setCurrentStep'),

        updateJobCreationData: (data) =>
          set(
            (state) => ({
              jobCreationData: { ...state.jobCreationData, ...data },
            }),
            false,
            'updateJobCreationData'
          ),

        resetJobCreation: () =>
          set(
            {
              isCreatingJob: false,
              currentStep: 'assignment-type',
              jobCreationData: {},
              shareableLink: null,
            },
            false,
            'resetJobCreation'
          ),

        // Job completion actions
        startJobCompletion: (jobId) =>
          set(
            {
              isCompletingJob: true,
              completionData: { jobId, completionImages: [] },
            },
            false,
            'startJobCompletion'
          ),

        addCompletionImage: (imageUrl) =>
          set(
            (state) => ({
              completionData: {
                ...state.completionData,
                completionImages: [
                  ...state.completionData.completionImages,
                  imageUrl,
                ],
              },
            }),
            false,
            'addCompletionImage'
          ),

        removeCompletionImage: (imageUrl) =>
          set(
            (state) => ({
              completionData: {
                ...state.completionData,
                completionImages: state.completionData.completionImages.filter(
                  (img) => img !== imageUrl
                ),
              },
            }),
            false,
            'removeCompletionImage'
          ),

        updateCompletionData: (data) =>
          set(
            (state) => ({
              completionData: { ...state.completionData, ...data },
            }),
            false,
            'updateCompletionData'
          ),

        resetJobCompletion: () =>
          set(
            {
              isCompletingJob: false,
              completionData: { completionImages: [] },
            },
            false,
            'resetJobCompletion'
          ),

        // Shareable link actions
        setShareableLink: (link) =>
          set({ shareableLink: link }, false, 'setShareableLink'),

        copyShareableLink: async () => {
          const { shareableLink } = get();
          
          if (!shareableLink) return false;
          
          try {
            await navigator.clipboard.writeText(shareableLink);
            return true;
          } catch (error) {
            console.error('Failed to copy link:', error);
            return false;
          }
        },

        // Confirmation actions
        addPendingConfirmation: (jobId) =>
          set(
            (state) => ({
              pendingConfirmations: state.pendingConfirmations.includes(jobId)
                ? state.pendingConfirmations
                : [...state.pendingConfirmations, jobId],
            }),
            false,
            'addPendingConfirmation'
          ),

        removePendingConfirmation: (jobId) =>
          set(
            (state) => ({
              pendingConfirmations: state.pendingConfirmations.filter(
                (id) => id !== jobId
              ),
            }),
            false,
            'removePendingConfirmation'
          ),

        // UI actions
        toggleJobDetailsModal: () =>
          set(
            (state) => ({ showJobDetailsModal: !state.showJobDetailsModal }),
            false,
            'toggleJobDetailsModal'
          ),

        toggleConfirmationModal: (jobId) =>
          set(
            (state) => ({
              showConfirmationModal: !state.showConfirmationModal,
              selectedJobForConfirmation: jobId || null,
            }),
            false,
            'toggleConfirmationModal'
          ),

        // Computed values
        getFilteredJobs: () => {
          const { markingJobs, statusFilter } = get();
          
          if (statusFilter === 'ALL') {
            return markingJobs;
          }
          
          return markingJobs.filter((j) => j.status === statusFilter);
        },

        getJobsByStatus: (status) => {
          const { markingJobs } = get();
          return markingJobs.filter((j) => j.status === status);
        },

        getTotalPendingPayment: () => {
          const { markingJobs } = get();
          return markingJobs
            .filter((j) => j.paymentStatus === 'PENDING')
            .reduce((sum, j) => sum + j.markingFee, 0);
        },

        getActiveJobsCount: () => {
          const { markingJobs } = get();
          return markingJobs.filter(
            (j) => ['QUEUED', 'ASSIGNED', 'IN_PROGRESS'].includes(j.status)
          ).length;
        },
      }),
      {
        name: 'marking-service-storage',
        partialize: (state) => ({
          statusFilter: state.statusFilter,
          pendingConfirmations: state.pendingConfirmations,
        }),
      }
    ),
    { name: 'MarkingServiceStore' }
  )
);