// apps/admin/src/hooks/useDocumentVerification.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import * as api from '@/lib/api/documentVerification';
import type { 
  DocumentVerification, 
  DocumentVerificationFilter, 
  VerificationAction,
  VerificationStats,
  VerificationHistory
} from '@/types/documentVerification';

export const useDocumentVerification = (initialFilters?: DocumentVerificationFilter) => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DocumentVerificationFilter>(
    initialFilters || {
      status: undefined,
      documentType: undefined,
      userId: undefined,
      priority: undefined,
      assignedToMe: false,
      dateRange: undefined,
      page: 1,
      limit: 20,
    }
  );

  // Fetch pending verifications
  const {
    data: verificationData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['document-verifications', filters],
    queryFn: () => api.getDocumentVerifications(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes for real-time data
  });

  // Get verification stats
  const { data: stats } = useQuery({
    queryKey: ['verification-stats'],
    queryFn: () => api.getVerificationStats(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Get single verification
  const useDocumentVerificationDetail = (verificationId: string) => {
    return useQuery({
      queryKey: ['document-verification', verificationId],
      queryFn: () => api.getDocumentVerification(verificationId),
      enabled: !!verificationId,
    });
  };

  // Get verification history
  const useVerificationHistory = (documentId: string) => {
    return useQuery({
      queryKey: ['verification-history', documentId],
      queryFn: () => api.getVerificationHistory(documentId),
      enabled: !!documentId,
    });
  };

  // Verify document
  const verifyDocumentMutation = useMutation({
    mutationFn: ({ verificationId, action }: { verificationId: string; action: VerificationAction }) =>
      api.verifyDocument(verificationId, action),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['document-verification', variables.verificationId] });
      queryClient.invalidateQueries({ queryKey: ['verification-stats'] });
      
      const actionText = variables.action.decision === 'approve' ? 'approved' : 'rejected';
      toast.success(`Document ${actionText} successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process verification');
    },
  });

  // Assign verification to admin
  const assignVerificationMutation = useMutation({
    mutationFn: ({ verificationId, adminId }: { verificationId: string; adminId: string }) =>
      api.assignVerification(verificationId, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-verifications'] });
      toast.success('Verification assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign verification');
    },
  });

  // Request additional documents
  const requestAdditionalDocsMutation = useMutation({
    mutationFn: ({ verificationId, requiredDocs, message }: { 
      verificationId: string; 
      requiredDocs: string[]; 
      message: string;
    }) => api.requestAdditionalDocuments(verificationId, requiredDocs, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-verifications'] });
      toast.success('Additional documents requested');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to request additional documents');
    },
  });

  // Bulk verification actions
  const bulkVerificationMutation = useMutation({
    mutationFn: ({ verificationIds, action }: { verificationIds: string[]; action: VerificationAction }) =>
      api.bulkVerification(verificationIds, action),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['verification-stats'] });
      
      const actionText = variables.action.decision === 'approve' ? 'approved' : 'rejected';
      toast.success(`${data.processedCount} documents ${actionText}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Bulk action failed');
    },
  });

  // Flag for manual review
  const flagForReviewMutation = useMutation({
    mutationFn: ({ verificationId, reason, priority }: { 
      verificationId: string; 
      reason: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
    }) => api.flagForManualReview(verificationId, reason, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-verifications'] });
      toast.success('Document flagged for manual review');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to flag document');
    },
  });

  // Utility functions
  const updateFilters = (newFilters: Partial<DocumentVerificationFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      status: undefined,
      documentType: undefined,
      userId: undefined,
      priority: undefined,
      assignedToMe: false,
      dateRange: undefined,
      page: 1,
      limit: 20,
    });
  };

  const handleApproval = async (verificationId: string, notes?: string) => {
    try {
      await verifyDocumentMutation.mutateAsync({
        verificationId,
        action: {
          decision: 'approve',
          notes,
          processedAt: new Date().toISOString(),
        }
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleRejection = async (verificationId: string, reason: string, notes?: string) => {
    if (!reason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await verifyDocumentMutation.mutateAsync({
        verificationId,
        action: {
          decision: 'reject',
          reason,
          notes,
          processedAt: new Date().toISOString(),
        }
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleRequestMoreInfo = async (verificationId: string, requiredDocs: string[], message: string) => {
    if (!message.trim()) {
      toast.error('Message is required when requesting additional information');
      return;
    }

    try {
      await requestAdditionalDocsMutation.mutateAsync({
        verificationId,
        requiredDocs,
        message,
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  const assignToMe = async (verificationId: string, adminId: string) => {
    try {
      await assignVerificationMutation.mutateAsync({ verificationId, adminId });
    } catch (error) {
      // Error handled in mutation
    }
  };

  const flagDocument = async (verificationId: string, reason: string, priority: 'low' | 'medium' | 'high' | 'urgent') => {
    if (!reason.trim()) {
      toast.error('Reason is required when flagging documents');
      return;
    }

    try {
      await flagForReviewMutation.mutateAsync({ verificationId, reason, priority });
    } catch (error) {
      // Error handled in mutation
    }
  };

  return {
    // Data
    verifications: verificationData?.verifications || [],
    totalCount: verificationData?.totalCount || 0,
    totalPages: verificationData?.totalPages || 0,
    currentPage: verificationData?.currentPage || 1,
    stats: stats || {
      pending: 0,
      approved: 0,
      rejected: 0,
      flagged: 0,
      avgProcessingTime: 0,
      todayProcessed: 0,
    },
    
    // Loading states
    isLoading,
    isVerifying: verifyDocumentMutation.isPending,
    isAssigning: assignVerificationMutation.isPending,
    isRequestingDocs: requestAdditionalDocsMutation.isPending,
    isBulkProcessing: bulkVerificationMutation.isPending,
    isFlagging: flagForReviewMutation.isPending,
    
    // Error states
    error,
    
    // Filters
    filters,
    updateFilters,
    clearFilters,
    
    // Actions
    handleApproval,
    handleRejection,
    handleRequestMoreInfo,
    assignToMe,
    flagDocument,
    
    // Mutations for direct access
    verifyDocument: verifyDocumentMutation.mutate,
    assignVerification: assignVerificationMutation.mutate,
    bulkVerification: bulkVerificationMutation.mutate,
    
    // Utils
    refetch,
    useDocumentVerificationDetail,
    useVerificationHistory,
  };
};