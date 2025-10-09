// backend/marking-service/src/services/verificationService.ts

import { PrismaClient, VerificationStatus, DocumentStatus, DocumentType } from '@prisma/client';

const prisma = new PrismaClient();

interface VerificationResult {
  isVerified: boolean;
  canRequestMarking: boolean;
  missingDocuments: string[];
  verificationStatus: VerificationStatus;
  message: string;
}

interface OwnerVerificationCheck {
  hasValidIdentity: boolean;
  hasSelfie: boolean;
  hasPropertyOwnership: boolean;
  allDocumentsApproved: boolean;
  isUserVerified: boolean;
}

export class VerificationService {
  /**
   * Verify if a property owner can request a marking job
   */
  async verifyPropertyOwner(userId: string, propertyId?: string): Promise<VerificationResult> {
    try {
      // Get user verification status
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          verificationStatus: true,
          role: true,
          isPremium: true,
          premiumExpiresAt: true,
        },
      });

      if (!user) {
        return {
          isVerified: false,
          canRequestMarking: false,
          missingDocuments: [],
          verificationStatus: VerificationStatus.PENDING,
          message: 'User not found',
        };
      }

      // Check if user role is allowed (OWNER or AGENT)
      if (user.role !== 'OWNER' && user.role !== 'AGENT') {
        return {
          isVerified: false,
          canRequestMarking: false,
          missingDocuments: [],
          verificationStatus: user.verificationStatus,
          message: 'Only property owners and agents can request marking jobs',
        };
      }

      // For renters, check premium status
      if (user.role === 'RENTER') {
        const isPremiumActive = user.isPremium && 
          user.premiumExpiresAt && 
          new Date(user.premiumExpiresAt) > new Date();

        if (!isPremiumActive) {
          return {
            isVerified: false,
            canRequestMarking: false,
            missingDocuments: [],
            verificationStatus: user.verificationStatus,
            message: 'Renters must have an active premium subscription to request marking jobs',
          };
        }
      }

      // Get user documents
      const documents = await prisma.document.findMany({
        where: {
          userId,
          ...(propertyId && { OR: [{ propertyId }, { propertyId: null }] }),
        },
      });

      const verificationCheck = this.checkOwnerDocuments(documents);

      // Build missing documents list
      const missingDocuments: string[] = [];

      if (!verificationCheck.hasValidIdentity) {
        missingDocuments.push('Valid identity document (NIN, BVN, Passport, Voter\'s Card, or Driver\'s License)');
      }

      if (!verificationCheck.hasSelfie) {
        missingDocuments.push('Selfie verification photo');
      }

      if (propertyId && !verificationCheck.hasPropertyOwnership) {
        missingDocuments.push('Property ownership document');
      }

      // Determine if owner can request marking
      const canRequestMarking = 
        user.verificationStatus === VerificationStatus.VERIFIED &&
        verificationCheck.allDocumentsApproved &&
        missingDocuments.length === 0;

      return {
        isVerified: user.verificationStatus === VerificationStatus.VERIFIED,
        canRequestMarking,
        missingDocuments,
        verificationStatus: user.verificationStatus,
        message: canRequestMarking
          ? 'User is verified and can request marking jobs'
          : missingDocuments.length > 0
          ? `Missing required documents: ${missingDocuments.join(', ')}`
          : 'User verification pending or documents not approved',
      };
    } catch (error) {
      console.error('Error verifying property owner:', error);
      throw new Error('Failed to verify property owner');
    }
  }

  /**
   * Check owner documents for completeness
   */
  private checkOwnerDocuments(documents: any[]): OwnerVerificationCheck {
    const identityDocs = documents.filter(doc =>
      [
        DocumentType.NIN,
        DocumentType.BVN,
        DocumentType.PASSPORT,
        DocumentType.VOTERS_CARD,
        DocumentType.DRIVERS_LICENSE,
      ].includes(doc.documentType)
    );

    const selfieDocs = documents.filter(doc => doc.documentType === DocumentType.SELFIE);
    const ownershipDocs = documents.filter(doc => doc.documentType === DocumentType.OWNERSHIP_DOCUMENT);

    const hasValidIdentity = identityDocs.some(doc => doc.status === DocumentStatus.APPROVED);
    const hasSelfie = selfieDocs.some(doc => doc.status === DocumentStatus.APPROVED);
    const hasPropertyOwnership = ownershipDocs.some(doc => doc.status === DocumentStatus.APPROVED);

    const allDocumentsApproved = documents.every(
      doc => doc.status === DocumentStatus.APPROVED || doc.status === DocumentStatus.EXPIRED
    );

    return {
      hasValidIdentity,
      hasSelfie,
      hasPropertyOwnership,
      allDocumentsApproved,
      isUserVerified: hasValidIdentity && hasSelfie,
    };
  }

  /**
   * Verify if an agent/renter can accept marking jobs
   */
  async verifyMarker(userId: string): Promise<VerificationResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          verificationStatus: true,
          role: true,
          isPremium: true,
          premiumExpiresAt: true,
          isAvailableForMarking: true,
          agentReliabilityScore: true,
        },
      });

      if (!user) {
        return {
          isVerified: false,
          canRequestMarking: false,
          missingDocuments: [],
          verificationStatus: VerificationStatus.PENDING,
          message: 'User not found',
        };
      }

      // Check role eligibility
      const isEligibleRole = user.role === 'AGENT' || 
        (user.role === 'RENTER' && user.isPremium && 
         user.premiumExpiresAt && new Date(user.premiumExpiresAt) > new Date());

      if (!isEligibleRole) {
        return {
          isVerified: false,
          canRequestMarking: false,
          missingDocuments: [],
          verificationStatus: user.verificationStatus,
          message: 'Only verified agents or premium renters can accept marking jobs',
        };
      }

      // Check if user is available for marking
      if (!user.isAvailableForMarking) {
        return {
          isVerified: user.verificationStatus === VerificationStatus.VERIFIED,
          canRequestMarking: false,
          missingDocuments: [],
          verificationStatus: user.verificationStatus,
          message: 'User has not enabled availability for marking jobs',
        };
      }

      // Get user documents
      const documents = await prisma.document.findMany({
        where: { userId },
      });

      const verificationCheck = this.checkMarkerDocuments(documents);

      const missingDocuments: string[] = [];
      if (!verificationCheck.hasValidIdentity) {
        missingDocuments.push('Valid identity document');
      }
      if (!verificationCheck.hasSelfie) {
        missingDocuments.push('Selfie verification');
      }

      const canAcceptJobs = 
        user.verificationStatus === VerificationStatus.VERIFIED &&
        verificationCheck.allDocumentsApproved &&
        user.isAvailableForMarking &&
        missingDocuments.length === 0;

      return {
        isVerified: user.verificationStatus === VerificationStatus.VERIFIED,
        canRequestMarking: canAcceptJobs,
        missingDocuments,
        verificationStatus: user.verificationStatus,
        message: canAcceptJobs
          ? 'User is verified and can accept marking jobs'
          : `Cannot accept marking jobs: ${missingDocuments.join(', ') || 'Verification incomplete'}`,
      };
    } catch (error) {
      console.error('Error verifying marker:', error);
      throw new Error('Failed to verify marker');
    }
  }

  /**
   * Check marker documents
   */
  private checkMarkerDocuments(documents: any[]): OwnerVerificationCheck {
    const identityDocs = documents.filter(doc =>
      [
        DocumentType.NIN,
        DocumentType.BVN,
        DocumentType.PASSPORT,
        DocumentType.VOTERS_CARD,
        DocumentType.DRIVERS_LICENSE,
      ].includes(doc.documentType)
    );

    const selfieDocs = documents.filter(doc => doc.documentType === DocumentType.SELFIE);

    const hasValidIdentity = identityDocs.some(doc => doc.status === DocumentStatus.APPROVED);
    const hasSelfie = selfieDocs.some(doc => doc.status === DocumentStatus.APPROVED);

    const allDocumentsApproved = documents.every(
      doc => doc.status === DocumentStatus.APPROVED || doc.status === DocumentStatus.EXPIRED
    );

    return {
      hasValidIdentity,
      hasSelfie,
      hasPropertyOwnership: true, // Not required for markers
      allDocumentsApproved,
      isUserVerified: hasValidIdentity && hasSelfie,
    };
  }

  /**
   * Create virtual account for user if not exists
   */
  async ensureVirtualAccount(userId: string): Promise<{ accountNumber: string; accountName: string }> {
    try {
      // Check if user already has a virtual account
      const existingAccount = await prisma.virtualAccount.findFirst({
        where: {
          userId,
          propertyId: null, // User-level account
          isActive: true,
        },
      });

      if (existingAccount) {
        return {
          accountNumber: existingAccount.accountNumber,
          accountName: existingAccount.accountName,
        };
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate virtual account details (simplified - integrate with Flutterwave)
      const accountNumber = this.generateAccountNumber();
      const accountName = user.name || user.email.split('@')[0];

      // Create virtual account
      const virtualAccount = await prisma.virtualAccount.create({
        data: {
          accountNumber,
          accountName,
          bankCode: '000', // Flutterwave bank code
          userId,
          isActive: true,
        },
      });

      return {
        accountNumber: virtualAccount.accountNumber,
        accountName: virtualAccount.accountName,
      };
    } catch (error) {
      console.error('Error ensuring virtual account:', error);
      throw new Error('Failed to create virtual account');
    }
  }

  /**
   * Generate unique account number (simplified)
   */
  private generateAccountNumber(): string {
    return '2' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }

  /**
   * Verify property ownership
   */
  async verifyPropertyOwnership(userId: string, propertyId: string): Promise<boolean> {
    try {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { ownerId: true, agentId: true },
      });

      if (!property) {
        return false;
      }

      // Check if user is owner or authorized agent
      return property.ownerId === userId || property.agentId === userId;
    } catch (error) {
      console.error('Error verifying property ownership:', error);
      return false;
    }
  }
}

export default new VerificationService();