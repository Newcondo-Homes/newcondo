export const COMPLIANCE_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_REVIEW: 'PENDING_REVIEW',
  COMPLIANT: 'COMPLIANT',
  NON_COMPLIANT: 'NON_COMPLIANT',
  EXPIRED: 'EXPIRED',
  REQUIRES_UPDATE: 'REQUIRES_UPDATE'
} as const;

export const COMPLIANCE_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
} as const;

export const TERMS_AND_CONDITIONS = {
  VERSION: '1.0.0',
  EFFECTIVE_DATE: '2024-01-01',
  SECTIONS: {
    PLATFORM_USAGE: 'platform_usage',
    PROPERTY_LISTINGS: 'property_listings',
    PAYMENTS: 'payments',
    USER_CONDUCT: 'user_conduct',
    INTELLECTUAL_PROPERTY: 'intellectual_property',
    PRIVACY_DATA: 'privacy_data',
    DISPUTE_RESOLUTION: 'dispute_resolution',
    TERMINATION: 'termination',
    LIABILITY: 'liability',
    GOVERNING_LAW: 'governing_law'
  },
  ACCEPTANCE_TYPES: {
    INITIAL_SIGNUP: 'initial_signup',
    PROPERTY_LISTING: 'property_listing',
    PAYMENT_PROCESSING: 'payment_processing',
    AGENT_REGISTRATION: 'agent_registration',
    UPDATE_ACCEPTANCE: 'update_acceptance'
  }
} as const;

export const PRIVACY_POLICY = {
  VERSION: '1.0.0',
  EFFECTIVE_DATE: '2024-01-01',
  CONSENT_TYPES: {
    DATA_COLLECTION: 'data_collection',
    DATA_PROCESSING: 'data_processing',
    DATA_SHARING: 'data_sharing',
    MARKETING_COMMUNICATIONS: 'marketing_communications',
    ANALYTICS_TRACKING: 'analytics_tracking',
    LOCATION_SERVICES: 'location_services',
    COOKIE_USAGE: 'cookie_usage'
  },
  DATA_CATEGORIES: {
    PERSONAL_INFO: 'personal_info',
    CONTACT_INFO: 'contact_info',
    FINANCIAL_INFO: 'financial_info',
    PROPERTY_INFO: 'property_info',
    USAGE_DATA: 'usage_data',
    DEVICE_INFO: 'device_info',
    LOCATION_DATA: 'location_data'
  },
  RETENTION_PERIODS: {
    ACTIVE_USER: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
    INACTIVE_USER: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
    PAYMENT_DATA: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years (legal requirement)
    PROPERTY_LISTINGS: 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
    SUPPORT_TICKETS: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
    LEGAL_DOCUMENTS: null // Permanent retention
  }
} as const;

export const GDPR_COMPLIANCE = {
  LAWFUL_BASIS: {
    CONSENT: 'consent',
    CONTRACT: 'contract',
    LEGAL_OBLIGATION: 'legal_obligation',
    VITAL_INTERESTS: 'vital_interests',
    PUBLIC_TASK: 'public_task',
    LEGITIMATE_INTERESTS: 'legitimate_interests'
  },
  USER_RIGHTS: {
    ACCESS: 'right_of_access',
    RECTIFICATION: 'right_of_rectification',
    ERASURE: 'right_to_erasure',
    RESTRICT_PROCESSING: 'right_to_restrict_processing',
    DATA_PORTABILITY: 'right_to_data_portability',
    OBJECT: 'right_to_object',
    AUTOMATED_DECISION_MAKING: 'rights_automated_decision_making'
  },
  PROCESSING_PURPOSES: {
    ACCOUNT_MANAGEMENT: 'account_management',
    SERVICE_PROVISION: 'service_provision',
    PAYMENT_PROCESSING: 'payment_processing',
    COMMUNICATION: 'communication',
    LEGAL_COMPLIANCE: 'legal_compliance',
    FRAUD_PREVENTION: 'fraud_prevention',
    ANALYTICS: 'analytics',
    MARKETING: 'marketing'
  }
} as const;

