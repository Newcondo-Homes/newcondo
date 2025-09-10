import { DocumentType, DocumentStatus, DocumentSide } from '@newcondo/db';

export const DOCUMENT_TYPE_CONFIG = {
  // Identity Documents
  NIN: {
    label: 'National Identification Number',
    description: 'Nigerian National Identification Number',
    category: 'identity',
    requiresFile: false,
    requiresNumber: true,
    hasSides: false,
    maxPages: 1,
    validationPattern: /^[0-9]{11}$/,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    expiryPeriod: null,
    priority: 'high',
    verificationRequired: true
  },
  BVN: {
    label: 'Bank Verification Number',
    description: 'Nigerian Bank Verification Number',
    category: 'identity',
    requiresFile: false,
    requiresNumber: true,
    hasSides: false,
    maxPages: 1,
    validationPattern: /^[0-9]{11}$/,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    expiryPeriod: null,
    priority: 'medium',
    verificationRequired: true
  },
  PASSPORT: {
    label: 'International Passport',
    description: 'Nigerian or International Passport',
    category: 'identity',
    requiresFile: true,
    requiresNumber: true,
    hasSides: false,
    maxPages: 2, // Bio page and visa pages if needed
    validationPattern: /^[A-Z0-9]{6,9}$/,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    expiryPeriod: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
    priority: 'high',
    verificationRequired: true
  },
  VOTERS_CARD: {
    label: "Voter's Card",
    description: 'Permanent Voter\'s Card (PVC)',
    category: 'identity',
    requiresFile: true,
    requiresNumber: true,
    hasSides: true,
    maxPages: 1,
    validationPattern: /^[A-Z0-9]{18}$/,
    acceptedFormats: ['image/jpeg', 'image/png'],
    maxFileSize: 3 * 1024 * 1024, // 3MB
    expiryPeriod: null,
    priority: 'medium',
    verificationRequired: true
  },
  DRIVERS_LICENSE: {
    label: "Driver's License",
    description: 'Nigerian Driver\'s License',
    category: 'identity',
    requiresFile: true,
    requiresNumber: true,
    hasSides: true,
    maxPages: 1,
    validationPattern: /^[A-Z]{3}[0-9]{8}[A-Z]{2}$/,
    acceptedFormats: ['image/jpeg', 'image/png'],
    maxFileSize: 3 * 1024 * 1024, // 3MB
    expiryPeriod: 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
    priority: 'low',
    verificationRequired: true
  },

  // Selfie
  SELFIE: {
    label: 'Selfie Photo',
    description: 'Clear selfie photo for identity verification',
    category: 'identity',
    requiresFile: true,
    requiresNumber: false,
    hasSides: false,
    maxPages: 1,
    validationPattern: null,
    acceptedFormats: ['image/jpeg', 'image/png'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    expiryPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
    priority: 'high',
    verificationRequired: true
  },

  // Property Documents
  OWNERSHIP_DOCUMENT: {
    label: 'Proof of Ownership',
    description: 'Certificate of Occupancy, Deed of Assignment, or other ownership proof',
    category: 'property',
    requiresFile: true,
    requiresNumber: false,
    hasSides: false,
    maxPages: 10,
    validationPattern: null,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    expiryPeriod: null,
    priority: 'critical',
    verificationRequired: true
  },
  CONSENT_DOCUMENT: {
    label: 'Owner Consent Letter',
    description: 'Consent from property owner for agent to list property',
    category: 'property',
    requiresFile: true,
    requiresNumber: false,
    hasSides: false,
    maxPages: 5,
    validationPattern: null,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    expiryPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
    priority: 'high',
    verificationRequired: true
  },
  UNDERTAKING_DOCUMENT: {
    label: 'Legal Undertaking',
    description: 'Signed legal undertaking form',
    category: 'legal',
    requiresFile: true,
    requiresNumber: false,
    hasSides: false,
    maxPages: 3,
    validationPattern: null,
    acceptedFormats: ['application/pdf'],
    maxFileSize: 3 * 1024 * 1024, // 3MB
    expiryPeriod: null,
    priority: 'critical',
    verificationRequired: true
  },

  // Business Documents
  BUSINESS_REGISTRATION: {
    label: 'Business Registration',
    description: 'Certificate of Incorporation or Business Registration',
    category: 'business',
    requiresFile: true,
    requiresNumber: true,
    hasSides: false,
    maxPages: 3,
    validationPattern: /^RC[0-9]{6,8}$/,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    expiryPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year (annual filing)
    priority: 'high',
    verificationRequired: true
  },
  TAX_CERTIFICATE: {
    label: 'Tax Clearance Certificate',
    description: 'Current Tax Clearance Certificate',
    category: 'business',
    requiresFile: true,
    requiresNumber: true,
    hasSides: false,
    maxPages: 2,
    validationPattern: null,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 3 * 1024 * 1024, // 3MB
    expiryPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
    priority: 'medium',
    verificationRequired: true
  },

  // Utility Documents
  UTILITY_BILL: {
    label: 'Utility Bill',
    description: 'Recent utility bill for address verification',
    category: 'utility',
    requiresFile: true,
    requiresNumber: false,
    hasSides: false,
    maxPages: 3,
    validationPattern: null,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 3 * 1024 * 1024, // 3MB
    expiryPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
    priority: 'medium',
    verificationRequired: false
  },
  BANK_STATEMENT: {
    label: 'Bank Statement',
    description: 'Recent bank statement for financial verification',
    category: 'financial',
    requiresFile: true,
    requiresNumber: false,
    hasSides: false,
    maxPages: 10,
    validationPattern: null,
    acceptedFormats: ['application/pdf'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    expiryPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
    priority: 'low',
    verificationRequired: false
  },

  // Other
  OTHER: {
    label: 'Other Document',
    description: 'Other supporting documents',
    category: 'other',
    requiresFile: true,
    requiresNumber: false,
    hasSides: false,
    maxPages: 5,
    validationPattern: null,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    expiryPeriod: null,
    priority: 'low',
    verificationRequired: false
  }
} as const;

export const DOCUMENT_CATEGORIES = {
  identity: {
    label: 'Identity Documents',
    description: 'Documents for identity verification',
    icon: 'id-card',
    color: 'blue',
    priority: 1
  },
  property: {
    label: 'Property Documents',
    description: 'Documents related to property ownership',
    icon: 'building',
    color: 'green',
    priority: 2
  },
  legal: {
    label: 'Legal Documents',
    description: 'Legal undertakings and agreements',
    icon: 'scale',
    color: 'purple',
    priority: 3
  },
  business: {
    label: 'Business Documents',
    description: 'Business registration and tax documents',
    icon: 'briefcase',
    color: 'orange',
    priority: 4
  },
  financial: {
    label: 'Financial Documents',
    description: 'Documents for financial verification',
    icon: 'dollar-sign',
    color: 'teal',
    priority: 5
  },
  utility: {
    label: 'Utility Documents',
    description: 'Documents for address verification',
    icon: 'lightbulb',
    color: 'yellow',
    priority: 6
  },
  other: {
    label: 'Other Documents',
    description: 'Miscellaneous supporting documents',
    icon: 'file',
    color: 'gray',
    priority: 7
  },
} as const;

// Helper function to get config by document type
export function getDocumentTypeConfig(type: DocumentType) {
  return DOCUMENT_TYPE_CONFIG[type];
}

// Helper function to get category by document type
export function getDocumentCategory(type: DocumentType) {
  const categoryKey = DOCUMENT_TYPE_CONFIG[type]?.category;
  return categoryKey ? DOCUMENT_CATEGORIES[categoryKey] : null;
}