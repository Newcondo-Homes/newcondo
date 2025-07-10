// apps/platform/types/verification.ts
import { DocumentType, DocumentSide, DocumentStatus, VerificationStatus } from '@newcondo/db';

export interface VerificationDocument {
  id: string;
  documentType: DocumentType;
  documentSide?: DocumentSide;
  pageNumber?: number;
  documentNumber?: string;
  fileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  status: DocumentStatus;
  verificationNotes?: string;
  isRequired: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationStep {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
  isRequired: boolean;
  documentType?: DocumentType;
  allowedFormats?: string[];
  maxFileSize?: number;
  instructions?: string[];
}

export interface VerificationProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  overallStatus: VerificationStatus;
  canSubmit: boolean;
  rejectedDocuments: VerificationDocument[];
  pendingDocuments: VerificationDocument[];
  approvedDocuments: VerificationDocument[];
}

export interface FileUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedUrl: string | null;
}

export interface DocumentRequirement {
  documentType: DocumentType;
  isRequired: boolean;
  allowIdOnly: boolean;
  allowFileUpload: boolean;
  requiresBothSides: boolean;
  description: string;
  instructions: string[];
  examples: string[];
}

export interface VerificationFormData {
  documents: Array<{
    documentType: DocumentType;
    documentSide?: DocumentSide;
    documentNumber?: string;
    file?: File;
  }>;
  selfie?: File;
}