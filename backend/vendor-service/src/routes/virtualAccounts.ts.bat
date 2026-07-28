import { Router } from 'express';
import { auth } from '../../../shared/src/middleware/auth';
import { validateRequest } from '../../../shared/src/middleware/validation';
import { rateLimiter } from '../../../shared/src/middleware/rateLimiter';
import { virtualAccountController } from '../controllers/virtualAccountController';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createVirtualAccountSchema = z.object({
  body: z.object({
    propertyId: z.string().cuid().optional(),
    accountName: z.string().min(3).max(100),
    bankCode: z.string().optional().default('999999'), // Default test bank code
    currency: z.string().default('NGN')
  })
});

const updateVirtualAccountSchema = z.object({
  body: z.object({
    accountName: z.string().min(3).max(100).optional(),
    isActive: z.boolean().optional()
  })
});

const transferFundsSchema = z.object({
  body: z.object({
    recipientAccount: z.string(),
    amount: z.number().positive(),
    narration: z.string().max(200),
    currency: z.string().default('NGN'),
    recipientBankCode: z.string()
  })
});

const freezeAccountSchema = z.object({
  body: z.object({
    reason: z.string().max(500),
    duration: z.number().positive().optional() // Duration in hours
  })
});

// Routes

/**
 * @route POST /api/virtual-accounts
 * @desc Create a new virtual account
 * @access Private (Property Owners)
 */
router.post(
  '/',
  auth,
  rateLimiter(5, 60), // 5 accounts per hour
  validateRequest(createVirtualAccountSchema),
  virtualAccountController.createVirtualAccount
);

/**
 * @route GET /api/virtual-accounts
 * @desc Get user's virtual accounts
 * @access Private
 */
router.get(
  '/',
  auth,
  virtualAccountController.getUserVirtualAccounts
);

/**
 * @route GET /api/virtual-accounts/:accountId
 * @desc Get specific virtual account details
 * @access Private (Account owner)
 */
router.get(
  '/:accountId',
  auth,
  virtualAccountController.getVirtualAccount
);

/**
 * @route PUT /api/virtual-accounts/:accountId
 * @desc Update virtual account details
 * @access Private (Account owner)
 */
router.put(
  '/:accountId',
  auth,
  rateLimiter(10, 60), // 10 updates per hour
  validateRequest(updateVirtualAccountSchema),
  virtualAccountController.updateVirtualAccount
);

/**
 * @route DELETE /api/virtual-accounts/:accountId
 * @desc Delete/deactivate virtual account
 * @access Private (Account owner)
 */
router.delete(
  '/:accountId',
  auth,
  rateLimiter(3, 60), // 3 deletions per hour
  virtualAccountController.deleteVirtualAccount
);

/**
 * @route GET /api/virtual-accounts/:accountId/balance
 * @desc Get virtual account balance
 * @access Private (Account owner)
 */
router.get(
  '/:accountId/balance',
  auth,
  virtualAccountController.getAccountBalance
);

/**
 * @route GET /api/virtual-accounts/:accountId/transactions
 * @desc Get virtual account transaction history
 * @access Private (Account owner)
 */
router.get(
  '/:accountId/transactions',
  auth,
  virtualAccountController.getAccountTransactions
);

/**
 * @route POST /api/virtual-accounts/:accountId/transfer
 * @desc Transfer funds from virtual account
 * @access Private (Account owner)
 */
router.post(
  '/:accountId/transfer',
  auth,
  rateLimiter(10, 60), // 10 transfers per hour
  validateRequest(transferFundsSchema),
  virtualAccountController.transferFunds
);

/**
 * @route POST /api/virtual-accounts/:accountId/freeze
 * @desc Freeze virtual account (admin or security)
 * @access Private (Account owner or Admin)
 */
router.post(
  '/:accountId/freeze',
  auth,
  rateLimiter(3, 60), // 3 freeze actions per hour
  validateRequest(freezeAccountSchema),
  virtualAccountController.freezeAccount
);

/**
 * @route POST /api/virtual-accounts/:accountId/unfreeze
 * @desc Unfreeze virtual account
 * @access Private (Account owner or Admin)
 */
