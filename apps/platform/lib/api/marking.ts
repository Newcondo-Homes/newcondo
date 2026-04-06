// apps/platform/lib/api/marking.ts
import { PropertyMarkingJob, MarkingJobStatus, UrgencyLevel, PaymentStatus } from '@newcondo/db'
import { apiClient } from './client'

export interface CreateMarkingJobPayload {
    propertyId: string
    contactPersonName: string
    contactPersonPhone: string
    accessInstructions?: string
    preferredTime?: string
    urgencyLevel: UrgencyLevel
    markingType: 'self_assign' | 'newcondo_agent'
    assignToUserId?: string // For self-assign to someone user knows
}

export interface MarkingJobResponse extends PropertyMarkingJob {
    property: {
        id: string
        title: string
        address: string
        city: string
        state: string
        gpsCoordinates: string | null
    }
    requestingUser: {
        id: string
        name: string | null
        email: string
        phone: string | null
    }
    assignedAgent?: {
        id: string
        name: string | null
        email: string
        phone: string | null
        agentReliabilityScore: number | null
        completedMarkingJobs: number
    }
    payment?: {
        id: string
        amount: number
        status: PaymentStatus
        flutterwaveRef: string | null
    }
}

export interface MarkingJobListResponse {
    jobs: MarkingJobResponse[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
}

export interface AvailableAgent {
    id: string
    name: string | null
    email: string
    phone: string | null
    agentReliabilityScore: number | null
    completedMarkingJobs: number
    totalMarkingJobs: number
    serviceAreas: string[]
    distance: number // distance from property in km
    isAvailable: boolean
    estimatedFee: number
}

export interface MarkingJobFilters {
    status?: MarkingJobStatus[]
    urgencyLevel?: UrgencyLevel[]
    requestedBy?: string
    assignedAgentId?: string
    city?: string
    state?: string
    page?: number
    limit?: number
    sortBy?: 'createdAt' | 'preferredTime' | 'markingFee' | 'urgencyLevel'
    sortOrder?: 'asc' | 'desc'
    dateFrom?: string
    dateTo?: string
}

export interface CompleteMarkingJobPayload {
    jobId: string
    completionNotes: string
    completionImages: string[] // URLs from uploaded images
    boundaryData: {
        boundaryCoordinates: {
            type: 'Polygon'
            coordinates: number[][][]
        }
        gpsCoordinates: {
            lat: number
            lng: number
        }
        verificationPhotos: string[]
        buildingFingerprint: string
    }
}

export interface MarkingFeeCalculation {
    baseFee: number
    urgencyMultiplier: number
    distanceMultiplier: number
    totalFee: number
    breakdown: {
        base: number
        urgency: number
        distance: number
        platform: number
        agent: number
    }
    estimatedCompletionTime: string // e.g., "2-4 hours"
}

export interface AgentQueuePosition {
    position: number
    estimatedWaitTime: string // e.g., "2-3 hours"
    totalJobsAhead: number
    agentInfo: {
        id: string
        name: string | null
        currentJobs: number
        completionRate: number
    }
}

// Property Marking Service API
export const markingApi = {
    // Create a new marking job request
    async createJob(data: CreateMarkingJobPayload): Promise<{
        job: MarkingJobResponse
        feeCalculation: MarkingFeeCalculation
        paymentUrl?: string // For Flutterwave payment
    }> {
        const response = await apiClient.post('/marking-jobs', data)
        return response.data
    },

    // Get marking job by ID
    async getJobById(jobId: string): Promise<MarkingJobResponse> {
        const response = await apiClient.get(`/marking-jobs/${jobId}`)
        return response.data
    },

    // Get user's marking jobs (requested or assigned)
    async getUserJobs(
        userId: string,
        type: 'requested' | 'assigned' | 'all' = 'all',
        filters?: Omit<MarkingJobFilters, 'requestedBy' | 'assignedAgentId'>
    ): Promise<MarkingJobListResponse> {
        const params = new URLSearchParams({ type })

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(`${key}[]`, v.toString()))
                    } else {
                        params.append(key, value.toString())
                    }
                }
            })
        }

        const response = await apiClient.get(`/marking-jobs/user/${userId}?${params.toString()}`)
        return response.data
    },

    // Get available marking jobs (for agents)
    async getAvailableJobs(
        agentId: string,
        maxDistance: number = 20, // km
        filters?: Pick<MarkingJobFilters, 'city' | 'state' | 'urgencyLevel' | 'page' | 'limit'>
    ): Promise<MarkingJobListResponse> {
        const params = new URLSearchParams({ maxDistance: maxDistance.toString() })

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(`${key}[]`, v.toString()))
                    } else {
                        params.append(key, value.toString())
                    }
                }
            })
        }

        const response = await apiClient.get(`/marking-jobs/available/${agentId}?${params.toString()}`)
        return response.data
    },

    // Calculate marking fee for a property
    async calculateFee(
        propertyId: string,
        urgencyLevel: UrgencyLevel,
        agentId?: string
    ): Promise<MarkingFeeCalculation> {
        const response = await apiClient.post('/marking-jobs/calculate-fee', {
            propertyId,
            urgencyLevel,
            agentId
        })
        return response.data
    },

    async getAgentAvailability(): Promise<{ data: AgentAvailability }> {
    const response = await apiClient.get('/marking-jobs/agent/availability');
    return response as { data: AgentAvailability };
    },

    async updateAgentAvailability(params: UpdateAvailabilityParams): Promise<{ data: AgentAvailability }> {
    const response = await apiClient.patch('/marking-jobs/agent/availability', params);
    return response as { data: AgentAvailability };
    },

    // Find available agents for a property
    async findAvailableAgents(
        propertyId: string,
        maxDistance: number = 20,
        limit: number = 10
    ): Promise<AvailableAgent[]> {
        const response = await apiClient.get(`/marking-jobs/available-agents/${propertyId}`, {
            params: { maxDistance, limit }
        })
        return response.data
    },

    // Accept marking job (for agents)
    async acceptJob(jobId: string, agentId: string): Promise<{
        job: MarkingJobResponse
        queuePosition: AgentQueuePosition
    }> {
        const response = await apiClient.post(`/marking-jobs/${jobId}/accept`, { agentId })
        return response.data
    },

    // Start working on marking job
    async startJob(jobId: string): Promise<MarkingJobResponse> {
        const response = await apiClient.post(`/marking-jobs/${jobId}/start`)
        return response.data
    },

    // Complete marking job
    async completeJob(data: CompleteMarkingJobPayload): Promise<MarkingJobResponse> {
        const { jobId, ...completionData } = data
        const response = await apiClient.post(`/marking-jobs/${jobId}/complete`, completionData)
        return response.data
    },

    // Cancel marking job
    async cancelJob(jobId: string, reason: string): Promise<MarkingJobResponse> {
        const response = await apiClient.post(`/marking-jobs/${jobId}/cancel`, { reason })
        return response.data
    },

    // Reassign marking job to different agent
    async reassignJob(jobId: string, newAgentId: string, reason: string): Promise<MarkingJobResponse> {
        const response = await apiClient.post(`/marking-jobs/${jobId}/reassign`, {
            newAgentId,
            reason
        })
        return response.data
    },

    // Get job queue position
    async getQueuePosition(jobId: string): Promise<AgentQueuePosition> {
        const response = await apiClient.get(`/marking-jobs/${jobId}/queue-position`)
        return response.data
    },

    // Update job urgency level (with fee recalculation)
    async updateUrgency(
        jobId: string,
        urgencyLevel: UrgencyLevel
    ): Promise<{
        job: MarkingJobResponse
        newFeeCalculation: MarkingFeeCalculation
        requiresAdditionalPayment: boolean
        additionalAmount?: number
    }> {
        const response = await apiClient.patch(`/marking-jobs/${jobId}/urgency`, { urgencyLevel })
        return response.data
    },

    // Extend job deadline
    async extendDeadline(jobId: string, newDeadline: string, reason: string): Promise<MarkingJobResponse> {
        const response = await apiClient.patch(`/marking-jobs/${jobId}/extend-deadline`, {
            newDeadline,
            reason
        })
        return response.data
    },

    // Request job status update
    async requestStatusUpdate(jobId: string): Promise<MarkingJobResponse> {
        const response = await apiClient.post(`/marking-jobs/${jobId}/status-update`)
        return response.data
    },

    // Rate completed marking job
    async rateJob(
        jobId: string,
        rating: number, // 1-5
        review?: string
    ): Promise<{ success: boolean }> {
        const response = await apiClient.post(`/marking-jobs/${jobId}/rate`, {
            rating,
            review
        })
        return response.data
    },

    // Report issue with marking job
    async reportIssue(
        jobId: string,
        issueType: 'no_show' | 'poor_quality' | 'incomplete' | 'other',
        description: string,
        evidence?: string[] // URLs to evidence photos
    ): Promise<{ ticketId: string }> {
        const response = await apiClient.post(`/marking-jobs/${jobId}/report-issue`, {
            issueType,
            description,
            evidence
        })
        return response.data
    },

    // Get marking job statistics
    async getStats(userId?: string): Promise<{
        totalJobs: number
        completedJobs: number
        pendingJobs: number
        cancelledJobs: number
        averageCompletionTime: number // hours
        averageRating: number
        totalEarnings?: number // for agents
        recentJobs: Array<{
            id: string
            status: MarkingJobStatus
            completedAt: string | null
            property: { title: string; address: string }
        }>
    }> {
        const params = userId ? `?userId=${userId}` : ''
        const response = await apiClient.get(`/marking-jobs/stats${params}`)
        return response.data
    },

    // Search marking jobs
    async searchJobs(
        query: string,
        filters?: MarkingJobFilters
    ): Promise<MarkingJobListResponse> {
        const params = new URLSearchParams({ query })


        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(`${key}[]`, v.toString()))
                    } else {
                        params.append(key, value.toString())
                    }
                }
            })
        }


        const response = await apiClient.get(`/marking-jobs/search?${params.toString()}`)
        return response.data
    }
}


