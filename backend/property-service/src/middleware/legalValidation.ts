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

export const legalValidation = new LegalValidation();