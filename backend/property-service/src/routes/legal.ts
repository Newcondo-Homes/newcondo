// File: backend/property-service/src/routes/legal.ts

import express from 'express';
import { legalController } from '../controllers/legalController';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { upload } from '../../../shared/src/utils/upload';
import { legalValidation } from '../middleware/legalValidation';
import { adminMiddleware } from '../../../shared/src/middleware/admin';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

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

export default router;