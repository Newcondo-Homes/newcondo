// apps/admin/src/lib/api/legalDocuments.ts

import { ApiResponse, PaginatedResponse, QueryParams } from '@/types/api';

export interface LegalDocument {
  id: string;
  userId: string;
  propertyId?: string;
  documentType: DocumentType;
  documentNumber?: string;
  fileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  status: DocumentStatus;
  verificationNotes?: string;
  isRequired: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name?: string;
    email: string;
    phone?: string;
  };
  property?: {
    id: string;
    title: string;
    address: string;
  };
}

export type DocumentType = 
  | 'NIN' 
  | 'BVN' 
  | 'PASSPORT' 
  | 'VOTERS_CARD' 
  | 'DRIVERS_LICENSE'
  | 'SELFIE'
  | 'OWNERSHIP_DOCUMENT'
  | 'CONSENT_DOCUMENT'
  | 'UNDERTAKING_DOCUMENT'
  | 'BUSINESS_REGISTRATION'
  | 'TAX_CERTIFICATE'
  | 'UTILITY_BILL'
  | 'BANK_STATEMENT'
  | 'OTHER';

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface LegalDocumentFilters {
  documentType?: DocumentType;
  status?: DocumentStatus;
  userId?: string;
  propertyId?: string;
  isRequired?: boolean;
  hasExpiration?: boolean;
  search?: string;
}

export interface LegalDocumentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  byType: Record<DocumentType, number>;
  byMonth: Array<{
    month: string;
    count: number;
  }>;
}

export interface BulkDocumentAction {
  documentIds: string[];
  action: 'approve' | 'reject' | 'mark_required' | 'mark_optional';
  notes?: string;
}

class LegalDocumentsApi {
  private baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('admin_token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // Get all legal documents with filtering and pagination
  async getLegalDocuments(
    params: QueryParams & LegalDocumentFilters = {}
  ): Promise<PaginatedResponse<LegalDocument>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const { data } = await this.request<PaginatedResponse<LegalDocument>>(
      `/api/admin/legal-documents?${searchParams.toString()}`
    );
    
    return data;
  }

  // Get single legal document
  async getLegalDocument(id: string): Promise<LegalDocument> {
    const { data } = await this.request<LegalDocument>(
      `/api/admin/legal-documents/${id}`
    );
    
    return data;
  }

  // Get documents by user
  async getUserDocuments(userId: string): Promise<LegalDocument[]> {
    const { data } = await this.request<LegalDocument[]>(
      `/api/admin/legal-documents/user/${userId}`
    );
    
    return data;
  }

  // Get documents by property
  async getPropertyDocuments(propertyId: string): Promise<LegalDocument[]> {
    const { data } = await this.request<LegalDocument[]>(
      `/api/admin/legal-documents/property/${propertyId}`
    );
    
    return data;
  }

  // Update document status
  async updateDocumentStatus(
    id: string,
    status: DocumentStatus,
    verificationNotes?: string
  ): Promise<LegalDocument> {
    const { data } = await this.request<LegalDocument>(
      `/api/admin/legal-documents/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          verificationNotes,
        }),
      }
    );
    
    return data;
  }

  // Bulk update documents
  async bulkUpdateDocuments(action: BulkDocumentAction): Promise<{
    updated: number;
    errors: Array<{ documentId: string; error: string }>;
  }> {
    const { data } = await this.request<{
      updated: number;
      errors: Array<{ documentId: string; error: string }>;
    }>('/api/admin/legal-documents/bulk-update', {
      method: 'PATCH',
      body: JSON.stringify(action),
    });
    
    return data;
  }

  // Get legal documents statistics
  async getLegalDocumentStats(
    filters?: Pick<LegalDocumentFilters, 'documentType' | 'userId' | 'propertyId'>
  ): Promise<LegalDocumentStats> {
    const searchParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const { data } = await this.request<LegalDocumentStats>(
      `/api/admin/legal-documents/stats?${searchParams.toString()}`
    );
    
    return data;
  }

  // Mark document as required/optional
  async updateDocumentRequirement(
    id: string,
    isRequired: boolean
  ): Promise<LegalDocument> {
    const { data } = await this.request<LegalDocument>(
      `/api/admin/legal-documents/${id}/requirement`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          isRequired,
        }),
      }
    );
    
    return data;
  }

  // Get expired documents
  async getExpiredDocuments(
    params: QueryParams = {}
  ): Promise<PaginatedResponse<LegalDocument>> {
    const searchParams = new URLSearchParams({
      ...params,
      status: 'EXPIRED',
    } as Record<string, string>);

    const { data } = await this.request<PaginatedResponse<LegalDocument>>(
      `/api/admin/legal-documents/expired?${searchParams.toString()}`
    );
    
    return data;
  }

  // Get documents requiring verification
  async getPendingDocuments(
    params: QueryParams = {}
  ): Promise<PaginatedResponse<LegalDocument>> {
    const searchParams = new URLSearchParams({
      ...params,
      status: 'PENDING',
    } as Record<string, string>);

    const { data } = await this.request<PaginatedResponse<LegalDocument>>(
      `/api/admin/legal-documents/pending?${searchParams.toString()}`
    );
    
    return data;
  }

  // Download document file
  async downloadDocument(id: string): Promise<Blob> {
    const token = localStorage.getItem('admin_token');
    
    const response = await fetch(
      `${this.baseUrl}/api/admin/legal-documents/${id}/download`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    return response.blob();
  }

  // Request document re-upload
  async requestDocumentReUpload(
    id: string,
    reason: string
  ): Promise<{ success: boolean }> {
    const { data } = await this.request<{ success: boolean }>(
      `/api/admin/legal-documents/${id}/request-reupload`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
    
    return data;
  }
}

export const legalDocumentsApi = new LegalDocumentsApi();