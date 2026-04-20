import { z } from 'zod';
import type  { DocumentType, DocumentStatus, Role, UserType } from '@newcondo/db';

const RoleEnum = z.enum(['OWNER', 'AGENT', 'RENTER', 'ADMIN']);
const UserTypeEnum = z.enum(['LANDLORD', 'PROPERTY_MANAGER', 'AGENT', 'RENTER', 'ADMIN']);
const DocumentTypeEnum = z.enum([
  'NIN', 'BVN', 'PASSPORT', 'VOTERS_CARD', 'DRIVERS_LICENSE',
  'SELFIE', 'OWNERSHIP_DOCUMENT', 'CONSENT_DOCUMENT', 'UNDERTAKING_DOCUMENT',
  'BUSINESS_REGISTRATION', 'TAX_CERTIFICATE', 'UTILITY_BILL', 'BANK_STATEMENT', 'OTHER'
]);
const DocumentStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']);

// Terms and conditions acceptance validation
export const termsAcceptanceSchema = z.object({
  userId: z.string().cuid(),
  termsVersion: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format'),
  acceptedAt: z.date(),
  ipAddress: z.string().ip(),
  userAgent: z.string().max(500),
  digitalSignature: z.string().min(1, 'Digital signature is required'),
  hasReadTerms: z.boolean().refine(val => val === true, {
    message: 'You must confirm that you have read the terms and conditions'
  }),
  acceptsTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  }),
}); 

// Privacy policy acceptance validation  
export const privacyPolicyAcceptanceSchema = z.object({
  userId: z.string().cuid(),
  policyVersion: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format'),
  acceptedAt: z.date(),
  ipAddress: z.string().ip(),
  userAgent: z.string().max(500),
  acceptsDataProcessing: z.boolean().refine(val => val === true, {
    message: 'You must consent to data processing'
  }),
  acceptsDataStorage: z.boolean().refine(val => val === true, {
    message: 'You must consent to data storage'
  }),
  acceptsMarketingEmails: z.boolean().default(false),
  acceptsSmsNotifications: z.boolean().default(false),
  acceptsAnalytics: z.boolean().default(false),
});

// GDPR compliance validation
export const gdprComplianceSchema = z.object({
  userId: z.string().cuid(),
  dataProcessingConsent: z.boolean().refine(val => val === true, {
    message: 'Data processing consent is required'
  }),
  dataStorageConsent: z.boolean().refine(val => val === true, {
    message: 'Data storage consent is required'
  }),
  dataTransferConsent: z.boolean().default(false),
  marketingConsent: z.boolean().default(false),
  profilingConsent: z.boolean().default(false),
  rightToWithdraw: z.boolean().default(true),
  rightToDelete: z.boolean().default(true),
  rightToAccess: z.boolean().default(true),
  rightToPortability: z.boolean().default(true),
  consentDate: z.date(),
  withdrawalDate: z.date().optional(),
  legalBasis: z.enum([
    'CONSENT',
    'CONTRACT',
    'LEGAL_OBLIGATION',
    'VITAL_INTERESTS',
    'PUBLIC_TASK',
    'LEGITIMATE_INTERESTS'
  ]),
});

// KYC (Know Your Customer) compliance validation
export const kycComplianceSchema = z.object({
  userId: z.string().cuid(),
  kycLevel: z.enum(['BASIC', 'ENHANCED', 'PREMIUM']),
  requiredDocuments: z.array(DocumentTypeEnum),
  completedDocuments: z.array(z.string().cuid()),
  verificationStatus: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  sanctionsCheck: z.boolean().default(false),
  pepCheck: z.boolean().default(false), // Politically Exposed Person
  adverseMediaCheck: z.boolean().default(false),
  verifiedBy: z.string().cuid().optional(),
  verifiedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  notes: z.string().max(1000).optional(),
});

