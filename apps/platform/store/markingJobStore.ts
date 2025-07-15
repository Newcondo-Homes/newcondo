// apps/platform/store/markingJobStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface MarkingJob {
  id: string;
  propertyId: string;
  requestedBy: string;
  assignedAgentId?: string;
  
  // Job Details
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  
  // Pricing
  markingFee: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'HELD' | 'RELEASED';
  
  // Job Status
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  assignedAt?: string;
  completedAt?: string;
  timeSlotExpiry?: string; // 3-hour time slot limit
  
  // Completion Data
  completionNotes?: string;
  completionImages: string[];
  boundaryData?: Array<{ lat: number; lng: number }>;
  
  // Queue Management
  queuePosition?: number;
  maxCompletionTime?: string; // Max 3 days from request
  
  // Property details for context
  propertyTitle: string;
  propertyAddress: string;
  propertyCoordinates: { lat: number; lng: number };
  
  createdAt: string;
  updatedAt: string;
}

interface MarkingAgent {
  id: string;
  name: string;
  isAvailableForMarking: boolean;
  agentServiceAreas: string[];
  agentReliabilityScore: number;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  currentActiveJobs: number;
  averageCompletionTime: number; // in hours
  lastActiveAt: string;
}

interface MarkingJobRequest {
  propertyId: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  markingOption: 'ASSIGN_TO_AGENT' | 'SOMEONE_I_KNOW';
  specificPersonDetails?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface MarkingJobPayment {
  jobId: string;
  amount: number;
  paymentMethod: 'CARD' | 'BANK_TRANSFER' | 'WALLET';
  paymentReference?: string;
  transactionId?: string;
}

interface MarkingJobStore {
  // State
  markingJobs: MarkingJob[];
  availableAgents: MarkingAgent[];
  currentJob: MarkingJob | null;
  isLoading: boolean;
  error: string | null;
  
  // Queue state
  queuePosition: number | null;
  estimatedWaitTime: number | null; // in minutes
  
  // Payment state
  paymentLoading: boolean;
  paymentError: string | null;
  paymentSuccess: boolean;
  
  // Job creation state
  jobRequest: MarkingJobRequest | null;
  markingFeeCalculation: {
    baseFee: number;
    urgencyMultiplier: number;
    totalFee: number;
  } | null;
  
  // Real-time updates
  jobUpdates: {
    [jobId: string]: {
      status: string;
      message: string;
      timestamp: string;
    }[];
  };
  
  // Actions
  setMarkingJobs: (jobs: MarkingJob[]) => void;
  setAvailableAgents: (agents: MarkingAgent[]) => void;
  setCurrentJob: (job: MarkingJob | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Job request actions
  setJobRequest: (request: MarkingJobRequest | null) => void;
  calculateMarkingFee: (urgencyLevel: string, location: { lat: number; lng: number }) => Promise<number>;
  
  // Job management actions
  createMarkingJob: (request: MarkingJobRequest) => Promise<MarkingJob>;
  cancelMarkingJob: (jobId: string, reason: string) => Promise<void>;
  acceptJobAssignment: (jobId: string) => Promise<void>;
  rejectJobAssignment: (jobId: string, reason: string) => Promise<void>;
  
  // Job completion actions
  startJob: (jobId: string) => Promise<void>;
  completeJob: (jobId: string, completionData: {
    notes: string;
    images: string[];
    boundaryData: Array<{ lat: number; lng: number }>;
  }) => Promise<void>;
  
  // Payment actions
  processPayment: (payment: MarkingJobPayment) => Promise<void>;
  refundPayment: (jobId: string, reason: string) => Promise<void>;
  
  // Queue management
  getQueuePosition: (jobId: string) => Promise<number>;
  getEstimatedWaitTime: (jobId: string) => Promise<number>;
  
  // Agent management
  findAvailableAgents: (location: { lat: number; lng: number }, radius: number) => Promise<MarkingAgent[]>;
  assignJobToAgent: (jobId: string, agentId: string) => Promise<void>;
  
  // Real-time updates
  addJobUpdate: (jobId: string, update: { status: string; message: string }) => void;
  subscribeToJobUpdates: (jobId: string) => void;
  unsubscribeFromJobUpdates: (jobId: string) => void;
  
  // Filtering and search
  filterJobsByStatus: (status: string) => MarkingJob[];
  filterJobsByUrgency: (urgency: string) => MarkingJob[];
  getJobsByUser: (userId: string) => MarkingJob[];
  getJobsByAgent: (agentId: string) => MarkingJob[];
  
  // Utility actions
  isJobExpired: (job: MarkingJob) => boolean;
  canCancelJob: (job: MarkingJob) => boolean;
  getJobStatusColor: (status: string) => string;
  formatTimeRemaining: (expiryTime: string) => string;
  
  // Reset actions
  reset: () => void;
  clearError: () => void;
  clearPaymentState: () => void;
}

const useMarkingJobStore = create<MarkingJobStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      markingJobs: [],
      availableAgents: [],
      currentJob: null,
      isLoading: false,
      error: null,
      queuePosition: null,
      estimatedWaitTime: null,
      paymentLoading: false,
      paymentError: null,
      paymentSuccess: false,
      jobRequest: null,
      markingFeeCalculation: null,
      jobUpdates: {},
      
