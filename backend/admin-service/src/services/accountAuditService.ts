// backend/admin-service/src/services/accountAuditService.ts

import { PrismaClient } from '@newcondo/db';
import { logger } from '../../shared/src/middleware/logger';

const prisma = new PrismaClient();

interface AuditLogEntry {
  id: string;
  accountId: string;
  adminId?: string;
  action: AuditAction;
  description: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  adminName?: string;
}

interface BulkActionResult {
  successful: string[];
  failed: { accountId: string; error: string }[];
}

type AuditAction = 
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_UPDATED'
  | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_REACTIVATED'
  | 'ACCOUNT_FROZEN'
  | 'ACCOUNT_UNFROZEN'
  | 'BALANCE_CREDITED'
  | 'BALANCE_DEBITED'
  | 'BALANCE_ADJUSTED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_RELEASED'
  | 'FLUTTERWAVE_SYNC'
  | 'BULK_ACTION'
  | 'STATEMENT_GENERATED'
  | 'RECONCILIATION_PERFORMED'
  | 'COMPLIANCE_CHECK';

export class AccountAuditService {
  
  // Log an account-related action
  async logAccountAction(
    accountId: string,
    adminId: string | null,
    action: AuditAction,
    description: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLogEntry> {
    try {
      // Get admin details if adminId is provided
      let adminName: string | undefined;
      if (adminId) {
        const admin = await prisma.user.findUnique({
          where: { id: adminId },
          select: { name: true, email: true }
        });
        adminName = admin?.name || admin?.email || 'Unknown Admin';
      }

      // For now, we'll store audit logs in the EventLog table
      // In a production system, you might want a dedicated audit table
      const auditEntry = await prisma.eventLog.create({
        data: {
          userId: adminId,
          type: `VIRTUAL_ACCOUNT_${action}`,
          metadata: {
            accountId,
            action,
            description,
            adminName,
            ipAddress,
            userAgent,
            ...metadata
          },
          ipAddress,
          userAgent
        }
      });

      const auditLogEntry: AuditLogEntry = {
        id: auditEntry.id,
        accountId,
        adminId: adminId || undefined,
        action,
        description,
        metadata: auditEntry.metadata,
        ipAddress: auditEntry.ipAddress || undefined,
        userAgent: auditEntry.userAgent || undefined,
        timestamp: auditEntry.timestamp,
        adminName
      };

      logger.info(`Account audit logged: ${action} for account ${accountId}`, {
        accountId,
        action,
        adminId,
        description
      });

      return auditLogEntry;

    } catch (error) {
      logger.error('Error logging account audit:', error);
      throw new Error('Failed to log account audit');
    }
  }

  // Get audit history for a specific account
  async getAccountAuditHistory(
    accountId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    try {
      const whereClause: any = {
        type: { startsWith: 'VIRTUAL_ACCOUNT_' },
        metadata: { path: ['accountId'], equals: accountId }
      };

      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) {
          whereClause.timestamp.gte = startDate;
        }
        if (endDate) {
          whereClause.timestamp.lte = endDate;
        }
      }

      const auditLogs = await prisma.eventLog.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });

      const auditEntries: AuditLogEntry[] = auditLogs.map(log => ({
        id: log.id,
        accountId,
        adminId: log.userId || undefined,
        action: log.metadata?.action || 'UNKNOWN',
        description: log.metadata?.description || 'No description',
        metadata: log.metadata,
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        timestamp: log.timestamp,
        adminName: log.user?.name || log.user?.email || 'System'
      }));

      return auditEntries;

    } catch (error) {
      logger.error('Error fetching account audit history:', error);
      throw new Error('Failed to fetch account audit history');
    }
  }

  // Log balance changes
  async logBalanceChange(
    accountId: string,
    adminId: string | null,
    action: 'BALANCE_CREDITED' | 'BALANCE_DEBITED' | 'BALANCE_ADJUSTED',
    amount: number,
    previousBalance: number,
    newBalance: number,
    reason: string,
    transactionRef?: string
  ): Promise<AuditLogEntry> {
    try {
      const metadata = {
        amount,
        previousBalance,
        newBalance,
        balanceChange: newBalance - previousBalance,
        currency: 'NGN',
        transactionRef,
        reason
      };

      const description = `Balance ${action.toLowerCase().replace('balance_', '')} - ${reason}. Amount: ₦${amount.toLocaleString()}`;

      return await this.logAccountAction(
        accountId,
        adminId,
        action,
        description,
        metadata
      );

    } catch (error) {
      logger.error('Error logging balance change:', error);
      throw error;
    }
  }

  // Log payment-related actions
  async logPaymentAction(
    accountId: string,
    adminId: string | null,
    action: 'PAYMENT_RECEIVED' | 'PAYMENT_RELEASED',
    amount: number,
    paymentRef: string,
    paymentType: string,
    description?: string
  ): Promise<AuditLogEntry> {
    try {
      const metadata = {
        amount,
        currency: 'NGN',
        paymentRef,
        paymentType
      };

      const defaultDescription = `Payment ${action.toLowerCase().replace('payment_', '')} - ${paymentType}. Amount: ₦${amount.toLocaleString()}. Ref: ${paymentRef}`;

      return await this.logAccountAction(
        accountId,
        adminId,
        action,
        description || defaultDescription,
        metadata
      );

    } catch (error) {
      logger.error('Error logging payment action:', error);
      throw error;
    }
  }

  // Log Flutterwave synchronization actions
  async logFlutterwaveSync(
    accountId: string,
    syncType: 'BALANCE_SYNC' | 'TRANSACTION_SYNC' | 'ACCOUNT_CREATION',
    status: 'SUCCESS' | 'FAILED' | 'PARTIAL',
    details?: any
  ): Promise<AuditLogEntry> {
    try {
      const metadata = {
        syncType,
        status,
        timestamp: new Date().toISOString(),
        ...details
      };

      const description = `Flutterwave ${syncType.toLowerCase().replace('_', ' ')} - Status: ${status}`;

      return await this.logAccountAction(
        accountId,
        null, // System action, no admin
        'FLUTTERWAVE_SYNC',
        description,
        metadata
      );

    } catch (error) {
      logger.error('Error logging Flutterwave sync:', error);
      throw error;
    }
  }

  // Log bulk actions
  async logBulkAction(
    adminId: string,
    action: string,
    accountIds: string[],
    reason?: string,
    results?: BulkActionResult
  ): Promise<AuditLogEntry> {
    try {
      const metadata = {
        action,
        accountIds,
        accountCount: accountIds.length,
        reason,
        results,
        successCount: results?.successful.length || 0,
        failureCount: results?.failed.length || 0
      };

      const description = `Bulk ${action} performed on ${accountIds.length} accounts${reason ? ` - ${reason}` : ''}`;

      // Log as a general audit entry (not tied to specific account)
      const auditEntry = await prisma.eventLog.create({
        data: {
          userId: adminId,
          type: 'VIRTUAL_ACCOUNT_BULK_ACTION',
          metadata,
        }
      });

      // Also log individual entries for each account
      for (const accountId of accountIds) {
        await this.logAccountAction(
          accountId,
          adminId,
          'BULK_ACTION',
          `Part of bulk ${action} operation${reason ? ` - ${reason}` : ''}`,
          { bulkActionId: auditEntry.id, action }
        );
      }

      return {
        id: auditEntry.id,
        accountId: 'BULK',
        adminId,
        action: 'BULK_ACTION',
        description,
        metadata: auditEntry.metadata,
        timestamp: auditEntry.timestamp
      };

    } catch (error) {
      logger.error('Error logging bulk action:', error);
      throw error;
    }
  }

  // Log account reconciliation
  async logReconciliation(
    accountId: string,
    adminId: string,
    reconciliationType: 'MANUAL' | 'AUTOMATED' | 'PERIODIC',
    discrepancies: any[],
    resolutionActions: string[]
  ): Promise<AuditLogEntry> {
    try {
      const metadata = {
        reconciliationType,
        discrepancies,
        discrepancyCount: discrepancies.length,
        resolutionActions,
        resolutionActionCount: resolutionActions.length,
      };

      const description = `Reconciliation performed (${reconciliationType}). Discrepancies found: ${discrepancies.length}.`;

      return await this.logAccountAction(
        accountId,
        adminId,
        'RECONCILIATION_PERFORMED',
        description,
        metadata
      );
    } catch (error) {
      logger.error('Error logging reconciliation:', error);
      throw error;
    }
  }
}