// // apps/platform/lib/api/marking.ts
// import { apiClient } from './client';

// export interface MarkingJobRequest {
//   propertyId: string;
//   markingChoice: 'SELF' | 'NEWCONDO_ADMIN' | 'KNOWN_PERSON' | 'ASSIGN_AGENTS';
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: string;
//   urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
//   hasPropertyImages: boolean;
// }

// export interface MarkingJobResponse {
//   id: string;
//   propertyId: string;
//   requestedBy: string;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: string;
//   urgencyLevel: string;
//   markingFee: number;
//   paymentStatus: string;
//   status: string;
//   shareableLink?: string;
//   queuePosition?: number;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface MarkingJobConfirmation {
//   jobId: string;
//   confirmed: boolean;
//   rejectionReason?: string;
// }

// export interface MarkingJobCompletion {
//   jobId: string;
//   boundaryData: {
//     type: 'Polygon';
//     coordinates: number[][][];
//   };
//   completionImages: string[];
//   completionNotes?: string;
// }

// /**
//  * Create a new property marking job
//  */
// export async function createMarkingJob(
//   data: MarkingJobRequest
// ): Promise<MarkingJobResponse> {
//   const response = await apiClient.post('/api/marking-jobs', data);
//   return response.data;
// }

// /**
//  * Get marking job details
//  */
// export async function getMarkingJob(jobId: string): Promise<MarkingJobResponse> {
//   const response = await apiClient.get(`/api/marking-jobs/${jobId}`);
//   return response.data;
// }