export const NIGERIAN_DATA_PROTECTION = {
  NDPR_VERSION: '2019',
  REGISTRATION_STATUS: 'REGISTERED',
  DATA_PROTECTION_OFFICER: {
    name: 'NewCondo Data Protection Officer',
    email: 'dpo@newcondo.com',
    phone: '+234-XXX-XXX-XXXX'
  },
  CONSENT_CATEGORIES: {
    EXPLICIT: 'explicit_consent',
    IMPLIED: 'implied_consent',
    OPT_IN: 'opt_in_consent',
    OPT_OUT: 'opt_out_consent'
  },
  BREACH_NOTIFICATION: {
    AUTHORITY_DEADLINE: 72 * 60 * 60 * 1000, // 72 hours
    INDIVIDUAL_DEADLINE: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
} as const;

export const COMPLIANCE_WORKFLOWS = {
  PROPERTY_LISTING: [
    'verify_ownership_documents',
    'check_consent_documents',
    'validate_undertaking',
    'review_agent_permissions',
    'confirm_terms_acceptance',
    'verify_privacy_consent',
    'admin_approval'
  ],
  USER_VERIFICATION: [
    'identity_verification',
    'document_upload',
    'compliance_check',
    'legal_review',
    'admin_approval'
  ],
  AGENT_ONBOARDING: [
    'license_verification',
    'permission_documents',
    'undertaking_signature',
    'terms_acceptance',
    'compliance_training',
    'admin_approval'
  ],
  DATA_PROCESSING: [
    'consent_collection',
    'purpose_specification',
    'data_minimization',
    'retention_policy',
    'security_measures',
    'breach_procedures'
  ]
} as const;

export const AUDIT_REQUIREMENTS = {
  DOCUMENT_AUDIT: {
    frequency: 'quarterly',
    scope: ['ownership_documents', 'consent_forms', 'undertakings'],
    retention: 5 * 365 * 24 * 60 * 60 * 1000 // 5 years
  },
  PRIVACY_AUDIT: {
    frequency: 'annually',
    scope: ['data_processing', 'consent_management', 'user_rights'],
    retention: 7 * 365 * 24 * 60 * 60 * 1000 // 7 years
  },
  COMPLIANCE_AUDIT: {
    frequency: 'semi_annually',
    scope: ['regulatory_compliance', 'policy_adherence', 'risk_assessment'],
    retention: 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
  }
} as const;

export const COMPLIANCE_METRICS = {
  DOCUMENT_COMPLETION_RATE: 'document_completion_rate',
  TERMS_ACCEPTANCE_RATE: 'terms_acceptance_rate',
  PRIVACY_CONSENT_RATE: 'privacy_consent_rate',
  COMPLIANCE_SCORE: 'compliance_score',
  VERIFICATION_TIME: 'verification_time',
  REJECTION_RATE: 'rejection_rate',
  EXPIRY_RATE: 'expiry_rate'
} as const;

export const LEGAL_NOTICES = {
  TERMS_UPDATE: {
    NOTICE_PERIOD: 30 * 24 * 60 * 60 * 1000, // 30 days
    COMMUNICATION_METHODS: ['email', 'in_app_notification', 'website_banner'],
    ACCEPTANCE_REQUIRED: true
  },
  PRIVACY_UPDATE: {
    NOTICE_PERIOD: 30 * 24 * 60 * 60 * 1000, // 30 days
    COMMUNICATION_METHODS: ['email', 'in_app_notification'],
    CONSENT_REQUIRED: true
  },
  SERVICE_CHANGES: {
    NOTICE_PERIOD: 14 * 24 * 60 * 60 * 1000, // 14 days
    COMMUNICATION_METHODS: ['email', 'dashboard_notification'],
    ACCEPTANCE_REQUIRED: false
  }
} as const;

export const COMPLIANCE_VALIDATION_RULES = {
  DOCUMENT_UPLOAD: {
    requiredFields: ['documentType', 'fileUrl', 'userId'],
    validationChecks: ['file_size', 'file_type', 'virus_scan', 'content_validation'],
    autoApprovalCriteria: ['verified_user', 'standard_format', 'clear_content']
  },
  SIGNATURE_VALIDATION: {
    requiredFields: ['signatureData', 'timestamp', 'ipAddress'],
    validationChecks: ['signature_complexity', 'signing_duration', 'device_consistency'],
    biometricFactors: ['pressure_points', 'velocity_patterns', 'timing_analysis']
  },
  CONSENT_TRACKING: {
    requiredFields: ['consentType', 'timestamp', 'userAgent', 'ipAddress'],
    trackingMethods: ['checkbox_interaction', 'scroll_behavior', 'time_spent'],
    evidenceCollection: ['form_data', 'interaction_logs', 'session_recording']
  }
} as const;

export const COMPLIANCE_ALERTS = {
  DOCUMENT_EXPIRY: {
    WARNING_PERIODS: [30, 14, 7, 1], // days before expiry
    NOTIFICATION_CHANNELS: ['email', 'sms', 'in_app'],
    AUTO_ACTIONS: ['disable_listing', 'flag_account', 'admin_notification']
  },
  MISSING_COMPLIANCE: {
    GRACE_PERIOD: 7 * 24 * 60 * 60 * 1000, // 7 days
    ESCALATION_LEVELS: ['warning', 'restriction', 'suspension'],
    AUTO_ACTIONS: ['email_reminder', 'account_flag', 'admin_review']
  },
  POLICY_UPDATES: {
    NOTIFICATION_SEQUENCE: ['announcement', 'reminder', 'final_notice'],
    INTERVALS: [30, 14, 3], // days between notifications
    ENFORCEMENT_DATE: 'policy_effective_date'
  }
} as const;

export type ComplianceStatus = keyof typeof COMPLIANCE_STATUS;
export type CompliancePriority = keyof typeof COMPLIANCE_PRIORITY;
export type ConsentType = keyof typeof PRIVACY_POLICY.CONSENT_TYPES;
export type UserRight = keyof typeof GDPR_COMPLIANCE.USER_RIGHTS;