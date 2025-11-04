// backend/referral-service/src/services/agentReferralService.ts

import { PrismaClient } from '@prisma/client';
import { promotionLinkService } from './promotionLinkService';

const prisma = new PrismaClient();

interface ReferralAnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  propertyId?: string;
}

interface ReferralPerformanceFilters {
  page: number;
  limit: number;
  sortBy: 'clicks' | 'conversions' | 'earnings';
}

interface EarningsHistoryFilters {
  page: number;
  limit: number;
  startDate?: Date;
  endDate?: Date;
}

export class AgentReferralService {
  /**
   * Get agent referral dashboard data
   */
  async getReferralDashboard(userId: string) {
    const [
      totalReferrals,
      activeReferrals,
      totalClicks,
      uniqueClicks,
      totalConversions,
      totalEarnings,
      recentActivity,
    ] = await Promise.all([
      prisma.agentReferral.count({ where: { agentId: userId } }),
      prisma.agentReferral.count({ where: { agentId: userId, isActive: true } }),
      prisma.agentReferral.aggregate({
        where: { agentId: userId },
        _sum: { clicks: true },
      }),
      prisma.agentReferral.aggregate({
        where: { agentId: userId },
        _sum: { uniqueClicks: true },
      }),
      prisma.agentReferral.aggregate({
        where: { agentId: userId },
        _sum: { conversions: true },
      }),
      prisma.agentReferral.aggregate({
        where: { agentId: userId },
        _sum: { totalEarnings: true },
      }),
      this.getRecentActivity(userId, 5),
    ]);

    // Calculate conversion rate
    const conversionRate = totalClicks._sum.clicks
      ? ((totalConversions._sum.conversions || 0) / totalClicks._sum.clicks) * 100
      : 0;

    return {
      summary: {
        totalReferrals,
        activeReferrals,
        totalClicks: totalClicks._sum.clicks || 0,
        uniqueClicks: uniqueClicks._sum.uniqueClicks || 0,
        totalConversions: totalConversions._sum.conversions || 0,
        totalEarnings: totalEarnings._sum.totalEarnings?.toString() || '0',
        conversionRate: conversionRate.toFixed(2),
      },
      recentActivity,
    };
  }

