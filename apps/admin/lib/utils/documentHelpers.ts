// apps/admin/src/lib/utils/documentHelpers.ts

import { DocumentType, DocumentStatus, DocumentSide } from '@newcondo/db';

export interface DocumentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  dimensions?: { width: number; height: number };
  pages?: number;
  createdAt: Date;
}

export interface DocumentAnalysis {
  readability: number; // 0-100 score
  completeness: number; // 0-100 score
  authenticity: number; // 0-100 score
  extractedText?: string;
  detectedFields?: Record<string, string>;
}

export interface LegalDocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  description: string;
  requiredFields: string[];
  template: string;
  version: string;
  isActive: boolean;
}

/**
 * Document type configurations with validation rules
 */
export const DOCUMENT_CONFIGS = {
  [DocumentType.NIN]: {
    name: 'National Identity Number',
    requiresFile: false,
    requiresNumber: true,
    numberPattern: /^\d{11}$/,
    numberLength: 11,
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxFileSizeMB: 5,
    hasSides: false,
    expirationRequired: false,
    verificationRequired: true
  },
  [DocumentType.BVN]: {
    name: 'Bank Verification Number',
    requiresFile: false,
    requiresNumber: true,
    numberPattern: /^\d{11}$/,
    numberLength: 11,
    acceptedMimeTypes: [],
    maxFileSizeMB: 0,
    hasSides: false,
    expirationRequired: false,
    verificationRequired: true
  },
  [DocumentType.PASSPORT]: {
    name: 'International Passport',
    requiresFile: true,
    requiresNumber: true,
    numberPattern: /^[A-Z]\d{8}$/,
    numberLength: 9,
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxFileSizeMB: 10,
    hasSides: false,
    expirationRequired: true,
    verificationRequired: true
  },
  [DocumentType.VOTERS_CARD]: {
    name: 'Permanent Voter\'s Card',
    requiresFile: true,
    requiresNumber: true,
    numberPattern: /^[A-Z0-9]{19}$/,
    numberLength: 19,
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxFileSizeMB: 5,
    hasSides: true,
    expirationRequired: false,
    verificationRequired: true
  },
  [DocumentType.DRIVERS_LICENSE]: {
    name: 'Driver\'s License',
    requiresFile: true,
    requiresNumber: true,
    numberPattern: /^[A-Z]{3}[A-Z0-9]{9}[A-Z]{2}$/,
    numberLength: 14,
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxFileSizeMB: 5,
    hasSides: true,
    expirationRequired: true,
    verificationRequired: true
  },
  [DocumentType.SELFIE]: {
    name: 'Selfie Photo',
    requiresFile: true,
    requiresNumber: false,
    numberPattern: null,
    numberLength: 0,
    acceptedMimeTypes: ['image/jpeg', 'image/png'],
    maxFileSizeMB: 3,
    hasSides: false,
    expirationRequired: false,
    verificationRequired: true
  },
  [DocumentType.OWNERSHIP_DOCUMENT]: {
    name: 'Proof of Ownership',
    requiresFile: true,
    requiresNumber: false,
    numberPattern: null,
    numberLength: 0,
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSizeMB: 20,
    hasSides: false,
    expirationRequired: false,
    verificationRequired: true
  },
  [DocumentType.CONSENT_DOCUMENT]: {
    name: 'Consent Document',
    requiresFile: true,
    requiresNumber: false,
    numberPattern: null,
    numberLength: 0,
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSizeMB: 15,
    hasSides: false,
    expirationRequired: false,
    verificationRequired: true
  },
  [DocumentType.UNDERTAKING_DOCUMENT]: {
    name: 'Legal Undertaking',
    requiresFile: true,
    requiresNumber: false,
    numberPattern: null,
    numberLength: 0,
    acceptedMimeTypes: ['application/pdf'],
    maxFileSizeMB: 15,
    hasSides: false,
    expirationRequired: false,
    verificationRequired: true
  }
} as const;

/**
 * Validates document metadata and content
 */
