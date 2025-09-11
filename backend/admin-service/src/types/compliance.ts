// backend/admin-service/src/types/compliance.ts

export interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  version: string;
  jurisdiction: string;
  effectiveDate: Date;
  expiryDate?: Date;
  
  // Framework structure
  categories: ComplianceCategory[];
  requirements: ComplianceRequirement[];
  
  // Status
  status: FrameworkStatus;
  mandatoryCompliance: boolean;
  
  // Metadata
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum FrameworkStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED',
  SUPERSEDED = 'SUPERSEDED'
}

export interface ComplianceCategory {
  id: string;
  name: string;
  description: string;
  priority: CompliancePriority;
  requirements: string[]; // Array of requirement IDs
  parentCategoryId?: string;
  subcategories?: ComplianceCategory[];
}

export enum CompliancePriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  details?: string;
  documentTemplateId?: string; // Links to a document template
  documentType: 'DOCUMENT' | 'RECORD' | 'ATTESTATION';
  requiredFor: 'USER' | 'PROPERTY' | 'AGENT';
  evidenceType: 'UPLOAD' | 'FORM' | 'SIGNED_DOCUMENT';
  isAutomatedCheck: boolean;
  frequency: 'ONCE' | 'ANNUALLY' | 'MONTHLY' | 'QUARTERLY' | 'CUSTOM';
  dueDate?: Date;
  metadata?: Record<string, any>;
}

export enum RequirementStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  EXEMPT = 'EXEMPT',
  IN_PROGRESS = 'IN_PROGRESS',
}