import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAgentPerformance,
  getAgentById,
  getAgentStats,
  getAgentCommissions,
  getAgentMarkingHistory,
  getAgentRatings,
  getTopPerformingAgents,
  updateAgentReliabilityScore,
  suspendAgent,
  unsuspendAgent,
  exportAgentReport,
} from '@/lib/api/agentPerformance';
import type { AgentFilters, DateRange } from '@/types/agent';
import { toast } from 'sonner';

export function useAgentPerformance(filters?: AgentFilters, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['agents', 'performance', filters, page, pageSize],
    queryFn: () => getAgentPerformance(filters, page, pageSize),
  });
}

export function useAgent(agentId: string) {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => getAgentById(agentId),
    enabled: !!agentId,
  });
}

export function useAgentStats(agentId: string, dateRange?: DateRange) {
  return useQuery({
    queryKey: ['agent', agentId, 'stats', dateRange],
    queryFn: () => getAgentStats(agentId, dateRange),
    enabled: !!agentId,
  });
}

export function useAgentCommissions(agentId: string, dateRange?: DateRange) {
  return useQuery({
    queryKey: ['agent', agentId, 'commissions', dateRange],
    queryFn: () => getAgentCommissions(agentId, dateRange),
    enabled: !!agentId,
  });
}

export function useAgentMarkingHistory(agentId: string, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['agent', agentId, 'marking-history', page, pageSize],
    queryFn: () => getAgentMarkingHistory(agentId, page, pageSize),
    enabled: !!agentId,
  });
}

export function useAgentRatings(agentId: string) {
  return useQuery({
    queryKey: ['agent', agentId, 'ratings'],
    queryFn: () => getAgentRatings(agentId),
    enabled: !!agentId,
  });
}

export function useTopPerformingAgents(dateRange?: DateRange, limit: number = 10) {
  return useQuery({
    queryKey: ['agents', 'top-performers', dateRange, limit],
    queryFn: () => getTopPerformingAgents(dateRange, limit),
  });
}

export function useUpdateAgentReliabilityScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agentId, score, reason }: { agentId: string; score: number; reason: string }) =>
      updateAgentReliabilityScore(agentId, score, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['agent', variables.agentId]);
      queryClient.invalidateQueries(['agents']);
      toast.success('Agent reliability score updated');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update reliability score');
    },
  });
}

export function useSuspendAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agentId, reason }: { agentId: string; reason: string }) =>
      suspendAgent(agentId, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['agent', variables.agentId]);
      queryClient.invalidateQueries(['agents']);
      toast.success('Agent suspended successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to suspend agent');
    },
  });
}

export function useUnsuspendAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string) => unsuspendAgent(agentId),
    onSuccess: (data, agentId) => {
      queryClient.invalidateQueries(['agent', agentId]);
      queryClient.invalidateQueries(['agents']);
      toast.success('Agent unsuspended successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to unsuspend agent');
    },
  });
}

export function useExportAgentReport() {
  return useMutation({
    mutationFn: ({
      agentId,
      dateRange,
      format,
    }: {
      agentId: string;
      dateRange: DateRange;
      format: 'csv' | 'pdf';
    }) => exportAgentReport(agentId, dateRange, format),
    onSuccess: (data, variables) => {
      toast.success(`Agent report exported as ${variables.format.toUpperCase()}`);
      
      const blob = new Blob([data], {
        type: variables.format === 'pdf' ? 'application/pdf' : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-${variables.agentId}-report-${Date.now()}.${variables.format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to export agent report');
    },
  });
}

// Agent performance comparison
export function useAgentComparison(agentIds: string[], dateRange?: DateRange) {
  return useQuery({
    queryKey: ['agents', 'comparison', agentIds, dateRange],
    queryFn: async () => {
      const agentStats = await Promise.all(
        agentIds.map((id) => getAgentStats(id, dateRange))
      );

      return agentStats.map((stats, index) => ({
        agentId: agentIds[index],
        ...stats,
      }));
    },
    enabled: agentIds.length > 0,
  });
}

// Agent activity timeline
export function useAgentActivityTimeline(agentId: string, dateRange?: DateRange) {
  return useQuery({
    queryKey: ['agent', agentId, 'activity-timeline', dateRange],
    queryFn: () => getAgentStats(agentId, dateRange),
    enabled: !!agentId,
    select: (data) => {
      // Transform data into timeline format
      return data.activityHistory?.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        timestamp: activity.timestamp,
        description: activity.description,
        metadata: activity.metadata,
      }));
    },
  });
}