// apps/platform/hooks/useMarkingConfirmation.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  confirmMarking,
  rejectMarking,
  requestRevision,
  getConfirmationStatus,
  getPendingConfirmations,
  getConfirmationDeadline,
  extendConfirmationDeadline,
  getConfirmationHistory,
  getAgentConfirmationRating,
  reportConfirmationIssue
} from '@/lib/api/markingConfirmation';
import type {
  ConfirmMarkingRequest,
  RejectMarkingRequest,
  RequestRevisionRequest
} from '@/types/marking';
import { markingJobKeys } from './useMarkingJobs';

// Query keys
export const confirmationKeys = {
  all: ['marking-confirmation'] as const,
  status: (jobId: string) => [...confirmationKeys.all, 'status', jobId] as const,
  pending: () => [...confirmationKeys.all, 'pending'] as const,
  deadline: (jobId: string) => [...confirmationKeys.all, 'deadline', jobId] as const,
  history: (filters?: any) => [...confirmationKeys.all, 'history', filters] as const,
  agentRating: (agentId: string) => [...confirmationKeys.all, 'agent-rating', agentId] as const,
};

// Get confirmation status
export function useConfirmationStatus(jobId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: confirmationKeys.status(jobId),
    queryFn: () => getConfirmationStatus(jobId),
    enabled: enabled && !!jobId,
    staleTime: 20000, // 20 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

// Get pending confirmations
export function usePendingConfirmations() {
  return useQuery({
    queryKey: confirmationKeys.pending(),
    queryFn: getPendingConfirmations,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

// Get confirmation deadline
export function useConfirmationDeadline(jobId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: confirmationKeys.deadline(jobId),
    queryFn: () => getConfirmationDeadline(jobId),
    enabled: enabled && !!jobId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

// Get confirmation history
export function useConfirmationHistory(filters?: {
  status?: 'CONFIRMED' | 'REJECTED' | 'EXPIRED';
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: confirmationKeys.history(filters),
    queryFn: () => getConfirmationHistory(filters),
    staleTime: 60000, // 1 minute
  });
}

// Get agent confirmation rating
export function useAgentConfirmationRating(agentId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: confirmationKeys.agentRating(agentId),
    queryFn: () => getAgentConfirmationRating(agentId),
    enabled: enabled && !!agentId,
    staleTime: 120000, // 2 minutes
  });
}

// Confirm marking mutation
export function useConfirmMarking(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConfirmMarkingRequest) => confirmMarking(jobId, data),
    onSuccess: (response) => {
      toast.success('Marking confirmed successfully! Payment has been released to the agent.');

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: markingJobKeys.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: confirmationKeys.status(jobId) });
      queryClient.invalidateQueries({ queryKey: confirmationKeys.pending() });
      queryClient.invalidateQueries({ queryKey: confirmationKeys.history() });

      // Invalidate agent rating if agent ID is available
      // if (response.data.agentRating) {
      //   queryClient.invalidateQueries({ queryKey: confirmationKeys.agentRating(response.data.agentId)  });
      // }

      if (response.data.agentRating) {
        queryClient.invalidateQueries({
          queryKey: [...confirmationKeys.all, 'agent-rating']
        });
      }

    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to confirm marking');
    },
  });
}

// Reject marking mutation
export function useRejectMarking(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RejectMarkingRequest) => rejectMarking(jobId, data),
    onSuccess: () => {
      toast.success('Marking rejected. The issue has been escalated to support.');

      queryClient.invalidateQueries({ queryKey: markingJobKeys.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: confirmationKeys.status(jobId) });
      queryClient.invalidateQueries({ queryKey: confirmationKeys.pending() });
      queryClient.invalidateQueries({ queryKey: confirmationKeys.history() });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject marking');
    },
  });
}

// Request revision mutation
export function useRequestRevision(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RequestRevisionRequest) => requestRevision(jobId, data),
    onSuccess: () => {
      toast.success('Revision request sent to the agent');

      queryClient.invalidateQueries({ queryKey: markingJobKeys.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: confirmationKeys.status(jobId) });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to request revision');
    },
  });
}

// Extend confirmation deadline mutation
export function useExtendConfirmationDeadline(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (extensionDays: number) =>
      extendConfirmationDeadline(jobId, extensionDays),
    onSuccess: (response) => {
      toast.success(`Deadline extended to ${new Date(response.newDeadline).toLocaleDateString()}`);

      queryClient.invalidateQueries({ queryKey: confirmationKeys.deadline(jobId) });
      queryClient.invalidateQueries({ queryKey: confirmationKeys.status(jobId) });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to extend deadline');
    },
  });
}

// Report confirmation issue mutation
export function useReportConfirmationIssue(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (issue: {
      type: 'PAYMENT_NOT_RELEASED' | 'INCORRECT_BOUNDARY' | 'POOR_IMAGES' | 'OTHER';
      description: string;
      urgency: 'LOW' | 'MEDIUM' | 'HIGH';
    }) => reportConfirmationIssue(jobId, issue),
    onSuccess: (response) => {
      toast.success(`Issue reported successfully. Ticket ID: ${response.ticketId}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to report issue');
    },
  });
}

// Helper hook to check if deadline is approaching
export function useIsDeadlineApproaching(jobId: string) {
  const { data: deadline, isLoading } = useConfirmationDeadline(jobId);

  if (isLoading || !deadline) {
    return { isApproaching: false, hoursRemaining: 0, isExpired: false };
  }

  const isApproaching = deadline.hoursRemaining <= 24 && deadline.hoursRemaining > 0;
  const isUrgent = deadline.hoursRemaining <= 6 && deadline.hoursRemaining > 0;

  return {
    isApproaching,
    isUrgent,
    hoursRemaining: deadline.hoursRemaining,
    daysRemaining: deadline.daysRemaining,
    isExpired: deadline.isExpired,
  };
}

// Helper hook for confirmation action availability
export function useConfirmationActions(jobId: string) {
  const { data: status, isLoading } = useConfirmationStatus(jobId);

  if (isLoading || !status?.data) {
    return {
      canConfirm: false,
      canReject: false,
      canRevise: false,
      reason: 'Loading...',
    };
  }

  const { canConfirm, canReject, canRequestRevision, isExpired } = status.data;

  let reason = '';
  if (isExpired) {
    reason = 'Confirmation period has expired';
  } else if (!canConfirm && !canReject && !canRequestRevision) {
    reason = 'No actions available';
  }

  return {
    canConfirm,
    canReject,
    canRevise: canRequestRevision,
    reason,
  };
}

// Helper hook for deadline badge color
export function useDeadlineBadgeColor(hoursRemaining: number): string {
  if (hoursRemaining <= 0) return 'bg-red-100 text-red-800';
  if (hoursRemaining <= 6) return 'bg-red-100 text-red-800';
  if (hoursRemaining <= 24) return 'bg-yellow-100 text-yellow-800';
  if (hoursRemaining <= 48) return 'bg-blue-100 text-blue-800';
  return 'bg-green-100 text-green-800';
}

// Helper hook to format deadline message
export function useDeadlineMessage(hoursRemaining: number, daysRemaining: number): string {
  if (hoursRemaining <= 0) return 'Deadline passed - Auto-confirmed';
  if (hoursRemaining <= 6) return `${hoursRemaining}h remaining - Urgent!`;
  if (hoursRemaining <= 24) return `${hoursRemaining}h remaining`;
  return `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining`;
}