router.post(
  '/:accountId/unfreeze',
  auth,
  rateLimiter(3, 60), // 3 unfreeze actions per hour
  virtualAccountController.unfreezeAccount
);

/**
 * @route GET /api/virtual-accounts/:accountId/webhook-logs
 * @desc Get webhook logs for virtual account
 * @access Private (Account owner)
 */
router.get(
  '/:accountId/webhook-logs',
  auth,
  virtualAccountController.getWebhookLogs
);

/**
 * @route POST /api/virtual-accounts/:accountId/sync
 * @desc Sync virtual account with Flutterwave
 * @access Private (Account owner)
 */
router.post(
  '/:accountId/sync',
  auth,
  rateLimiter(5, 15), // 5 syncs per 15 minutes
  virtualAccountController.syncWithFlutterwave
);

/**
 * @route GET /api/virtual-accounts/:accountId/statements
 * @desc Generate virtual account statement
 * @access Private (Account owner)
 */
router.get(
  '/:accountId/statements',
  auth,
  virtualAccountController.generateStatement
);

/**
 * @route POST /api/virtual-accounts/:accountId/auto-payout
 * @desc Configure automatic payout settings
 * @access Private (Account owner)
 */
router.post(
  '/:accountId/auto-payout',
  auth,
  rateLimiter(5, 60), // 5 configurations per hour
  validateRequest(z.object({
    body: z.object({
      enabled: z.boolean(),
      threshold: z.number().positive().optional(),
      schedule: z.enum(['daily', 'weekly', 'monthly']).optional(),
      recipientAccount: z.string().optional(),
      recipientBankCode: z.string().optional()
    })
  })),
  virtualAccountController.configureAutoPayout
);

/**
 * @route GET /api/virtual-accounts/:accountId/analytics
 * @desc Get virtual account analytics
 * @access Private (Account owner)
 */
router.get(
  '/:accountId/analytics',
  auth,
  virtualAccountController.getAccountAnalytics
);

/**
 * @route POST /api/virtual-accounts/:accountId/notifications
 * @desc Configure account notifications
 * @access Private (Account owner)
 */
router.post(
  '/:accountId/notifications',
  auth,
  validateRequest(z.object({
    body: z.object({
      emailNotifications: z.boolean(),
      smsNotifications: z.boolean(),
      webhookUrl: z.string().url().optional(),
      thresholdAlerts: z.boolean()
    })
  })),
  virtualAccountController.configureNotifications
);

export default router;


// import express from 'express';
// import { authMiddleware } from '../../../shared/src/middleware/auth';
// import { validateRequest } from '../../../shared/src/middleware/validation';
// import { paymentValidation } from '../middleware/paymentValidation';
// import {
//   createVirtualAccount,
//   getVirtualAccount,
//   getUserVirtualAccounts,
//   getVirtualAccountBalance,
//   getVirtualAccountTransactions,
//   updateVirtualAccount,
//   deactivateVirtualAccount,
//   reactivateVirtualAccount,
//   transferFromVirtualAccount,
//   createPropertyVirtualAccount,
//   linkVirtualAccountToProperty,
//   unlinkVirtualAccountFromProperty,
//   getVirtualAccountStatement,
//   bulkCreateVirtualAccounts
// } from '../controllers/virtualAccountController';

// const router = express.Router();

// // Apply auth middleware to all routes
// router.use(authMiddleware);

// /**
//  * @route   POST /api/virtual-accounts/create
//  * @desc    Create a new virtual account for user
//  * @access  Private
//  * @body    { accountName?, currency?, propertyId? }
//  */
// router.post(
//   '/create',
//   validateRequest(paymentValidation.createVirtualAccount),
//   createVirtualAccount
// );

// /**
//  * @route   POST /api/virtual-accounts/property/:propertyId
//  * @desc    Create virtual account specifically for a property
//  * @access  Private
//  * @body    { accountName?, currency? }
//  */
// router.post(
//   '/property/:propertyId',
//   validateRequest(paymentValidation.createPropertyVirtualAccount),
//   createPropertyVirtualAccount
// );

