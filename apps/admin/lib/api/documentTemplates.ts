// apps/admin/src/lib/api/documentTemplates.ts

import { ApiResponse, PaginatedResponse, QueryParams } from '@/types/api';

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  templateType: TemplateType;
  content: TemplateContent;
  variables: TemplateVariable[];
  isActive: boolean;
  version: number;
  language: string;
  jurisdiction: string;
  createdBy: string;
  updatedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: TemplateMetadata;
  usage?: TemplateUsage;
  creator: {
    id: string;
    name?: string;
    email: string;
  };
  approver?: {
    id: string;
    name?: string;
    email: string;
  };
}

export type TemplateCategory = 
  | 'LEGAL_AGREEMENTS'
  | 'CONSENT_FORMS'
  | 'OWNERSHIP_DOCUMENTS'
  | 'UNDERTAKING_FORMS'
  | 'COMPLIANCE_DOCUMENTS'
  | 'AGENT_AGREEMENTS'
  | 'PRIVACY_POLICIES'
  | 'TERMS_CONDITIONS'
  | 'NOTIFICATION_TEMPLATES'
  | 'VERIFICATION_FORMS';

export type TemplateType = 
  | 'CONTRACT'
  | 'FORM'
  | 'AGREEMENT'
  | 'CERTIFICATE'
  | 'NOTIFICATION'
  | 'REPORT'
  | 'CHECKLIST';

export interface TemplateContent {
  format: 'HTML' | 'MARKDOWN' | 'PLAIN_TEXT' | 'PDF';
  body: string;
  styles?: string; // CSS for HTML templates
  footer?: string;
  header?: string;
  watermark?: string;
  attachments?: TemplateAttachment[];
}

export interface TemplateVariable {
  id: string;
  name: string;
  label: string;
  type: VariableType;
  description?: string;
  required: boolean;
  defaultValue?: string;
  validation?: VariableValidation;
  options?: VariableOption[]; // for SELECT type
  placeholder?: string;
}

export type VariableType = 
  | 'TEXT'
  | 'EMAIL'
  | 'PHONE'
  | 'DATE'
  | 'DATETIME'
  | 'NUMBER'
  | 'CURRENCY'
  | 'BOOLEAN'
  | 'SELECT'
  | 'MULTISELECT'
  | 'TEXTAREA'
  | 'ADDRESS'
  | 'SIGNATURE';

export interface VariableValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string; // regex
  min?: number; // for numbers
  max?: number; // for numbers
  customValidator?: string; // function name
}

export interface VariableOption {
  value: string;
  label: string;
  description?: string;
}

export interface TemplateAttachment {
  id: string;
  name: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  isRequired: boolean;
}

export interface TemplateMetadata {
  tags: string[];
  legalReferences?: string[];
  relatedTemplates?: string[];
  complianceRequirements?: string[];
  auditTrail?: TemplateAuditEntry[];
  versionHistory?: TemplateVersion[];
}

export interface TemplateAuditEntry {
  id: string;
  action: 'CREATED' | 'UPDATED' | 'APPROVED' | 'PUBLISHED' | 'DEACTIVATED';
  adminId: string;
  adminName: string;
  timestamp: string;
  changes?: Record<string, { from: any; to: any }>;
  notes?: string;
}

export interface TemplateVersion {
  version: number;
  createdAt: string;
  createdBy: string;
  changes: string;
  content: TemplateContent;
}

export interface TemplateUsage {
  totalUsage: number;
  monthlyUsage: number;
  lastUsed?: string;
  popularVariables: string[];
}

export interface TemplateFilters {
  category?: TemplateCategory;
  templateType?: TemplateType;
  isActive?: boolean;
  language?: string;
  jurisdiction?: string;
  createdBy?: string;
  approvedBy?: string;
  hasExpiration?: boolean;
  search?: string;
  tags?: string[];
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  category: TemplateCategory;
  templateType: TemplateType;
  content: TemplateContent;
  variables: Omit<TemplateVariable, 'id'>[];
  language: string;
  jurisdiction: string;
  expiresAt?: string;
  metadata?: Partial<TemplateMetadata>;
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {
  version?: number; // for optimistic locking
  changes?: string; // description of changes
}

export interface GenerateDocumentRequest {
  templateId: string;
  variables: Record<string, any>;
  format?: 'HTML' | 'PDF' | 'DOCX';
  includeAttachments?: boolean;
}

export interface GeneratedDocument {
  id: string;
  templateId: string;
  content: string;
  format: string;
  fileName: string;
  fileUrl?: string;
  variables: Record<string, any>;
  generatedAt: string;
  generatedBy: string;
}

export interface TemplateStats {
  totalTemplates: number;
  activeTemplates: number;
  draftTemplates: number;
  approvedTemplates: number;
  byCategory: Record<TemplateCategory, number>;
  byType: Record<TemplateType, number>;
  mostUsed: Array<{
    templateId: string;
    name: string;
    usage: number;
  }>;
  recentActivity: Array<{
    templateId: string;
    name: string;
    action: string;
    timestamp: string;
    adminName: string;
  }>;
}

class DocumentTemplatesApi {
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

  // Get all templates with filtering and pagination
  async getTemplates(
    params: QueryParams & TemplateFilters = {}
  ): Promise<PaginatedResponse<DocumentTemplate>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    const { data } = await this.request<PaginatedResponse<DocumentTemplate>>(
      `/api/admin/document-templates?${searchParams.toString()}`
    );
    
    return data;
  }

  // Get single template
  async getTemplate(id: string): Promise<DocumentTemplate> {
    const { data } = await this.request<DocumentTemplate>(
      `/api/admin/document-templates/${id}`
    );
    
    return data;
  }

  // Create new template
  async createTemplate(template: CreateTemplateRequest): Promise<DocumentTemplate> {
    const { data } = await this.request<DocumentTemplate>(
      '/api/admin/document-templates',
      {
        method: 'POST',
        body: JSON.stringify(template),
      }
    );
    
    return data;
  }

  // Update template
  async updateTemplate(
    id: string,
    template: UpdateTemplateRequest
  ): Promise<DocumentTemplate> {
    const { data } = await this.request<DocumentTemplate>(
      `/api/admin/document-templates/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(template),
      }
    );
    
    return data;
  }

  // Delete template
  async deleteTemplate(id: string): Promise<{ success: boolean }> {
    const { data } = await this.request<{ success: boolean }>(
      `/api/admin/document-templates/${id}`,
      {
        method: 'DELETE',
      }
    );
    
    return data;
  }

  // Approve a template
  async approveTemplate(id: string): Promise<DocumentTemplate> {
    const { data } = await this.request<DocumentTemplate>(
      `/api/admin/document-templates/${id}/approve`,
      {
        method: 'POST',
      }
    );
    
    return data;
  }

  // Publish a template
  async publishTemplate(id: string): Promise<DocumentTemplate> {
    const { data } = await this.request<DocumentTemplate>(
      `/api/admin/document-templates/${id}/publish`,
      {
        method: 'POST',
      }
    );
    
    return data;
  }

  // Generate a document from a template
  async generateDocument(request: GenerateDocumentRequest): Promise<GeneratedDocument> {
    const { data } = await this.request<GeneratedDocument>(
      `/api/admin/document-templates/generate`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
    
    return data;
  }

  // Get template statistics
  async getTemplateStats(): Promise<TemplateStats> {
    const { data } = await this.request<TemplateStats>(
      `/api/admin/document-templates/stats`
    );
    
    return data;
  }
}

export const documentTemplatesApi = new DocumentTemplatesApi();