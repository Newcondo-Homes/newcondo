import { prisma, PaymentStatus, AdminActionType, Prisma } from '@newcondo/db';
import { Decimal, JsonValue } from '@newcondo/db';
import { addHours, isPast, formatDistanceToNow } from 'date-fns';

import {
  ConfirmationFilters,
  ConfirmationStats,
  PaymentTimeline,
  TimelineEvent,
  CommissionBreakdown,
  EnhancedConfirmation,
  ConfirmationsResult,
  ConfirmationDetails,
  UpdatedPayment,
  ForceReleaseParams,
  ExtendDeadlineParams,
  BulkActionParams,
  BulkActionResult
} from '../types'


export class ConfirmationOversightService {
  async getConfirmations(
    filters: ConfirmationFilters,
  ): Promise<ConfirmationsResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const sortField =
      filters.sortBy === 'confirmationDeadline'
        ? 'confirmationPeriodEnd'
        : filters.sortBy === 'amount'
          ? 'amount'
          : 'createdAt';

    const orderBy: Prisma.PaymentOrderByWithRelationInput = {
      [sortField]: filters.sortOrder || 'asc',
    };

    const where: Prisma.PaymentWhereInput = {
      paymentType: 'RENT',
      confirmationPeriodEnd: { not: null },
    };

    const now = new Date();

    if (filters.status === 'PENDING') {
      where.status = PaymentStatus.HELD;
      where.isReleased = false;
      where.confirmationPeriodEnd = { gte: now };
    } else if (filters.status === 'CONFIRMED') {
      where.status = PaymentStatus.RELEASED;
      where.isReleased = true;
    } else if (filters.status === 'DISPUTED') {
      where.status = PaymentStatus.HELD;
    } else if (filters.status === 'EXPIRED') {
      where.status = PaymentStatus.HELD;
      where.isReleased = false;
      where.confirmationPeriodEnd = { lt: now };
    } else if (filters.status === 'CANCELLED') {
      where.status = { in: [PaymentStatus.REFUNDED, PaymentStatus.CANCELLED] };
    }

