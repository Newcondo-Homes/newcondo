// backend/admin-service/src/controllers/virtualAccountAdminController.ts

import { Request, Response } from 'express';
import { VirtualAccountAdminService } from '../services/virtualAccountAdminService';
import { AccountAuditService } from '../services/accountAuditService';

export class VirtualAccountAdminController {
  constructor(
    private virtualAccountAdminService: VirtualAccountAdminService,
    private accountAuditService: AccountAuditService
  ) {}

  // Get all virtual accounts with filtering and pagination
  getAllAccounts = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        userType,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        minBalance,
        maxBalance,
        createdAfter,
        createdBefore
      } = req.query;

      const filters = {
        status: status as string,
        userType: userType as string,
        search: search as string,
        minBalance: minBalance ? parseFloat(minBalance as string) : undefined,
        maxBalance: maxBalance ? parseFloat(maxBalance as string) : undefined,
        createdAfter: createdAfter ? new Date(createdAfter as string) : undefined,
        createdBefore: createdBefore ? new Date(createdBefore as string) : undefined,
      };

      const pagination = {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100), // Max 100 per page
      };

      const sort = {
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.virtualAccountAdminService.getAllAccounts(
        filters,
        pagination,
        sort
      );

      // Log admin action
      await this.accountAuditService.logAdminAction({
        adminId: req.user!.id,
        action: 'VIEWED_ALL_ACCOUNTS',
        targetType: 'VirtualAccount',
        targetId: 'multiple',
        description: `Viewed virtual accounts list with filters: ${JSON.stringify(filters)}`,
        metadata: { filters, pagination, sort },
      });

      res.status(200).json({
        success: true,
        message: 'Virtual accounts retrieved successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error fetching virtual accounts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch virtual accounts',
        error: 'FETCH_ACCOUNTS_ERROR',
      });
    }
  };

  // Get account details by ID
  getAccountById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountId } = req.params;
      const { includeTransactions = 'false', transactionLimit = '20' } = req.query;

      const account = await this.virtualAccountAdminService.getAccountById(
        accountId,
        {
          includeTransactions: includeTransactions === 'true',
          transactionLimit: parseInt(transactionLimit as string),
        }
      );

      if (!account) {
        res.status(404).json({
          success: false,
          message: 'Virtual account not found',
          error: 'ACCOUNT_NOT_FOUND',
        });
        return;
      }

      // Log admin action
      await this.accountAuditService.logAdminAction({
        adminId: req.user!.id,
        action: 'VIEWED_ACCOUNT_DETAILS',
        targetType: 'VirtualAccount',
        targetId: accountId,
        description: `Viewed details for account: ${account.accountNumber}`,
      });

      res.status(200).json({
        success: true,
        message: 'Account details retrieved successfully',
        data: account,
      });
    } catch (error) {
      console.error('Error fetching account details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch account details',
        error: 'FETCH_ACCOUNT_ERROR',
      });
    }
  };

  // Update account status (activate/deactivate/freeze)
  updateAccountStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountId } = req.params;
      const { isActive, reason } = req.body;

      const updatedAccount = await this.virtualAccountAdminService.updateAccountStatus(
        accountId,
        isActive,
        reason
      );

      // Log admin action
      await this.accountAuditService.logAdminAction({
        adminId: req.user!.id,
        action: isActive ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_DEACTIVATED',
        targetType: 'VirtualAccount',
        targetId: accountId,
        description: `${isActive ? 'Activated' : 'Deactivated'} account: ${updatedAccount.accountNumber}. Reason: ${reason}`,
        metadata: { isActive, reason },
      });

      res.status(200).json({
        success: true,
        message: `Account ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedAccount,
      });
    } catch (error) {
      console.error('Error updating account status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update account status',
        error: 'UPDATE_STATUS_ERROR',
      });
    }
  };

  // Manually adjust account balance
  adjustAccountBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountId } = req.params;
      const { amount, transactionType, reference, description } = req.body;

      const result = await this.virtualAccountAdminService.adjustAccountBalance(
        accountId,
        amount,
        transactionType,
        reference,
        description,
        req.user!.id
      );

      // Log admin action
      await this.accountAuditService.logAdminAction({
        adminId: req.user!.id,
        action: 'BALANCE_ADJUSTED',
        targetType: 'VirtualAccount',
        targetId: accountId,
        description: `${transactionType} adjustment of ${amount} NGN. Reference: ${reference}`,
        metadata: { amount, transactionType, reference, description },
      });

      res.status(200).json({
        success: true,
        message: 'Account balance adjusted successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error adjusting account balance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to adjust account balance',
        error: 'BALANCE_ADJUSTMENT_ERROR',
      });
    }
  };

  // Get account transaction history
  getAccountTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountId } = req.params;
      const {
        page = 1,
        limit = 50,
        startDate,
        endDate,
        transactionType,
        minAmount,
        maxAmount,
      } = req.query;

      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        transactionType: transactionType as string,
        minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
      };

      const pagination = {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 200), // Max 200 per page
      };

      const transactions = await this.virtualAccountAdminService.getAccountTransactions(
        accountId,
        filters,
        pagination
      );

      // Log admin action
      await this.accountAuditService.logAdminAction({
        adminId: req.user!.id,
        action: 'VIEWED_ACCOUNT_TRANSACTIONS',
        targetType: 'VirtualAccount',
        targetId: accountId,
        description: `Viewed transaction history with filters`,
        metadata: { filters, pagination },
      });

      res.status(200).json({
        success: true,
        message: 'Account transactions retrieved successfully',
        data: transactions,
      });
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch account transactions',
        error: 'FETCH_TRANSACTIONS_ERROR',
      });
    }
  };

  // Bulk operations on multiple accounts
  bulkAccountOperations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountIds, operation, reason } = req.body;

      const result = await this.virtualAccountAdminService.bulkAccountOperations(
        accountIds,
        operation,
        reason,
        req.user!.id
      );

      // Log admin action
      await this.accountAuditService.logAdminAction({
        adminId: req.user!.id,
        action: 'BULK_ACCOUNT_OPERATION',
        targetType: 'VirtualAccount',
        targetId: 'multiple',
        description: `Performed bulk operation: ${operation} on ${accountIds.length} accounts. Reason: ${reason}`,
        metadata: { accountIds, operation, reason, result },
      });

      res.status(200).json({
        success: true,
        message: `Bulk operation completed successfully`,
        data: result,
      });
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk operation',
        error: 'BULK_OPERATION_ERROR',
      });
    }
  };

  // Generate account reconciliation report
  generateReconciliationReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        startDate,
        endDate,
        accountType = 'ALL',
        includeInactive = 'false',
      } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
          error: 'MISSING_DATE_RANGE',
        });
        return;
      }

      const report = await this.virtualAccountAdminService.generateReconciliationReport({
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        accountType: accountType as string,
        includeInactive: includeInactive === 'true',
      });

      // Log admin action
      await this.accountAuditService.logAdminAction({
        adminId: req.user!.id,
        action: 'GENERATED_RECONCILIATION_REPORT',
        targetType: 'VirtualAccount',
        targetId: 'multiple',
        description: `Generated reconciliation report for period ${startDate} to ${endDate}`,
        metadata: { startDate, endDate, accountType, includeInactive },
      });

      res.status(200).json({
        success: true,
        message: 'Reconciliation report generated successfully',
        data: report,
      });
    } catch (error) {
      console.error('Error generating reconciliation report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate reconciliation report',
        error: 'RECONCILIATION_REPORT_ERROR',
      });
    }
  };

  // Get account analytics and statistics
  getAccountAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        timeframe = '30d',
        accountType = 'ALL',
        includeProjections = 'false',
      } = req.query;

      const analytics = await this.virtualAccountAdminService.getAccountAnalytics({
        timeframe: timeframe as string,
        accountType: accountType as string,
        includeProjections: includeProjections === 'true',
      });

      // Log admin action
      await this.accountAuditService.logAdminAction({
        adminId: req.user!.id,
        action: 'VIEWED_ACCOUNT_ANALYTICS',
        targetType: 'VirtualAccount',
        targetId: 'multiple',
        description: `Viewed account analytics for timeframe: ${timeframe}`,
        metadata: { timeframe, accountType, includeProjections },
      });

      res.status(200).json({
        success: true,
        message: 'Account analytics retrieved successfully',
        data: analytics,
      });
    } catch (error) {
      console.error('Error fetching account analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch account analytics',
        error: 'ANALYTICS_ERROR',
      });
    }
  };

  // Force account reconciliation
  forceAccountReconciliation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountId } = req.params;
      const { reconciliationType = 'FULL' } = req.body;

      const result = await this.virtualAccountAdminService.forceAccountReconciliation(
        accountId,
        reconciliationType,
        req.user!.id
      );

      // Log admin action
      await this.accountAuditService.logAdminAction({
        adminId: req.user!.id,
        action: 'FORCED_ACCOUNT_RECONCILIATION',
        targetType: 'VirtualAccount',
        targetId: accountId,
        description: `Forced ${reconciliationType} reconciliation for account`,
        metadata: { reconciliationType, result },
      });

      res.status(200).json({
        success: true,
        message: 'Account reconciliation completed successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error forcing account reconciliation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to force account reconciliation',
        error: 'RECONCILIATION_ERROR',
      });
    }
  };

  // Get suspicious account activities
  getSuspiciousActivities = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 20,
        severity = 'ALL',
        timeframe = '7d',
        resolved = 'false',
      } = req.query;

      const filters = {
        severity: severity as string,
        timeframe: timeframe as string,
        resolved: resolved === 'true',
      };

      const pagination = {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100),
      };

      const activities = await this.virtualAccountAdminService.getSuspiciousActivities(
        filters,
        pagination
      );

      // Log admin action
      await this.accountAuditService.logAdminAction({
        adminId: req.user!.id,
        action: 'VIEWED_SUSPICIOUS_ACTIVITIES',
        targetType: 'VirtualAccount',
        targetId: 'multiple',
        description: `Reviewed suspicious activities with filters`,
        metadata: { filters, pagination },
      });

      res.status(200).json({
        success: true,
        message: 'Suspicious activities retrieved successfully',
        data: activities,
      });
    } catch (error) {
      console.error('Error fetching suspicious activities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch suspicious activities',
        error: 'SUSPICIOUS_ACTIVITIES_ERROR',
      });
    }
  };

  // Export account data
  exportAccountData = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        format = 'csv',
        accountIds,
        includeTransactions = 'false',
        startDate,
        endDate,
      } = req.query;

      const exportConfig = {
        format: format as 'csv' | 'xlsx' | 'pdf',
        accountIds: accountIds ? (accountIds as string).split(',') : undefined,
        includeTransactions: includeTransactions === 'true',
        dateRange: startDate && endDate ? {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
        } : undefined,
      };

      const exportResult = await this.virtualAccountAdminService.exportAccountData(
        exportConfig,
        req.user!.id
      );

      // Log admin action
      await this.accountAuditService.logAdminAction({
        adminId: req.user!.id,
        action: 'EXPORTED_ACCOUNT_DATA',
        targetType: 'VirtualAccount',
        targetId: 'multiple',
        description: `Exported account data in ${format} format`,
        metadata: exportConfig,
      });

      res.status(200).json({
        success: true,
        message: 'Account data exported successfully',
        data: exportResult,
      });
    } catch (error) {
      console.error('Error exporting account data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export account data',
        error: 'EXPORT_ERROR',
      });
    }
  };
}