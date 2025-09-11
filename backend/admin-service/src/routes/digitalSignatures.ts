// backend/admin-service/src/routes/digitalSignatures.ts

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import complianceService from '../services/complianceService';
import { authMiddleware } from '../../shared/src/middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import { legalComplianceValidation } from '../middleware/legalComplianceValidation';
import { Logger } from '../../shared/src/middleware/logger';
import { standardResponse } from '../../shared/src/utils/response';

const router = Router();
const logger = Logger.getInstance();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   POST /api/admin/digital-signatures/request
 * @desc    Create a digital signature request
 * @access  Admin only
 */
router.post('/request',
  adminAuth,
  [
    body('documentId').isString().notEmpty().withMessage('Document ID is required'),
    body('userId').isString().notEmpty().withMessage('User ID is required'),
    body('propertyId').optional().isString().withMessage('Property ID must be a string'),
    body('signerName').isString().notEmpty().withMessage('Signer name is required'),
    body('signerEmail').isEmail().withMessage('Valid signer email is required'),
    body('documentContent').isString().notEmpty().withMessage('Document content is required'),
    body('requiresWitness').optional().isBoolean().withMessage('Requires witness must be boolean')
  ],
  legalComplianceValidation.validateSignatureRequest,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          standardResponse(false, 'Validation failed', null, errors.array())
        );
      }

      const {
        documentId,
        userId,
        propertyId,
        signerName,
        signerEmail,
        documentContent,
        requiresWitness = false
      } = req.body;

      const result = await complianceService.createDigitalSignatureRequest({
        documentId,
        userId,
        propertyId,
        signerName,
        signerEmail,
        documentContent,
        requiresWitness
      });

      logger.info('Digital signature request created:', {
        requestId: result.requestId,
        documentId,
        signerEmail,
        adminId: req.user.id
      });

      res.status(201).json(
        standardResponse(true, 'Digital signature request created successfully', result)
      );
    } catch (error) {
      logger.error('Error creating digital signature request:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to create digital signature request')
      );
    }
  }
);

/**
 * @route   GET /api/admin/digital-signatures/status/:requestId
 * @desc    Get digital signature request status
 * @access  Admin only
 */
router.get('/status/:requestId',
  adminAuth,
  [
    param('requestId').isString().notEmpty().withMessage('Request ID is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          standardResponse(false, 'Validation failed', null, errors.array())
        );
      }

      const { requestId } = req.params;

      // Mock implementation - in reality you'd check with your signature service
      const mockStatus = {
        requestId,
        status: 'PENDING', // PENDING, SIGNED, DECLINED, EXPIRED
        signedAt: null,
        signerIp: null,
        documentUrl: null,
        signedDocumentUrl: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date()
      };

      logger.info('Digital signature status retrieved:', {
        requestId,
        status: mockStatus.status,
        adminId: req.user.id
      });

      res.json(
        standardResponse(true, 'Signature status retrieved successfully', mockStatus)
      );
    } catch (error) {
      logger.error('Error retrieving signature status:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to retrieve signature status')
      );
    }
  }
);

/**
 * @route   POST /api/admin/digital-signatures/resend/:requestId
 * @desc    Resend digital signature request
 * @access  Admin only
 */
router.post('/resend/:requestId',
  adminAuth,
  [
    param('requestId').isString().notEmpty().withMessage('Request ID is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          standardResponse(false, 'Validation failed', null, errors.array())
        );
      }

      const { requestId } = req.params;

      // Mock implementation - in reality you'd resend through your signature service
      const mockResult = {
        requestId,
        resentAt: new Date(),
        newExpiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      logger.info('Digital signature request resent:', {
        requestId,
        adminId: req.user.id
      });

      res.json(
        standardResponse(true, 'Signature request resent successfully', mockResult)
      );
    } catch (error) {
      logger.error('Error resending signature request:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to resend signature request')
      );
    }
  }
);

/**
 * @route   DELETE /api/admin/digital-signatures/cancel/:requestId
 * @desc    Cancel digital signature request
 * @access  Admin only
 */
router.delete('/cancel/:requestId',
  adminAuth,
  [
    param('requestId').isString().notEmpty().withMessage('Request ID is required'),
    body('reason').optional().isString().withMessage('Cancellation reason must be a string')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          standardResponse(false, 'Validation failed', null, errors.array())
        );
      }

      const { requestId } = req.params;
      const { reason } = req.body;

      // Mock implementation - in reality you'd cancel through your signature service
      const mockResult = {
        requestId,
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: req.user.id,
        reason
      };

      logger.info('Digital signature request cancelled:', {
        requestId,
        reason,
        adminId: req.user.id
      });

      res.json(
        standardResponse(true, 'Signature request cancelled successfully', mockResult)
      );
    } catch (error) {
      logger.error('Error cancelling signature request:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to cancel signature request')
      );
    }
  }
);

/**
 * @route   GET /api/admin/digital-signatures/pending
 * @desc    Get all pending signature requests
 * @access  Admin only
 */
