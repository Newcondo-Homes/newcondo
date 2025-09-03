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