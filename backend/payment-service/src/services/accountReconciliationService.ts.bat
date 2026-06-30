// backend/payment-service/src/services/accountReconciliationService.ts

import { PrismaClient, VirtualAccount, Payment } from '@newcondo/db';
import { Decimal } from '@prisma/client/runtime/library';

interface ReconciliationReport {
  accountId: string;
  accountNumber: string;
  accountName: string;
  currentBalance: Decimal;
  calculatedBalance: Decimal;
  difference: Decimal;
  discrepancies: AccountDiscrepancy[];
  totalCredits: Decimal;
  totalDebits: Decimal;
  transactionCount: number;
  lastReconciled: Date;
  status: 'BALANCED' | 'DISCREPANCY' | 'ERROR';
}

interface AccountDiscrepancy {
  type: 'MISSING_TRANSACTION' | 'AMOUNT_MISMATCH' | 'DUPLICATE_TRANSACTION' | 'TIMING_ISSUE';
  transactionId?: string;
  expectedAmount?: Decimal;
  actualAmount?: Decimal;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface ReconciliationSummary {
  totalAccountsReconciled: number;
  balancedAccounts: number;
  accountsWithDiscrepancies: number;
  totalDiscrepancyAmount: Decimal;
  averageBalancePerAccount: Decimal;
  recommendedActions: string[];
}

interface ReconciliationFilters {
  userId?: string;
  propertyId?: string;
  startDate?: Date;
  endDate?: Date;
  minimumBalance?: Decimal;
  accountStatus?: 'ACTIVE' | 'INACTIVE';
}

class AccountReconciliationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Perform reconciliation for a specific virtual account
   */
  async reconcileAccount(accountId: string): Promise<ReconciliationReport> {
    try {
      const account = await this.prisma.virtualAccount.findUnique({
        where: { id: accountId },
        include: {
          user: true,
          property: true,
        },
      });

      if (!account) {
        throw new Error(`Virtual account ${accountId} not found`);
      }

      // Get all transactions for this account
      const transactions = await this.getAccountTransactions(accountId);
      
      // Calculate expected balance based on transactions
      const calculatedBalance = this.calculateBalanceFromTransactions(transactions);
      
      // Compare with current balance
      const difference = account.balance.minus(calculatedBalance);
      
      // Identify discrepancies
      const discrepancies = await this.identifyDiscrepancies(account, transactions);
      
      // Calculate transaction summary
      const { totalCredits, totalDebits } = this.calculateTransactionSummary(transactions);
      
      // Determine reconciliation status
      const status = this.determineReconciliationStatus(difference, discrepancies);

      return {
        accountId: account.id,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        currentBalance: account.balance,
        calculatedBalance,
        difference,
        discrepancies,
        totalCredits,
        totalDebits,
        transactionCount: transactions.length,
        lastReconciled: new Date(),
        status,
      };
    } catch (error) {
      console.error('Account reconciliation error:', error);
      throw new Error(`Failed to reconcile account ${accountId}: ${error.message}`);
    }
  }

