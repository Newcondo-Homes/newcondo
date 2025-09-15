// backend/payment-service/src/controllers/virtualAccountController.ts
import { Request, Response } from 'express';
import { virtualAccountService } from '../services/virtualAccountService';
import { responseUtil } from '../../../shared/src/utils/response';
import { z } from 'zod';

// Validation schemas
const createVirtualAccountSchema = z.object({
  userId: z.string().min(1),
  propertyId: z.string().min(1).optional(),
  accountName: z.string().min(1),
});

const updateVirtualAccountSchema = z.object({
  accountName: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export class VirtualAccountController {
  /**
   * Create a new virtual account
   */
  async createVirtualAccount(req: Request, res: Response) {
    try {
      const validatedData = createVirtualAccountSchema.parse(req.body);
      
      const virtualAccount = await virtualAccountService.createVirtualAccount(validatedData);
      
      return responseUtil.success(res, virtualAccount, 'Virtual account created successfully', 201);
    } catch (error) {
      console.error('Error creating virtual account:', error);
      
      if (error instanceof z.ZodError) {
        return responseUtil.badRequest(res, 'Invalid input data', error.errors);
      }
      
      return responseUtil.error(res, 'Failed to create virtual account');
    }
  }

  /**
   * Get virtual account by ID
   */
  async getVirtualAccount(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      
      if (!accountId) {
        return responseUtil.badRequest(res, 'Account ID is required');
      }
      
      const virtualAccount = await virtualAccountService.getVirtualAccountById(accountId);
      
      if (!virtualAccount) {
        return responseUtil.notFound(res, 'Virtual account not found');
      }
      
      return responseUtil.success(res, virtualAccount);
    } catch (error) {
      console.error('Error fetching virtual account:', error);
      return responseUtil.error(res, 'Failed to fetch virtual account');
    }
  }

  /**
   * Get virtual accounts for a user
   */
  async getUserVirtualAccounts(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = '1', limit = '10', isActive } = req.query;
      
      if (!userId) {
        return responseUtil.badRequest(res, 'User ID is required');
      }
      
      const filters = {
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };
      
      const result = await virtualAccountService.getUserVirtualAccounts(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );
      
      return responseUtil.success(res, result);
    } catch (error) {
      console.error('Error fetching user virtual accounts:', error);
      return responseUtil.error(res, 'Failed to fetch virtual accounts');
    }
  }

  /**
   * Get virtual account for property
   */
  async getPropertyVirtualAccount(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      
      if (!propertyId) {
        return responseUtil.badRequest(res, 'Property ID is required');
      }
      
      const virtualAccount = await virtualAccountService.getPropertyVirtualAccount(propertyId);
      
      if (!virtualAccount) {
        return responseUtil.notFound(res, 'Virtual account not found for this property');
      }
      
      return responseUtil.success(res, virtualAccount);
    } catch (error) {
      console.error('Error fetching property virtual account:', error);
      return responseUtil.error(res, 'Failed to fetch property virtual account');
    }
  }

  /**
   * Update virtual account
   */
  async updateVirtualAccount(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const validatedData = updateVirtualAccountSchema.parse(req.body);
      
      if (!accountId) {
        return responseUtil.badRequest(res, 'Account ID is required');
      }
      
      const updatedAccount = await virtualAccountService.updateVirtualAccount(accountId, validatedData);
      
      if (!updatedAccount) {
        return responseUtil.notFound(res, 'Virtual account not found');
      }
      
      return responseUtil.success(res, updatedAccount, 'Virtual account updated successfully');
    } catch (error) {
      console.error('Error updating virtual account:', error);
      
      if (error instanceof z.ZodError) {
        return responseUtil.badRequest(res, 'Invalid input data', error.errors);
      }
      
      return responseUtil.error(res, 'Failed to update virtual account');
    }
  }

  /**
   * Deactivate virtual account
   */
  async deactivateVirtualAccount(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      
      if (!accountId) {
        return responseUtil.badRequest(res, 'Account ID is required');
      }
      
      const deactivatedAccount = await virtualAccountService.deactivateVirtualAccount(accountId);
      
      if (!deactivatedAccount) {
        return responseUtil.notFound(res, 'Virtual account not found');
      }
      
      return responseUtil.success(res, deactivatedAccount, 'Virtual account deactivated successfully');
    } catch (error) {
      console.error('Error deactivating virtual account:', error);
      return responseUtil.error(res, 'Failed to deactivate virtual account');
    }
  }

  /**
   * Get virtual account balance
   */
  async getAccountBalance(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      
      if (!accountId) {
        return responseUtil.badRequest(res, 'Account ID is required');
      }
      
      const balance = await virtualAccountService.getAccountBalance(accountId);
      
      return responseUtil.success(res, { balance });
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return responseUtil.error(res, 'Failed to fetch account balance');
    }
  }

  /**
   * Get account transaction history
   */
  async getAccountTransactions(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const { page = '1', limit = '20', startDate, endDate } = req.query;
      
      if (!accountId) {
        return responseUtil.badRequest(res, 'Account ID is required');
      }
      
      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };
      
      const transactions = await virtualAccountService.getAccountTransactions(
        accountId,
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );
      
      return responseUtil.success(res, transactions);
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      return responseUtil.error(res, 'Failed to fetch account transactions');
    }
  }

  /**
   * Sync virtual account with Flutterwave
   */
  async syncWithFlutterwave(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      
      if (!accountId) {
        return responseUtil.badRequest(res, 'Account ID is required');
      }
      
      const syncedAccount = await virtualAccountService.syncWithFlutterwave(accountId);
      
      return responseUtil.success(res, syncedAccount, 'Virtual account synced successfully');
    } catch (error) {
      console.error('Error syncing virtual account:', error);
      return responseUtil.error(res, 'Failed to sync virtual account');
    }
  }
}

export const virtualAccountController = new VirtualAccountController();