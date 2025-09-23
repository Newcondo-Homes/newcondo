// backend/payment-service/src/services/flutterwaveVirtualAccountService.ts

import axios, { AxiosResponse } from 'axios';
import { PrismaClient, VirtualAccount, User, Property } from '@newcondo/db';
import { 
  VirtualAccountRequest, 
  VirtualAccountResponse, 
  FlutterwaveVirtualAccountPayload,
  FlutterwaveVirtualAccountResponse,
  VirtualAccountType,
  VirtualAccountServiceError,
  AccountNameGenerationOptions,
  VirtualAccountFilter,
  VirtualAccountListResponse,
  VirtualAccountMetrics,
  MarkingServiceVirtualAccount,
  VirtualAccountWebhookPayload,
  AccountBalance
} from '../types/virtualAccount';

export class FlutterwaveVirtualAccountService {
  private readonly prisma: PrismaClient;
  private readonly flutterwaveBaseUrl: string;
  private readonly flutterwaveSecretKey: string;
  private readonly flutterwaveBankCode: string = '044'; // Access Bank

  constructor() {
    this.prisma = new PrismaClient();
    this.flutterwaveBaseUrl = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';
    this.flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY!;

    if (!this.flutterwaveSecretKey) {
      throw new Error('FLUTTERWAVE_SECRET_KEY is required');
    }
  }

