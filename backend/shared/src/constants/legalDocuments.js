"use strict";
// backend/shared/src/constants/legalDocuments.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGAL_TEMPLATES = exports.DIGITAL_SIGNATURE_CONFIG = exports.VERIFICATION_WORKFLOW = exports.LEGAL_DOCUMENT_SUCCESS = exports.LEGAL_DOCUMENT_ERRORS = exports.VALIDATION_RULES = exports.COMPLIANCE_REQUIREMENTS = exports.LEGAL_DOCUMENT_CONFIG = exports.DOCUMENT_SIDE = exports.DOCUMENT_STATUS = exports.LEGAL_DOCUMENT_TYPES = void 0;
exports.LEGAL_DOCUMENT_TYPES = {
    // Identity Documents
    NIN: 'NIN',
    BVN: 'BVN',
    PASSPORT: 'PASSPORT',
    VOTERS_CARD: 'VOTERS_CARD',
    DRIVERS_LICENSE: 'DRIVERS_LICENSE',
    // Verification Documents
    SELFIE: 'SELFIE',
    // Property Legal Documents
    OWNERSHIP_DOCUMENT: 'OWNERSHIP_DOCUMENT',
    CONSENT_DOCUMENT: 'CONSENT_DOCUMENT',
    UNDERTAKING_DOCUMENT: 'UNDERTAKING_DOCUMENT',
    // Business Documents
    BUSINESS_REGISTRATION: 'BUSINESS_REGISTRATION',
    TAX_CERTIFICATE: 'TAX_CERTIFICATE',
    // Utility Documents
    UTILITY_BILL: 'UTILITY_BILL',
    BANK_STATEMENT: 'BANK_STATEMENT',
    // Other
    OTHER: 'OTHER'
};
exports.DOCUMENT_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    EXPIRED: 'EXPIRED'
};
exports.DOCUMENT_SIDE = {
    FRONT: 'FRONT',
    BACK: 'BACK',
    SINGLE: 'SINGLE'
};
// Legal document requirements and configurations
exports.LEGAL_DOCUMENT_CONFIG = {
    [exports.LEGAL_DOCUMENT_TYPES.OWNERSHIP_DOCUMENT]: {
        name: 'Certificate of Occupancy / Deed of Assignment',
        description: 'Legal proof of property ownership',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        requiresUpload: true,
        requiresNumber: false,
        hasExpiry: false,
        adminVerificationRequired: true
    },
    [exports.LEGAL_DOCUMENT_TYPES.CONSENT_DOCUMENT]: {
        name: 'Property Owner Consent Form',
        description: 'Consent from property owner for agent listing',
        required: false, // Only required for agent listings
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        requiresUpload: true,
        requiresNumber: false,
        hasExpiry: true,
        expiryMonths: 12, // 1 year validity
        adminVerificationRequired: true
    },
    [exports.LEGAL_DOCUMENT_TYPES.UNDERTAKING_DOCUMENT]: {
        name: 'Legal Undertaking Document',
        description: 'Signed legal undertaking form',
        required: true,
        acceptedFormats: ['pdf'],
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        requiresUpload: true,
        requiresNumber: false,
        hasExpiry: false,
        adminVerificationRequired: true
    },
    [exports.LEGAL_DOCUMENT_TYPES.BUSINESS_REGISTRATION]: {
        name: 'CAC Business Registration',
        description: 'Certificate of Incorporation from CAC',
        required: false, // Only for B2B customers
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        requiresUpload: true,
        requiresNumber: true,
        hasExpiry: false,
        adminVerificationRequired: true
    },
    [exports.LEGAL_DOCUMENT_TYPES.NIN]: {
        name: 'National Identification Number',
        description: 'Nigerian National ID',
        required: true,
        acceptedFormats: ['jpg', 'jpeg', 'png'],
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        requiresUpload: false, // Can be ID-only or file upload
        requiresNumber: true,
        hasExpiry: false,
        adminVerificationRequired: true
    }
};
// Legal compliance requirements
exports.COMPLIANCE_REQUIREMENTS = {
    TERMS_AND_CONDITIONS: {
        name: 'Terms and Conditions',
        version: '1.0',
        required: true,
        url: '/legal/terms-and-conditions',
        lastUpdated: '2024-01-01'
    },
    PRIVACY_POLICY: {
        name: 'Privacy Policy',
        version: '1.0',
        required: true,
        url: '/legal/privacy-policy',
        lastUpdated: '2024-01-01'
    },
    DATA_PROCESSING_CONSENT: {
        name: 'Data Processing Consent',
        version: '1.0',
        required: true,
        description: 'Consent for processing personal data'
    },
    MARKETING_CONSENT: {
        name: 'Marketing Communications Consent',
        version: '1.0',
        required: false,
        description: 'Consent for marketing communications'
    }
};
// Document validation rules
exports.VALIDATION_RULES = {
    FILE_SIZE: {
        MIN_BYTES: 1024, // 1KB minimum
        MAX_BYTES: 10 * 1024 * 1024, // 10MB maximum
    },
    SUPPORTED_FORMATS: {
        IMAGES: ['jpg', 'jpeg', 'png', 'webp'],
        DOCUMENTS: ['pdf'],
        ALL: ['jpg', 'jpeg', 'png', 'webp', 'pdf']
    },
    DOCUMENT_NUMBER: {
        NIN: {
            pattern: /^\d{11}$/,
            message: 'NIN must be exactly 11 digits'
        },
        BVN: {
            pattern: /^\d{11}$/,
            message: 'BVN must be exactly 11 digits'
        },
        PASSPORT: {
            pattern: /^[A-Z]\d{8}$/,
            message: 'Passport number must start with a letter followed by 8 digits'
        }
    }
};
// Error messages
exports.LEGAL_DOCUMENT_ERRORS = {
    FILE_TOO_LARGE: 'File size exceeds maximum allowed limit',
    INVALID_FORMAT: 'File format not supported',
    UPLOAD_FAILED: 'Document upload failed. Please try again',
    VALIDATION_FAILED: 'Document validation failed',
    REQUIRED_DOCUMENT_MISSING: 'Required document is missing',
    INVALID_DOCUMENT_NUMBER: 'Invalid document number format',
    DOCUMENT_EXPIRED: 'Document has expired',
    VERIFICATION_PENDING: 'Document verification is pending',
    VERIFICATION_REJECTED: 'Document verification was rejected'
};
// Success messages
exports.LEGAL_DOCUMENT_SUCCESS = {
    UPLOAD_SUCCESS: 'Document uploaded successfully',
    VERIFICATION_SUBMITTED: 'Document submitted for verification',
    COMPLIANCE_UPDATED: 'Compliance status updated successfully',
    TERMS_ACCEPTED: 'Terms and conditions accepted',
    PRIVACY_ACCEPTED: 'Privacy policy accepted'
};
// Admin verification workflow
exports.VERIFICATION_WORKFLOW = {
    STEPS: [
        'DOCUMENT_UPLOADED',
        'ADMIN_REVIEW',
        'VERIFICATION_COMPLETE'
    ],
    REVIEW_TIMEFRAME: {
        STANDARD: 24, // hours
        PRIORITY: 2, // hours for priority documents
        MAXIMUM: 72 // hours maximum review time
    }
};
// Digital signature configuration
exports.DIGITAL_SIGNATURE_CONFIG = {
    ENABLED: true,
    PROVIDER: 'internal', // or 'docusign', 'hellosign'
    REQUIRED_FOR: [
        exports.LEGAL_DOCUMENT_TYPES.UNDERTAKING_DOCUMENT,
        exports.LEGAL_DOCUMENT_TYPES.CONSENT_DOCUMENT
    ]
};
// Legal document templates
exports.LEGAL_TEMPLATES = {
    UNDERTAKING_DOCUMENT: {
        name: 'Legal Undertaking Form',
        templateUrl: '/templates/legal-undertaking.pdf',
        fillableFields: [
            'fullName',
            'address',
            'phoneNumber',
            'email',
            'propertyAddress',
            'date',
            'signature'
        ]
    },
    CONSENT_DOCUMENT: {
        name: 'Property Owner Consent Form',
        templateUrl: '/templates/owner-consent.pdf',
        fillableFields: [
            'ownerName',
            'agentName',
            'propertyAddress',
            'consentPeriod',
            'date',
            'ownerSignature',
            'agentSignature'
        ]
    }
};
//# sourceMappingURL=legalDocuments.js.map