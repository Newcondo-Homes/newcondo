// backend/payment-service/src/services/earningsService.ts

import { PrismaClient, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface EarningsSummaryFilters {
  startDate?: Date;
  endDate?: Date;
}

interface CommissionHistoryFilters {
  page: number;
  limit: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

interface EarningsFilters {
  page: number;
  limit: number;
}

export class EarningsService {
  /**
   * Get commission dashboard
   */
  async getCommissionDashboard(userId: string) {
    const [
      totalEarnings,
      pendingEarnings,
      releasedEarnings,
      totalTransactions,
      recentEarnings,
    ] = await Promise.all([
      this.calculateTotalEarnings(userId),
      this.calculatePendingEarnings(userId),
      this.calculateReleasedEarnings(userId),
      this.countTotalTransactions(userId),
      this.getRecentEarnings(userId, 5),
    ]);

    // Get virtual account balance
    const virtualAccount = await prisma.virtualAccount.findFirst({
      where: { userId },
    });

    return {
      summary: {
        totalEarnings: totalEarnings.toFixed(2),
        pendingEarnings: pendingEarnings.toFixed(2),
        releasedEarnings: releasedEarnings.toFixed(2),
        availableBalance: virtualAccount?.balance.toString() || '0',
        totalTransactions,
      },
      recentEarnings,
    };
  }

  /**
   * Calculate total earnings
   */
  private async calculateTotalEarnings(userId: string): Promise<number> {
    // Get earnings as listing agent
    const listingAgentEarnings = await prisma.payment.aggregate({
      where: {
        rental: {
          property: { agentId: userId },
        },
        status: PaymentStatus.SUCCESS,
        agentCommission: { not: null },
      },
      _sum: {
        agentCommission: true,
      },
    });

    // Get earnings as sub-agent
    const subAgentEarnings = await prisma.referralConversion.aggregate({
      where: {
        referral: { agentId: userId },
      },
      _sum: {
        commission: true,
      },
    });

    // Get earnings from marking jobs
    const markingEarnings = await prisma.payment.aggregate({
      where: {
        userId,
        paymentType: 'PROPERTY_MARKING',
        status: PaymentStatus.SUCCESS,
      },
      _sum: {
        amount: true,
      },
    });

    const total =
      Number(listingAgentEarnings._sum.agentCommission || 0) +
      Number(subAgentEarnings._sum.commission || 0) +
      Number(markingEarnings._sum.amount || 0) * 0.25; // 25% of marking fee

    return total;
  }

  /**
   * Calculate pending earnings (in confirmation period)
   */
  private async calculatePendingEarnings(userId: string): Promise<number> {
    const now = new Date();

    // Pending as listing agent
    const listingAgentPending = await prisma.payment.aggregate({
      where: {
        rental: {
          property: { agentId: userId },
        },
        status: PaymentStatus.SUCCESS,
        isReleased: false,
        confirmationPeriodEnd: { gt: now },
        agentCommission: { not: null },
      },
      _sum: {
        agentCommission: true,
      },
    });

    // Pending as sub-agent
    const subAgentPending = await prisma.referralConversion.aggregate({
      where: {
        referral: { agentId: userId },
        isPaid: false,
        payment: {
          status: PaymentStatus.SUCCESS,
          isReleased: false,
          confirmationPeriodEnd: { gt: now },
        },
      },
      _sum: {
        commission: true,
      },
    });

    return Number(listingAgentPending._sum.agentCommission || 0) + Number(subAgentPending._sum.commission || 0);
  }

  /**
   * Calculate released earnings
   */
  private async calculateReleasedEarnings(userId: string): Promise<number> {
    // Released as listing agent
    const listingAgentReleased = await prisma.payment.aggregate({
      where: {
        rental: {
          property: { agentId: userId },
        },
        status: PaymentStatus.SUCCESS,
        isReleased: true,
        agentCommission: { not: null },
      },
      _sum: {
        agentCommission: true,
      },
    });

    // Released as sub-agent
    const subAgentReleased = await prisma.referralConversion.aggregate({
      where: {
        referral: { agentId: userId },
        isPaid: true,
      },
      _sum: {
        commission: true,
      },
    });

    return Number(listingAgentReleased._sum.agentCommission || 0) + Number(subAgentReleased._sum.commission || 0);
  }

  /**
   * Count total transactions
   */
  private async countTotalTransactions(userId: string): Promise<number> {
    const [listingCount, subAgentCount] = await Promise.all([
      prisma.payment.count({
        where: {
          rental: {
            property: { agentId: userId },
          },
          status: PaymentStatus.SUCCESS,
        },
      }),
      prisma.referralConversion.count({
        where: {
          referral: { agentId: userId },
        },
      }),
    ]);

    return listingCount + subAgentCount;
  }

  /**
   * Get recent earnings
   */
  private async getRecentEarnings(userId: string, limit: number) {
    // Get recent payments as listing agent
    const listingAgentPayments = await prisma.payment.findMany({
      where: {
        rental: {
          property: { agentId: userId },
        },
        status: PaymentStatus.SUCCESS,
        agentCommission: { not: null },
      },
      take: limit,
      orderBy: { paidAt: 'desc' },
      include: {
        rental: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                images: {
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    });

    // Get recent conversions as sub-agent
    const subAgentConversions = await prisma.referralConversion.findMany({
      where: {
        referral: { agentId: userId },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        referral: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                images: {
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    });

    const combined = [
      ...listingAgentPayments.map(payment => ({
        id: payment.id,
        type: 'listing_agent' as const,
        propertyTitle: payment.rental!.property.title,
        propertyAddress: payment.rental!.property.address,
        propertyImage: payment.rental!.property.images[0]?.url || null,
        amount: Number(payment.amount),
        commission: Number(payment.agentCommission),
        status: payment.status,
        isReleased: payment.isReleased,
        date: payment.paidAt || payment.createdAt,
      })),
      ...subAgentConversions.map(conversion => ({
        id: conversion.id,
        type: 'sub_agent' as const,
        propertyTitle: conversion.referral.property.title,
        propertyAddress: conversion.referral.property.address,
        propertyImage: conversion.referral.property.images[0]?.url || null,
        amount: Number(conversion.amount),
        commission: Number(conversion.commission),
        status: 'SUCCESS',
        isReleased: conversion.isPaid,
        date: conversion.createdAt,
      })),
    ];

    return combined
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit)
      .map(item => ({
        ...item,
        date: item.date.toISOString(),
      }));
  }

  /**
   * Get earnings summary
   */
  async getEarningsSummary(userId: string, filters: EarningsSummaryFilters) {
    const { startDate, endDate } = filters;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;const where: any = {
      rental: {
        property: { agentId: userId },
      },
      status: PaymentStatus.SUCCESS,
    };

    if (Object.keys(dateFilter).length > 0) {
      where.paidAt = dateFilter;
    }

    const [listingAgentData, subAgentData, markingData] = await Promise.all([
      // Listing agent earnings
      prisma.payment.aggregate({
        where,
        _sum: {
          agentCommission: true,
          amount: true,
        },
        _count: true,
      }),
      // Sub-agent earnings
      prisma.referralConversion.aggregate({
        where: {
          referral: { agentId: userId },
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        _sum: {
          commission: true,
          amount: true,
        },
        _count: true,
      }),
      // Marking job earnings
      prisma.payment.aggregate({
        where: {
          userId,
          paymentType: 'PROPERTY_MARKING',
          status: PaymentStatus.SUCCESS,
          ...(Object.keys(dateFilter).length > 0 && { paidAt: dateFilter }),
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),
    ]);

    const listingAgentEarnings = Number(listingAgentData._sum.agentCommission || 0);
    const subAgentEarnings = Number(subAgentData._sum.commission || 0);
    const markingEarnings = Number(markingData._sum.amount || 0) * 0.25; // 25% of marking fee

    const totalEarnings = listingAgentEarnings + subAgentEarnings + markingEarnings;
    const totalTransactions = listingAgentData._count + subAgentData._count + markingData._count;

    return {
      totalEarnings: totalEarnings.toFixed(2),
      breakdown: {
        listingAgent: {
          earnings: listingAgentEarnings.toFixed(2),
          transactions: listingAgentData._count,
          totalRentCollected: Number(listingAgentData._sum.amount || 0).toFixed(2),
        },
        subAgent: {
          earnings: subAgentEarnings.toFixed(2),
          transactions: subAgentData._count,
          totalRentCollected: Number(subAgentData._sum.amount || 0).toFixed(2),
        },
        markingJobs: {
          earnings: markingEarnings.toFixed(2),
          jobs: markingData._count,
          totalFeesCollected: Number(markingData._sum.amount || 0).toFixed(2),
        },
      },
      totalTransactions,
      averageEarningPerTransaction: totalTransactions > 0 ? (totalEarnings / totalTransactions).toFixed(2) : '0',
    };
  }

  /**
   * Get commission history
   */
  async getCommissionHistory(userId: string, filters: CommissionHistoryFilters) {
    const { page, limit, status, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    // Get listing agent payments
    const listingWhere: any = {
      rental: {
        property: { agentId: userId },
      },
      agentCommission: { not: null },
    };

    if (status) listingWhere.status = status;
    if (Object.keys(dateFilter).length > 0) listingWhere.paidAt = dateFilter;

    const [listingPayments, listingTotal] = await Promise.all([
      prisma.payment.findMany({
        where: listingWhere,
        skip,
        take: limit,
        orderBy: { paidAt: 'desc' },
        include: {
          rental: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  city: true,
                  state: true,
                  images: {
                    take: 1,
                    select: { url: true },
                  },
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
      }),
      prisma.payment.count({ where: listingWhere }),
    ]);

    // Get sub-agent conversions
    const subAgentWhere: any = {
      referral: { agentId: userId },
    };

    if (Object.keys(dateFilter).length > 0) subAgentWhere.createdAt = dateFilter;

    const [subAgentConversions, subAgentTotal] = await Promise.all([
      prisma.referralConversion.findMany({
        where: subAgentWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          referral: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  city: true,
                  state: true,
                  images: {
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
              paidAt: true,
              rental: {
                select: {
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
          },
        },
      }),
      prisma.referralConversion.count({ where: subAgentWhere }),
    ]);

    const combined = [
      ...listingPayments.map(payment => ({
        id: payment.id,
        type: 'listing_agent' as const,
        property: {
          id: payment.rental!.property.id,
          title: payment.rental!.property.title,
          address: `${payment.rental!.property.address}, ${payment.rental!.property.city}, ${payment.rental!.property.state}`,
          image: payment.rental!.property.images[0]?.url || null,
        },
        renter: payment.rental!.renter,
        rentAmount: Number(payment.amount).toFixed(2),
        commission: Number(payment.agentCommission).toFixed(2),
        status: payment.status,
        isReleased: payment.isReleased,
        releasedAt: payment.releasedAt?.toISOString(),
        confirmationPeriodEnd: payment.confirmationPeriodEnd?.toISOString(),
        date: payment.paidAt || payment.createdAt,
        createdAt: payment.createdAt.toISOString(),
      })),
      ...subAgentConversions.map(conversion => ({
        id: conversion.id,
        type: 'sub_agent' as const,
        property: {
          id: conversion.referral.property.id,
          title: conversion.referral.property.title,
          address: `${conversion.referral.property.address}, ${conversion.referral.property.city}, ${conversion.referral.property.state}`,
          image: conversion.referral.property.images[0]?.url || null,
        },
        renter: conversion.payment.rental?.renter,
        rentAmount: Number(conversion.amount).toFixed(2),
        commission: Number(conversion.commission).toFixed(2),
        status: conversion.payment.status,
        isReleased: conversion.isPaid,
        releasedAt: conversion.paidAt?.toISOString(),
        confirmationPeriodEnd: null,
        date: conversion.payment.paidAt || conversion.createdAt,
        createdAt: conversion.createdAt.toISOString(),
      })),
    ];

    const sorted = combined.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);

    return {
      history: sorted.map(item => ({
        ...item,
        date: item.date.toISOString(),
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((listingTotal + subAgentTotal) / limit),
        totalItems: listingTotal + subAgentTotal,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get pending earnings
   */
  async getPendingEarnings(userId: string) {
    const now = new Date();

    // Get pending as listing agent
    const listingPayments = await prisma.payment.findMany({
      where: {
        rental: {
          property: { agentId: userId },
        },
        status: PaymentStatus.SUCCESS,
        isReleased: false,
        confirmationPeriodEnd: { gt: now },
        agentCommission: { not: null },
      },
      include: {
        rental: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                images: {
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    });

    // Get pending as sub-agent
    const subAgentConversions = await prisma.referralConversion.findMany({
      where: {
        referral: { agentId: userId },
        isPaid: false,
        payment: {
          status: PaymentStatus.SUCCESS,
          isReleased: false,
          confirmationPeriodEnd: { gt: now },
        },
      },
      include: {
        referral: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                images: {
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
        payment: {
          select: {
            confirmationPeriodEnd: true,
          },
        },
      },
    });

    const totalPending =
      listingPayments.reduce((sum, p) => sum + Number(p.agentCommission || 0), 0) +
      subAgentConversions.reduce((sum, c) => sum + Number(c.commission), 0);

    return {
      totalPending: totalPending.toFixed(2),
      items: [
        ...listingPayments.map(payment => ({
          id: payment.id,
          type: 'listing_agent' as const,
          property: {
            id: payment.rental!.property.id,
            title: payment.rental!.property.title,
            address: payment.rental!.property.address,
            image: payment.rental!.property.images[0]?.url || null,
          },
          commission: Number(payment.agentCommission).toFixed(2),
          confirmationPeriodEnd: payment.confirmationPeriodEnd?.toISOString(),
          paidAt: payment.paidAt?.toISOString(),
        })),
        ...subAgentConversions.map(conversion => ({
          id: conversion.id,
          type: 'sub_agent' as const,
          property: {
            id: conversion.referral.property.id,
            title: conversion.referral.property.title,
            address: conversion.referral.property.address,
            image: conversion.referral.property.images[0]?.url || null,
          },
          commission: Number(conversion.commission).toFixed(2),
          confirmationPeriodEnd: conversion.payment.confirmationPeriodEnd?.toISOString(),
          paidAt: conversion.createdAt.toISOString(),
        })),
      ],
    };
  }

  /**
   * Get released earnings
   */
  async getReleasedEarnings(userId: string, filters: EarningsFilters) {
    const { page, limit } = filters;
    const skip = (page - 1) * limit;

    // Get released as listing agent
    const [listingPayments, listingTotal] = await Promise.all([
      prisma.payment.findMany({
        where: {
          rental: {
            property: { agentId: userId },
          },
          status: PaymentStatus.SUCCESS,
          isReleased: true,
          agentCommission: { not: null },
        },
        skip,
        take: limit,
        orderBy: { releasedAt: 'desc' },
        include: {
          rental: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  images: {
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({
        where: {
          rental: {
            property: { agentId: userId },
          },
          status: PaymentStatus.SUCCESS,
          isReleased: true,
          agentCommission: { not: null },
        },
      }),
    ]);

    // Get released as sub-agent
    const [subAgentConversions, subAgentTotal] = await Promise.all([
      prisma.referralConversion.findMany({
        where: {
          referral: { agentId: userId },
          isPaid: true,
        },
        skip,
        take: limit,
        orderBy: { paidAt: 'desc' },
        include: {
          referral: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  images: {
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.referralConversion.count({
        where: {
          referral: { agentId: userId },
          isPaid: true,
        },
      }),
    ]);

    const combined = [
      ...listingPayments.map(payment => ({
        id: payment.id,
        type: 'listing_agent' as const,
        property: {
          id: payment.rental!.property.id,
          title: payment.rental!.property.title,
          address: payment.rental!.property.address,
          image: payment.rental!.property.images[0]?.url || null,
        },
        commission: Number(payment.agentCommission).toFixed(2),
        releasedAt: payment.releasedAt!,
      })),
      ...subAgentConversions.map(conversion => ({
        id: conversion.id,
        type: 'sub_agent' as const,
        property: {
          id: conversion.referral.property.id,
          title: conversion.referral.property.title,
          address: conversion.referral.property.address,
          image: conversion.referral.property.images[0]?.url || null,
        },
        commission: Number(conversion.commission).toFixed(2),
        releasedAt: conversion.paidAt!,
      })),
    ];

    const sorted = combined.sort((a, b) => b.releasedAt.getTime() - a.releasedAt.getTime()).slice(0, limit);

    const totalReleased = sorted.reduce((sum, item) => sum + Number(item.commission), 0);

    return {
      totalReleased: totalReleased.toFixed(2),
      earnings: sorted.map(item => ({
        ...item,
        releasedAt: item.releasedAt.toISOString(),
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((listingTotal + subAgentTotal) / limit),
        totalItems: listingTotal + subAgentTotal,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get earnings by property
   */
  async getEarningsByProperty(userId: string, filters: EarningsFilters) {
    const { page, limit } = filters;
    const skip = (page - 1) * limit;

    // Get properties where user is listing agent
    const properties = await prisma.property.findMany({
      where: { agentId: userId },
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        state: true,
        images: {
          take: 1,
          select: { url: true },
        },
      },
    });

    const propertyEarnings = await Promise.all(
      properties.map(async property => {
        // Get listing agent earnings for this property
        const listingEarnings = await prisma.payment.aggregate({
          where: {
            rental: { propertyId: property.id },
            status: PaymentStatus.SUCCESS,
            agentCommission: { not: null },
          },
          _sum: {
            agentCommission: true,
            amount: true,
          },
          _count: true,
        });

        // Get sub-agent earnings for this property
        const subAgentEarnings = await prisma.referralConversion.aggregate({
          where: {
            referral: {
              agentId: userId,
              propertyId: property.id,
            },
          },
          _sum: {
            commission: true,
          },
          _count: true,
        });

        const totalEarnings = Number(listingEarnings._sum.agentCommission || 0) + Number(subAgentEarnings._sum.commission || 0);
        const totalTransactions = listingEarnings._count + subAgentEarnings._count;

        return {
          property: {
            id: property.id,
            title: property.title,
            address: `${property.address}, ${property.city}, ${property.state}`,
            image: property.images[0]?.url || null,
          },
          totalEarnings: totalEarnings.toFixed(2),
          totalTransactions,
          listingAgentEarnings: Number(listingEarnings._sum.agentCommission || 0).toFixed(2),
          subAgentEarnings: Number(subAgentEarnings._sum.commission || 0).toFixed(2),
          totalRentCollected: Number(listingEarnings._sum.amount || 0).toFixed(2),
        };
      })
    );

    // Sort by total earnings
    const sorted = propertyEarnings.sort((a, b) => Number(b.totalEarnings) - Number(a.totalEarnings));

    const paginated = sorted.slice(skip, skip + limit);

    return {
      properties: paginated,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(sorted.length / limit),
        totalItems: sorted.length,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get earnings analytics
   */
  async getEarningsAnalytics(userId: string, period: 'week' | 'month' | 'year') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Get earnings over time
    const listingPayments = await prisma.payment.findMany({
      where: {
        rental: {
          property: { agentId: userId },
        },
        status: PaymentStatus.SUCCESS,
        paidAt: { gte: startDate },
        agentCommission: { not: null },
      },
      select: {
        agentCommission: true,
        paidAt: true,
      },
    });

    const subAgentConversions = await prisma.referralConversion.findMany({
      where: {
        referral: { agentId: userId },
        createdAt: { gte: startDate },
      },
      select: {
        commission: true,
        createdAt: true,
      },
    });

    // Group by date
    const earningsByDate: Record<string, number> = {};

    listingPayments.forEach(payment => {
      if (payment.paidAt) {
        const date = payment.paidAt.toISOString().split('T')[0];
        earningsByDate[date] = (earningsByDate[date] || 0) + Number(payment.agentCommission || 0);
      }
    });

    subAgentConversions.forEach(conversion => {
      const date = conversion.createdAt.toISOString().split('T')[0];
      earningsByDate[date] = (earningsByDate[date] || 0) + Number(conversion.commission);
    });

    const earningsOverTime = Object.entries(earningsByDate)
      .map(([date, amount]) => ({
        date,
        amount: amount.toFixed(2),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      earningsOverTime,
      totalForPeriod: Object.values(earningsByDate).reduce((sum, val) => sum + val, 0).toFixed(2),
    };
  }
}

export const earningsService = new EarningsService();