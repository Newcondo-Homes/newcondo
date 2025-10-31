// apps/admin/src/hooks/useVerifications.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationApi } from '@/lib/api/verification';
import { useVerificationStore } from '@/store/verificationStore';
import { DocumentStatus, DocumentType } from '@newcondo/db';

interface VerificationFilters {
  page?: number;
  limit?: number;
  status?: DocumentStatus;
  documentType?: DocumentType;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const useVerifications = (filters?: VerificationFilters) => {
  const queryClient = useQueryClient();
  const { setSelectedDocument } = useVerificationStore();
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch pending verifications
   */
  const {
    data: verificationsData,
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['verifications', filters],
    queryFn: () => verificationApi.getVerifications(filters),
    staleTime: 30000,
  });

  /**
   * Fetch single document details
   */
  const useDocumentDetails = (documentId: string) => {
    return useQuery({
      queryKey: ['document', documentId],
      queryFn: () => verificationApi.getDocumentById(documentId),
      enabled: !!documentId,
    });
  };

  /**
   * Approve document mutation
   */
  const approveDocumentMutation = useMutation({
    mutationFn: ({ 
      documentId, 
      notes 
    }: { 
      documentId: string; 
      notes?: string;
    }) => verificationApi.approveDocument(documentId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to approve document');
    }
  });

  /**
   * Reject document mutation
   */
  const rejectDocumentMutation = useMutation({
    mutationFn: ({ 
      documentId, 
      reason 
    }: { 
      documentId: string; 
      reason: string;
    }) => verificationApi.rejectDocument(documentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to reject document');
    }
  });

  /**
   * Bulk approve documents mutation
   */
  const bulkApproveDocumentsMutation = useMutation({
    mutationFn: (documentIds: string[]) => 
      verificationApi.bulkApproveDocuments(documentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to bulk approve documents');
    }
  });

  /**
   * Request additional documents mutation
   */
  const requestAdditionalDocsMutation = useMutation({
    mutationFn: ({ 
      userId, 
      documentTypes, 
      message 
    }: { 
      userId: string; 
      documentTypes: DocumentType[]; 
      message: string;
    }) => verificationApi.requestAdditionalDocuments(userId, documentTypes, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to request additional documents');
    }
  });

  /**
   * Approve document
   */
  const approveDocument = useCallback(async (
    documentId: string,
    notes?: string
  ) => {
    setError(null);
    return approveDocumentMutation.mutateAsync({ documentId, notes });
  }, [approveDocumentMutation]);

  /**
   * Reject document
   */
  const rejectDocument = useCallback(async (
    documentId: string,
    reason: string
  ) => {
    setError(null);
    return rejectDocumentMutation.mutateAsync({ documentId, reason });
  }, [rejectDocumentMutation]);

  /**
   * Bulk approve documents
   */
  const bulkApproveDocuments = useCallback(async (documentIds: string[]) => {
    setError(null);
    return bulkApproveDocumentsMutation.mutateAsync(documentIds);
  }, [bulkApproveDocumentsMutation]);

  /**
   * Request additional documents
   */
  const requestAdditionalDocuments = useCallback(async (
    userId: string,
    documentTypes: DocumentType[],
    message: string
  ) => {
    setError(null);
    return requestAdditionalDocsMutation.mutateAsync({ userId, documentTypes, message });
  }, [requestAdditionalDocsMutation]);

  /**
   * Get verification statistics
   */
  const getStatistics = useCallback(() => {
    const stats = verificationsData?.data?.statistics;
    return {
      total: stats?.total || 0,
      pending: stats?.pending || 0,
      approved: stats?.approved || 0,
      rejected: stats?.rejected || 0,
      approvalRate: stats?.approvalRate || 0
    };
  }, [verificationsData]);

  return {
    // Data
    documents: verificationsData?.data?.documents || [],
    pagination: verificationsData?.data?.pagination,
    statistics: getStatistics(),
    
    // Loading states
    isLoading,
    isFetching,
    
    // Mutations loading states
    isApproving: approveDocumentMutation.isPending,
    isRejecting: rejectDocumentMutation.isPending,
    isBulkApproving: bulkApproveDocumentsMutation.isPending,
    isRequestingDocs: requestAdditionalDocsMutation.isPending,
    
    // Actions
    approveDocument,
    rejectDocument,
    bulkApproveDocuments,
    requestAdditionalDocuments,
    refetch,
    
    // Document details hook
    useDocumentDetails,
    
    // State
    error,
    clearError: () => setError(null)
  };
};