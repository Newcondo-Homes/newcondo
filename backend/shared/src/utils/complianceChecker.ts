// backend/shared/src/utils/complianceChecker.ts

import { DocumentType, DocumentStatus, Role } from '@prisma/client';

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
  score: number; // 0-100
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
  overallScore: number; // 0-100
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

class ComplianceChecker {
  private rules: ComplianceRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.rules = [
      // Basic Identity Compliance
      {
        id: 'BASIC_IDENTITY',
        name: 'Basic Identity Verification',
        description: 'All users must provide valid identity documents',
        userRoles: ['OWNER', 'AGENT', 'RENTER'],
        requiredDocuments: [DocumentType.NIN, DocumentType.SELFIE],
        conditions: [
          {
            type: 'DOCUMENT_STATUS',
            field: 'status',
            operator: 'EQUALS',
            value: DocumentStatus.APPROVED
          }
        ],
        priority: 'CRITICAL',
        isActive: true
      },

      // Property Owner Compliance
      {
        id: 'PROPERTY_OWNER_COMPLIANCE',
        name: 'Property Owner Legal Requirements',
        description: 'Property owners must provide ownership documents and legal undertakings',
        userRoles: ['OWNER'],
        requiredDocuments: [
          DocumentType.NIN,
          DocumentType.SELFIE,
          DocumentType.OWNERSHIP_DOCUMENT,
          DocumentType.UNDERTAKING_DOCUMENT
        ],
        conditions: [
          {
            type: 'DOCUMENT_STATUS',
            field: 'status',
            operator: 'EQUALS',
            value: DocumentStatus.APPROVED
          }
        ],
        priority: 'CRITICAL',
        isActive: true
      },

      // Agent Compliance
      {
        id: 'AGENT_COMPLIANCE',
        name: 'Real Estate Agent Legal Requirements',
        description: 'Agents must provide consent documents and authorization',
        userRoles: ['AGENT'],
        requiredDocuments: [
          DocumentType.NIN,
          DocumentType.SELFIE,
          DocumentType.CONSENT_DOCUMENT,
          DocumentType.UNDERTAKING_DOCUMENT
        ],
        conditions: [
          {
            type: 'DOCUMENT_STATUS',
            field: 'status',
            operator: 'EQUALS',
            value: DocumentStatus.APPROVED
          }
        ],
        priority: 'CRITICAL',
        isActive: true
      },

      // B2B Customer Compliance
      {
        id: 'B2B_COMPLIANCE',
        name: 'Business Customer Requirements',
        description: 'B2B customers must provide business registration and tax documents',
        userRoles: ['OWNER', 'AGENT'],
        requiredDocuments: [
          DocumentType.NIN,
          DocumentType.SELFIE,
          DocumentType.BUSINESS_REGISTRATION,
          DocumentType.TAX_CERTIFICATE
        ],
        conditions: [
          {
            type: 'USER_FIELD',
            field: 'isB2BCustomer',
            operator: 'EQUALS',
            value: true
          },
          {
            type: 'DOCUMENT_STATUS',
            field: 'status',
            operator: 'EQUALS',
            value: DocumentStatus.APPROVED
          }
        ],
        priority: 'HIGH',
        isActive: true
      },

      // Terms and Privacy Compliance
      {
        id: 'TERMS_PRIVACY_COMPLIANCE',
        name: 'Terms and Privacy Agreement',
        description: 'All users must accept terms and conditions and privacy policy',
        userRoles: ['OWNER', 'AGENT', 'RENTER'],
        requiredDocuments: [],
        conditions: [
          {
            type: 'USER_FIELD',
            field: 'hasSignedTerms',
            operator: 'EQUALS',
            value: true
          },
          {
            type: 'USER_FIELD',
            field: 'hasSignedPrivacyPolicy',
            operator: 'EQUALS',
            value: true
          }
        ],
        priority: 'HIGH',
        isActive: true
      },

      // Document Expiry Compliance
      {
        id: 'DOCUMENT_EXPIRY_CHECK',
        name: 'Document Expiry Monitoring',
        description: 'Monitor documents with expiration dates',
        userRoles: ['OWNER', 'AGENT', 'RENTER'],
        requiredDocuments: [DocumentType.PASSPORT, DocumentType.DRIVERS_LICENSE],
        conditions: [
          {
            type: 'DOCUMENT_STATUS',
            field: 'status',
            operator: 'NOT_EQUALS',
            value: DocumentStatus.EXPIRED
          }
        ],
        priority: 'MEDIUM',
        isActive: true
      }
    ];
  }

  /**
   * Add a custom compliance rule
   */
  addRule(rule: ComplianceRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove a compliance rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Get all active rules for a specific role
   */
  getRulesForRole(role: Role): ComplianceRule[] {
    return this.rules.filter(rule => 
      rule.isActive && rule.userRoles.includes(role)
    );
  }

  /**
   * Check if a condition is met
   */
  private checkCondition(condition: ComplianceCondition, userData: UserComplianceData): boolean {
    switch (condition.type) {
      case 'DOCUMENT_STATUS':
        return userData.documents.some(doc => {
          if (condition.field === 'status') {
            switch (condition.operator) {
              case 'EQUALS':
                return doc.status === condition.value;
              case 'NOT_EQUALS':
                return doc.status !== condition.value;
              default:
                return false;
            }
          }
          return false;
        });

      case 'USER_FIELD':
        const fieldValue = (userData as any)[condition.field];
        switch (condition.operator) {
          case 'EQUALS':
            return fieldValue === condition.value;
          case 'NOT_EQUALS':
            return fieldValue !== condition.value;
          case 'EXISTS':
            return fieldValue !== null && fieldValue !== undefined;
          case 'CONTAINS':
            return fieldValue && fieldValue.includes(condition.value);
          default:
            return false;
        }

      default:
        return false;
    }
  }

  /**
   * Check a single compliance rule against user data
   */
  checkRule(rule: ComplianceRule, userData: UserComplianceData): ComplianceCheck {
    const missingDocuments: DocumentType[] = [];
    const issues: ComplianceIssue[] = [];
    const requiredActions: ComplianceAction[] = [];

    // Check required documents
    for (const requiredDocType of rule.requiredDocuments) {
      const userDoc = userData.documents.find(doc => doc.type === requiredDocType);
      
      if (!userDoc) {
        missingDocuments.push(requiredDocType);
        issues.push({
          type: 'MISSING_DOCUMENT',
          documentType: requiredDocType,
          description: `Missing required document: ${requiredDocType}`,
          severity: rule.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          resolutionSteps: [`Upload ${requiredDocType} document`]
        });
        requiredActions.push({
          type: 'UPLOAD_DOCUMENT',
          documentType: requiredDocType,
          description: `Upload ${requiredDocType}`,
          isUrgent: rule.priority === 'CRITICAL',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
      } else {
        // Check document status and expiry
        if (userDoc.status === DocumentStatus.PENDING) {
          issues.push({
            type: 'VERIFICATION_PENDING',
            documentType: requiredDocType,
            description: `Document verification pending: ${requiredDocType}`,
            severity: 'MEDIUM',
            resolutionSteps: ['Wait for admin verification']
          });
        } else if (userDoc.status === DocumentStatus.REJECTED) {
          issues.push({
            type: 'INVALID_DOCUMENT',
            documentType: requiredDocType,
            description: `Document rejected: ${requiredDocType}`,
            severity: 'HIGH',
            resolutionSteps: [`Re-upload valid ${requiredDocType} document`]
          });
          requiredActions.push({
            type: 'UPLOAD_DOCUMENT',
            documentType: requiredDocType,
            description: `Re-upload ${requiredDocType}`,
            isUrgent: true
          });
        } else if (userDoc.status === DocumentStatus.EXPIRED) {
          issues.push({
            type: 'EXPIRED_DOCUMENT',
            documentType: requiredDocType,
            description: `Document expired: ${requiredDocType}`,
            severity: 'HIGH',
            resolutionSteps: [`Upload new ${requiredDocType} document`]
          });
          requiredActions.push({
            type: 'UPLOAD_DOCUMENT',
            documentType: requiredDocType,
            description: `Upload new ${requiredDocType}`,
            isUrgent: true
          });
        }

        // Check expiry dates
        if (userDoc.expiresAt && userDoc.expiresAt < new Date()) {
          issues.push({
            type: 'EXPIRED_DOCUMENT',
            documentType: requiredDocType,
            description: `Document will expire soon: ${requiredDocType}`,
            severity: 'MEDIUM',
            resolutionSteps: [`Renew ${requiredDocType} document`]
          });
        }
      }
    }

    // Check conditions
    let conditionsMet = true;
    if (rule.conditions) {
      for (const condition of rule.conditions) {
        if (!this.checkCondition(condition, userData)) {
          conditionsMet = false;
          break;
        }
      }
    }

    // Calculate compliance score
    const totalRequirements = rule.requiredDocuments.length + (rule.conditions?.length || 0);
    const metRequirements = rule.requiredDocuments.length - missingDocuments.length + 
                           (conditionsMet ? (rule.conditions?.length || 0) : 0);
    const score = totalRequirements > 0 ? Math.floor((metRequirements / totalRequirements) * 100) : 100;

    // Determine status
    let status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'PENDING';
    if (score === 100 && issues.length === 0) {
      status = 'COMPLIANT';
    } else if (score === 0) {
      status = 'NON_COMPLIANT';
    } else if (issues.some(issue => issue.type === 'VERIFICATION_PENDING')) {
      status = 'PENDING';
    } else {
      status = 'PARTIAL';
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      status,
      requiredActions,
      missingDocuments,
      issues,
      score
    };
  }

  /**
   * Run full compliance check for a user
   */
  checkUserCompliance(userData: UserComplianceData): ComplianceReport {
    const applicableRules = this.getRulesForRole(userData.role);
    const checks: ComplianceCheck[] = [];
    
    for (const rule of applicableRules) {
      checks.push(this.checkRule(rule, userData));
    }

    // Calculate overall score
    const overallScore = checks.length > 0 
      ? Math.floor(checks.reduce((sum, check) => sum + check.score, 0) / checks.length)
      : 100;

    // Determine overall status
    let overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
    if (overallScore === 100 && checks.every(check => check.status === 'COMPLIANT')) {
      overallStatus = 'COMPLIANT';
    } else if (checks.some(check => check.status === 'NON_COMPLIANT')) {
      overallStatus = 'NON_COMPLIANT';
    } else {
      overallStatus = 'PARTIAL';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    const criticalIssues = checks.flatMap(check => check.issues)
      .filter(issue => issue.severity === 'CRITICAL');
    
    if (criticalIssues.length > 0) {
      recommendations.push('Address critical compliance issues immediately');
    }
    
    const missingDocs = [...new Set(checks.flatMap(check => check.missingDocuments))];
    if (missingDocs.length > 0) {
      recommendations.push(`Upload missing documents: ${missingDocs.join(', ')}`);
    }

    return {
      userId: userData.id,
      userRole: userData.role,
      overallScore,
      overallStatus,
      checks,
      recommendations,
      lastChecked: new Date(),
      nextCheckDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  /**
   * Check if user can perform specific action based on compliance
   */
  canPerformAction(userData: UserComplianceData, action: string): {
    allowed: boolean;
    reason?: string;
    requiredActions?: ComplianceAction[];
  } {
    const report = this.checkUserCompliance(userData);
    
    // Define action requirements
    const actionRequirements: Record<string, { minScore: number; requiredStatus: string[] }> = {
      'CREATE_PROPERTY': { minScore: 80, requiredStatus: ['COMPLIANT', 'PARTIAL'] },
      'RENT_PROPERTY': { minScore: 70, requiredStatus: ['COMPLIANT', 'PARTIAL'] },
      'AGENT_LISTING': { minScore: 90, requiredStatus: ['COMPLIANT'] },
      'RECEIVE_PAYMENT': { minScore: 95, requiredStatus: ['COMPLIANT'] }
    };

    const requirement = actionRequirements[action];
    if (!requirement) {
      return { allowed: true }; // No specific requirements
    }

    if (report.overallScore < requirement.minScore || 
        !requirement.requiredStatus.includes(report.overallStatus)) {
      
      const allActions = report.checks.flatMap(check => check.requiredActions);
      
      return {
        allowed: false,
        reason: `Compliance requirements not met. Score: ${report.overallScore}%, Status: ${report.overallStatus}`,
        requiredActions: allActions
      };
    }

    return { allowed: true };
  }
}

// Export singleton instance
export const complianceChecker = new ComplianceChecker();

// Utility functions
export const complianceUtils = {
  /**
   * Get compliance score color for UI
   */
  getScoreColor: (score: number): string => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    if (score >= 50) return 'orange';
    return 'red';
  },

  /**
   * Get priority color for UI
   */
  getPriorityColor: (priority: string): string => {
    switch (priority) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'yellow';
      case 'LOW': return 'blue';
      default: return 'gray';
    }
  },

  /**
   * Check if document is expiring soon (within 30 days)
   */
  isDocumentExpiringSoon: (expiresAt?: Date): boolean => {
    if (!expiresAt) return false;
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return expiresAt < thirtyDaysFromNow;
  }
};

export default ComplianceChecker;