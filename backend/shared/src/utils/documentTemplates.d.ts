/**
 * Document Templates Utility
 * Location: backend/shared/src/utils/documentTemplates.ts
 */
import { DocumentType } from '@newcondo/db';
interface DocumentTemplate {
    id: string;
    name: string;
    documentType: DocumentType;
    description: string;
    templateUrl?: string;
    instructions: string[];
    requiredFields: string[];
    exampleUrl?: string;
    isRequired: boolean;
    userTypes: ('OWNER' | 'AGENT' | 'RENTER')[];
    validationRules: DocumentValidationRules;
}
export interface DocumentValidationRules {
    maxFileSizeBytes: number;
    allowedMimeTypes: string[];
    minResolution?: {
        width: number;
        height: number;
    };
    requiredTextFields?: string[];
    expirationRequired?: boolean;
}
export interface UndertakingTemplate {
    title: string;
    content: string;
    clauses: UndertakingClause[];
    signatureRequired: boolean;
    witnessRequired?: boolean;
}
export interface UndertakingClause {
    id: string;
    text: string;
    isRequired: boolean;
    userMustInitial?: boolean;
}
export interface ComplianceChecklistItem {
    id: string;
    documentType: DocumentType;
    description: string;
    isRequired: boolean;
    userTypes: ('OWNER' | 'AGENT' | 'RENTER')[];
    dependsOn?: string[];
}
/**
 * Document template definitions
 */
export declare const DOCUMENT_TEMPLATES: Record<DocumentType, DocumentTemplate>;
/**
 * Legal Undertaking Template
 */
export declare const LEGAL_UNDERTAKING_TEMPLATE: UndertakingTemplate;
export {};
//# sourceMappingURL=documentTemplates.d.ts.map