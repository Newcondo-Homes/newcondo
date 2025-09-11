// backend/admin-service/src/routes/legalDocuments.ts
import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth';
import { adminValidation } from '../middleware/adminValidation';
import { legalDocumentController } from '../controllers/legalDocumentController';
import { body, param, query } from 'express-validator';

const router = Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// Get all legal documents with filtering and pagination
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('documentType').optional().isIn([
      'OWNERSHIP_DOCUMENT',
      'CONSENT_DOCUMENT', 
      'UNDERTAKING_DOCUMENT',
      'BUSINESS_REGISTRATION',
      'TAX_CERTIFICATE'
    ]).withMessage('Invalid document type'),
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).withMessage('Invalid status'),
    query('userId').optional().isString().withMessage('User ID must be a string'),
    query('propertyId').optional().isString().withMessage('Property ID must be a string'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
    adminValidation
  ],
  legalDocumentController.getAllLegalDocuments
);

// Get legal document by ID
router.get(
  '/:id',
  [
    param('id').isString().notEmpty().withMessage('Document ID is required'),
    adminValidation
  ],
  legalDocumentController.getLegalDocumentById
);

// Get legal documents by user ID
router.get(
  '/user/:userId',
  [
    param('userId').isString().notEmpty().withMessage('User ID is required'),
    query('documentType').optional().isIn([
      'OWNERSHIP_DOCUMENT',
      'CONSENT_DOCUMENT',
      'UNDERTAKING_DOCUMENT',
      'BUSINESS_REGISTRATION',
      'TAX_CERTIFICATE'
    ]).withMessage('Invalid document type'),
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).withMessage('Invalid status'),
    adminValidation
  ],
  legalDocumentController.getLegalDocumentsByUserId
);

// Get legal documents by property ID
router.get(
  '/property/:propertyId',
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    query('documentType').optional().isIn([
      'OWNERSHIP_DOCUMENT',
      'CONSENT_DOCUMENT',
      'UNDERTAKING_DOCUMENT'
    ]).withMessage('Invalid document type'),
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).withMessage('Invalid status'),
    adminValidation
  ],
  legalDocumentController.getLegalDocumentsByPropertyId
);

// Update legal document status (approve/reject)
router.put(
  '/:id/status',
  [
    param('id').isString().notEmpty().withMessage('Document ID is required'),
    body('status').isIn(['APPROVED', 'REJECTED']).withMessage('Status must be either APPROVED or REJECTED'),
    body('verificationNotes').optional().isString().trim().isLength({ max: 1000 }).withMessage('Verification notes must be less than 1000 characters'),
    adminValidation
  ],
  legalDocumentController.updateLegalDocumentStatus
);

// Bulk update legal document statuses
router.put(
  '/bulk/status',
  [
    body('documentIds').isArray({ min: 1 }).withMessage('Document IDs array is required'),
    body('documentIds.*').isString().notEmpty().withMessage('Each document ID must be a valid string'),
    body('status').isIn(['APPROVED', 'REJECTED']).withMessage('Status must be either APPROVED or REJECTED'),
    body('verificationNotes').optional().isString().trim().isLength({ max: 1000 }).withMessage('Verification notes must be less than 1000 characters'),
    adminValidation
  ],
  legalDocumentController.bulkUpdateLegalDocumentStatus
);

// Delete legal document (admin only - for compliance)
router.delete(
  '/:id',
  [
    param('id').isString().notEmpty().withMessage('Document ID is required'),
    body('reason').isString().notEmpty().trim().isLength({ min: 10, max: 500 }).withMessage('Deletion reason is required (10-500 characters)'),
    adminValidation
  ],
  legalDocumentController.deleteLegalDocument
);

// Get legal document statistics
router.get(
  '/stats/overview',
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
    query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Group by must be day, week, or month'),
    adminValidation
  ],
  legalDocumentController.getLegalDocumentStats
);

// Export legal documents report
router.get(
  '/export/report',
  [
    query('format').optional().isIn(['csv', 'excel', 'pdf']).withMessage('Format must be csv, excel, or pdf'),
    query('documentType').optional().isIn([
      'OWNERSHIP_DOCUMENT',
      'CONSENT_DOCUMENT',
      'UNDERTAKING_DOCUMENT',
      'BUSINESS_REGISTRATION',
      'TAX_CERTIFICATE'
    ]).withMessage('Invalid document type'),
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).withMessage('Invalid status'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
    adminValidation
  ],
  legalDocumentController.exportLegalDocumentsReport
);

// Flag document for review
router.post(
  '/:id/flag',
  [
    param('id').isString().notEmpty().withMessage('Document ID is required'),
    body('reason').isString().notEmpty().trim().isLength({ min: 10, max: 500 }).withMessage('Flag reason is required (10-500 characters)'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority level'),
    adminValidation
  ],
  legalDocumentController.flagLegalDocumentForReview
);

// Get flagged documents
router.get(
  '/flagged/list',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority level'),
    adminValidation
  ],
  legalDocumentController.getFlaggedDocuments
);

export { router as legalDocumentsRouter };