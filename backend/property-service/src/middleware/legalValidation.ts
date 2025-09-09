// File: backend/property-service/src/middleware/legalValidation.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { standardResponse } from '../../../shared/src/utils/response';
import { DocumentType, DocumentStatus } from '@newcondo/db';

const ownershipDocumentSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  documentNumber: z.string().optional(),
});

const documentStatusUpdateSchema = z.object({
  status: z.nativeEnum(DocumentStatus),
  verificationNotes: z.string().optional(),
});

export class LegalValidation {
  validateOwnershipDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      
      if (!propertyId) {
        return res.status(400).json(
          standardResponse(false, 'Property ID is required', null, 'PROPERTY_ID_REQUIRED')
        );
      }

      const validation = ownershipDocumentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(
          standardResponse(false, 'Invalid ownership document data', validation.error.errors, 'VALIDATION_ERROR')
        );
      }

      // Validate file
      if (!req.file) {
        return res.status(400).json(
          standardResponse(false, 'Document file is required', null, 'DOCUMENT_FILE_REQUIRED')
        );
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json(
          standardResponse(false, 'Invalid file type. Only JPEG, PNG, and PDF are allowed', null, 'INVALID_FILE_TYPE')
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        return res.status(400).json(
          standardResponse(false, 'File size too large. Maximum size is 5MB', null, 'FILE_SIZE_EXCEEDED')
        );
      }

      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json(
        standardResponse(false, 'Validation failed', null, 'VALIDATION_FAILED')
      );
    }
  }

  validateConsentDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      
      if (!propertyId) {
        return res.status(400).json(
          standardResponse(false, 'Property ID is required', null, 'PROPERTY_ID_REQUIRED')
        );
      }

      // Validate file
      if (!req.file) {
        return res.status(400).json(
          standardResponse(false, 'Consent document file is required', null, 'DOCUMENT_FILE_REQUIRED')
        );
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json(
          standardResponse(false, 'Invalid file type. Only JPEG, PNG, and PDF are allowed', null, 'INVALID_FILE_TYPE')
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        return res.status(400).json(
          standardResponse(false, 'File size too large. Maximum size is 5MB', null, 'FILE_SIZE_EXCEEDED')
        );
      }

      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json(
        standardResponse(false, 'Validation failed', null, 'VALIDATION_FAILED')
      );
    }
  }

  validateUndertakingDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      
      if (!propertyId) {
        return res.status(400).json(
          standardResponse(false, 'Property ID is required', null, 'PROPERTY_ID_REQUIRED')
        );
      }

      // Validate file
      if (!req.file) {
        return res.status(400).json(
          standardResponse(false, 'Undertaking document file is required', null, 'DOCUMENT_FILE_REQUIRED')
        );
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json(
          standardResponse(false, 'Invalid file type. Only JPEG, PNG, and PDF are allowed', null, 'INVALID_FILE_TYPE')
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        return res.status(400).json(
          standardResponse(false, 'File size too large. Maximum size is 5MB', null, 'FILE_SIZE_EXCEEDED')
        );
      }

      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json(
        standardResponse(false, 'Validation failed', null, 'VALIDATION_FAILED')
      );
    }
  }

  validateDocumentStatusUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      
      if (!documentId) {
        return res.status(400).json(
          standardResponse(false, 'Document ID is required', null, 'DOCUMENT_ID_REQUIRED')
        );
      }

      const validation = documentStatusUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(
          standardResponse(false, 'Invalid document status update data', validation.error.errors, 'VALIDATION_ERROR')
        );
      }

      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json(
        standardResponse(false, 'Validation failed', null, 'VALIDATION_FAILED')
      );
    }
  }
}

