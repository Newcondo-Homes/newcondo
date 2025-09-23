// backend/admin-service/src/routes/virtualAccountAdmin.ts

import { Router } from 'express';
import { 
  getVirtualAccountsController, 
  getVirtualAccountDetailsController,
  createVirtualAccountController,
  deactivateVirtualAccountController,
  reactivateVirtualAccountController,
  updateVirtualAccountController,
  getVirtualAccountStatsController,
  getVirtualAccountTransactionsController,
  freezeVirtualAccountController,
  unfreezeVirtualAccountController,
  bulkVirtualAccountActionsController,
  generateVirtualAccountStatementController
} from '../controllers/virtualAccountAdminController';
import { 
  adminAuth, 
  validateCreateVirtualAccount, 
  validateUpdateVirtualAccount, 
  validateBulkActions 
} from '../middleware/adminValidation';

const router = Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// Get all virtual accounts with filtering and pagination
router.get('/', getVirtualAccountsController);

// Get virtual account statistics
router.get('/stats', getVirtualAccountStatsController);

// Get specific virtual account details
router.get('/:accountId', getVirtualAccountDetailsController);

// Get virtual account transactions history
router.get('/:accountId/transactions', getVirtualAccountTransactionsController);

// Generate virtual account statement
router.get('/:accountId/statement', generateVirtualAccountStatementController);

// Create new virtual account (manual creation by admin)
router.post('/', validateCreateVirtualAccount, createVirtualAccountController);

// Update virtual account details
router.put('/:accountId', validateUpdateVirtualAccount, updateVirtualAccountController);

// Deactivate virtual account
router.patch('/:accountId/deactivate', deactivateVirtualAccountController);

// Reactivate virtual account
router.patch('/:accountId/reactivate', reactivateVirtualAccountController);

// Freeze virtual account (temporary suspension)
router.patch('/:accountId/freeze', freezeVirtualAccountController);

// Unfreeze virtual account
router.patch('/:accountId/unfreeze', unfreezeVirtualAccountController);

// Bulk actions on multiple virtual accounts
router.post('/bulk-actions', validateBulkActions, bulkVirtualAccountActionsController);

export default router;