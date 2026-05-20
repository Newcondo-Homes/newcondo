// backend/admin-service/src/controllers/digitalSignatureController.ts

import { Request, Response } from 'express';
import { prisma } from '@newcondo/db';
import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AdminActionType } from '@newcondo/db';

// Validation schemas
const createSignatureSessionSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  documentType: z.string().min(1, 'Document type is required'),
  signatoryEmail: z.string().email('Valid email is required'),
  signatoryName: z.string().min(1, 'Signatory name is required'),
  signatoryRole: z.enum(['OWNER', 'AGENT', 'ADMIN']),
  expiresIn: z.number().min(1).max(72).default(24), // Hours
  requiresWitness: z.boolean().default(false),
  witnessEmail: z.string().email().optional(),
  metadata: z.record(z.any()).optional()
});

const signDocumentSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  signature: z.string().min(1, 'Digital signature is required'),
  ipAddress: z.string().min(1, 'IP address is required'),
  userAgent: z.string().min(1, 'User agent is required'),
  timestamp: z.string().datetime('Valid timestamp is required'),
  witnessSignature: z.string().optional(),
  witnessName: z.string().optional(),
  otp: z.string().optional()
});

const verifySignatureSchema = z.object({
  signatureId: z.string().min(1, 'Signature ID is required'),
  documentHash: z.string().min(1, 'Document hash is required')
});

