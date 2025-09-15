// apps/admin/src/lib/utils/complianceHelpers.ts

import { DocumentType, DocumentStatus } from '@newcondo/db';

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  isActive: boolean;
  applicableUserTypes: string[];
  requiredDocuments: DocumentType[];
  validationRules: ValidationRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'expiration' | 'signature' | 'custom';
  condition: string;
  errorMessage: string;
}

export interface ComplianceCheckResult {
  isCompliant: boolean;
  score: number; // 0-100
  violations: ComplianceViolation[];
  warnings: ComplianceWarning[];
  recommendations: string[];
  nextReviewDate?: Date;
}

export interface ComplianceViolation {
  ruleId: string;
  severity: ComplianceSeverity;
  message: string;
  affectedDocuments: DocumentType[];
  resolutionRequired: boolean;
  dueDate?: Date;
}

export interface ComplianceWarning {
  message: string;
  category: ComplianceCategory;
  priority: 'low' | 'medium' | 'high';
  suggestedAction: string;
}

export interface LegalRequirement {
  id: string;
  name: string;
  description: string;
  jurisdiction: 'Nigeria' | 'Lagos' | 'FCT' | 'All';
  category: LegalCategory;
  isActive: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
  requiredActions: string[];
  penaltyForNonCompliance: string;
}

export interface ConsentTracking {
  userId: string;
  consentType: ConsentType;
  version: string;
  granted: boolean;
  grantedAt: Date;
  ipAddress: string;
  userAgent: string;
  withdrawnAt?: Date;
  withdrawalReason?: string;
}

export enum ComplianceCategory {
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  PROPERTY_OWNERSHIP = 'PROPERTY_OWNERSHIP',
  AGENT_AUTHORIZATION = 'AGENT_AUTHORIZATION',
  DATA_PROTECTION = 'DATA_PROTECTION',
  FINANCIAL_COMPLIANCE = 'FINANCIAL_COMPLIANCE',
  LEGAL_DOCUMENTATION = 'LEGAL_DOCUMENTATION',
  PLATFORM_TERMS = 'PLATFORM_TERMS'
}

export enum ComplianceSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum LegalCategory {
  DATA_PROTECTION = 'DATA_PROTECTION',
  PROPERTY_LAW = 'PROPERTY_LAW',
  CONTRACT_LAW = 'CONTRACT_LAW',
  CONSUMER_PROTECTION = 'CONSUMER_PROTECTION',
  ANTI_MONEY_LAUNDERING = 'ANTI_MONEY_LAUNDERING',
  TAXATION = 'TAXATION'
}

export enum ConsentType {
  TERMS_AND_CONDITIONS = 'TERMS_AND_CONDITIONS',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  MARKETING_COMMUNICATIONS = 'MARKETING_COMMUNICATIONS',
  DATA_PROCESSING = 'DATA_PROCESSING',
  THIRD_PARTY_SHARING = 'THIRD_PARTY_SHARING',
  PROPERTY_LISTING_CONSENT = 'PROPERTY_LISTING_CONSENT'
}

/**
 * Default compliance rules for the platform
 */
