// backend/marking-service/src/services/markingVirtualAccountService.ts

import { PrismaClient } from '@newcondo/db';
import { logger } from '../../../shared/src/middleware/logger';

const prisma = new PrismaClient();

interface CreateAgentAccountData {
  agentId: string;
  adminId: string;
}

interface ProcessPaymentData {
  accountId: string;
  amount: number;
  markingJobId: string;
  description?: string;
  userId: string;
}

interface ReleasePaymentData {
  accountId: string;
  markingJobId: string;
  releaseAmount?: number;
  releaseNotes?: string;
  releasedBy: string;
}

interface GetStatementData {
  accountId: string;
  requesterId: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

interface UpdateAccountStatusData {
  accountId: string;
  isActive: boolean;
  reason?: string;
  updatedBy: string;
}

interface GetAllAccountsFilter {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

interface BulkReleaseData {
  releases: Array<{
    accountId: string;
    markingJobId: string;
    amount?: number;
  }>;
  releasedBy: string;
}

export class MarkingVirtualAccountService {
  /**
   * Helper function to generate a unique account number.
   * In a real system, this would be more robust, potentially involving a lookup to ensure uniqueness.
   */
  private static async generateAgentAccountNumber(agentName: string): Promise<string> {
    const min = 1000000000;
    const max = 9999999999;
    let accountNumber = (Math.floor(Math.random() * (max - min + 1)) + min).toString();
    
    // Check for uniqueness in the database (simple check)
    let exists = await prisma.virtualAccount.findUnique({
      where: { accountNumber }
    });
    
    while(exists) {
      accountNumber = (Math.floor(Math.random() * (max - min + 1)) + min).toString();
      exists = await prisma.virtualAccount.findUnique({
        where: { accountNumber }
      });
    }
    
    return accountNumber;
  }
  
  /**
   * Mocks a call to the Flutterwave API for virtual account creation.
   * In a real implementation, this would use axios to call the Flutterwave SDK/API.
   */
  private static async createFlutterwaveVirtualAccount(data: { email: string; accountName: string; bvn: string; }) {
    return {
      id: `flw-acc-${Date.now()}`,
      accountNumber: '1234567890',
      bankName: 'Test Bank',
      status: 'active'
    };
  }
  
  /**
   * Create virtual account for agent
   */
  static async createAgentVirtualAccount(agentId: string, adminId: string) {
    try {
      // Check if agent exists and has agent role
      const agent = await prisma.user.findUnique({
        where: { 
          id: agentId,
          role: 'AGENT'
        }
      });

      if (!agent) {
        throw new Error('Agent not found or invalid role');
      }

      // Check if agent already has a virtual account
      const existingAccount = await prisma.virtualAccount.findFirst({
        where: { 
          userId: agentId,
          propertyId: null // Marking service accounts don't have propertyId
        }
      });

      if (existingAccount) {
        throw new Error('Agent already has a virtual account');
      }

      // Generate unique account number
      const accountNumber = await this.generateAgentAccountNumber(agent.name || agent.email);

      // Create virtual account in database
      const virtualAccount = await prisma.virtualAccount.create({
        data: {
          accountNumber,
          accountName: `${agent.name || 'Agent'} Marking Account`,
          bankCode: '000', // Placeholder bank code
          userId: agentId,
          propertyId: null, // No property association for agent accounts
          currency: 'NGN',
          isActive: true,
          balance: 0
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      // Create account in Flutterwave (mock implementation)
      try {
        const flutterwaveAccount = await this.createFlutterwaveVirtualAccount({
          email: agent.email,
          accountName: virtualAccount.accountName,
          bvn: '12345678901', // In real implementation, get from agent's verified BVN
        });

        // Update with Flutterwave account ID
        await prisma.virtualAccount.update({
          where: { id: virtualAccount.id },
          data: { flutterwaveAccountId: flutterwaveAccount.id }
        });

        virtualAccount.flutterwaveAccountId = flutterwaveAccount.id;
      } catch (error) {
        logger.error('Failed to create Flutterwave virtual account:', error);
        // Continue without Flutterwave integration for now
      }

      logger.info('Agent virtual account created successfully', {
        agentId,
        accountId: virtualAccount.id,
        accountNumber: virtualAccount.accountNumber
      });

      return virtualAccount;
    } catch (error) {
      logger.error('Error creating agent virtual account:', error);
      throw error;
    }
  }

  /**
   * Get agent virtual account details
   */
  static async getAgentVirtualAccount(agentId: string) {
    try {
      const virtualAccount = await prisma.virtualAccount.findFirst({
        where: {
          userId: agentId,
          propertyId: null // Agent marking accounts don't have propertyId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true
            }
          }
        }
      });

      return virtualAccount;
    } catch (error) {
      logger.error('Error retrieving agent virtual account:', error);
      throw error;
    }
  }

  /**
   * Get virtual account balance
   */
  static async getVirtualAccountBalance(accountId: string, requesterId: string) {
    try {
      const account = await prisma.virtualAccount.findUnique({
        where: { id: accountId },
        include: {
          user: {
            select: { id: true, role: true }
          }
        }
      });

      if (!account) {
        throw new Error('Virtual account not found');
      }

      // Check permissions
      const requester = await prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true }
      });

