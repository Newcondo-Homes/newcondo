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

  // Get property legal documents
  async getPropertyDocuments(req: AuthenticatedRequest, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = req.user!.id;

      const documents = await legalService.getPropertyDocuments(propertyId, userId);

      return ApiResponse.success(res, documents, 'Documents retrieved successfully');
    } catch (error) {
      console.error('Get property documents error:', error);
      return ApiResponse.error(res, 'Failed to retrieve documents', 500);
    }
  }

  // Get user legal documents
  async getUserDocuments(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { documentType, status } = req.query;

      const documents = await legalService.getUserDocuments(
        userId,
        documentType as DocumentType,
        status as DocumentStatus
      );

      return ApiResponse.success(res, documents, 'User documents retrieved successfully');
    } catch (error) {
      console.error('Get user documents error:', error);
      return ApiResponse.error(res, 'Failed to retrieve user documents', 500);
    }
  }
  
   // Update document
  async updateDocument(req: AuthenticatedRequest, res: Response) {
    try {
      const { documentId } = req.params;
      const { documentNumber, fileName, fileUrl, fileSizeBytes, mimeType } = req.body;
      const userId = req.user!.id;

      const document = await legalService.updateDocument(documentId, userId, {
        documentNumber,
        fileName,
        fileUrl,
        fileSizeBytes,
        mimeType,
      });

      return ApiResponse.success(res, document, 'Document updated successfully');
    } catch (error) {
      console.error('Update document error:', error);
      return ApiResponse.error(res, 'Failed to update document', 500);
    }
  }

  // Delete document
  async deleteDocument(req: AuthenticatedRequest, res: Response) {
    try {
      const { documentId } = req.params;
      const userId = req.user!.id;

      await legalService.deleteDocument(documentId, userId);

      return ApiResponse.success(res, null, 'Document deleted successfully');
    } catch (error) {
      console.error('Delete document error:', error);
      return ApiResponse.error(res, 'Failed to delete document', 500);
    }
  }

  // Get required documents for property listing
  async getRequiredDocuments(req: AuthenticatedRequest, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = req.user!.id;

      const requiredDocs = await legalService.getRequiredDocuments(propertyId, userId);

      return ApiResponse.success(res, requiredDocs, 'Required documents retrieved successfully');
    } catch (error) {
      console.error('Get required documents error:', error);
      return ApiResponse.error(res, 'Failed to retrieve required documents', 500);
    }
  }

  // Accept terms and conditions
  async acceptTermsAndConditions(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { termsVersion, acceptedAt } = req.body;

      const acceptance = await legalService.recordTermsAcceptance(
        userId,
        termsVersion,
        new Date(acceptedAt)
      );

      return ApiResponse.success(res, acceptance, 'Terms and conditions accepted successfully');
    } catch (error) {
      console.error('Accept terms error:', error);
      return ApiResponse.error(res, 'Failed to accept terms and conditions', 500);
    }
  }

  // Digital signature upload
  async uploadDigitalSignature(req: AuthenticatedRequest, res: Response) {
    try {
      const { documentId } = req.params;
      const { signatureUrl, signedAt } = req.body;
      const userId = req.user!.id;

      const signedDocument = await legalService.addDigitalSignature(
        documentId,
        userId,
        signatureUrl,
        new Date(signedAt)
      );

      return ApiResponse.success(res, signedDocument, 'Digital signature added successfully');
    } catch (error) {
      console.error('Upload digital signature error:', error);
      return ApiResponse.error(res, 'Failed to add digital signature', 500);
    }
  }

  // Get document templates
  async getDocumentTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      const { documentType } = req.query;

      const templates = await legalService.getDocumentTemplates(
        documentType as DocumentType
      );

      return ApiResponse.success(res, templates, 'Document templates retrieved successfully');
    } catch (error) {
      console.error('Get document templates error:', error);
      return ApiResponse.error(res, 'Failed to retrieve document templates', 500);
    }
  }

  // Check compliance status
  async checkComplianceStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = req.user!.id;

      const complianceStatus = await legalService.checkComplianceStatus(propertyId, userId);

      return ApiResponse.success(res, complianceStatus, 'Compliance status retrieved successfully');
    } catch (error) {
      console.error('Check compliance status error:', error);
      return ApiResponse.error(res, 'Failed to check compliance status', 500);
    }
  }
}

export const legalController = new LegalController();