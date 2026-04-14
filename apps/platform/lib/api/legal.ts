// apps/platform/lib/api/legal.ts

import { client } from './client';
import type {
  LegalDocument,
  DocumentTemplate,
  DocumentType,
  LegalUndertaking,
  DigitalSignature,
  ConsentDocument,
  OwnershipProof,
  AgentPermission,
  LegalDocumentUpload,
  CreateLegalDocumentRequest,
  UpdateLegalDocumentRequest,
  CreateLegalDocumentPayload,
  UpdateLegalDocumentPayload,
  LegalDocumentResponse,
  BulkLegalDocumentResponse,
  DocumentVerificationRequest,
  DocumentSigningRequest,
  LegalDocumentFilter,
  LegalTemplateRequest
} from '@/types/legal';

export const legalApi = {
  // Legal Document Management
  async getLegalDocuments(params?: LegalDocumentFilter): Promise<BulkLegalDocumentResponse> {
    const response = await client.get('/api/legal/documents', { params });
    return response.data;
  },

  async getLegalDocument(id: string): Promise<LegalDocumentResponse> {
    const response = await client.get(`/api/legal/documents/${id}`);
    return response.data;
  },

  async createLegalDocument(data: CreateLegalDocumentRequest): Promise<LegalDocumentResponse> {
    const response = await client.post('/api/legal/documents', data);
    return response.data;
  },

  async updateLegalDocument(
    id: string,
    data: UpdateLegalDocumentRequest
  ): Promise<LegalDocumentResponse> {
    const response = await client.put(`/api/legal/documents/${id}`, data);
    return response.data;
  },

  async deleteLegalDocument(id: string): Promise<void> {
    await client.delete(`/api/legal/documents/${id}`);
  },

  // Document Upload
  async uploadLegalDocument(data: LegalDocumentUpload): Promise<LegalDocumentResponse> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('documentType', data.documentType);
    formData.append('propertyId', data.propertyId || '');
    formData.append('userId', data.userId);
    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata));
    }

    const response = await client.post('/api/legal/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Document Templates
  async getDocumentTemplates(): Promise<{ data: DocumentTemplate[] }> {
    const response = await client.get('/api/legal/templates');
    return response.data;
  },

  async getDocumentTemplate(templateId: string): Promise<{ data: DocumentTemplate }> {
    const response = await client.get(`/api/legal/templates/${templateId}`);
    return response.data;
  },

  async createDocumentFromTemplate(
    templateId: string,
    data: LegalTemplateRequest
  ): Promise<LegalDocumentResponse> {
    const response = await client.post(`/api/legal/templates/${templateId}/generate`, data);
    return response.data;
  },

  // Digital Signatures
  async signDocument(data: DocumentSigningRequest): Promise<LegalDocumentResponse> {
    const response = await client.post('/api/legal/documents/sign', data);
    return response.data;
  },

  async getSignatureStatus(documentId: string): Promise<{ data: DigitalSignature[] }> {
    const response = await client.get(`/api/legal/documents/${documentId}/signatures`);
    return response.data;
  },

  async requestSignature(
    documentId: string,
    data: { signerEmail: string; signerRole: string; message?: string }
  ): Promise<{ success: boolean; message: string }> {
    const response = await client.post(`/api/legal/documents/${documentId}/request-signature`, data);
    return response.data;
  },

  // Legal Undertakings
  async createUndertaking(data: {
    propertyId: string;
    undertakingType: string;
    content: string;
    agentId?: string;
  }): Promise<{ data: LegalUndertaking }> {
    const response = await client.post('/api/legal/undertakings', data);
    return response.data;
  },

  async getUndertakings(propertyId?: string): Promise<{ data: LegalUndertaking[] }> {
    const response = await client.get('/api/legal/undertakings', {
      params: propertyId ? { propertyId } : {}
    });
    return response.data;
  },

  async signUndertaking(
    undertakingId: string,
    signature: string
  ): Promise<{ data: LegalUndertaking }> {
    const response = await client.post(`/api/legal/undertakings/${undertakingId}/sign`, {
      signature
    });
    return response.data;
  },

  // Consent Documents
  async uploadConsentDocument(data: {
    propertyId: string;
    agentId: string;
    file: File;
    consentType: string;
    validUntil?: Date;
  }): Promise<{ data: ConsentDocument }> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('propertyId', data.propertyId);
    formData.append('agentId', data.agentId);
    formData.append('consentType', data.consentType);
    if (data.validUntil) {
      formData.append('validUntil', data.validUntil.toISOString());
    }

    const response = await client.post('/api/legal/consent', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getConsentDocuments(propertyId?: string): Promise<{ data: ConsentDocument[] }> {
    const response = await client.get('/api/legal/consent', {
      params: propertyId ? { propertyId } : {}
    });
    return response.data;
  },

  async revokeConsent(consentId: string, reason: string): Promise<{ success: boolean }> {
    const response = await client.post(`/api/legal/consent/${consentId}/revoke`, { reason });
    return response.data;
  },

  // Ownership Proof
  async uploadOwnershipProof(data: {
    propertyId: string;
    file: File;
    documentType: string;
    registrationNumber?: string;
  }): Promise<{ data: OwnershipProof }> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('propertyId', data.propertyId);
    formData.append('documentType', data.documentType);
    if (data.registrationNumber) {
      formData.append('registrationNumber', data.registrationNumber);
    }

    const response = await client.post('/api/legal/ownership', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getOwnershipProofs(propertyId?: string): Promise<{ data: OwnershipProof[] }> {
    const response = await client.get('/api/legal/ownership', {
      params: propertyId ? { propertyId } : {}
    });
    return response.data;
  },

  // Agent Permissions
  async createAgentPermission(data: {
    propertyId: string;
    agentId: string;
    permissions: string[];
    validFrom: Date;
    validUntil?: Date;
    file?: File;
  }): Promise<{ data: AgentPermission }> {
    const formData = new FormData();
    formData.append('propertyId', data.propertyId);
    formData.append('agentId', data.agentId);
    formData.append('permissions', JSON.stringify(data.permissions));
    formData.append('validFrom', data.validFrom.toISOString());
    if (data.validUntil) {
      formData.append('validUntil', data.validUntil.toISOString());
    }
    if (data.file) {
      formData.append('file', data.file);
    }

    const response = await client.post('/api/legal/agent-permissions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getAgentPermissions(propertyId?: string, agentId?: string): Promise<{ data: AgentPermission[] }> {
    const response = await client.get('/api/legal/agent-permissions', {
      params: { propertyId, agentId }
    });
    return response.data;
  },

  async updateAgentPermission(
    permissionId: string,
    data: {
      permissions?: string[];
      validUntil?: Date;
      isActive?: boolean;
    }
  ): Promise<{ data: AgentPermission }> {
    const response = await client.put(`/api/legal/agent-permissions/${permissionId}`, {
      ...data,
      validUntil: data.validUntil?.toISOString()
    });
    return response.data;
  },

  async revokeAgentPermission(permissionId: string, reason: string): Promise<{ success: boolean }> {
    const response = await client.post(`/api/legal/agent-permissions/${permissionId}/revoke`, {
      reason
    });
    return response.data;
  },

  // Document Verification (Admin)
  async submitForVerification(documentId: string): Promise<{ success: boolean; message: string }> {
    const response = await client.post(`/api/legal/documents/${documentId}/submit-verification`);
    return response.data;
  },

  async getVerificationStatus(documentId: string): Promise<{
    status: string;
    verifiedAt?: string;
    verifiedBy?: string;
    rejectionReason?: string;
  }> {
    const response = await client.get(`/api/legal/documents/${documentId}/verification-status`);
    return response.data;
  },

  // Legal Compliance Check
  async checkCompliance(propertyId: string): Promise<{
    isCompliant: boolean;
    missingDocuments: string[];
    expiredDocuments: string[];
    pendingVerifications: string[];
    complianceScore: number;
  }> {
    const response = await client.get(`/api/legal/compliance/check/${propertyId}`);
    return response.data;
  },

  async getComplianceReport(propertyId: string): Promise<{
    propertyId: string;
    complianceStatus: string;
    lastChecked: string;
    documents: Array<{
      type: string;
      status: string;
      expiresAt?: string;
      isRequired: boolean;
    }>;
    recommendations: string[];
  }> {
    const response = await client.get(`/api/legal/compliance/report/${propertyId}`);
    return response.data;
  }

  // apps/platform/lib/api/legal.ts — add these to the legalApi object

async getPropertyDocuments(propertyId: string): Promise<LegalDocument[]> {
    const response = await client.get('/api/legal/documents', {
      params: { propertyId }
    });
    return response.data.data;
  },

  async getUserDocuments(): Promise<LegalDocument[]> {
    const response = await client.get('/api/legal/documents/user');
    return response.data.data;
  },

  async createDocument(payload: CreateLegalDocumentPayload): Promise<LegalDocument> {
    const response = await client.post('/api/legal/documents', payload);
    return response.data.data;
  },

  async updateDocument(
    id: string,
    payload: UpdateLegalDocumentPayload
  ): Promise<LegalDocument> {
    const response = await client.put(`/api/legal/documents/${id}`, payload);
    return response.data.data;
  },

  async deleteDocument(id: string): Promise<void> {
    await client.delete(`/api/legal/documents/${id}`);
  },

  async getRequiredDocuments(
    propertyType: string,
    userRole: string
  ): Promise<LegalDocument[]> {
    const response = await client.get('/api/legal/documents/required', {
      params: { propertyType, userRole }
    });
    return response.data.data;
  },

  async downloadTemplate(templateType: DocumentType): Promise<Blob> {
    const response = await client.get(`/api/legal/templates/${templateType}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },
};