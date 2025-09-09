// backend/shared/src/utils/digitalSignature.ts

import crypto from 'crypto';
import { SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';

export interface DigitalSignatureConfig {
  privateKey: string;
  publicKey: string;
  algorithm?: 'RS256' | 'ES256' | 'PS256';
}

export interface DocumentSignatureData {
  documentId: string;
  userId: string;
  documentHash: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface SignedDocument {
  signature: string;
  signedAt: Date;
  signatureId: string;
  algorithm: string;
  publicKeyFingerprint: string;
}

export interface SignatureVerificationResult {
  isValid: boolean;
  signedAt?: Date;
  signatureId?: string;
  error?: string;
}

class DigitalSignatureService {
  private config: DigitalSignatureConfig;

  constructor(config: DigitalSignatureConfig) {
    this.config = config;
  }

  /**
   * Generate a SHA-256 hash of document content
   */
  generateDocumentHash(content: Buffer | string): string {
    const hash = crypto.createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
  }

  /**
   * Generate a unique signature ID
   */
  generateSignatureId(): string {
    return crypto.randomUUID();
  }

  /**
   * Get public key fingerprint for signature verification
   */
  getPublicKeyFingerprint(): string {
    const hash = crypto.createHash('sha256');
    hash.update(this.config.publicKey);
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Create a digital signature for a document
   */
  signDocument(signatureData: DocumentSignatureData): SignedDocument {
    const signatureId = this.generateSignatureId();
    const algorithm = this.config.algorithm || 'RS256';
    
    const payload = {
      documentId: signatureData.documentId,
      userId: signatureData.userId,
      documentHash: signatureData.documentHash,
      timestamp: signatureData.timestamp.toISOString(),
      signatureId,
      ipAddress: signatureData.ipAddress,
      userAgent: signatureData.userAgent,
      location: signatureData.location,
      publicKeyFingerprint: this.getPublicKeyFingerprint()
    };

    const options: SignOptions = {
      algorithm: algorithm as any,
      issuer: 'newcondo-platform',
      audience: 'newcondo-legal',
      expiresIn: '10y', // Long-lived for legal compliance
    };

    const signature = jwt.sign(payload, this.config.privateKey, options);

    return {
      signature,
      signedAt: signatureData.timestamp,
      signatureId,
      algorithm,
      publicKeyFingerprint: this.getPublicKeyFingerprint()
    };
  }

  /**
   * Verify a digital signature
   */
  verifySignature(signature: string): SignatureVerificationResult {
    try {
      const decoded = jwt.verify(signature, this.config.publicKey, {
        issuer: 'newcondo-platform',
        audience: 'newcondo-legal'
      }) as any;

      // Verify public key fingerprint matches
      if (decoded.publicKeyFingerprint !== this.getPublicKeyFingerprint()) {
        return {
          isValid: false,
          error: 'Public key fingerprint mismatch'
        };
      }

      return {
        isValid: true,
        signedAt: new Date(decoded.timestamp),
        signatureId: decoded.signatureId
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Signature verification failed'
      };
    }
  }

  /**
   * Extract signature payload without verification (for inspection)
   */
  inspectSignature(signature: string): any {
    try {
      return jwt.decode(signature);
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a signature chain for multiple related documents
   */
  createSignatureChain(documents: DocumentSignatureData[]): SignedDocument[] {
    const signatures: SignedDocument[] = [];
    let previousHash = '';

    for (const doc of documents) {
      // Include previous signature hash in current signature for chaining
      const chainData = {
        ...doc,
        previousSignatureHash: previousHash,
        chainPosition: signatures.length
      };

      const payload = {
        ...chainData,
        timestamp: doc.timestamp.toISOString(),
        signatureId: this.generateSignatureId(),
        publicKeyFingerprint: this.getPublicKeyFingerprint()
      };

      const signature = jwt.sign(payload, this.config.privateKey, {
        algorithm: this.config.algorithm as any || 'RS256',
        issuer: 'newcondo-platform',
        audience: 'newcondo-legal',
        expiresIn: '10y'
      });

      const signedDoc = {
        signature,
        signedAt: doc.timestamp,
        signatureId: payload.signatureId,
        algorithm: this.config.algorithm || 'RS256',
        publicKeyFingerprint: this.getPublicKeyFingerprint()
      };

      signatures.push(signedDoc);
      previousHash = this.generateDocumentHash(signature);
    }

    return signatures;
  }

  /**
   * Generate a compliance certificate for a signed document
   */
  generateComplianceCertificate(signedDoc: SignedDocument, documentInfo: {
    title: string;
    type: string;
    userId: string;
    userName: string;
  }): string {
    const certificate = {
      certificateId: crypto.randomUUID(),
      documentTitle: documentInfo.title,
      documentType: documentInfo.type,
      signedBy: {
        userId: documentInfo.userId,
        name: documentInfo.userName
      },
      signedAt: signedDoc.signedAt,
      signatureId: signedDoc.signatureId,
      algorithm: signedDoc.algorithm,
      publicKeyFingerprint: signedDoc.publicKeyFingerprint,
      issuer: 'NewCondo Legal Compliance System',
      issuedAt: new Date(),
      validUntil: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) // 10 years
    };

    return jwt.sign(certificate, this.config.privateKey, {
      algorithm: this.config.algorithm as any || 'RS256',
      issuer: 'newcondo-compliance',
      audience: 'legal-authorities',
      expiresIn: '10y'
    });
  }
}

// Export singleton instance
export const createDigitalSignatureService = (config: DigitalSignatureConfig): DigitalSignatureService => {
  return new DigitalSignatureService(config);
};

// Utility functions for common signature operations
export const signatureUtils = {
  /**
   * Create a simple document signature payload
   */
  createSignaturePayload: (
    documentId: string,
    userId: string,
    content: string | Buffer,
    metadata?: Partial<DocumentSignatureData>
  ): DocumentSignatureData => {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    return {
      documentId,
      userId,
      documentHash: hash,
      timestamp: new Date(),
      ...metadata
    };
  },

  /**
   * Validate signature format
   */
  isValidSignatureFormat: (signature: string): boolean => {
    try {
      const parts = signature.split('.');
      return parts.length === 3; // JWT format: header.payload.signature
    } catch {
      return false;
    }
  },

  /**
   * Extract basic info from signature without verification
   */
  getSignatureInfo: (signature: string): {
    documentId?: string;
    userId?: string;
    signedAt?: string;
    signatureId?: string;
  } | null => {
    try {
      const decoded = jwt.decode(signature) as any;
      return {
        documentId: decoded?.documentId,
        userId: decoded?.userId,
        signedAt: decoded?.timestamp,
        signatureId: decoded?.signatureId
      };
    } catch {
      return null;
    }
  }
};

export default DigitalSignatureService;