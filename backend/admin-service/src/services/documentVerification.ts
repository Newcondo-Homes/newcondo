// backend/admin-service/src/routes/documentVerification.ts

import { Router } from 'express';
import { documentVerificationController } from '../controllers/documentVerificationController';
import { adminAuth } from '../middleware/adminAuth';
import { 
  validateDocumentVerification, 
  validateBulkDocumentVerification,
  validateDocumentRequest,
  validateComplianceReportQuery
} from '../middleware/documentVerificationValidation';

const router = Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// GET /api/admin/document-verification/pending
// Get all pending documents for verification
router.get('/pending', documentVerificationController.getPendingDocuments);

// GET /api/admin/document-verification/stats
// Get document verification statistics
router.get('/stats', documentVerificationController.getVerificationStats);

// GET /api/admin/document-verification/queue-summary
// Get verification queue summary
router.get('/queue-summary', documentVerificationController.getVerificationQueueSummary);

// GET /api/admin/document-verification/expired
// Get expired documents
router.get('/expired', documentVerificationController.getExpiredDocuments);

// POST /api/admin/document-verification/mark-expired
// Mark documents as expired
router.post('/mark-expired', documentVerificationController.markDocumentsExpired);

// GET /api/admin/document-verification/compliance-report
// Generate compliance report
router.get(
  '/compliance-report', 
  validateComplianceReportQuery,
  documentVerificationController.generateComplianceReport
);

// GET /api/admin/document-verification/user/:userId/compliance
// Get user's document compliance status
router.get('/user/:userId/compliance', documentVerificationController.getUserComplianceStatus);

// POST /api/admin/document-verification/user/:userId/request-documents
// Request additional documents from user
router.post(
  '/user/:userId/request-documents',
  validateDocumentRequest,
  documentVerificationController.requestAdditionalDocuments
);

// GET /api/admin/document-verification/document/:documentId
// Get document details for verification
router.get('/document/:documentId', documentVerificationController.getDocumentDetails);

// GET /api/admin/document-verification/document/:documentId/history
// Get document verification history
router.get('/document/:documentId/history', documentVerificationController.getDocumentHistory);

// POST /api/admin/document-verification/document/:documentId/approve
// Approve a document
router.post(
  '/document/:documentId/approve',
  validateDocumentVerification,
  documentVerificationController.approveDocument
);

// POST /api/admin/document-verification/document/:documentId/reject
// Reject a document
router.post(
  '/document/:documentId/reject',
  validateDocumentVerification,
  documentVerificationController.rejectDocument
);

// POST /api/admin/document-verification/bulk-verify
// Bulk verify documents
router.post(
  '/bulk-verify',
  validateBulkDocumentVerification,
  documentVerificationController.bulkVerifyDocuments
);

export default router;