  /**
   * Get recent activity for dashboard
   */
  private async getRecentActivity(userId: string, limit: number) {
    const [recentClicks, recentConversions] = await Promise.all([
      prisma.referralClick.findMany({
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
      prisma.referralConversion.findMany({
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
    ]);

    return {
      clicks: recentClicks.map(click => ({
        id: click.id,
        propertyId: click.referral.property.id,
        propertyTitle: click.referral.property.title,
        propertyImage: click.referral.property.images[0]?.url || null,
        ipAddress: click.ipAddress,
        country: click.country,
        city: click.city,
        createdAt: click.createdAt.toISOString(),
      })),
      conversions: recentConversions.map(conversion => ({
        id: conversion.id,
        propertyId: conversion.referral.property.id,
        propertyTitle: conversion.referral.property.title,
        propertyImage: conversion.referral.property.images[0]?.url || null,
        amount: conversion.amount.toString(),
        commission: conversion.commission.toString(),
        isPaid: conversion.isPaid,
        createdAt: conversion.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Get property referral tracking
   */
  async getPropertyReferralTracking(propertyId: string, userId: string) {
    // Verify user has access to this property (owner or listing agent)
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ ownerId: userId }, { agentId: userId }],
      },
    });

    if (!property) return null;

    // Get or create referral for this property
    let referral = await prisma.agentReferral.findUnique({
      where: {
        agentId_propertyId: {
          agentId: userId,
          propertyId,
        },
      },
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
    });

    // Create referral if doesn't exist
    if (!referral) {
      const referralCode = promotionLinkService.generateReferralCode();
      const referralLink = promotionLinkService.generateReferralLink(referralCode, propertyId);

      referral = await prisma.agentReferral.create({
        data: {
          agentId: userId,
          propertyId,
          referralCode,
          referralLink,
        },
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
      });
    }

    // Get recent clicks and conversions
    const [recentClicks, recentConversions] = await Promise.all([
      prisma.referralClick.findMany({
        where: { referralId: referral.id },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.referralConversion.findMany({
        where: { referralId: referral.id },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      referral: {
        id: referral.id,
        referralCode: referral.referralCode,
        referralLink: referral.referralLink,
        clicks: referral.clicks,
        uniqueClicks: referral.uniqueClicks,
        conversions: referral.conversions,
        totalEarnings: referral.totalEarnings.toString(),
        isActive: referral.isActive,
        createdAt: referral.createdAt.toISOString(),
      },
      property: {
        id: referral.property.id,
        title: referral.property.title,
        address: `${referral.property.address}, ${referral.property.city}, ${referral.property.state}`,
        image: referral.property.images[0]?.url || null,
      },
      recentClicks: recentClicks.map(click => ({
        id: click.id,
        ipAddress: click.ipAddress,
        country: click.country,
        city: click.city,
        referrerUrl: click.referrerUrl,
        createdAt: click.createdAt.toISOString(),
      })),
      recentConversions: recentConversions.map(conversion => ({
        id: conversion.id,
        amount: conversion.amount.toString(),
        commission: conversion.commission.toString(),
        isPaid: conversion.isPaid,
        paidAt: conversion.paidAt?.toISOString(),
        createdAt: conversion.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Get referral analytics
   */
  async getReferralAnalytics(userId: string, filters: ReferralAnalyticsFilters) {
    const { startDate, endDate, propertyId } = filters;

    const where: any = { agentId: userId };
    if (propertyId) where.propertyId = propertyId;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    // Get total metrics
    const [totalMetrics, clicksOverTime, conversionsOverTime] = await Promise.all([
      prisma.agentReferral.aggregate({
        where,
        _sum: {
          clicks: true,
          uniqueClicks: true,
          conversions: true,
          totalEarnings: true,
        },
      }),
      this.getClicksOverTime(userId, dateFilter, propertyId),
      this.getConversionsOverTime(userId, dateFilter, propertyId),
    ]);

    // Calculate conversion rate
    const conversionRate = totalMetrics._sum.clicks
      ? ((totalMetrics._sum.conversions || 0) / totalMetrics._sum.clicks) * 100
      : 0;

    return {
      summary: {
        totalClicks: totalMetrics._sum.clicks || 0,
        uniqueClicks: totalMetrics._sum.uniqueClicks || 0,
        totalConversions: totalMetrics._sum.conversions || 0,
        totalEarnings: totalMetrics._sum.totalEarnings?.toString() || '0',
        conversionRate: conversionRate.toFixed(2),
      },
      clicksOverTime,
      conversionsOverTime,
    };
  }

  /**
   * Get clicks over time
   */
  private async getClicksOverTime(userId: string, dateFilter: any, propertyId?: string) {
    const where: any = {
      referral: { agentId: userId },
    };
    
    if (propertyId) where.referral.propertyId = propertyId;
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;

    const clicks = await prisma.referralClick.groupBy({
      by: ['createdAt'],
      where,
      _count: true,
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const clicksByDate: Record<string, number> = {};
    clicks.forEach(click => {
      const date = click.createdAt.toISOString().split('T')[0];
      clicksByDate[date] = (clicksByDate[date] || 0) + click._count;
    });

    return Object.entries(clicksByDate).map(([date, count]) => ({
      date,
      count,
    }));
  }

  /**
   * Get conversions over time
   */
  private async getConversionsOverTime(userId: string, dateFilter: any, propertyId?: string) {
    const where: any = {
      referral: { agentId: userId },
    };
    
    if (propertyId) where.referral.propertyId = propertyId;
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;

    const conversions = await prisma.referralConversion.groupBy({
      by: ['createdAt'],
      where,
      _count: true,
      _sum: {
        amount: true,
        commission: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const conversionsByDate: Record<string, { count: number; amount: number; commission: number }> = {};
    conversions.forEach(conversion => {
      const date = conversion.createdAt.toISOString().split('T')[0];
      if (!conversionsByDate[date]) {
        conversionsByDate[date] = { count: 0, amount: 0, commission: 0 };
      }
      conversionsByDate[date].count += conversion._count;
      conversionsByDate[date].amount += Number(conversion._sum.amount || 0);
      conversionsByDate[date].commission += Number(conversion._sum.commission || 0);
    });

    return Object.entries(conversionsByDate).map(([date, data]) => ({
      date,
      count: data.count,
      amount: data.amount.toFixed(2),
      commission: data.commission.toFixed(2),
    }));
  }

  /**
   * Track referral click
   */
  async trackReferralClick(data: {
    referralCode: string;
    propertyId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { referralCode, propertyId, ipAddress, userAgent } = data;

    // Find referral
    const referral = await prisma.agentReferral.findUnique({
      where: { referralCode },
    });

    if (!referral || referral.propertyId !== propertyId) {
      throw new Error('Invalid referral code');
    }

    // Check if this is a unique click (based on IP address in last 24 hours)
    const isUniqueClick = ipAddress
      ? !(await this.isRecentClick(referral.id, ipAddress))
      : true;

    // Create click record
    await prisma.referralClick.create({
      data: {
        referralId: referral.id,
        ipAddress,
        userAgent,
      },
    });

    // Update referral metrics
    await prisma.agentReferral.update({
      where: { id: referral.id },
      data: {
        clicks: { increment: 1 },
        uniqueClicks: isUniqueClick ? { increment: 1 } : undefined,
      },
    });
  }

  /**
   * Check if IP address has clicked recently (within 24 hours)
   */
  private async isRecentClick(referralId: string, ipAddress: string): Promise<boolean> {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const recentClick = await prisma.referralClick.findFirst({
      where: {
        referralId,
        ipAddress,
        createdAt: { gte: yesterday },
      },
    });

    return !!recentClick;
  }

  /**
   * Track referral conversion
   */
  async trackReferralConversion(data: {
    referralCode: string;
    propertyId: string;
    paymentId: string;
    amount: number;
  }) {
    const { referralCode, propertyId, paymentId, amount } = data;

    // Find referral
    const referral = await prisma.agentReferral.findUnique({
      where: { referralCode },
      include: {
        property: {
          include: {
            owner: true,
            agent: true,
          },
        },
      },
    });

    if (!referral || referral.propertyId !== propertyId) {
      throw new Error('Invalid referral code');
    }

    // Calculate commission (50% of 20% if sub-agent, or 50% of 20% if listing agent)
    // Sub-agent gets 50% of the 20% commission
    const platformCommission = amount * 0.20; // 20% platform commission
    const agentCommission = platformCommission * 0.50; // Agent gets 50% of platform commission

    // Create conversion record
    await prisma.referralConversion.create({
      data: {
        referralId: referral.id,
        paymentId,
        amount,
        commission: agentCommission,
      },
    });

    // Update referral metrics
    await prisma.agentReferral.update({
      where: { id: referral.id },
      data: {
        conversions: { increment: 1 },
        totalEarnings: { increment: agentCommission },
      },
    });
  }

  /**
   * Get referral performance by property
   */
  async getReferralPerformanceByProperty(userId: string, filters: ReferralPerformanceFilters) {
    const { page, limit, sortBy } = filters;
    const skip = (page - 1) * limit;

    let orderBy: any = {};
    switch (sortBy) {
      case 'clicks':
        orderBy = { clicks: 'desc' };
        break;
      case 'conversions':
        orderBy = { conversions: 'desc' };
        break;
      case 'earnings':
        orderBy = { totalEarnings: 'desc' };
        break;
    }

    const [referrals, total] = await Promise.all([
      prisma.agentReferral.findMany({
        where: { agentId: userId },
        skip,
        take: limit,
        orderBy,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              state: true,
              price: true,
              images: {
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      }),
      prisma.agentReferral.count({ where: { agentId: userId } }),
    ]);

    return {
      properties: referrals.map(referral => ({
        referralId: referral.id,
        property: {
          id: referral.property.id,
          title: referral.property.title,
          address: `${referral.property.address}, ${referral.property.city}, ${referral.property.state}`,
          price: referral.property.price?.toString(),
          image: referral.property.images[0]?.url || null,
        },
        metrics: {
          clicks: referral.clicks,
          uniqueClicks: referral.uniqueClicks,
          conversions: referral.conversions,
          conversionRate: referral.clicks > 0 ? ((referral.conversions / referral.clicks) * 100).toFixed(2) : '0',
          totalEarnings: referral.totalEarnings.toString(),
        },
        referralCode: referral.referralCode,
        referralLink: referral.referralLink,
        isActive: referral.isActive,
        createdAt: referral.createdAt.toISOString(),
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get top performing referrals
   */
  async getTopPerformingReferrals(userId: string, limit: number) {
    const referrals = await prisma.agentReferral.findMany({
      where: { agentId: userId },
      take: limit,
      orderBy: [
        { conversions: 'desc' },
        { totalEarnings: 'desc' },
      ],
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
    });

    return referrals.map(referral => ({
      referralId: referral.id,
      property: {
        id: referral.property.id,
        title: referral.property.title,
        address: `${referral.property.address}, ${referral.property.city}, ${referral.property.state}`,
        image: referral.property.images[0]?.url || null,
      },
      metrics: {
        clicks: referral.clicks,
        conversions: referral.conversions,
        conversionRate: referral.clicks > 0 ? ((referral.conversions / referral.clicks) * 100).toFixed(2) : '0',
        totalEarnings: referral.totalEarnings.toString(),
      },
      referralLink: referral.referralLink,
    }));
  }

  /**
   * Get referral earnings history
   */
  async getReferralEarningsHistory(userId: string, filters: EarningsHistoryFilters) {
    const { page, limit, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      referral: { agentId: userId },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [conversions, total] = await Promise.all([
      prisma.referralConversion.findMany({
        where,
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
            },
          },
        },
      }),
      prisma.referralConversion.count({ where }),
    ]);

    return {
      earnings: conversions.map(conversion => ({
        id: conversion.id,
        property: {
          id: conversion.referral.property.id,
          title: conversion.referral.property.title,
          address: `${conversion.referral.property.address}, ${conversion.referral.property.city}, ${conversion.referral.property.state}`,
          image: conversion.referral.property.images[0]?.url || null,
        },
        amount: conversion.amount.toString(),
        commission: conversion.commission.toString(),
        isPaid: conversion.isPaid,
        paidAt: conversion.paidAt?.toISOString(),
        paymentStatus: conversion.payment.status,
        createdAt: conversion.createdAt.toISOString(),
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }
}

export const agentReferralService = new AgentReferralService();