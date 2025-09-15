// backend/payment-service/src/services/virtualAccountService.ts

import { PrismaClient } from '@newcondo/db';
import { Response } from '../../../shared/src/utils/response';
import { logger } from '../../../shared/src/middleware/logger';

export interface VirtualAccountData {
  userId: string;
  propertyId?: string;
  accountName: string;
  currency?: string;
}

export interface FlutterwaveVirtualAccountResponse {
  status: string;
  message: string;
  data: {
    account_number: string;
    bank_code: string;
    account_reference: string;
    flw_ref: string;
    order_ref: string;
    created_at: string;
  };
}

export interface VirtualAccountBalance {
  accountId: string;
  balance: number;
  currency: string;
  availableBalance: number;
  ledgerBalance: number;
}

class VirtualAccountService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a virtual account for a user/property
   */
  async createVirtualAccount(data: VirtualAccountData): Promise<Response> {
    try {
      // Check if user already has a virtual account for this property
      const existingAccount = await this.prisma.virtualAccount.findFirst({
        where: {
          userId: data.userId,
          propertyId: data.propertyId || null,
        },
      });

      if (existingAccount) {
        return Response.error('Virtual account already exists for this user/property');
      }

      // Generate unique account reference
      const accountReference = `NEWCONDO_${data.userId}_${Date.now()}`;

      // Call Flutterwave API to create virtual account
      const flutterwaveResponse = await this.createFlutterwaveVirtualAccount({
        email: await this.getUserEmail(data.userId),
        bvn: await this.getUserBVN(data.userId),
        tx_ref: accountReference,
        firstname: data.accountName.split(' ')[0],
        lastname: data.accountName.split(' ').slice(1).join(' ') || 'User',
        narration: data.propertyId ? `Property Payment - ${data.propertyId}` : 'Rental Payment',
      });

      if (flutterwaveResponse.status !== 'success') {
        logger.error('Flutterwave virtual account creation failed:', flutterwaveResponse);
        return Response.error('Failed to create virtual account with payment provider');
      }

      // Save virtual account to database
      const virtualAccount = await this.prisma.virtualAccount.create({
        data: {
          accountNumber: flutterwaveResponse.data.account_number,
          accountName: data.accountName,
          bankCode: flutterwaveResponse.data.bank_code,
          userId: data.userId,
          propertyId: data.propertyId,
          currency: data.currency || 'NGN',
          flutterwaveAccountId: flutterwaveResponse.data.account_reference,
          isActive: true,
          balance: 0,
        },
      });

      logger.info(`Virtual account created for user ${data.userId}:`, {
        accountId: virtualAccount.id,
        accountNumber: virtualAccount.accountNumber,
      });

      return Response.success(virtualAccount, 'Virtual account created successfully');
    } catch (error) {
      logger.error('Error creating virtual account:', error);
      return Response.error('Failed to create virtual account');
    }
  }

  /**
   * Get virtual account by ID
   */
  async getVirtualAccount(accountId: string): Promise<Response> {
    try {
      const account = await this.prisma.virtualAccount.findUnique({
        where: { id: accountId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              address: true,
            },
          },
        },
      });

      if (!account) {
        return Response.error('Virtual account not found');
      }

      return Response.success(account);
    } catch (error) {
      logger.error('Error fetching virtual account:', error);
      return Response.error('Failed to fetch virtual account');
    }
  }

  /**
   * Get virtual accounts for a user
   */
  async getUserVirtualAccounts(userId: string): Promise<Response> {
    try {
      const accounts = await this.prisma.virtualAccount.findMany({
        where: { userId },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return Response.success(accounts);
    } catch (error) {
      logger.error('Error fetching user virtual accounts:', error);
      return Response.error('Failed to fetch virtual accounts');
    }
  }

  /**
   * Get virtual account by account number
   */
  async getVirtualAccountByNumber(accountNumber: string): Promise<Response> {
    try {
      const account = await this.prisma.virtualAccount.findUnique({
        where: { accountNumber },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!account) {
        return Response.error('Virtual account not found');
      }

      if (!account.isActive) {
        return Response.error('Virtual account is inactive');
      }

      return Response.success(account);
    } catch (error) {
      logger.error('Error fetching virtual account by number:', error);
      return Response.error('Failed to fetch virtual account');
    }
  }

  /**
   * Update virtual account balance
   */
  async updateAccountBalance(accountId: string, amount: number, operation: 'add' | 'subtract'): Promise<Response> {
    try {
      const account = await this.prisma.virtualAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        return Response.error('Virtual account not found');
      }

      const currentBalance = parseFloat(account.balance.toString());
      let newBalance: number;

      if (operation === 'add') {
        newBalance = currentBalance + amount;
      } else {
        newBalance = currentBalance - amount;
        if (newBalance < 0) {
          return Response.error('Insufficient balance');
        }
      }

      const updatedAccount = await this.prisma.virtualAccount.update({
        where: { id: accountId },
        data: { balance: newBalance },
      });

      logger.info(`Virtual account balance updated:`, {
        accountId,
        operation,
        amount,
        oldBalance: currentBalance,
        newBalance,
      });

      return Response.success({
        accountId,
        previousBalance: currentBalance,
        newBalance,
        operation,
        amount,
      });
    } catch (error) {
      logger.error('Error updating account balance:', error);
      return Response.error('Failed to update account balance');
    }
  }

  /**
   * Deactivate virtual account
   */
  async deactivateVirtualAccount(accountId: string): Promise<Response> {
    try {
      const updatedAccount = await this.prisma.virtualAccount.update({
        where: { id: accountId },
        data: { isActive: false },
      });

      logger.info(`Virtual account deactivated: ${accountId}`);

      return Response.success(updatedAccount, 'Virtual account deactivated successfully');
    } catch (error) {
      logger.error('Error deactivating virtual account:', error);
      return Response.error('Failed to deactivate virtual account');
    }
  }

  /**
   * Get account balance from Flutterwave
   */
  async getFlutterwaveBalance(accountId: string): Promise<Response<VirtualAccountBalance>> {
    try {
      const account = await this.prisma.virtualAccount.findUnique({
        where: { id: accountId },
      });

      if (!account || !account.flutterwaveAccountId) {
        return Response.error('Virtual account not found');
      }

      // Call Flutterwave API to get balance
      const balanceResponse = await this.fetchFlutterwaveBalance(account.flutterwaveAccountId);

      if (balanceResponse.status !== 'success') {
        return Response.error('Failed to fetch balance from payment provider');
      }

      const balance: VirtualAccountBalance = {
        accountId,
        balance: balanceResponse.data.balance,
        currency: account.currency,
        availableBalance: balanceResponse.data.available_balance,
        ledgerBalance: balanceResponse.data.ledger_balance,
      };

      // Sync local balance with Flutterwave balance
      await this.prisma.virtualAccount.update({
        where: { id: accountId },
        data: { balance: balanceResponse.data.balance },
      });

      return Response.success(balance);
    } catch (error) {
      logger.error('Error fetching Flutterwave balance:', error);
      return Response.error('Failed to fetch account balance');
    }
  }

  /**
   * Transfer funds between virtual accounts (internal transfer)
   */
  async internalTransfer(fromAccountId: string, toAccountId: string, amount: number, description?: string): Promise<Response> {
    try {
      // Start transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Check source account
        const fromAccount = await tx.virtualAccount.findUnique({
          where: { id: fromAccountId },
        });

        if (!fromAccount || !fromAccount.isActive) {
          throw new Error('Source account not found or inactive');
        }

        // Check destination account
        const toAccount = await tx.virtualAccount.findUnique({
          where: { id: toAccountId },
        });

        if (!toAccount || !toAccount.isActive) {
          throw new Error('Destination account not found or inactive');
        }

        const fromBalance = parseFloat(fromAccount.balance.toString());
        if (fromBalance < amount) {
          throw new Error('Insufficient balance');
        }

        // Update balances
        await tx.virtualAccount.update({
          where: { id: fromAccountId },
          data: { balance: fromBalance - amount },
        });

        const toBalance = parseFloat(toAccount.balance.toString());
        await tx.virtualAccount.update({
          where: { id: toAccountId },
          data: { balance: toBalance + amount },
        });

        return { fromAccount, toAccount, amount };
      });

      logger.info('Internal transfer completed:', {
        from: fromAccountId,
        to: toAccountId,
        amount,
        description,
      });

      return Response.success({
        transferId: `TXN_${Date.now()}`,
        fromAccountId,
        toAccountId,
        amount,
        description,
        completedAt: new Date(),
      }, 'Transfer completed successfully');
    } catch (error) {
      logger.error('Error processing internal transfer:', error);
      return Response.error(error instanceof Error ? error.message : 'Transfer failed');
    }
  }

  // Private helper methods

  private async getUserEmail(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email || '';
  }

  private async getUserBVN(userId: string): Promise<string> {
    const document = await this.prisma.document.findFirst({
      where: {
        userId,
        documentType: 'BVN',
        status: 'APPROVED',
      },
      select: { documentNumber: true },
    });
    return document?.documentNumber || '';
  }

  private async createFlutterwaveVirtualAccount(data: {
    email: string;
    bvn: string;
    tx_ref: string;
    firstname: string;
    lastname: string;
    narration: string;
  }): Promise<FlutterwaveVirtualAccountResponse> {
    // Mock implementation - replace with actual Flutterwave API call
    return {
      status: 'success',
      message: 'Virtual account created successfully',
      data: {
        account_number: `220${Math.random().toString().substring(2, 10)}`,
        bank_code: '044',
        account_reference: data.tx_ref,
        flw_ref: `FLW_${Date.now()}`,
        order_ref: data.tx_ref,
        created_at: new Date().toISOString(),
      },
    };
  }

  private async fetchFlutterwaveBalance(accountReference: string): Promise<any> {
    // Mock implementation - replace with actual Flutterwave API call
    return {
      status: 'success',
      data: {
        balance: Math.random() * 1000,
        available_balance: Math.random() * 1000,
        ledger_balance: Math.random() * 1000,
      },
    };
  }
}

export default VirtualAccountService;