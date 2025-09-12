import { ApiResponse, PaginatedResponse } from '@/types/api';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Types for compliance-related operations
export interface ComplianceOverview {
  totalDocuments: number;
  pendingVerifications: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  expiredDocuments: number;
  complianceScore: number;
}

export interface DocumentComplianceCheck {
  documentId: string;
  documentType: string;
  isCompliant: boolean;
  issues: string[];
  recommendations: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lastChecked: string;
}

export interface ComplianceReport {
  id: string;
  reportType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalUsers: number;
    verifiedUsers: number;
    totalProperties: number;
    compliantProperties: number;
    documentSubmissions: number;
    complianceRate: number;
  };
  generatedAt: string;
  generatedBy: string;
}

export interface PrivacyPolicyAcceptance {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  policyVersion: string;
  acceptedAt: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface TermsAcceptance {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  termsVersion: string;
  acceptedAt: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface ComplianceAuditLog {
  id: string;
  action: string;
  entityType: 'USER' | 'PROPERTY' | 'DOCUMENT' | 'SYSTEM';
  entityId: string;
  performedBy: string;
  performedByName: string;
  description: string;
  metadata: Record<string, any>;
  timestamp: string;
  ipAddress: string;
}

export interface DataRetentionPolicy {
  id: string;
  policyName: string;
  dataType: string;
  retentionPeriod: number; // in days
  retentionUnit: 'DAYS' | 'MONTHS' | 'YEARS';
  autoDeleteEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Client class
class ComplianceApiClient {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('admin-token');
    
    const response = await fetch(`${API_BASE_URL}/admin${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Compliance Overview
  async getComplianceOverview(): Promise<ApiResponse<ComplianceOverview>> {
    return this.makeRequest('/compliance/overview');
  }

  // Document Compliance Checks
  async checkDocumentCompliance(documentId: string): Promise<ApiResponse<DocumentComplianceCheck>> {
    return this.makeRequest(`/compliance/documents/${documentId}/check`);
  }

  async bulkCheckCompliance(documentIds: string[]): Promise<ApiResponse<DocumentComplianceCheck[]>> {
    return this.makeRequest('/compliance/documents/bulk-check', {
      method: 'POST',
      body: JSON.stringify({ documentIds }),
    });
  }

  async getComplianceChecks(params?: {
    page?: number;
    limit?: number;
    documentType?: string;
    riskLevel?: string;
    isCompliant?: boolean;
  }): Promise<PaginatedResponse<DocumentComplianceCheck>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.documentType) queryParams.append('documentType', params.documentType);
    if (params?.riskLevel) queryParams.append('riskLevel', params.riskLevel);
    if (params?.isCompliant !== undefined) queryParams.append('isCompliant', params.isCompliant.toString());

    return this.makeRequest(`/compliance/checks?${queryParams.toString()}`);
  }

  // Compliance Reports
  async generateComplianceReport(reportType: ComplianceReport['reportType'], dateRange: {
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse<ComplianceReport>> {
    return this.makeRequest('/compliance/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ reportType, dateRange }),
    });
  }

  async getComplianceReports(params?: {
    page?: number;
    limit?: number;
    reportType?: string;
  }): Promise<PaginatedResponse<ComplianceReport>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.reportType) queryParams.append('reportType', params.reportType);

    return this.makeRequest(`/compliance/reports?${queryParams.toString()}`);
  }

  async downloadComplianceReport(reportId: string): Promise<Blob> {
    const token = localStorage.getItem('admin-token');
    
    const response = await fetch(`${API_BASE_URL}/admin/compliance/reports/${reportId}/download`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    return response.blob();
  }

  // Privacy Policy Compliance
  async getPrivacyPolicyAcceptances(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    policyVersion?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<PrivacyPolicyAcceptance>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.policyVersion) queryParams.append('policyVersion', params.policyVersion);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    return this.makeRequest(`/compliance/privacy-policy/acceptances?${queryParams.toString()}`);
  }

  async invalidatePrivacyPolicyAcceptance(userId: string): Promise<ApiResponse<void>> {
    return this.makeRequest(`/compliance/privacy-policy/users/${userId}/invalidate`, {
      method: 'POST',
    });
  }

  // Terms & Conditions Compliance
  async getTermsAcceptances(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    termsVersion?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<TermsAcceptance>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.termsVersion) queryParams.append('termsVersion', params.termsVersion);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    return this.makeRequest(`/compliance/terms/acceptances?${queryParams.toString()}`);
  }

  async invalidateTermsAcceptance(userId: string): Promise<ApiResponse<void>> {
    return this.makeRequest(`/compliance/terms/users/${userId}/invalidate`, {
      method: 'POST',
    });
  }

  // Audit Logs
  async getComplianceAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    entityId?: string;
    performedBy?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<ComplianceAuditLog>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.action) queryParams.append('action', params.action);
    if (params?.entityType) queryParams.append('entityType', params.entityType);
    if (params?.entityId) queryParams.append('entityId', params.entityId);
    if (params?.performedBy) queryParams.append('performedBy', params.performedBy);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    return this.makeRequest(`/compliance/audit-logs?${queryParams.toString()}`);
  }

  async exportAuditLogs(params: {
    startDate: string;
    endDate: string;
    format: 'CSV' | 'JSON' | 'PDF';
    entityType?: string;
    action?: string;
  }): Promise<Blob> {
    const token = localStorage.getItem('admin-token');
    
    const response = await fetch(`${API_BASE_URL}/admin/compliance/audit-logs/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  // Data Retention Policies
  async getDataRetentionPolicies(): Promise<ApiResponse<DataRetentionPolicy[]>> {
    return this.makeRequest('/compliance/data-retention/policies');
  }

  async createDataRetentionPolicy(policy: Omit<DataRetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<DataRetentionPolicy>> {
    return this.makeRequest('/compliance/data-retention/policies', {
      method: 'POST',
      body: JSON.stringify(policy),
    });
  }

  async updateDataRetentionPolicy(policyId: string, updates: Partial<DataRetentionPolicy>): Promise<ApiResponse<DataRetentionPolicy>> {
    return this.makeRequest(`/compliance/data-retention/policies/${policyId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteDataRetentionPolicy(policyId: string): Promise<ApiResponse<void>> {
    return this.makeRequest(`/compliance/data-retention/policies/${policyId}`, {
      method: 'DELETE',
    });
  }

  async executeDataRetention(policyId: string): Promise<ApiResponse<{
    recordsProcessed: number;
    recordsDeleted: number;
    errors: string[];
  }>> {
    return this.makeRequest(`/compliance/data-retention/policies/${policyId}/execute`, {
      method: 'POST',
    });
  }

  // GDPR Compliance
  async getUserDataExport(userId: string): Promise<Blob> {
    const token = localStorage.getItem('admin-token');
    
    const response = await fetch(`${API_BASE_URL}/admin/compliance/gdpr/users/${userId}/export`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`Data export failed: ${response.status}`);
    }

    return response.blob();
  }

  async deleteUserData(userId: string, reason: string): Promise<ApiResponse<{
    recordsDeleted: number;
    tablesAffected: string[];
    completedAt: string;
  }>> {
    return this.makeRequest(`/compliance/gdpr/users/${userId}/delete`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Legal Notice Management
  async updatePrivacyPolicy(content: string, version: string): Promise<ApiResponse<void>> {
    return this.makeRequest('/compliance/privacy-policy/update', {
      method: 'PUT',
      body: JSON.stringify({ content, version }),
    });
  }

  async updateTermsAndConditions(content: string, version: string): Promise<ApiResponse<void>> {
    return this.makeRequest('/compliance/terms/update', {
      method: 'PUT',
      body: JSON.stringify({ content, version }),
    });
  }

  async getCurrentPolicyVersions(): Promise<ApiResponse<{
    privacyPolicyVersion: string;
    termsVersion: string;
    lastUpdated: string;
  }>> {
    return this.makeRequest('/compliance/policy-versions');
  }
}

// Export singleton instance
export const complianceApi = new ComplianceApiClient();