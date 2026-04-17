// apps/platform/lib/api/verification.ts
import { apiClient } from "./client";
import {
  VerificationDocument,
  VerificationProgress,
  VerificationFormData,
} from "../../types/verification";
import { DocumentType, VerificationStatus } from "@newcondo/db";

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
    const response = await apiClient.get<VerificationProgress>(
      "/auth/verification/status"
    );

    if (!response.data) {
      throw new Error("Verification status data not found");
    }
    return response.data;
  }

  // Get user's documents
  async getDocuments(): Promise<VerificationDocument[]> {
    const response = await apiClient.get<VerificationDocument[]>(
      "/auth/verification/documents"
    );

    if (!response.data) {
      throw new Error("Documents data not found");
    }
    return response.data;
  }

  // Upload a single file
  async uploadFile(
    file: File,
    documentType: DocumentType,
    documentSide?: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    // formData.append('file', file);
    const additionalData: Record<string, unknown> = {
      documentType: documentType,
    };

    if (documentSide) {
      additionalData.documentSide = documentSide;
    }

    const response = await apiClient.uploadFile<UploadResponse>(
      "/auth/verification/upload",
      file,
      additionalData
    );

    if (!response.data) {
      throw new Error("Upload response data not found.");
    }
    return response.data;
  }

  // Submit document for verification (ID only)
  async submitDocumentNumber(
    documentType: DocumentType,
    documentNumber: string
  ): Promise<VerificationResponse> {
    const response = await apiClient.post<VerificationResponse>(
      "/auth/verification/submit-number",
      {
        documentType,
        documentNumber,
      }
    );

    if (!response.data) {
      throw new Error("Document number submission response data not found.");
    }
    return response.data;
  }

  // Submit documents for verification
  async submitDocuments(
    documents: DocumentSubmission[]
  ): Promise<VerificationResponse> {
    const response = await apiClient.post<VerificationResponse>(
      "/auth/verification/submit",
      {
        documents,
      }
    );
    if (!response.data) {
      throw new Error("Document submission response data not found.");
    }

    return response.data;
  }

  // Submit complete verification
  async submitVerification(
    data: VerificationFormData
  ): Promise<VerificationResponse> {
    const response = await apiClient.post<VerificationResponse>(
      "/auth/verification/complete",
      data
    );
    if (!response.data) {
      throw new Error("Verification completion response data not found.");
    }
    return response.data;
  }

  // Re-submit rejected documents
  async reSubmitDocuments(
    rejectedDocumentIds: string[],
    documents: DocumentSubmission[]
  ): Promise<VerificationResponse> {
    const response = await apiClient.post<VerificationResponse>(
      "/auth/verification/resubmit",
      {
        rejectedDocumentIds,
        documents,
      }
    );
    if (!response.data) {
      throw new Error("Re-submission response data not found.");
    }
    return response.data;
  }

  // Delete a document
  async deleteDocument(documentId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(
      `/auth/verification/documents/${documentId}`
    );
    if (!response.data) {
      // Depending on API, delete might return success: true directly or in data.
      // If it directly returns { success: boolean }, adjust handleResponse in client.ts
      // For now, assuming it's within .data or direct
      return { success: response.success }; // Use response.success if data is empty for deletes
    }
    return response.data;
  }

  // Get verification requirements
  async getRequirements(): Promise<any> {
    const response = await apiClient.get("/auth/verification/requirements");
    return response.data;
  }

  // Check document verification status
  async checkDocumentStatus(documentId: string): Promise<VerificationDocument> {
    const response = await apiClient.get<VerificationDocument>(
      `/auth/verification/documents/${documentId}/status`
    );
    if (!response.data) {
      throw new Error("Document status data not found.");
    }
    return response.data;
  }

  // Get verification history
  async getVerificationHistory(): Promise<any[]> {
    const response = await apiClient.get<any[]>("/auth/verification/history");
    if (!response.data) {
      throw new Error("Verification history data not found.");
    }
    return response.data;
  }
}

export const verificationAPI = new VerificationAPI();
