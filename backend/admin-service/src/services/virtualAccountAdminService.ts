// backend/admin-service/src/services/virtualAccountAdminService.ts

import { PrismaClient, VirtualAccount, User, Property } from '@newcondo/db';
import { accountAuditService } from './accountAuditService';
import { logger } from '@newcondo/backend-shared/';

const prisma = new PrismaClient();

interface VirtualAccountFilters {
  userId?: string;
  propertyId?: string;
  accountName?: string;
  accountNumber?: string;
  isActive?: boolean;
  hasBalance?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  balanceMin?: number;
  balanceMax?: number;
}

interface VirtualAccountStats {
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
  frozenAccounts: number;
  totalBalance: number;
  averageBalance: number;
  accountsWithZeroBalance: number;
  newAccountsThisMonth: number;
  transactionVolumeThisMonth: number;
}

interface BulkActionRequest {
  accountIds: string[];
  action: 'deactivate' | 'reactivate' | 'freeze' | 'unfreeze';
  reason?: string;
}

export class VirtualAccountAdminService {
  
  // Get virtual accounts with advanced filtering and pagination
  async getVirtualAccounts(
    page: number = 1,
    limit: number = 20,
    filters: VirtualAccountFilters = {},
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    try {
      const skip = (page - 1) * limit;
      
      // Build where clause based on filters
      const whereClause: any = {};
      
      if (filters.userId) {
        whereClause.userId = filters.userId;
      }
      
      if (filters.propertyId) {
        whereClause.propertyId = filters.propertyId;
      }
      
      if (filters.accountName) {
        whereClause.accountName = {
          contains: filters.accountName,
          mode: 'insensitive'
        };
      }
      
      if (filters.accountNumber) {
        whereClause.accountNumber = {
          contains: filters.accountNumber
        };
      }
      
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }
      
      if (filters.hasBalance !== undefined) {
        if (filters.hasBalance) {
          whereClause.balance = { gt: 0 };
        } else {
          whereClause.balance = { equals: 0 };
        }
      }
      
      if (filters.balanceMin !== undefined) {
        whereClause.balance = { ...whereClause.balance, gte: filters.balanceMin };
      }
      
      if (filters.balanceMax !== undefined) {
        whereClause.balance = { ...whereClause.balance, lte: filters.balanceMax };
      }
      
      if (filters.createdAfter || filters.createdBefore) {
        whereClause.createdAt = {};
        if (filters.createdAfter) {
          whereClause.createdAt.gte = filters.createdAfter;
        }
        if (filters.createdBefore) {
          whereClause.createdAt.lte = filters.createdBefore;
        }
      }

      // Execute query with pagination
      const [accounts, totalCount] = await Promise.all([
        prisma.virtualAccount.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                verificationStatus: true
              }
            },
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
                status: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.virtualAccount.count({ where: whereClause })
      ]);

      return {
        accounts,
        pagination: {
          current: page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };

    } catch (error) {
      logger.error('Error fetching virtual accounts:', error);
      throw new Error('Failed to fetch virtual accounts');
    }
  }

  // Get virtual account statistics for admin dashboard
  async getVirtualAccountStats(): Promise<VirtualAccountStats> {
    try {
      const currentMonth = new Date();
      currentMonth.setDate(1); // First day of current month
      currentMonth.setHours(0, 0, 0, 0);

      const [
        totalAccounts,
        activeAccounts,
        accountsWithBalance,
        newAccountsThisMonth,
        allAccounts
      ] = await Promise.all([
        prisma.virtualAccount.count(),
        prisma.virtualAccount.count({ where: { isActive: true } }),
        prisma.virtualAccount.count({ where: { balance: { gt: 0 } } }),
        prisma.virtualAccount.count({
          where: {
            createdAt: { gte: currentMonth }
          }
        }),
        prisma.virtualAccount.findMany({
          select: { balance: true, isActive: true }
        })
      ]);

      const inactiveAccounts = totalAccounts - activeAccounts;
      const accountsWithZeroBalance = totalAccounts - accountsWithBalance;
      
      // Calculate total and average balance
      const totalBalance = allAccounts.reduce((sum, account) => 
        sum + Number(account.balance), 0
      );
      const averageBalance = totalAccounts > 0 ? totalBalance / totalAccounts : 0;

      // For now, set frozenAccounts to 0 since we don't have a frozen status in schema
      const frozenAccounts = 0;
      
      // For transaction volume, we'll need to implement this when we have transaction history
      const transactionVolumeThisMonth = 0;

      return {
        totalAccounts,
        activeAccounts,
        inactiveAccounts,
        frozenAccounts,
        totalBalance,
        averageBalance,
        accountsWithZeroBalance,
        newAccountsThisMonth,
        transactionVolumeThisMonth
      };

    } catch (error) {
      logger.error('Error fetching virtual account stats:', error);
      throw new Error('Failed to fetch virtual account statistics');
    }
  }

  // Get detailed information about a specific virtual account
  async getVirtualAccountDetails(accountId: string) {
    try {
      const account = await prisma.virtualAccount.findUnique({
        where: { id: accountId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              verificationStatus: true,
              createdAt: true
            }
          },
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              state: true,
              status: true,
              price: true,
              propertyType: true,
              createdAt: true
            }
          }
        }
      });

      if (!account) {
        throw new Error('Virtual account not found');
      }

      // Get audit history for this account
      const auditHistory = await accountAuditService.getAccountAuditHistory(accountId);

      return {
        account,
        auditHistory
      };

    } catch (error) {
      logger.error('Error fetching virtual account details:', error);
      throw new Error('Failed to fetch virtual account details');
    }
  }

  // Create virtual account manually (admin function)
  async createVirtualAccount(
    adminId: string,
    data: {
      userId: string;
      propertyId?: string;
      accountName: string;
      bankCode?: string;
    }
  ) {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: data.userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if property exists (if provided)
      if (data.propertyId) {
        const property = await prisma.property.findUnique({
          where: { id: data.propertyId }
        });

        if (!property) {
          throw new Error('Property not found');
        }

        // Check if property already has a virtual account
        const existingAccount = await prisma.virtualAccount.findUnique({
          where: { propertyId: data.propertyId }
        });

        if (existingAccount) {
          throw new Error('Property already has a virtual account');
        }
      }

      // Generate unique account number
      const accountNumber = await this.generateAccountNumber();

      // Create virtual account
      const virtualAccount = await prisma.virtualAccount.create({
        data: {
          accountNumber,
          accountName: data.accountName,
          bankCode: data.bankCode || 'DEFAULT',
          userId: data.userId,
          propertyId: data.propertyId,
          balance: 0,
          isActive: true
        },
        include: {
          user: {
            select: { name: true, email: true }
          },
          property: {
            select: { title: true }
          }
        }
      });

      // Log the creation in audit history
      await accountAuditService.logAccountAction(
        virtualAccount.id,
        adminId,
        'ACCOUNT_CREATED',
        'Virtual account created manually by admin',
        { 
          accountNumber: virtualAccount.accountNumber,
          accountName: virtualAccount.accountName 
        }
      );

      logger.info(`Virtual account created: ${virtualAccount.accountNumber} for user ${data.userId}`);

      return virtualAccount;

    } catch (error) {
      logger.error('Error creating virtual account:', error);
      throw error;
    }
  }

  // Update virtual account details
  async updateVirtualAccount(
    accountId: string,
    adminId: string,
    updates: {
      accountName?: string;
      isActive?: boolean;
    }
  ) {
    try {
      const existingAccount = await prisma.virtualAccount.findUnique({
        where: { id: accountId }
      });

      if (!existingAccount) {
        throw new Error('Virtual account not found');
      }

      const updatedAccount = await prisma.virtualAccount.update({
        where: { id: accountId },
        data: updates,
        include: {
          user: {
            select: { name: true, email: true }
          },
          property: {
            select: { title: true }
          }
        }
      });

      // Log the update in audit history
      await accountAuditService.logAccountAction(
        accountId,
        adminId,
        'ACCOUNT_UPDATED',
        'Virtual account details updated by admin',
        { 
          changes: updates,
          previousData: {
            accountName: existingAccount.accountName,
            isActive: existingAccount.isActive
          }
        }
      );

      return updatedAccount;

    } catch (error) {
      logger.error('Error updating virtual account:', error);
      throw error;
    }
  }

  // Deactivate virtual account
  async deactivateVirtualAccount(accountId: string, adminId: string, reason?: string) {
    try {
      const account = await prisma.virtualAccount.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error('Virtual account not found');
      }

      if (!account.isActive) {
        throw new Error('Account is already inactive');
      }

      const updatedAccount = await prisma.virtualAccount.update({
        where: { id: accountId },
        data: { isActive: false }
      });

      // Log the deactivation
      await accountAuditService.logAccountAction(
        accountId,
        adminId,
        'ACCOUNT_DEACTIVATED',
        reason || 'Account deactivated by admin',
        { previousStatus: 'active' }
      );

      return updatedAccount;

    } catch (error) {
      logger.error('Error deactivating virtual account:', error);
      throw error;
    }
  }

  // Reactivate virtual account
  async reactivateVirtualAccount(accountId: string, adminId: string, reason?: string) {
    try {
      const account = await prisma.virtualAccount.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error('Virtual account not found');
      }

      if (account.isActive) {
        throw new Error('Account is already active');
      }

      const updatedAccount = await prisma.virtualAccount.update({
        where: { id: accountId },
        data: { isActive: true }
      });

      // Log the reactivation
      await accountAuditService.logAccountAction(
        accountId,
        adminId,
        'ACCOUNT_REACTIVATED',
        reason || 'Account reactivated by admin',
        { previousStatus: 'inactive' }
      );

      return updatedAccount;

    } catch (error) {
      logger.error('Error reactivating virtual account:', error);
      throw error;
    }
  }

  // Bulk actions on multiple accounts
  async bulkVirtualAccountActions(
    adminId: string,
    bulkAction: BulkActionRequest
  ) {
    try {
      const { accountIds, action, reason } = bulkAction;
      
      const results = {
        successful: [] as string[],
        failed: [] as { accountId: string, error: string }[]
      };

      for (const accountId of accountIds) {
        try {
          switch (action) {
            case 'deactivate':
              await this.deactivateVirtualAccount(accountId, adminId, reason);
              break;
            case 'reactivate':
              await this.reactivateVirtualAccount(accountId, adminId, reason);
              break;
            case 'freeze':
              // Implementation for freeze would go here
              // For now, we'll log it as a placeholder
              await accountAuditService.logAccountAction(
                accountId,
                adminId,
                'ACCOUNT_FROZEN',
                reason || 'Account frozen by admin'
              );
              break;
            case 'unfreeze':
              // Implementation for unfreeze would go here
              await accountAuditService.logAccountAction(
                accountId,
                adminId,
                'ACCOUNT_UNFROZEN',
                reason || 'Account unfrozen by admin'
              );
              break;
            default:
              throw new Error(`Unknown action: ${action}`);
          }
          
          results.successful.push(accountId);

        } catch (error) {
          results.failed.push({
            accountId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Log bulk action
      await accountAuditService.logBulkAction(
        adminId,
        action,
        accountIds,
        reason,
        results
      );

      return results;

    } catch (error) {
      logger.error('Error performing bulk virtual account actions:', error);
      throw error;
    }
  }

  // Generate unique account number
  private async generateAccountNumber(): Promise<string> {
    let accountNumber: string;
    let isUnique = false;

    while (!isUnique) {
      // Generate 10-digit account number
      accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      
      // Check if it already exists
      const existing = await prisma.virtualAccount.findUnique({
        where: { accountNumber }
      });

      if (!existing) {
        isUnique = true;
      }
    }

    return accountNumber!;
  }

  // Generate virtual account statement
  async generateVirtualAccountStatement(
    accountId: string,
    startDate: Date,
    endDate: Date
  ) {
    try {
      const account = await prisma.virtualAccount.findUnique({
        where: { id: accountId },
        include: {
          user: {
            select: { name: true, email: true }
          },
          property: {
            select: { title: true, address: true }
          }
        }
      });

      if (!account) {
        throw new Error('Virtual account not found');
      }

      // Get audit history for the date range
      const auditHistory = await accountAuditService.getAccountAuditHistory(
        accountId,
        startDate,
        endDate
      );

      // Format statement data
      const statement = {
        account: {
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          currentBalance: account.balance,
          currency: account.currency
        },
        accountHolder: {
          name: account.user.name,
          email: account.user.email
        },
        property: account.property ? {
          title: account.property.title,
          address: account.property.address
        } : null,
        period: {
          startDate,
          endDate
        },
        transactions: auditHistory,
        summary: {
          openingBalance: 0, // Would need to calculate from historical data
          closingBalance: Number(account.balance),
          totalCredits: 0, // Would calculate from transactions
          totalDebits: 0, // Would calculate from transactions
          transactionCount: auditHistory.length
        }
      };

      return statement;

    } catch (error) {
      logger.error('Error generating virtual account statement:', error);
      throw error;
    }
  }
}

export const virtualAccountAdminService = new VirtualAccountAdminService();