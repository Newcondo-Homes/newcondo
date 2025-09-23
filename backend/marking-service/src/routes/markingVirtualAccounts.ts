// backend/marking-service/src/routes/markingVirtualAccounts.ts

import { Router } from 'express';
import { MarkingVirtualAccountController } from '../controllers/markingVirtualAccountController';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { validateMarkingAccountRequest } from '../middleware/markingAccountValidation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route POST /api/marking/virtual-accounts/agent/:agentId
 * @desc Create virtual account for agent
 * @access Admin only
 */
router.post(
  '/agent/:agentId',
  validateMarkingAccountRequest.createAgentAccount,
  MarkingVirtualAccountController.createAgentVirtualAccount
);

/**
 * @route GET /api/marking/virtual-accounts/agent/:agentId
 * @desc Get agent virtual account details
 * @access Agent (own account) or Admin
 */
router.get(
  '/agent/:agentId',
  validateMarkingAccountRequest.getAgentAccount,
  MarkingVirtualAccountController.getAgentVirtualAccount
);

/**
 * @route GET /api/marking/virtual-accounts/:accountId/balance
 * @desc Get virtual account balance
 * @access Account owner or Admin
 */
router.get(
  '/:accountId/balance',
  validateMarkingAccountRequest.getBalance,
  MarkingVirtualAccountController.getVirtualAccountBalance
);

/**
 * @route POST /api/marking/virtual-accounts/:accountId/payment
 * @desc Process payment to virtual account
 * @access Authenticated users
 */
router.post(
  '/:accountId/payment',
  validateMarkingAccountRequest.processPayment,
  MarkingVirtualAccountController.processPayment
);

/**
 * @route POST /api/marking/virtual-accounts/:accountId/release/:markingJobId
 * @desc Release payment from virtual account
 * @access Admin only
 */
router.post(
  '/:accountId/release/:markingJobId',
  validateMarkingAccountRequest.releasePayment,
  MarkingVirtualAccountController.releasePayment
);

/**
 * @route GET /api/marking/virtual-accounts/:accountId/statement
 * @desc Get virtual account statement
 * @access Account owner or Admin
 */
router.get(
  '/:accountId/statement',
  validateMarkingAccountRequest.getStatement,
  MarkingVirtualAccountController.getAccountStatement
);

/**
 * @route PUT /api/marking/virtual-accounts/:accountId/status
 * @desc Update virtual account status (activate/deactivate)
 * @access Admin only
 */
router.put(
  '/:accountId/status',
  validateMarkingAccountRequest.updateStatus,
  MarkingVirtualAccountController.updateAccountStatus
);

/**
 * @route GET /api/marking/virtual-accounts/admin/all
 * @desc Get all agent virtual accounts
 * @access Admin only
 */
router.get(
  '/admin/all',
  validateMarkingAccountRequest.getAllAccounts,
  MarkingVirtualAccountController.getAllAgentAccounts
);

/**
 * @route POST /api/marking/virtual-accounts/admin/bulk-release
 * @desc Process bulk payment release
 * @access Admin only
 */
router.post(
  '/admin/bulk-release',
  validateMarkingAccountRequest.bulkRelease,
  MarkingVirtualAccountController.processBulkPaymentRelease
);

/**
 * @route POST /api/marking/virtual-accounts/:accountId/reconcile
 * @desc Reconcile virtual account with Flutterwave
 * @access Admin only
 */
router.post(
  '/:accountId/reconcile',
  validateMarkingAccountRequest.reconcile,
  MarkingVirtualAccountController.reconcileAccount
);

export default router;