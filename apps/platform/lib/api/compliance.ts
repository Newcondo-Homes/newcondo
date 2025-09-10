// apps/platform/lib/api/compliance.ts

import { client } from './client';
import type {
  ComplianceStatus,
  ComplianceCheck,
  ComplianceReport,
  ComplianceRequirement,
  ComplianceAudit,
  PrivacyConsent,
  TermsAcceptance,
  ComplianceAlert,
  CompliancePolicy,
  ComplianceFilter,
  CreateComplianceCheckRequest,
  UpdateComplianceStatusRequest,
  BulkComplianceResponse,
  ComplianceResponse,
  PrivacyConsentRequest,
  TermsAcceptanceRequest,
  ComplianceAuditFilter
} from '@/types/compliance';

export const complianceApi = {
  // Compliance Status Management
  async getComplianceStatus(
    entityId: string, 
    entityType: 'user' | 'property' | 'agent'
  ): Promise<ComplianceResponse<ComplianceStatus>> {
    const response = await client.get(`/api/compliance/status/${entityType}/${entityId}`);
    return response.data;
  },

  async updateComplianceStatus(
    entityId: string,
    entityType: 'user' | 'property' | 'agent',
    data: UpdateComplianceStatusRequest
  ): Promise<ComplianceResponse<ComplianceStatus>> {
    const response = await client.put(
      `/api/compliance/status/${entityType}/${entityId}`, 
      data
    );
    return response.data;
  },

  async getBulkComplianceStatus(
    params: ComplianceFilter
  ): Promise<BulkComplianceResponse<ComplianceStatus>> {
    const response = await client.get('/api/compliance/status/bulk', { params });
    return response.data;
  },

  // Compliance Checks
  async createComplianceCheck(
    data: CreateComplianceCheckRequest
  ): Promise<ComplianceResponse<ComplianceCheck>> {
    const response = await client.post('/api/compliance/checks', data);
    return response.data;
  },

  async getComplianceCheck(checkId: string): Promise<ComplianceResponse<ComplianceCheck>> {
    const response = await client.get(`/api/compliance/checks/${checkId}`);
    return response.data;
  },

  async getComplianceChecks(
    entityId?: string,
    entityType?: 'user' | 'property' | 'agent'
  ): Promise<BulkComplianceResponse<ComplianceCheck>> {
    const params = entityId && entityType ? { entityId, entityType } : {};
    const response = await client.get('/api/compliance/checks', { params });
    return response.data;
  },

  async runComplianceCheck(
    entityId: string,
    entityType: 'user' | 'property' | 'agent',
    checkTypes?: string[]
  ): Promise<ComplianceResponse<ComplianceCheck>> {
    const response = await client.post('/api/compliance/checks/run', {
      entityId,
      entityType,
      checkTypes
    });
    return response.data;
  },

  // Compliance Reports
  async generateComplianceReport(
    entityId: string,
    entityType: 'user' | 'property' | 'agent',
    reportType: 'summary' | 'detailed' | 'audit' = 'summary'
  ): Promise<ComplianceResponse<ComplianceReport>> {
    const response = await client.post('/api/compliance/reports/generate', {
      entityId,
      entityType,
      reportType
    });
    return response.data;
  },

  async getComplianceReport(reportId: string): Promise<ComplianceResponse<ComplianceReport>> {
    const response = await client.get(`/api/compliance/reports/${reportId}`);
    return response.data;
  },

  async getComplianceReports(
    entityId?: string,
    entityType?: 'user' | 'property' | 'agent'
  ): Promise<BulkComplianceResponse<ComplianceReport>> {
    const params = entityId && entityType ? { entityId, entityType } : {};
    const response = await client.get('/api/compliance/reports', { params });
    return response.data;
  },

  async downloadComplianceReport(
    reportId: string,
    format: 'pdf' | 'excel' | 'csv' = 'pdf'
  ): Promise<Blob> {
    const response = await client.get(`/api/compliance/reports/${reportId}/download`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  // Compliance Requirements
  async getComplianceRequirements(
    entityType: 'user' | 'property' | 'agent',
    jurisdiction?: string
  ): Promise<BulkComplianceResponse<ComplianceRequirement>> {
    const params = { entityType, ...(jurisdiction && { jurisdiction }) };
    const response = await client.get('/api/compliance/requirements', { params });
    return response.data;
  },

  async getComplianceRequirement(
    requirementId: string
  ): Promise<ComplianceResponse<ComplianceRequirement>> {
    const response = await client.get(`/api/compliance/requirements/${requirementId}`);
    return response.data;
  },

  async checkRequirementCompliance(
    requirementId: string,
    entityId: string,
    entityType: 'user' | 'property' | 'agent'
  ): Promise<{
    isCompliant: boolean;
    status: string;
    lastChecked: string;
    nextCheckDue?: string;
    issues: string[];
    recommendations: string[];
  }> {
    const response = await client.post(`/api/compliance/requirements/${requirementId}/check`, {
      entityId,
      entityType
    });
    return response.data;
  },

  // Privacy Consent Management
  async recordPrivacyConsent(data: PrivacyConsentRequest): Promise<ComplianceResponse<PrivacyConsent>> {
    const response = await client.post('/api/compliance/privacy/consent', data);
    return response.data;
  },

  async getPrivacyConsents(userId: string): Promise<BulkComplianceResponse<PrivacyConsent>> {
    const response = await client.get(`/api/compliance/privacy/consent/${userId}`);
    return response.data;
  },

  async updatePrivacyConsent(
    consentId: string,
    data: Partial<PrivacyConsentRequest>
  ): Promise<ComplianceResponse<PrivacyConsent>> {
    const response = await client.put(`/api/compliance/privacy/consent/${consentId}`, data);
    return response.data;
  },

  async withdrawPrivacyConsent(
    consentId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await client.post(`/api/compliance/privacy/consent/${consentId}/withdraw`, {
      reason
    });
    return response.data;
  },

  // Terms and Conditions
  async recordTermsAcceptance(
    data: TermsAcceptanceRequest
  ): Promise<ComplianceResponse<TermsAcceptance>> {
    const response = await client.post('/api/compliance/terms/acceptance', data);
    return response.data;
  },

  async getTermsAcceptances(userId: string): Promise<BulkComplianceResponse<TermsAcceptance>> {
    const response = await client.get(`/api/compliance/terms/acceptance/${userId}`);
    return response.data;
  },

  async getCurrentTermsVersion(): Promise<{
    version: string;
    effectiveDate: string;
    content: string;
    changes?: string[];
  }> {
    const response = await client.get('/api/compliance/terms/current');
    return response.data;
  },

  async getTermsHistory(): Promise<Array<{
    version: string;
    effectiveDate: string;
    deprecated?: boolean;
    summary: string;
  }>> {
    const response = await client.get('/api/compliance/terms/history');
    return response.data.data;
  },

  // Compliance Alerts
  async getComplianceAlerts(
    entityId?: string,
    entityType?: 'user' | 'property' | 'agent',
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<BulkComplianceResponse<ComplianceAlert>> {
    const params = { entityId, entityType, severity };
    const response = await client.get('/api/compliance/alerts', { params });
    return response.data;
  },

  async markAlertAsResolved(
    alertId: string,
    resolution: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await client.post(`/api/compliance/alerts/${alertId}/resolve`, {
      resolution
    });
    return response.data;
  },

  async dismissAlert(alertId: string, reason?: string): Promise<{ success: boolean }> {
    const response = await client.post(`/api/compliance/alerts/${alertId}/dismiss`, {
      reason
    });
    return response.data;
  },

  // Compliance Policies
  async getCompliancePolicies(
    jurisdiction?: string,
    policyType?: string
  ): Promise<BulkComplianceResponse<CompliancePolicy>> {
    const params = { jurisdiction, policyType };
    const response = await client.get('/api/compliance/policies', { params });
    return response.data;
  },

  async getCompliancePolicy(policyId: string): Promise<ComplianceResponse<CompliancePolicy>> {
    const response = await client.get(`/api/compliance/policies/${policyId}`);
    return response.data;
  },

  async checkPolicyCompliance(
    policyId: string,
    entityId: string,
    entityType: 'user' | 'property' | 'agent'
  ): Promise<{
    isCompliant: boolean;
    complianceLevel: number; // 0-100
    violations: Array<{
      rule: string;
      severity: string;
      description: string;
      remediation: string;
    }>;
    lastAssessed: string;
  }> {
    const response = await client.post(`/api/compliance/policies/${policyId}/check`, {
      entityId,
      entityType
    });
    return response.data;
  },

  // Compliance Audit
  async getComplianceAudits(
    params?: ComplianceAuditFilter
  ): Promise<BulkComplianceResponse<ComplianceAudit>> {
    const response = await client.get('/api/compliance/audits', { params });
    return response.data;
  },

  async getComplianceAudit(auditId: string): Promise<ComplianceResponse<ComplianceAudit>> {
    const response = await client.get(`/api/compliance/audits/${auditId}`);
    return response.data;
  },

  async initiateComplianceAudit(data: {
    entityId: string;
    entityType: 'user' | 'property' | 'agent';
    auditType: 'routine' | 'targeted' | 'incident-based';
    scope: string[];
    auditorId?: string;
    scheduledDate?: string;
  }): Promise<ComplianceResponse<ComplianceAudit>> {
    const response = await client.post('/api/compliance/audits/initiate', data);
    return response.data;
  },

  // Compliance Dashboard
  async getComplianceDashboard(
    entityId?: string,
    entityType?: 'user' | 'property' | 'agent'
  ): Promise<{
    overallScore: number;
    statusDistribution: Record<string, number>;
    recentAlerts: ComplianceAlert[];
    upcomingDeadlines: Array<{
      type: string;
      entityId: string;
      dueDate: string;
      priority: string;
    }>;
    complianceTrends: Array<{
      date: string;
      score: number;
      issues: number;
    }>;
    recommendations: string[];
  }> {
    const params = entityId && entityType ? { entityId, entityType } : {};
    const response = await client.get('/api/compliance/dashboard', { params });
    return response.data;
  },

  // GDPR/Data Protection
  async requestDataExport(userId: string): Promise<{
    requestId: string;
    estimatedCompletionTime: string;
    downloadUrl?: string;
  }> {
    const response = await client.post('/api/compliance/gdpr/export', { userId });
    return response.data;
  },

  async requestDataDeletion(
    userId: string,
    reason: string,
    retentionOverride?: boolean
  ): Promise<{
    requestId: string;
    scheduledDeletion: string;
    canCancel: boolean;
  }> {
    const response = await client.post('/api/compliance/gdpr/deletion', {
      userId,
      reason,
      retentionOverride
    });
    return response.data;
  },

  async getDataProcessingRecords(userId: string): Promise<Array<{
    activity: string;
    purpose: string;
    legalBasis: string;
    dataCategories: string[];
    recipients: string[];
    retentionPeriod: string;
    lastProcessed: string;
  }>> {
    const response = await client.get(`/api/compliance/gdpr/processing-records/${userId}`);
    return response.data.data;
  }
};