export const DEFAULT_COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: 'identity-verification',
    name: 'Identity Verification Requirement',
    description: 'All users must provide valid identity documents',
    category: ComplianceCategory.IDENTITY_VERIFICATION,
    severity: ComplianceSeverity.CRITICAL,
    isActive: true,
    applicableUserTypes: ['LANDLORD', 'AGENT', 'RENTER', 'PROPERTY_MANAGER'],
    requiredDocuments: [DocumentType.NIN, DocumentType.SELFIE],
    validationRules: [
      {
        field: 'nin',
        type: 'required',
        condition: 'notEmpty',
        errorMessage: 'National Identity Number is required'
      },
      {
        field: 'nin',
        type: 'format',
        condition: '/^\\d{11}$/',
        errorMessage: 'NIN must be 11 digits'
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'property-ownership-proof',
    name: 'Property Ownership Documentation',
    description: 'Property owners must provide proof of ownership',
    category: ComplianceCategory.PROPERTY_OWNERSHIP,
    severity: ComplianceSeverity.HIGH,
    isActive: true,
    applicableUserTypes: ['LANDLORD'],
    requiredDocuments: [DocumentType.OWNERSHIP_DOCUMENT],
    validationRules: [
      {
        field: 'ownershipDocument',
        type: 'required',
        condition: 'notEmpty',
        errorMessage: 'Proof of ownership document is required'
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'agent-consent-requirement',
    name: 'Agent Consent Documentation',
    description: 'Agents must provide owner consent for property listings',
    category: ComplianceCategory.AGENT_AUTHORIZATION,
    severity: ComplianceSeverity.HIGH,
    isActive: true,
    applicableUserTypes: ['AGENT'],
    requiredDocuments: [DocumentType.CONSENT_DOCUMENT],
    validationRules: [
      {
        field: 'consentDocument',
        type: 'required',
        condition: 'notEmpty',
        errorMessage: 'Owner consent document is required'
      },
      {
        field: 'consentDocument',
        type: 'signature',
        condition: 'hasValidSignature',
        errorMessage: 'Document must be properly signed'
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

/**
 * Nigerian legal requirements for property platforms
 */
export const NIGERIAN_LEGAL_REQUIREMENTS: LegalRequirement[] = [
  {
    id: 'ndpr-compliance',
    name: 'Nigeria Data Protection Regulation (NDPR)',
    description: 'Compliance with data protection and privacy regulations',
    jurisdiction: 'Nigeria',
    category: LegalCategory.DATA_PROTECTION,
    isActive: true,
    effectiveDate: new Date('2019-01-25'),
    requiredActions: [
      'Obtain explicit consent for data processing',
      'Implement data subject rights (access, rectification, deletion)',
      'Appoint Data Protection Officer if required',
      'Report data breaches within 72 hours',
      'Conduct Privacy Impact Assessments'
    ],
    penaltyForNonCompliance: 'Up to 2% of annual gross revenue or ₦10,000,000'
  },
  {
    id: 'fccpc-consumer-protection',
    name: 'Federal Competition and Consumer Protection Act',
    description: 'Consumer protection and fair trading practices',
    jurisdiction: 'Nigeria',
    category: LegalCategory.CONSUMER_PROTECTION,
    isActive: true,
    effectiveDate: new Date('2019-02-01'),
    requiredActions: [
      'Provide clear terms and conditions',
      'Ensure fair pricing practices',
      'Handle consumer complaints effectively',
      'Avoid misleading advertisements'
    ],
    penaltyForNonCompliance: 'Up to 10% of annual turnover or ₦100,000,000'
  },
  {
    id: 'aml-cft-requirements',
    name: 'Anti-Money Laundering and Combating Financing of Terrorism',
    description: 'AML/CFT compliance for financial transactions',
    jurisdiction: 'Nigeria',
    category: LegalCategory.ANTI_MONEY_LAUNDERING,
    isActive: true,
    effectiveDate: new Date('2022-05-01'),
    requiredActions: [
      'Conduct Customer Due Diligence (CDD)',
      'Report suspicious transactions',
      'Maintain transaction records',
      'Screen against sanctions lists'
    ],
    penaltyForNonCompliance: 'Fines up to ₦50,000,000 or 3x transaction value'
  }
];

/**
 * Performs comprehensive compliance check for a user
 */
export function performComplianceCheck(
  userType: string,
  userDocuments: Array<{
    documentType: DocumentType;
    status: DocumentStatus;
    expiresAt?: Date | null;
    createdAt: Date;
  }>,
  consentRecords: ConsentTracking[]
): ComplianceCheckResult {
  const violations: ComplianceViolation[] = [];
  const warnings: ComplianceWarning[] = [];
  const recommendations: string[] = [];
  
  // Get applicable rules for user type
  const applicableRules = DEFAULT_COMPLIANCE_RULES.filter(rule =>
    rule.isActive && rule.applicableUserTypes.includes(userType)
  );
  
  let totalScore = 0;
  const maxScore = applicableRules.length * 100;
  
  // Check each compliance rule
  applicableRules.forEach(rule => {
    const ruleResult = checkComplianceRule(rule, userDocuments, consentRecords);
    totalScore += ruleResult.score;
    
    if (ruleResult.violations.length > 0) {
      violations.push(...ruleResult.violations);
    }
    
    if (ruleResult.warnings.length > 0) {
      warnings.push(...ruleResult.warnings);
    }
  });
  
  // Calculate overall score
  const score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  
  // Generate recommendations based on violations and warnings
  if (violations.some(v => v.severity === ComplianceSeverity.CRITICAL)) {
    recommendations.push('Address critical compliance violations immediately');
  }
  
  if (warnings.some(w => w.priority === 'high')) {
    recommendations.push('Review and resolve high-priority warnings');
  }
  
  if (score < 80) {
    recommendations.push('Improve document completeness to meet compliance standards');
  }
  
  // Set next review date based on compliance status
  const nextReviewDate = new Date();
  if (score >= 90) {
    nextReviewDate.setMonth(nextReviewDate.getMonth() + 6); // 6 months for high compliance
  } else if (score >= 70) {
    nextReviewDate.setMonth(nextReviewDate.getMonth() + 3); // 3 months for medium compliance
  } else {
    nextReviewDate.setMonth(nextReviewDate.getMonth() + 1); // 1 month for low compliance
  }
  
  return {
    isCompliant: violations.filter(v => v.resolutionRequired).length === 0 && score >= 70,
    score,
    violations,
    warnings,
    recommendations,
    nextReviewDate
  };
}

/**
 * Checks compliance against a specific rule
 */
function checkComplianceRule(
  rule: ComplianceRule,
  userDocuments: Array<{
    documentType: DocumentType;
    status: DocumentStatus;
    expiresAt?: Date | null;
    createdAt: Date;
  }>,
  consentRecords: ConsentTracking[]
): { score: number; violations: ComplianceViolation[]; warnings: ComplianceWarning[] } {
  const violations: ComplianceViolation[] = [];
  const warnings: ComplianceWarning[] = [];
  let score = 100; // Start with full score and deduct for violations
  
  // Check required documents
  rule.requiredDocuments.forEach(docType => {
    const userDoc = userDocuments.find(doc => doc.documentType === docType);
    
    if (!userDoc) {
      violations.push({
        ruleId: rule.id,
        severity: rule.severity,
        message: `Missing required document: ${docType}`,
        affectedDocuments: [docType],
        resolutionRequired: true
      });
      score -= 30;
      return;
    }
    
    if (userDoc.status === DocumentStatus.REJECTED) {
      violations.push({
        ruleId: rule.id,
        severity: ComplianceSeverity.HIGH,
        message: `Document rejected: ${docType}`,
        affectedDocuments: [docType],
        resolutionRequired: true
      });
      score -= 25;
    }
    
    if (userDoc.status === DocumentStatus.PENDING) {
      warnings.push({
        message: `Document pending review: ${docType}`,
        category: rule.category,
        priority: 'medium',
        suggestedAction: 'Wait for document verification or contact support'
      });
      score -= 10;
    }
    
    // Check expiration
    if (userDoc.expiresAt && userDoc.expiresAt < new Date()) {
      violations.push({
        ruleId: rule.id,
        severity: ComplianceSeverity.HIGH,
        message: `Expired document: ${docType}`,
        affectedDocuments: [docType],
        resolutionRequired: true
      });
      score -= 20;
    }
  });
  
  // Check validation rules
  rule.validationRules.forEach(validationRule => {
    // This part would require more complex logic to dynamically validate fields.
    // We'll leave it as a conceptual check to be implemented with an actual data model.
    // For now, assume a basic check against document status.
    const userDoc = userDocuments.find(doc => doc.documentType === (validationRule.field as DocumentType));
    if (userDoc && validationRule.type === 'signature' && userDoc.status !== DocumentStatus.SIGNED) {
      violations.push({
        ruleId: rule.id,
        severity: rule.severity,
        message: validationRule.errorMessage,
        affectedDocuments: [userDoc.documentType],
        resolutionRequired: true
      });
      score -= 15;
    }
  });
  
  return { score: Math.max(0, score), violations, warnings };
}

/**
 * Validates consent compliance
 */
export function validateConsentCompliance(
  userId: string,
  consentRecords: ConsentTracking[],
  requiredConsents: ConsentType[] = [
    ConsentType.TERMS_AND_CONDITIONS,
    ConsentType.PRIVACY_POLICY,
    ConsentType.DATA_PROCESSING
  ]
): {
  isCompliant: boolean;
  missingConsents: ConsentType[];
  expiredConsents: ConsentType[];
  validConsents: ConsentType[];
} {
  const userConsents = consentRecords.filter(consent => consent.userId === userId);
  const missingConsents: ConsentType[] = [];
  const expiredConsents: ConsentType[] = [];
  const validConsents: ConsentType[] = [];
  
  requiredConsents.forEach(requiredType => {
    // Find the most recent consent record for the required type
    const latestConsent = userConsents
      .filter(c => c.consentType === requiredType)
      .sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime())[0];
    
    if (!latestConsent) {
      missingConsents.push(requiredType);
    } else if (latestConsent.granted && !latestConsent.withdrawnAt) {
      validConsents.push(requiredType);
    } else {
      // Consent was either not granted initially or was withdrawn
      expiredConsents.push(requiredType);
    }
  });
  
  const isCompliant = missingConsents.length === 0 && expiredConsents.length === 0;
  
  return {
    isCompliant,
    missingConsents,
    expiredConsents,
    validConsents
  };
}