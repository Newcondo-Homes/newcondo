// backend/payment-service/src/services/accountStatementService.ts

import { PrismaClient, VirtualAccount, Payment, User, Property } from '@newcondo/db';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface StatementTransaction {
  id: string;
  date: Date;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  balance: number;
  description: string;
  reference: string;
  source: 'RENT_PAYMENT' | 'MARKING_PAYMENT' | 'COMMISSION' | 'PLATFORM_FEE' | 'WITHDRAWAL' | 'REFUND';
  metadata?: {
    propertyTitle?: string;
    renterName?: string;
    paymentId?: string;
    unitNumber?: string;
  };
}

export interface AccountStatement {
  accountNumber: string;
  accountName: string;
  statementPeriod: {
    from: Date;
    to: Date;
  };
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
  transactions: StatementTransaction[];
}

export interface StatementFilters {
  startDate?: Date;
  endDate?: Date;
  transactionType?: 'CREDIT' | 'DEBIT';
  source?: StatementTransaction['source'];
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}

export class AccountStatementService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate account statement for a specific period
   */
  async generateStatement(
    accountId: string,
    startDate: Date,
    endDate: Date,
    filters?: StatementFilters
  ): Promise<AccountStatement> {
    // Get virtual account details
    const account = await this.prisma.virtualAccount.findUnique({
      where: { id: accountId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        property: {
          select: { id: true, title: true }
        }
      }
    });

    if (!account) {
      throw new Error('Virtual account not found');
    }

    // Get opening balance (balance at start of period)
    const openingBalance = await this.getBalanceAtDate(accountId, startDate);

    // Get all transactions for the period
    const transactions = await this.getTransactionsForPeriod(
      accountId,
      startDate,
      endDate,
      filters
    );

    // Calculate totals
    const totalCredits = transactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDebits = transactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      statementPeriod: {
        from: startDate,
        to: endDate
      },
      openingBalance,
      closingBalance: account.balance.toNumber(),
      totalCredits,
      totalDebits,
      transactionCount: transactions.length,
      transactions
    };
  }

  /**
   * Generate monthly statement
   */
  async generateMonthlyStatement(
    accountId: string,
    year: number,
    month: number
  ): Promise<AccountStatement> {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    return this.generateStatement(accountId, startDate, endDate);
  }

  /**
   * Get account balance at a specific date
   */
  private async getBalanceAtDate(accountId: string, date: Date): Promise<number> {
    // Get all transactions before the specified date
    const transactions = await this.getTransactionsForPeriod(
      accountId,
      new Date(0), // From beginning of time
      date
    );

    // Calculate balance by summing all credits and subtracting all debits
    return transactions.reduce((balance, transaction) => {
      return transaction.type === 'CREDIT' 
        ? balance + transaction.amount
        : balance - transaction.amount;
    }, 0);
  }

  /**
   * Get transactions for a specific period
   */
  private async getTransactionsForPeriod(
    accountId: string,
    startDate: Date,
    endDate: Date,
    filters?: StatementFilters
  ): Promise<StatementTransaction[]> {
    const account = await this.prisma.virtualAccount.findUnique({
      where: { id: accountId },
      include: { user: true, property: true }
    });

    if (!account) {
      throw new Error('Virtual account not found');
    }

    // Build where clause for payments
    const whereClause: any = {
      AND: [
        {
          OR: [
            { userId: account.userId },
            { 
              rental: {
                property: {
                  ownerId: account.userId
                }
              }
            }
          ]
        },
        {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        {
          status: 'SUCCESS'
        }
      ]
    };

    // Apply filters
    if (filters?.minAmount) {
      whereClause.AND.push({ amount: { gte: filters.minAmount } });
    }

    if (filters?.maxAmount) {
      whereClause.AND.push({ amount: { lte: filters.maxAmount } });
    }

    // Get payments
    const payments = await this.prisma.payment.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true }
        },
        rental: {
          include: {
            property: {
              select: { title: true }
            },
            unit: {
              select: { unitNumber: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      skip: filters?.offset || 0,
      take: filters?.limit || 1000
    });

    let runningBalance = await this.getBalanceAtDate(accountId, startDate);

    const transactions: StatementTransaction[] = payments.map(payment => {
      const isCredit = this.isPaymentCredit(payment, account.userId);
      const amount = payment.amount.toNumber();
      
      if (isCredit) {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }

      return {
        id: payment.id,
        date: payment.createdAt,
        type: isCredit ? 'CREDIT' : 'DEBIT',
        amount,
        balance: runningBalance,
        description: this.generateTransactionDescription(payment, isCredit),
        reference: payment.flutterwaveRef || payment.transactionId || payment.id,
        source: this.mapPaymentTypeToSource(payment.paymentType, isCredit),
        metadata: {
          propertyTitle: payment.rental?.property?.title,
          renterName: payment.user.name || undefined,
          paymentId: payment.id,
          unitNumber: payment.rental?.unit?.unitNumber
        }
      };
    });

    // Apply transaction type filter if specified
    if (filters?.transactionType) {
      return transactions.filter(t => t.type === filters.transactionType);
    }

    // Apply source filter if specified
    if (filters?.source) {
      return transactions.filter(t => t.source === filters.source);
    }

    return transactions;
  }

  /**
   * Determine if a payment is a credit or debit for the account holder
   */
  private isPaymentCredit(payment: any, accountUserId: string): boolean {
    // If the account holder is receiving rent payment, it's a credit
    if (payment.paymentType === 'RENT' && payment.rental?.property?.ownerId === accountUserId) {
      return true;
    }

    // If the account holder is paying (user making payment), it's a debit
    if (payment.userId === accountUserId) {
      return false;
    }

    // Default to credit for property owners
    return true;
  }

  /**
   * Generate human-readable transaction description
   */
  private generateTransactionDescription(payment: any, isCredit: boolean): string {
    const paymentType = payment.paymentType;
    const propertyTitle = payment.rental?.property?.title || 'Property';
    const unitNumber = payment.rental?.unit?.unitNumber;
    const renterName = payment.user.name || 'Renter';

    switch (paymentType) {
      case 'RENT':
        if (isCredit) {
          return unitNumber 
            ? `Rent payment received for ${propertyTitle} - ${unitNumber} from ${renterName}`
            : `Rent payment received for ${propertyTitle} from ${renterName}`;
        } else {
          return unitNumber
            ? `Rent payment made for ${propertyTitle} - ${unitNumber}`
            : `Rent payment made for ${propertyTitle}`;
        }

      case 'DEPOSIT':
        if (isCredit) {
          return `Security deposit received for ${propertyTitle} from ${renterName}`;
        } else {
          return `Security deposit paid for ${propertyTitle}`;
        }

      case 'AGENT_COMMISSION':
        return isCredit ? 'Agent commission received' : 'Agent commission paid';

      case 'PROPERTY_MARKING':
        return isCredit ? 'Property marking fee received' : 'Property marking fee paid';

      default:
        return payment.description || 'Payment transaction';
    }
  }

  /**
   * Map payment type to statement source
   */
  private mapPaymentTypeToSource(
    paymentType: string,
    isCredit: boolean
  ): StatementTransaction['source'] {
    switch (paymentType) {
      case 'RENT':
        return 'RENT_PAYMENT';
      case 'PROPERTY_MARKING':
        return 'MARKING_PAYMENT';
      case 'AGENT_COMMISSION':
        return 'COMMISSION';
      default:
        return isCredit ? 'RENT_PAYMENT' : 'WITHDRAWAL';
    }
  }

  /**
   * Export statement to CSV format
   */
  async exportStatementToCSV(accountId: string, startDate: Date, endDate: Date): Promise<string> {
    const statement = await this.generateStatement(accountId, startDate, endDate);

    const headers = [
      'Date',
      'Type',
      'Description',
      'Reference',
      'Amount',
      'Balance'
    ];

    const rows = statement.transactions.map(transaction => [
      format(transaction.date, 'yyyy-MM-dd HH:mm:ss'),
      transaction.type,
      transaction.description,
      transaction.reference,
      transaction.amount.toFixed(2),
      transaction.balance.toFixed(2)
    ]);

    const csvContent = [
      `Account Statement for ${statement.accountName} (${statement.accountNumber})`,
      `Period: ${format(statement.statementPeriod.from, 'yyyy-MM-dd')} to ${format(statement.statementPeriod.to, 'yyyy-MM-dd')}`,
      `Opening Balance: ${statement.openingBalance.toFixed(2)}`,
      `Closing Balance: ${statement.closingBalance.toFixed(2)}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Get statement summary for multiple accounts (for property managers)
   */
  async getAccountsSummary(userId: string, month?: number, year?: number): Promise<{
    totalBalance: number;
    totalCredits: number;
    totalDebits: number;
    accountCount: number;
    accounts: Array<{
      accountNumber: string;
      accountName: string;
      balance: number;
      propertyTitle?: string;
    }>;
  }> {
    const accounts = await this.prisma.virtualAccount.findMany({
      where: { userId },
      include: {
        property: {
          select: { title: true }
        }
      }
    });

    let totalCredits = 0;
    let totalDebits = 0;

    // If month/year specified, calculate period totals
    if (month && year) {
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));

      for (const account of accounts) {
        const transactions = await this.getTransactionsForPeriod(
          account.id,
          startDate,
          endDate
        );

        totalCredits += transactions
          .filter(t => t.type === 'CREDIT')
          .reduce((sum, t) => sum + t.amount, 0);

        totalDebits += transactions
          .filter(t => t.type === 'DEBIT')
          .reduce((sum, t) => sum + t.amount, 0);
      }
    }

    return {
      totalBalance: accounts.reduce((sum, acc) => sum + acc.balance.toNumber(), 0),
      totalCredits,
      totalDebits,
      accountCount: accounts.length,
      accounts: accounts.map(acc => ({
        accountNumber: acc.accountNumber,
        accountName: acc.accountName,
        balance: acc.balance.toNumber(),
        propertyTitle: acc.property?.title
      }))
    };
  }
}