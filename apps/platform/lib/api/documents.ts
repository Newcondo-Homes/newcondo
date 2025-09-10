// apps/platform/lib/api/documents.ts

import { client } from './client';
import type {
  Document,
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
  DocumentPreview
} from '@/types/documents';

export const documentsApi = {
  // Document Management
  async getDocuments(params?: DocumentFilter): Promise<BulkDocumentResponse> {
    const response = await client.get('/api/documents', { params });
    return response.data;
  },

  async getDocument(id: string): Promise<DocumentResponse> {
    const response = await client.get(`/api/documents/${id}`);
    return response.data;
  },

  async createDocument(data: CreateDocumentRequest): Promise<DocumentResponse> {
    const response = await client.post('/api/documents', data);
    return response.data;
  },

  async updateDocument(id: string, data: UpdateDocumentRequest): Promise<DocumentResponse> {
    const response = await client.put(`/api/documents/${id}`, data);
    return response.data;
  },

  async deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
    const response = await client.delete(`/api/documents/${id}`);
    return response.data;
  },

  async restoreDocument(id: string): Promise<DocumentResponse> {
    const response = await client.post(`/api/documents/${id}/restore`);
    return response.data;
  },

  // Document Upload
  async uploadDocument(data: DocumentUpload): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('documentType', data.documentType);
    formData.append('userId', data.userId);
    
    if (data.propertyId) formData.append('propertyId', data.propertyId);
    if (data.documentSide) formData.append('documentSide', data.documentSide);
    if (data.pageNumber !== undefined) formData.append('pageNumber', data.pageNumber.toString());
    if (data.documentNumber) formData.append('documentNumber', data.documentNumber);
    if (data.expiresAt) formData.append('expiresAt', data.expiresAt.toISOString());
    if (data.isRequired !== undefined) formData.append('isRequired', data.isRequired.toString());
    if (data.metadata) formData.append('metadata', JSON.stringify(data.metadata));
    if (data.tags?.length) formData.append('tags', JSON.stringify(data.tags));

    const response = await client.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: data.onProgress ? (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        data.onProgress?.(percentCompleted);
      } : undefined,
    });
    return response.data;
  },

  async uploadMultipleDocuments(
    uploads: DocumentUpload[]
  ): Promise<{ 
    successful: DocumentUploadResponse[];
    failed: Array<{ file: File; error: string }>; 
  }> {
    const formData = new FormData();
    
    uploads.forEach((upload, index) => {
      formData.append(`files`, upload.file);
      formData.append(`data[${index}]`, JSON.stringify({
        documentType: upload.documentType,
        userId: upload.userId,
        propertyId: upload.propertyId,
        documentSide: upload.documentSide,
        pageNumber: upload.pageNumber,
        documentNumber: upload.documentNumber,
        expiresAt: upload.expiresAt?.toISOString(),
        isRequired: upload.isRequired,
        metadata: upload.metadata,
        tags: upload.tags
      }));
    });

    const response = await client.post('/api/documents/upload/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async replaceDocument(
    documentId: string,
    file: File,
    reason?: string
  ): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (reason) formData.append('reason', reason);

    const response = await client.post(`/api/documents/${documentId}/replace`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
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
    const response = await client.get(`/api/documents/${id}/download`, {
      params: options,
      responseType: 'blob', // Important for handling binary data
    });
    return response.data;
  },

  async previewDocument(
    id: string,
    options?: {
      page?: number;
      format?: 'pdf' | 'image';
    }
  ): Promise<DocumentPreview> {
    const response = await client.get(`/api/documents/${id}/preview`, {
      params: options,
      responseType: 'arraybuffer'
    });
    return response.data;
  },

  // Document Verification
  async requestVerification(
    id: string,
    data: DocumentVerificationRequest
  ): Promise<DocumentVerification> {
    const response = await client.post(`/api/documents/${id}/verify`, data);
    return response.data;
  },

  // Document Sharing
  async shareDocument(id: string, data: DocumentShareRequest): Promise<DocumentShare> {
    const response = await client.post(`/api/documents/${id}/share`, data);
    return response.data;
  },
  
  // Document Templates
  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
    const response = await client.get('/api/documents/templates');
    return response.data;
  },

  async getDocumentTemplate(templateId: string): Promise<DocumentTemplate> {
    const response = await client.get(`/api/documents/templates/${templateId}`);
    return response.data;
  },

  // Document Versioning
  async getDocumentVersions(id: string): Promise<DocumentVersion[]> {
    const response = await client.get(`/api/documents/${id}/versions`);
    return response.data;
  },

  async getDocumentVersion(id: string, versionId: string): Promise<DocumentVersion> {
    const response = await client.get(`/api/documents/${id}/versions/${versionId}`);
    return response.data;
  },

  // Document Signing
  async signDocument(id: string, signatureData: DocumentSignature): Promise<DocumentSignature> {
    const response = await client.post(`/api/documents/${id}/sign`, signatureData);
    return response.data;
  },

  // Document Metadata
  async updateMetadata(id: string, metadata: DocumentMetadata): Promise<DocumentResponse> {
    const response = await client.put(`/api/documents/${id}/metadata`, metadata);
    return response.data;
  },
};