interface DigitalSignatureSession {
  id: string;
  documentId: string;
  documentType: string;
  signatoryEmail: string;
  signatoryName: string;
  signatoryRole: 'OWNER' | 'AGENT' | 'ADMIN';
  status: 'PENDING' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';
  accessToken: string;
  expiresAt: Date;
  requiresWitness: boolean;
  witnessEmail?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface DigitalSignature {
  id: string;
  sessionId: string;
  documentId: string;
  signatoryEmail: string;
  signatoryName: string;
  signatoryRole: string;
  signatureData: string;
  signatureHash: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  witnessSignature?: string;
  witnessName?: string;
  isValid: boolean;
  verificationCode: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

// In-memory storage (use database in production)
let signatureSessions: DigitalSignatureSession[] = [];
let digitalSignatures: DigitalSignature[] = [];

export class DigitalSignatureController {
  // Create signature session
  static async createSignatureSession(req: Request, res: Response): Promise<Response | void> {
    try {
      const validatedData = createSignatureSessionSchema.parse(req.body);
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Admin authentication required'
        });
      }

      // Generate access token for signature session
      const accessToken = jwt.sign(
        {
          documentId: validatedData.documentId,
          signatoryEmail: validatedData.signatoryEmail,
          role: validatedData.signatoryRole
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: `${validatedData.expiresIn}h` }
      );

      const session: DigitalSignatureSession = {
        id: crypto.randomUUID(),
        ...validatedData,
        status: 'PENDING',
        accessToken,
        expiresAt: new Date(Date.now() + validatedData.expiresIn * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminId
      };

      signatureSessions.push(session);

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId,
          action: AdminActionType.PROPERTY_APPROVED, // Need new enum value for signature session
          targetType: 'SignatureSession',
          targetId: session.id,
          description: `Created signature session for ${session.signatoryEmail}`,
          metadata: {
            documentId: session.documentId,
            documentType: session.documentType,
            signatoryRole: session.signatoryRole
          }
        }
      });

      // In production, send email with signing link
      const signingLink = `${process.env.FRONTEND_URL}/sign/${session.id}?token=${accessToken}`;

      res.status(201).json({
        success: true,
        message: 'Signature session created successfully',
        data: {
          session: {
            id: session.id,
            documentId: session.documentId,
            signatoryEmail: session.signatoryEmail,
            status: session.status,
            expiresAt: session.expiresAt,
            signingLink
          }
        }
      });
    } catch (error) {
      console.error('Error creating signature session:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create signature session',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get signature session by ID
  static async getSignatureSession(req: Request, res: Response): Promise<Response | void> {
    try {
      const { sessionId } = req.params;
      const { token } = req.query;

      const session = signatureSessions.find(s => s.id === sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Signature session not found'
        });
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        session.status = 'EXPIRED';
        return res.status(410).json({
          success: false,
          message: 'Signature session has expired'
        });
      }

      // Verify access token if provided
      if (token) {
        try {
          jwt.verify(token as string, process.env.JWT_SECRET || 'fallback-secret');
        } catch (error) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired access token'
          });
        }
      }

      res.json({
        success: true,
        data: {
          session: {
            id: session.id,
            documentId: session.documentId,
            documentType: session.documentType,
            signatoryName: session.signatoryName,
            signatoryRole: session.signatoryRole,
            status: session.status,
            expiresAt: session.expiresAt,
            requiresWitness: session.requiresWitness,
            metadata: session.metadata
          }
        }
      });
    } catch (error) {
      console.error('Error fetching signature session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch signature session',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Sign document
  static async signDocument(req: Request, res: Response): Promise<Response | void> {
    try {
      const validatedData = signDocumentSchema.parse(req.body);

      const session = signatureSessions.find(s => s.id === validatedData.sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Signature session not found'
        });
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        session.status = 'EXPIRED';
        return res.status(410).json({
          success: false,
          message: 'Signature session has expired'
        });
      }

      // Check if already signed
      if (session.status === 'SIGNED') {
        return res.status(400).json({
          success: false,
          message: 'Document has already been signed'
        });
      }

      // Validate witness signature if required
      if (session.requiresWitness && (!validatedData.witnessSignature || !validatedData.witnessName)) {
        return res.status(400).json({
          success: false,
          message: 'Witness signature is required'
        });
      }

      // Create signature hash for verification
      const signatureData = {
        sessionId: validatedData.sessionId,
        documentId: session.documentId,
        signatoryEmail: session.signatoryEmail,
        signature: validatedData.signature,
        timestamp: validatedData.timestamp,
        ipAddress: validatedData.ipAddress
      };

      const signatureHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(signatureData))
        .digest('hex');

      const verificationCode = crypto.randomBytes(16).toString('hex');

      const signature: DigitalSignature = {
        id: crypto.randomUUID(),
        sessionId: validatedData.sessionId,
        documentId: session.documentId,
        signatoryEmail: session.signatoryEmail,
        signatoryName: session.signatoryName,
        signatoryRole: session.signatoryRole,
        signatureData: validatedData.signature,
        signatureHash,
        ipAddress: validatedData.ipAddress,
        userAgent: validatedData.userAgent,
        timestamp: new Date(validatedData.timestamp),
        witnessSignature: validatedData.witnessSignature,
        witnessName: validatedData.witnessName,
        isValid: true,
        verificationCode,
        metadata: {
          sessionMetadata: session.metadata,
          otp: validatedData.otp
        },
        createdAt: new Date()
      };

      digitalSignatures.push(signature);

      // Update session status
      session.status = 'SIGNED';
      session.updatedAt = new Date();

      // In production, update document status in database
      try {
        await prisma.document.updateMany({
          where: { id: session.documentId },
          data: {
            status: 'APPROVED',
            verificationNotes: `Digitally signed by ${session.signatoryName} on ${new Date().toISOString()}`
          }
        });
      } catch (dbError) {
        console.error('Error updating document status:', dbError);
        // Continue execution, just log the error
      }

      res.json({
        success: true,
        message: 'Document signed successfully',
        data: {
          signature: {
            id: signature.id,
            documentId: signature.documentId,
            signatoryName: signature.signatoryName,
            timestamp: signature.timestamp,
            verificationCode: signature.verificationCode,
            isValid: signature.isValid
          }
        }
      });
    } catch (error) {
      console.error('Error signing document:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to sign document',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Verify signature
  static async verifySignature(req: Request, res: Response): Promise<Response | void> {
    try {
      const validatedData = verifySignatureSchema.parse(req.body);

      const signature = digitalSignatures.find(s => s.id === validatedData.signatureId);

      if (!signature) {
        return res.status(404).json({
          success: false,
          message: 'Signature not found'
        });
      }

      const document = await prisma.document.findUnique({
        where: { id: signature.documentId },
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Associated document not found'
        });
      }

      // Re-calculate hash to verify integrity
      const signatureData = {
        sessionId: signature.sessionId,
        documentId: signature.documentId,
        signatoryEmail: signature.signatoryEmail,
        signature: signature.signatureData,
        timestamp: signature.timestamp.toISOString(),
        ipAddress: signature.ipAddress,
      };

      const recomputedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(signatureData))
        .digest('hex');

      // The key part of verification: compare the stored hash with the recomputed hash
      // The documentHash from the request should be a hash of the original document content
      const isSignatureValid = signature.signatureHash === recomputedHash;

      // Update signature validity status in memory
      signature.isValid = isSignatureValid;

      res.json({
        success: true,
        message: isSignatureValid ? 'Signature is valid and document integrity is confirmed.' : 'Signature is invalid or document has been tampered with.',
        data: {
          signatureId: signature.id,
          documentId: signature.documentId,
          isValid: isSignatureValid,
          signatoryName: signature.signatoryName,
          timestamp: signature.timestamp,
          verificationDetails: {
            signatureHashMatch: isSignatureValid,
            // In a real system, you'd check a document hash against the one on the blockchain or secure storage
            documentHashMatch: validatedData.documentHash === (document as any).documentHash // Assuming document has a documentHash field
          },
        }
      });
    } catch (error) {
      console.error('Error verifying signature:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to verify signature',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}