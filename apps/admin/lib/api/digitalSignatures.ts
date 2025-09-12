// apps/admin/src/lib/api/digitalSignatures.ts

import { apiClient } from './client';

// Types
export interface DigitalSignature {
  id: string;
  documentId: string;
  userId: string;
  signerName: string;
  signerEmail: string;
  signatureData: string; // Base64 encoded signature
  signedData: string; // Base64 encoded signed document
  documentHash: string; // SHA-256 hash of the document
  signatureHash: string; // SHA-256 hash of the signature
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  status: 'PENDING' | 'SIGNED' | 'REJECTED' | 'REVOKED';
  signatureMethod: 'ELECTRONIC' | 'DIGITAL_CERTIFICATE' | 'BIOMETRIC';
  certificateId?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SignatureTemplate {
  id: string;
  name: string;
  description: string;
  documentType: string;
  requiredFields: string[];
  signaturePositions: SignaturePosition[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignaturePosition {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  signerRole: string;
}

export interface CreateSignatureRequest {
  documentId: string;
  userId: string;
  signerName: string;
  signerEmail: string;
  signatureData: string;
  signatureMethod: 'ELECTRONIC' | 'DIGITAL_CERTIFICATE' | 'BIOMETRIC';
  certificateId?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface SignatureVerificationResult {
  id: string;
  signatureId: string;
  isValid: boolean;
  verificationMethod: string;
  verifiedAt: string;
  verificationDetails: {
    documentIntegrity: boolean;
    signatureIntegrity: boolean;
    certificateValid?: boolean;
    timestampValid: boolean;
    signerIdentityVerified: boolean;
  };
  errors?: string[];
  warnings?: string[];
}

export interface GetSignaturesParams {
  documentId?: string;
  userId?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateSignatureStatusRequest {
  signatureId: string;
  status: 'VALID' | 'INVALID' | 'REVOKED';
  reason?: string;
  adminNotes?: string;
}

// Signature Template API
export interface CreateSignatureTemplateRequest {
  name: string;
  description: string;
  documentType: string;
  requiredFields: string[];
  signaturePositions: Omit<SignaturePosition, 'id'>[];
  isActive: boolean;
}

export interface UpdateSignatureTemplateRequest extends Partial<CreateSignatureTemplateRequest> {}

// API Client
class DigitalSignaturesAPI {
  private baseUrl = '/admin/api/digital-signatures';
  private templateBaseUrl = '/admin/api/signature-templates';

  async getSignatures(params: GetSignaturesParams = {}): Promise<{
    signatures: DigitalSignature[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`${this.baseUrl}?${searchParams}`);
    return response.data;
  }

  async getSignature(signatureId: string): Promise<DigitalSignature> {
    const response = await apiClient.get(`${this.baseUrl}/${signatureId}`);
    return response.data;
  }

  async createSignature(request: CreateSignatureRequest): Promise<DigitalSignature> {
    const response = await apiClient.post(`${this.baseUrl}`, request);
    return response.data;
  }

  async updateSignatureStatus(request: UpdateSignatureStatusRequest): Promise<DigitalSignature> {
    const { signatureId, ...updateData } = request;
    const response = await apiClient.patch(`${this.baseUrl}/${signatureId}/status`, updateData);
    return response.data;
  }

  async deleteSignature(signatureId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${signatureId}`);
  }

  async verifySignature(signatureId: string): Promise<SignatureVerificationResult> {
    const response = await apiClient.post(`${this.baseUrl}/${signatureId}/verify`);
    return response.data;
  }

  async bulkVerifySignatures(signatureIds: string[]): Promise<SignatureVerificationResult[]> {
    const response = await apiClient.post(`${this.baseUrl}/bulk-verify`, { signatureIds });
    return response.data;
  }

  // Signature Templates API
  async getSignatureTemplates(): Promise<SignatureTemplate[]> {
    const response = await apiClient.get(this.templateBaseUrl);
    return response.data;
  }

  async getSignatureTemplate(templateId: string): Promise<SignatureTemplate> {
    const response = await apiClient.get(`${this.templateBaseUrl}/${templateId}`);
    return response.data;
  }

  async createSignatureTemplate(request: CreateSignatureTemplateRequest): Promise<SignatureTemplate> {
    const response = await apiClient.post(this.templateBaseUrl, request);
    return response.data;
  }

  async updateSignatureTemplate(templateId: string, request: UpdateSignatureTemplateRequest): Promise<SignatureTemplate> {
    const response = await apiClient.put(`${this.templateBaseUrl}/${templateId}`, request);
    return response.data;
  }

  async deleteSignatureTemplate(templateId: string): Promise<void> {
    await apiClient.delete(`${this.templateBaseUrl}/${templateId}`);
  }
}

export const digitalSignaturesApi = new DigitalSignaturesAPI();