// /**
//  * Get user's marking jobs
//  */
// export async function getUserMarkingJobs(params?: {
//   status?: string;
//   page?: number;
//   limit?: number;
// }): Promise<{ jobs: MarkingJobResponse[]; total: number; page: number; totalPages: number }> {
//   const response = await apiClient.get('/api/marking-jobs/my-jobs', { params });
//   return response.data;
// }

// /**
//  * Get marking jobs assigned to agent
//  */
// export async function getAssignedMarkingJobs(params?: {
//   status?: string;
//   page?: number;
//   limit?: number;
// }): Promise<{ jobs: MarkingJobResponse[]; total: number; page: number; totalPages: number }> {
//   const response = await apiClient.get('/api/marking-jobs/assigned', { params });
//   return response.data;
// }

// /**
//  * Confirm marking job completion (by property owner)
//  */
// export async function confirmMarkingJob(
//   data: MarkingJobConfirmation
// ): Promise<{ success: boolean; message: string }> {
//   const response = await apiClient.post('/api/marking-jobs/confirm', data);
//   return response.data;
// }

// /**
//  * Complete marking job (by agent)
//  */
// export async function completeMarkingJob(
//   data: MarkingJobCompletion
// ): Promise<{ success: boolean; message: string; job: MarkingJobResponse }> {
//   const response = await apiClient.post('/api/marking-jobs/complete', data);
//   return response.data;
// }

// /**
//  * Cancel marking job
//  */
// export async function cancelMarkingJob(
//   jobId: string,
//   reason?: string
// ): Promise<{ success: boolean; message: string }> {
//   const response = await apiClient.post(`/api/marking-jobs/${jobId}/cancel`, { reason });
//   return response.data;
// }

