// backend/payment-service/src/services/fundHoldingService.ts

import { PrismaClient } from '@newcondo/db';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface FundTransferData {
  fromAccountId: string;
  toAccountId: string;
  amount: Decimal;
  description?: string;
  transactionReference?: string;
}

export interface FundHoldData {
  virtualAccountId: string;
  amount: Decimal;
  holdReason: string;
  holdDurationDays?: number;
  metadata?: any;
}

export interface FundReleaseData {
  virtualAccountId: string;
  amount: Decimal;
  releaseReason: string;
  paymentId?: string;
}

export interface BalanceQuery {
  virtualAccountId: string;
  includeHeldFunds?: boolean;
  asOf?: Date;
}

export interface FundHoldingTransaction {
  id: string;
  virtualAccountId: string;
  amount: Decimal;
  type: 'HOLD' | 'RELEASE' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  description: string;
  metadata?: any;
  createdAt: Date;
  completedAt?: Date;
}

class FundHoldingService {
  /**
   * Get available balance for a virtual account
   */
  async getAvailableBalance(query: BalanceQuery): Promise<{
    totalBalance: Decimal;
    availableBalance: Decimal;
    heldBalance: Decimal;
  }> {
    try {
      const virtualAccount = await prisma.virtualAccount.findUnique({
        where: { id: query.virtualAccountId },
        select: { balance: true, isActive: true }
      });

      if (!virtualAccount) {
        throw new Error('Virtual account not found');
      }

      if (!virtualAccount.isActive) {
        throw new Error('Virtual account is inactive');
      }

      // For now, we'll use the balance field directly
      // In a more complex system, you might calculate this from transaction history
      const totalBalance = virtualAccount.balance;
      
      // Calculate held funds (placeholder for future implementation)
      const heldBalance = new Decimal(0); // This would be calculated from held transactions
      
      const availableBalance = totalBalance.minus(heldBalance);

      return {
        totalBalance,
        availableBalance,
        heldBalance
      };
    } catch (error) {
      console.error('Error getting available balance:', error);
      throw error;
    }
  }