  /**
   * Perform bulk reconciliation for multiple accounts
   */
  async reconcileMultipleAccounts(filters?: ReconciliationFilters): Promise<ReconciliationReport[]> {
    try {
      const accounts = await this.getAccountsForReconciliation(filters);
      
      const reconciliationPromises = accounts.map(account => 
        this.reconcileAccount(account.id)
      );

      const reports = await Promise.allSettled(reconciliationPromises);
      
      return reports
        .filter((result): result is PromiseFulfilledResult<ReconciliationReport> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
    } catch (error) {
      console.error('Bulk reconciliation error:', error);
      throw new Error(`Failed to perform bulk reconciliation: ${error.message}`);
    }
  }

  /**
   * Generate reconciliation summary report
   */
  async generateReconciliationSummary(filters?: ReconciliationFilters): Promise<ReconciliationSummary> {
    try {
      const reports = await this.reconcileMultipleAccounts(filters);
      
      const totalAccountsReconciled = reports.length;
      const balancedAccounts = reports.filter(r => r.status === 'BALANCED').length;
      const accountsWithDiscrepancies = reports.filter(r => r.status === 'DISCREPANCY').length;
      
      const totalDiscrepancyAmount = reports.reduce(
        (sum, report) => sum.plus(report.difference.abs()),
        new Decimal(0)
      );
      
      const averageBalancePerAccount = reports.length > 0 
        ? reports.reduce((sum, report) => sum.plus(report.currentBalance), new Decimal(0))
            .dividedBy(reports.length)
        : new Decimal(0);

      const recommendedActions = this.generateRecommendedActions(reports);

      return {
        totalAccountsReconciled,
        balancedAccounts,
        accountsWithDiscrepancies,
        totalDiscrepancyAmount,
        averageBalancePerAccount,
        recommendedActions,
      };
    } catch (error) {
      console.error('Summary generation error:', error);
      throw new Error(`Failed to generate reconciliation summary: ${error.message}`);
    }
  }

  /**
   * Auto-fix minor discrepancies
   */
  async autoFixDiscrepancies(accountId: string): Promise<boolean> {
    try {
      const report = await this.reconcileAccount(accountId);
      
      if (report.status === 'BALANCED') {
        return true;
      }

      // Only auto-fix minor discrepancies
      const minorDiscrepancies = report.discrepancies.filter(d => 
        d.severity === 'LOW' && 
        (d.type === 'TIMING_ISSUE' || d.type === 'AMOUNT_MISMATCH')
      );

      if (minorDiscrepancies.length === 0) {
        return false;
      }

      // Update account balance to calculated balance if difference is minor
      if (report.difference.abs().lessThanOrEqualTo(new Decimal(100))) { // 1 NGN tolerance
        await this.prisma.virtualAccount.update({
          where: { id: accountId },
          data: { 
            balance: report.calculatedBalance,
            updatedAt: new Date(),
          },
        });

        // Log the auto-fix action
        await this.logReconciliationAction(accountId, 'AUTO_FIX', {
          originalBalance: report.currentBalance,
          correctedBalance: report.calculatedBalance,
          difference: report.difference,
          fixedDiscrepancies: minorDiscrepancies,
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Auto-fix error:', error);
      return false;
    }
  }

  /**
   * Get transactions for a specific account
   */
  private async getAccountTransactions(accountId: string): Promise<Payment[]> {
    const account = await this.prisma.virtualAccount.findUnique({
      where: { id: accountId },
      include: { user: true },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Get all payments related to this user/property
    const payments = await this.prisma.payment.findMany({
      where: {
        OR: [
          { userId: account.userId },
          ...(account.propertyId ? [{ 
            rental: { propertyId: account.propertyId } 
          }] : []),
        ],
        status: { in: ['SUCCESS', 'HELD', 'RELEASED'] },
      },
      include: {
        rental: {
          include: {
            property: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return payments;
  }

  /**
   * Calculate balance from transaction history
   */
  private calculateBalanceFromTransactions(transactions: Payment[]): Decimal {
    return transactions.reduce((balance, transaction) => {
      // Credits: successful payments
      if (transaction.status === 'SUCCESS' || transaction.status === 'RELEASED') {
        return balance.plus(transaction.amount);
      }
      
      // Debits: refunds, withdrawals, etc.
      if (transaction.status === 'REFUNDED') {
        return balance.minus(transaction.amount);
      }

      return balance;
    }, new Decimal(0));
  }

  /**
   * Identify discrepancies in account
   */
  private async identifyDiscrepancies(
    account: VirtualAccount, 
    transactions: Payment[]
  ): Promise<AccountDiscrepancy[]> {
    const discrepancies: AccountDiscrepancy[] = [];

    // Check for duplicate transactions
    const duplicates = this.findDuplicateTransactions(transactions);
    duplicates.forEach(duplicate => {
      discrepancies.push({
        type: 'DUPLICATE_TRANSACTION',
        transactionId: duplicate.id,
        description: `Duplicate transaction found: ${duplicate.flutterwaveRef}`,
        severity: 'MEDIUM',
      });
    });

    // Check for missing transactions (payments that should affect this account but don't appear)
    const missingTransactions = await this.findMissingTransactions(account);
    missingTransactions.forEach(missing => {
      discrepancies.push({
        type: 'MISSING_TRANSACTION',
        transactionId: missing.id,
        expectedAmount: missing.amount,
        description: `Missing transaction from reconciliation: ${missing.description}`,
        severity: 'HIGH',
      });
    });

    // Check for amount mismatches
    const amountMismatches = this.findAmountMismatches(transactions);
    amountMismatches.forEach(mismatch => {
      discrepancies.push({
        type: 'AMOUNT_MISMATCH',
        transactionId: mismatch.transactionId,
        expectedAmount: mismatch.expectedAmount,
        actualAmount: mismatch.actualAmount,
        description: mismatch.description,
        severity: 'MEDIUM',
      });
    });

    return discrepancies;
  }

  /**
   * Find duplicate transactions
   */
  private findDuplicateTransactions(transactions: Payment[]): Payment[] {
    const seen = new Map<string, Payment>();
    const duplicates: Payment[] = [];

    transactions.forEach(transaction => {
      if (transaction.flutterwaveRef) {
        if (seen.has(transaction.flutterwaveRef)) {
          duplicates.push(transaction);
        } else {
          seen.set(transaction.flutterwaveRef, transaction);
        }
      }
    });

    return duplicates;
  }

  /**
   * Find missing transactions
   */
  private async findMissingTransactions(account: VirtualAccount): Promise<Payment[]> {
    // This would implement logic to find transactions that should be in this account
    // but are missing from the reconciliation
    // For now, return empty array
    return [];
  }

  /**
   * Find amount mismatches
   */
  private findAmountMismatches(transactions: Payment[]): Array<{
    transactionId: string;
    expectedAmount: Decimal;
    actualAmount: Decimal;
    description: string;
  }> {
    // This would implement logic to detect amount discrepancies
    // For now, return empty array
    return [];
  }

  /**
   * Calculate transaction summary
   */
  private calculateTransactionSummary(transactions: Payment[]): {
    totalCredits: Decimal;
    totalDebits: Decimal;
  } {
    let totalCredits = new Decimal(0);
    let totalDebits = new Decimal(0);

    transactions.forEach(transaction => {
      if (transaction.status === 'SUCCESS' || transaction.status === 'RELEASED') {
        totalCredits = totalCredits.plus(transaction.amount);
      } else if (transaction.status === 'REFUNDED') {
        totalDebits = totalDebits.plus(transaction.amount);
      }
    });

    return { totalCredits, totalDebits };
  }

  /**
   * Determine reconciliation status
   */
  private determineReconciliationStatus(
    difference: Decimal, 
    discrepancies: AccountDiscrepancy[]
  ): 'BALANCED' | 'DISCREPANCY' | 'ERROR' {
    if (difference.equals(0) && discrepancies.length === 0) {
      return 'BALANCED';
    }

    const hasHighSeverityDiscrepancies = discrepancies.some(d => d.severity === 'HIGH');
    if (hasHighSeverityDiscrepancies) {
      return 'ERROR';
    }

    return 'DISCREPANCY';
  }

  /**
   * Get accounts for reconciliation based on filters
   */
  private async getAccountsForReconciliation(
    filters?: ReconciliationFilters
  ): Promise<VirtualAccount[]> {
    const whereClause: any = {
      isActive: filters?.accountStatus === 'INACTIVE' ? false : true,
    };

    if (filters?.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters?.propertyId) {
      whereClause.propertyId = filters.propertyId;
    }

    if (filters?.minimumBalance) {
      whereClause.balance = {
        gte: filters.minimumBalance,
      };
    }

    return await this.prisma.virtualAccount.findMany({
      where: whereClause,
      include: {
        user: true,
        property: true,
      },
    });
  }

  /**
   * Generate recommended actions based on reconciliation reports
   */
  private generateRecommendedActions(reports: ReconciliationReport[]): string[] {
    const actions: string[] = [];

    const errorAccounts = reports.filter(r => r.status === 'ERROR').length;
    const discrepancyAccounts = reports.filter(r => r.status === 'DISCREPANCY').length;

    if (errorAccounts > 0) {
      actions.push(`Investigate ${errorAccounts} accounts with high-severity discrepancies`);
    }

    if (discrepancyAccounts > 0) {
      actions.push(`Review ${discrepancyAccounts} accounts with minor discrepancies`);
    }

    const highBalanceAccounts = reports.filter(r => 
      r.currentBalance.greaterThan(new Decimal(1000000))
    ).length;
    
    if (highBalanceAccounts > 0) {
      actions.push(`Monitor ${highBalanceAccounts} high-balance accounts for security`);
    }

    if (actions.length === 0) {
      actions.push('All accounts are balanced - no immediate action required');
    }

    return actions;
  }

  /**
   * Log reconciliation actions
   */
  private async logReconciliationAction(
    accountId: string,
    action: string,
    metadata: any
  ): Promise<void> {
    try {
      await this.prisma.eventLog.create({
        data: {
          type: `RECONCILIATION_${action}`,
          metadata: {
            accountId,
            ...metadata,
          },
        },
      });
    } catch (error) {
      console.error('Failed to log reconciliation action:', error);
    }
  }
}

export { AccountReconciliationService };
export type { 
  ReconciliationReport, 
  AccountDiscrepancy, 
  ReconciliationSummary, 
  ReconciliationFilters 
};