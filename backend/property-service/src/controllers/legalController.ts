// File: backend/property-service/src/controllers/legalController.ts

import { Request, Response } from 'express';
import { legalService } from '../services/legalService';
import { standardResponse } from '../../../shared/src/utils/response';

export class LegalController {
  // Upload ownership document
  async uploadOwnershipDocument(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const { userId } = req.user;
      const { documentType, documentNumber } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json(
          standardResponse(false, 'Document file is required', null, 'DOCUMENT_FILE_REQUIRED')
        );
      }

      const result = await legalService.uploadOwnershipDocument({
        propertyId,
        userId,
        documentType,
        documentNumber,
        file
      });

      res.status(201).json(
        standardResponse(true, 'Ownership document uploaded successfully', result)
      );
    } catch (error) {
      console.error('Error uploading ownership document:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to upload ownership document', null, 'UPLOAD_FAILED')
      );
    }
  }

  // Upload consent document (for agents)
  async uploadConsentDocument(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const { userId } = req.user;
      const file = req.file;

      if (!file) {
        return res.status(400).json(
          standardResponse(false, 'Consent document file is required', null, 'DOCUMENT_FILE_REQUIRED')
        );
      }

      const result = await legalService.uploadConsentDocument({
        propertyId,
        userId,
        file
      });

      res.status(201).json(
        standardResponse(true, 'Consent document uploaded successfully', result)
      );
    } catch (error) {
      console.error('Error uploading consent document:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to upload consent document', null, 'UPLOAD_FAILED')
      );
    }
  }

  // Upload undertaking document
  async uploadUndertakingDocument(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const { userId } = req.user;
      const file = req.file;

      if (!file) {
        return res.status(400).json(
          standardResponse(false, 'Undertaking document file is required', null, 'DOCUMENT_FILE_REQUIRED')
        );
      }

      const result = await legalService.uploadUndertakingDocument({
        propertyId,
        userId,
        file
      });

      res.status(201).json(
        standardResponse(true, 'Undertaking document uploaded successfully', result)
      );
    } catch (error) {
      console.error('Error uploading undertaking document:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to upload undertaking document', null, 'UPLOAD_FAILED')
      );
    }
  }

  // Get property documents
  async getPropertyDocuments(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const { userId } = req.user;

      const documents = await legalService.getPropertyDocuments(propertyId, userId);

      res.status(200).json(
        standardResponse(true, 'Property documents retrieved successfully', documents)
      );
    } catch (error) {
      console.error('Error retrieving property documents:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to retrieve property documents', null, 'RETRIEVAL_FAILED')
      );
    }
  }

  // Verify property ownership
  async verifyPropertyOwnership(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const { userId } = req.user;

      const verification = await legalService.verifyPropertyOwnership(propertyId, userId);

      res.status(200).json(
        standardResponse(true, 'Property ownership verification completed', verification)
      );
    } catch (error) {
      console.error('Error verifying property ownership:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to verify property ownership', null, 'VERIFICATION_FAILED')
      );
    }
  }

  // Get required documents for property
  async getRequiredDocuments(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const { userId } = req.user;

      const requiredDocs = await legalService.getRequiredDocuments(propertyId, userId);

      res.status(200).json(
        standardResponse(true, 'Required documents retrieved successfully', requiredDocs)
      );
    } catch (error) {
      console.error('Error retrieving required documents:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to retrieve required documents', null, 'RETRIEVAL_FAILED')
      );
    }
  }

  // Update document status (admin only)
  async updateDocumentStatus(req: Request, res: Response) {
    try {
      const { documentId } = req.params;
      const { status, verificationNotes } = req.body;
      const { userId } = req.user;

      const result = await legalService.updateDocumentStatus({
        documentId,
        status,
        verificationNotes,
        verifiedBy: userId
      });

      res.status(200).json(
        standardResponse(true, 'Document status updated successfully', result)
      );
    } catch (error) {
      console.error('Error updating document status:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to update document status', null, 'UPDATE_FAILED')
      );
    }
  }
}

export const legalController = new LegalController();