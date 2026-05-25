"use strict";
// backend/shared/src/utils/complianceChecker.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.complianceUtils = exports.complianceChecker = void 0;
const db_1 = require("@newcondo/db");
class ComplianceChecker {
    constructor() {
        this.rules = [];
        this.initializeDefaultRules();
    }
    initializeDefaultRules() {
        this.rules = [
            // Basic Identity Compliance
            {
                id: 'BASIC_IDENTITY',
                name: 'Basic Identity Verification',
                description: 'All users must provide valid identity documents',
                userRoles: ['OWNER', 'AGENT', 'RENTER'],
                requiredDocuments: [db_1.DocumentType.NIN, db_1.DocumentType.SELFIE],
                conditions: [
                    {
                        type: 'DOCUMENT_STATUS',
                        field: 'status',
                        operator: 'EQUALS',
                        value: db_1.DocumentStatus.APPROVED
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
                    db_1.DocumentType.NIN,
                    db_1.DocumentType.SELFIE,
                    db_1.DocumentType.OWNERSHIP_DOCUMENT,
                    db_1.DocumentType.UNDERTAKING_DOCUMENT
                ],
                conditions: [
                    {
                        type: 'DOCUMENT_STATUS',
                        field: 'status',
                        operator: 'EQUALS',
                        value: db_1.DocumentStatus.APPROVED
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
                    db_1.DocumentType.NIN,
                    db_1.DocumentType.SELFIE,
                    db_1.DocumentType.CONSENT_DOCUMENT,
                    db_1.DocumentType.UNDERTAKING_DOCUMENT
                ],
                conditions: [
                    {
                        type: 'DOCUMENT_STATUS',
                        field: 'status',
                        operator: 'EQUALS',
                        value: db_1.DocumentStatus.APPROVED
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
                    db_1.DocumentType.NIN,
                    db_1.DocumentType.SELFIE,
                    db_1.DocumentType.BUSINESS_REGISTRATION,
                    db_1.DocumentType.TAX_CERTIFICATE
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
                        value: db_1.DocumentStatus.APPROVED
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
                requiredDocuments: [db_1.DocumentType.PASSPORT, db_1.DocumentType.DRIVERS_LICENSE],
                conditions: [
                    {
                        type: 'DOCUMENT_STATUS',
                        field: 'status',
                        operator: 'NOT_EQUALS',
                        value: db_1.DocumentStatus.EXPIRED
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
    addRule(rule) {
        this.rules.push(rule);
    }
    /**
     * Remove a compliance rule
     */
    removeRule(ruleId) {
        this.rules = this.rules.filter(rule => rule.id !== ruleId);
    }
    /**
     * Get all active rules for a specific role
     */
    getRulesForRole(role) {
        return this.rules.filter(rule => rule.isActive && rule.userRoles.includes(role));
    }
    /**
     * Check if a condition is met
     */
    checkCondition(condition, userData) {
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
                const fieldValue = userData[condition.field];
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
    checkRule(rule, userData) {
        const missingDocuments = [];
        const issues = [];
        const requiredActions = [];
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
            }
            else {
                // Check document status and expiry
                if (userDoc.status === db_1.DocumentStatus.PENDING) {
                    issues.push({
                        type: 'VERIFICATION_PENDING',
                        documentType: requiredDocType,
                        description: `Document verification pending: ${requiredDocType}`,
                        severity: 'MEDIUM',
                        resolutionSteps: ['Wait for admin verification']
                    });
                }
                else if (userDoc.status === db_1.DocumentStatus.REJECTED) {
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
                }
                else if (userDoc.status === db_1.DocumentStatus.EXPIRED) {
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
        let status;
        if (score === 100 && issues.length === 0) {
            status = 'COMPLIANT';
        }
        else if (score === 0) {
            status = 'NON_COMPLIANT';
        }
        else if (issues.some(issue => issue.type === 'VERIFICATION_PENDING')) {
            status = 'PENDING';
        }
        else {
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
    checkUserCompliance(userData) {
        const applicableRules = this.getRulesForRole(userData.role);
        const checks = [];
        for (const rule of applicableRules) {
            checks.push(this.checkRule(rule, userData));
        }
        // Calculate overall score
        const overallScore = checks.length > 0
            ? Math.floor(checks.reduce((sum, check) => sum + check.score, 0) / checks.length)
            : 100;
        // Determine overall status
        let overallStatus;
        if (overallScore === 100 && checks.every(check => check.status === 'COMPLIANT')) {
            overallStatus = 'COMPLIANT';
        }
        else if (checks.some(check => check.status === 'NON_COMPLIANT')) {
            overallStatus = 'NON_COMPLIANT';
        }
        else {
            overallStatus = 'PARTIAL';
        }
        // Generate recommendations
        const recommendations = [];
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
    canPerformAction(userData, action) {
        const report = this.checkUserCompliance(userData);
        // Define action requirements
        const actionRequirements = {
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
exports.complianceChecker = new ComplianceChecker();
// Utility functions
exports.complianceUtils = {
    /**
     * Get compliance score color for UI
     */
    getScoreColor: (score) => {
        if (score >= 90)
            return 'green';
        if (score >= 70)
            return 'yellow';
        if (score >= 50)
            return 'orange';
        return 'red';
    },
    /**
     * Get priority color for UI
     */
    getPriorityColor: (priority) => {
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
    isDocumentExpiringSoon: (expiresAt) => {
        if (!expiresAt)
            return false;
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return expiresAt < thirtyDaysFromNow;
    }
};
exports.default = ComplianceChecker;
//# sourceMappingURL=complianceChecker.js.map