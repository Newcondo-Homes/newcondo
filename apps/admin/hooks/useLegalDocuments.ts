// apps/admin/src/hooks/useLegalDocuments.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import * as api from '@/lib/api/legalDocuments';
import type { 
  LegalDocument, 
  LegalDocumentFilter, 
  LegalDocumentSearchParams,
  BulkActionData,
  DocumentStatusUpdate
} from '@/types/legalDocument';

export const useLegalDocuments = (initialFilters?: LegalDocumentFilter) => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LegalDocumentFilter>(
    initialFilters || {
      status: undefined,
      documentType: undefined,
      userId: undefined,
      propertyId: undefined,
      dateRange: undefined,
      page: 1,
      limit: 20,
    }
  );
  
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // Fetch legal documents with filters
  const {
    data: documentsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['legal-documents', filters],
    queryFn: () => api.getLegalDocuments(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get single document
  const useLegalDocument = (documentId: string) => {
    return useQuery({
      queryKey: ['legal-document', documentId],
      queryFn: () => api.getLegalDocument(documentId),
      enabled: !!documentId,
    });
  };

  // Update document status
  const updateDocumentStatusMutation = useMutation({
    mutationFn: ({ documentId, data }: { documentId: string; data: DocumentStatusUpdate }) =>
      api.updateDocumentStatus(documentId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['legal-document', data.id] });
      toast.success('Document status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update document status');
    },
  });

  // Bulk actions
  const bulkActionMutation = useMutation({
    mutationFn: (data: BulkActionData) => api.bulkAction(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      setSelectedDocuments([]);
      toast.success(`Bulk action completed: ${data.processedCount} documents affected`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Bulk action failed');
    },
  });

  // Delete document
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => api.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      toast.success('Document deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete document');
    },
  });

  // Search documents
  const searchDocumentsMutation = useMutation({
    mutationFn: (searchParams: LegalDocumentSearchParams) => api.searchDocuments(searchParams),
    onError: (error: any) => {
      toast.error(error.message || 'Search failed');
    },
  });

  // Utility functions
  const updateFilters = (newFilters: Partial<LegalDocumentFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      status: undefined,
      documentType: undefined,
      userId: undefined,
      propertyId: undefined,
      dateRange: undefined,
      page: 1,
      limit: 20,
    });
  };

  const selectDocument = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const selectAllDocuments = () => {
    const allIds = documentsData?.documents.map(doc => doc.id) || [];
    setSelectedDocuments(allIds);
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
  };

  const isDocumentSelected = (documentId: string) => {
    return selectedDocuments.includes(documentId);
  };

  const handleBulkApproval = async (notes?: string) => {
    if (selectedDocuments.length === 0) {
      toast.error('No documents selected');
      return;
    }

    try {
      await bulkActionMutation.mutateAsync({
        action: 'approve',
        documentIds: selectedDocuments,
        notes,
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleBulkRejection = async (notes: string) => {
    if (selectedDocuments.length === 0) {
      toast.error('No documents selected');
      return;
    }

    if (!notes.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await bulkActionMutation.mutateAsync({
        action: 'reject',
        documentIds: selectedDocuments,
        notes,
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('No documents selected');
      return;
    }

    try {
      await bulkActionMutation.mutateAsync({
        action: 'delete',
        documentIds: selectedDocuments,
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  return {
    // Data
    documents: documentsData?.documents || [],
    totalCount: documentsData?.totalCount || 0,
    totalPages: documentsData?.totalPages || 0,
    currentPage: documentsData?.currentPage || 1,
    
    // Loading states
    isLoading,
    isUpdating: updateDocumentStatusMutation.isPending,
    isBulkProcessing: bulkActionMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
    isSearching: searchDocumentsMutation.isPending,
    
    // Error states
    error,
    
    // Filters
    filters,
    updateFilters,
    clearFilters,
    
    // Selection
    selectedDocuments,
    selectDocument,
    selectAllDocuments,
    clearSelection,
    isDocumentSelected,
    
    // Actions
    updateDocumentStatus: updateDocumentStatusMutation.mutate,
    deleteDocument: deleteDocumentMutation.mutate,
    searchDocuments: searchDocumentsMutation.mutate,
    handleBulkApproval,
    handleBulkRejection,
    handleBulkDelete,
    
    // Utils
    refetch,
    useLegalDocument,
  };
};