import { PrismaClient, Decimal } from '@newcondo/db';
import { flutterwaveService } from './flutterwaveService';

const prisma = new PrismaClient();

interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: Decimal;
  description: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

interface TransferResult {
  success: boolean;
  transferId: string;
  amount: Decimal;
  fromAccount: string;
  toAccount: string;
  timestamp: Date;
}

class VirtualAccountTransferService {
  /**
   * Transfer funds between virtual accounts
   */
  async transferFunds(data: TransferRequest): Promise<TransferResult> {
    const { fromAccountId, toAccountId, amount, description, referenceId, metadata } = data;

    // Validate accounts exist
    const [fromAccount, toAccount] = await Promise.all([
      prisma.virtualAccount.findUnique({ where: { id: fromAccountId } }),
      prisma.virtualAccount.findUnique({ where: { id: toAccountId } }),
    ]);

    if (!fromAccount || !toAccount) {
      throw new Error('One or both virtual accounts not found');
    }

    if (!fromAccount.isActive || !toAccount.isActive) {
      throw new Error('One or both accounts are inactive');
    }

    // Validate sufficient balance
    if (fromAccount.balance.lessThan(amount)) {
      throw new Error('Insufficient balance in source account');
    }

    // Perform transfer via Flutterwave
    const flutterwaveTransfer = await flutterwaveService.transferBetweenAccounts({
      sourceAccountId: fromAccount.flutterwaveAccountId!,
      destinationAccountId: toAccount.flutterwaveAccountId!,
      amount: amount.toNumber(),
      narration: description,
      reference: referenceId || `TRF-${Date.now()}`,
    });

    if (!flutterwaveTransfer.success) {
      throw new Error(`Transfer failed: ${flutterwaveTransfer.message}`);
    }

    // Update balances in database
    await prisma.$transaction([
      prisma.virtualAccount.update({
        where: { id: fromAccountId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      }),
      prisma.virtualAccount.update({
        where: { id: toAccountId },
        data: {
          balance: {
            increment: amount,
          },
        },
      }),
    ]);

    // Log transfer
    await prisma.eventLog.create({
      data: {
        type: 'VIRTUAL_ACCOUNT_TRANSFER',
        metadata: {
          fromAccountId,
          toAccountId,
          amount: amount.toString(),
          description,
          referenceId,
          flutterwaveReference: flutterwaveTransfer.reference,
          ...metadata,
        },
      },
    });

    return {
      success: true,
      transferId: flutterwaveTransfer.reference,
      amount,
      fromAccount: fromAccount.accountNumber,
      toAccount: toAccount.accountNumber,
      timestamp: new Date(),
    };
  }

  /**
   * Transfer to property owner's virtual account
   */
  async transferToOwner(data: {
    propertyId: string;
    amount: Decimal;
    description: string;
    referenceId?: string;
  }) {
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      include: {
        owner: {
          include: {
            virtualAccounts: true,
          },
        },
      },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    const ownerAccount = property.owner.virtualAccounts[0];
    if (!ownerAccount) {
      throw new Error('Owner virtual account not found');
    }

    // Get Newcondo platform account (holding account)
    const platformAccount = await this.getPlatformAccount();

    return this.transferFunds({
      fromAccountId: platformAccount.id,
      toAccountId: ownerAccount.id,
      amount: data.amount,
      description: data.description,
      referenceId: data.referenceId,
      metadata: {
        propertyId: data.propertyId,
        ownerId: property.ownerId,
        transferType: 'OWNER_PAYMENT',
      },
    });
  }

  /**
   * Transfer agent commission
   */
  async transferToAgent(data: {
    agentId: string;
    amount: Decimal;
    description: string;
    propertyId?: string;
    referenceId?: string;
  }) {
    const agentAccount = await prisma.virtualAccount.findFirst({
      where: {
        userId: data.agentId,
        isActive: true,
      },
    });

    if (!agentAccount) {
      throw new Error('Agent virtual account not found');
    }

    const platformAccount = await this.getPlatformAccount();

    return this.transferFunds({
      fromAccountId: platformAccount.id,
      toAccountId: agentAccount.id,
      amount: data.amount,
      description: data.description,
      referenceId: data.referenceId,
      metadata: {
        agentId: data.agentId,
        propertyId: data.propertyId,
        transferType: 'AGENT_COMMISSION',
      },
    });
  }

  /**
   * Transfer platform fee to Newcondo account
   */
  async transferPlatformFee(data: {
    amount: Decimal;
    description: string;
    referenceId?: string;
    metadata?: Record<string, any>;
  }) {
    const platformAccount = await this.getPlatformAccount();
    const holdingAccount = await this.getHoldingAccount();

    return this.transferFunds({
      fromAccountId: holdingAccount.id,
      toAccountId: platformAccount.id,
      amount: data.amount,
      description: data.description,
      referenceId: data.referenceId,
      metadata: {
        ...data.metadata,
        transferType: 'PLATFORM_FEE',
      },
    });
  }

  /**
   * Get Newcondo platform account (for receiving fees)
   */
  private async getPlatformAccount() {
    const platformAccount = await prisma.virtualAccount.findFirst({
      where: {
        user: {
          role: 'ADMIN',
          email: process.env.PLATFORM_ACCOUNT_EMAIL || 'platform@newcondo.com',
        },
        isActive: true,
      },
    });

    if (!platformAccount) {
      throw new Error('Platform account not configured');
    }

    return platformAccount;
  }

  /**
   * Get holding account (for temporary payment holding during confirmation period)
   */
  private async getHoldingAccount() {
    const holdingAccount = await prisma.virtualAccount.findFirst({
      where: {
        user: {
          role: 'ADMIN',
          email: process.env.HOLDING_ACCOUNT_EMAIL || 'holding@newcondo.com',
        },
        isActive: true,
      },
    });

    if (!holdingAccount) {
      throw new Error('Holding account not configured');
    }

    return holdingAccount;
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: string) {
    const account = await prisma.virtualAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    return {
      accountNumber: account.accountNumber,
      balance: account.balance,
      currency: account.currency,
    };
  }

  /**
   * Get transfer history for an account
   */
  async getTransferHistory(accountId: string, limit = 50, offset = 0) {
    const transfers = await prisma.eventLog.findMany({
      where: {
        type: 'VIRTUAL_ACCOUNT_TRANSFER',
        OR: [
          { metadata: { path: ['fromAccountId'], equals: accountId } },
          { metadata: { path: ['toAccountId'], equals: accountId } },
        ],
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return transfers.map((t) => ({
      transferId: t.id,
      ...(t.metadata as any),
      timestamp: t.timestamp,
    }));
  }
}

export const virtualAccountTransferService = new VirtualAccountTransferService();