  /**
   * Hold funds in a virtual account
   */
  async holdFunds(data: FundHoldData): Promise<FundHoldingTransaction> {
    try {
      const { virtualAccountId, amount, holdReason, holdDurationDays = 7, metadata } = data;

      // Check if account has sufficient balance
      const balanceInfo = await this.getAvailableBalance({ virtualAccountId });
      
      if (balanceInfo.availableBalance.lessThan(amount)) {
        throw new Error('Insufficient available balance for hold');
      }

      // Create hold transaction record (this would typically be in a separate transactions table)
      const holdTransaction: FundHoldingTransaction = {
        id: `hold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        virtualAccountId,
        amount,
        type: 'HOLD',
        status: 'COMPLETED',
        description: holdReason,
        metadata: {
          ...metadata,
          holdDurationDays,
          expiresAt: new Date(Date.now() + (holdDurationDays * 24 * 60 * 60 * 1000))
        },
        createdAt: new Date(),
        completedAt: new Date()
      };

      // For now, we'll just log this. In a production system, you'd store this in a separate table
      console.log('Fund hold created:', holdTransaction);

      return holdTransaction;
    } catch (error) {
      console.error('Error holding funds:', error);
      throw error;
    }
  }

  /**
   * Release held funds
   */
  async releaseFunds(data: FundReleaseData): Promise<FundHoldingTransaction> {
    try {
      const { virtualAccountId, amount, releaseReason, paymentId } = data;

      // Verify virtual account exists and is active
      const virtualAccount = await prisma.virtualAccount.findUnique({
        where: { id: virtualAccountId },
        select: { id: true, isActive: true }
      });

      if (!virtualAccount) {
        throw new Error('Virtual account not found');
      }

      if (!virtualAccount.isActive) {
        throw new Error('Virtual account is inactive');
      }

      // Create release transaction record
      const releaseTransaction: FundHoldingTransaction = {
        id: `release_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        virtualAccountId,
        amount,
        type: 'RELEASE',
        status: 'COMPLETED',
        description: releaseReason,
        metadata: { paymentId },
        createdAt: new Date(),
        completedAt: new Date()
      };

      // Update payment status if paymentId is provided
      if (paymentId) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'RELEASED',
            isReleased: true,
            releasedAt: new Date()
          }
        });
      }

      console.log('Fund release created:', releaseTransaction);

      return releaseTransaction;
    } catch (error) {
      console.error('Error releasing funds:', error);
      throw error;
    }
  }

  /**
   * Transfer funds between virtual accounts
   */
  async transferFunds(data: FundTransferData): Promise<{
    fromTransaction: FundHoldingTransaction;
    toTransaction: FundHoldingTransaction;
  }> {
    try {
      const { fromAccountId, toAccountId, amount, description, transactionReference } = data;

      // Check sender account balance
      const senderBalance = await this.getAvailableBalance({ virtualAccountId: fromAccountId });
      
      if (senderBalance.availableBalance.lessThan(amount)) {
        throw new Error('Insufficient balance for transfer');
      }

      // Verify both accounts exist and are active
      const [fromAccount, toAccount] = await Promise.all([
        prisma.virtualAccount.findUnique({
          where: { id: fromAccountId },
          select: { id: true, isActive: true, balance: true }
        }),
        prisma.virtualAccount.findUnique({
          where: { id: toAccountId },
          select: { id: true, isActive: true, balance: true }
        })
      ]);

      if (!fromAccount || !toAccount) {
        throw new Error('One or both virtual accounts not found');
      }

      if (!fromAccount.isActive || !toAccount.isActive) {
        throw new Error('One or both virtual accounts are inactive');
      }

      const transferId = transactionReference || `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create transaction records
      const fromTransaction: FundHoldingTransaction = {
        id: `${transferId}_out`,
        virtualAccountId: fromAccountId,
        amount,
        type: 'TRANSFER_OUT',
        status: 'PENDING',
        description: description || `Transfer to ${toAccountId}`,
        metadata: { toAccountId, transferId },
        createdAt: new Date()
      };

      const toTransaction: FundHoldingTransaction = {
        id: `${transferId}_in`,
        virtualAccountId: toAccountId,
        amount,
        type: 'TRANSFER_IN',
        status: 'PENDING',
        description: description || `Transfer from ${fromAccountId}`,
        metadata: { fromAccountId, transferId },
        createdAt: new Date()
      };

      // Execute the transfer in a database transaction
      await prisma.$transaction(async (tx) => {
        // Debit from sender
        await tx.virtualAccount.update({
          where: { id: fromAccountId },
          data: {
            balance: fromAccount.balance.minus(amount)
          }
        });

        // Credit to receiver
        await tx.virtualAccount.update({
          where: { id: toAccountId },
          data: {
            balance: toAccount.balance.plus(amount)
          }
        });
      });

      // Update transaction status to completed
      fromTransaction.status = 'COMPLETED';
      fromTransaction.completedAt = new Date();
      toTransaction.status = 'COMPLETED';
      toTransaction.completedAt = new Date();

      console.log('Fund transfer completed:', { fromTransaction, toTransaction });

      return { fromTransaction, toTransaction };
    } catch (error) {
      console.error('Error transferring funds:', error);
      throw error;
    }
  }

  /**
   * Add funds to a virtual account (for testing or admin operations)
   */
  async addFunds(virtualAccountId: string, amount: Decimal, description: string): Promise<FundHoldingTransaction> {
    try {
      const virtualAccount = await prisma.virtualAccount.findUnique({
        where: { id: virtualAccountId },
        select: { balance: true, isActive: true }
      });

      if (!virtualAccount) {
        throw new Error('Virtual account not found');
      }

      if (!virtualAccount.isActive) {
        throw new Error('Virtual account is inactive');
      }

      // Update account balance
      await prisma.virtualAccount.update({
        where: { id: virtualAccountId },
        data: {
          balance: virtualAccount.balance.plus(amount)
        }
      });

      const transaction: FundHoldingTransaction = {
        id: `add_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        virtualAccountId,
        amount,
        type: 'TRANSFER_IN',
        status: 'COMPLETED',
        description,
        createdAt: new Date(),
        completedAt: new Date()
      };

      console.log('Funds added:', transaction);

      return transaction;
    } catch (error) {
      console.error('Error adding funds:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for a virtual account
   */
  async getTransactionHistory(
    virtualAccountId: string, 
    options: {
      limit?: number;
      offset?: number;
      fromDate?: Date;
      toDate?: Date;
      transactionType?: string;
    } = {}
  ): Promise<FundHoldingTransaction[]> {
    const { limit = 50, offset = 0, fromDate, toDate, transactionType } = options;

    try {
      // This is a placeholder. In a real implementation, you'd query a transactions table
      // For now, we'll return an empty array since we don't have persistent transaction storage
      console.log(`Getting transaction history for account ${virtualAccountId} with options:`, options);
      
      return [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  /**
   * Reconcile virtual account balance
   */
  async reconcileBalance(virtualAccountId: string): Promise<{
    currentBalance: Decimal;
    calculatedBalance: Decimal;
    discrepancy: Decimal;
    isReconciled: boolean;
  }> {
    try {
      const virtualAccount = await prisma.virtualAccount.findUnique({
        where: { id: virtualAccountId },
        select: { balance: true }
      });

      if (!virtualAccount) {
        throw new Error('Virtual account not found');
      }

      const currentBalance = virtualAccount.balance;
      
      // In a real implementation, you would calculate this from transaction history
      const calculatedBalance = currentBalance; // Placeholder
      
      const discrepancy = currentBalance.minus(calculatedBalance);
      const isReconciled = discrepancy.equals(0);

      return {
        currentBalance,
        calculatedBalance,
        discrepancy,
        isReconciled
      };
    } catch (error) {
      console.error('Error reconciling balance:', error);
      throw error;
    }
  }
}

export const fundHoldingService = new FundHoldingService();
export default fundHoldingService;