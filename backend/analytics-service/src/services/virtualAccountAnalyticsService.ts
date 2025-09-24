// backend/analytics-service/src/services/virtualAccountAnalyticsService.ts
import { PrismaClient } from '@newcondo/db';
import { Decimal } from '@prisma/client/runtime/library';

interface VirtualAccountAnalytics {
  totalAccounts: number;
  activeAccounts: number;
  totalBalance: Decimal;
  averageBalance: Decimal;
  accountsByType: {
    property: number;
    agent: number;
    owner: number;
  };
  monthlyMetrics: Array<{
    month: string;
    accountsCreated: number;
    totalTransactions: number;
    totalVolume: Decimal;
  }>;
  topAccountsByBalance: Array<{
    id: string;
    accountName: string;
    accountNumber: string;
    balance: Decimal;
    userId: string;
    userType: string;
  }>;
  balanceDistribution: {
    under1000: number;
    between1000And10000: number;
    between10000And100000: number;
    above100000: number;
  };
}

interface VirtualAccountStatement {
  accountId: string;
  transactions: Array<{
    id: string;
    type: 'CREDIT' | 'DEBIT';
    amount: Decimal;
    description: string;
    reference: string;
    timestamp: Date;
    balance: Decimal;
  }>;
  summary: {
    openingBalance: Decimal;
    totalCredits: Decimal;
    totalDebits: Decimal;
    closingBalance: Decimal;
    transactionCount: number;
  };
}

interface ReconciliationReport {
  accountId: string;
  reconciliationDate: Date;
  systemBalance: Decimal;
  bankBalance: Decimal;
  variance: Decimal;
  status: 'RECONCILED' | 'VARIANCE_FOUND' | 'PENDING';
  discrepancies: Array<{
    transactionId: string;
    description: string;
    amount: Decimal;
    type: string;
  }>;
}

class VirtualAccountAnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get comprehensive virtual account analytics
   */
  async getVirtualAccountAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<VirtualAccountAnalytics> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    // Get total and active accounts
    const [totalAccounts, activeAccounts] = await Promise.all([
      this.prisma.virtualAccount.count({
        where: { createdAt: dateFilter }
      }),
      this.prisma.virtualAccount.count({
        where: {
          isActive: true,
          createdAt: dateFilter
        }
      })
    ]);

    // Get balance metrics
    const balanceStats = await this.prisma.virtualAccount.aggregate({
      where: {
        isActive: true,
        createdAt: dateFilter
      },
      _sum: {
        balance: true
      },
      _avg: {
        balance: true
      }
    });

    // Get accounts by type
    const [propertyAccounts, agentAccounts, ownerAccounts] = await Promise.all([
      this.prisma.virtualAccount.count({
        where: {
          propertyId: { not: null },
          createdAt: dateFilter
        }
      }),
      this.prisma.virtualAccount.count({
        where: {
          propertyId: null,
          user: { role: 'AGENT' },
          createdAt: dateFilter
        }
      }),
      this.prisma.virtualAccount.count({
        where: {
          propertyId: null,
          user: { role: 'OWNER' },
          createdAt: dateFilter
        }
      })
    ]);

    // Get monthly metrics
    const monthlyMetrics = await this.getMonthlyMetrics(startDate, endDate);

    // Get top accounts by balance
    const topAccountsByBalance = await this.prisma.virtualAccount.findMany({
      where: {
        isActive: true,
        createdAt: dateFilter
      },
      select: {
        id: true,
        accountName: true,
        accountNumber: true,
        balance: true,
        userId: true,
        user: {
          select: {
            role: true
          }
        }
      },
      orderBy: {
        balance: 'desc'
      },
      take: 10
    });

    // Get balance distribution
    const balanceDistribution = await this.getBalanceDistribution(dateFilter);

    return {
      totalAccounts,
      activeAccounts,
      totalBalance: balanceStats._sum.balance || new Decimal(0),
      averageBalance: balanceStats._avg.balance || new Decimal(0),
      accountsByType: {
        property: propertyAccounts,
        agent: agentAccounts,
        owner: ownerAccounts
      },
      monthlyMetrics,
      topAccountsByBalance: topAccountsByBalance.map(account => ({
        id: account.id,
        accountName: account.accountName,
        accountNumber: account.accountNumber,
        balance: account.balance,
        userId: account.userId,
        userType: account.user.role
      })),
      balanceDistribution
    };
  }

  /**
   * Generate virtual account statement
   */
  async generateAccountStatement(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<VirtualAccountStatement> {
    // Note: This assumes we have a transaction log system
    // In a real implementation, you'd need to track all transactions
    const account = await this.prisma.virtualAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      throw new Error('Virtual account not found');
    }

    // Mock transaction data - replace with actual transaction queries
    const transactions = await this.getAccountTransactions(accountId, startDate, endDate);

    const summary = this.calculateStatementSummary(transactions);

    return {
      accountId,
      transactions,
      summary
    };
  }

  /**
   * Perform account reconciliation
   */
  async performReconciliation(accountId: string): Promise<ReconciliationReport> {
    const account = await this.prisma.virtualAccount.findUnique({
      where: { id: accountId },
      include: {
        user: true,
        property: true
      }
    });

    if (!account) {
      throw new Error('Virtual account not found');
    }

    const systemBalance = account.balance;
    
    // In a real implementation, fetch balance from Flutterwave API
    const bankBalance = await this.fetchFlutterwaveBalance(account.flutterwaveAccountId);
    
    const variance = systemBalance.minus(bankBalance);
    const status = variance.equals(0) ? 'RECONCILED' : 'VARIANCE_FOUND';

    const discrepancies = variance.equals(0) ? [] : [
      {
        transactionId: 'SYSTEM_VARIANCE',
        description: 'Balance variance detected',
        amount: variance,
        type: 'BALANCE_MISMATCH'
      }
    ];

    return {
      accountId,
      reconciliationDate: new Date(),
      systemBalance,
      bankBalance,
      variance,
      status,
      discrepancies
    };
  }

  /**
   * Get account performance metrics
   */
  async getAccountPerformance(accountId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const account = await this.prisma.virtualAccount.findUnique({
      where: { id: accountId },
      include: {
        user: true,
        property: {
          include: {
            rentals: {
              where: {
                createdAt: { gte: startDate }
              }
            }
          }
        }
      }
    });

    if (!account) {
      throw new Error('Virtual account not found');
    }

    // Calculate performance metrics
    const totalRentals = account.property?.rentals.length || 0;
    const avgRentalValue = account.property?.rentals.reduce(
      (sum, rental) => sum.plus(rental.monthlyRent), 
      new Decimal(0)
    ).dividedBy(totalRentals || 1);

    return {
      accountId,
      period: `${days} days`,
      totalRentals,
      avgRentalValue: avgRentalValue || new Decimal(0),
      currentBalance: account.balance,
      utilizationRate: this.calculateUtilizationRate(account.balance, avgRentalValue)
    };
  }

  /**
   * Get fund flow analysis
   */
  async getFundFlowAnalysis(accountId: string, period: '7d' | '30d' | '90d' = '30d') {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Mock implementation - replace with actual transaction queries
    const transactions = await this.getAccountTransactions(accountId, startDate, new Date());

    const inflows = transactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));

    const outflows = transactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));

    const netFlow = inflows.minus(outflows);

    return {
      accountId,
      period,
      inflows,
      outflows,
      netFlow,
      transactionCount: transactions.length,
      avgTransactionSize: transactions.length > 0 
        ? inflows.plus(outflows).dividedBy(transactions.length)
        : new Decimal(0)
    };
  }

  // Private helper methods
  private buildDateFilter(startDate?: Date, endDate?: Date) {
    if (!startDate && !endDate) return undefined;
    
    const filter: any = {};
    if (startDate) filter.gte = startDate;
    if (endDate) filter.lte = endDate;
    
    return filter;
  }

  private async getMonthlyMetrics(startDate?: Date, endDate?: Date) {
    // Mock implementation - replace with actual query
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const accountsCreated = await this.prisma.virtualAccount.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });

      months.push({
        month: monthStart.toISOString().slice(0, 7),
        accountsCreated,
        totalTransactions: 0, // Replace with actual transaction count
        totalVolume: new Decimal(0) // Replace with actual volume
      });
    }

    return months;
  }

  private async getBalanceDistribution(dateFilter?: any) {
    const [under1000, between1000And10000, between10000And100000, above100000] = await Promise.all([
      this.prisma.virtualAccount.count({
        where: {
          balance: { lt: 1000 },
          createdAt: dateFilter
        }
      }),
      this.prisma.virtualAccount.count({
        where: {
          balance: { gte: 1000, lt: 10000 },
          createdAt: dateFilter
        }
      }),
      this.prisma.virtualAccount.count({
        where: {
          balance: { gte: 10000, lt: 100000 },
          createdAt: dateFilter
        }
      }),
      this.prisma.virtualAccount.count({
        where: {
          balance: { gte: 100000 },
          createdAt: dateFilter
        }
      })
    ]);

    return {
      under1000,
      between1000And10000,
      between10000And100000,
      above100000
    };
  }

  private async getAccountTransactions(accountId: string, startDate: Date, endDate: Date) {
    // Mock implementation - replace with actual transaction log queries
    // This would typically query a separate transactions table
    return [];
  }

  private calculateStatementSummary(transactions: any[]) {
    const totalCredits = transactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));

    const totalDebits = transactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));

    return {
      openingBalance: new Decimal(0), // Calculate from first transaction
      totalCredits,
      totalDebits,
      closingBalance: totalCredits.minus(totalDebits),
      transactionCount: transactions.length
    };
  }

  private async fetchFlutterwaveBalance(flutterwaveAccountId?: string): Promise<Decimal> {
    // Mock implementation - replace with actual Flutterwave API call
    return new Decimal(0);
  }

  private calculateUtilizationRate(currentBalance: Decimal, avgRentalValue: Decimal): number {
    if (avgRentalValue.equals(0)) return 0;
    return currentBalance.dividedBy(avgRentalValue).times(100).toNumber();
  }
}

export default VirtualAccountAnalyticsService;