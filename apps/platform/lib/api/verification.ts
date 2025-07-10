// apps/platform/lib/api/verification.ts
import { apiClient } from './client';
import { VerificationDocument, VerificationProgress, VerificationFormData } from '../../types/verification';
import { DocumentType, DocumentStatus, VerificationStatus } from '@newcondo/db';

export interface UploadResponse {
  success: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  verificationId?: string;
  status: VerificationStatus;
}

export interface DocumentSubmission {
  documentType: DocumentType;
  documentSide?: string;
  pageNumber?: number;
  documentNumber?: string;
  fileUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
}

class VerificationAPI {
  // Get user's verification status and documents
  async getVerificationStatus(): Promise<VerificationProgress> {
    const response = await apiClient.get('/auth/verification/status');
    return response.data;
  }

  // Get user's documents
  async getDocuments(): Promise<VerificationDocument[]> {
    const response = await apiClient.get('/auth/verification/documents');
    return response.data;
  }

  // Upload a single file
  async uploadFile(
    file: File,
    documentType: DocumentType,
    documentSide?: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (documentSide) {
      formData.append('documentSide', documentSide);
    }

    const response = await apiClient.post('/auth/verification/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  // Submit document for verification (ID only)
  async submitDocumentNumber(
    documentType: DocumentType,
    documentNumber: string
  ): Promise<VerificationResponse> {
    const response = await apiClient.post('/auth/verification/submit-number', {
      documentType,
      documentNumber,
    });
    
    return response.data;
  }

  // Submit documents for verification
  async submitDocuments(documents: DocumentSubmission[]): Promise<VerificationResponse> {
    const response = await apiClient.post('/auth/verification/submit', {
      documents,
    });
    
    return response.data;
  }

  // Submit complete verification
  async submitVerification(data: VerificationFormData): Promise<VerificationResponse> {
    const response = await apiClient.post('/auth/verification/complete', data);
    return response.data;
  }

  // Re-submit rejected documents
  async reSubmitDocuments(
    rejectedDocumentIds: string[],
    documents: DocumentSubmission[]
  ): Promise<VerificationResponse> {
    const response = await apiClient.post('/auth/verification/resubmit', {
      rejectedDocumentIds,
      documents,
    });
    
    return response.data;
  }

  // Delete a document
  async deleteDocument(documentId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/auth/verification/documents/${documentId}`);
    return response.data;
  }

  // Get verification requirements
  async getRequirements(): Promise<any> {
    const response = await apiClient.get('/auth/verification/requirements');
    return response.data;
  }

  // Check document verification status
  async checkDocumentStatus(documentId: string): Promise<VerificationDocument> {
    const response = await apiClient.get(`/auth/verification/documents/${documentId}/status`);
    return response.data;
  }

  // Get verification history
  async getVerificationHistory(): Promise<any[]> {
    const response = await apiClient.get('/auth/verification/history');
    return response.data;
  }
}

export const verificationAPI = new VerificationAPI();