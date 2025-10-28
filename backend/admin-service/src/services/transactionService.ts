import { PrismaClient, PaymentStatus, PaymentType, Prisma } from '@newcondo/db';
import { AppError } from '../../../shared/src/utils/response';

const prisma = new PrismaClient();

interface TransactionFilters {
  userId?: string;
  status?: PaymentStatus;
  paymentType?: PaymentType;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  refundedTransactions: number;
  averageTransactionAmount: number;
  totalRentPayments: number;
  totalMarkingPayments: number;
  totalCommissions: number;
  totalPlatformFees: number;
}

export class TransactionService {
  /**
   * Get all transactions with filters and pagination
   */
  async getTransactions(
    filters: TransactionFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.paymentType && { paymentType: filters.paymentType }),
      ...(filters.startDate || filters.endDate
        ? {
            createdAt: {
              ...(filters.startDate && { gte: filters.startDate }),
              ...(filters.endDate && { lte: filters.endDate }),
            },
          }
        : {}),
      ...(filters.minAmount || filters.maxAmount
        ? {
            amount: {
              ...(filters.minAmount && { gte: filters.minAmount }),
              ...(filters.maxAmount && { lte: filters.maxAmount }),
            },
          }
        : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          rental: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                },
              },
              unit: {
                select: {
                  id: true,
                  unitNumber: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(startDate?: Date, endDate?: Date): Promise<TransactionStats> {
    const where: Prisma.PaymentWhereInput = {
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    const [
      totalTransactions,
      totalAmountResult,
      statusCounts,
      paymentTypeCounts,
      commissionsSum,
      platformFeesSum,
    ] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.payment.groupBy({
        by: ['paymentType'],
        where,
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { ...where, agentCommission: { not: null } },
        _sum: { agentCommission: true },
      }),
      prisma.payment.aggregate({
        where: { ...where, platformFee: { not: null } },
        _sum: { platformFee: true },
      }),
    ]);

    const totalAmount = Number(totalAmountResult._sum.amount || 0);
    const totalCommissions = Number(commissionsSum._sum.agentCommission || 0);
    const totalPlatformFees = Number(platformFeesSum._sum.platformFee || 0);

    const statusMap = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<PaymentStatus, number>
    );

    const paymentTypeMap = paymentTypeCounts.reduce(
      (acc, item) => {
        acc[item.paymentType] = Number(item._sum.amount || 0);
        return acc;
      },
      {} as Record<PaymentType, number>
    );

    return {
      totalTransactions,
      totalAmount,
      successfulTransactions: statusMap.SUCCESS || 0,
      failedTransactions: statusMap.FAILED || 0,
      pendingTransactions: statusMap.PENDING || 0,
      refundedTransactions: statusMap.REFUNDED || 0,
      averageTransactionAmount: totalTransactions > 0 ? totalAmount / totalTransactions : 0,
      totalRentPayments: paymentTypeMap.RENT || 0,
      totalMarkingPayments: paymentTypeMap.PROPERTY_MARKING || 0,
      totalCommissions,
      totalPlatformFees,
    };
  }

  /**
   * Get transaction details by ID
   */
  async getTransactionById(paymentId: string) {
    const transaction = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        rental: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
                state: true,
              },
            },
            unit: {
              select: {
                id: true,
                unitNumber: true,
              },
            },
            renter: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    return transaction;
  }

  /**
   * Get payment attempts log for a property
   */
  async getPaymentAttempts(propertyId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      prisma.paymentAttemptLog.findMany({
        where: { propertyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.paymentAttemptLog.count({ where: { propertyId } }),
    ]);

    return {
      attempts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Monitor suspicious payment activities
   */
  async getSuspiciousActivities(threshold: number = 3) {
    // Find users with multiple failed payment attempts
    const suspiciousUsers = await prisma.paymentAttemptLog.groupBy({
      by: ['userId'],
      where: {
        status: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      _count: true,
      having: {
        userId: {
          _count: {
            gte: threshold,
          },
        },
      },
    });

    // Get detailed information for suspicious users
    const suspiciousActivities = await Promise.all(
      suspiciousUsers.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        });

        const recentAttempts = await prisma.paymentAttemptLog.findMany({
          where: {
            userId: item.userId,
            status: 'FAILED',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        return {
          user,
          failedAttempts: item._count,
          recentAttempts,
        };
      })
    );

    return suspiciousActivities;
  }

  /**
   * Get revenue breakdown
   */
  async getRevenueBreakdown(startDate?: Date, endDate?: Date) {
    const where: Prisma.PaymentWhereInput = {
      status: PaymentStatus.SUCCESS,
      ...(startDate || endDate
        ? {
            paidAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    const [revenueByType, revenueByMonth, commissionData] = await Promise.all([
      // Revenue by payment type
      prisma.payment.groupBy({
        by: ['paymentType'],
        where,
        _sum: {
          amount: true,
          platformFee: true,
        },
        _count: true,
      }),
      // Revenue by month
      prisma.$queryRaw<Array<{ month: string; total: number; count: number }>>`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "paidAt"), 'YYYY-MM') as month,
          SUM("amount")::DECIMAL as total,
          COUNT(*)::INTEGER as count
        FROM "Payment"
        WHERE "status" = ${PaymentStatus.SUCCESS}
          ${startDate ? Prisma.sql`AND "paidAt" >= ${startDate}` : Prisma.empty}
          ${endDate ? Prisma.sql`AND "paidAt" <= ${endDate}` : Prisma.empty}
        GROUP BY DATE_TRUNC('month', "paidAt")
        ORDER BY month DESC
      `,
      // Commission data
      prisma.payment.aggregate({
        where: {
          ...where,
          agentCommission: { not: null },
        },
        _sum: {
          agentCommission: true,
          platformFee: true,
          ownerAmount: true,
        },
      }),
    ]);

    return {
      byPaymentType: revenueByType.map((item) => ({
        type: item.paymentType,
        total: Number(item._sum.amount || 0),
        platformFee: Number(item._sum.platformFee || 0),
        count: item._count,
      })),
      byMonth: revenueByMonth.map((item) => ({
        month: item.month,
        total: Number(item.total),
        count: item.count,
      })),
      commissions: {
        totalAgentCommissions: Number(commissionData._sum.agentCommission || 0),
        totalPlatformFees: Number(commissionData._sum.platformFee || 0),
        totalOwnerPayments: Number(commissionData._sum.ownerAmount || 0),
      },
    };
  }

  /**
   * Get pending confirmations (payments awaiting renter confirmation)
   */
  async getPendingConfirmations(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      status: PaymentStatus.HELD,
      confirmationPeriodEnd: { not: null },
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          rental: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                },
              },
              renter: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { confirmationPeriodEnd: 'asc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get overdue confirmations
   */
  async getOverdueConfirmations() {
    return prisma.payment.findMany({
      where: {
        status: PaymentStatus.HELD,
        confirmationPeriodEnd: {
          lt: new Date(),
        },
        isReleased: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        rental: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Manually release payment (admin override)
   */
  async releasePayment(paymentId: string, adminId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { rental: true },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status !== PaymentStatus.HELD) {
      throw new AppError('Only held payments can be released', 400);
    }

    if (payment.isReleased) {
      throw new AppError('Payment already released', 400);
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.RELEASED,
        isReleased: true,
        releasedAt: new Date(),
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: 'PAYMENT_REFUNDED', // Reusing existing enum, ideally add PAYMENT_RELEASED
        targetType: 'Payment',
        targetId: paymentId,
        description: `Admin manually released payment ${paymentId}`,
        metadata: {
          paymentAmount: Number(payment.amount),
          rentalId: payment.rentalId,
        },
      },
    });

    return updatedPayment;
  }

  /**
   * Process refund (admin action)
   */
  async processRefund(paymentId: string, adminId: string, reason: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new AppError('Payment already refunded', 400);
    }

    if (payment.status !== PaymentStatus.SUCCESS && payment.status !== PaymentStatus.HELD) {
      throw new AppError('Only successful or held payments can be refunded', 400);
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        failureReason: reason,
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: 'PAYMENT_REFUNDED',
        targetType: 'Payment',
        targetId: paymentId,
        description: `Admin processed refund for payment ${paymentId}`,
        metadata: {
          reason,
          paymentAmount: Number(payment.amount),
          originalStatus: payment.status,
        },
      },
    });

    return updatedPayment;
  }

  /**
   * Get transaction timeline for audit
   */
  async getTransactionTimeline(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        rental: {
          include: {
            property: true,
            renter: true,
          },
        },
      },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Get related admin actions
    const adminActions = await prisma.adminAction.findMany({
      where: {
        targetType: 'Payment',
        targetId: paymentId,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Build timeline
    const timeline = [
      {
        event: 'Payment Initiated',
        timestamp: payment.createdAt,
        actor: payment.userId,
        details: { amount: Number(payment.amount), type: payment.paymentType },
      },
      ...(payment.paidAt
        ? [
            {
              event: 'Payment Completed',
              timestamp: payment.paidAt,
              actor: payment.userId,
              details: { transactionId: payment.transactionId },
            },
          ]
        : []),
      ...(payment.confirmationPeriodEnd
        ? [
            {
              event: 'Confirmation Period Started',
              timestamp: payment.createdAt,
              details: { deadline: payment.confirmationPeriodEnd },
            },
          ]
        : []),
      ...(payment.releasedAt
        ? [
            {
              event: 'Payment Released',
              timestamp: payment.releasedAt,
              details: { status: payment.status },
            },
          ]
        : []),
      ...adminActions.map((action) => ({
        event: action.action,
        timestamp: action.createdAt,
        actor: action.admin.name,
        details: action.metadata,
      })),
    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      payment,
      timeline,
    };
  }
}

export const transactionService = new TransactionService();