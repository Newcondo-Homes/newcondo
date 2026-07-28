// backend/payment-service/src/services/referralVirtualAccountService.ts

import { PrismaClient } from '@newcondo/db';
import { Decimal } from '@prisma/client/runtime/library';
import axios from 'axios';

const prisma = new PrismaClient();

/**
 * Referral Virtual Account Service
 * Manages virtual accounts for referral rewards and payouts
 */

interface FlutterwaveVirtualAccountResponse {
  status: string;
  message: string;
  data: {
    response_code: string;
    response_message: string;
    account_number: string;
    account_reference: string;
    bank_name: string;
    bank_code: string;
  };
}

interface PayoutRequest {
  userId: string;
  amount: Decimal;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  narration?: string;
}

interface PayoutResponse {
  success: boolean;
  transactionId?: string;
  reference?: string;
  message: string;
}

/**
 * Referral Virtual Account Service Class
 */
class ReferralVirtualAccountService {
  private readonly FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';
  private readonly FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

  /**
   * Create virtual account for a user
   * Called on user signup (for paid users only)
   */
  async createVirtualAccount(
    userId: string,
    propertyId?: string
  ): Promise<any> {
    try {
      // Check if user already has a virtual account
      const existing = await prisma.virtualAccount.findFirst({
        where: {
          userId,
          propertyId: propertyId || null,
        },
      });

      if (existing) {
        console.log('[Virtual Account] Account already exists:', existing.id);
        return existing;
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate unique account name
      const accountName = this.generateAccountName(user.name || user.email);
      const accountReference = `NC_${userId}_${Date.now()}`;

      // Create virtual account with Flutterwave
      const flutterwaveAccount = await this.createFlutterwaveVirtualAccount({
        email: user.email,
        bvn: '', // Optional: can be added later for verification
        tx_ref: accountReference,
        firstname: user.name?.split(' ')[0] || 'User',
        lastname: user.name?.split(' ')[1] || 'NewCondo',
        narration: `NewCondo ${user.role} - ${accountName}`,
      });

      // Create virtual account in database
      const virtualAccount = await prisma.virtualAccount.create({
        data: {
          userId,
          propertyId,
          accountNumber: flutterwaveAccount.account_number,
          accountName,
          bankCode: flutterwaveAccount.bank_code,
          flutterwaveAccountId: flutterwaveAccount.account_reference,
          balance: 0,
          currency: 'NGN',
          isActive: true,
        },
      });

      // Log creation
      await prisma.eventLog.create({
        data: {
          userId,
          type: 'VIRTUAL_ACCOUNT_CREATED',
          metadata: {
            virtualAccountId: virtualAccount.id,
            accountNumber: virtualAccount.accountNumber,
            bankName: flutterwaveAccount.bank_name,
          },
        },
      });

      console.log('[Virtual Account] Created successfully:', virtualAccount.id);

      return virtualAccount;
    } catch (error) {
      console.error('[Virtual Account] Error creating account:', error);
      throw error;
    }
  }

  /**
   * Credit referral reward to virtual account
   */
  async creditReward(
    userId: string,
    rewardId: string,
    amount: Decimal
  ): Promise<void> {
    try {
      // Get user's virtual account
      const virtualAccount = await prisma.virtualAccount.findFirst({
        where: {
          userId,
          isActive: true,
        },
      });

      if (!virtualAccount) {
        // Create virtual account if doesn't exist
        await this.createVirtualAccount(userId);
        return this.creditReward(userId, rewardId, amount);
      }

      // Credit the account
      await prisma.virtualAccount.update({
        where: { id: virtualAccount.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      // Mark reward as paid out
      await prisma.referralReward.update({
        where: { id: rewardId },
        data: {
          isPaidOut: true,
          paidOutAt: new Date(),
          payoutReference: virtualAccount.accountNumber,
        },
      });

      // Log transaction
      await prisma.eventLog.create({
        data: {
          userId,
          type: 'REWARD_CREDITED',
          metadata: {
            rewardId,
            amount: amount.toString(),
            virtualAccountId: virtualAccount.id,
            newBalance: virtualAccount.balance.add(amount).toString(),
          },
        },
      });

      console.log(`[Virtual Account] Credited ₦${amount} to user ${userId}`);
    } catch (error) {
      console.error('[Virtual Account] Error crediting reward:', error);
      throw error;
    }
  }

  /**
   * Process payout request to user's bank account
   */
  async processPayoutRequest(params: PayoutRequest): Promise<PayoutResponse> {
    try {
      const { userId, amount, bankCode, accountNumber, accountName, narration } = params;

      // Verify user has sufficient balance
      const virtualAccount = await prisma.virtualAccount.findFirst({
        where: {
          userId,
          isActive: true,
        },
      });

      if (!virtualAccount) {
        return {
          success: false,
          message: 'Virtual account not found',
        };
      }

      if (virtualAccount.balance.lessThan(amount)) {
        return {
          success: false,
          message: 'Insufficient balance',
        };
      }

      // Process payout via Flutterwave
      const payoutResult = await this.flutterwavePayout({
        account_bank: bankCode,
        account_number: accountNumber,
        amount: amount.toNumber(),
        currency: 'NGN',
        narration: narration || 'NewCondo Referral Reward Payout',
        reference: `PAYOUT_${userId}_${Date.now()}`,
        beneficiary_name: accountName,
      });

      if (payoutResult.status === 'success') {
        // Deduct from virtual account balance
        await prisma.virtualAccount.update({
          where: { id: virtualAccount.id },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });

        // Log payout
        await prisma.eventLog.create({
          data: {
            userId,
            type: 'PAYOUT_PROCESSED',
            metadata: {
              amount: amount.toString(),
              bankCode,
              accountNumber,
              accountName,
              reference: payoutResult.reference,
              transactionId: payoutResult.id,
            },
          },
        });

        console.log(`[Virtual Account] Payout processed: ₦${amount} to ${accountName}`);

        return {
          success: true,
          transactionId: payoutResult.id,
          reference: payoutResult.reference,
          message: 'Payout successful',
        };
      } else {
        return {
          success: false,
          message: payoutResult.message || 'Payout failed',
        };
      }
    } catch (error) {
      console.error('[Virtual Account] Error processing payout:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Payout failed',
      };
    }
  }

  /**
   * Get virtual account balance
   */
  async getBalance(userId: string): Promise<Decimal> {
    const virtualAccount = await prisma.virtualAccount.findFirst({
      where: {
        userId,
        isActive: true,
      },
      select: {
        balance: true,
      },
    });

    return virtualAccount?.balance || new Decimal(0);
  }

  /**
   * Get virtual account transaction history
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    const transactions = await prisma.eventLog.findMany({
      where: {
        userId,
        type: {
          in: ['REWARD_CREDITED', 'PAYOUT_PROCESSED', 'COMMISSION_RELEASED'],
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: (t.metadata as any).amount,
      timestamp: t.timestamp,
      metadata: t.metadata,
    }));
  }

  /**
   * Get virtual account details
   */
  async getAccountDetails(userId: string): Promise<any> {
    const account = await prisma.virtualAccount.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (!account) {
      return null;
    }

    return {
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      bankCode: account.bankCode,
      balance: account.balance,
      currency: account.currency,
      isActive: account.isActive,
      createdAt: account.createdAt,
    };
  }

  /**
   * Enable auto-transfer to user's bank account
   */
  async enableAutoTransfer(
    userId: string,
    bankCode: string,
    accountNumber: string,
    accountName: string
  ): Promise<boolean> {
    try {
      // Store bank details in user metadata or separate table
      await prisma.eventLog.create({
        data: {
          userId,
          type: 'AUTO_TRANSFER_ENABLED',
          metadata: {
            bankCode,
            accountNumber,
            accountName,
          },
        },
      });

      return true;
    } catch (error) {
      console.error('[Virtual Account] Error enabling auto-transfer:', error);
      return false;
    }
  }

  /**
   * Get pending rewards ready for payout
   */
  async getPendingRewards(userId: string): Promise<any[]> {
    const rewards = await prisma.referralReward.findMany({
      where: {
        userId,
        status: 'APPROVED',
        isPaidOut: false,
        isRedeemed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        referral: {
          select: {
            referralCode: true,
            referralType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return rewards;
  }

  // Private helper methods

  private generateAccountName(name: string): string {
    const sanitized = name.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 20);
    const uniqueChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${sanitized} ${uniqueChars}`;
  }

  private async createFlutterwaveVirtualAccount(params: {
    email: string;
    bvn?: string;
    tx_ref: string;
    firstname: string;
    lastname: string;
    narration: string;
  }): Promise<any> {
    try {
      // Flutterwave API call to create virtual account
      const response = await axios.post<FlutterwaveVirtualAccountResponse>(
        `${this.FLUTTERWAVE_BASE_URL}/virtual-account-numbers`,
        {
          email: params.email,
          is_permanent: true,
          bvn: params.bvn || undefined,
          tx_ref: params.tx_ref,
          firstname: params.firstname,
          lastname: params.lastname,
          narration: params.narration,
        },
        {
          headers: {
            Authorization: `Bearer ${this.FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create virtual account');
      }
    } catch (error) {
      console.error('[Flutterwave] Error creating virtual account:', error);
      // Fallback: create placeholder account
      return {
        account_number: this.generatePlaceholderAccountNumber(),
        account_reference: params.tx_ref,
        bank_code: '000',
        bank_name: 'NewCondo Bank',
      };
    }
  }

  private async flutterwavePayout(params: {
    account_bank: string;
    account_number: string;
    amount: number;
    currency: string;
    narration: string;
    reference: string;
    beneficiary_name: string;
  }): Promise<any> {
    try {
      const response = await axios.post(
        `${this.FLUTTERWAVE_BASE_URL}/transfers`,
        params,
        {
          headers: {
            Authorization: `Bearer ${this.FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 'success') {
        return {
          status: 'success',
          id: response.data.data.id,
          reference: response.data.data.reference,
          message: 'Payout successful',
        };
      } else {
        return {
          status: 'failed',
          message: response.data.message || 'Payout failed',
        };
      }
    } catch (error) {
      console.error('[Flutterwave] Error processing payout:', error);
      return {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Payout failed',
      };
    }
  }

  private generatePlaceholderAccountNumber(): string {
    return `NC${Date.now().toString().substring(6)}`;
  }
}

export const referralVirtualAccountService = new ReferralVirtualAccountService();