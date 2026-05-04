// apps/platform/hooks/useVerification.ts
'use client'

import { useEffect, useState } from "react";
import { useVerificationStore } from "../store/verificationStore";
import { DocumentType, DocumentStatus, VerificationStatus } from "@/types/enums";
import { VerificationDocument } from "../types/verification";

export interface VerificationHookReturn {
  // State
  verificationProgress: any;
  documents: VerificationDocument[];
  isLoading: boolean;
  error: string | null;

  // Computed values
  isVerified: boolean;
  isPending: boolean;
  isRejected: boolean;
  canSubmit: boolean;
  completionPercentage: number;

  // Documents by status
  approvedDocuments: VerificationDocument[];
  pendingDocuments: VerificationDocument[];
  rejectedDocuments: VerificationDocument[];

  // Actions
  refreshStatus: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
  uploadDocument: (
    file: File,
    documentType: DocumentType,
    documentSide?: string
  ) => Promise<string>;
  submitDocumentNumber: (
    documentType: DocumentType,
    documentNumber: string
  ) => Promise<void>;
  submitVerification: (documents: any[]) => Promise<void>;
  reSubmitDocuments: (
    rejectedDocumentIds: string[],
    documents: any[]
  ) => Promise<void>;
  resubmitDocument: (documentId: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  clearError: () => void;

  // Helpers
  getDocumentByType: (
    documentType: DocumentType
  ) => VerificationDocument | undefined;
  hasRequiredDocuments: () => boolean;
  getRequiredDocumentTypes: () => DocumentType[];
}

export const useVerification = (): VerificationHookReturn => {
  const {
    verificationProgress,
    documents,
    isLoading,
    error,
    fetchVerificationStatus,
    fetchDocuments,
    uploadDocument,
    submitDocumentNumber,
    submitVerification,
    reSubmitDocuments,
    deleteDocument,
    clearError,
  } = useVerificationStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    if (!isInitialized) {
      Promise.all([fetchVerificationStatus(), fetchDocuments()]).finally(() => {
        setIsInitialized(true);
      });
    }
  }, [isInitialized, fetchVerificationStatus, fetchDocuments]);

  // Computed values
  const isVerified =
    verificationProgress?.overallStatus === VerificationStatus.VERIFIED;
  const isPending =
    verificationProgress?.overallStatus === VerificationStatus.PENDING;
  const isRejected =
    verificationProgress?.overallStatus === VerificationStatus.REJECTED;
  const canSubmit = verificationProgress?.canSubmit || false;

  const completionPercentage = verificationProgress
    ? (verificationProgress.completedSteps / verificationProgress.totalSteps) *
      100
    : 0;

  // Documents by status
  const approvedDocuments = documents.filter(
    (doc) => doc.status === DocumentStatus.APPROVED
  );
  const pendingDocuments = documents.filter(
    (doc) => doc.status === DocumentStatus.PENDING
  );
  const rejectedDocuments = documents.filter(
    (doc) => doc.status === DocumentStatus.REJECTED
  );

  // Wrapper for single document resubmission
  const resubmitDocument = async (documentId: string) => {
    // You need to decide how resubmitting a single document works.
    // One common pattern is to find the document, then call a backend endpoint
    // to change its status back to PENDING or trigger a re-upload.
    // If your backend handles resubmission by ID, you might call an API.
    // For now, let's assume `reSubmitDocuments` is meant for this.
    // However, `reSubmitDocuments` takes `rejectedDocumentIds` and `documents`.
    // It's more likely you'd have a separate action in your store for this.
    // Let's create a simple one here that refreshes documents after resubmission.

    // OPTION 1: If your `reSubmitDocuments` from the store can handle a single ID
    // and inherently knows which documents to "re-submit" based on their status:
    await reSubmitDocuments([documentId], documents); // Pass the single ID

    // OPTION 2: If `reSubmitDocuments` is specifically for a batch, you might need
    // a new action in your store, e.g., `resubmitSingleDocument(documentId)`
    // For now, we'll assume `reSubmitDocuments` can handle a single ID.

    // After resubmission, refresh the documents to reflect the status change
    await fetchDocuments();
  };
  // Actions
  const refreshStatus = async () => {
    await fetchVerificationStatus();
  };

  const refreshDocuments = async () => {
    await fetchDocuments();
  };

  // Helpers
  const getDocumentByType = (
    documentType: DocumentType
  ): VerificationDocument | undefined => {
    return documents.find((doc) => doc.documentType === documentType);
  };

  const hasRequiredDocuments = (): boolean => {
    const requiredTypes = getRequiredDocumentTypes();
    return requiredTypes.every((type) =>
      documents.some(
        (doc) =>
          doc.documentType === type && doc.status !== DocumentStatus.REJECTED
      )
    );
  };

  const getRequiredDocumentTypes = (): DocumentType[] => {
    // This should ideally come from the API, but for now we'll define basic requirements
    return [
      DocumentType.NIN, // NIN is typically required
      DocumentType.SELFIE, // Selfie is always required
    ];
  };

  return {
    // State
    verificationProgress,
    documents,
    isLoading,
    error,

    // Computed values
    isVerified,
    isPending,
    isRejected,
    canSubmit,
    completionPercentage,

    // Documents by status
    approvedDocuments,
    pendingDocuments,
    rejectedDocuments,

    // Actions
    refreshStatus,
    refreshDocuments,
    uploadDocument,
    submitDocumentNumber,
    submitVerification,
    reSubmitDocuments,
    resubmitDocument,
    deleteDocument,
    clearError,

    // Helpers
    getDocumentByType,
    hasRequiredDocuments,
    getRequiredDocumentTypes,
  };
};