// /**
//  * Get marking job pricing
//  */
// export async function getMarkingPricing(params: {
//   markingChoice: string;
//   urgencyLevel?: string;
// }): Promise<{ 
//   baseFee: number; 
//   urgencyFee: number; 
//   totalFee: number;
//   agentCompensation?: number;
//   newcondoShare?: number;
// }> {
//   const response = await apiClient.get('/api/marking-jobs/pricing', { params });
//   return response.data;
// }

// /**
//  * Generate shareable marking link for known person
//  */
// export async function generateShareableLink(
//   jobId: string
// ): Promise<{ shareableLink: string; expiresAt: string }> {
//   const response = await apiClient.post(`/api/marking-jobs/${jobId}/generate-link`);
//   return response.data;
// }

// /**
//  * Access marking job via shareable link
//  */
// export async function accessShareableMarkingJob(
//   token: string
// ): Promise<MarkingJobResponse> {
//   const response = await apiClient.get(`/api/marking-jobs/shared/${token}`);
//   return response.data;
// }

// /**
//  * Get marking job statistics (for agents)
//  */
// export async function getMarkingJobStats(): Promise<{
//   totalJobs: number;
//   completedJobs: number;
//   inProgressJobs: number;
//   totalEarnings: number;
//   averageRating: number;
// }> {
//   const response = await apiClient.get('/api/marking-jobs/stats');
//   return response.data;
// }





// // apps/platform/lib/api/marking.ts
// import { apiClient } from './client';

// export interface CreateMarkingJobDTO {
//   propertyId: string;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: string;
//   urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
//   markingOption: 'SELF' | 'NEWCONDO' | 'SOMEONE_I_KNOW' | 'ASSIGN_TO_AGENTS';
// }

// export interface MarkingJobResponse {
//   id: string;
//   propertyId: string;
//   requestedBy: string;
//   assignedAgentId?: string;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: string;
//   urgencyLevel: string;
//   markingFee: string;
//   paymentStatus: string;
//   status: string;
//   assignedAt?: string;
//   completedAt?: string;
//   timeSlotExpiry?: string;
//   completionNotes?: string;
//   completionImages: string[];
//   boundaryData?: any;
//   queuePosition?: number;
//   maxCompletionTime?: string;
//   createdAt: string;
//   updatedAt: string;
//   property?: any;
//   assignedAgent?: any;
// }

// export interface UpdateMarkingJobDTO {
//   contactPersonName?: string;
//   contactPersonPhone?: string;
//   accessInstructions?: string;
//   preferredTime?: string;
//   urgencyLevel?: string;
// }

// export interface CompleteMarkingJobDTO {
//   completionNotes?: string;
//   completionImages: string[];
//   boundaryData: {
//     coordinates: Array<{ lat: number; lng: number }>;
//     center: { lat: number; lng: number };
//     area?: number;
//   };
// }

// export interface MarkingJobFilters {
//   status?: string;
//   urgencyLevel?: string;
//   paymentStatus?: string;
//   fromDate?: string;
//   toDate?: string;
//   page?: number;
//   limit?: number;
// }

// export interface MarkingJobStats {
//   total: number;
//   queued: number;
//   assigned: number;
//   inProgress: number;
//   completed: number;
//   cancelled: number;
//   expired: number;
//   averageCompletionTime?: number;
//   successRate?: number;
// }

// // Create a new marking job
// export const createMarkingJob = async (data: CreateMarkingJobDTO): Promise<MarkingJobResponse> => {
//   const response = await apiClient.post('/api/marking/jobs', data);
//   return response.data;
// };

// // Get all marking jobs for the current user
// export const getMyMarkingJobs = async (filters?: MarkingJobFilters): Promise<{
//   jobs: MarkingJobResponse[];
//   pagination: {
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   };
// }> => {
//   const params = new URLSearchParams();
  
//   if (filters?.status) params.append('status', filters.status);
//   if (filters?.urgencyLevel) params.append('urgencyLevel', filters.urgencyLevel);
//   if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
//   if (filters?.fromDate) params.append('fromDate', filters.fromDate);
//   if (filters?.toDate) params.append('toDate', filters.toDate);
//   if (filters?.page) params.append('page', filters.page.toString());
//   if (filters?.limit) params.append('limit', filters.limit.toString());

//   const response = await apiClient.get(`/api/marking/jobs/my-jobs?${params.toString()}`);
//   return response.data;
// };

