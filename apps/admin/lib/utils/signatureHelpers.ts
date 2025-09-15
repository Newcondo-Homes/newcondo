/**
 * Digital Signature Helper Utilities
 * Location: apps/admin/src/lib/utils/signatureHelpers.ts
 * 
 * Provides utilities for handling digital signatures in legal documents
 * including signature validation, verification, and metadata extraction.
 */

import { Document, DocumentStatus, DocumentType } from '@newcondo/db';

// Types for digital signatures
export interface DigitalSignature {
  id: string;
  documentId: string;
  signerName: string;
  signerEmail: string;
  signerRole: 'OWNER' | 'AGENT' | 'RENTER' | 'ADMIN';
  signatureData: string; // Base64 encoded signature image or cryptographic signature
  signatureType: 'DRAWN' | 'TYPED' | 'UPLOADED' | 'ELECTRONIC';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  isVerified: boolean;
  verificationMethod?: 'OTP' | 'BIOMETRIC' | 'TWO_FACTOR' | 'MANUAL';
  metadata: Record<string, any>;
}

export interface SignatureValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number; // 0-100
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
}

export interface SignatureVerificationOptions {
  requireOTP?: boolean;
  requireLocation?: boolean;
  allowedSignatureTypes?: Array<'DRAWN' | 'TYPED' | 'UPLOADED' | 'ELECTRONIC'>;
  minimumConfidence?: number;
  expiryHours?: number;
}

// Legal document signature requirements
export const SIGNATURE_REQUIREMENTS: Record<DocumentType, SignatureVerificationOptions> = {
  OWNERSHIP_DOCUMENT: {
    requireOTP: true,
    requireLocation: true,
    allowedSignatureTypes: ['DRAWN', 'ELECTRONIC'],
    minimumConfidence: 85,
    expiryHours: 24,
  },
  CONSENT_DOCUMENT: {
    requireOTP: true,
    requireLocation: false,
    allowedSignatureTypes: ['DRAWN', 'TYPED', 'ELECTRONIC'],
    minimumConfidence: 75,
    expiryHours: 48,
  },
  UNDERTAKING_DOCUMENT: {
    requireOTP: true,
    requireLocation: true,
    allowedSignatureTypes: ['DRAWN', 'ELECTRONIC'],
    minimumConfidence: 90,
    expiryHours: 12,
  },
  BUSINESS_REGISTRATION: {
    requireOTP: false,
    requireLocation: false,
    allowedSignatureTypes: ['UPLOADED', 'ELECTRONIC'],
    minimumConfidence: 70,
    expiryHours: 72,
  },
  // Default for other document types
  NIN: { minimumConfidence: 50, expiryHours: 168 },
  BVN: { minimumConfidence: 50, expiryHours: 168 },
  PASSPORT: { minimumConfidence: 60, expiryHours: 168 },
  VOTERS_CARD: { minimumConfidence: 60, expiryHours: 168 },
  DRIVERS_LICENSE: { minimumConfidence: 60, expiryHours: 168 },
  SELFIE: { minimumConfidence: 80, expiryHours: 24 },
  TAX_CERTIFICATE: { minimumConfidence: 70, expiryHours: 72 },
  UTILITY_BILL: { minimumConfidence: 60, expiryHours: 168 },
  BANK_STATEMENT: { minimumConfidence: 60, expiryHours: 168 },
  OTHER: { minimumConfidence: 50, expiryHours: 168 },
};

/**
 * Validates a digital signature against document requirements
 */