// AML (Anti-Money Laundering) compliance validation
export const amlComplianceSchema = z.object({
  userId: z.string().cuid(),
  transactionId: z.string().cuid().optional(),
  propertyId: z.string().cuid().optional(),
  amount: z.number().min(0),
  currency: z.string().length(3).default('NGN'),
  sourceOfFunds: z.enum([
    'SALARY',
    'BUSINESS_INCOME',
    'INVESTMENT_RETURNS',
    'INHERITANCE',
    'GIFT',
    'LOAN',
    'OTHER'
  ]),
  sourceDocumentation: z.array(z.string().cuid()).optional(),
  riskScore: z.number().min(0).max(100),
  flaggedReasons: z.array(z.string()).default([]),
  isHighRisk: z.boolean().default(false),
  requiresEnhancedDueDiligence: z.boolean().default(false),
  reviewedBy: z.string().cuid().optional(),
  reviewedAt: z.date().optional(),
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_REVIEW']),
  notes: z.string().max(2000).optional(),
});

// Age verification compliance
export const ageVerificationSchema = z.object({
  userId: z.string().cuid(),
  dateOfBirth: z.date().refine(date => {
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 18;
  }, {
    message: 'User must be at least 18 years old'
  }),
  verificationMethod: z.enum(['DOCUMENT', 'DATABASE_CHECK', 'MANUAL_REVIEW']),
  verificationDocument: z.string().cuid().optional(),
  isVerified: z.boolean().default(false),
  verifiedAt: z.date().optional(),
  verifiedBy: z.string().cuid().optional(),
});

// Legal capacity verification
export const legalCapacitySchema = z.object({
  userId: z.string().cuid(),
  hasLegalCapacity: z.boolean().refine(val => val === true, {
    message: 'User must have legal capacity to enter into contracts'
  }),
  guardianshipDetails: z.object({
    hasGuardian: z.boolean(),
    guardianName: z.string().optional(),
    guardianContact: z.string().optional(),
    guardianDocument: z.string().cuid().optional(),
  }).optional(),
  powerOfAttorney: z.object({
    hasPowerOfAttorney: z.boolean(),
    attorneyName: z.string().optional(),
    attorneyContact: z.string().optional(),
    attorneyDocument: z.string().cuid().optional(),
    scope: z.string().optional(),
  }).optional(),
  mentalCapacityDeclaration: z.boolean().default(true),
  witnessName: z.string().optional(),
  witnessSignature: z.string().optional(),
});

// Property ownership verification
export const ownershipVerificationSchema = z.object({
  propertyId: z.string().cuid(),
  ownerId: z.string().cuid(),
  ownershipType: z.enum([
    'SOLE_OWNERSHIP',
    'JOINT_OWNERSHIP',
    'CORPORATE_OWNERSHIP',
    'TRUST_OWNERSHIP',
    'LEASEHOLD'
  ]),
  ownershipDocument: z.string().cuid(),
  titleDeedNumber: z.string().max(100).optional(),
  registrationNumber: z.string().max(100).optional(),
  acquisitionDate: z.date().optional(),
  mortgageDetails: z.object({
    hasMortgage: z.boolean(),
    mortgageeBank: z.string().optional(),
    mortgageAmount: z.number().optional(),
    mortgageConsent: z.boolean().optional(),
  }).optional(),
  coOwners: z.array(z.object({
    name: z.string(),
    share: z.number().min(0).max(100),
    signature: z.string().optional(),
  })).optional(),
  verifiedBy: z.string().cuid().optional(),
  verifiedAt: z.date().optional(),
});

// Regulatory compliance check
export const regulatoryComplianceSchema = z.object({
  entityType: z.enum(['USER', 'PROPERTY', 'TRANSACTION', 'AGENT']),
  entityId: z.string().cuid(),
  jurisdiction: z.string().default('Nigeria'),
  regulations: z.array(z.object({
    name: z.string(),
    version: z.string(),
    mandatory: z.boolean(),
    compliant: z.boolean(),
    evidence: z.array(z.string().cuid()).optional(),
    notes: z.string().optional(),
  })),
  overallCompliance: z.boolean(),
  lastChecked: z.date(),
  nextCheckDue: z.date().optional(),
  checkedBy: z.string().cuid(),
  exemptions: z.array(z.object({
    regulation: z.string(),
    reason: z.string(),
    approvedBy: z.string().cuid(),
    validUntil: z.date().optional(),
  })).optional(),
});

// Audit trail compliance
export const auditTrailSchema = z.object({
  entityType: z.string(),
  entityId: z.string().cuid(),
  action: z.string(),
  performedBy: z.string().cuid(),
  performedAt: z.date(),
  ipAddress: z.string().ip(),
  userAgent: z.string().max(500),
  changes: z.record(z.any()).optional(),
  reason: z.string().max(500).optional(),
  complianceImpact: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']),
  requiresApproval: z.boolean().default(false),
  approvedBy: z.string().cuid().optional(),
  approvedAt: z.date().optional(),
});