class LegalValidationn {
  // Handle validation errors
  private handleValidationErrors(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, 'Validation error', 400, errors.array());
    }
    next();
  }

  // Validate document upload
  validateDocumentUpload = [
    param('propertyId')
      .isString()
      .isLength({ min: 1 })
      .withMessage('Property ID is required'),

    body('documentType')
      .isIn(Object.values(DocumentType))
      .withMessage('Invalid document type'),

    body('documentNumber')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Document number must be between 1 and 100 characters'),

    body('fileName')
      .optional()
      .isString()
      .isLength({ min: 1, max: 255 })
      .withMessage('File name must be between 1 and 255 characters'),

    body('fileUrl')
      .optional()
      .isURL()
      .withMessage('File URL must be a valid URL'),

    body('fileSizeBytes')
      .optional()
      .isInt({ min: 1, max: 50 * 1024 * 1024 }) // Max 50MB
      .withMessage('File size must be between 1 byte and 50MB'),

    body('mimeType')
      .optional()
      .matches(/^(image\/(jpeg|jpg|png|gif|webp)|application\/pdf)$/)
      .withMessage('MIME type must be a valid image format or PDF'),

    // Validate that either documentNumber OR file details are provided
    body().custom((value, { req }) => {
      const { documentNumber, fileName, fileUrl } = req.body;
      
      if (!documentNumber && (!fileName || !fileUrl)) {
        throw new Error('Either document number or file upload details must be provided');
      }
      return true;
    }),

    this.handleValidationErrors
  ];

  // Validate property ID parameter
  validatePropertyId = [
    param('propertyId')
      .isString()
      .isLength({ min: 1 })
      .withMessage('Property ID is required'),

    this.handleValidationErrors
  ];

  // Validate document ID parameter
  validateDocumentId = [
    param('documentId')
      .isString()
      .isLength({ min: 1 })
      .withMessage('Document ID is required'),

    this.handleValidationErrors
  ];

  // Validate get user documents query
  validateGetUserDocuments = [
    query('documentType')
      .optional()
      .isIn(Object.values(DocumentType))
      .withMessage('Invalid document type'),

    query('status')
      .optional()
      .isIn(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'])
      .withMessage('Invalid document status'),

    this.handleValidationErrors
  ];

  // Validate document update
  validateDocumentUpdate = [
    param('documentId')
      .isString()
      .isLength({ min: 1 })
      .withMessage('Document ID is required'),

    body('documentNumber')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Document number must be between 1 and 100 characters'),

    body('fileName')
      .optional()
      .isString()
      .isLength({ min: 1, max: 255 })
      .withMessage('File name must be between 1 and 255 characters'),

    body('fileUrl')
      .optional()
      .isURL()
      .withMessage('File URL must be a valid URL'),

    body('fileSizeBytes')
      .optional()
      .isInt({ min: 1, max: 50 * 1024 * 1024 })
      .withMessage('File size must be between 1 byte and 50MB'),

    body('mimeType')
      .optional()
      .matches(/^(image\/(jpeg|jpg|png|gif|webp)|application\/pdf)$/)
      .withMessage('MIME type must be a valid image format or PDF'),

    this.handleValidationErrors
  ];

  // Validate terms acceptance
  validateTermsAcceptance = [
    body('termsVersion')
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('Terms version is required and must be valid'),

    body('acceptedAt')
      .isISO8601()
      .withMessage('Accepted date must be a valid ISO 8601 date'),

    // Validate that acceptance date is not in the future
    body('acceptedAt').custom((value) => {
      const acceptedDate = new Date(value);
      const now = new Date();
      if (acceptedDate > now) {
        throw new Error('Acceptance date cannot be in the future');
      }
      return true;
    }),

    this.handleValidationErrors
  ];

  // Validate digital signature
  validateDigitalSignature = [
    param('documentId')
      .isString()
      .isLength({ min: 1 })
      .withMessage('Document ID is required'),

    body('signatureUrl')
      .isURL()
      .withMessage('Signature URL must be a valid URL'),

    body('signedAt')
      .isISO8601()
      .withMessage('Signed date must be a valid ISO 8601 date'),

    // Validate that signed date is not in the future
    body('signedAt').custom((value) => {
      const signedDate = new Date(value);
      const now = new Date();
      if (signedDate > now) {
        throw new Error('Signed date cannot be in the future');
      }
      return true;
    }),

    this.handleValidationErrors
  ];
}


export const legalValidation = new LegalValidation();