    if (filters.startDate) {
      where.createdAt = { gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.createdAt = {
        ...(where.createdAt as object),
        lte: new Date(filters.endDate),
      };
    }

    if (filters.search) {
      where.OR = [
        { flutterwaveRef: { contains: filters.search, mode: 'insensitive' } },
        { transactionId: { contains: filters.search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { email: { contains: filters.search, mode: 'insensitive' } },
              { name: { contains: filters.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [confirmations, total] = await Promise.all([
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
                  city: true,
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
        orderBy: { confirmationPeriodEnd: 'asc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    const enhancedConfirmations: EnhancedConfirmation[] = confirmations.map(
      (payment) => ({
        ...payment,
        timeRemaining: payment.confirmationPeriodEnd
          ? formatDistanceToNow(payment.confirmationPeriodEnd, { addSuffix: true })
          : null,
        isExpiringSoon:
          payment.confirmationPeriodEnd && !payment.isReleased
            ? isPast(addHours(payment.confirmationPeriodEnd, -24))
            : null,
      })
    );

    return {
      confirmations: enhancedConfirmations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getConfirmationStats(): Promise<ConfirmationStats> {
    const now = new Date();
    const twentyFourHoursFromNow = addHours(now, 24);

    const [
      total,
      pending,
      confirmed,
      disputed,
      expiringSoon,
      totalHeldPayments,
      confirmedPayments,
    ] = await Promise.all([
      prisma.payment.count({
        where: { paymentType: 'RENT', confirmationPeriodEnd: { not: null } },
      }),
      prisma.payment.count({
        where: {
          status: PaymentStatus.HELD,
          isReleased: false,
          confirmationPeriodEnd: { gte: now },
        },
      }),
      prisma.payment.count({
        where: { status: PaymentStatus.RELEASED, isReleased: true },
      }),
      prisma.payment.count({
        where: {
          status: PaymentStatus.HELD,
          confirmationPeriodEnd: { lt: now },
          isReleased: false,
        },
      }),
      prisma.payment.count({
        where: {
          status: PaymentStatus.HELD,
          isReleased: false,
          confirmationPeriodEnd: { gte: now, lte: twentyFourHoursFromNow },
        },
      }),
      prisma.payment.aggregate({
        where: { status: PaymentStatus.HELD, isReleased: false },
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
        where: {
          status: PaymentStatus.RELEASED,
          isReleased: true,
          releasedAt: { not: null },
        },
        select: { createdAt: true, releasedAt: true },
        take: 100,
      }),
    ]);

    let averageConfirmationTime = 0;
    if (confirmedPayments.length > 0) {
      const totalHours = confirmedPayments.reduce((sum, payment) => {
        if (payment.releasedAt) {
          const hours =
            (payment.releasedAt.getTime() - payment.createdAt.getTime()) /
            (1000 * 60 * 60);
          return sum + hours;
        }
        return sum;
      }, 0);
      averageConfirmationTime = totalHours / confirmedPayments.length;
    }

    return {
      total,
      pendingConfirmation: pending,
      confirmed,
      disputed,
      expiringSoon,
      averageConfirmationTime: Math.round(averageConfirmationTime * 10) / 10,
      totalValueHeld: Number(totalHeldPayments._sum.amount || 0),
    };
  }

  async getConfirmationDetails(
    paymentId: string,
    adminId: string
  ): Promise<ConfirmationDetails> {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('Unauthorized: Admin access required');
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            verificationStatus: true,
          },
        },
        rental: {
          include: {
            property: {
              include: {
                owner: {
                  select: { id: true, name: true, email: true, phone: true },
                },
                agent: {
                  select: { id: true, name: true, email: true, phone: true },
                },
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            unit: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const adminActions = await prisma.adminAction.findMany({
      where: { targetType: 'Payment', targetId: paymentId },
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const commissionBreakdown = this.calculateCommissionBreakdown(payment);

    return {
      payment,
      commissionBreakdown,
      adminActions,
      timeRemaining: payment.confirmationPeriodEnd
        ? formatDistanceToNow(payment.confirmationPeriodEnd, { addSuffix: true })
        : null,
      canBeReleased:
        payment.status === PaymentStatus.HELD && !payment.isReleased,
      canBeRefunded:
        payment.status === PaymentStatus.HELD ||
        (payment.status === PaymentStatus.RELEASED &&
          payment.releasedAt != null &&
          isPast(addHours(payment.releasedAt, -24))),
    };
  }

  async forceReleasePayment({
    paymentId,
    adminId,
    reason,
    notifyParties,
  }: ForceReleaseParams): Promise<UpdatedPayment> {
    // Verify admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('Unauthorized: Admin access required');
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        rental: {
          include: {
            property: { include: { owner: true, agent: true } },
          },
        },
        user: true,
      },
    });

    if (!payment) throw new Error('Payment not found');
    if (payment.isReleased) throw new Error('Payment already released');
    if (payment.status !== PaymentStatus.HELD)
      throw new Error('Payment not in HELD status');

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.RELEASED,
        isReleased: true,
        releasedAt: new Date(),
      },
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        action: AdminActionType.PAYMENT_REFUNDED,
        targetType: 'Payment',
        targetId: paymentId,
        description: `Force released payment. Reason: ${reason}`,
        metadata: {
          reason,
          originalConfirmationDeadline: payment.confirmationPeriodEnd,
        },
      },
    });

    if (notifyParties) {
      //TODO: send notifications for payment release
      // await this.notifyPaymentRelease(payment);
    }

    return updatedPayment;
  }

  async extendConfirmationDeadline({
    paymentId,
    adminId,
    extensionDays,
    reason,
  }: ExtendDeadlineParams): Promise<UpdatedPayment> {
    // Verify admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('Unauthorized: Admin access required');
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new Error('Payment not found');
    if (payment.isReleased)
      throw new Error('Cannot extend period for released payment');
    if (!payment.confirmationPeriodEnd)
      throw new Error('Payment has no confirmation period');

    const newDeadline = addHours(payment.confirmationPeriodEnd, extensionDays);

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: { confirmationPeriodEnd: newDeadline },
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        action: AdminActionType.PAYMENT_REFUNDED,
        targetType: 'Payment',
        targetId: paymentId,
        description: `Extended confirmation period by ${extensionDays} hours. Reason: ${reason}`,
        metadata: {
          reason,
          extensionDays,
          oldDeadline: payment.confirmationPeriodEnd,
          newDeadline,
        },
      },
    });

    return updatedPayment;
  }

  async getExpiredConfirmations(): Promise<ConfirmationsResult> {
    return this.getConfirmations({ status: 'EXPIRED', sortBy: 'confirmationDeadline', sortOrder: 'asc' });
  }

  async bulkAction({
    paymentIds,
    action,
    adminId,
    reason,
    extensionDays,
  }: BulkActionParams): Promise<BulkActionResult> {
    // Verify admin once upfront
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('Unauthorized: Admin access required');
    }

    const succeeded: string[] = [];
    const failed: { paymentId: string; reason: string }[] = [];

    await Promise.all(
      paymentIds.map(async (paymentId) => {
        try {
          if (action === 'RELEASE') {
            await this.forceReleasePayment({
              paymentId,
              adminId,
              reason,
              notifyParties: true,
            });
          } else if (action === 'EXTEND') {
            if (!extensionDays) {
              throw new Error('extensionDays required for EXTEND action');
            }
            await this.extendConfirmationDeadline({
              paymentId,
              adminId,
              extensionDays,
              reason,
            });
          } else if (action === 'CANCEL') {
            await this.cancelPayment({ paymentId, adminId, reason });
          }
          succeeded.push(paymentId);
        } catch (error) {
          failed.push({
            paymentId,
            reason: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })
    );

    return {
      succeeded,
      failed,
      total: paymentIds.length,
      successCount: succeeded.length,
      failureCount: failed.length,
    };
  }

  async cancelPayment({
    paymentId,
    adminId,
    reason,
    refundAmount,
  }: {
    paymentId: string;
    adminId: string;
    reason: string;
    refundAmount?: number;
  }): Promise<UpdatedPayment> {
    // Verify admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('Unauthorized: Admin access required');
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        rental: { include: { property: true } },
      },
    });

    if (!payment) throw new Error('Payment not found');
    if (payment.status === PaymentStatus.REFUNDED)
      throw new Error('Payment already refunded');

    const amountToRefund = refundAmount || Number(payment.amount);

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        failureReason: reason,
      },
    });

    if (payment.rentalId) {
      await prisma.rental.update({
        where: { id: payment.rentalId },
        data: { status: 'TERMINATED' },
      });
    }

    await prisma.adminAction.create({
      data: {
        adminId,
        action: AdminActionType.PAYMENT_REFUNDED,
        targetType: 'Payment',
        targetId: paymentId,
        description: `Cancelled payment and processed refund. Reason: ${reason}`,
        metadata: {
          reason,
          refundAmount: amountToRefund,
          originalAmount: Number(payment.amount),
        },
      },
    });

    return updatedPayment;
  }

