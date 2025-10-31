import { Router } from 'express';
import { transactionController } from '../controllers/transactionController';
import { authenticateAdmin } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/adminValidation';
import {
  transactionListSchema,
  transactionSearchSchema,
  refundTransactionSchema,
  transactionFilterSchema,
} from '../validations/transactionSchemas';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * GET /api/admin/transactions
 * Get all transactions with pagination and filters
 */
router.get(
  '/',
  validateRequest(transactionListSchema, 'query'),
  transactionController.getTransactions
);

/**
 * GET /api/admin/transactions/search
 * Search transactions by reference, user, or property
 */
router.get(
  '/search',
  validateRequest(transactionSearchSchema, 'query'),
  transactionController.searchTransactions
);

/**
 * GET /api/admin/transactions/:transactionId
 * Get detailed transaction information
 */
router.get('/:transactionId', transactionController.getTransactionDetails);

/**
 * GET /api/admin/transactions/pending
 * Get pending transactions
 */
router.get(
  '/pending',
  validateRequest(transactionFilterSchema, 'query'),
  transactionController.getPendingTransactions
);

/**
 * GET /api/admin/transactions/failed
 * Get failed transactions
 */
router.get(
  '/failed',
  validateRequest(transactionFilterSchema, 'query'),
  transactionController.getFailedTransactions
);

/**
 * GET /api/admin/transactions/held
 * Get transactions in held status (awaiting confirmation)
 */
router.get('/held', transactionController.getHeldTransactions);

/**
 * POST /api/admin/transactions/:transactionId/refund
 * Process a refund for a transaction
 */
router.post(
  '/:transactionId/refund',
  validateRequest(refundTransactionSchema, 'body'),
  transactionController.refundTransaction
);

/**
 * POST /api/admin/transactions/:transactionId/release
 * Manually release held funds
 */
router.post('/:transactionId/release', transactionController.releaseHeldFunds);

/**
 * POST /api/admin/transactions/:transactionId/retry
 * Retry a failed transaction
 */
router.post('/:transactionId/retry', transactionController.retryTransaction);

/**
 * GET /api/admin/transactions/stats
 * Get transaction statistics
 */
router.get('/stats', transactionController.getTransactionStats);

/**
 * GET /api/admin/transactions/:transactionId/timeline
 * Get transaction timeline and status changes
 */
router.get('/:transactionId/timeline', transactionController.getTransactionTimeline);

/**
 * GET /api/admin/transactions/user/:userId
 * Get transactions for a specific user
 */
router.get('/user/:userId', transactionController.getUserTransactions);

/**
 * GET /api/admin/transactions/property/:propertyId
 * Get transactions for a specific property
 */
router.get('/property/:propertyId', transactionController.getPropertyTransactions);

/**
 * GET /api/admin/transactions/revenue-breakdown
 * Get revenue breakdown by type
 */
router.get('/revenue-breakdown', transactionController.getRevenueBreakdown);

/**
 * POST /api/admin/transactions/:transactionId/flag
 * Flag transaction for review
 */
router.post('/:transactionId/flag', transactionController.flagTransaction);

/**
 * GET /api/admin/transactions/flagged
 * Get flagged transactions
 */
router.get('/flagged', transactionController.getFlaggedTransactions);

/**
 * POST /api/admin/transactions/export
 * Export transactions to CSV
 */
router.post('/export', transactionController.exportTransactions);

export default router;