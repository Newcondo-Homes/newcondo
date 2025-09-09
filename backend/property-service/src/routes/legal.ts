// File: backend/property-service/src/routes/legal.ts

import express from 'express';
import { legalController } from '../controllers/legalController';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { upload } from '../../../shared/src/utils/upload';
import { legalValidation } from '../middleware/legalValidation';
import { adminMiddleware } from '../../../shared/src/middleware/admin';
import { rateLimiter } from '../../../shared/src/middleware/rateLimiter';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Apply rate limiting
router.use(rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: 'Too many legal document requests, please try again later.'
}));


// Upload ownership document
router.post(
  '/properties/:propertyId/documents/ownership',
  upload.single('document'),
  legalValidation.validateOwnershipDocument,
  legalController.uploadOwnershipDocument
);

// Upload consent document (for agents)
router.post(
  '/properties/:propertyId/documents/consent',
  upload.single('document'),
  legalValidation.validateConsentDocument,
  legalController.uploadConsentDocument
);

// Upload undertaking document
router.post(
  '/properties/:propertyId/documents/undertaking',
  upload.single('document'),
  legalValidation.validateUndertakingDocument,
  legalController.uploadUndertakingDocument
);

// Get property documents
router.get(
  '/properties/:propertyId/documents',
  legalController.getPropertyDocuments
);

// Verify property ownership
router.post(
  '/properties/:propertyId/verify-ownership',
  legalController.verifyPropertyOwnership
);

// Get required documents for property
router.get(
  '/properties/:propertyId/required-documents',
  legalController.getRequiredDocuments
);

// Admin routes
router.patch(
  '/documents/:documentId/status',
  adminMiddleware,
  legalValidation.validateDocumentStatusUpdate,
  legalController.updateDocumentStatus
);


// Document upload routes
router.post(
  '/properties/:propertyId/documents',
  legalValidation.validateDocumentUpload,
  legalController.uploadDocument
);

// Get property documents
router.get(
  '/properties/:propertyId/documents',
  legalValidation.validatePropertyId,
  legalController.getPropertyDocuments
);

// Get user documents
router.get(
  '/users/documents',
  legalValidation.validateGetUserDocuments,
  legalController.getUserDocuments
);

// Update document
router.put(
  '/documents/:documentId',
  legalValidation.validateDocumentUpdate,
  legalController.updateDocument
);

// Delete document
router.delete(
  '/documents/:documentId',
  legalValidation.validateDocumentId,
  legalController.deleteDocument
);

// Get required documents for property
router.get(
  '/properties/:propertyId/required-documents',
  legalValidation.validatePropertyId,
  legalController.getRequiredDocuments
);

// Terms and conditions
router.post(
  '/terms/accept',
  legalValidation.validateTermsAcceptance,
  legalController.acceptTermsAndConditions
);

// Digital signature
router.post(
  '/documents/:documentId/signature',
  legalValidation.validateDigitalSignature,
  legalController.uploadDigitalSignature
);

// Document templates
router.get(
  '/templates',
  legalValidation.validateGetTemplates,
  legalController.getDocumentTemplates
);

// Compliance status
router.get(
  '/properties/:propertyId/compliance',
  legalValidation.validatePropertyId,
  legalController.checkComplianceStatus
);

export default router;