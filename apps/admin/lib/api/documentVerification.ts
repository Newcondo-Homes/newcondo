// apps/admin/src/lib/api/documentVerification.ts

import { ApiResponse, PaginatedResponse, QueryParams } from '@/types/api';

export interface DocumentVerification {
  id: string;
  documentId: string;
  adminId: string;
  action: VerificationAction;
  notes?: string;
  previousStatus: DocumentStatus;
  newStatus: DocumentStatus;
  verificationData?: VerificationData;
  createdAt: string;
  admin: {
    id: string;
    name?: string;
    email: string;
  };
  document: {
    id: string;
    documentType: DocumentType;
    fileName?: string;
    fileUrl?: string;
    user: {
      id: string;
      name?: string;
      email: string;
    };
    property?: {
      id: string;
      title: string;
    };
  };
}

export type VerificationAction = 
  | 'APPROVE' 
  | 'REJECT' 
  | 'REQUEST_CLARIFICATION'
  | 'FLAG_FOR_REVIEW'
  | 'MARK_EXPIRED'
  | 'REQUIRE_REUPLOAD';

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

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

export interface VerificationData {
  // OCR/AI extracted data
  extractedText?: string;
  detectedDocumentType?: DocumentType;
  confidence?: number;
  
  // Manual verification flags
  imageQuality?: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  documentAuthenticity?: 'SUSPICIOUS' | 'LIKELY_AUTHENTIC' | 'AUTHENTIC';
  dataMatches?: boolean;
  
  // Specific checks
  checks?: {
    nameMatch?: boolean;
    dateOfBirthMatch?: boolean;
    addressMatch?: boolean;
    photoMatch?: boolean;
    documentNotExpired?: boolean;
    documentReadable?: boolean;
    securityFeaturesPresent?: boolean;
  };
  
  // Additional notes
  flaggedConcerns?: string[];
  recommendations?: string[];
}

export interface VerificationFilters {
  action?: VerificationAction;
  adminId?: string;
  documentType?: DocumentType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface VerificationRequest {
  documentId: string;
  action: VerificationAction;
  notes?: string;
  verificationData?: Partial<VerificationData>;
}

export interface BulkVerificationRequest {
  documentIds: string[];
  action: Exclude<VerificationAction, 'REQUEST_CLARIFICATION' | 'FLAG_FOR_REVIEW'>;
  notes?: string;
}

export interface VerificationStats {
  totalVerifications: number;
  todayVerifications: number;
  pendingCount: number;
  averageVerificationTime: number; // in minutes
  verificationsByAction: Record<VerificationAction, number>;
  verificationsByType: Record<DocumentType, number>;
  adminPerformance: Array<{
    adminId: string;
    adminName: string;
    verificationsCount: number;
    averageTime: number;
    approvalRate: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    verifications: number;
    approvals: number;
    rejections: number;
  }>;
}

export interface VerificationWorkload {
  totalPending: number;
  assignedToMe: number;
  highPriority: number;
  overdue: number;
  averageWaitTime: number;
  estimatedWorkload: number; // hours
}

class DocumentVerificationApi {
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

  // Get all document verifications
  async getVerifications(
    params: QueryParams & VerificationFilters = {}
  ): Promise<PaginatedResponse<DocumentVerification>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const { data } = await this.request<PaginatedResponse<DocumentVerification>>(
      `/api/admin/document-verification?${searchParams.toString()}`
    );
    
    return data;
  }

  // Get single verification record
  async getVerification(id: string): Promise<DocumentVerification> {
    const { data } = await this.request<DocumentVerification>(
      `/api/admin/document-verification/${id}`
    );
    
    return data;
  }

  // Get verification history for a document
  async getDocumentVerificationHistory(documentId: string): Promise<DocumentVerification[]> {
    const { data } = await this.request<DocumentVerification[]>(
      `/api/admin/document-verification/document/${documentId}/history`
    );
    
    return data;
  }

