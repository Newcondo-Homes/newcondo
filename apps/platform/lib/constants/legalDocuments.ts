export const LEGAL_DOCUMENT_TYPES = {
  // Property-related legal documents
  OWNERSHIP_DOCUMENT: 'OWNERSHIP_DOCUMENT',
  CONSENT_DOCUMENT: 'CONSENT_DOCUMENT', 
  UNDERTAKING_DOCUMENT: 'UNDERTAKING_DOCUMENT',
  
  // Agent-specific documents
  AGENT_PERMISSION: 'AGENT_PERMISSION',
  AGENT_AUTHORIZATION: 'AGENT_AUTHORIZATION',
  
  // Business documents
  BUSINESS_REGISTRATION: 'BUSINESS_REGISTRATION',
  TAX_CERTIFICATE: 'TAX_CERTIFICATE',
  
  // Legal compliance
  TERMS_ACCEPTANCE: 'TERMS_ACCEPTANCE',
  PRIVACY_POLICY_ACCEPTANCE: 'PRIVACY_POLICY_ACCEPTANCE',
  DATA_PROCESSING_CONSENT: 'DATA_PROCESSING_CONSENT'
} as const;

export const DOCUMENT_TEMPLATES = {
  OWNERSHIP_PROOF: {
    id: 'ownership_proof_template',
    name: 'Proof of Ownership Template',
    description: 'Template for property ownership verification',
    requiredFields: ['propertyAddress', 'ownerName', 'documentNumber', 'issuingAuthority'],
    acceptedFormats: ['PDF', 'JPG', 'PNG'],
    maxSize: '5MB'
  },
  CONSENT_LETTER: {
    id: 'consent_letter_template',
    name: 'Consent Letter Template',
    description: 'Template for property owner consent to agent listing',
    requiredFields: ['ownerName', 'agentName', 'propertyAddress', 'duration', 'terms'],
    acceptedFormats: ['PDF'],
    maxSize: '2MB'
  },
  UNDERTAKING_FORM: {
    id: 'undertaking_form_template',
    name: 'Legal Undertaking Form',
    description: 'Template for legal undertaking by property owners/agents',
    requiredFields: ['declarantName', 'propertyDetails', 'undertakingText', 'signature'],
    acceptedFormats: ['PDF'],
    maxSize: '3MB'
  },
  AGENT_PERMISSION: {
    id: 'agent_permission_template',
    name: 'Agent Permission Form',
    description: 'Template for property owner permission to agent',
    requiredFields: ['ownerName', 'agentName', 'licenseNumber', 'propertyAddress', 'permissions'],
    acceptedFormats: ['PDF'],
    maxSize: '3MB'
  }
} as const;

export const LEGAL_REQUIREMENTS = {
  PROPERTY_OWNER: {
    required: [
      LEGAL_DOCUMENT_TYPES.OWNERSHIP_DOCUMENT,
      LEGAL_DOCUMENT_TYPES.UNDERTAKING_DOCUMENT,
      LEGAL_DOCUMENT_TYPES.TERMS_ACCEPTANCE,
      LEGAL_DOCUMENT_TYPES.PRIVACY_POLICY_ACCEPTANCE
    ],
    conditional: {
      hasAgent: [LEGAL_DOCUMENT_TYPES.CONSENT_DOCUMENT],
      isB2B: [LEGAL_DOCUMENT_TYPES.BUSINESS_REGISTRATION, LEGAL_DOCUMENT_TYPES.TAX_CERTIFICATE]
    }
  },
  AGENT: {
    required: [
      LEGAL_DOCUMENT_TYPES.AGENT_PERMISSION,
      LEGAL_DOCUMENT_TYPES.UNDERTAKING_DOCUMENT,
      LEGAL_DOCUMENT_TYPES.TERMS_ACCEPTANCE,
      LEGAL_DOCUMENT_TYPES.PRIVACY_POLICY_ACCEPTANCE
    ],
    conditional: {
      isB2B: [LEGAL_DOCUMENT_TYPES.BUSINESS_REGISTRATION]
    }
  },
  RENTER: {
    required: [
      LEGAL_DOCUMENT_TYPES.TERMS_ACCEPTANCE,
      LEGAL_DOCUMENT_TYPES.PRIVACY_POLICY_ACCEPTANCE,
      LEGAL_DOCUMENT_TYPES.DATA_PROCESSING_CONSENT
    ]
  }
} as const;

