import { PrismaClient, PaymentStatus, AdminActionType } from '@prisma/client';
import { addHours, isPast, formatDistanceToNow } from 'date-fns';

const prisma = new PrismaClient();

interface ConfirmationFilters {
  status?: 'PENDING' | 'CONFIRMED' | 'DISPUTED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface ConfirmationStats {
  total: number;
  pendingConfirmation: number;
  confirmed: number;
  disputed: number;
  expiringSoon: number; // Within 24 hours
  averageConfirmationTime: number; // In hours
  totalValueHeld: number;
}

interface PaymentTimeline {
  paymentId: string;
  events: TimelineEvent[];
}

interface TimelineEvent {
  timestamp: Date;
  type: string;
  description: string;
  actor?: string;
  metadata?: any;
}

export class ConfirmationOversightService {
  /**
   * Get all confirmations with filters
   */
  async getAllConfirmations(filters: ConfirmationFilters, adminId: string) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      paymentType: 'RENT',
      confirmationPeriodEnd: { not: null },
    };

    // Filter by status
    if (filters.status === 'PENDING') {
      where.status = PaymentStatus.HELD;
      where.isReleased = false;
      where.confirmationPeriodEnd = { gte: new Date() };
    } else if (filters.status === 'CONFIRMED') {
      where.status = PaymentStatus.RELEASED;
      where.isReleased = true;
    } else if (filters.status === 'DISPUTED') {
      // Need to check if there's a related dispute
      where.status = PaymentStatus.HELD;
    } else if (filters.status === 'CANCELLED') {
      where.status = { in: [PaymentStatus.REFUNDED, PaymentStatus.CANCELLED] };
    }

    // Date range filters
    if (filters.startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
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

    // Enhance with time remaining
    const enhancedConfirmations = confirmations.map((payment) => ({
      ...payment,
      timeRemaining: payment.confirmationPeriodEnd
        ? formatDistanceToNow(payment.confirmationPeriodEnd, { addSuffix: true })
        : null,
      isExpiringSoon:
        payment.confirmationPeriodEnd &&
        !payment.isReleased &&
        isPast(addHours(payment.confirmationPeriodEnd, -24)),
    }));

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

  /**
   * Get confirmation statistics
   */
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
      // Total confirmations
      prisma.payment.count({
        where: {
          paymentType: 'RENT',
          confirmationPeriodEnd: { not: null },
        },
      }),
      // Pending confirmation
      prisma.payment.count({
        where: {
          status: PaymentStatus.HELD,
          isReleased: false,
          confirmationPeriodEnd: { gte: now },
        },
      }),
      // Confirmed
      prisma.payment.count({
        where: {
          status: PaymentStatus.RELEASED,
          isReleased: true,
        },
      }),
      // Disputed (approximation - would need a disputes table)
      prisma.payment.count({
        where: {
          status: PaymentStatus.HELD,
          confirmationPeriodEnd: { lt: now },
          isReleased: false,
        },
      }),
      // Expiring soon
      prisma.payment.count({
        where: {
          status: PaymentStatus.HELD,
          isReleased: false,
          confirmationPeriodEnd: {
            gte: now,
            lte: twentyFourHoursFromNow,
          },
        },
      }),
      // Total value held
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.HELD,
          isReleased: false,
        },
        _sum: { amount: true },
      }),
      // Calculate average confirmation time
      prisma.payment.findMany({
        where: {
          status: PaymentStatus.RELEASED,
          isReleased: true,
          releasedAt: { not: null },
        },
        select: {
          createdAt: true,
          releasedAt: true,
        },
        take: 100, // Sample last 100
      }),
    ]);

    // Calculate average confirmation time
    let averageConfirmationTime = 0;
    if (confirmedPayments.length > 0) {
      const totalHours = confirmedPayments.reduce((sum, payment) => {
        if (payment.releasedAt) {
          const hours =
            (payment.releasedAt.getTime() - payment.createdAt.getTime()) / (1000 * 60 * 60);
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

  /**
   * Get detailed confirmation information
   */
  async getConfirmationDetails(paymentId: string, adminId: string) {
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
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
                agent: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
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
      orderBy: { createdAt: 'desc' },
    });

    // Calculate commission breakdown
    const commissionBreakdown = this.calculateCommissionBreakdown(payment);

    return {
      payment,
      commissionBreakdown,
      adminActions,
      timeRemaining: payment.confirmationPeriodEnd
        ? formatDistanceToNow(payment.confirmationPeriodEnd, { addSuffix: true })
        : null,
      canBeReleased: payment.status === PaymentStatus.HELD && !payment.isReleased,
      canBeRefunded:
        payment.status === PaymentStatus.HELD ||
        (payment.status === PaymentStatus.RELEASED && payment.releasedAt &&
          isPast(addHours(payment.releasedAt, -24))), // Within 24h of release
    };
  }

  /**
   * Force release payment (admin override)
   */
  async forceReleasePayment(
    paymentId: string,
    adminId: string,
    reason: string,
    notifyParties: boolean
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        rental: {
          include: {
            property: {
              include: {
                owner: true,
                agent: true,
              },
            },
          },
        },
        user: true,
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.isReleased) {
      throw new Error('Payment already released');
    }

    if (payment.status !== PaymentStatus.HELD) {
      throw new Error('Payment not in HELD status');
    }

    // Update payment status
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
        action: AdminActionType.PAYMENT_REFUNDED, // Could add PAYMENT_RELEASED
        targetType: 'Payment',
        targetId: paymentId,
        description: `Force released payment. Reason: ${reason}`,
        metadata: {
          reason,
          originalConfirmationDeadline: payment.confirmationPeriodEnd,
        },
      },
    });

    // Distribute commission (would call commission service)
    // await this.distributeCommission(payment);

    // Send notifications if requested
    if (notifyParties) {
      // await this.notifyPaymentRelease(payment);
    }

    return updatedPayment;
  }

  /**
   * Extend confirmation period
   */
  async extendConfirmationPeriod(
    paymentId: string,
    adminId: string,
    extensionHours: number,
    reason: string
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.isReleased) {
      throw new Error('Cannot extend period for released payment');
    }

    if (!payment.confirmationPeriodEnd) {
      throw new Error('Payment has no confirmation period');
    }

    const newDeadline = addHours(payment.confirmationPeriodEnd, extensionHours);

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        confirmationPeriodEnd: newDeadline,
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: AdminActionType.PAYMENT_REFUNDED, // Could add CONFIRMATION_EXTENDED
        targetType: 'Payment',
        targetId: paymentId,
        description: `Extended confirmation period by ${extensionHours} hours. Reason: ${reason}`,
        metadata: {
          reason,
          extensionHours,
          oldDeadline: payment.confirmationPeriodEnd,
          newDeadline,
        },
      },
    });

    return updatedPayment;
  }

  /**
   * Cancel payment and process refund
   */
  async cancelPayment(
    paymentId: string,
    adminId: string,
    reason: string,
    refundAmount?: number
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        rental: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new Error('Payment already refunded');
    }

    const amountToRefund = refundAmount || Number(payment.amount);

    // Process refund through Flutterwave
    // const refundResult = await flutterwaveService.processRefund({
    //   transactionId: payment.transactionId,
    //   amount: amountToRefund,
    // });

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        failureReason: reason,
      },
    });

    // Update rental status if exists
    if (payment.rentalId) {
      await prisma.rental.update({
        where: { id: payment.rentalId },
        data: {
          status: 'TERMINATED',
        },
      });
    }

    // Log admin action
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

  /**
   * Get payment timeline
   */
  async getPaymentTimeline(paymentId: string): Promise<PaymentTimeline> {
    const [payment, adminActions, eventLogs] = await Promise.all([
      prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          user: { select: { name: true } },
        },
      }),
      prisma.adminAction.findMany({
        where: {
          targetType: 'Payment',
          targetId: paymentId,
        },
        include: {
          admin: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.eventLog.findMany({
        where: {
          type: { in: ['PAYMENT_INITIATED', 'PAYMENT_SUCCESS', 'PAYMENT_CONFIRMED'] },
          metadata: {
            path: ['paymentId'],
            equals: paymentId,
          },
        },
        orderBy: { timestamp: 'asc' },
      }),
    ]);

    if (!payment) {
      throw new Error('Payment not found');
    }

    const events: TimelineEvent[] = [];

    // Payment created
    events.push({
      timestamp: payment.createdAt,
      type: 'PAYMENT_CREATED',
      description: 'Payment initiated',
      actor: payment.user.name || 'User',
    });

    // Payment successful
    if (payment.paidAt) {
      events.push({
        timestamp: payment.paidAt,
        type: 'PAYMENT_SUCCESS',
        description: 'Payment successful - Funds held',
      });
    }

    // Add event logs
    eventLogs.forEach((log) => {
      events.push({
        timestamp: log.timestamp,
        type: log.type,
        description: log.type.replace(/_/g, ' ').toLowerCase(),
        metadata: log.metadata,
      });
    });

    // Add admin actions
    adminActions.forEach((action) => {
      events.push({
        timestamp: action.createdAt,
        type: action.action,
        description: action.description || action.action,
        actor: action.admin.name || 'Admin',
        metadata: action.metadata,
      });
    });

    // Payment released
    if (payment.releasedAt) {
      events.push({
        timestamp: payment.releasedAt,
        type: 'PAYMENT_RELEASED',
        description: 'Funds released to parties',
      });
    }

    // Sort events by timestamp
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      paymentId,
      events,
    };
  }

  /**
   * Calculate commission breakdown
   */
  private calculateCommissionBreakdown(payment: any) {
    const totalAmount = Number(payment.amount);
    const platformFee = Number(payment.platformFee || 0);
    const agentCommission = Number(payment.agentCommission || 0);
    const ownerAmount = Number(payment.ownerAmount || 0);

    return {
      totalAmount,
      platformFee,
      platformFeePercentage: ((platformFee / totalAmount) * 100).toFixed(2),
      agentCommission,
      agentCommissionPercentage: agentCommission > 0 ? ((agentCommission / totalAmount) * 100).toFixed(2) : '0',
      ownerAmount,
      ownerAmountPercentage: ((ownerAmount / totalAmount) * 100).toFixed(2),
    };
  }
}

export const confirmationOversightService = new ConfirmationOversightService();