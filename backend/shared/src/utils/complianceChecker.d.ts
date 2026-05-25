import { DocumentType, DocumentStatus, Role } from '@newcondo/db';
export interface ComplianceRule {
    id: string;
    name: string;
    description: string;
    userRoles: Role[];
    requiredDocuments: DocumentType[];
    conditions?: ComplianceCondition[];
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    isActive: boolean;
}
export interface ComplianceCondition {
    type: 'DOCUMENT_STATUS' | 'USER_FIELD' | 'PROPERTY_STATUS' | 'CUSTOM';
    field: string;
    operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'EXISTS' | 'GREATER_THAN' | 'LESS_THAN';
    value: any;
}
export interface ComplianceCheck {
    ruleId: string;
    ruleName: string;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'PENDING';
    requiredActions: ComplianceAction[];
    missingDocuments: DocumentType[];
    issues: ComplianceIssue[];
    score: number;
}
export interface ComplianceAction {
    type: 'UPLOAD_DOCUMENT' | 'VERIFY_DOCUMENT' | 'SIGN_DOCUMENT' | 'UPDATE_PROFILE' | 'CONTACT_ADMIN';
    documentType?: DocumentType;
    description: string;
    isUrgent: boolean;
    dueDate?: Date;
}
export interface ComplianceIssue {
    type: 'MISSING_DOCUMENT' | 'INVALID_DOCUMENT' | 'EXPIRED_DOCUMENT' | 'UNSIGNED_DOCUMENT' | 'VERIFICATION_PENDING';
    documentType?: DocumentType;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    resolutionSteps: string[];
}
export interface ComplianceReport {
    userId: string;
    userRole: Role;
    overallScore: number;
    overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
    checks: ComplianceCheck[];
    recommendations: string[];
    lastChecked: Date;
    nextCheckDue?: Date;
}
export interface UserComplianceData {
    id: string;
    role: Role;
    verificationStatus: string;
    documents: {
        type: DocumentType;
        status: DocumentStatus;
        uploadedAt?: Date;
        expiresAt?: Date;
    }[];
    userType?: string;
    isB2BCustomer?: boolean;
    hasSignedTerms?: boolean;
    hasSignedPrivacyPolicy?: boolean;
    properties?: {
        id: string;
        status: string;
        hasOwnershipDoc?: boolean;
        hasConsentDoc?: boolean;
        hasUndertakingDoc?: boolean;
    }[];
}
declare class ComplianceChecker {
    private rules;
    constructor();
    private initializeDefaultRules;
    /**
     * Add a custom compliance rule
     */
    addRule(rule: ComplianceRule): void;
    /**
     * Remove a compliance rule
     */
    removeRule(ruleId: string): void;
    /**
     * Get all active rules for a specific role
     */
    getRulesForRole(role: Role): ComplianceRule[];
    /**
     * Check if a condition is met
     */
    private checkCondition;
    /**
     * Check a single compliance rule against user data
     */
    checkRule(rule: ComplianceRule, userData: UserComplianceData): ComplianceCheck;
    /**
     * Run full compliance check for a user
     */
    checkUserCompliance(userData: UserComplianceData): ComplianceReport;
    /**
     * Check if user can perform specific action based on compliance
     */
    canPerformAction(userData: UserComplianceData, action: string): {
        allowed: boolean;
        reason?: string;
        requiredActions?: ComplianceAction[];
    };
}
export declare const complianceChecker: ComplianceChecker;
export declare const complianceUtils: {
    /**
     * Get compliance score color for UI
     */
    getScoreColor: (score: number) => string;
    /**
     * Get priority color for UI
     */
    getPriorityColor: (priority: string) => string;
    /**
     * Check if document is expiring soon (within 30 days)
     */
    isDocumentExpiringSoon: (expiresAt?: Date) => boolean;
};
export default ComplianceChecker;
//# sourceMappingURL=complianceChecker.d.ts.map