export function validateSignature(
  signature: DigitalSignature,
  documentType: DocumentType
): SignatureValidationResult {
  const requirements = SIGNATURE_REQUIREMENTS[documentType] || SIGNATURE_REQUIREMENTS.OTHER;
  const errors: string[] = [];
  const warnings: string[] = [];
  let confidence = 100;

  // Check signature type
  if (requirements.allowedSignatureTypes && 
      !requirements.allowedSignatureTypes.includes(signature.signatureType)) {
    errors.push(`Signature type ${signature.signatureType} not allowed for this document type`);
    confidence -= 30;
  }

  // Check OTP requirement
  if (requirements.requireOTP && !signature.verificationMethod?.includes('OTP')) {
    errors.push('OTP verification required but not completed');
    confidence -= 25;
  }

  // Check location requirement
  if (requirements.requireLocation && !signature.location) {
    errors.push('Location data required but not provided');
    confidence -= 20;
  }

  // Check signature data
  if (!signature.signatureData || signature.signatureData.length < 10) {
    errors.push('Invalid or missing signature data');
    confidence -= 40;
  }

  // Check expiry
  if (requirements.expiryHours) {
    const expiryTime = new Date(signature.timestamp.getTime() + requirements.expiryHours * 60 * 60 * 1000);
    if (new Date() > expiryTime) {
      errors.push('Signature has expired');
      confidence -= 50;
    }
  }

  // Check minimum confidence
  if (requirements.minimumConfidence && confidence < requirements.minimumConfidence) {
    errors.push(`Signature confidence ${confidence}% below required ${requirements.minimumConfidence}%`);
  }

  // Warnings for best practices
  if (!signature.location && !requirements.requireLocation) {
    warnings.push('Location data not provided - recommended for audit trail');
  }

  if (signature.signatureType === 'TYPED' && documentType === 'OWNERSHIP_DOCUMENT') {
    warnings.push('Typed signature on ownership document - consider drawn signature for higher security');
  }

  const isValid = errors.length === 0 && confidence >= (requirements.minimumConfidence || 50);
  
  let verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED' = 'PENDING';
  if (errors.some(error => error.includes('expired'))) {
    verificationStatus = 'EXPIRED';
  } else if (isValid && signature.isVerified) {
    verificationStatus = 'VERIFIED';
  } else if (!isValid) {
    verificationStatus = 'FAILED';
  }

  return {
    isValid,
    errors,
    warnings,
    confidence: Math.max(0, confidence),
    verificationStatus,
  };
}

/**
 * Generates a unique signature ID
 */
export function generateSignatureId(documentId: string, signerId: string): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  return `sig_${documentId.substring(0, 8)}_${signerId.substring(0, 8)}_${timestamp}_${random}`;
}

/**
 * Extracts metadata from signature canvas or image
 */
export function extractSignatureMetadata(signatureData: string, signatureType: string): Record<string, any> {
  const metadata: Record<string, any> = {
    dataLength: signatureData.length,
    signatureType,
    extractedAt: new Date().toISOString(),
  };

  try {
    // For drawn signatures (base64 image data)
    if (signatureType === 'DRAWN' && signatureData.startsWith('data:image/')) {
      const [header, data] = signatureData.split(',');
      metadata.mimeType = header.match(/data:([^;]+)/)?.[1] || 'unknown';
      metadata.base64Length = data?.length || 0;
      metadata.estimatedFileSize = Math.round((data?.length || 0) * 0.75); // Base64 to bytes approximation
    }

    // For electronic signatures (could be various formats)
    if (signatureType === 'ELECTRONIC') {
      metadata.format = 'electronic';
      // Could add more electronic signature specific metadata
    }

    // For uploaded signatures
    if (signatureType === 'UPLOADED') {
      metadata.format = 'uploaded_image';
    }

    // For typed signatures
    if (signatureType === 'TYPED') {
      metadata.textLength = signatureData.length;
      metadata.format = 'text';
    }

  } catch (error) {
    metadata.extractionError = error instanceof Error ? error.message : 'Unknown error';
  }

  return metadata;
}

/**
 * Creates a signature verification token for OTP verification
 */
export function generateVerificationToken(signature: DigitalSignature): string {
  const data = `${signature.id}:${signature.signerId}:${signature.timestamp.getTime()}`;
  // In a real implementation, you would use a proper cryptographic function
  return Buffer.from(data).toString('base64url');
}

/**
 * Verifies a signature verification token
 */
export function verifyVerificationToken(token: string, signature: DigitalSignature): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const expectedData = `${signature.id}:${signature.signerId}:${signature.timestamp.getTime()}`;
    return decoded === expectedData;
  } catch {
    return false;
  }
}

