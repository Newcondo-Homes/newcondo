// backend/marking-service/src/controllers/markingVirtualAccountController.ts

import { Request, Response } from 'express';
import { markingVirtualAccountService } from '../services/markingVirtualAccountService';
import { responseHandler } from '../../../shared/src/utils/response';
import { logger } from '../../../shared/src/middleware/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export class MarkingVirtualAccountController {
  /**
   * Create virtual account for agent
   */
  static async createAgentVirtualAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const { agentId } = req.params;
      const adminId = req.user?.id;

      // Verify admin permissions
      if (req.user?.role !== 'ADMIN') {
        return responseHandler.error(res, 'Unauthorized access', 403);
      }

      const virtualAccount = await markingVirtualAccountService.createAgentVirtualAccount(agentId, adminId);

      logger.info('Agent virtual account created', { 
        agentId, 
        accountNumber: virtualAccount.accountNumber,
        createdBy: adminId 
      });

      return responseHandler.success(res, virtualAccount, 'Agent virtual account created successfully');
    } catch (error) {
      logger.error('Error creating agent virtual account:', error);
      return responseHandler.error(res, error instanceof Error ? error.message : 'Failed to create virtual account');
    }
  }

  /**
   * Get agent virtual account details
   */
  static async getAgentVirtualAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const { agentId } = req.params;
      const requesterId = req.user?.id;

      // Check if user is the agent themselves or an admin
      if (requesterId !== agentId && req.user?.role !== 'ADMIN') {
        return responseHandler.error(res, 'Unauthorized access', 403);
      }

      const virtualAccount = await markingVirtualAccountService.getAgentVirtualAccount(agentId);

      if (!virtualAccount) {
        return responseHandler.error(res, 'Virtual account not found', 404);
      }

      return responseHandler.success(res, virtualAccount, 'Virtual account retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving agent virtual account:', error);
      return responseHandler.error(res, error instanceof Error ? error.message : 'Failed to retrieve virtual account');
    }
  }

  /**
   * Get virtual account balance
   */
  static async getVirtualAccountBalance(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const requesterId = req.user?.id;

      const balance = await markingVirtualAccountService.getVirtualAccountBalance(accountId, requesterId);

      return responseHandler.success(res, balance, 'Balance retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving virtual account balance:', error);
      return responseHandler.error(res, error instanceof Error ? error.message : 'Failed to retrieve balance');
    }
  }

  /**
   * Process payment to virtual account
   */
  static async processPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const { amount, markingJobId, description } = req.body;
      const userId = req.user?.id;

      const paymentResult = await markingVirtualAccountService.processPaymentToVirtualAccount({
        accountId,
        amount: parseFloat(amount),
        markingJobId,
        description,
        userId: userId!
      });

      logger.info('Payment processed to virtual account', { 
        accountId, 
        amount, 
        markingJobId,
        userId 
      });

      return responseHandler.success(res, paymentResult, 'Payment processed successfully');
    } catch (error) {
      logger.error('Error processing payment to virtual account:', error);
      return responseHandler.error(res, error instanceof Error ? error.message : 'Failed to process payment');
    }
  }

  /**
   * Release payment from virtual account
   */
  static async releasePayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId, markingJobId } = req.params;
      const { releaseAmount, releaseNotes } = req.body;
      const adminId = req.user?.id;

      // Verify admin permissions
      if (req.user?.role !== 'ADMIN') {
        return responseHandler.error(res, 'Unauthorized access', 403);
      }

      const releaseResult = await markingVirtualAccountService.releasePayment({
        accountId,
        markingJobId,
        releaseAmount: releaseAmount ? parseFloat(releaseAmount) : undefined,
        releaseNotes,
        releasedBy: adminId!
      });

      logger.info('Payment released from virtual account', { 
        accountId, 
        markingJobId, 
        releaseAmount,
        releasedBy: adminId 
      });

      return responseHandler.success(res, releaseResult, 'Payment released successfully');
    } catch (error) {
      logger.error('Error releasing payment from virtual account:', error);
      return responseHandler.error(res, error instanceof Error ? error.message : 'Failed to release payment');
    }
  }

  /**
   * Get virtual account statement
   */
  static async getAccountStatement(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const { startDate, endDate, page = '1', limit = '20' } = req.query;
      const requesterId = req.user?.id;

      const statement = await markingVirtualAccountService.getAccountStatement({
        accountId,
        requesterId: requesterId!,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      return responseHandler.success(res, statement, 'Account statement retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving account statement:', error);
      return responseHandler.error(res, error instanceof Error ? error.message : 'Failed to retrieve statement');
    }
  }

  /**
   * Update virtual account status
   */
  static async updateAccountStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const { isActive, reason } = req.body;
      const adminId = req.user?.id;

      // Verify admin permissions
      if (req.user?.role !== 'ADMIN') {
        return responseHandler.error(res, 'Unauthorized access', 403);
      }

      const updatedAccount = await markingVirtualAccountService.updateAccountStatus({
        accountId,
        isActive,
        reason,
        updatedBy: adminId!
      });

      logger.info('Virtual account status updated', { 
        accountId, 
        isActive, 
        reason,
        updatedBy: adminId 
      });

      return responseHandler.success(res, updatedAccount, 'Account status updated successfully');
    } catch (error) {
      logger.error('Error updating account status:', error);
      return responseHandler.error(res, error instanceof Error ? error.message : 'Failed to update account status');
    }
  }

  /**
   * Get all agent virtual accounts (Admin only)
   */
  static async getAllAgentAccounts(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = '1', limit = '20', status, search } = req.query;

      // Verify admin permissions
      if (req.user?.role !== 'ADMIN') {
        return responseHandler.error(res, 'Unauthorized access', 403);
      }

      const accounts = await markingVirtualAccountService.getAllAgentAccounts({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        search: search as string
      });

      return responseHandler.success(res, accounts, 'Agent accounts retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving agent accounts:', error);
      return responseHandler.error(res, error instanceof Error ? error.message : 'Failed to retrieve accounts');
    }
  }

  /**
   * Process bulk payment release (Admin only)
   */
  static async processBulkPaymentRelease(req: AuthenticatedRequest, res: Response) {
    try {
      const { releases } = req.body; // Array of {accountId, markingJobId, amount}
      const adminId = req.user?.id;

      // Verify admin permissions
      if (req.user?.role !== 'ADMIN') {
        return responseHandler.error(res, 'Unauthorized access', 403);
      }

      const results = await markingVirtualAccountService.processBulkPaymentRelease({
        releases,
        releasedBy: adminId!
      });

      logger.info('Bulk payment release processed', { 
        releaseCount: releases.length,
        processedBy: adminId 
      });

      return responseHandler.success(res, results, 'Bulk payment release processed successfully');
    } catch (error) {
      logger.error('Error processing bulk payment release:', error);
      return responseHandler.error(res, error instanceof Error ? error.message : 'Failed to process bulk release');
    }
  }

  /**
   * Reconcile virtual account with Flutterwave
   */
  static async reconcileAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const adminId = req.user?.id;

      // Verify admin permissions
      if (req.user?.role !== 'ADMIN') {
        return responseHandler.error(res, 'Unauthorized access', 403);
      }

      const reconciliationResult = await markingVirtualAccountService.reconcileAccountWithFlutterwave(accountId);

      logger.info('Virtual account reconciled', { 
        accountId,
        reconciledBy: adminId 
      });

      return responseHandler.success(res, reconciliationResult, 'Account reconciled successfully');
    } catch (error) {
      logger.error('Error reconciling account:', error);
      return responseHandler.error(res, error instanceof Error ? error.message : 'Failed to reconcile account');
    }
  }
}