  // Get my assigned verifications
  async getMyAssignedVerifications(
    params: QueryParams = {}
  ): Promise<PaginatedResponse<DocumentVerification>> {
    const searchParams = new URLSearchParams(params as Record<string, string>);

    const { data } = await this.request<PaginatedResponse<DocumentVerification>>(
      `/api/admin/document-verification/assigned?${searchParams.toString()}`
    );
    
    return data;
  }

  // Process document verification
  async processVerification(request: VerificationRequest): Promise<DocumentVerification> {
    const { data } = await this.request<DocumentVerification>(
      '/api/admin/document-verification/process',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
    
    return data;
  }

  // Bulk process verifications
  async bulkProcessVerifications(request: BulkVerificationRequest): Promise<{
    processed: number;
    errors: Array<{ documentId: string; error: string }>;
  }> {
    const { data } = await this.request<{
      processed: number;
      errors: Array<{ documentId: string; error: string }>;
    }>('/api/admin/document-verification/bulk-process', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    return data;
  }

  // Get verification statistics
  async getVerificationStats(
    filters?: Pick<VerificationFilters, 'dateFrom' | 'dateTo' | 'adminId'>
  ): Promise<VerificationStats> {
    const searchParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const { data } = await this.request<VerificationStats>(
      `/api/admin/document-verification/stats?${searchParams.toString()}`
    );
    
    return data;
  }

  // Get my verification workload
  async getMyWorkload(): Promise<VerificationWorkload> {
    const { data } = await this.request<VerificationWorkload>(
      '/api/admin/document-verification/my-workload'
    );
    
    return data;
  }

  // Assign verification to admin
  async assignVerification(
    documentId: string,
    adminId: string
  ): Promise<{ success: boolean }> {
    const { data } = await this.request<{ success: boolean }>(
      `/api/admin/document-verification/assign`,
      {
        method: 'POST',
        body: JSON.stringify({
          documentId,
          adminId,
        }),
      }
    );
    
    return data;
  }

  // Claim verification for processing
  async claimVerification(documentId: string): Promise<{ success: boolean }> {
    const { data } = await this.request<{ success: boolean }>(
      `/api/admin/document-verification/claim`,
      {
        method: 'POST',
        body: JSON.stringify({ documentId }),
      }
    );
    
    return data;
  }

  // Release claimed verification
  async releaseVerification(documentId: string): Promise<{ success: boolean }> {
    const { data } = await this.request<{ success: boolean }>(
      `/api/admin/document-verification/release`,
      {
        method: 'POST',
        body: JSON.stringify({ documentId }),
      }
    );
    
    return data;
  }

  // Get documents requiring urgent verification
  async getUrgentVerifications(
    params: QueryParams = {}
  ): Promise<PaginatedResponse<DocumentVerification>> {
    const searchParams = new URLSearchParams(params as Record<string, string>);

    const { data } = await this.request<PaginatedResponse<DocumentVerification>>(
      `/api/admin/document-verification/urgent?${searchParams.toString()}`
    );
    
    return data;
  }

  // Auto-assign verifications to available admins
  async autoAssignVerifications(): Promise<{
    assigned: number;
    availableAdmins: number;
  }> {
    const { data } = await this.request<{
      assigned: number;
      availableAdmins: number;
    }>('/api/admin/document-verification/auto-assign', {
      method: 'POST',
    });
    
    return data;
  }

  // Export verification report
  async exportVerificationReport(
    filters: VerificationFilters & { format: 'csv' | 'excel' | 'pdf' }
  ): Promise<Blob> {
    const searchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const token = localStorage.getItem('admin_token');
    
    const response = await fetch(
      `${this.baseUrl}/api/admin/document-verification/export?${searchParams.toString()}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status} ${response.statusText}`);
    }

    return response.blob();
  }

  // Send verification reminder
  async sendVerificationReminder(documentId: string): Promise<{ success: boolean }> {
    const { data } = await this.request<{ success: boolean }>(
      `/api/admin/document-verification/${documentId}/reminder`,
      {
        method: 'POST',
      }
    );
    
    return data;
  }
}

export const documentVerificationApi = new DocumentVerificationApi();