'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLegalStore } from '@/store/legalStore';
import { legalApi } from '@/lib/api/legal';
import {
  LegalDocument,
  DocumentType,
  DocumentStatus,
  CreateLegalDocumentPayload,
  UpdateLegalDocumentPayload
} from '@/types/legal';
import { toast } from 'sonner';

export const useLegalDocuments = (propertyId?: string) => {
  const queryClient = useQueryClient();
  const { setDocuments, setLoading, setError } = useLegalStore();

  // Fetch legal documents for a property or user
  const {
    data: documents,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['legal-documents', propertyId],
    queryFn: async () => {
      setLoading(true);
      try {
        const data = propertyId
          ? await legalApi.getPropertyDocuments(propertyId)
          : await legalApi.getUserDocuments();
        setDocuments(data);
        setError(null);
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch documents';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create new legal document
  const createDocumentMutation = useMutation({
    mutationFn: (payload: CreateLegalDocumentPayload) =>
      legalApi.createDocument(payload),
    onSuccess: (newDocument) => {
      queryClient.setQueryData(
        ['legal-documents', propertyId],
        (old: LegalDocument[] = []) => [...old, newDocument]
      );
      toast.success('Legal document uploaded successfully');
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload document';
      toast.error(errorMsg);
      setError(errorMsg);
    }
  });

  // Update legal document
  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, ...payload }: UpdateLegalDocumentPayload & { id: string }) =>
      legalApi.updateDocument(id, payload),
    onSuccess: (updatedDocument) => {
      queryClient.setQueryData(
        ['legal-documents', propertyId],
        (old: LegalDocument[] = []) =>
          old.map(doc => doc.id === updatedDocument.id ? updatedDocument : doc)
      );
      toast.success('Document updated successfully');
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update document';
      toast.error(errorMsg);
    }
  });

  // Delete legal document
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => legalApi.deleteDocument(documentId),
    onSuccess: (_, documentId) => {
      queryClient.setQueryData(
        ['legal-documents', propertyId],
        (old: LegalDocument[] = []) => old.filter(doc => doc.id !== documentId)
      );
      toast.success('Document deleted successfully');
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete document';
      toast.error(errorMsg);
    }
  });

  // Get required documents for a property type
  const getRequiredDocuments = (propertyType: string, userRole: string) => {
    return legalApi.getRequiredDocuments(propertyType, userRole);
  };

  // Check if all required documents are uploaded and verified
  const checkComplianceStatus = () => {
    if (!documents) return { isCompliant: false, missingDocuments: [] };

    const requiredDocs = documents.filter(doc => doc.isRequired);
    const missingDocuments = requiredDocs.filter(
      doc => doc.status !== DocumentStatus.APPROVED
    );

    return {
      isCompliant: missingDocuments.length === 0,
      missingDocuments: missingDocuments.map(doc => doc.documentType),
      totalRequired: requiredDocs.length,
      completedRequired: requiredDocs.length - missingDocuments.length
    };
  };

  // Get documents by type
  const getDocumentsByType = (documentType: DocumentType) => {
    return documents?.filter(doc => doc.documentType === documentType) || [];
  };

  // Get documents by status
  const getDocumentsByStatus = (status: DocumentStatus) => {
    return documents?.filter(doc => doc.status === status) || [];
  };

  return {
    // Data
    documents,
    isLoading,
    error,

    // Mutations
    createDocument: createDocumentMutation.mutate,
    updateDocument: updateDocumentMutation.mutate,
    deleteDocument: deleteDocumentMutation.mutate,

    // Mutation states
    isCreating: createDocumentMutation.isPending,
    isUpdating: updateDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,

    // Utilities
    refetch,
    getRequiredDocuments,
    checkComplianceStatus,
    getDocumentsByType,
    getDocumentsByStatus,
  };
};

// Hook for managing document templates
export const useDocumentTemplates = () => {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['document-templates'],
    queryFn: () => legalApi.getDocumentTemplates(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const downloadTemplate = async (templateType: DocumentType) => {
    try {
      const blob = await legalApi.downloadTemplate(templateType);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateType}_template.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  return {
    templates,
    isLoading,
    downloadTemplate,
  };
};

// Hook for document verification status
export const useDocumentVerification = (documentId?: string) => {
  return useQuery({
    queryKey: ['document-verification', documentId],
    queryFn: () => legalApi.getVerificationStatus(documentId!),
    enabled: !!documentId,
    refetchInterval: 30000, // Poll every 30 seconds for status updates
  });
};