/**
 * Formats signature for display in admin interface
 */
export function formatSignatureForDisplay(signature: DigitalSignature): {
  displayName: string;
  statusColor: string;
  statusText: string;
  details: string[];
} {
  const validation = validateSignature(signature, 'OTHER' as DocumentType);
  
  const statusColor = validation.verificationStatus === 'VERIFIED' ? 'green' :
                     validation.verificationStatus === 'FAILED' ? 'red' :
                     validation.verificationStatus === 'EXPIRED' ? 'orange' : 'yellow';

  const statusText = validation.verificationStatus === 'VERIFIED' ? 'Verified' :
                    validation.verificationStatus === 'FAILED' ? 'Failed' :
                    validation.verificationStatus === 'EXPIRED' ? 'Expired' : 'Pending';

  const details = [
    `Type: ${signature.signatureType}`,
    `Signed: ${signature.timestamp.toLocaleDateString()}`,
    `Confidence: ${validation.confidence}%`,
    `Method: ${signature.verificationMethod || 'None'}`,
  ];

  if (signature.location) {
    details.push(`Location: ${signature.location.address}`);
  }

  return {
    displayName: `${signature.signerName} (${signature.signerRole})`,
    statusColor,
    statusText,
    details,
  };
}

/**
 * Checks if a document requires digital signature
 */
export function requiresDigitalSignature(documentType: DocumentType): boolean {
  const requiresSignature: DocumentType[] = [
    'OWNERSHIP_DOCUMENT',
    'CONSENT_DOCUMENT',
    'UNDERTAKING_DOCUMENT',
    'BUSINESS_REGISTRATION',
  ];
  
  return requiresSignature.includes(documentType);
}

/**
 * Gets signature instructions for a document type
 */
export function getSignatureInstructions(documentType: DocumentType): string {
  const instructions: Record<DocumentType, string> = {
    OWNERSHIP_DOCUMENT: 'Please provide your digital signature to confirm ownership. This signature will be legally binding and requires OTP verification.',
    CONSENT_DOCUMENT: 'Sign to provide consent for property listing by the designated agent. Your signature confirms authorization.',
    UNDERTAKING_DOCUMENT: 'Your signature confirms agreement to the terms and conditions outlined in this undertaking document.',
    BUSINESS_REGISTRATION: 'Please sign to verify your business registration information and authorize its use.',
    NIN: 'No signature required - verification by ID number only.',
    BVN: 'No signature required - verification by ID number only.',
    PASSPORT: 'No signature required - verification by ID number only.',
    VOTERS_CARD: 'No signature required - document upload only.',
    DRIVERS_LICENSE: 'No signature required - document upload only.',
    SELFIE: 'No signature required - image upload only.',
    TAX_CERTIFICATE: 'Signature may be required depending on document content.',
    UTILITY_BILL: 'No signature required - document upload only.',
    BANK_STATEMENT: 'No signature required - document upload only.',
    OTHER: 'Please follow the signature requirements as specified.',
  };

  return instructions[documentType] || instructions.OTHER;
}

/**
 * Audit trail helper for signature actions
 */
export interface SignatureAuditEntry {
  id: string;
  signatureId: string;
  action: 'CREATED' | 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'MODIFIED';
  performedBy: string; // User ID
  performedAt: Date;
  details: string;
  metadata: Record<string, any>;
}

export function createAuditEntry(
  signatureId: string,
  action: SignatureAuditEntry['action'],
  performedBy: string,
  details: string,
  metadata: Record<string, any> = {}
): SignatureAuditEntry {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    signatureId,
    action,
    performedBy,
    performedAt: new Date(),
    details,
    metadata,
  };
}

export default {
  validateSignature,
  generateSignatureId,
  extractSignatureMetadata,
  generateVerificationToken,
  verifyVerificationToken,
  formatSignatureForDisplay,
  requiresDigitalSignature,
  getSignatureInstructions,
  createAuditEntry,
  SIGNATURE_REQUIREMENTS,
};