export const DIGITAL_SIGNATURE_CONFIG = {
  SIGNATURE_PAD: {
    width: 400,
    height: 200,
    backgroundColor: '#ffffff',
    penColor: '#000000',
    minWidth: 1,
    maxWidth: 2,
    velocityFilterWeight: 0.7,
    minDistance: 5
  },
  VALIDATION: {
    minStrokes: 3,
    minDuration: 2000, // 2 seconds
    maxFileSize: '1MB'
  }
} as const;

export const DOCUMENT_STATUS_LABELS = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  REQUIRES_UPDATE: 'Requires Update'
} as const;

export const DOCUMENT_UPLOAD_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ],
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
  compressionQuality: 0.8,
  maxDimensions: {
    width: 2048,
    height: 2048
  }
} as const;

export const COMPLIANCE_CHECKPOINTS = {
  DOCUMENT_UPLOAD: 'document_upload',
  SIGNATURE_COLLECTION: 'signature_collection',
  TERMS_ACCEPTANCE: 'terms_acceptance',
  PRIVACY_CONSENT: 'privacy_consent',
  ADMIN_VERIFICATION: 'admin_verification',
  LEGAL_REVIEW: 'legal_review'
} as const;

export const LEGAL_DOCUMENT_LABELS = {
  [LEGAL_DOCUMENT_TYPES.OWNERSHIP_DOCUMENT]: 'Proof of Ownership',
  [LEGAL_DOCUMENT_TYPES.CONSENT_DOCUMENT]: 'Owner Consent Letter',
  [LEGAL_DOCUMENT_TYPES.UNDERTAKING_DOCUMENT]: 'Legal Undertaking',
  [LEGAL_DOCUMENT_TYPES.AGENT_PERMISSION]: 'Agent Permission Form',
  [LEGAL_DOCUMENT_TYPES.AGENT_AUTHORIZATION]: 'Agent Authorization',
  [LEGAL_DOCUMENT_TYPES.BUSINESS_REGISTRATION]: 'Business Registration',
  [LEGAL_DOCUMENT_TYPES.TAX_CERTIFICATE]: 'Tax Certificate',
  [LEGAL_DOCUMENT_TYPES.TERMS_ACCEPTANCE]: 'Terms & Conditions',
  [LEGAL_DOCUMENT_TYPES.PRIVACY_POLICY_ACCEPTANCE]: 'Privacy Policy',
  [LEGAL_DOCUMENT_TYPES.DATA_PROCESSING_CONSENT]: 'Data Processing Consent'
} as const;

export const DOCUMENT_EXPIRY_PERIODS = {
  [LEGAL_DOCUMENT_TYPES.OWNERSHIP_DOCUMENT]: null, // No expiry
  [LEGAL_DOCUMENT_TYPES.CONSENT_DOCUMENT]: 365 * 24 * 60 * 60 * 1000, // 1 year
  [LEGAL_DOCUMENT_TYPES.UNDERTAKING_DOCUMENT]: null, // No expiry
  [LEGAL_DOCUMENT_TYPES.AGENT_PERMISSION]: 365 * 24 * 60 * 60 * 1000, // 1 year
  [LEGAL_DOCUMENT_TYPES.BUSINESS_REGISTRATION]: 365 * 24 * 60 * 60 * 1000, // 1 year
  [LEGAL_DOCUMENT_TYPES.TAX_CERTIFICATE]: 365 * 24 * 60 * 60 * 1000, // 1 year
  [LEGAL_DOCUMENT_TYPES.TERMS_ACCEPTANCE]: null, // No expiry
  [LEGAL_DOCUMENT_TYPES.PRIVACY_POLICY_ACCEPTANCE]: null, // No expiry
  [LEGAL_DOCUMENT_TYPES.DATA_PROCESSING_CONSENT]: 2 * 365 * 24 * 60 * 60 * 1000 // 2 years
} as const;

export type LegalDocumentType = keyof typeof LEGAL_DOCUMENT_TYPES;
export type DocumentTemplate = keyof typeof DOCUMENT_TEMPLATES;
export type ComplianceCheckpoint = keyof typeof COMPLIANCE_CHECKPOINTS;