      if (account.userId !== requesterId && requester?.role !== 'ADMIN') {
        throw new Error('Unauthorized access to account balance');
      }

      return {
        accountId: account.id,
        accountNumber: account.accountNumber,
        balance: account.balance,
        currency: account.currency,
        isActive: account.isActive,
        lastUpdated: account.updatedAt
      };
    } catch (error) {
      logger.error('Error retrieving virtual account balance:', error);
      throw error;
    }
  }

  /**
   * Process payment to virtual account
   */
  static async processPaymentToVirtualAccount(data: ProcessPaymentData) {
    try {
      const { accountId, amount, markingJobId, description, userId } = data;

      // Validate marking job
      const markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
        include: {
          assignedAgent: true,
          property: true
        }
      });

      if (!markingJob) {
        throw new Error('Marking job not found');
      }

      if (markingJob.paymentStatus === 'SUCCESS') {
        throw new Error('Payment already processed for this marking job');
      }

      // Get virtual account
      const virtualAccount = await prisma.virtualAccount.findUnique({
        where: { id: accountId }
      });

      if (!virtualAccount || !virtualAccount.isActive) {
        throw new Error('Virtual account not found or inactive');
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId,
          markingJobId,
          amount,
          currency: 'NGN',
          paymentType: 'PROPERTY_MARKING',
          status: 'HELD', // Hold payment until job completion
          description: description || `Payment for property marking job ${markingJobId}`,
          transactionId: `MARKING_${Date.now()}_${markingJobId}`,
          confirmationPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
      });

      // Update virtual account balance
      await prisma.virtualAccount.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: amount
          }
        }
      });

      // Update marking job payment status
      await prisma.propertyMarkingJob.update({
        where: { id: markingJobId },
        data: {
          paymentStatus: 'SUCCESS'
        }
      });

      logger.info('Payment processed to virtual account', {
        accountId,
        amount,
        markingJobId,
        paymentId: payment.id
      });

      return {
        payment,
        virtualAccount,
        markingJob
      };
    } catch (error) {
      logger.error('Error processing payment to virtual account:', error);
      throw error;
    }
  }

  /**
   * Release payment from virtual account
   */
  static async releasePayment(data: ReleasePaymentData) {
    try {
      const { accountId, markingJobId, releaseAmount, releaseNotes, releasedBy } = data;

      // Get marking job and related payment
      const markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
        include: {
          assignedAgent: true
        }
      });

      if (!markingJob) {
        throw new Error('Marking job not found');
      }

      if (markingJob.status !== 'COMPLETED') {
        throw new Error('Cannot release payment for incomplete job');
      }

      // Get held payment
      const payment = await prisma.payment.findFirst({
        where: {
          markingJobId,
          status: 'HELD'
        }
      });

      if (!payment) {
        throw new Error('No held payment found for this marking job');
      }

      const amountToRelease = releaseAmount || payment.amount;

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // Release payment
        const releasedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'RELEASED',
            isReleased: true,
            releasedAt: new Date(),
            description: releaseNotes 
              ? `${payment.description} - Release Notes: ${releaseNotes}`
              : payment.description
          }
        });

        // Update virtual account balance (subtract released amount)
        const updatedAccount = await tx.virtualAccount.update({
          where: { id: accountId },
          data: {
            balance: {
              decrement: amountToRelease
            }
          }
        });

        return { releasedPayment, updatedAccount };
      });

      logger.info('Payment released from virtual account', {
        accountId,
        markingJobId,
        amountReleased: amountToRelease,
        releasedBy
      });

      return result;
    } catch (error) {
      logger.error('Error releasing payment from virtual account:', error);
      throw error;
    }
  }

  /**
   * Bulk release payments for multiple jobs.
   */
  static async bulkReleasePayments(data: BulkReleaseData) {
    const { releases, releasedBy } = data;
    const errors: any[] = [];
    const successfulReleases: any[] = [];

    await Promise.all(releases.map(async (release) => {
      try {
        const result = await this.releasePayment({
          accountId: release.accountId,
          markingJobId: release.markingJobId,
          releaseAmount: release.amount,
          releasedBy,
        });
        successfulReleases.push(result);
      } catch (error) {
        errors.push({
          markingJobId: release.markingJobId,
          accountId: release.accountId,
          error: (error as Error).message
        });
        logger.error(`Error in bulk release for job ${release.markingJobId}:`, error);
      }
    }));

    if (errors.length > 0) {
      logger.warn('Some payments in bulk release failed', {
        failedCount: errors.length,
        totalCount: releases.length,
        errors,
      });
    }

    return { successfulReleases, errors };
  }

  /**
   * Get account statement
   */
  static async getAccountStatement(data: GetStatementData) {
    try {
      const { accountId, requesterId, startDate, endDate, page, limit } = data;

      // Verify account access
      const account = await prisma.virtualAccount.findUnique({
        where: { id: accountId },
        include: {
          user: { select: { id: true, role: true } }
        }
      });

      if (!account) {
        throw new Error('Virtual account not found');
      }

      const requester = await prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true }
      });

      if (account.userId !== requesterId && requester?.role !== 'ADMIN') {
        throw new Error('Unauthorized access to account statement');
      }

      // Build date filter
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;

      // Get payments related to this virtual account
      const payments = await prisma.payment.findMany({
        where: {
          markingJobId: {
            in: await prisma.propertyMarkingJob.findMany({
              where: { assignedAgentId: account.userId },
              select: { id: true }
            }).then(jobs => jobs.map(job => job.id))
          },
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });

      const totalCount = await prisma.payment.count({
        where: {
          markingJobId: {
            in: await prisma.propertyMarkingJob.findMany({
              where: { assignedAgentId: account.userId },
              select: { id: true }
            }).then(jobs => jobs.map(job => job.id))
          },
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        }
      });

      return {
        account: {
          id: account.id,
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          balance: account.balance,
          currency: account.currency
        },
        transactions: payments,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        period: {
          startDate,
          endDate
        }
      };
    } catch (error) {
      logger.error('Error retrieving account statement:', error);
      throw error;
    }
  }

  /**
   * Update account status
   */
  static async updateAccountStatus(data: UpdateAccountStatusData) {
    try {
      const { accountId, isActive, reason, updatedBy } = data;

      const updatedAccount = await prisma.virtualAccount.update({
        where: { id: accountId },
        data: { isActive },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Log the status change
      logger.info('Virtual account status updated', {
        accountId,
        isActive,
        reason,
        updatedBy
      });

      return updatedAccount;
    } catch (error) {
      logger.error('Error updating account status:', error);
      throw error;
    }
  }

  /**
   * Get all agent virtual accounts (Admin only)
   */
  static async getAllAgentAccounts(filter: GetAllAccountsFilter) {
    try {
      const { page, limit, status, search } = filter;

      const whereClause: any = {
        propertyId: null, // Only agent accounts
        user: {
          role: 'AGENT'
        }
      };

      if (status === 'active') whereClause.isActive = true;
      if (status === 'inactive') whereClause.isActive = false;

      if (search) {
        whereClause.OR = [
          { accountName: { contains: search, mode: 'insensitive' } },
          { accountNumber: { contains: search } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const accounts = await prisma.virtualAccount.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isAvailableForMarking: true,
              agentReliabilityScore: true,
              totalMarkingJobs: true,
              completedMarkingJobs: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });

      const totalCount = await prisma.virtualAccount.count({ where: whereClause });

      return {
        accounts,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting all agent accounts:', error);
      throw error;
    }
  }

  /**
   * Get a summary of all agent virtual accounts for the dashboard.
   */
  static async getDashboardSummary() {
    try {
      const totalAccounts = await prisma.virtualAccount.count({
        where: {
          propertyId: null,
          user: { role: 'AGENT' }
        }
      });
      
      const activeAccounts = await prisma.virtualAccount.count({
        where: {
          propertyId: null,
          isActive: true,
          user: { role: 'AGENT' }
        }
      });

      const inactiveAccounts = totalAccounts - activeAccounts;

      const totalBalance = await prisma.virtualAccount.aggregate({
        _sum: {
          balance: true,
        },
        where: {
          propertyId: null,
          user: { role: 'AGENT' }
        }
      });

      return {
        totalAccounts,
        activeAccounts,
        inactiveAccounts,
        totalBalance: totalBalance._sum.balance || 0,
      };
    } catch (error) {
      logger.error('Error getting dashboard summary:', error);
      throw error;
    }
  }
}