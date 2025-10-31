// apps/admin/src/hooks/useSupport.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/lib/api/support';
import { useSupportStore } from '@/store/supportStore';
import { TicketStatus, TicketPriority, TicketCategory } from '@newcondo/db';

interface SupportFilters {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedTo?: string;
  userId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const useSupport = (filters?: SupportFilters) => {
  const queryClient = useQueryClient();
  const { setSelectedTicket } = useSupportStore();
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch support tickets
   */
  const {
    data: ticketsData,
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['supportTickets', filters],
    queryFn: () => supportApi.getTickets(filters),
    staleTime: 20000,
  });

  /**
   * Fetch single ticket details
   */
  const useTicketDetails = (ticketId: string) => {
    return useQuery({
      queryKey: ['supportTicket', ticketId],
      queryFn: () => supportApi.getTicketById(ticketId),
      enabled: !!ticketId,
    });
  };

  /**
   * Respond to ticket mutation
   */
  const respondToTicketMutation = useMutation({
    mutationFn: ({ 
      ticketId, 
      response,
      internal
    }: { 
      ticketId: string; 
      response: string;
      internal?: boolean;
    }) => supportApi.respondToTicket(ticketId, response, internal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      queryClient.invalidateQueries({ queryKey: ['supportTicket'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to respond to ticket');
    }
  });

  /**
   * Resolve ticket mutation
   */
  const resolveTicketMutation = useMutation({
    mutationFn: ({ 
      ticketId, 
      resolution 
    }: { 
      ticketId: string; 
      resolution: string;
    }) => supportApi.resolveTicket(ticketId, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to resolve ticket');
    }
  });

  /**
   * Update ticket status mutation
   */
  const updateTicketStatusMutation = useMutation({
    mutationFn: ({ 
      ticketId, 
      status 
    }: { 
      ticketId: string; 
      status: TicketStatus;
    }) => supportApi.updateTicketStatus(ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to update ticket status');
    }
  });

  /**
   * Update ticket priority mutation
   */
  const updateTicketPriorityMutation = useMutation({
    mutationFn: ({ 
      ticketId, 
      priority,
      reason
    }: { 
      ticketId: string; 
      priority: TicketPriority;
      reason?: string;
    }) => supportApi.updateTicketPriority(ticketId, priority, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to update ticket priority');
    }
  });

  /**
   * Assign ticket mutation
   */
  const assignTicketMutation = useMutation({
    mutationFn: ({ 
      ticketId, 
      adminId 
    }: { 
      ticketId: string; 
      adminId: string;
    }) => supportApi.assignTicket(ticketId, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to assign ticket');
    }
  });

  /**
   * Escalate ticket mutation
   */
  const escalateTicketMutation = useMutation({
    mutationFn: ({ 
      ticketId, 
      priority,
      reason 
    }: { 
      ticketId: string; 
      priority: TicketPriority;
      reason: string;
    }) => supportApi.escalateTicket(ticketId, priority, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to escalate ticket');
    }
  });

  /**
   * Close ticket mutation
   */
  const closeTicketMutation = useMutation({
    mutationFn: ({ 
      ticketId, 
      reason 
    }: { 
      ticketId: string; 
      reason?: string;
    }) => supportApi.closeTicket(ticketId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to close ticket');
    }
  });

  /**
   * Reopen ticket mutation
   */
  const reopenTicketMutation = useMutation({
    mutationFn: ({ 
      ticketId, 
      reason 
    }: { 
      ticketId: string; 
      reason: string;
    }) => supportApi.reopenTicket(ticketId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to reopen ticket');
    }
  });

  /**
   * Respond to ticket
   */
  const respondToTicket = useCallback(async (
    ticketId: string,
    response: string,
    internal?: boolean
  ) => {
    setError(null);
    return respondToTicketMutation.mutateAsync({ ticketId, response, internal });
  }, [respondToTicketMutation]);

  /**
   * Resolve ticket
   */
  const resolveTicket = useCallback(async (
    ticketId: string,
    resolution: string
  ) => {
    setError(null);
    return resolveTicketMutation.mutateAsync({ ticketId, resolution });
  }, [resolveTicketMutation]);

  /**
   * Update ticket status
   */
  const updateTicketStatus = useCallback(async (
    ticketId: string,
    status: TicketStatus
  ) => {
    setError(null);
    return updateTicketStatusMutation.mutateAsync({ ticketId, status });
  }, [updateTicketStatusMutation]);

  /**
   * Update ticket priority
   */
  const updateTicketPriority = useCallback(async (
    ticketId: string,
    priority: TicketPriority,
    reason?: string
  ) => {
    setError(null);
    return updateTicketPriorityMutation.mutateAsync({ ticketId, priority, reason });
  }, [updateTicketPriorityMutation]);

  /**
   * Assign ticket
   */
  const assignTicket = useCallback(async (
    ticketId: string,
    adminId: string
  ) => {
    setError(null);
    return assignTicketMutation.mutateAsync({ ticketId, adminId });
  }, [assignTicketMutation]);

  /**
   * Escalate ticket
   */
  const escalateTicket = useCallback(async (
    ticketId: string,
    priority: TicketPriority,
    reason: string
  ) => {
    setError(null);
    return escalateTicketMutation.mutateAsync({ ticketId, priority, reason });
  }, [escalateTicketMutation]);

  /**
   * Close ticket
   */
  const closeTicket = useCallback(async (
    ticketId: string,
    reason?: string
  ) => {
    setError(null);
    return closeTicketMutation.mutateAsync({ ticketId, reason });
  }, [closeTicketMutation]);

  /**
   * Reopen ticket
   */
  const reopenTicket = useCallback(async (
    ticketId: string,
    reason: string
  ) => {
    setError(null);
    return reopenTicketMutation.mutateAsync({ ticketId, reason });
  }, [reopenTicketMutation]);

  /**
   * Export tickets
   */
  const exportTickets = useCallback(async (filters?: SupportFilters) => {
    setError(null);
    try {
      const blob = await supportApi.exportTickets(filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `support-tickets-${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to export tickets';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Get support statistics
   */
  const getStatistics = useCallback(() => {
    const stats = ticketsData?.data?.statistics;
    return {
      total: stats?.total || 0,
      open: stats?.open || 0,
      inProgress: stats?.inProgress || 0,
      resolved: stats?.resolved || 0,
      closed: stats?.closed || 0,
      averageResponseTime: stats?.averageResponseTime || 0,
      averageResolutionTime: stats?.averageResolutionTime || 0
    };
  }, [ticketsData]);

  return {
    // Data
    tickets: ticketsData?.data?.tickets || [],
    pagination: ticketsData?.data?.pagination,
    statistics: getStatistics(),
    
    // Loading states
    isLoading,
    isFetching,
    
    // Mutations loading states
    isResponding: respondToTicketMutation.isPending,
    isResolving: resolveTicketMutation.isPending,
    isUpdatingStatus: updateTicketStatusMutation.isPending,
    isUpdatingPriority: updateTicketPriorityMutation.isPending,
    isAssigning: assignTicketMutation.isPending,
    isEscalating: escalateTicketMutation.isPending,
    isClosing: closeTicketMutation.isPending,
    isReopening: reopenTicketMutation.isPending,
    
    // Actions
    respondToTicket,
    resolveTicket,
    updateTicketStatus,
    updateTicketPriority,
    assignTicket,
    escalateTicket,
    closeTicket,
    reopenTicket,
    exportTickets,
    refetch,
    
    // Ticket details hook
    useTicketDetails,
    
    // State
    error,
    clearError: () => setError(null)
  };
};