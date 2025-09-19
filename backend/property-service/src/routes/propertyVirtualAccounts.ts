// backend/property-service/src/routes/propertyVirtualAccounts.ts
import { Router } from 'express';
import { PropertyVirtualAccountController } from '../controllers/propertyVirtualAccountController';
import { authenticateToken } from '../../../shared/src/middleware/auth';
import { rateLimiter } from '../../../shared/src/middleware/rateLimiter';
import { 
  validatePropertyOwnership, 
  validatePropertyAccountAccess,
  validatePropertyAccountCreation 
} from '../middleware/propertyAccountValidation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/property-virtual-accounts
 * @desc    Create a virtual account for a property
 * @access  Private (Property Owner)
 * @body    { propertyId: string, ownerName: string }
 */
router.post(
  '/',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 requests per 15 minutes
  validatePropertyAccountCreation,
  PropertyVirtualAccountController.createVirtualAccount
);

/**
 * @route   GET /api/property-virtual-accounts/user
 * @desc    Get all virtual accounts for the authenticated user
 * @access  Private
 * @query   { page?: number, limit?: number }
 */
router.get(
  '/user',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }), // 30 requests per 15 minutes
  PropertyVirtualAccountController.getUserVirtualAccounts
);

/**
 * @route   GET /api/property-virtual-accounts/property/:propertyId
 * @desc    Get virtual account by property ID
 * @access  Private (Property Owner or Authorized Agent)
 * @params  { propertyId: string }
 */
router.get(
  '/property/:propertyId',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 requests per 15 minutes
  validatePropertyOwnership,
  PropertyVirtualAccountController.getVirtualAccountByProperty
);

/**
 * @route   GET /api/property-virtual-accounts/:accountId
 * @desc    Get virtual account balance
 * @access  Private (Account Owner)
 * @params  { accountId: string }
 */
router.get(
  '/:accountId/balance',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 requests per 15 minutes
  validatePropertyAccountAccess,
  PropertyVirtualAccountController.getVirtualAccountBalance
);

/**
 * @route   GET /api/property-virtual-accounts/:accountId/transactions
 * @desc    Get virtual account transaction history
 * @access  Private (Account Owner)
 * @params  { accountId: string }
 * @query   { page?: number, limit?: number, startDate?: string, endDate?: string, transactionType?: string }
 */
router.get(
  '/:accountId/transactions',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 requests per 15 minutes
  validatePropertyAccountAccess,
  PropertyVirtualAccountController.getVirtualAccountTransactions
);

/**
 * @route   PUT /api/property-virtual-accounts/:accountId
 * @desc    Update virtual account details
 * @access  Private (Account Owner)
 * @params  { accountId: string }
 * @body    { isActive?: boolean, accountName?: string }
 */
router.put(
  '/:accountId',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 requests per 15 minutes
  validatePropertyAccountAccess,
  PropertyVirtualAccountController.updateVirtualAccount
);

/**
 * @route   POST /api/property-virtual-accounts/:accountId/deactivate
 * @desc    Deactivate virtual account
 * @access  Private (Account Owner)
 * @params  { accountId: string }
 */
router.post(
  '/:accountId/deactivate',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 requests per 15 minutes
  validatePropertyAccountAccess,
  PropertyVirtualAccountController.deactivateVirtualAccount
);

/**
 * @route   POST /api/property-virtual-accounts/:accountId/reactivate
 * @desc    Reactivate virtual account
 * @access  Private (Account Owner)
 * @params  { accountId: string }
 */
router.post(
  '/:accountId/reactivate',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 requests per 15 minutes
  validatePropertyAccountAccess,
  PropertyVirtualAccountController.reactivateVirtualAccount
);

/**
 * @route   GET /api/property-virtual-accounts/:accountId/statement
 * @desc    Generate virtual account statement
 * @access  Private (Account Owner)
 * @params  { accountId: string }
 * @query   { startDate: string, endDate: string, format?: 'pdf' | 'excel' }
 */
router.get(
  '/:accountId/statement',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 requests per 15 minutes
  validatePropertyAccountAccess,
  PropertyVirtualAccountController.generateVirtualAccountStatement
);

/**
 * @route   GET /api/property-virtual-accounts/:accountId/reconciliation
 * @desc    Get virtual account reconciliation data
 * @access  Private (Account Owner)
 * @params  { accountId: string }
 * @query   { date?: string }
 */
router.get(
  '/:accountId/reconciliation',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 requests per 15 minutes
  validatePropertyAccountAccess,
  PropertyVirtualAccountController.getVirtualAccountReconciliation
);

export default router;