router.get('/pending',
  adminAuth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['createdAt', 'expiresAt', 'signerEmail']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          standardResponse(false, 'Validation failed', null, errors.array())
        );
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) || 'desc';

      // Mock implementation - in reality you'd fetch from your signature service
      const mockPendingRequests = {
        requests: [
          {
            requestId: 'sig_123456789',
            documentId: 'doc_987654321',
            userId: 'user_456789123',
            signerName: 'John Doe',
            signerEmail: 'john.doe@example.com',
            documentType: 'OWNERSHIP_DOCUMENT',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            requiresWitness: false
          },
          {
            requestId: 'sig_234567890',
            documentId: 'doc_876543210',
            userId: 'user_567890234',
            signerName: 'Jane Smith',
            signerEmail: 'jane.smith@example.com',
            documentType: 'UNDERTAKING_DOCUMENT',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
            requiresWitness: true
          }
        ],
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalRequests: 2,
          hasNext: false,
          hasPrev: false
        }
      };

      logger.info('Pending signature requests retrieved:', {
        page,
        limit,
        totalRequests: mockPendingRequests.pagination.totalRequests,
        adminId: req.user.id
      });

      res.json(
        standardResponse(true, 'Pending signature requests retrieved successfully', mockPendingRequests)
      );
    } catch (error) {
      logger.error('Error retrieving pending signature requests:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to retrieve pending signature requests')
      );
    }
  }
);

/**
 * @route   GET /api/admin/digital-signatures/templates
 * @desc    Get available document templates
 * @access  Admin only
 */
router.get('/templates',
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      // Mock templates - in reality you'd fetch from database or template service
      const mockTemplates = [
        {
          id: 'template_ownership',
          name: 'Property Ownership Consent',
          documentType: 'OWNERSHIP_DOCUMENT',
          description: 'Template for property ownership consent documents',
          templateUrl: 'https://templates.newcondo.com/ownership_consent.pdf',
          version: '1.2',
          isActive: true,
          variables: [
            'ownerName',
            'propertyAddress',
            'agentName',
            'consentDate'
          ]
        },
        {
          id: 'template_undertaking',
          name: 'Legal Undertaking Agreement',
          documentType: 'UNDERTAKING_DOCUMENT',
          description: 'Template for legal undertaking agreements',
          templateUrl: 'https://templates.newcondo.com/undertaking.pdf',
          version: '1.1',
          isActive: true,
          variables: [
            'signerName',
            'propertyDetails',
            'undertakingDate',
            'witnessName'
          ]
        },
        {
          id: 'template_agent_permission',
          name: 'Agent Permission Document',
          documentType: 'CONSENT_DOCUMENT',
          description: 'Template for agent permission documents from property owners',
          templateUrl: 'https://templates.newcondo.com/agent_permission.pdf',
          version: '1.0',
          isActive: true,
          variables: [
            'ownerName',
            'agentName',
            'propertyAddress',
            'permissionDate',
            'validUntil'
          ]
        }
      ];

      logger.info('Document templates retrieved:', {
        templateCount: mockTemplates.length,
        adminId: req.user.id
      });

      res.json(
        standardResponse(true, 'Document templates retrieved successfully', { templates: mockTemplates })
      );
    } catch (error) {
      logger.error('Error retrieving document templates:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to retrieve document templates')
      );
    }
  }
);

/**
 * @route   POST /api/admin/digital-signatures/generate-document
 * @desc    Generate legal document from template
 * @access  Admin only
 */
router.post('/generate-document',
  adminAuth,
  [
    body('templateId').isString().notEmpty().withMessage('Template ID is required'),
    body('data').isObject().withMessage('Document data is required'),
    body('fileName').optional().isString().withMessage('File name must be a string')
  ],
  legalComplianceValidation.validateDocumentGeneration,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          standardResponse(false, 'Validation failed', null, errors.array())
        );
      }

      const { templateId, data, fileName } = req.body;

      const result = await complianceService.generateLegalDocument(templateId, data);

      logger.info('Legal document generated:', {
        templateId,
        fileName: result.fileName,
        adminId: req.user.id
      });

      res.status(201).json(
        standardResponse(true, 'Legal document generated successfully', {
          documentUrl: result.documentUrl,
          fileName: result.fileName,
          generatedAt: new Date()
        })
      );
    } catch (error) {
      logger.error('Error generating legal document:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to generate legal document')
      );
    }
  }
);

/**
 * @route   GET /api/admin/digital-signatures/audit/:userId
 * @desc    Get signature audit trail
 * @access  Admin only
 */
router.get('/audit/:userId',
  adminAuth,
  [
    param('userId').isString().notEmpty().withMessage('User ID is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          standardResponse(false, 'Validation failed', null, errors.array())
        );
      }

      const { userId } = req.params;

      const auditTrail = await complianceService.getSignatureAuditTrail(userId);

      if (!auditTrail) {
        return res.status(404).json(
          standardResponse(false, 'No signature audit trail found for this user.')
        );
      }

      logger.info('Signature audit trail retrieved:', {
        userId,
        adminId: req.user.id,
        documentCount: auditTrail.length
      });

      res.json(
        standardResponse(true, 'Signature audit trail retrieved successfully', auditTrail)
      );
    } catch (error) {
      logger.error('Error retrieving signature audit trail:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to retrieve signature audit trail.')
      );
    }
  }
);

export default router;