  /**
   * Create a new virtual account
   */
  async createVirtualAccount(request: VirtualAccountRequest): Promise<VirtualAccountResponse> {
    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: request.userId },
        include: { properties: true }
      });

      if (!user) {
        throw new VirtualAccountServiceError('USER_NOT_FOUND', 'User not found');
      }

      // Get property details if propertyId is provided
      let property: Property | null = null;
      if (request.propertyId) {
        property = await this.prisma.property.findUnique({
          where: { id: request.propertyId }
        });

        if (!property) {
          throw new VirtualAccountServiceError('PROPERTY_NOT_FOUND', 'Property not found');
        }

        // Check if property already has a virtual account
        const existingAccount = await this.prisma.virtualAccount.findUnique({
          where: { propertyId: request.propertyId }
        });

        if (existingAccount) {
          throw new VirtualAccountServiceError('ACCOUNT_EXISTS', 'Property already has a virtual account');
        }
      }

      // Generate account name
      const accountName = this.generateAccountName({
        userFullName: user.name || 'User',
        accountType: request.accountType,
        propertyTitle: property?.title
      });

      // Create virtual account with Flutterwave
      const flutterwaveAccount = await this.createFlutterwaveVirtualAccount(user, accountName);

      // Save to database
      const virtualAccount = await this.prisma.virtualAccount.create({
        data: {
          accountNumber: flutterwaveAccount.data.account_number,
          accountName,
          bankCode: this.flutterwaveBankCode,
          userId: request.userId,
          propertyId: request.propertyId,
          flutterwaveAccountId: flutterwaveAccount.data.order_ref,
          balance: 0,
          currency: 'NGN',
          isActive: true
        }
      });

      return this.mapToVirtualAccountResponse(virtualAccount);
    } catch (error) {
      if (error instanceof VirtualAccountServiceError) {
        throw error;
      }
      
      console.error('Error creating virtual account:', error);
      throw new VirtualAccountServiceError(
        'CREATION_FAILED', 
        'Failed to create virtual account',
        error
      );
    }
  }

  /**
   * Create virtual account with Flutterwave
   */
  private async createFlutterwaveVirtualAccount(
    user: User, 
    accountName: string
  ): Promise<FlutterwaveVirtualAccountResponse> {
    const payload: FlutterwaveVirtualAccountPayload = {
      email: user.email,
      is_permanent: true,
      tx_ref: `VA_${user.id}_${Date.now()}`,
      narration: `Virtual Account for ${accountName}`
    };

    try {
      const response: AxiosResponse<FlutterwaveVirtualAccountResponse> = await axios.post(
        `${this.flutterwaveBaseUrl}/virtual-account-numbers`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.flutterwaveSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status !== 'success') {
        throw new Error(`Flutterwave API error: ${response.data.message}`);
      }

      return response.data;
    } catch (error: any) {
      console.error('Flutterwave virtual account creation failed:', error);
      throw new VirtualAccountServiceError(
        'FLUTTERWAVE_ERROR',
        'Failed to create virtual account with Flutterwave',
        error.response?.data || error.message
      );
    }
  }

  /**
   * Generate unique account name
   */
  private generateAccountName(options: AccountNameGenerationOptions): string {
    const { userFullName, accountType, propertyTitle, maxLength = 30 } = options;
    
    let baseName: string;
    const cleanName = userFullName.replace(/[^a-zA-Z\s]/g, '').trim();
    
    switch (accountType) {
      case VirtualAccountType.PROPERTY_OWNER:
        baseName = `${cleanName} PROP`;
        break;
      case VirtualAccountType.AGENT:
        baseName = `${cleanName} AGT`;
        break;
      case VirtualAccountType.MARKING_AGENT:
        baseName = `${cleanName} MRK`;
        break;
      case VirtualAccountType.PROPERTY_SPECIFIC:
        const propTitle = propertyTitle?.substring(0, 10) || 'PROP';
        baseName = `${cleanName} ${propTitle}`;
        break;
      default:
        baseName = cleanName;
    }

    // Add unique suffix
    const timestamp = Date.now().toString().slice(-4);
    const finalName = `${baseName} ${timestamp}`.substring(0, maxLength);
    
    return finalName.toUpperCase();
  }

  /**
   * Get virtual account by ID
   */
  async getVirtualAccount(accountId: string): Promise<VirtualAccountResponse | null> {
    try {
      const account = await this.prisma.virtualAccount.findUnique({
        where: { id: accountId }
      });

      return account ? this.mapToVirtualAccountResponse(account) : null;
    } catch (error) {
      console.error('Error fetching virtual account:', error);
      throw new VirtualAccountServiceError('FETCH_FAILED', 'Failed to fetch virtual account');
    }
  }

  /**
   * Get virtual accounts by user ID
   */
  async getVirtualAccountsByUser(userId: string): Promise<VirtualAccountResponse[]> {
    try {
      const accounts = await this.prisma.virtualAccount.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      return accounts.map(account => this.mapToVirtualAccountResponse(account));
    } catch (error) {
      console.error('Error fetching user virtual accounts:', error);
      throw new VirtualAccountServiceError('FETCH_FAILED', 'Failed to fetch user virtual accounts');
    }
  }

  /**
   * Get virtual account by property ID
   */
  async getVirtualAccountByProperty(propertyId: string): Promise<VirtualAccountResponse | null> {
    try {
      const account = await this.prisma.virtualAccount.findUnique({
        where: { propertyId }
      });

      return account ? this.mapToVirtualAccountResponse(account) : null;
    } catch (error) {
      console.error('Error fetching property virtual account:', error);
      throw new VirtualAccountServiceError('FETCH_FAILED', 'Failed to fetch property virtual account');
    }
  }

  /**
   * List virtual accounts with filtering
   */
  async listVirtualAccounts(
    filter: VirtualAccountFilter = {},
    page: number = 1,
    limit: number = 20
  ): Promise<VirtualAccountListResponse> {
    try {
      const where: any = {};

      if (filter.userId) where.userId = filter.userId;
      if (filter.isActive !== undefined) where.isActive = filter.isActive;
      if (filter.propertyId) where.propertyId = filter.propertyId;
      if (filter.minBalance !== undefined) where.balance = { gte: filter.minBalance };
      if (filter.maxBalance !== undefined) {
        where.balance = { ...where.balance, lte: filter.maxBalance };
      }
      if (filter.createdAfter || filter.createdBefore) {
        where.createdAt = {};
        if (filter.createdAfter) where.createdAt.gte = filter.createdAfter;
        if (filter.createdBefore) where.createdAt.lte = filter.createdBefore;
      }

      const [accounts, totalCount] = await Promise.all([
        this.prisma.virtualAccount.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.virtualAccount.count({ where })
      ]);

      return {
        accounts: accounts.map(account => this.mapToVirtualAccountResponse(account)),
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit)
      };
    } catch (error) {
      console.error('Error listing virtual accounts:', error);
      throw new VirtualAccountServiceError('LIST_FAILED', 'Failed to list virtual accounts');
    }
  }

  /**
   * Update virtual account
   */
  async updateVirtualAccount(
    accountId: string,
    updates: { isActive?: boolean; metadata?: Record<string, any> }
  ): Promise<VirtualAccountResponse> {
    try {
      const account = await this.prisma.virtualAccount.update({
        where: { id: accountId },
        data: updates
      });

      return this.mapToVirtualAccountResponse(account);
    } catch (error) {
      console.error('Error updating virtual account:', error);
      throw new VirtualAccountServiceError('UPDATE_FAILED', 'Failed to update virtual account');
    }
  }

  /**
   * Deactivate virtual account
   */
  async deactivateVirtualAccount(accountId: string): Promise<VirtualAccountResponse> {
    return this.updateVirtualAccount(accountId, { isActive: false });
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: string): Promise<AccountBalance> {
    try {
      const account = await this.prisma.virtualAccount.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new VirtualAccountServiceError('ACCOUNT_NOT_FOUND', 'Virtual account not found');
      }

      return {
        virtualAccountId: accountId,
        availableBalance: Number(account.balance),
        ledgerBalance: Number(account.balance), // For now, same as available
        currency: account.currency,
        lastUpdated: account.updatedAt
      };
    } catch (error) {
      if (error instanceof VirtualAccountServiceError) throw error;
      
      console.error('Error getting account balance:', error);
      throw new VirtualAccountServiceError('BALANCE_FETCH_FAILED', 'Failed to get account balance');
    }
  }

  /**
   * Update account balance
   */
  async updateAccountBalance(accountId: string, newBalance: number): Promise<void> {
    try {
      await this.prisma.virtualAccount.update({
        where: { id: accountId },
        data: { 
          balance: newBalance,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating account balance:', error);
      throw new VirtualAccountServiceError('BALANCE_UPDATE_FAILED', 'Failed to update account balance');
    }
  }

  /**
   * Get virtual accounts metrics
   */
  async getVirtualAccountsMetrics(): Promise<VirtualAccountMetrics> {
    try {
      const [totalAccounts, activeAccounts, balanceAgg, topAccounts] = await Promise.all([
        this.prisma.virtualAccount.count(),
        this.prisma.virtualAccount.count({ where: { isActive: true } }),
        this.prisma.virtualAccount.aggregate({
          _sum: { balance: true },
          _avg: { balance: true }
        }),
        this.prisma.virtualAccount.findMany({
          take: 10,
          orderBy: { balance: 'desc' }
        })
      ]);

      // Get accounts by type - this would require adding accountType to schema
      const accountsByType = {
        [VirtualAccountType.PROPERTY_OWNER]: 0,
        [VirtualAccountType.AGENT]: 0,
        [VirtualAccountType.MARKING_AGENT]: 0,
        [VirtualAccountType.PROPERTY_SPECIFIC]: 0
      };

      return {
        totalAccounts,
        activeAccounts,
        totalBalance: Number(balanceAgg._sum.balance || 0),
        averageBalance: Number(balanceAgg._avg.balance || 0),
        accountsByType,
        transactionVolume: {
          daily: 0, // Would need transaction tracking
          weekly: 0,
          monthly: 0
        },
        topAccountsByBalance: topAccounts.map(account => this.mapToVirtualAccountResponse(account))
      };
    } catch (error) {
      console.error('Error getting virtual accounts metrics:', error);
      throw new VirtualAccountServiceError('METRICS_FAILED', 'Failed to get virtual accounts metrics');
    }
  }

  /**
   * Handle webhook for virtual account transactions
   */
  async handleWebhook(payload: VirtualAccountWebhookPayload): Promise<void> {
    try {
      const { data } = payload;
      
      // Find the virtual account by account number
      const virtualAccount = await this.prisma.virtualAccount.findFirst({
        where: { 
          accountNumber: data.entity.account_number 
        }
      });

      if (!virtualAccount) {
        console.warn(`Virtual account not found for webhook: ${data.entity.account_number}`);
        return;
      }

      // Update account balance
      const newBalance = Number(virtualAccount.balance) + data.amount;
      await this.updateAccountBalance(virtualAccount.id, newBalance);

      console.log(`Virtual account ${virtualAccount.accountNumber} balance updated to ${newBalance}`);
    } catch (error) {
      console.error('Error handling virtual account webhook:', error);
      throw new VirtualAccountServiceError('WEBHOOK_FAILED', 'Failed to handle webhook');
    }
  }

  /**
   * Auto-create virtual accounts for property owners
   */
  async autoCreateForPropertyListing(propertyId: string, ownerId: string): Promise<VirtualAccountResponse> {
    try {
      // Check if property already has a virtual account
      const existingAccount = await this.getVirtualAccountByProperty(propertyId);
      if (existingAccount) {
        return existingAccount;
      }

      // Create new virtual account
      return await this.createVirtualAccount({
        userId: ownerId,
        propertyId,
        accountType: VirtualAccountType.PROPERTY_SPECIFIC,
        metadata: { autoCreated: true, createdFor: 'property_listing' }
      });
    } catch (error) {
      console.error('Error auto-creating virtual account:', error);
      throw new VirtualAccountServiceError(
        'AUTO_CREATE_FAILED', 
        'Failed to auto-create virtual account for property'
      );
    }
  }

  /**
   * Create marking service virtual account for agents
   */
  async createMarkingServiceAccount(agentId: string): Promise<MarkingServiceVirtualAccount> {
    try {
      const baseAccount = await this.createVirtualAccount({
        userId: agentId,
        accountType: VirtualAccountType.MARKING_AGENT,
        metadata: { purpose: 'marking_service' }
      });

      return {
        ...baseAccount,
        agentId,
        markingJobsCount: 0,
        totalEarnings: 0,
        pendingPayouts: 0
      };
    } catch (error) {
      console.error('Error creating marking service account:', error);
      throw new VirtualAccountServiceError(
        'MARKING_ACCOUNT_FAILED',
        'Failed to create marking service virtual account'
      );
    }
  }

  /**
   * Map database model to response DTO
   */
  private mapToVirtualAccountResponse(account: VirtualAccount): VirtualAccountResponse {
    return {
      id: account.id,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      bankCode: account.bankCode,
      bankName: 'Access Bank', // Default for Flutterwave
      userId: account.userId,
      propertyId: account.propertyId || undefined,
      balance: Number(account.balance),
      currency: account.currency,
      isActive: account.isActive,
      flutterwaveAccountId: account.flutterwaveAccountId || '',
      createdAt: account.createdAt,
      updatedAt: account.updatedAt
    };
  }

  /**
   * Cleanup - close Prisma connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}