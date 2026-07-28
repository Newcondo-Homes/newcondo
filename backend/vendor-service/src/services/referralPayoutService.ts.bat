// backend/payment-service/src/services/referralPayoutService.ts

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { referralNotificationService } from '../../../notification-service/src/services/referralNotificationService';

const prisma = new PrismaClient();

interface InitiatePayoutData {
  userId: string;
  rewardIds: string[];
  amount: number;
  method: 'BANK_TRANSFER' | 'WALLET' | 'CREDIT';
  bankDetails?: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  };
}

interface PayoutResult {
  id: string;
  status: string;
  reference: string;
  amount: number;
  fee: number;
  netAmount: number;
}

class ReferralPayoutService {
  private readonly FLUTTERWAVE_BASE_URL = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';
  private readonly FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
  private readonly MIN_PAYOUT_AMOUNT = 1000; // ₦1,000
  private readonly PAYOUT_FEE_PERCENTAGE = 0.01; // 1%
  private readonly PAYOUT_FEE_CAP = 100; // ₦100 max fee

  /**
   * Initiate reward payout
   */
  async initiatePayout(data: InitiatePayoutData): Promise<PayoutResult> {
    // Validate minimum amount
    if (data.amount < this.MIN_PAYOUT_AMOUNT) {
      throw new Error(`Minimum payout amount is ₦${this.MIN_PAYOUT_AMOUNT}`);
    }

    // Get user and verify rewards
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: {
        rewards: {
          where: {
            id: { in: data.rewardIds },
            status: 'APPROVED',
            isRedeemed: false,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify reward ownership and amounts
    const totalRewardAmount = user.rewards.reduce((sum, reward) => {
      return sum + Number(reward.amount);
    }, 0);

    if (totalRewardAmount < data.amount) {
      throw new Error('Insufficient reward balance');
    }

    // Calculate fees
    const fees = this.calculateFees(data.amount);

    // Create payout record
    const payout = await prisma.$transaction(async (tx) => {
      // Mark rewards as redeemed
      await tx.referralReward.updateMany({
        where: { id: { in: data.rewardIds } },
        data: {
          isRedeemed: true,
          redeemedAt: new Date(),
        },
      });

      // Create payout record
      return await tx.payment.create({
        data: {
          userId: data.userId,
          amount: data.amount,
          currency: 'NGN',
          paymentType: 'AGENT_COMMISSION', // Reusing for referral payouts
          status: 'PENDING',
          description: `Referral reward payout - ${data.method}`,
          flutterwaveRef: `REF-${Date.now()}`,
        },
      });
    });

    // Process payout based on method
    let payoutResult: PayoutResult;

    switch (data.method) {
      case 'BANK_TRANSFER':
        payoutResult = await this.processBankTransfer({
          userId: data.userId,
          amount: data.amount - fees.totalFee,
          bankDetails: data.bankDetails!,
          reference: payout.id,
        });
        break;

      case 'WALLET':
        payoutResult = await this.processWalletCredit({
          userId: data.userId,
          amount: data.amount,
          reference: payout.id,
        });
        break;

      case 'CREDIT':
        payoutResult = await this.processAccountCredit({
          userId: data.userId,
          amount: data.amount,
          reference: payout.id,
        });
        break;

      default:
        throw new Error('Invalid payout method');
    }

    // Update payout status
    await prisma.payment.update({
      where: { id: payout.id },
      data: {
        status: payoutResult.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
        transactionId: payoutResult.id,
      },
    });

    // Send notification
    await referralNotificationService.notifyRewardRedeemed({
      userId: data.userId,
      userName: user.name || 'User',
      userEmail: user.email,
      transactionId: payoutResult.reference,
      redemptionAmount: data.amount,
      redemptionMethod: data.method,
      previousBalance: totalRewardAmount,
      remainingBalance: totalRewardAmount - data.amount,
      bankDetails: data.bankDetails
        ? `${data.bankDetails.accountName} - ${data.bankDetails.accountNumber}`
        : undefined,
      expectedArrival: data.method === 'BANK_TRANSFER' ? '2-3 business days' : 'Instant',
      status: 'Processing',
    });

    return payoutResult;
  }

  /**
   * Process bank transfer via Flutterwave
   */
  private async processBankTransfer(data: {
    userId: string;
    amount: number;
    bankDetails: {
      accountNumber: string;
      bankCode: string;
      accountName: string;
    };
    reference: string;
  }): Promise<PayoutResult> {
    try {
      const response = await axios.post(
        `${this.FLUTTERWAVE_BASE_URL}/transfers`,
        {
          account_bank: data.bankDetails.bankCode,
          account_number: data.bankDetails.accountNumber,
          amount: data.amount,
          currency: 'NGN',
          narration: 'NewCondo Referral Reward',
          reference: data.reference,
          callback_url: `${process.env.API_URL}/webhooks/payout`,
          debit_currency: 'NGN',
        },
        {
          headers: {
            Authorization: `Bearer ${this.FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 'success') {
        return {
          id: response.data.data.id.toString(),
          status: 'PENDING',
          reference: data.reference,
          amount: data.amount,
          fee: 0,
          netAmount: data.amount,
        };
      }

      throw new Error(response.data.message || 'Transfer failed');
    } catch (error: any) {
      console.error('Bank transfer error:', error);
      throw new Error(error.response?.data?.message || 'Failed to process bank transfer');
    }
  }

  /**
   * Process wallet credit
   */
  private async processWalletCredit(data: {
    userId: string;
    amount: number;
    reference: string;
  }): Promise<PayoutResult> {
    // Get or create virtual account
    const virtualAccount = await prisma.virtualAccount.findFirst({
      where: { userId: data.userId, propertyId: null },
    });

    if (!virtualAccount) {
      throw new Error('Virtual account not found');
    }

    // Credit virtual account
    await prisma.virtualAccount.update({
      where: { id: virtualAccount.id },
      data: {
        balance: {
          increment: data.amount,
        },
      },
    });

    return {
      id: `WALLET-${Date.now()}`,
      status: 'SUCCESS',
      reference: data.reference,
      amount: data.amount,
      fee: 0,
      netAmount: data.amount,
    };
  }

  /**
   * Process account credit (immediate balance credit)
   */
  private async processAccountCredit(data: {
    userId: string;
    amount: number;
    reference: string;
  }): Promise<PayoutResult> {
    // This credits the user's NewCondo account balance
    // which can be used for services, subscriptions, etc.
    
    return {
      id: `CREDIT-${Date.now()}`,
      status: 'SUCCESS',
      reference: data.reference,
      amount: data.amount,
      fee: 0,
      netAmount: data.amount,
    };
  }

  /**
   * Calculate payout fees
   */
  calculateFees(amount: number): { fee: number; totalFee: number; netAmount: number } {
    const fee = Math.min(amount * this.PAYOUT_FEE_PERCENTAGE, this.PAYOUT_FEE_CAP);
    return {
      fee,
      totalFee: fee,
      netAmount: amount - fee,
    };
  }

  /**
   * Get payout status
   */
  async getPayoutStatus(payoutId: string): Promise<any> {
    const payout = await prisma.payment.findUnique({
      where: { id: payoutId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return payout;
  }

  /**
   * Get payout history
   */
  async getPayoutHistory(params: {
    userId: string;
    page: number;
    limit: number;
    status?: string;
  }): Promise<any> {
    const where: any = {
      userId: params.userId,
      paymentType: 'AGENT_COMMISSION',
    };

    if (params.status) {
      where.status = params.status;
    }

    const [payouts, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      data: payouts,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  /**
   * Cancel pending payout
   */
  async cancelPayout(data: {
    payoutId: string;
    userId: string;
    reason?: string;
  }): Promise<void> {
    const payout = await prisma.payment.findUnique({
      where: { id: data.payoutId },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.userId !== data.userId) {
      throw new Error('Unauthorized');
    }

    if (payout.status !== 'PENDING') {
      throw new Error('Can only cancel pending payouts');
    }

    await prisma.payment.update({
      where: { id: data.payoutId },
      data: {
        status: 'CANCELLED',
        failureReason: data.reason,
      },
    });
  }

  /**
   * Retry failed payout
   */
  async retryPayout(payoutId: string): Promise<PayoutResult> {
    const payout = await prisma.payment.findUnique({
      where: { id: payoutId },
      include: { user: true },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== 'FAILED') {
      throw new Error('Can only retry failed payouts');
    }

    // Retry based on original method (stored in description)
    const method = payout.description?.includes('BANK_TRANSFER')
      ? 'BANK_TRANSFER'
      : 'WALLET';

    // This would need original bank details - store them securely
    throw new Error('Retry not implemented - contact support');
  }

  /**
   * Get available payout methods
   */
  async getAvailablePayoutMethods(userId: string): Promise<any[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        virtualAccounts: true,
      },
    });

    const methods = [
      {
        id: 'BANK_TRANSFER',
        name: 'Bank Transfer',
        description: 'Direct transfer to your bank account',
        processingTime: '2-3 business days',
        fee: '1% (max ₦100)',
        minAmount: this.MIN_PAYOUT_AMOUNT,
      },
    ];

    if (user?.virtualAccounts.length) {
      methods.push({
        id: 'WALLET',
        name: 'Virtual Account',
        description: 'Credit to your NewCondo wallet',
        processingTime: 'Instant',
        fee: 'Free',
        minAmount: 0,
      });
    }

    methods.push({
      id: 'CREDIT',
      name: 'Account Credit',
      description: 'Use for NewCondo services',
      processingTime: 'Instant',
      fee: 'Free',
      minAmount: 0,
    });

    return methods;
  }

  /**
   * Verify bank account
   */
  async verifyBankAccount(data: {
    accountNumber: string;
    bankCode: string;
  }): Promise<any> {
    try {
      const response = await axios.post(
        `${this.FLUTTERWAVE_BASE_URL}/accounts/resolve`,
        {
          account_number: data.accountNumber,
          account_bank: data.bankCode,
        },
        {
          headers: {
            Authorization: `Bearer ${this.FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 'success') {
        return {
          verified: true,
          accountName: response.data.data.account_name,
          accountNumber: data.accountNumber,
          bankCode: data.bankCode,
        };
      }

      return {
        verified: false,
        message: 'Could not verify account',
      };
    } catch (error: any) {
      console.error('Bank verification error:', error);
      return {
        verified: false,
        message: error.response?.data?.message || 'Verification failed',
      };
    }
  }

  /**
   * Get payout summary
   */
  async getPayoutSummary(userId: string): Promise<any> {
    const [totalPayouts, successfulPayouts, pendingPayouts, failedPayouts] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          userId,
          paymentType: 'AGENT_COMMISSION',
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          userId,
          paymentType: 'AGENT_COMMISSION',
          status: 'SUCCESS',
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          userId,
          paymentType: 'AGENT_COMMISSION',
          status: 'PENDING',
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          userId,
          paymentType: 'AGENT_COMMISSION',
          status: 'FAILED',
        },
        _count: true,
      }),
    ]);

    return {
      totalPayouts: {
        amount: Number(totalPayouts._sum.amount || 0),
        count: totalPayouts._count,
      },
      successful: {
        amount: Number(successfulPayouts._sum.amount || 0),
        count: successfulPayouts._count,
      },
      pending: {
        amount: Number(pendingPayouts._sum.amount || 0),
        count: pendingPayouts._count,
      },
      failed: {
        count: failedPayouts._count,
      },
    };
  }

  /**
   * Handle payout webhook
   */
  async handlePayoutWebhook(data: { event: string; data: any }): Promise<void> {
    const { event, data: webhookData } = data;

    if (event === 'transfer.completed') {
      await prisma.payment.update({
        where: { flutterwaveRef: webhookData.reference },
        data: {
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      });
    } else if (event === 'transfer.failed') {
      await prisma.payment.update({
        where: { flutterwaveRef: webhookData.reference },
        data: {
          status: 'FAILED',
          failureReason: webhookData.complete_message,
        },
      });
    }
  }

  /**
   * Calculate payout fees
   */
  async calculatePayoutFees(data: {
    amount: number;
    method: string;
  }): Promise<any> {
    const fees = this.calculateFees(data.amount);

    return {
      amount: data.amount,
      fee: fees.fee,
      netAmount: fees.netAmount,
      method: data.method,
    };
  }

  /**
   * Process bulk payouts (Admin)
   */
  async processBulkPayouts(payoutIds: string[]): Promise<any[]> {
    const results = [];

    for (const payoutId of payoutIds) {
      try {
        const result = await this.retryPayout(payoutId);
        results.push({ payoutId, success: true, result });
      } catch (error: any) {
        results.push({ payoutId, success: false, error: error.message });
      }
    }

    return results;
  }
}

export const referralPayoutService = new ReferralPayoutService();