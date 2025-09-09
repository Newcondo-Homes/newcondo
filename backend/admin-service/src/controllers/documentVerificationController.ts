// backend/admin-service/src/controllers/documentVerificationController.ts

import { Request, Response } from 'express';
import { documentVerificationService } from '../services/documentVerificationService';
import { standardResponse } from '../../../shared/src/utils/response';
import { DocumentStatus, DocumentType } from '../types/documentVerification';

export class DocumentVerificationController {
  // Get all pending documents for verification
  async getPendingDocuments(req: Request, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        documentType,
        userId,
        propertyId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        status: DocumentStatus.PENDING,
        documentType: documentType as DocumentType,
        userId: userId as string,
        propertyId: propertyId as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await documentVerificationService.getPendingDocuments(filters);
      
      return standardResponse(res, 200, 'Pending documents retrieved successfully', result);
    } catch (error) {
      console.error('Error getting pending documents:', error);
      return standardResponse(res, 500, 'Failed to retrieve pending documents');
    }
  }

  // Get document details for verification
  async getDocumentDetails(req: Request, res: Response) {
    try {
      const { documentId } = req.params;
      
      if (!documentId) {
        return standardResponse(res, 400, 'Document ID is required');
      }

      const document = await documentVerificationService.getDocumentDetails(documentId);
      
      if (!document) {
        return standardResponse(res, 404, 'Document not found');
      }

      return standardResponse(res, 200, 'Document details retrieved successfully', document);
    } catch (error) {
      console.error('Error getting document details:', error);
      return standardResponse(res, 500, 'Failed to retrieve document details');
    }
  }

  // Verify (approve) a document
  async approveDocument(req: Request, res: Response) {
    try {
      const { documentId } = req.params;
      const { verificationNotes } = req.body;
      const adminId = req.user?.id;

      if (!documentId) {
        return standardResponse(res, 400, 'Document ID is required');
      }

      if (!adminId) {
        return standardResponse(res, 401, 'Admin authentication required');
      }

      const result = await documentVerificationService.verifyDocument(
        documentId,
        DocumentStatus.APPROVED,
        adminId,
        verificationNotes
      );

      return standardResponse(res, 200, 'Document approved successfully', result);
    } catch (error) {
      console.error('Error approving document:', error);
      return standardResponse(res, 500, 'Failed to approve document');
    }
  }

  // Reject a document
  async rejectDocument(req: Request, res: Response) {
    try {
      const { documentId } = req.params;
      const { verificationNotes, rejectionReason } = req.body;
      const adminId = req.user?.id;

      if (!documentId) {
        return standardResponse(res, 400, 'Document ID is required');
      }

      if (!adminId) {
        return standardResponse(res, 401, 'Admin authentication required');
      }

      if (!rejectionReason) {
        return standardResponse(res, 400, 'Rejection reason is required');
      }

      const result = await documentVerificationService.verifyDocument(
        documentId,
        DocumentStatus.REJECTED,
        adminId,
        verificationNotes,
        rejectionReason
      );

      return standardResponse(res, 200, 'Document rejected successfully', result);
    } catch (error) {
      console.error('Error rejecting document:', error);
      return standardResponse(res, 500, 'Failed to reject document');
    }
  }

  // Bulk verify documents
  async bulkVerifyDocuments(req: Request, res: Response) {
    try {
      const { documentIds, status, verificationNotes } = req.body;
      const adminId = req.user?.id;

      if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        return standardResponse(res, 400, 'Document IDs array is required');
      }

      if (!status || !Object.values(DocumentStatus).includes(status)) {
        return standardResponse(res, 400, 'Valid status is required');
      }

      if (!adminId) {
        return standardResponse(res, 401, 'Admin authentication required');
      }

      const result = await documentVerificationService.bulkVerifyDocuments(
        documentIds,
        status,
        adminId,
        verificationNotes
      );

      return standardResponse(res, 200, `Documents ${status.toLowerCase()} successfully`, result);
    } catch (error) {
      console.error('Error bulk verifying documents:', error);
      return standardResponse(res, 500, 'Failed to verify documents');
    }
  }

  // Get document verification statistics
  async getVerificationStats(req: Request, res: Response) {
    try {
      const { startDate, endDate, documentType } = req.query;

      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        documentType: documentType as DocumentType
      };

      const stats = await documentVerificationService.getVerificationStats(filters);
      
      return standardResponse(res, 200, 'Verification statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Error getting verification stats:', error);
      return standardResponse(res, 500, 'Failed to retrieve verification statistics');
    }
  }

  // Get user's document compliance status
  async getUserComplianceStatus(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { propertyId } = req.query;

      if (!userId) {
        return standardResponse(res, 400, 'User ID is required');
      }

      const compliance = await documentVerificationService.getUserComplianceStatus(
        userId, 
        propertyId as string
      );
      
      return standardResponse(res, 200, 'User compliance status retrieved successfully', compliance);
    } catch (error) {
      console.error('Error getting user compliance status:', error);
      return standardResponse(res, 500, 'Failed to retrieve user compliance status');
    }
  }

  // Get expired documents
  async getExpiredDocuments(req: Request, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 20,
        documentType,
        expiredDays = 0 
      } = req.query;

      const filters = {
        documentType: documentType as DocumentType,
        expiredDays: parseInt(expiredDays as string),
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const result = await documentVerificationService.getExpiredDocuments(filters);
      
      return standardResponse(res, 200, 'Expired documents retrieved successfully', result);
    } catch (error) {
      console.error('Error getting expired documents:', error);
      return standardResponse(res, 500, 'Failed to retrieve expired documents');
    }
  }

  // Request additional documents from user
  async requestAdditionalDocuments(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { documentTypes, message, propertyId } = req.body;
      const adminId = req.user?.id;

      if (!userId) {
        return standardResponse(res, 400, 'User ID is required');
      }

      if (!documentTypes || !Array.isArray(documentTypes)) {
        return standardResponse(res, 400, 'Document types array is required');
      }

      if (!adminId) {
        return standardResponse(res, 401, 'Admin authentication required');
      }

      const result = await documentVerificationService.requestAdditionalDocuments(
        userId,
        documentTypes,
        adminId,
        message,
        propertyId
      );

      return standardResponse(res, 200, 'Additional documents requested successfully', result);
    } catch (error) {
      console.error('Error requesting additional documents:', error);
      return standardResponse(res, 500, 'Failed to request additional documents');
    }
  }

  // Generate compliance report
  async generateComplianceReport(req: Request, res: Response) {
    try {
      const { 
        startDate, 
        endDate, 
        userType, 
        documentType,
        format = 'json'
      } = req.query;

      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        userType: userType as string,
        documentType: documentType as DocumentType
      };

      const report = await documentVerificationService.generateComplianceReport(filters);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=compliance-report.csv');
        return res.send(report.csvData);
      }
      
      return standardResponse(res, 200, 'Compliance report generated successfully', report);
    } catch (error) {
      console.error('Error generating compliance report:', error);
      return standardResponse(res, 500, 'Failed to generate compliance report');
    }
  }

  // Get document verification history
  async getDocumentHistory(req: Request, res: Response) {
    try {
      const { documentId } = req.params;

      if (!documentId) {
        return standardResponse(res, 400, 'Document ID is required');
      }

      const history = await documentVerificationService.getDocumentHistory(documentId);
      
      return standardResponse(res, 200, 'Document history retrieved successfully', history);
    } catch (error) {
      console.error('Error getting document history:', error);
      return standardResponse(res, 500, 'Failed to retrieve document history');
    }
  }

  // Mark documents as expired
  async markDocumentsExpired(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;

      if (!adminId) {
        return standardResponse(res, 401, 'Admin authentication required');
      }

      const result = await documentVerificationService.markExpiredDocuments(adminId);
      
      return standardResponse(
        res, 
        200, 
        `${result.count} documents marked as expired successfully`, 
        result
      );
    } catch (error) {
      console.error('Error marking documents as expired:', error);
      return standardResponse(res, 500, 'Failed to mark documents as expired');
    }
  }

  // Get verification queue summary
  async getVerificationQueueSummary(req: Request, res: Response) {
    try {
      const summary = await documentVerificationService.getVerificationQueueSummary();
      
      return standardResponse(res, 200, 'Verification queue summary retrieved successfully', summary);
    } catch (error) {
      console.error('Error getting verification queue summary:', error);
      return standardResponse(res, 500, 'Failed to retrieve verification queue summary');
    }
  }
}

export const documentVerificationController = new DocumentVerificationController();