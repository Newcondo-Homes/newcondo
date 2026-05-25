export declare const LEGAL_DOCUMENT_TYPES: {
    readonly NIN: "NIN";
    readonly BVN: "BVN";
    readonly PASSPORT: "PASSPORT";
    readonly VOTERS_CARD: "VOTERS_CARD";
    readonly DRIVERS_LICENSE: "DRIVERS_LICENSE";
    readonly SELFIE: "SELFIE";
    readonly OWNERSHIP_DOCUMENT: "OWNERSHIP_DOCUMENT";
    readonly CONSENT_DOCUMENT: "CONSENT_DOCUMENT";
    readonly UNDERTAKING_DOCUMENT: "UNDERTAKING_DOCUMENT";
    readonly BUSINESS_REGISTRATION: "BUSINESS_REGISTRATION";
    readonly TAX_CERTIFICATE: "TAX_CERTIFICATE";
    readonly UTILITY_BILL: "UTILITY_BILL";
    readonly BANK_STATEMENT: "BANK_STATEMENT";
    readonly OTHER: "OTHER";
};
export declare const DOCUMENT_STATUS: {
    readonly PENDING: "PENDING";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
    readonly EXPIRED: "EXPIRED";
};
export declare const DOCUMENT_SIDE: {
    readonly FRONT: "FRONT";
    readonly BACK: "BACK";
    readonly SINGLE: "SINGLE";
};
export declare const LEGAL_DOCUMENT_CONFIG: {
    OWNERSHIP_DOCUMENT: {
        name: string;
        description: string;
        required: boolean;
        acceptedFormats: string[];
        maxSizeBytes: number;
        requiresUpload: boolean;
        requiresNumber: boolean;
        hasExpiry: boolean;
        adminVerificationRequired: boolean;
    };
    CONSENT_DOCUMENT: {
        name: string;
        description: string;
        required: boolean;
        acceptedFormats: string[];
        maxSizeBytes: number;
        requiresUpload: boolean;
        requiresNumber: boolean;
        hasExpiry: boolean;
        expiryMonths: number;
        adminVerificationRequired: boolean;
    };
    UNDERTAKING_DOCUMENT: {
        name: string;
        description: string;
        required: boolean;
        acceptedFormats: string[];
        maxSizeBytes: number;
        requiresUpload: boolean;
        requiresNumber: boolean;
        hasExpiry: boolean;
        adminVerificationRequired: boolean;
    };
    BUSINESS_REGISTRATION: {
        name: string;
        description: string;
        required: boolean;
        acceptedFormats: string[];
        maxSizeBytes: number;
        requiresUpload: boolean;
        requiresNumber: boolean;
        hasExpiry: boolean;
        adminVerificationRequired: boolean;
    };
    NIN: {
        name: string;
        description: string;
        required: boolean;
        acceptedFormats: string[];
        maxSizeBytes: number;
        requiresUpload: boolean;
        requiresNumber: boolean;
        hasExpiry: boolean;
        adminVerificationRequired: boolean;
    };
};
export declare const COMPLIANCE_REQUIREMENTS: {
    TERMS_AND_CONDITIONS: {
        name: string;
        version: string;
        required: boolean;
        url: string;
        lastUpdated: string;
    };
    PRIVACY_POLICY: {
        name: string;
        version: string;
        required: boolean;
        url: string;
        lastUpdated: string;
    };
    DATA_PROCESSING_CONSENT: {
        name: string;
        version: string;
        required: boolean;
        description: string;
    };
    MARKETING_CONSENT: {
        name: string;
        version: string;
        required: boolean;
        description: string;
    };
};
export declare const VALIDATION_RULES: {
    FILE_SIZE: {
        MIN_BYTES: number;
        MAX_BYTES: number;
    };
    SUPPORTED_FORMATS: {
        IMAGES: string[];
        DOCUMENTS: string[];
        ALL: string[];
    };
    DOCUMENT_NUMBER: {
        NIN: {
            pattern: RegExp;
            message: string;
        };
        BVN: {
            pattern: RegExp;
            message: string;
        };
        PASSPORT: {
            pattern: RegExp;
            message: string;
        };
    };
};
export declare const LEGAL_DOCUMENT_ERRORS: {
    FILE_TOO_LARGE: string;
    INVALID_FORMAT: string;
    UPLOAD_FAILED: string;
    VALIDATION_FAILED: string;
    REQUIRED_DOCUMENT_MISSING: string;
    INVALID_DOCUMENT_NUMBER: string;
    DOCUMENT_EXPIRED: string;
    VERIFICATION_PENDING: string;
    VERIFICATION_REJECTED: string;
};
export declare const LEGAL_DOCUMENT_SUCCESS: {
    UPLOAD_SUCCESS: string;
    VERIFICATION_SUBMITTED: string;
    COMPLIANCE_UPDATED: string;
    TERMS_ACCEPTED: string;
    PRIVACY_ACCEPTED: string;
};
export declare const VERIFICATION_WORKFLOW: {
    STEPS: string[];
    REVIEW_TIMEFRAME: {
        STANDARD: number;
        PRIORITY: number;
        MAXIMUM: number;
    };
};
export declare const DIGITAL_SIGNATURE_CONFIG: {
    ENABLED: boolean;
    PROVIDER: string;
    REQUIRED_FOR: ("CONSENT_DOCUMENT" | "UNDERTAKING_DOCUMENT")[];
};
export declare const LEGAL_TEMPLATES: {
    UNDERTAKING_DOCUMENT: {
        name: string;
        templateUrl: string;
        fillableFields: string[];
    };
    CONSENT_DOCUMENT: {
        name: string;
        templateUrl: string;
        fillableFields: string[];
    };
};
export type LegalDocumentType = keyof typeof LEGAL_DOCUMENT_CONFIG;
export type DocumentStatus = keyof typeof DOCUMENT_STATUS;
export type DocumentSide = keyof typeof DOCUMENT_SIDE;
export type ComplianceRequirement = keyof typeof COMPLIANCE_REQUIREMENTS;
//# sourceMappingURL=legalDocuments.d.ts.map