// Digital signature compliance
export const digitalSignatureComplianceSchema = z.object({
  documentId: z.string().cuid(),
  signerId: z.string().cuid(),
  signatureType: z.enum(['SIMPLE', 'ADVANCED', 'QUALIFIED']),
  signatureMethod: z.enum([
    'CLICK_TO_SIGN',
    'TYPED_NAME',
    'DRAWN_SIGNATURE',
    'BIO_METRIC',
    'CRYPTO_KEY'
  ]),
  signatureTimestamp: z.date(),
  ipAddress: z.string().ip(),
  userAgent: z.string().max(500),
  location: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
  validationStatus: z.enum(['VALID', 'INVALID', 'PENDING']),
  validationDetails: z.string().optional(),
  certChain: z.array(z.string()).optional(),
});

// Document verification check
export const documentVerificationSchema = z.object({
  documentId: z.string().cuid(),
  reviewerId: z.string().cuid(),
  verificationMethod: z.enum(['MANUAL', 'AUTOMATED', 'HYBRID']),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED']),
  rejectionReason: z.string().max(500).optional(),
  verifiedAt: z.date(),
  expiresAt: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

// User compliance profile
export const userComplianceProfileSchema = z.object({
  userId: z.string().cuid(),
  role: RoleEnum,
  userType: UserTypeEnum,
  overallStatus: z.enum(['COMPLIANT', 'PARTIAL', 'NON_COMPLIANT', 'PENDING']),
  kyc: kycComplianceSchema.optional(),
  aml: amlComplianceSchema.optional(),
  ageVerification: ageVerificationSchema.optional(),
  legalCapacity: legalCapacitySchema.optional(),
  termsAcceptance: termsAcceptanceSchema.optional(),
  privacyPolicyAcceptance: privacyPolicyAcceptanceSchema.optional(),
  lastUpdated: z.date(),
});

// Property compliance profile
export const propertyComplianceProfileSchema = z.object({
  propertyId: z.string().cuid(),
  ownerId: z.string().cuid(),
  ownership: ownershipVerificationSchema,
  isListingCompliant: z.boolean(),
  isRentalCompliant: z.boolean(),
  requiredDocuments: z.array(DocumentTypeEnum),
  uploadedDocuments: z.array(z.string().cuid()),
  documentCompliance: z.record(DocumentTypeEnum, z.enum(['COMPLIANT', 'PENDING', 'EXPIRED', 'REJECTED'])),
  lastUpdated: z.date(),
  notes: z.string().max(1000).optional(),
});

// Compliance audit log entry
export const complianceAuditLogSchema = z.object({
  id: z.string().cuid(),
  entityType: z.enum(['USER', 'PROPERTY', 'TRANSACTION']),
  entityId: z.string().cuid(),
  action: z.string(),
  result: z.enum(['SUCCESS', 'FAILURE', 'WARNING']),
  details: z.string().max(1000),
  timestamp: z.date(),
  triggeredBy: z.string().cuid(),
});

// Compliance report generation request
export const complianceReportRequestSchema = z.object({
  reportType: z.enum(['OVERALL_COMPLIANCE', 'USER_COMPLIANCE', 'PROPERTY_COMPLIANCE', 'DOCUMENT_STATUS']),
  scope: z.enum(['ALL_USERS', 'SINGLE_USER', 'ALL_PROPERTIES', 'SINGLE_PROPERTY']),
  userId: z.string().cuid().optional(),
  propertyId: z.string().cuid().optional(),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'CUSTOM']),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

// Compliance alert notification
export const complianceAlertSchema = z.object({
  alertId: z.string().cuid(),
  userId: z.string().cuid().optional(),
  propertyId: z.string().cuid().optional(),
  alertType: z.enum(['DOCUMENT_EXPIRY', 'COMPLIANCE_LEVEL_DROP', 'KYC_REQUIRED', 'AML_FLAGGED']),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  message: z.string().max(500),
  timestamp: z.date(),
  isDismissed: z.boolean().default(false),
  dismissedAt: z.date().optional(),
});