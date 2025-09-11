import { PrismaClient } from '@newcondo/db';
import { z } from 'zod';
import crypto from 'crypto';
import { sign, verify } from 'jsonwebtoken';
import { logger } from '../../../shared/src/middleware/logger';

const prisma = new PrismaClient();

// Digital signature types
export interface DigitalSignature {
  id: string;
  documentId: string;
  userId: string;
  signatureType: 'ELECTRONIC' | 'DRAWN' | 'TYPED' | 'BIOMETRIC';
  signatureData: string; // Base64 encoded signature image or encrypted signature data
  signatureHash: string; // Hash of the signature for verification
  ipAddress: string;
  userAgent: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: Date;
  isValid: boolean;
  verificationToken: string;
  metadata?: Record<string, any>;
}

export interface SignatureRequest {
  id: string;
  documentId: string;
  userId: string;
  documentType: string;
  documentContent: string;
  requiresWitness: boolean;
  expiresAt: Date;
  status: 'PENDING' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';
  notificationsSent: number;
  signingUrl: string;
  createdAt: Date;
}

// Signature creation schema
const createSignatureSchema = z.object({
  documentId: z.string(),
  signatureType: z.enum(['ELECTRONIC', 'DRAWN', 'TYPED', 'BIOMETRIC']),
  signatureData: z.string(), // Base64 encoded
  ipAddress: z.string().ip(),
  userAgent: z.string(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

// Signature request schema
const createSignatureRequestSchema = z.object({
  documentId: z.string(),
  userId: z.string(),
  documentType: z.string(),
  documentContent: z.string(),
  requiresWitness: z.boolean().default(false),
  expiryDays: z.number().min(1).max(30).default(7),
});

export class DigitalSignatureService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
  private readonly SIGNATURE_SALT = process.env.SIGNATURE_SALT || 'signature-salt';

  /**
   * Create a signature request
   */
  async createSignatureRequest(
    data: z.infer<typeof createSignatureRequestSchema>
  ): Promise<SignatureRequest> {
    const validatedData = createSignatureRequestSchema.parse(data);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validatedData.expiryDays);

    const requestId = `sig_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const signingToken = this.generateSigningToken(requestId, validatedData.userId);
    
    const signatureRequest: SignatureRequest = {
      id: requestId,
      documentId: validatedData.documentId,
      userId: validatedData.userId,
      documentType: validatedData.documentType,
      documentContent: validatedData.documentContent,
      requiresWitness: validatedData.requiresWitness,
      expiresAt,
      status: 'PENDING',
      notificationsSent: 0,
      signingUrl: `/api/signatures/sign/${requestId}?token=${signingToken}`,
      createdAt: new Date(),
    };

    // In real implementation, save to database
    // await prisma.signatureRequest.create({ data: signatureRequest });

    return signatureRequest;
  }

  /**
   * Create a digital signature
   */
  async createSignature(
    requestId: string,
    userId: string,
    data: z.infer<typeof createSignatureSchema>
  ): Promise<DigitalSignature> {
    const validatedData = createSignatureSchema.parse(data);
    
    // Verify the signature request exists and is valid
    const request = await this.getSignatureRequest(requestId);
    if (!request || request.status !== 'PENDING' || request.userId !== userId) {
      throw new Error('Invalid signature request');
    }

    if (new Date() > request.expiresAt) {
      throw new Error('Signature request has expired');
    }

    // Create signature hash for verification
    const signatureHash = this.generateSignatureHash(
      validatedData.signatureData,
      userId,
      validatedData.documentId
    );

    // Generate verification token
    const verificationToken = this.generateVerificationToken({
      userId,
      documentId: validatedData.documentId,
      signatureHash,
      timestamp: new Date(),
    });

    const signature: DigitalSignature = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId: validatedData.documentId,
      userId,
      signatureType: validatedData.signatureType,
      signatureData: validatedData.signatureData,
      signatureHash,
      ipAddress: validatedData.ipAddress,
      userAgent: validatedData.userAgent,
      location: validatedData.location,
      timestamp: new Date(),
      isValid: true,
      verificationToken,
      metadata: validatedData.metadata || {},
    };

    // Update signature request status
    // await prisma.signatureRequest.update({
    //   where: { id: requestId },
    //   data: { status: 'SIGNED' }
    // });

    // In real implementation, save signature to database
    // await prisma.digitalSignature.create({ data: signature });

    return signature;
  }

  /**
   * Get signature request by ID
   */
  async getSignatureRequest(requestId: string): Promise<SignatureRequest | null> {
    // Mock implementation - would query database in real app
    const mockRequest: SignatureRequest = {
      id: requestId,
      documentId: 'doc_123',
      userId: 'user_123',
      documentType: 'CONSENT',
      documentContent: 'Sample document content...',
      requiresWitness: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      notificationsSent: 1,
      signingUrl: `/api/signatures/sign/${requestId}?token=xyz`,
      createdAt: new Date(),
    };

    return mockRequest;
  }

  /**
   * Get signatures for a document
   */
  async getDocumentSignatures(documentId: string): Promise<DigitalSignature[]> {
    // Mock implementation
    const mockSignatures: DigitalSignature[] = [
      {
        id: 'sig_001',
        documentId,
        userId: 'user_123',
        signatureType: 'DRAWN',
        signatureData: 'base64_signature_data',
        signatureHash: 'hash123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date(),
        isValid: true,
        verificationToken: 'verification_token_123',
        metadata: {},
      },
    ];

    return mockSignatures;
  }

  /**
   * Verify a digital signature
   */
  async verifySignature(signatureId: string): Promise<{
    isValid: boolean;
    signature?: DigitalSignature;
    verificationDetails: {
      signatureIntegrity: boolean;
      tokenValid: boolean;
      timestampValid: boolean;
      userVerified: boolean;
      documentIntegrity: boolean;
    };
  }> {
    // Mock implementation - would query database and perform actual verification
    const signature: DigitalSignature = {
      id: signatureId,
      documentId: 'doc_123',
      userId: 'user_123',
      signatureType: 'DRAWN',
      signatureData: 'base64_signature_data',
      signatureHash: 'hash123',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      timestamp: new Date(),
      isValid: true,
      verificationToken: 'verification_token_123',
      metadata: {},
    };

    // Perform verification checks
    const verificationDetails = {
      signatureIntegrity: this.verifySignatureIntegrity(signature),
      tokenValid: this.verifyToken(signature.verificationToken),
      timestampValid: this.verifyTimestamp(signature.timestamp),
      userVerified: await this.verifyUser(signature.userId),
      documentIntegrity: await this.verifyDocumentIntegrity(signature.documentId),
    };

    const isValid = Object.values(verificationDetails).every(check => check === true);

    return {
      isValid,
      signature: isValid ? signature : undefined,
      verificationDetails,
    };
  }

  /**
   * Get signature audit trail
   */
  async getSignatureAuditTrail(documentId: string): Promise<{
    document: {
      id: string;
      type: string;
      createdAt: Date;
      hash: string;
    };
    signatures: Array<{
      id: string;
      userId: string;
      userName: string;
      signatureType: string;
      timestamp: Date;
      ipAddress: string;
      location?: string;
      isValid: boolean;
    }>;
    verificationEvents: Array<{
      id: string;
      type: 'SIGNED' | 'VERIFIED' | 'INVALIDATED';
      timestamp: Date;
      performedBy: string;
      details: string;
    }>;
  }> {
    // Mock implementation
    return {
      document: {
        id: documentId,
        type: 'CONSENT',
        createdAt: new Date('2024-01-01'),
        hash: 'doc_hash_123',
      },
      signatures: [
        {
          id: 'sig_001',
          userId: 'user_123',
          userName: 'John Doe',
          signatureType: 'DRAWN',
          timestamp: new Date(),
          ipAddress: '192.168.1.1',
          location: 'Lagos, Nigeria',
          isValid: true,
        },
      ],
      verificationEvents: [
        {
          id: 'event_001',
          type: 'SIGNED',
          timestamp: new Date(),
          performedBy: 'user_123',
          details: 'Document signed with drawn signature',
        },
      ],
    };
  }

  /**
   * Invalidate a signature
   */
  async invalidateSignature(
    signatureId: string,
    reason: string,
    invalidatedBy: string
  ): Promise<boolean> {
    // In real implementation:
    // await prisma.digitalSignature.update({
    //   where: { id: signatureId },
    //   data: {
    //     isValid: false,
    //     metadata: {
    //       invalidationReason: reason,
    //       invalidatedBy,
    //       invalidatedAt: new Date(),
    //     }
    //   }
    // });

    return true;
  }

  /**
   * Generate signature certificate
   */
  async generateSignatureCertificate(signatureId: string): Promise<{
    certificateData: string;
    certificateHash: string;
    issuedAt: Date;
  }> {
    const signature = await this.getDocumentSignatures('doc_123');
    const targetSignature = signature.find(s => s.id === signatureId);
    
    if (!targetSignature) {
      throw new Error('Signature not found');
    }

    const certificateData = {
      signatureId: targetSignature.id,
      documentId: targetSignature.documentId,
      userId: targetSignature.userId,
      signatureHash: targetSignature.signatureHash,
      timestamp: targetSignature.timestamp,
      verificationToken: targetSignature.verificationToken,
      issuedAt: new Date(),
    };

    const certificateString = JSON.stringify(certificateData);
    const certificateHash = crypto
      .createHash('sha256')
      .update(certificateString + this.SIGNATURE_SALT)
      .digest('hex');

    return {
      certificateData: certificateString,
      certificateHash,
      issuedAt: new Date(),
    };
  }

  /**
   * Batch sign documents (for multiple related documents)
   */
  async batchSignDocuments(
    userId: string,
    documentIds: string[],
    signatureData: string,
    signatureType: 'ELECTRONIC' | 'DRAWN' | 'TYPED' | 'BIOMETRIC',
    clientInfo: {
      ipAddress: string;
      userAgent: string;
      location?: { latitude: number; longitude: number; address?: string };
    }
  ): Promise<DigitalSignature[]> {
    const signatures: DigitalSignature[] = [];

    for (const documentId of documentIds) {
      try {
        // Find pending signature request for this document
        const requests = await this.getPendingSignatureRequests(userId);
        const request = requests.find(r => r.documentId === documentId);
        
        if (request) {
          const signature = await this.createSignature(request.id, userId, {
            documentId,
            signatureType,
            signatureData,
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent,
            location: clientInfo.location,
          });
          
          signatures.push(signature);
        }
      } catch (error) {
        console.error(`Failed to sign document ${documentId}:`, error);
        // Continue with other documents
      }
    }

    return signatures;
  }

  /**
   * Get pending signature requests for a user
   */
  async getPendingSignatureRequests(userId: string): Promise<SignatureRequest[]> {
    // Mock implementation
    return [
      {
        id: 'req_001',
        documentId: 'doc_123',
        userId,
        documentType: 'CONSENT',
        documentContent: 'Sample content',
        requiresWitness: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        notificationsSent: 1,
        signingUrl: '/api/signatures/sign/req_001',
        createdAt: new Date(),
      },
    ];
  }

  /**
   * Send signature reminders
   */
  async sendSignatureReminders(): Promise<{
    remindersSent: number;
    errors: string[];
  }> {
    // Mock implementation - would integrate with notification service
    return {
      remindersSent: 5,
      errors: [],
    };
  }

  // Private helper methods

  /**
   * Generates a secure hash for the digital signature.
   * This hash is used to verify the integrity of the signature data.
   * @param signatureData The raw signature data (e.g., base64 string).
   * @param userId The ID of the user who signed the document.
   * @param documentId The ID of the signed document.
   * @returns A SHA-256 hash string.
   */
  private generateSignatureHash(signatureData: string, userId: string, documentId: string): string {
    const dataToHash = `${signatureData}:${userId}:${documentId}:${this.SIGNATURE_SALT}`;
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
  }

  /**
   * Verifies the integrity of a digital signature by re-generating the hash
   * and comparing it to the stored hash.
   * @param signature The DigitalSignature object to verify.
   * @returns True if the hash matches, false otherwise.
   */
  private verifySignatureIntegrity(signature: DigitalSignature): boolean {
    const rehashed = this.generateSignatureHash(
      signature.signatureData,
      signature.userId,
      signature.documentId
    );
    return rehashed === signature.signatureHash;
  }

  /**
   * Verifies the JWT token associated with the signature.
   * @param token The JWT verification token.
   * @returns True if the token is valid, false otherwise.
   */
  private verifyToken(token: string): boolean {
    try {
      verify(token, this.JWT_SECRET);
      return true;
    } catch (error) {
      logger.error('Token verification failed', { error });
      return false;
    }
  }

  /**
   * Verifies that the signature timestamp is not in the future.
   * @param timestamp The signature timestamp.
   * @returns True if the timestamp is valid, false otherwise.
   */
  private verifyTimestamp(timestamp: Date): boolean {
    return new Date() >= timestamp;
  }

  /**
   * Mocks a verification check to see if the user exists and is valid.
   * In a real system, this would query the database.
   * @param userId The ID of the user.
   * @returns A boolean indicating if the user is verified.
   */
  private async verifyUser(userId: string): Promise<boolean> {
    // Placeholder for a database lookup
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return !!user;
  }

  /**
   * Mocks a check to verify the integrity of the signed document.
   * In a real system, this would involve comparing a stored document hash.
   * @param documentId The ID of the document.
   * @returns A boolean indicating if the document is un-tampered.
   */
  private async verifyDocumentIntegrity(documentId: string): Promise<boolean> {
    // Placeholder for a database lookup or hash comparison
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    return !!document;
  }
}

export const digitalSignatureService = new DigitalSignatureService();
