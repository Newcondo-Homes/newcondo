import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserType, PropertyType, DocumentType } from '@newcondo/db';

// Terms and conditions acceptance schema
const termsAcceptanceSchema = z.object({
  userId: z.string().cuid(),
  termsVersion: z.string().min(1),
  acceptedAt: z.string().datetime().transform(str => new Date(str)),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  documentType: z.enum(['TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'CONSENT_AGREEMENT']),
});

// Legal undertaking schema
const legalUndertakingSchema = z.object({
  userId: z.string().cuid(),
  propertyId: z.string().cuid().optional(),
  undertakingType: z.enum(['OWNERSHIP_PROOF', 'AGENT_CONSENT', 'PROPERTY_ACCURACY', 'LEGAL_RESPONSIBILITY']),
  content: z.string().min(10),
  digitalSignature: z.string().min(1),
  witnessInfo: z.object({
    witnessName: z.string().min(1).optional(),
    witnessEmail: z.string().email().optional(),
    witnessPhone: z.string().optional(),
  }).optional(),
  acceptedTerms: z.boolean().refine(val => val === true, {
    message: 'Legal undertaking terms must be accepted',
  }),
});

// Digital signature schema
const digitalSignatureSchema = z.object({
  documentId: z.string().cuid(),
  signatureData: z.string().min(1), // Base64 encoded signature or signature hash
  signatureMethod: z.enum(['ELECTRONIC', 'BIOMETRIC', 'SMS_OTP', 'EMAIL_OTP']),
  signerInfo: z.object({
    signerName: z.string().min(1),
    signerEmail: z.string().email(),
    signerPhone: z.string().optional(),
    signedAt: z.string().datetime().transform(str => new Date(str)),
    ipAddress: z.string().ip().optional(),
    userAgent: z.string().optional(),
  }),
  verificationData: z.object({
    otpCode: z.string().optional(),
    biometricHash: z.string().optional(),
    deviceFingerprint: z.string().optional(),
  }).optional(),
});

// Compliance check schema
const complianceCheckSchema = z.object({
  userId: z.string().cuid(),
  propertyId: z.string().cuid().optional(),
  checkType: z.enum(['DOCUMENT_COMPLETENESS', 'LEGAL_REQUIREMENTS', 'VERIFICATION_STATUS', 'SIGNATURE_VALIDITY']),
  requiredDocuments: z.array(z.nativeEnum(DocumentType)).optional(),
});

// Agent permission schema
const agentPermissionSchema = z.object({
  agentId: z.string().cuid(),
  ownerId: z.string().cuid(),
  propertyId: z.string().cuid(),
  permissionType: z.enum(['LIST_PROPERTY', 'COLLECT_RENT', 'SHOW_PROPERTY', 'FULL_MANAGEMENT']),
  permissions: z.object({
    canListProperty: z.boolean().default(false),
    canCollectRent: z.boolean().default(false),
    canShowProperty: z.boolean().default(false),
    canModifyListing: z.boolean().default(false),
    canReceiveInquiries: z.boolean().default(true),
    validUntil: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  }),
  consentDocumentUrl: z.string().url(),
  digitalSignature: z.string().min(1),
  witnessSignature: z.string().optional(),
});

// Privacy policy compliance schema
const privacyComplianceSchema = z.object({
  userId: z.string().cuid(),
  dataProcessingConsent: z.object({
    marketing: z.boolean(),
    analytics: z.boolean(),
    thirdPartySharing: z.boolean(),
    locationTracking: z.boolean(),
    profileSharing: z.boolean(),
  }),
  consentVersion: z.string().min(1),
  consentDate: z.string().datetime().transform(str => new Date(str)),
  withdrawalRights: z.boolean().refine(val => val === true, {
    message: 'User must acknowledge data withdrawal rights',
  }),
});

// Legal document requirement definitions by user type and property type
const LEGAL_REQUIREMENTS = {
  [UserType.LANDLORD]: {
    required: [
      DocumentType.OWNERSHIP_DOCUMENT,
      DocumentType.NIN,
      DocumentType.SELFIE,
    ],
    optional: [DocumentType.UTILITY_BILL],
  },
  [UserType.AGENT]: {
    required: [
      DocumentType.CONSENT_DOCUMENT,
      DocumentType.NIN,
      DocumentType.SELFIE,
      DocumentType.BUSINESS_REGISTRATION,
    ],
    optional: [DocumentType.TAX_CERTIFICATE],
  },
  [UserType.PROPERTY_MANAGER]: {
    required: [
      DocumentType.BUSINESS_REGISTRATION,
      DocumentType.NIN,
      DocumentType.SELFIE,
      DocumentType.TAX_CERTIFICATE,
    ],
    optional: [DocumentType.BANK_STATEMENT],
  },
  [UserType.RENTER]: {
    required: [
      DocumentType.NIN,
      DocumentType.SELFIE,
    ],
    optional: [DocumentType.UTILITY_BILL, DocumentType.BANK_STATEMENT],
  },
};

// Validation middleware functions
export const validateTermsAcceptance = (req: Request, res: Response, next: NextFunction) => {
  try {
    termsAcceptanceSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Terms acceptance validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
};

export const validateLegalUndertaking = (req: Request, res: Response, next: NextFunction) => {
  try {
    legalUndertakingSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Legal undertaking validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
};

export const validateDigitalSignature = (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = digitalSignatureSchema.parse(req.body);
    
    // Additional validation for signature methods
    const { signatureMethod, verificationData } = parsed;
    
    if ((signatureMethod === 'SMS_OTP' || signatureMethod === 'EMAIL_OTP') && !verificationData?.otpCode) {
      return res.status(400).json({
        success: false,
        error: 'OTP code is required for OTP-based signatures',
      });
    }

    if (signatureMethod === 'BIOMETRIC' && !verificationData?.biometricHash) {
      return res.status(400).json({
        success: false,
        error: 'Biometric data is required for biometric signatures',
      });
    }

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Digital signature validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
};

export const validateComplianceCheck = (req: Request, res: Response, next: NextFunction) => {
  try {
    complianceCheckSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Compliance check validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
};

export const validateAgentPermission = (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = agentPermissionSchema.parse(req.body);
    
    // Validate permission logic
    const { permissions, permissionType } = parsed;
    
    if (permissionType === 'FULL_MANAGEMENT') {
      // Full management should have all permissions
      if (!permissions.canListProperty || !permissions.canCollectRent || !permissions.canShowProperty) {
        return res.status(400).json({
          success: false,
          error: 'Full management permission requires all individual permissions',
        });
      }
    }

    // Check if validUntil is in the future
    if (permissions.validUntil && permissions.validUntil <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Permission validity date must be in the future',
      });
    }

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Agent permission validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
};

export const validatePrivacyCompliance = (req: Request, res: Response, next: NextFunction) => {
  try {
    privacyComplianceSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Privacy compliance validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
};

// Legal requirement checker middleware
export const checkLegalRequirements = (userType: UserType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const requirements = LEGAL_REQUIREMENTS[userType];
    
    if (!requirements) {
      return res.status(400).json({
        success: false,
        error: `Unknown user type: ${userType}`,
      });
    }

    // Store requirements in request for use by controllers
    req.legalRequirements = requirements;
    next();
  };
};

// Document completeness validator
export const validateDocumentCompleteness = async (req: Request, res: Response, next: NextFunction) => {
  const { userType, requiredDocuments } = req.body;
  
  if (!userType || !Object.values(UserType).includes(userType)) {
    return res.status(400).json({
      success: false,
      error: 'Valid user type is required',
    });
  }

  const requirements = LEGAL_REQUIREMENTS[userType as UserType];
  const missing = requirements.required.filter(doc => !requiredDocuments?.includes(doc));
  
  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing required documents',
      missingDocuments: missing,
    });
  }

  next();
};