// /**
//  * @route   POST /api/virtual-accounts/bulk-create
//  * @desc    Bulk create virtual accounts (Admin/System use)
//  * @access  Private (Admin only)
//  * @body    { accounts: [{ userId, propertyId?, accountName?, currency? }] }
//  */
// router.post(
//   '/bulk-create',
//   validateRequest(paymentValidation.bulkCreateVirtualAccounts),
//   bulkCreateVirtualAccounts
// );

// /**
//  * @route   GET /api/virtual-accounts/:accountId
//  * @desc    Get specific virtual account details
//  * @access  Private
//  */
// router.get(
//   '/:accountId',
//   validateRequest(paymentValidation.getVirtualAccount),
//   getVirtualAccount
// );

// /**
//  * @route   GET /api/virtual-accounts/user/all
//  * @desc    Get all virtual accounts for current user
//  * @access  Private
//  * @query   { includeInactive?, propertyId? }
//  */
// router.get(
//   '/user/all',
//   validateRequest(paymentValidation.getUserVirtualAccounts),
//   getUserVirtualAccounts
// );

// /**
//  * @route   GET /api/virtual-accounts/:accountId/balance
//  * @desc    Get virtual account balance
//  * @access  Private
//  */
// router.get(
//   '/:accountId/balance',
//   validateRequest(paymentValidation.getVirtualAccountBalance),
//   getVirtualAccountBalance
// );

// /**
//  * @route   GET /api/virtual-accounts/:accountId/transactions
//  * @desc    Get virtual account transaction history
//  * @access  Private
//  * @query   { page?, limit?, startDate?, endDate?, type? }
//  */
// router.get(
//   '/:accountId/transactions',
//   validateRequest(paymentValidation.getVirtualAccountTransactions),
//   getVirtualAccountTransactions
// );

// /**
//  * @route   GET /api/virtual-accounts/:accountId/statement
//  * @desc    Generate virtual account statement
//  * @access  Private
//  * @query   { startDate?, endDate?, format?, includeBalance? }
//  */
// router.get(
//   '/:accountId/statement',
//   validateRequest(paymentValidation.getVirtualAccountStatement),
//   getVirtualAccountStatement
// );

// /**
//  * @route   PUT /api/virtual-accounts/:accountId
//  * @desc    Update virtual account details
//  * @access  Private
//  * @body    { accountName?, isActive? }
//  */
// router.put(
//   '/:accountId',
//   validateRequest(paymentValidation.updateVirtualAccount),
//   updateVirtualAccount
// );

// /**
//  * @route   POST /api/virtual-accounts/:accountId/link-property
//  * @desc    Link virtual account to a property
//  * @access  Private
//  * @body    { propertyId }
//  */
// router.post(
//   '/:accountId/link-property',
//   validateRequest(paymentValidation.linkVirtualAccountToProperty),
//   linkVirtualAccountToProperty
// );

// /**
//  * @route   POST /api/virtual-accounts/:accountId/unlink-property
//  * @desc    Unlink virtual account from property
//  * @access  Private
//  */
// router.post(
//   '/:accountId/unlink-property',
//   validateRequest(paymentValidation.unlinkVirtualAccountFromProperty),
//   unlinkVirtualAccountFromProperty
// );

// /**
//  * @route   POST /api/virtual-accounts/:accountId/transfer
//  * @desc    Transfer funds from virtual account
//  * @access  Private
//  * @body    { amount, destinationType, destinationId, description?, pin? }
//  */
// router.post(
//   '/:accountId/transfer',
//   validateRequest(paymentValidation.transferFromVirtualAccount),
//   transferFromVirtualAccount
// );

// /**
//  * @route   POST /api/virtual-accounts/:accountId/deactivate
//  * @desc    Deactivate virtual account
//  * @access  Private
//  * @body    { reason?, transferRemainingBalance? }
//  */
// router.post(
//   '/:accountId/deactivate',
//   validateRequest(paymentValidation.deactivateVirtualAccount),
//   deactivateVirtualAccount
// );

// /**
//  * @route   POST /api/virtual-accounts/:accountId/reactivate
//  * @desc    Reactivate virtual account
//  * @access  Private
//  */
// router.post(
//   '/:accountId/reactivate',
//   validateRequest(paymentValidation.reactivateVirtualAccount),
//   reactivateVirtualAccount
// );

