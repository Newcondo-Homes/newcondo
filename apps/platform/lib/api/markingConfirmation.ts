// apps/platform/lib/api/markingConfirmation.ts
import { client } from './client';
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
  return client.post(`/marking-confirmation/${jobId}/confirm`, data);
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
  return client.post(`/marking-confirmation/${jobId}/reject`, data);
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
  return client.post(`/marking-confirmation/${jobId}/revision`, data);
}

/**
 * Get confirmation status for a marking job
 * @param jobId - The marking job ID
 */
export async function getConfirmationStatus(
  jobId: string
): Promise<ConfirmationStatusResponse> {
  return client.get(`/marking-confirmation/${jobId}/status`);
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
  return client.get('/marking-confirmation/pending');
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
  return client.get(`/marking-confirmation/${jobId}/deadline`);
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
  return client.post(`/marking-confirmation/${jobId}/extend`, { extensionDays });
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

  return client.get(`/marking-confirmation/history?${params.toString()}`);
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
  return client.get(`/marking-confirmation/agent/${agentId}/rating`);
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
  return client.post(`/marking-confirmation/${jobId}/issue`, issue);
}

/**
 * Auto-confirm expired marking jobs (system/cron job use)
 */
export async function autoConfirmExpiredJobs(): Promise<{
  confirmedCount: number;
  jobIds: string[];
}> {
  return client.post('/marking-confirmation/auto-confirm');
}