export function validateDocument(
  documentType: DocumentType,
  metadata: DocumentMetadata,
  documentNumber?: string
): DocumentValidation {
  const config = DOCUMENT_CONFIGS[documentType];
  const errors: string[] = [];
  const warnings: string[] = [];

  // File validation
  if (config.requiresFile) {
    // Check mime type
    if (!config.acceptedMimeTypes.includes(metadata.mimeType)) {
      errors.push(`Invalid file type. Accepted types: ${config.acceptedMimeTypes.join(', ')}`);
    }

    // Check file size
    const fileSizeMB = metadata.fileSize / (1024 * 1024);
    if (fileSizeMB > config.maxFileSizeMB) {
      errors.push(`File size too large. Maximum size: ${config.maxFileSizeMB}MB`);
    }

    // Check image dimensions for certain document types
    if (documentType === DocumentType.SELFIE && metadata.dimensions) {
      const { width, height } = metadata.dimensions;
      if (width < 300 || height < 300) {
        warnings.push('Low resolution image may affect verification quality');
      }
      
      const aspectRatio = width / height;
      if (aspectRatio < 0.7 || aspectRatio > 1.3) {
        warnings.push('Unusual aspect ratio detected. Ensure face is clearly visible');
      }
    }
  }

  // Document number validation
  if (config.requiresNumber && documentNumber) {
    if (config.numberPattern && !config.numberPattern.test(documentNumber)) {
      errors.push(`Invalid ${config.name} format`);
    }

    if (config.numberLength && documentNumber.length !== config.numberLength) {
      errors.push(`${config.name} must be ${config.numberLength} characters long`);
    }
  } else if (config.requiresNumber && !documentNumber) {
    errors.push(`${config.name} number is required`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Extracts document information from filename
 */
export function parseDocumentFileName(fileName: string): {
  type?: DocumentType;
  side?: DocumentSide;
  userId?: string;
  timestamp?: Date;
} {
  const parts = fileName.toLowerCase().split(/[-_\.]/);
  let type: DocumentType | undefined;
  let side: DocumentSide | undefined;
  let userId: string | undefined;
  let timestamp: Date | undefined;

  // Extract document type
  if (parts.includes('nin')) type = DocumentType.NIN;
  else if (parts.includes('bvn')) type = DocumentType.BVN;
  else if (parts.includes('passport')) type = DocumentType.PASSPORT;
  else if (parts.includes('voters') || parts.includes('pvc')) type = DocumentType.VOTERS_CARD;
  else if (parts.includes('license') || parts.includes('drivers')) type = DocumentType.DRIVERS_LICENSE;
  else if (parts.includes('selfie')) type = DocumentType.SELFIE;
  else if (parts.includes('ownership')) type = DocumentType.OWNERSHIP_DOCUMENT;
  else if (parts.includes('consent')) type = DocumentType.CONSENT_DOCUMENT;
  else if (parts.includes('undertaking')) type = DocumentType.UNDERTAKING_DOCUMENT;

  // Extract document side
  if (parts.includes('front')) side = DocumentSide.FRONT;
  else if (parts.includes('back')) side = DocumentSide.BACK;
  else side = DocumentSide.SINGLE;

  // Extract user ID (assuming cuid format)
  const cuidPattern = /[a-z0-9]{25}/;
  const possibleUserId = parts.find(part => cuidPattern.test(part));
  if (possibleUserId) userId = possibleUserId;

  // Extract timestamp
  const timestampPattern = /\d{13}/;
  const possibleTimestamp = parts.find(part => timestampPattern.test(part));
  if (possibleTimestamp) {
    timestamp = new Date(parseInt(possibleTimestamp));
  }

  return { type, side, userId, timestamp };
}

/**
 * Generates document upload path
 */
export function generateDocumentPath(
  userId: string,
  documentType: DocumentType,
  documentSide?: DocumentSide,
  propertyId?: string
): string {
  const basePath = propertyId 
    ? `documents/properties/${propertyId}` 
    : `documents/users/${userId}`;
  
  const timestamp = Date.now();
  const typeStr = documentType.toLowerCase();
  const sideStr = documentSide && documentSide !== DocumentSide.SINGLE 
    ? `_${documentSide.toLowerCase()}` 
    : '';
  
  return `${basePath}/${typeStr}${sideStr}_${timestamp}`;
}

/**
 * Determines document status based on analysis
 */
export function determineDocumentStatus(analysis: DocumentAnalysis): DocumentStatus {
  const { readability, completeness, authenticity } = analysis;
  
  // All scores must be above thresholds
  if (readability >= 80 && completeness >= 85 && authenticity >= 75) {
    return DocumentStatus.APPROVED;
  }
  
  // If any critical score is too low, reject
  if (readability < 40 || completeness < 50 || authenticity < 30) {
    return DocumentStatus.REJECTED;
  }
  
  // Otherwise, keep pending for manual review
  return DocumentStatus.PENDING;
}

/**
 * Formats document verification notes
 */
export function formatVerificationNotes(
  analysis: DocumentAnalysis,
  adminNotes?: string
): string {
  const notes: string[] = [];
  
  // Add analysis scores
  notes.push(`Readability: ${analysis.readability}%`);
  notes.push(`Completeness: ${analysis.completeness}%`);
  notes.push(`Authenticity: ${analysis.authenticity}%`);
  
  // Add warnings for low scores
  if (analysis.readability < 70) {
    notes.push('⚠️ Low readability - text may be unclear');
  }
  if (analysis.completeness < 80) {
    notes.push('⚠️ Document appears incomplete');
  }
  if (analysis.authenticity < 60) {
    notes.push('⚠️ Potential authenticity concerns');
  }
  
  // Add extracted information if available
  if (analysis.detectedFields && Object.keys(analysis.detectedFields).length > 0) {
    notes.push('Detected fields:');
    Object.entries(analysis.detectedFields).forEach(([key, value]) => {
      notes.push(`- ${key}: ${value}`);
    });
  }
  
  // Add admin notes if provided
  if (adminNotes) {
    notes.push('Admin notes:');
    notes.push(adminNotes);
  }
  
  return notes.join('\n');
}

/**
 * Checks if document requires renewal
 */
export function checkDocumentExpiration(
  documentType: DocumentType,
  expiresAt?: Date | null
): {
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry?: number;
} {
  const config = DOCUMENT_CONFIGS[documentType];
  
  if (!config.expirationRequired || !expiresAt) {
    return { isExpired: false, isExpiringSoon: false };
  }
  
  const now = new Date();
  const daysDiff = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    isExpired: daysDiff < 0,
    isExpiringSoon: daysDiff >= 0 && daysDiff <= 30,
    daysUntilExpiry: daysDiff
  };
}

/**
 * Gets document requirements for user type
 */
export function getRequiredDocuments(userType: string): DocumentType[] {
  const baseDocuments: DocumentType[] = [
    DocumentType.NIN,
    DocumentType.SELFIE
  ];
  
  switch (userType) {
    case 'LANDLORD':
      return [...baseDocuments, DocumentType.OWNERSHIP_DOCUMENT];
    
    case 'PROPERTY_MANAGER':
      return [
        ...baseDocuments,
        DocumentType.BUSINESS_REGISTRATION,
        DocumentType.TAX_CERTIFICATE
      ];
    
    case 'AGENT':
      return [...baseDocuments, DocumentType.CONSENT_DOCUMENT];
    
    case 'RENTER':
      return [...baseDocuments, DocumentType.UTILITY_BILL];
    
    default:
      return baseDocuments;
  }
}

/**
 * Validates document completeness for user
 */
export interface DocumentCompleteness {
  isComplete: boolean;
  missingDocuments: DocumentType[];
  expiredDocuments: DocumentType[];
  rejectedDocuments: DocumentType[];
  completionPercentage: number;
}

export function checkDocumentCompleteness(
  userType: string,
  userDocuments: Array<{
    documentType: DocumentType;
    status: DocumentStatus;
    expiresAt?: Date | null;
  }>
): DocumentCompleteness {
  const requiredDocs = getRequiredDocuments(userType);
  const userDocMap = new Map(
    userDocuments.map(doc => [doc.documentType, doc])
  );
  
  const missingDocuments: DocumentType[] = [];
  const expiredDocuments: DocumentType[] = [];
  const rejectedDocuments: DocumentType[] = [];
  
  requiredDocs.forEach(docType => {
    const userDoc = userDocMap.get(docType);
    
    if (!userDoc) {
      missingDocuments.push(docType);
      return;
    }
    
    if (userDoc.status === DocumentStatus.REJECTED) {
      rejectedDocuments.push(docType);
      return;
    }
    
    const expiration = checkDocumentExpiration(docType, userDoc.expiresAt);
    if (expiration.isExpired) {
      expiredDocuments.push(docType);
    }
  });
  
  const totalRequired = requiredDocs.length;
  const totalMissing = missingDocuments.length + expiredDocuments.length + rejectedDocuments.length;
  const completionPercentage = Math.round(((totalRequired - totalMissing) / totalRequired) * 100);
  
  return {
    isComplete: totalMissing === 0,
    missingDocuments,
    expiredDocuments,
    rejectedDocuments,
    completionPercentage
  };
}