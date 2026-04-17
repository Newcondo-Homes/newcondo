// apps/platform/lib/api/markingConfirmation.ts
import client from './client';
import type {
  ConfirmMarkingRequest,
  MarkingConfirmationResponse,
  RejectMarkingRequest,
  ConfirmationStatusResponse,
  RequestRevisionRequest
} from '@/types/marking';

/**
 * Confirm a completed marking job (property owner)
 * @param jobId - The marking job ID
 * @param data - Confirmation data including rating and feedback
 */
export async function confirmMarking(
  jobId: string,
  data: ConfirmMarkingRequest
): Promise<MarkingConfirmationResponse> {
  const response = await client.post(`/marking-confirmation/${jobId}/confirm`, data);
  return response.data as MarkingConfirmationResponse
}

/**
 * Reject a completed marking job (property owner)
 * @param jobId - The marking job ID
 * @param data - Rejection reason and details
 */
export async function rejectMarking(
  jobId: string,
  data: RejectMarkingRequest
): Promise<MarkingConfirmationResponse> {
  const response = await client.post(`/marking-confirmation/${jobId}/reject`, data);
  return response.data as MarkingConfirmationResponse
}

/**
 * Request revision for a marking job (property owner)
 * @param jobId - The marking job ID
 * @param data - Revision request details
 */
export async function requestRevision(
  jobId: string,
  data: RequestRevisionRequest
): Promise<MarkingConfirmationResponse> {
  const response = await client.post(`/marking-confirmation/${jobId}/revision`, data);
  return response.data as MarkingConfirmationResponse
}

/**
 * Get confirmation status for a marking job
 * @param jobId - The marking job ID
 */
export async function getConfirmationStatus(
  jobId: string
): Promise<ConfirmationStatusResponse> {
  const response = await client.get(`/marking-confirmation/${jobId}/status`);
  return response.data as ConfirmationStatusResponse
}

/**
 * Get pending confirmations for property owner
 */
export async function getPendingConfirmations(): Promise<{
  jobs: Array<{
    id: string;
    propertyId: string;
    propertyTitle: string;
    completedAt: string;
    confirmationDeadline: string;
    agentName: string;
    agentId: string;
    daysRemaining: number;
    images: string[];
  }>;
  total: number;
}> {
  const response = await client.get('/marking-confirmation/pending');
  return response.data as {
    jobs: Array<{
      id: string;
      propertyId: string;
      propertyTitle: string;
      completedAt: string;
      confirmationDeadline: string;
      agentName: string;
      agentId: string;
      daysRemaining: number;
      images: string[];
    }>;
    total: number;
  }
}

/**
 * Get confirmation deadline for a marking job
 * @param jobId - The marking job ID
 */
export async function getConfirmationDeadline(jobId: string): Promise<{
  deadline: string;
  hoursRemaining: number;
  daysRemaining: number;
  isExpired: boolean;
  autoConfirmAt?: string;
}> {
  const response = await client.get(`/marking-confirmation/${jobId}/deadline`);
  return response.data as {
    deadline: string;
    hoursRemaining: number;
    daysRemaining: number;
    isExpired: boolean;
    autoConfirmAt?: string;
  }
}

/**
 * Extend confirmation deadline (property owner, max 1 extension)
 * @param jobId - The marking job ID
 * @param extensionDays - Number of days to extend (default: 2)
 */
export async function extendConfirmationDeadline(
  jobId: string,
  extensionDays: number = 2
): Promise<{
  success: boolean;
  newDeadline: string;
  message: string;
}> {
  const response = await client.post(`/marking-confirmation/${jobId}/extend`, { extensionDays });
  return response.data as {
    success: boolean;
    newDeadline: string;
    message: string;
  }
}

/**
 * Get confirmation history for property owner
 * @param filters - Optional filters
 */
export async function getConfirmationHistory(filters?: {
  status?: 'CONFIRMED' | 'REJECTED' | 'EXPIRED';
  page?: number;
  limit?: number;
}): Promise<{
  confirmations: Array<{
    id: string;
    jobId: string;
    propertyTitle: string;
    agentName: string;
    status: string;
    confirmedAt?: string;
    rejectedAt?: string;
    rating?: number;
    feedback?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await client.get(`/marking-confirmation/history?${params.toString()}`);
  return response.data as {
    confirmations: Array<{
      id: string;
      jobId: string;
      propertyTitle: string;
      agentName: string;
      status: string;
      confirmedAt?: string;
      rejectedAt?: string;
      rating?: number;
      feedback?: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }
}

/**
 * Get agent rating and reviews from confirmations
 * @param agentId - The agent ID
 */
export async function getAgentConfirmationRating(agentId: string): Promise<{
  averageRating: number;
  totalReviews: number;
  confirmedJobs: number;
  rejectedJobs: number;
  reliabilityScore: number;
  recentReviews: Array<{
    rating: number;
    feedback: string;
    confirmedAt: string;
    propertyOwner: string;
  }>;
}> {
  const response = await client.get(`/marking-confirmation/agent/${agentId}/rating`);
  return response.data as {
    averageRating: number;
    totalReviews: number;
    confirmedJobs: number;
    rejectedJobs: number;
    reliabilityScore: number;
    recentReviews: Array<{
      rating: number;
      feedback: string;
      confirmedAt: string;
      propertyOwner: string;
    }>;
  }
}

/**
 * Report an issue with marking confirmation
 * @param jobId - The marking job ID
 * @param issue - Issue details
 */
export async function reportConfirmationIssue(
  jobId: string,
  issue: {
    type: 'PAYMENT_NOT_RELEASED' | 'INCORRECT_BOUNDARY' | 'POOR_IMAGES' | 'OTHER';
    description: string;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  }
): Promise<{
  success: boolean;
  ticketId: string;
  message: string;
}> {
  const response = await client.post(`/marking-confirmation/${jobId}/issue`, issue);
  return response.data as {
    success: boolean;
    ticketId: string;
    message: string;
  }
}

/**
 * Auto-confirm expired marking jobs (system/cron job use)
 */
export async function autoConfirmExpiredJobs(): Promise<{
  confirmedCount: number;
  jobIds: string[];
}> {
  const response = await client.post('/marking-confirmation/auto-confirm');
  return response.data as {
    confirmedCount: number;
    jobIds: string[];
  }
}