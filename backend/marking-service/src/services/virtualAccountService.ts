// backend/marking-service/src/services/virtualAccountService.ts

import { PrismaClient, Role } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface FlutterwaveVirtualAccountResponse {
  status: string;
  message: string;
  data: {
    response_code: string;
    response_message: string;
    flw_ref: string;
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
    created_at: string;
  };
}

interface CreateVirtualAccountParams {
  userId: string;
  email: string;
  bvn?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  isPermanent?: boolean;
}

interface VirtualAccountBalance {
  accountId: string;
  balance: number;
  currency: string;
  isActive: boolean;
}

class VirtualAccountService {
  private flutterwaveSecretKey: string;
  private flutterwaveBaseUrl: string;

  constructor() {
    this.flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    this.flutterwaveBaseUrl = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';
  }

  /**
   * Create a virtual account for a user
   * Automatically called on account creation for property owners and agents
   * Called after premium subscription for renters
   */
  async createVirtualAccount(params: CreateVirtualAccountParams) {
    try {
      const { userId, email, bvn, phoneNumber, firstName, lastName, isPermanent = true } = params;

      // Check if user already has a virtual account
      const existingAccount = await prisma.virtualAccount.findFirst({
        where: { userId }
      });

      if (existingAccount) {
        return {
          success: true,
          account: existingAccount,
          message: 'Virtual account already exists'
        };
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isPremium: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Validate user eligibility for virtual account
      if (!this.isEligibleForVirtualAccount(user.role, user.isPremium)) {
        throw new Error('User not eligible for virtual account creation');
      }

      // Create virtual account via Flutterwave
      const flutterwaveResponse = await this.createFlutterwaveVirtualAccount({
        email: email || user.email,
        bvn,
        phoneNumber: phoneNumber || user.phone || '',
        firstName: firstName || user.name?.split(' ')[0] || 'User',
        lastName: lastName || user.name?.split(' ')[1] || 'Account',
        isPermanent
      });

      // Save virtual account to database
      const virtualAccount = await prisma.virtualAccount.create({
        data: {
          userId,
          accountNumber: flutterwaveResponse.data.account_number,
          accountName: flutterwaveResponse.data.account_name,
          bankCode: flutterwaveResponse.data.bank_code,
          flutterwaveAccountId: flutterwaveResponse.data.flw_ref,
          balance: 0,
          currency: 'NGN',
          isActive: true
        }
      });

      // Log event
      await prisma.eventLog.create({
        data: {
          userId,
          type: 'VIRTUAL_ACCOUNT_CREATED',
          metadata: {
            accountNumber: virtualAccount.accountNumber,
            bankCode: virtualAccount.bankCode
          }
        }
      });

      return {
        success: true,
        account: virtualAccount,
        message: 'Virtual account created successfully'
      };
    } catch (error: any) {
      console.error('Error creating virtual account:', error);
      throw new Error(`Failed to create virtual account: ${error.message}`);
    }
  }

  /**
   * Create virtual account via Flutterwave API
   */
  private async createFlutterwaveVirtualAccount(params: {
    email: string;
    bvn?: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    isPermanent: boolean;
  }): Promise<FlutterwaveVirtualAccountResponse> {
    try {
      const response = await axios.post(
        `${this.flutterwaveBaseUrl}/virtual-account-numbers`,
        {
          email: params.email,
          is_permanent: params.isPermanent,
          bvn: params.bvn,
          phonenumber: params.phoneNumber,
          firstname: params.firstName,
          lastname: params.lastName,
          narration: 'Newcondo Virtual Account'
        },
        {
          headers: {
            Authorization: `Bearer ${this.flutterwaveSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to create virtual account');
      }

      return response.data;
    } catch (error: any) {
      console.error('Flutterwave API Error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Failed to create virtual account with payment provider'
      );
    }
  }

  /**
   * Check if user is eligible for virtual account
   */
  private isEligibleForVirtualAccount(role: Role, isPremium: boolean): boolean {
    // Property owners and agents always eligible
    if (role === Role.OWNER || role === Role.AGENT) {
      return true;
    }

    // Renters only eligible if premium
    if (role === Role.RENTER && isPremium) {
      return true;
    }

    return false;
  }

  /**
   * Credit virtual account (after marking job completion)
   */
  async creditAccount(
    accountId: string,
    amount: number,
    description: string,
    metadata?: any
  ) {
    try {
      const account = await prisma.virtualAccount.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error('Virtual account not found');
      }

      if (!account.isActive) {
        throw new Error('Virtual account is inactive');
      }

      // Update balance
      const updatedAccount = await prisma.virtualAccount.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: amount
          }
        }
      });

      // Log transaction
      await prisma.eventLog.create({
        data: {
          userId: account.userId,
          type: 'VIRTUAL_ACCOUNT_CREDITED',
          metadata: {
            accountId,
            amount,
            description,
            previousBalance: Number(account.balance),
            newBalance: Number(updatedAccount.balance),
            ...metadata
          }
        }
      });

      return {
        success: true,
        account: updatedAccount,
        message: 'Account credited successfully'
      };
    } catch (error: any) {
      console.error('Error crediting account:', error);
      throw new Error(`Failed to credit account: ${error.message}`);
    }
  }

  /**
   * Debit virtual account (for withdrawals or refunds)
   */
  async debitAccount(
    accountId: string,
    amount: number,
    description: string,
    metadata?: any
  ) {
    try {
      const account = await prisma.virtualAccount.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error('Virtual account not found');
      }

      if (!account.isActive) {
        throw new Error('Virtual account is inactive');
      }

      // Check sufficient balance
      if (Number(account.balance) < amount) {
        throw new Error('Insufficient balance');
      }

      // Update balance
      const updatedAccount = await prisma.virtualAccount.update({
        where: { id: accountId },
        data: {
          balance: {
            decrement: amount
          }
        }
      });

      // Log transaction
      await prisma.eventLog.create({
        data: {
          userId: account.userId,
          type: 'VIRTUAL_ACCOUNT_DEBITED',
          metadata: {
            accountId,
            amount,
            description,
            previousBalance: Number(account.balance),
            newBalance: Number(updatedAccount.balance),
            ...metadata
          }
        }
      });

      return {
        success: true,
        account: updatedAccount,
        message: 'Account debited successfully'
      };
    } catch (error: any) {
      console.error('Error debiting account:', error);
      throw new Error(`Failed to debit account: ${error.message}`);
    }
  }

  /**
   * Get virtual account balance
   */
  async getAccountBalance(userId: string): Promise<VirtualAccountBalance | null> {
    try {
      const account = await prisma.virtualAccount.findFirst({
        where: { userId }
      });

      if (!account) {
        return null;
      }

      return {
        accountId: account.id,
        balance: Number(account.balance),
        currency: account.currency,
        isActive: account.isActive
      };
    } catch (error: any) {
      console.error('Error getting account balance:', error);
      throw new Error(`Failed to get account balance: ${error.message}`);
    }
  }

  /**
   * Get virtual account by user ID
   */
  async getVirtualAccountByUserId(userId: string) {
    try {
      const account = await prisma.virtualAccount.findFirst({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      return account;
    } catch (error: any) {
      console.error('Error fetching virtual account:', error);
      throw new Error(`Failed to fetch virtual account: ${error.message}`);
    }
  }

  /**
   * Process marking job payment to agent's virtual account
   */
  async processMarkingPayment(
    markingJobId: string,
    agentId: string,
    totalFee: number,
    isPartialPayment: boolean = false
  ) {
    try {
      // Calculate agent commission (25% of marking fee)
      const agentCommission = totalFee * 0.25;
      const partialPayment = 1000; // Initial partial payment

      const amountToPay = isPartialPayment ? partialPayment : agentCommission;

      // Get agent's virtual account
      const agentAccount = await prisma.virtualAccount.findFirst({
        where: { userId: agentId }
      });

      if (!agentAccount) {
        throw new Error('Agent virtual account not found');
      }

      // Credit agent's account
      const result = await this.creditAccount(
        agentAccount.id,
        amountToPay,
        isPartialPayment
          ? 'Partial payment for property marking'
          : 'Full payment for property marking',
        {
          markingJobId,
          paymentType: isPartialPayment ? 'PARTIAL' : 'FULL',
          totalFee,
          agentCommission
        }
      );

      // Update marking job payment status if full payment
      if (!isPartialPayment) {
        await prisma.propertyMarkingJob.update({
          where: { id: markingJobId },
          data: {
            paymentStatus: 'SUCCESS'
          }
        });
      }

      return result;
    } catch (error: any) {
      console.error('Error processing marking payment:', error);
      throw new Error(`Failed to process marking payment: ${error.message}`);
    }
  }

  /**
   * Suspend or activate virtual account
   */
  async toggleAccountStatus(accountId: string, isActive: boolean) {
    try {
      const account = await prisma.virtualAccount.update({
        where: { id: accountId },
        data: { isActive }
      });

      // Log event
      await prisma.eventLog.create({
        data: {
          userId: account.userId,
          type: isActive ? 'VIRTUAL_ACCOUNT_ACTIVATED' : 'VIRTUAL_ACCOUNT_SUSPENDED',
          metadata: { accountId }
        }
      });

      return {
        success: true,
        account,
        message: `Account ${isActive ? 'activated' : 'suspended'} successfully`
      };
    } catch (error: any) {
      console.error('Error toggling account status:', error);
      throw new Error(`Failed to toggle account status: ${error.message}`);
    }
  }
}

export default new VirtualAccountService();