// export default router;


// backend/payment-service/src/routes/virtualAccounts.ts

// import { Router } from 'express';
// import { VirtualAccountController } from '../controllers/virtualAccountController';
// import { auth } from '../../../shared/src/middleware/auth';
// import { rateLimiter } from '../../../shared/src/middleware/rateLimiter';
// import { 
//   validateCreateOwnerAccount,
//   validateCreateAgentAccount,
//   validateTransferFunds,
//   validateAccountId
// } from '../middleware/virtualAccountValidation';

// const router = Router();
// const virtualAccountController = new VirtualAccountController();

// // Apply auth middleware to all routes
// router.use(auth);

// /**
//  * @route   POST /api/virtual-accounts/owner
//  * @desc    Create virtual account for property owner
//  * @access  Private
//  */
// router.post(
//   '/owner',
//   rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 requests per 15 minutes
//   validateCreateOwnerAccount,
//   virtualAccountController.createOwnerAccount
// );

// /**
//  * @route   POST /api/virtual-accounts/agent
//  * @desc    Create virtual account for agent
//  * @access  Private
//  */
// router.post(
//   '/agent',
//   rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 requests per 15 minutes
//   validateCreateAgentAccount,
//   virtualAccountController.createAgentAccount
// );

// /**
//  * @route   GET /api/virtual-accounts/my-accounts
//  * @desc    Get current user's virtual accounts
//  * @access  Private
//  */
// router.get(
//   '/my-accounts',
//   virtualAccountController.getUserVirtualAccounts
// );

// /**
//  * @route   GET /api/virtual-accounts/:accountId
//  * @desc    Get virtual account details
//  * @access  Private
//  */
// router.get(
//   '/:accountId',
//   validateAccountId,
//   virtualAccountController.getVirtualAccount
// );

// /**
//  * @route   GET /api/virtual-accounts/:accountId/balance
//  * @desc    Get virtual account balance
//  * @access  Private
//  */
// router.get(
//   '/:accountId/balance',
//   validateAccountId,
//   virtualAccountController.getAccountBalance
// );

// /**
//  * @route   GET /api/virtual-accounts/:accountId/transactions
//  * @desc    Get virtual account transactions
//  * @access  Private
//  */
// router.get(
//   '/:accountId/transactions',
//   validateAccountId,
//   virtualAccountController.getAccountTransactions
// );

// /**
//  * @route   POST /api/virtual-accounts/:accountId/transfer
//  * @desc    Transfer funds from virtual account
//  * @access  Private
//  */
// router.post(
//   '/:accountId/transfer',
//   rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 transfers per 15 minutes
//   validateAccountId,
//   validateTransferFunds,
//   virtualAccountController.transferFunds
// );

// /**
//  * @route   PUT /api/virtual-accounts/:accountId/deactivate
//  * @desc    Deactivate virtual account
//  * @access  Private
//  */
// router.put(
//   '/:accountId/deactivate',
//   rateLimiter({ windowMs: 15 * 60 * 1000, max: 3 }), // 3 requests per 15 minutes
//   validateAccountId,
//   virtualAccountController.deactivateAccount
// );

// /**
//  * @route   PUT /api/virtual-accounts/:accountId/reactivate
//  * @desc    Reactivate virtual account
//  * @access  Private
//  */
// router.put(
//   '/:accountId/reactivate',
//   rateLimiter({ windowMs: 15 * 60 * 1000, max: 3 }), // 3 requests per 15 minutes
//   validateAccountId,
//   virtualAccountController.reactivateAccount
// );

// /**
//  * @route   POST /api/virtual-accounts/webhook
//  * @desc    Handle Flutterwave virtual account webhooks
//  * @access  Public (but verified by signature)
//  */
// router.post(
//   '/webhook',
//   rateLimiter({ windowMs: 1 * 60 * 1000, max: 100 }), // 100 webhooks per minute
//   virtualAccountController.handleVirtualAccountWebhook
// );

// export { router as virtualAccountsRouter };