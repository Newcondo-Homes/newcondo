// apps/platform/lib/api/documents.ts

import { apiClient } from './client';
import type {
  BaseDocument,
  DocumentUpload,
  DocumentVerification,
  DocumentVersion,
  DocumentShare,
  DocumentTemplate,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentResponse,
  BulkDocumentResponse,
  DocumentUploadResponse,
  DocumentVerificationRequest,
  DocumentShareRequest,
  DocumentFilter,
  DocumentMetadata,
  DocumentSignature,
  DocumentDownload,
  DocumentPreview,
} from '@/types/documents';


export const documentsApi = {
  // Document Management
  async getDocuments(filter?: DocumentFilter): Promise<BulkDocumentResponse> {
    const response = await apiClient.get<BulkDocumentResponse>(
      '/api/documents',
      filter as Record<string, unknown>  // ← apiClient.get takes params directly, not { params }
    );
    return response.data!;
  },

  async getDocument(id: string): Promise<DocumentResponse> {
    const response = await apiClient.get<DocumentResponse>(`/api/documents/${id}`);
    return response.data!;
  },

  async createDocument(data: CreateDocumentRequest): Promise<DocumentResponse> {
    const response = await apiClient.post<DocumentResponse>('/api/documents', data);
    return response.data!;
  },

  async updateDocument(id: string, data: UpdateDocumentRequest): Promise<DocumentResponse> {
    const response = await apiClient.put<DocumentResponse>(`/api/documents/${id}`, data);
    return response.data!;
  },

  async deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/documents/${id}`);
    return response.data!;
  },

  async restoreDocument(id: string): Promise<DocumentResponse> {
    const response = await apiClient.post<DocumentResponse>(`/api/documents/${id}/restore`);
    return response.data!;
  },

  // Document Upload
  async uploadDocument(data: DocumentUpload): Promise<DocumentUploadResponse> {
    const additionalData: Record<string, unknown> = {
      documentType: data.documentType,
      userId: data.userId,
      ...(data.propertyId && { propertyId: data.propertyId }),
      ...(data.documentSide && { documentSide: data.documentSide }),
      ...(data.pageNumber !== undefined && { pageNumber: data.pageNumber }),
      ...(data.documentNumber && { documentNumber: data.documentNumber }),
      ...(data.expiresAt && { expiresAt: data.expiresAt.toISOString() }),
      ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
      ...(data.metadata && { metadata: JSON.stringify(data.metadata) }),
      ...(data.tags?.length && { tags: JSON.stringify(data.tags) }),
    };

    const response = await apiClient.uploadFile<DocumentUploadResponse>(
      '/api/documents/upload',
      data.file,
      additionalData
      // onProgress function not supported by apiClient — handle at component level via state
    );

    return response.data!;
  },

  async uploadMultipleDocuments(
    uploads: DocumentUpload[]
  ): Promise<{
    successful: DocumentUploadResponse[];
    failed: Array<{ file: File; error: string }>;
  }> {
    const files = uploads.map((u) => u.file);

   // Serialize per-file metadata as a JSON string keyed by index
    const additionalData: Record<string, unknown> = {};
    uploads.forEach((upload, index) => {
      additionalData[`data[${index}]`] = JSON.stringify({
        documentType: upload.documentType,
        userId: upload.userId,
        propertyId: upload.propertyId,
        documentSide: upload.documentSide,
        pageNumber: upload.pageNumber,
        documentNumber: upload.documentNumber,
        expiresAt: upload.expiresAt?.toISOString(),
        isRequired: upload.isRequired,
        metadata: upload.metadata,
        tags: upload.tags,
      });
    });

    const response = await apiClient.uploadFiles<{
      successful: DocumentUploadResponse[];
      failed: Array<{ file: File; error: string }>;
    }>('/api/documents/upload/bulk', files, additionalData);

    return response.data!;
  },

  async replaceDocument(
    documentId: string,
    file: File,
    reason?: string
  ): Promise<DocumentResponse> {
    const response = await apiClient.uploadFile<DocumentResponse>(
      `/api/documents/${documentId}/replace`,
      file,
      reason ? { reason } : undefined
    );
    return response.data!;
  },

  // Document Download & Preview
  async downloadDocument(
    id: string,
    options?: {
      version?: string;
      watermark?: boolean;
      format?: 'original' | 'pdf' | 'image';
    }
  ): Promise<DocumentDownload> {
    const response = await apiClient.get<DocumentDownload>(
      `/api/documents/${id}/download`,
      options as Record<string, unknown>
    );
    return response.data!;
  },

  async previewDocument(
    id: string,
    options?: {
      page?: number;
      format?: 'pdf' | 'image';
    }
  ): Promise<DocumentPreview> {
    const response = await apiClient.get<DocumentPreview>(
      `/api/documents/${id}/preview`,
      options as Record<string, unknown>
    );
    return response.data!;
  },

  // Document Verification
  async requestVerification(
    id: string,
    data: DocumentVerificationRequest
  ): Promise<DocumentVerification> {
    const response = await apiClient.post<DocumentVerification>(
      `/api/documents/${id}/verify`,
      data
    );
    return response.data!;
  },

  // Document Sharing
  async shareDocument(id: string, data: DocumentShareRequest): Promise<DocumentShare> {
    const response = await apiClient.post<DocumentShare>(
      `/api/documents/${id}/share`,
      data
    );
    return response.data!;
  },

  // Document Templates
  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
    const response = await apiClient.get<DocumentTemplate[]>('/api/documents/templates');
    return response.data!;
  },

  async getDocumentTemplate(templateId: string): Promise<DocumentTemplate> {
    const response = await apiClient.get<DocumentTemplate>(
      `/api/documents/templates/${templateId}`
    );
    return response.data!;
  },

  // Document Versioning
  async getDocumentVersions(id: string): Promise<DocumentVersion[]> {
    const response = await apiClient.get<DocumentVersion[]>(`/api/documents/${id}/versions`);
    return response.data!;
  },

  async getDocumentVersion(id: string, versionId: string): Promise<DocumentVersion> {
    const response = await apiClient.get<DocumentVersion>(
      `/api/documents/${id}/versions/${versionId}`
    );
    return response.data!;
  },

  // Document Signing
  async signDocument(id: string, signatureData: DocumentSignature): Promise<DocumentSignature> {
    const response = await apiClient.post<DocumentSignature>(
      `/api/documents/${id}/sign`,
      signatureData
    );
    return response.data!;
  },

  // Document Metadata
  async updateMetadata(id: string, metadata: DocumentMetadata): Promise<DocumentResponse> {
    const response = await apiClient.put<DocumentResponse>(
      `/api/documents/${id}/metadata`,
      metadata
    );
    return response.data!;
  },
};