  async getConfirmationTimeline(paymentId: string): Promise<PaymentTimeline> {
    const [payment, adminActions, eventLogs] = await Promise.all([
      prisma.payment.findUnique({
        where: { id: paymentId },
        include: { user: { select: { name: true } } },
      }),
      prisma.adminAction.findMany({
        where: { targetType: 'Payment', targetId: paymentId },
        include: { admin: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.eventLog.findMany({
        where: {
          type: {
            in: ['PAYMENT_INITIATED', 'PAYMENT_SUCCESS', 'PAYMENT_CONFIRMED'],
          },
          metadata: { path: ['paymentId'], equals: paymentId },
        },
        orderBy: { timestamp: 'asc' },
      }),
    ]);

    if (!payment) throw new Error('Payment not found');

    const events: TimelineEvent[] = [];

    events.push({
      timestamp: payment.createdAt,
      type: 'PAYMENT_CREATED',
      description: 'Payment initiated',
      actor: payment.user.name || 'User',
    });

    if (payment.paidAt) {
      events.push({
        timestamp: payment.paidAt,
        type: 'PAYMENT_SUCCESS',
        description: 'Payment successful - Funds held',
      });
    }

    eventLogs.forEach((log) => {
      events.push({
        timestamp: log.timestamp,
        type: log.type,
        description: log.type.replace(/_/g, ' ').toLowerCase(),
        metadata: log.metadata,
      });
    });

    adminActions.forEach((action) => {
      events.push({
        timestamp: action.createdAt,
        type: action.action,
        description: action.description || action.action,
        actor: action.admin.name || 'Admin',
        metadata: action.metadata,
      });
    });

    if (payment.releasedAt) {
      events.push({
        timestamp: payment.releasedAt,
        type: 'PAYMENT_RELEASED',
        description: 'Funds released to parties',
      });
    }

    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return { paymentId, events };
  }

  async getPaymentTimeline(paymentId: string): Promise<PaymentTimeline> {
    const [payment, adminActions, eventLogs] = await Promise.all([
      prisma.payment.findUnique({
        where: { id: paymentId },
        include: { user: { select: { name: true } } },
      }),
      prisma.adminAction.findMany({
        where: { targetType: 'Payment', targetId: paymentId },
        include: { admin: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.eventLog.findMany({
        where: {
          type: {
            in: ['PAYMENT_INITIATED', 'PAYMENT_SUCCESS', 'PAYMENT_CONFIRMED'],
          },
          metadata: { path: ['paymentId'], equals: paymentId },
        },
        orderBy: { timestamp: 'asc' },
      }),
    ]);

    if (!payment) throw new Error('Payment not found');

    const events: TimelineEvent[] = [];

    events.push({
      timestamp: payment.createdAt,
      type: 'PAYMENT_CREATED',
      description: 'Payment initiated',
      actor: payment.user.name || 'User',
    });

    if (payment.paidAt) {
      events.push({
        timestamp: payment.paidAt,
        type: 'PAYMENT_SUCCESS',
        description: 'Payment successful - Funds held',
      });
    }

    eventLogs.forEach((log) => {
      events.push({
        timestamp: log.timestamp,
        type: log.type,
        description: log.type.replace(/_/g, ' ').toLowerCase(),
        metadata: log.metadata,
      });
    });

    adminActions.forEach((action) => {
      events.push({
        timestamp: action.createdAt,
        type: action.action,
        description: action.description || action.action,
        actor: action.admin.name || 'Admin',
        metadata: action.metadata,
      });
    });

    if (payment.releasedAt) {
      events.push({
        timestamp: payment.releasedAt,
        type: 'PAYMENT_RELEASED',
        description: 'Funds released to parties',
      });
    }

    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return { paymentId, events };
  }

  private calculateCommissionBreakdown(payment: {
    amount: Decimal;
    platformFee: Decimal | null;
    agentCommission: Decimal | null;
    ownerAmount: Decimal | null;
  }): CommissionBreakdown {
    const totalAmount = Number(payment.amount);
    const platformFee = Number(payment.platformFee || 0);
    const agentCommission = Number(payment.agentCommission || 0);
    const ownerAmount = Number(payment.ownerAmount || 0);

    return {
      totalAmount,
      platformFee,
      platformFeePercentage: ((platformFee / totalAmount) * 100).toFixed(2),
      agentCommission,
      agentCommissionPercentage:
        agentCommission > 0
          ? ((agentCommission / totalAmount) * 100).toFixed(2)
          : '0',
      ownerAmount,
      ownerAmountPercentage: ((ownerAmount / totalAmount) * 100).toFixed(2),
    };
  }
}

export const confirmationOversightService = new ConfirmationOversightService();