// // Get a specific marking job by ID
// export const getMarkingJobById = async (jobId: string): Promise<MarkingJobResponse> => {
//   const response = await apiClient.get(`/api/marking/jobs/${jobId}`);
//   return response.data;
// };

// // Update marking job details (before assignment)
// export const updateMarkingJob = async (
//   jobId: string,
//   data: UpdateMarkingJobDTO
// ): Promise<MarkingJobResponse> => {
//   const response = await apiClient.patch(`/api/marking/jobs/${jobId}`, data);
//   return response.data;
// };

// // Cancel a marking job
// export const cancelMarkingJob = async (jobId: string, reason?: string): Promise<{
//   success: boolean;
//   message: string;
// }> => {
//   const response = await apiClient.post(`/api/marking/jobs/${jobId}/cancel`, { reason });
//   return response.data;
// };

// // Complete a marking job (agent action)
// export const completeMarkingJob = async (
//   jobId: string,
//   data: CompleteMarkingJobDTO
// ): Promise<MarkingJobResponse> => {
//   const response = await apiClient.post(`/api/marking/jobs/${jobId}/complete`, data);
//   return response.data;
// };

// // Confirm marking job completion (property owner action)
// export const confirmMarkingCompletion = async (
//   jobId: string,
//   approved: boolean,
//   feedback?: string
// ): Promise<{
//   success: boolean;
//   message: string;
//   job: MarkingJobResponse;
// }> => {
//   const response = await apiClient.post(`/api/marking/jobs/${jobId}/confirm`, {
//     approved,
//     feedback,
//   });
//   return response.data;
// };

// // Get marking job statistics
// export const getMarkingJobStats = async (): Promise<MarkingJobStats> => {
//   const response = await apiClient.get('/api/marking/jobs/stats');
//   return response.data;
// };

// // Get marking jobs by property ID
// export const getMarkingJobsByProperty = async (
//   propertyId: string
// ): Promise<MarkingJobResponse[]> => {
//   const response = await apiClient.get(`/api/marking/jobs/property/${propertyId}`);
//   return response.data;
// };

// // Get available marking jobs for agents
// export const getAvailableMarkingJobs = async (filters?: {
//   urgencyLevel?: string;
//   maxDistance?: number;
//   location?: { lat: number; lng: number };
// }): Promise<MarkingJobResponse[]> => {
//   const params = new URLSearchParams();
  
//   if (filters?.urgencyLevel) params.append('urgencyLevel', filters.urgencyLevel);
//   if (filters?.maxDistance) params.append('maxDistance', filters.maxDistance.toString());
//   if (filters?.location) {
//     params.append('lat', filters.location.lat.toString());
//     params.append('lng', filters.location.lng.toString());
//   }

//   const response = await apiClient.get(`/api/marking/jobs/available?${params.toString()}`);
//   return response.data;
// };

// // Generate shareable link for marking (someone I know option)
// export const generateMarkingLink = async (jobId: string): Promise<{
//   shareableLink: string;
//   expiresAt: string;
// }> => {
//   const response = await apiClient.post(`/api/marking/jobs/${jobId}/generate-link`);
//   return response.data;
// };

// // Access marking job via shareable link
// export const accessMarkingJobByLink = async (token: string): Promise<MarkingJobResponse> => {
//   const response = await apiClient.get(`/api/marking/jobs/link/${token}`);
//   return response.data;
// };

// // Upload completion images
// export const uploadCompletionImages = async (
//   jobId: string,
//   images: File[]
// ): Promise<{ urls: string[] }> => {
//   const formData = new FormData();
//   images.forEach((image, index) => {
//     formData.append(`images`, image);
//   });

//   const response = await apiClient.post(
//     `/api/marking/jobs/${jobId}/upload-images`,
//     formData,
//     {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//     }
//   );
//   return response.data;
// };

// // Request marking job extension
// export const requestMarkingExtension = async (
//   jobId: string,
//   reason: string,
//   additionalHours: number
// ): Promise<{
//   success: boolean;
//   newTimeSlotExpiry: string;
// }> => {
//   const response = await apiClient.post(`/api/marking/jobs/${jobId}/request-extension`, {
//     reason,
//     additionalHours,
//   });
//   return response.data;
// };

// // Report marking job issue
// export const reportMarkingIssue = async (
//   jobId: string,
//   issueType: string,
//   description: string
// ): Promise<{
//   success: boolean;
//   ticketId: string;
// }> => {
//   const response = await apiClient.post(`/api/marking/jobs/${jobId}/report-issue`, {
//     issueType,
//     description,
//   });
//   return response.data;
// };













