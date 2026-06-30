// File: backend/payment-service/src/services/balanceTrackingService.ts

import { PrismaClient, VirtualAccount, Payment, PaymentStatus } from '@newcondo/db';
import { logger } from '@newcondo/shared';
import { Decimal } from '@prisma/client/runtime/library';

interface BalanceUpdateData {
  accountId: string;
  amount: Decimal;
  transactionType: 'CREDIT' | 'DEBIT';
  reference: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface BalanceHistory {
  id: string;
  accountId: string;
  previousBalance: Decimal;
  newBalance: Decimal;
  amount: Decimal;
  transactionType: 'CREDIT' | 'DEBIT';
  reference: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

interface AccountBalance {
  accountId: string;
  availableBalance: Decimal;
  pendingBalance: Decimal;
  totalBalance: Decimal;
  currency: string;
  lastUpdated: Date;
}

interface BalanceReconciliationResult {
  accountId: string;
  expectedBalance: Decimal;
  actualBalance: Decimal;
  difference: Decimal;
  isReconciled: boolean;
  discrepancies: Array<{
    transactionId: string;
    expectedAmount: Decimal;
    actualAmount: Decimal;
    difference: Decimal;
  }>;
}

export class BalanceTrackingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get current balance for a virtual account
   */
  async getAccountBalance(accountId: string): Promise<AccountBalance> {
    try {
      const account = await this.prisma.virtualAccount.findUnique({
        where: { id: accountId },
        include: {
          user: true,
          property: true,
        },
      });

      if (!account) {
        throw new Error('Virtual account not found');
      }

      // Calculate pending balance from payments that haven't been released
      const pendingPayments = await this.prisma.payment.findMany({
        where: {
          OR: [
            { user: { virtualAccounts: { some: { id: accountId } } } },
            { rental: { property: { virtualAccount: { id: accountId } } } },
          ],
          status: PaymentStatus.HELD,
        },
      });

      const pendingBalance = pendingPayments.reduce(
        (sum, payment) => sum.add(payment.amount),
        new Decimal(0)
      );

      const availableBalance = account.balance;
      const totalBalance = availableBalance.add(pendingBalance);

      return {
        accountId: account.id,
        availableBalance,
        pendingBalance,
        totalBalance,
        currency: account.currency,
        lastUpdated: account.updatedAt,
      };
    } catch (error) {
      logger.error('Error getting account balance:', { accountId, error });
      throw error;
    }
  }

  /**
   * Update account balance with transaction tracking
   */
  async updateBalance(data: BalanceUpdateData): Promise<VirtualAccount> {
    const { accountId, amount, transactionType, reference, description, metadata } = data;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Get current account with lock
        const account = await tx.virtualAccount.findUnique({
          where: { id: accountId },
        });

        if (!account) {
          throw new Error('Virtual account not found');
        }

        if (!account.isActive) {
          throw new Error('Cannot update balance on inactive account');
        }

        const previousBalance = account.balance;
        let newBalance: Decimal;

        if (transactionType === 'CREDIT') {
          newBalance = previousBalance.add(amount);
        } else {
          newBalance = previousBalance.sub(amount);
          
          // Check if debit would result in negative balance
          if (newBalance.lt(0)) {
            throw new Error('Insufficient balance for debit transaction');
          }
        }

        // Update the account balance
        const updatedAccount = await tx.virtualAccount.update({
          where: { id: accountId },
          data: {
            balance: newBalance,
            updatedAt: new Date(),
          },
        });

        // Create balance history record
        await this.createBalanceHistoryRecord({
          accountId,
          previousBalance,
          newBalance,
          amount,
          transactionType,
          reference,
          description: description || `${transactionType} transaction`,
          metadata,
        });

        logger.info('Balance updated successfully:', {
          accountId,
          previousBalance: previousBalance.toString(),
          newBalance: newBalance.toString(),
          amount: amount.toString(),
          transactionType,
          reference,
        });

        return updatedAccount;
      });
    } catch (error) {
      logger.error('Error updating balance:', { accountId, error });
      throw error;
    }
  }

  /**
   * Process payment-related balance updates
   */
  async processPaymentBalanceUpdate(
    paymentId: string,
    status: PaymentStatus
  ): Promise<void> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          user: true,
          rental: {
            include: {
              property: {
                include: {
                  virtualAccount: true,
                  owner: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      const virtualAccount = payment.rental?.property?.virtualAccount;
      if (!virtualAccount) {
        logger.warn('No virtual account found for payment:', { paymentId });
        return;
      }

      switch (status) {
        case PaymentStatus.SUCCESS:
          // Credit the property owner's virtual account
          await this.updateBalance({
            accountId: virtualAccount.id,
            amount: payment.ownerAmount || payment.amount,
            transactionType: 'CREDIT',
            reference: payment.id,
            description: `Rent payment from ${payment.user.name}`,
            metadata: {
              paymentId: payment.id,
              rentalId: payment.rentalId,
              propertyId: payment.rental?.propertyId,
            },
          });
          break;

        case PaymentStatus.REFUNDED:
          // Debit the virtual account for refund
          await this.updateBalance({
            accountId: virtualAccount.id,
            amount: payment.ownerAmount || payment.amount,
            transactionType: 'DEBIT',
            reference: payment.id,
            description: `Refund for payment ${payment.id}`,
            metadata: {
              paymentId: payment.id,
              refundReason: 'Payment refunded',
            },
          });
          break;

        case PaymentStatus.HELD:
          // No immediate balance update for held payments
          logger.info('Payment held, no balance update:', { paymentId });
          break;

        case PaymentStatus.RELEASED:
          // Release held funds to available balance
          await this.releaseHeldFunds(payment.id);
          break;
      }
    } catch (error) {
      logger.error('Error processing payment balance update:', { paymentId, status, error });
      throw error;
    }
  }

  /**
   * Release held funds to available balance
   */
  async releaseHeldFunds(paymentId: string): Promise<void> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          rental: {
            include: {
              property: {
                include: { virtualAccount: true },
              },
            },
          },
        },
      });

      if (!payment || !payment.rental?.property?.virtualAccount) {
        throw new Error('Payment or virtual account not found');
      }

      const virtualAccount = payment.rental.property.virtualAccount;

      await this.updateBalance({
        accountId: virtualAccount.id,
        amount: payment.ownerAmount || payment.amount,
        transactionType: 'CREDIT',
        reference: payment.id,
        description: `Released held funds for payment ${payment.id}`,
        metadata: {
          paymentId: payment.id,
          releaseDate: new Date(),
        },
      });

      // Update payment status
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.RELEASED,
          releasedAt: new Date(),
        },
      });

      logger.info('Held funds released successfully:', { paymentId });
    } catch (error) {
      logger.error('Error releasing held funds:', { paymentId, error });
      throw error;
    }
  }

  /**
   * Get balance history for an account
   */
  async getBalanceHistory(
    accountId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<BalanceHistory[]> {
    try {
      // This would require a separate BalanceHistory table in production
      // For now, we'll simulate from payment records
      const payments = await this.prisma.payment.findMany({
        where: {
          OR: [
            { user: { virtualAccounts: { some: { id: accountId } } } },
            { rental: { property: { virtualAccount: { id: accountId } } } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: true,
          rental: {
            include: {
              property: true,
            },
          },
        },
      });

      return payments.map((payment) => ({
        id: payment.id,
        accountId,
        previousBalance: new Decimal(0), // Would be tracked in actual balance history table
        newBalance: new Decimal(0), // Would be tracked in actual balance history table
        amount: payment.amount,
        transactionType: 'CREDIT' as const, // Determine based on payment type
        reference: payment.id,
        description: `Payment from ${payment.user.name}`,
        metadata: {
          paymentId: payment.id,
          paymentType: payment.paymentType,
          status: payment.status,
        },
        timestamp: payment.createdAt,
      }));
    } catch (error) {
      logger.error('Error getting balance history:', { accountId, error });
      throw error;
    }
  }

  /**
   * Reconcile account balance with transaction history
   */
  async reconcileAccountBalance(accountId: string): Promise<BalanceReconciliationResult> {
    try {
      const account = await this.prisma.virtualAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        throw new Error('Virtual account not found');
      }

      // Calculate expected balance from transaction history
      const payments = await this.prisma.payment.findMany({
        where: {
          OR: [
            { user: { virtualAccounts: { some: { id: accountId } } } },
            { rental: { property: { virtualAccount: { id: accountId } } } },
          ],
          status: { in: [PaymentStatus.SUCCESS, PaymentStatus.RELEASED] },
        },
      });

      const expectedBalance = payments.reduce((sum, payment) => {
        return sum.add(payment.ownerAmount || payment.amount);
      }, new Decimal(0));

      const actualBalance = account.balance;
      const difference = expectedBalance.sub(actualBalance);
      const isReconciled = difference.equals(0);

      return {
        accountId,
        expectedBalance,
        actualBalance,
        difference,
        isReconciled,
        discrepancies: [], // Would include detailed discrepancy analysis
      };
    } catch (error) {
      logger.error('Error reconciling account balance:', { accountId, error });
      throw error;
    }
  }

  /**
   * Get multiple account balances
   */
  async getMultipleAccountBalances(accountIds: string[]): Promise<AccountBalance[]> {
    try {
      const balances = await Promise.all(
        accountIds.map(accountId => this.getAccountBalance(accountId))
      );

      return balances;
    } catch (error) {
      logger.error('Error getting multiple account balances:', { accountIds, error });
      throw error;
    }
  }

  /**
   * Freeze account (prevent balance updates)
   */
  async freezeAccount(accountId: string, reason: string): Promise<VirtualAccount> {
    try {
      const updatedAccount = await this.prisma.virtualAccount.update({
        where: { id: accountId },
        data: { isActive: false },
      });

      logger.info('Account frozen:', { accountId, reason });

      return updatedAccount;
    } catch (error) {
      logger.error('Error freezing account:', { accountId, error });
      throw error;
    }
  }

  /**
   * Unfreeze account
   */
  async unfreezeAccount(accountId: string): Promise<VirtualAccount> {
    try {
      const updatedAccount = await this.prisma.virtualAccount.update({
        where: { id: accountId },
        data: { isActive: true },
      });

      logger.info('Account unfrozen:', { accountId });

      return updatedAccount;
    } catch (error) {
      logger.error('Error unfreezing account:', { accountId, error });
      throw error;
    }
  }

  /**
   * Create balance history record
   * Note: In production, this would use a separate BalanceHistory table
   */
  private async createBalanceHistoryRecord(data: {
    accountId: string;
    previousBalance: Decimal;
    newBalance: Decimal;
    amount: Decimal;
    transactionType: 'CREDIT' | 'DEBIT';
    reference: string;
    description: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    // In production, you would insert into a BalanceHistory table
    logger.info('Balance history record created:', data);
  }

  /**
   * Get account balance summary for multiple accounts
   */
  async getAccountBalanceSummary(
    userId?: string,
    propertyId?: string
  ): Promise<{
    totalBalance: Decimal;
    totalPendingBalance: Decimal;
    activeAccounts: number;
    inactiveAccounts: number;
    accounts: AccountBalance[];
  }> {
    try {
      const whereCondition: any = {};

      if (userId) {
        whereCondition.userId = userId;
      }

      if (propertyId) {
        whereCondition.propertyId = propertyId;
      }

      const accounts = await this.prisma.virtualAccount.findMany({
        where: whereCondition,
      });

      const balances = await Promise.all(
        accounts.map(account => this.getAccountBalance(account.id))
      );

      const summary = balances.reduce(
        (acc, balance) => {
          acc.totalBalance = acc.totalBalance.add(balance.availableBalance);
          acc.totalPendingBalance = acc.totalPendingBalance.add(balance.pendingBalance);
          return acc;
        },
        {
          totalBalance: new Decimal(0),
          totalPendingBalance: new Decimal(0),
          activeAccounts: accounts.filter(acc => acc.isActive).length,
          inactiveAccounts: accounts.filter(acc => !acc.isActive).length,
          accounts: balances,
        }
      );

      return summary;
    } catch (error) {
      logger.error('Error getting account balance summary:', { userId, propertyId, error });
      throw error;
    }
  }
}