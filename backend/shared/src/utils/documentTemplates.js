"use strict";
/**
 * Document Templates Utility
 * Location: backend/shared/src/utils/documentTemplates.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGAL_UNDERTAKING_TEMPLATE = exports.DOCUMENT_TEMPLATES = void 0;
const db_1 = require("@newcondo/db");
/**
 * Document template definitions
 */
exports.DOCUMENT_TEMPLATES = {
    [db_1.DocumentType.NIN]: {
        id: 'nin_document',
        name: 'National Identification Number (NIN)',
        documentType: db_1.DocumentType.NIN,
        description: 'Valid Nigerian National Identification Number for identity verification',
        instructions: [
            'Provide your 11-digit NIN number',
            'Ensure the NIN is registered and active',
            'NIN must match the name on your profile',
            'You can verify your NIN at nimc.gov.ng'
        ],
        requiredFields: ['documentNumber'],
        isRequired: true,
        userTypes: ['OWNER', 'AGENT', 'RENTER'],
        validationRules: {
            maxFileSizeBytes: 0, // NIN is usually just a number
            allowedMimeTypes: [],
            requiredTextFields: ['documentNumber']
        }
    },
    [db_1.DocumentType.BVN]: {
        id: 'bvn_document',
        name: 'Bank Verification Number (BVN)',
        documentType: db_1.DocumentType.BVN,
        description: 'Valid Bank Verification Number for financial verification',
        instructions: [
            'Provide your 11-digit BVN number',
            'Ensure BVN is linked to an active bank account',
            'BVN name must match your profile name',
            'Dial *565*0# from your registered phone to get BVN'
        ],
        requiredFields: ['documentNumber'],
        isRequired: false,
        userTypes: ['OWNER', 'AGENT', 'RENTER'],
        validationRules: {
            maxFileSizeBytes: 0,
            allowedMimeTypes: [],
            requiredTextFields: ['documentNumber']
        }
    },
    [db_1.DocumentType.PASSPORT]: {
        id: 'passport_document',
        name: 'International Passport',
        documentType: db_1.DocumentType.PASSPORT,
        description: 'Valid Nigerian or foreign passport for identity verification',
        instructions: [
            'Upload clear photo of passport data page',
            'Ensure passport is not expired',
            'All text must be clearly readable',
            'Include passport number in submission'
        ],
        requiredFields: ['fileUrl', 'documentNumber'],
        isRequired: false,
        userTypes: ['OWNER', 'AGENT', 'RENTER'],
        validationRules: {
            maxFileSizeBytes: 5 * 1024 * 1024, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
            minResolution: { width: 800, height: 600 },
            expirationRequired: true
        }
    },
    [db_1.DocumentType.VOTERS_CARD]: {
        id: 'voters_card_document',
        name: 'Permanent Voter\'s Card (PVC)',
        documentType: db_1.DocumentType.VOTERS_CARD,
        description: 'Valid Nigerian Permanent Voter\'s Card',
        instructions: [
            'Upload both front and back of PVC',
            'Ensure card is not damaged or expired',
            'All information must be clearly visible',
            'Card must be issued by INEC'
        ],
        requiredFields: ['fileUrl'],
        isRequired: false,
        userTypes: ['OWNER', 'AGENT', 'RENTER'],
        validationRules: {
            maxFileSizeBytes: 5 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png'],
            minResolution: { width: 600, height: 400 }
        }
    },
    [db_1.DocumentType.DRIVERS_LICENSE]: {
        id: 'drivers_license_document',
        name: 'Driver\'s License',
        documentType: db_1.DocumentType.DRIVERS_LICENSE,
        description: 'Valid Nigerian Driver\'s License',
        instructions: [
            'Upload both front and back of license',
            'Ensure license is not expired',
            'All text must be clearly readable',
            'License must be issued by FRSC'
        ],
        requiredFields: ['fileUrl', 'documentNumber'],
        isRequired: false,
        userTypes: ['OWNER', 'AGENT', 'RENTER'],
        validationRules: {
            maxFileSizeBytes: 5 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png'],
            minResolution: { width: 600, height: 400 },
            expirationRequired: true
        }
    },
    [db_1.DocumentType.SELFIE]: {
        id: 'selfie_document',
        name: 'Identity Verification Selfie',
        documentType: db_1.DocumentType.SELFIE,
        description: 'Clear selfie photo for identity verification',
        instructions: [
            'Take a clear selfie in good lighting',
            'Face must be clearly visible and unobstructed',
            'Look directly at camera',
            'No hats, sunglasses, or face coverings',
            'Match the photo on your ID documents'
        ],
        requiredFields: ['fileUrl'],
        isRequired: true,
        userTypes: ['OWNER', 'AGENT', 'RENTER'],
        validationRules: {
            maxFileSizeBytes: 3 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png'],
            minResolution: { width: 480, height: 640 }
        }
    },
    [db_1.DocumentType.OWNERSHIP_DOCUMENT]: {
        id: 'ownership_document',
        name: 'Proof of Property Ownership',
        documentType: db_1.DocumentType.OWNERSHIP_DOCUMENT,
        description: 'Legal document proving property ownership',
        instructions: [
            'Upload Certificate of Occupancy, Title Deed, or Purchase Agreement',
            'Document must clearly show your name as owner',
            'Property address must match listing address',
            'Ensure document is certified/registered',
            'If jointly owned, provide documentation for all owners'
        ],
        requiredFields: ['fileUrl'],
        isRequired: true,
        userTypes: ['OWNER'],
        validationRules: {
            maxFileSizeBytes: 10 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
            minResolution: { width: 800, height: 600 }
        }
    },
    [db_1.DocumentType.CONSENT_DOCUMENT]: {
        id: 'consent_document',
        name: 'Owner Consent Document',
        documentType: db_1.DocumentType.CONSENT_DOCUMENT,
        description: 'Signed consent from property owner authorizing agent',
        instructions: [
            'Must be signed by verified property owner',
            'Include agent\'s full name and ID',
            'Specify the property address and listing duration',
            'Template available for download',
        ],
        requiredFields: ['fileUrl'],
        isRequired: true,
        userTypes: ['AGENT'],
        validationRules: {
            maxFileSizeBytes: 5 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
            minResolution: { width: 800, height: 600 }
        }
    },
    [db_1.DocumentType.UNDERTAKING_DOCUMENT]: {
        id: 'undertaking_document',
        name: 'Legal Undertaking',
        documentType: db_1.DocumentType.UNDERTAKING_DOCUMENT,
        description: 'Legal document undertaking to abide by platform terms',
        instructions: [
            'Download the undertaking form',
            'Sign the document digitally or physically',
            'Re-upload the signed document',
            'Ensures compliance with all platform rules',
        ],
        requiredFields: ['fileUrl'],
        templateUrl: '/documents/newcondo-undertaking.pdf', // Example template URL
        isRequired: true,
        userTypes: ['OWNER', 'AGENT'],
        validationRules: {
            maxFileSizeBytes: 5 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        }
    },
    [db_1.DocumentType.BUSINESS_REGISTRATION]: {
        id: 'business_reg_document',
        name: 'Business Registration Certificate',
        documentType: db_1.DocumentType.BUSINESS_REGISTRATION,
        description: 'Corporate Affairs Commission (CAC) business registration',
        instructions: [
            'Upload a copy of your CAC certificate',
            'Business name must match your profile details',
            'Document should be clear and readable',
        ],
        requiredFields: ['fileUrl'],
        isRequired: true,
        userTypes: ['OWNER', 'AGENT'],
        validationRules: {
            maxFileSizeBytes: 5 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        }
    },
    [db_1.DocumentType.TAX_CERTIFICATE]: {
        id: 'tax_certificate',
        name: 'Tax Clearance Certificate',
        documentType: db_1.DocumentType.TAX_CERTIFICATE,
        description: 'Valid tax clearance certificate for the current year',
        instructions: [
            'Provide a copy of your FIRS or state tax certificate',
            'Certificate must be valid and up-to-date',
        ],
        requiredFields: ['fileUrl'],
        isRequired: false,
        userTypes: ['OWNER', 'AGENT'],
        validationRules: {
            maxFileSizeBytes: 5 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
            expirationRequired: true,
        }
    },
    [db_1.DocumentType.UTILITY_BILL]: {
        id: 'utility_bill',
        name: 'Proof of Address (Utility Bill)',
        documentType: db_1.DocumentType.UTILITY_BILL,
        description: 'Recent utility bill for address verification',
        instructions: [
            'Upload a recent electricity, water, or gas bill (within last 3 months)',
            'Name and address on bill must match profile details',
            'Full document must be visible',
        ],
        requiredFields: ['fileUrl'],
        isRequired: false,
        userTypes: ['OWNER', 'AGENT', 'RENTER'],
        validationRules: {
            maxFileSizeBytes: 5 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        }
    },
    [db_1.DocumentType.BANK_STATEMENT]: {
        id: 'bank_statement',
        name: 'Bank Statement',
        documentType: db_1.DocumentType.BANK_STATEMENT,
        description: 'Recent bank statement for financial verification',
        instructions: [
            'Upload a recent bank statement (within last 3 months)',
            'Must clearly show account holder name and account number',
            'Financial details can be redacted',
        ],
        requiredFields: ['fileUrl'],
        isRequired: false,
        userTypes: ['OWNER', 'AGENT', 'RENTER'],
        validationRules: {
            maxFileSizeBytes: 5 * 1024 * 1024,
            allowedMimeTypes: ['application/pdf'],
        }
    },
    [db_1.DocumentType.OTHER]: {
        id: 'other_document',
        name: 'Other Document',
        documentType: db_1.DocumentType.OTHER,
        description: 'A custom document type for specific situations',
        instructions: [
            'Provide a clear description of the document purpose',
            'Upload the relevant file',
            'This document will be reviewed manually by an admin',
        ],
        requiredFields: ['fileUrl'],
        isRequired: false,
        userTypes: ['OWNER', 'AGENT', 'RENTER'],
        validationRules: {
            maxFileSizeBytes: 10 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        }
    }
};
/**
 * Legal Undertaking Template
 */
exports.LEGAL_UNDERTAKING_TEMPLATE = {
    title: 'NewCondo Legal Undertaking',
    content: 'I, the undersigned, hereby declare and undertake to comply with all rules and regulations of the NewCondo platform...',
    clauses: [
        {
            id: 'clause_1',
            text: 'I will provide accurate and truthful information in my listings.',
            isRequired: true,
            userMustInitial: true,
        },
        {
            id: 'clause_2',
            text: 'I will not engage in fraudulent activities or misrepresent property details.',
            isRequired: true,
            userMustInitial: true,
        },
        {
            id: 'clause_3',
            text: 'I understand that all listings and documents are subject to admin review and verification.',
            isRequired: true,
        },
        {
            id: 'clause_4',
            text: 'I agree to the terms and conditions of the platform.',
            isRequired: true,
        },
        {
            id: 'clause_5',
            text: 'I confirm that I am the legal owner of the property or have explicit consent from the owner.',
            isRequired: true,
            userMustInitial: true,
        }
    ],
    signatureRequired: true,
    witnessRequired: false,
};
//# sourceMappingURL=documentTemplates.js.map