// // apps/platform/lib/api/marking.ts
// import { client } from './client';
// import type {
//   MarkingJob,
//   CreateMarkingJobRequest,
//   UpdateMarkingJobRequest,
//   MarkingJobResponse,
//   MarkingJobListResponse,
//   MarkingJobStatsResponse
// } from '@/types/marking';

// /**
//  * Fetch all marking jobs for the authenticated user
//  * @param filters - Optional filters for marking jobs
//  */
// export async function getMarkingJobs(filters?: {
//   status?: string;
//   propertyId?: string;
//   page?: number;
//   limit?: number;
// }): Promise<MarkingJobListResponse> {
//   const params = new URLSearchParams();
  
//   if (filters?.status) params.append('status', filters.status);
//   if (filters?.propertyId) params.append('propertyId', filters.propertyId);
//   if (filters?.page) params.append('page', filters.page.toString());
//   if (filters?.limit) params.append('limit', filters.limit.toString());

//   return client.get(`/marking-jobs?${params.toString()}`);
// }

// /**
//  * Fetch a specific marking job by ID
//  * @param jobId - The marking job ID
//  */
// export async function getMarkingJobById(jobId: string): Promise<MarkingJobResponse> {
//   return client.get(`/marking-jobs/${jobId}`);
// }

// /**
//  * Create a new marking job
//  * @param data - Marking job creation data
//  */
// export async function createMarkingJob(
//   data: CreateMarkingJobRequest
// ): Promise<MarkingJobResponse> {
//   return client.post('/marking-jobs', data);
// }

// /**
//  * Update an existing marking job
//  * @param jobId - The marking job ID
//  * @param data - Updated marking job data
//  */
// export async function updateMarkingJob(
//   jobId: string,
//   data: UpdateMarkingJobRequest
// ): Promise<MarkingJobResponse> {
//   return client.put(`/marking-jobs/${jobId}`, data);
// }

// /**
//  * Cancel a marking job
//  * @param jobId - The marking job ID
//  */
// export async function cancelMarkingJob(jobId: string): Promise<MarkingJobResponse> {
//   return client.post(`/marking-jobs/${jobId}/cancel`);
// }

// /**
//  * Get marking job statistics for the user
//  */
// export async function getMarkingJobStats(): Promise<MarkingJobStatsResponse> {
//   return client.get('/marking-jobs/stats');
// }

// /**
//  * Get available marking jobs for agents (within proximity)
//  * @param latitude - Agent's current latitude
//  * @param longitude - Agent's current longitude
//  * @param radius - Search radius in kilometers
//  */
// export async function getAvailableMarkingJobs(
//   latitude: number,
//   longitude: number,
//   radius: number = 10
// ): Promise<MarkingJobListResponse> {
//   return client.get(
//     `/marking-jobs/available?lat=${latitude}&lng=${longitude}&radius=${radius}`
//   );
// }

// /**
//  * Accept a marking job (for agents)
//  * @param jobId - The marking job ID
//  */
// export async function acceptMarkingJob(jobId: string): Promise<MarkingJobResponse> {
//   return client.post(`/marking-jobs/${jobId}/accept`);
// }

// /**
//  * Reject a marking job assignment (for agents)
//  * @param jobId - The marking job ID
//  * @param reason - Reason for rejection
//  */
// export async function rejectMarkingJob(
//   jobId: string,
//   reason?: string
// ): Promise<MarkingJobResponse> {
//   return client.post(`/marking-jobs/${jobId}/reject`, { reason });
// }

// /**
//  * Get marking jobs assigned to the current agent
//  */
// export async function getMyAssignedJobs(): Promise<MarkingJobListResponse> {
//   return client.get('/marking-jobs/my-assignments');
// }

// /**
//  * Get marking jobs requested by the current user
//  */
// export async function getMyRequestedJobs(): Promise<MarkingJobListResponse> {
//   return client.get('/marking-jobs/my-requests');
// }

// /**
//  * Get marking job time slot expiry
//  * @param jobId - The marking job ID
//  */
// export async function getJobTimeSlot(jobId: string): Promise<{
//   timeSlotExpiry: string;
//   remainingTime: number; // in seconds
//   isExpired: boolean;
// }> {
//   return client.get(`/marking-jobs/${jobId}/time-slot`);
// }