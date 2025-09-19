// backend/property-service/src/controllers/propertyVirtualAccountController.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { PropertyVirtualAccountService } from '../services/propertyVirtualAccountService';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';
import { AuthenticatedRequest } from '../../../shared/src/types/common';

const propertyVirtualAccountService = new PropertyVirtualAccountService();

// Validation schemas
const createVirtualAccountSchema = z.object({
  propertyId: z.string().cuid(),
  ownerName: z.string().min(2).max(100),
});

const updateVirtualAccountSchema = z.object({
  isActive: z.boolean().optional(),
  accountName: z.string().min(2).max(100).optional(),
});

const getVirtualAccountBalanceSchema = z.object({
  accountId: z.string().cuid(),
});

export class PropertyVirtualAccountController {
  /**
   * Create a virtual account for a property
   */
  static async createVirtualAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = createVirtualAccountSchema.parse(req.body);
      const userId = req.user!.id;

      const virtualAccount = await propertyVirtualAccountService.createPropertyVirtualAccount({
        ...validatedData,
        userId,
      });

      return successResponse(res, virtualAccount, 'Virtual account created successfully', 201);
    } catch (error) {
      console.error('Error creating virtual account:', error);
      if (error instanceof z.ZodError) {
        return errorResponse(res, 'Validation failed', 400, error.errors);
      }
      return errorResponse(res, 'Failed to create virtual account', 500);
    }
  }

  /**
   * Get virtual account by property ID
   */
  static async getVirtualAccountByProperty(req: AuthenticatedRequest, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = req.user!.id;

      if (!propertyId) {
        return errorResponse(res, 'Property ID is required', 400);
      }

      const virtualAccount = await propertyVirtualAccountService.getVirtualAccountByProperty(
        propertyId,
        userId
      );

      if (!virtualAccount) {
        return errorResponse(res, 'Virtual account not found', 404);
      }

      return successResponse(res, virtualAccount, 'Virtual account retrieved successfully');
    } catch (error) {
      console.error('Error retrieving virtual account:', error);
      return errorResponse(res, 'Failed to retrieve virtual account', 500);
    }
  }

  /**
   * Get all virtual accounts for a user
   */
  static async getUserVirtualAccounts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 10 } = req.query;

      const result = await propertyVirtualAccountService.getUserVirtualAccounts(
        userId,
        {
          page: Number(page),
          limit: Number(limit),
        }
      );

      return successResponse(res, result, 'Virtual accounts retrieved successfully');
    } catch (error) {
      console.error('Error retrieving user virtual accounts:', error);
      return errorResponse(res, 'Failed to retrieve virtual accounts', 500);
    }
  }

  /**
   * Update virtual account details
   */
  static async updateVirtualAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const userId = req.user!.id;
      const validatedData = updateVirtualAccountSchema.parse(req.body);

      if (!accountId) {
        return errorResponse(res, 'Account ID is required', 400);
      }

      const updatedAccount = await propertyVirtualAccountService.updateVirtualAccount(
        accountId,
        userId,
        validatedData
      );

      return successResponse(res, updatedAccount, 'Virtual account updated successfully');
    } catch (error) {
      console.error('Error updating virtual account:', error);
      if (error instanceof z.ZodError) {
        return errorResponse(res, 'Validation failed', 400, error.errors);
      }
      return errorResponse(res, 'Failed to update virtual account', 500);
    }
  }

  /**
   * Get virtual account balance
   */
  static async getVirtualAccountBalance(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const userId = req.user!.id;

      if (!accountId) {
        return errorResponse(res, 'Account ID is required', 400);
      }

      const balance = await propertyVirtualAccountService.getVirtualAccountBalance(
        accountId,
        userId
      );

      return successResponse(res, { balance }, 'Virtual account balance retrieved successfully');
    } catch (error) {
      console.error('Error retrieving virtual account balance:', error);
      return errorResponse(res, 'Failed to retrieve virtual account balance', 500);
    }
  }

  /**
   * Get virtual account transaction history
   */
  static async getVirtualAccountTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const userId = req.user!.id;
      const { 
        page = 1, 
        limit = 20, 
        startDate, 
        endDate, 
        transactionType 
      } = req.query;

      if (!accountId) {
        return errorResponse(res, 'Account ID is required', 400);
      }

      const transactions = await propertyVirtualAccountService.getVirtualAccountTransactions(
        accountId,
        userId,
        {
          page: Number(page),
          limit: Number(limit),
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          transactionType: transactionType as string,
        }
      );

      return successResponse(res, transactions, 'Virtual account transactions retrieved successfully');
    } catch (error) {
      console.error('Error retrieving virtual account transactions:', error);
      return errorResponse(res, 'Failed to retrieve virtual account transactions', 500);
    }
  }

  /**
   * Generate virtual account statement
   */
  static async generateVirtualAccountStatement(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const userId = req.user!.id;
      const { startDate, endDate, format = 'pdf' } = req.query;

      if (!accountId) {
        return errorResponse(res, 'Account ID is required', 400);
      }

      if (!startDate || !endDate) {
        return errorResponse(res, 'Start date and end date are required', 400);
      }

      const statement = await propertyVirtualAccountService.generateAccountStatement(
        accountId,
        userId,
        {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
          format: format as 'pdf' | 'excel',
        }
      );

      return successResponse(res, statement, 'Virtual account statement generated successfully');
    } catch (error) {
      console.error('Error generating virtual account statement:', error);
      return errorResponse(res, 'Failed to generate virtual account statement', 500);
    }
  }

  /**
   * Deactivate virtual account
   */
  static async deactivateVirtualAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const userId = req.user!.id;

      if (!accountId) {
        return errorResponse(res, 'Account ID is required', 400);
      }

      const result = await propertyVirtualAccountService.deactivateVirtualAccount(
        accountId,
        userId
      );

      return successResponse(res, result, 'Virtual account deactivated successfully');
    } catch (error) {
      console.error('Error deactivating virtual account:', error);
      return errorResponse(res, 'Failed to deactivate virtual account', 500);
    }
  }

  /**
   * Reactivate virtual account
   */
  static async reactivateVirtualAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const userId = req.user!.id;

      if (!accountId) {
        return errorResponse(res, 'Account ID is required', 400);
      }

      const result = await propertyVirtualAccountService.reactivateVirtualAccount(
        accountId,
        userId
      );

      return successResponse(res, result, 'Virtual account reactivated successfully');
    } catch (error) {
      console.error('Error reactivating virtual account:', error);
      return errorResponse(res, 'Failed to reactivate virtual account', 500);
    }
  }

  /**
   * Get virtual account reconciliation data
   */
  static async getVirtualAccountReconciliation(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const userId = req.user!.id;
      const { date = new Date().toISOString().split('T')[0] } = req.query;

      if (!accountId) {
        return errorResponse(res, 'Account ID is required', 400);
      }

      const reconciliation = await propertyVirtualAccountService.getAccountReconciliation(
        accountId,
        userId,
        new Date(date as string)
      );

      return successResponse(res, reconciliation, 'Virtual account reconciliation data retrieved successfully');
    } catch (error) {
      console.error('Error retrieving virtual account reconciliation:', error);
      return errorResponse(res, 'Failed to retrieve virtual account reconciliation', 500);
    }
  }
}