      // Basic setters
      setMarkingJobs: (jobs) => set({ markingJobs: jobs }),
      setAvailableAgents: (agents) => set({ availableAgents: agents }),
      setCurrentJob: (job) => set({ currentJob: job }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      // Job request actions
      setJobRequest: (request) => set({ jobRequest: request }),
      
      calculateMarkingFee: async (urgencyLevel, location) => {
        set({ isLoading: true, error: null });
        
        try {
          const baseFee = 5000; // Base fee in NGN
          let urgencyMultiplier = 1;
          
          switch (urgencyLevel) {
            case 'LOW':
              urgencyMultiplier = 0.8;
              break;
            case 'NORMAL':
              urgencyMultiplier = 1;
              break;
            case 'HIGH':
              urgencyMultiplier = 1.5;
              break;
            case 'URGENT':
              urgencyMultiplier = 2;
              break;
          }
          
          const totalFee = baseFee * urgencyMultiplier;
          
          set({
            markingFeeCalculation: {
              baseFee,
              urgencyMultiplier,
              totalFee
            },
            isLoading: false
          });
          
          return totalFee;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to calculate fee';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      // Job management
      createMarkingJob: async (request) => {
        set({ isLoading: true, error: null });
        
        try {
          const feeCalculation = get().markingFeeCalculation;
          if (!feeCalculation) {
            throw new Error('Fee calculation required');
          }
          
          const newJob: MarkingJob = {
            id: `job_${Date.now()}`,
            propertyId: request.propertyId,
            requestedBy: 'current_user_id', // Would come from auth
            contactPersonName: request.contactPersonName,
            contactPersonPhone: request.contactPersonPhone,
            accessInstructions: request.accessInstructions,
            preferredTime: request.preferredTime,
            urgencyLevel: request.urgencyLevel,
            markingFee: feeCalculation.totalFee,
            paymentStatus: 'PENDING',
            status: 'QUEUED',
            completionImages: [],
            queuePosition: get().markingJobs.length + 1,
            maxCompletionTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
            propertyTitle: 'Property Title', // Would come from property data
            propertyAddress: 'Property Address',
            propertyCoordinates: { lat: 0, lng: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          set(state => ({
            markingJobs: [...state.markingJobs, newJob],
            currentJob: newJob,
            isLoading: false
          }));
          
          return newJob;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create job';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      cancelMarkingJob: async (jobId, reason) => {
        set({ isLoading: true, error: null });
        
        try {
          set(state => ({
            markingJobs: state.markingJobs.map(job =>
              job.id === jobId
                ? { ...job, status: 'CANCELLED' as const, updatedAt: new Date().toISOString() }
                : job
            ),
            isLoading: false
          }));
          
          get().addJobUpdate(jobId, {
            status: 'CANCELLED',
            message: `Job cancelled: ${reason}`
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to cancel job';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      acceptJobAssignment: async (jobId) => {
        set({ isLoading: true, error: null });
        
        try {
          set(state => ({
            markingJobs: state.markingJobs.map(job =>
              job.id === jobId
                ? { 
                    ...job, 
                    status: 'ASSIGNED' as const,
                    assignedAt: new Date().toISOString(),
                    timeSlotExpiry: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours
                    updatedAt: new Date().toISOString()
                  }
                : job
            ),
            isLoading: false
          }));
          
          get().addJobUpdate(jobId, {
            status: 'ASSIGNED',
            message: 'Job assigned to agent'
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to accept assignment';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      rejectJobAssignment: async (jobId, reason) => {
        set({ isLoading: true, error: null });
        
        try {
          set(state => ({
            markingJobs: state.markingJobs.map(job =>
              job.id === jobId
                ? { 
                    ...job, 
                    status: 'QUEUED' as const,
                    assignedAgentId: undefined,
                    updatedAt: new Date().toISOString()
                  }
                : job
            ),
            isLoading: false
          }));
          
          get().addJobUpdate(jobId, {
            status: 'QUEUED',
            message: `Assignment rejected: ${reason}`
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to reject assignment';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      // Job completion
      startJob: async (jobId) => {
        set({ isLoading: true, error: null });
        
        try {
          set(state => ({
            markingJobs: state.markingJobs.map(job =>
              job.id === jobId
                ? { 
                    ...job, 
                    status: 'IN_PROGRESS' as const,
                    updatedAt: new Date().toISOString()
                  }
                : job
            ),
            isLoading: false
          }));
          
          get().addJobUpdate(jobId, {
            status: 'IN_PROGRESS',
            message: 'Job started'
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to start job';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      completeJob: async (jobId, completionData) => {
        set({ isLoading: true, error: null });
        
        try {
          set(state => ({
            markingJobs: state.markingJobs.map(job =>
              job.id === jobId
                ? { 
                    ...job, 
                    status: 'COMPLETED' as const,
                    completedAt: new Date().toISOString(),
                    completionNotes: completionData.notes,
                    completionImages: completionData.images,
                    boundaryData: completionData.boundaryData,
                    updatedAt: new Date().toISOString()
                  }
                : job
            ),
            isLoading: false
          }));
          
          get().addJobUpdate(jobId, {
            status: 'COMPLETED',
            message: 'Job completed successfully'
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to complete job';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      // Payment actions
      processPayment: async (payment) => {
        set({ paymentLoading: true, paymentError: null, paymentSuccess: false });
        
        try {
          // Mock payment processing
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          set(state => ({
            markingJobs: state.markingJobs.map(job =>
              job.id === payment.jobId
                ? { 
                    ...job, 
                    paymentStatus: 'SUCCESS' as const,
                    updatedAt: new Date().toISOString()
                  }
                : job
            ),
            paymentLoading: false,
            paymentSuccess: true
          }));
          
          get().addJobUpdate(payment.jobId, {
            status: 'PAYMENT_SUCCESS',
            message: 'Payment processed successfully'
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Payment failed';
          set({ paymentError: errorMessage, paymentLoading: false });
          throw error;
        }
      },
      
      refundPayment: async (jobId, reason) => {
        set({ paymentLoading: true, paymentError: null });
        
        try {
          set(state => ({
            markingJobs: state.markingJobs.map(job =>
              job.id === jobId
                ? { 
                    ...job, 
                    paymentStatus: 'REFUNDED' as const,
                    updatedAt: new Date().toISOString()
                  }
                : job
            ),
            paymentLoading: false
          }));
          
          get().addJobUpdate(jobId, {
            status: 'REFUNDED',
            message: `Payment refunded: ${reason}`
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to refund payment';
          set({ paymentError: errorMessage, paymentLoading: false });
          throw error;
        }
      },
      
      // Queue management
      getQueuePosition: async (jobId) => {
        const job = get().markingJobs.find(j => j.id === jobId);
        return job?.queuePosition || 0;
      },
      
      getEstimatedWaitTime: async (jobId) => {
        const job = get().markingJobs.find(j => j.id === jobId);
        if (!job) return 0;
        
        // Calculate estimated wait time based on queue position and average completion time
        const averageCompletionTime = 180; // 3 hours in minutes
        const queuePosition = job.queuePosition || 0;
        return queuePosition * averageCompletionTime;
      },
      
      // Agent management
      findAvailableAgents: async (location, radius) => {
        // Mock implementation - would call backend API
        return get().availableAgents.filter(agent => 
          agent.isAvailableForMarking && agent.currentActiveJobs < 3
        );
      },
      
      assignJobToAgent: async (jobId, agentId) => {
        set({ isLoading: true, error: null });
        
        try {
          set(state => ({
            markingJobs: state.markingJobs.map(job =>
              job.id === jobId
                ? { 
                    ...job, 
                    assignedAgentId: agentId,
                    status: 'ASSIGNED' as const,
                    assignedAt: new Date().toISOString(),
                    timeSlotExpiry: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
                  }
                : job
            ),
            isLoading: false
          }));
          
          get().addJobUpdate(jobId, {
            status: 'ASSIGNED',
            message: `Job assigned to agent ${agentId}`
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to assign job';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      // Real-time updates
      addJobUpdate: (jobId, update) => {
        set(state => ({
          jobUpdates: {
            ...state.jobUpdates,
            [jobId]: [
              ...(state.jobUpdates[jobId] || []),
              {
                ...update,
                timestamp: new Date().toISOString()
              }
            ]
          }
        }));
      },
      
      subscribeToJobUpdates: (jobId) => {
        // Mock subscription - would implement WebSocket connection
        console.log(`Subscribing to updates for job ${jobId}`);
      },
      
      unsubscribeFromJobUpdates: (jobId) => {
        // Mock unsubscription
        console.log(`Unsubscribing from updates for job ${jobId}`);
      },
      
      // Filtering and search
      filterJobsByStatus: (status) => {
        return get().markingJobs.filter(job => job.status === status);
      },
      
      filterJobsByUrgency: (urgency) => {
        return get().markingJobs.filter(job => job.urgencyLevel === urgency);
      },
      
      getJobsByUser: (userId) => {
        return get().markingJobs.filter(job => job.requestedBy === userId);
      },
      
      getJobsByAgent: (agentId) => {
        return get().markingJobs.filter(job => job.assignedAgentId === agentId);
      },
      
      // Utility actions
      isJobExpired: (job) => {
        if (!job.maxCompletionTime) return false;
        return new Date(job.maxCompletionTime) < new Date();
      },
      
      canCancelJob: (job) => {
        return ['QUEUED', 'ASSIGNED'].includes(job.status);
      },
      
      getJobStatusColor: (status) => {
        const colors = {
          'QUEUED': 'bg-yellow-100 text-yellow-800',
          'ASSIGNED': 'bg-blue-100 text-blue-800',
          'IN_PROGRESS': 'bg-purple-100 text-purple-800',
          'COMPLETED': 'bg-green-100 text-green-800',
          'CANCELLED': 'bg-red-100 text-red-800',
          'EXPIRED': 'bg-gray-100 text-gray-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
      },
      
      formatTimeRemaining: (expiryTime) => {
        const now = new Date();
        const expiry = new Date(expiryTime);
        const diff = expiry.getTime() - now.getTime();
        
        if (diff <= 0) return 'Expired';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          return `${hours}h ${minutes}m remaining`;
        }
        return `${minutes}m remaining`;
      },
      
      // Reset actions
      reset: () => {
        set({
          markingJobs: [],
          availableAgents: [],
          currentJob: null,
          isLoading: false,
          error: null,
          queuePosition: null,
          estimatedWaitTime: null,
          paymentLoading: false,
          paymentError: null,
          paymentSuccess: false,
          jobRequest: null,
          markingFeeCalculation: null,
          jobUpdates: {}
        });
      },
      
      clearError: () => set({ error: null }),
      
      clearPaymentState: () => {
        set({
          paymentLoading: false,
          paymentError: null,
          paymentSuccess: false
        });
      }
    }),
    {
      name: 'marking-job-store'
    }
  )
);

export default useMarkingJobStore;