// Age verification middleware (for legal capacity)
export const validateLegalAge = (req: Request, res: Response, next: NextFunction) => {
  const { dateOfBirth } = req.body;
  
  if (!dateOfBirth) {
    return res.status(400).json({
      success: false,
      error: 'Date of birth is required for legal verification',
    });
  }

  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 18) {
    return res.status(400).json({
      success: false,
      error: 'User must be 18 years or older for legal capacity',
    });
  }

  next();
};

// Signature validity checker
export const validateSignatureValidity = (req: Request, res: Response, next: NextFunction) => {
  const { signedAt, expiresAt } = req.body;
  
  if (signedAt && new Date(signedAt) > new Date()) {
    return res.status(400).json({
      success: false,
      error: 'Signature date cannot be in the future',
    });
  }

  if (expiresAt && new Date(expiresAt) <= new Date()) {
    return res.status(400).json({
      success: false,
      error: 'Document signature has expired',
    });
  }

  next();
};

// Business registration validation for B2B users
export const validateBusinessRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { userType, businessRegNumber, companyName } = req.body;
  
  if (userType === UserType.PROPERTY_MANAGER || userType === UserType.AGENT) {
    if (!businessRegNumber || !companyName) {
      return res.status(400).json({
        success: false,
        error: 'Business registration details are required for business accounts',
      });
    }

    // Validate Nigerian CAC registration format (if applicable)
    if (businessRegNumber && !/^(RC|BN|IT)\d+$/.test(businessRegNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business registration number format',
      });
    }
  }

  next();
};

// Consent withdrawal validation
export const validateConsentWithdrawal = (req: Request, res: Response, next: NextFunction) => {
  const { withdrawalType, reason, confirmWithdrawal } = req.body;
  
  if (!withdrawalType || !['DATA_PROCESSING', 'MARKETING', 'FULL_CONSENT'].includes(withdrawalType)) {
    return res.status(400).json({
      success: false,
      error: 'Valid withdrawal type is required',
    });
  }

  if (!confirmWithdrawal) {
    return res.status(400).json({
      success: false,
      error: 'Consent withdrawal must be confirmed',
    });
  }

  next();
};

// Extend Request interface to include legal requirements
declare global {
  namespace Express {
    interface Request {
      legalRequirements?: {
        required: DocumentType[];
        optional: DocumentType[];
      };
    }
  }
}

export default {
  validateTermsAcceptance,
  validateLegalUndertaking,
  validateDigitalSignature,
  validateComplianceCheck,
  validateAgentPermission,
  validatePrivacyCompliance,
  checkLegalRequirements,
  validateDocumentCompleteness,
  validateLegalAge,
  validateSignatureValidity,
  validateBusinessRegistration,
  validateConsentWithdrawal,
};