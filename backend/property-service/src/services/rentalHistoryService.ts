// backend/property-service/src/services/rentalHistoryService.ts

import { PrismaClient, RentalStatus } from '@prisma/client';
import {
  RentalHistoryRecord,
  RentalHistoryFilters,
  RentalSummary,
  PropertyRentalTimeline,
  TenantRentalProfile,
  PaymentHistoryItem,
  RentalRevenueBreakdown,
  RentalExpirationAlert
} from '../types/rentalHistory';

const prisma = new PrismaClient();

export class RentalHistoryService {
  /**
   * Get rental history with filters
   */
  async getRentalHistory(
    userId: string,
    filters: RentalHistoryFilters
  ): Promise<{ rentals: RentalHistoryRecord[]; total: number; pages: number }> {
    const {
      propertyId,
      unitId,
      status,
      startDateFrom,
      startDateTo,
      endDateFrom,
      endDateTo,
      renterId,
      minRent,
      maxRent,
      isConfirmed,
      sortBy = 'startDate',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    // Build where clause
    const where: any = {
      property: {
        OR: [
          { ownerId: userId },
          { agentId: userId },
        ],
      },
    };

    if (propertyId) where.propertyId = propertyId;
    if (unitId) where.unitId = unitId;
    if (status) where.status = status;
    if (renterId) where.renterId = renterId;
    if (typeof isConfirmed === 'boolean') where.isConfirmed = isConfirmed;

    if (startDateFrom || startDateTo) {
      where.startDate = {};
      if (startDateFrom) where.startDate.gte = startDateFrom;
      if (startDateTo) where.startDate.lte = startDateTo;
    }

    if (endDateFrom || endDateTo) {
      where.endDate = {};
      if (endDateFrom) where.endDate.gte = endDateFrom;
      if (endDateTo) where.endDate.lte = endDateTo;
    }

    if (minRent || maxRent) {
      where.monthlyRent = {};
      if (minRent) where.monthlyRent.gte = minRent;
      if (maxRent) where.monthlyRent.lte = maxRent;
    }

    const [rentals, total] = await Promise.all([
      prisma.rental.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              agent: {
                select: {
                  id: true,
                  name: true,
                },
              },
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
          payments: {
            where: {
              status: 'SUCCESS',
            },
            orderBy: {
              paidAt: 'desc',
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rental.count({ where }),
    ]);

    const formattedRentals: RentalHistoryRecord[] = rentals.map(rental => {
      const totalPaid = rental.payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
      const duration = rental.endDate
        ? Math.floor((rental.endDate.getTime() - rental.startDate.getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((Date.now() - rental.startDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: rental.id,
        propertyId: rental.propertyId,
        unitId: rental.unitId || undefined,
        propertyTitle: rental.property.title,
        unitNumber: rental.unit?.unitNumber,
        renter: {
          id: rental.renter.id,
          name: rental.renter.name || 'Unknown',
          email: rental.renter.email,
          phone: rental.renter.phone || undefined,
        },
        startDate: rental.startDate,
        endDate: rental.endDate || undefined,
        duration,
        status: rental.status,
        monthlyRent: rental.monthlyRent.toNumber(),
        totalPaid,
        outstandingBalance: 0, // Calculate based on expected payments
        payments: rental.payments.map(p => ({
          id: p.id,
          amount: p.amount.toNumber(),
          paidAt: p.paidAt!,
          method: p.paymentMethod || 'Unknown',
          status: p.status,
        })),
        confirmationDeadline: rental.confirmationDeadline || undefined,
        isConfirmed: rental.isConfirmed,
        confirmedAt: rental.confirmedAt || undefined,
        listingAgent: rental.property.agent ? {
          id: rental.property.agent.id,
          name: rental.property.agent.name || 'Agent',
          commission: 0, // Calculate from payments
        } : undefined,
        createdAt: rental.createdAt,
        updatedAt: rental.updatedAt,
      };
    });

    return {
      rentals: formattedRentals,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get rental summary statistics
   */
  async getRentalSummary(userId: string): Promise<RentalSummary> {
    const rentals = await prisma.rental.findMany({
      where: {
        property: {
          OR: [
            { ownerId: userId },
            { agentId: userId },
          ],
        },
      },
      include: {
        property: {
          select: {
            title: true,
          },
        },
        unit: {
          select: {
            unitNumber: true,
          },
        },
        renter: {
          select: {
            name: true,
          },
        },
        payments: {
          where: {
            status: 'SUCCESS',
          },
        },
      },
    });

    const totalRentals = rentals.length;
    const activeRentals = rentals.filter(r => r.status === 'ACTIVE').length;
    const completedRentals = rentals.filter(r => r.status === 'EXPIRED').length;
    const pendingConfirmation = rentals.filter(r => !r.isConfirmed && r.status === 'PENDING_CONFIRMATION').length;

    const totalRevenue = rentals.reduce((sum, r) => {
      return sum + r.payments.reduce((pSum, p) => pSum + p.amount.toNumber(), 0);
    }, 0);

    const averageRentalValue = totalRentals > 0
      ? rentals.reduce((sum, r) => sum + r.monthlyRent.toNumber(), 0) / totalRentals
      : 0;

    const totalOutstanding = 0; // Calculate based on expected vs actual payments

    // Calculate rental durations
    const durations = rentals
      .filter(r => r.endDate)
      .map(r => (r.endDate!.getTime() - r.startDate.getTime()) / (1000 * 60 * 60 * 24));

    const averageRentalDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    const longestRental = durations.length > 0 ? Math.max(...durations) : 0;
    const shortestRental = durations.length > 0 ? Math.min(...durations) : 0;

    // Get recent rentals
    const recentRentals = await this.getRentalHistory(userId, {
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: 5,
    });

    // Get upcoming expirations
    const upcomingExpirations = await this.getUpcomingExpirations(userId);

    return {
      totalRentals,
      activeRentals,
      completedRentals,
      pendingConfirmation,
      totalRevenue,
      averageRentalValue,
      totalOutstanding,
      averageRentalDuration,
      longestRental,
      shortestRental,
      recentRentals: recentRentals.rentals,
      upcomingExpirations,
    };
  }

  /**
   * Get property rental timeline
   */
  async getPropertyRentalTimeline(propertyId: string, userId: string): Promise<PropertyRentalTimeline> {
    // Verify access
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        agentId: true,
        createdAt: true,
      },
    });

    if (!property || (property.ownerId !== userId && property.agentId !== userId)) {
      throw new Error('Unauthorized access to property timeline');
    }

    const rentals = await prisma.rental.findMany({
      where: { propertyId },
      include: {
        renter: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    const timeline = rentals.map(rental => {
      const duration = rental.endDate
        ? Math.floor((rental.endDate.getTime() - rental.startDate.getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((Date.now() - rental.startDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        startDate: rental.startDate,
        endDate: rental.endDate || undefined,
        rentalId: rental.id,
        renterName: rental.renter.name || 'Unknown',
        monthlyRent: rental.monthlyRent.toNumber(),
        status: rental.status,
        duration,
      };
    });

    // Calculate vacancy metrics
    const now = Date.now();
    const propertyAge = now - property.createdAt.getTime();
    const totalDays = Math.floor(propertyAge / (1000 * 60 * 60 * 24));

    let occupiedDays = 0;
    rentals.forEach(rental => {
      const start = rental.startDate.getTime();
      const end = rental.endDate ? rental.endDate.getTime() : now;
      occupiedDays += Math.floor((end - start) / (1000 * 60 * 60 * 24));
    });

    const vacantDays = totalDays - occupiedDays;
    const occupancyRate = totalDays > 0 ? (occupiedDays / totalDays) * 100 : 0;

    // Calculate revenue metrics
    const payments = await prisma.payment.findMany({
      where: {
        rental: {
          propertyId,
        },
        status: 'SUCCESS',
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const averageMonthlyRevenue = totalDays > 0 ? (totalRevenue / totalDays) * 30 : 0;
    const revenuePerDay = totalDays > 0 ? totalRevenue / totalDays : 0;

    return {
      propertyId,
      propertyTitle: property.title,
      timeline,
      totalDays,
      occupiedDays,
      vacantDays,
      occupancyRate,
      totalRevenue,
      averageMonthlyRevenue,
      revenuePerDay,
    };
  }

  /**
   * Get tenant rental profile
   */
  async getTenantRentalProfile(renterId: string, userId: string): Promise<TenantRentalProfile> {
    const renter = await prisma.user.findUnique({
      where: { id: renterId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!renter) {
      throw new Error('Renter not found');
    }

    const rentals = await prisma.rental.findMany({
      where: {
        renterId,
        property: {
          OR: [
            { ownerId: userId },
            { agentId: userId },
          ],
        },
      },
      include: {
        property: {
          select: {
            title: true,
          },
        },
        unit: {
          select: {
            unitNumber: true,
          },
        },
        payments: {
          where: {
            status: 'SUCCESS',
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    const totalRentals = rentals.length;
    const activeRentals = rentals.filter(r => r.status === 'ACTIVE').length;
    const completedRentals = rentals.filter(r => r.status === 'EXPIRED').length;

    // Calculate metrics
    const durations = rentals
      .filter(r => r.endDate)
      .map(r => (r.endDate!.getTime() - r.startDate.getTime()) / (1000 * 60 * 60 * 24));

    const averageRentalDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    const totalRevenue = rentals.reduce((sum, r) => {
      return sum + r.payments.reduce((pSum, p) => pSum + p.amount.toNumber(), 0);
    }, 0);

    // Calculate on-time payment rate (placeholder - implement based on due dates)
    const onTimePaymentRate = 100;

    // Current rentals
    const currentRentals = rentals
      .filter(r => r.status === 'ACTIVE')
      .map(r => ({
        propertyTitle: r.property.title,
        unitNumber: r.unit?.unitNumber,
        startDate: r.startDate,
        monthlyRent: r.monthlyRent.toNumber(),
      }));

    // Format rental history
    const rentalHistory = await this.getRentalHistory(userId, {
      renterId,
      limit: 100,
    });

    return {
      renterId,
      renterName: renter.name || 'Unknown',
      renterEmail: renter.email,
      totalRentals,
      activeRentals,
      completedRentals,
      averageRentalDuration,
      onTimePaymentRate,
      totalRevenue,
      currentRentals,
      rentalHistory: rentalHistory.rentals,
    };
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(
    userId: string,
    filters: { rentalId?: string; page?: number; limit?: number }
  ): Promise<{ payments: PaymentHistoryItem[]; total: number }> {
    const { rentalId, page = 1, limit = 20 } = filters;

    const where: any = {
      rental: {
        property: {
          OR: [
            { ownerId: userId },
            { agentId: userId },
          ],
        },
      },
    };

    if (rentalId) where.rentalId = rentalId;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          rental: {
            include: {
              property: {
                select: {
                  title: true,
                },
              },
              unit: {
                select: {
                  unitNumber: true,
                },
              },
              renter: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    const formattedPayments: PaymentHistoryItem[] = payments.map(payment => ({
      id: payment.id,
      rentalId: payment.rentalId!,
      propertyTitle: payment.rental?.property.title || 'Unknown',
      unitNumber: payment.rental?.unit?.unitNumber,
      renterName: payment.rental?.renter.name || 'Unknown',
      amount: payment.amount.toNumber(),
      paymentType: payment.paymentType,
      paymentMethod: payment.paymentMethod || undefined,
      status: payment.status,
      ownerAmount: payment.ownerAmount?.toNumber(),
      agentCommission: payment.agentCommission?.toNumber(),
      platformFee: payment.platformFee?.toNumber(),
      paidAt: payment.paidAt || undefined,
      createdAt: payment.createdAt,
    }));

    return {
      payments: formattedPayments,
      total,
    };
  }

  /**
   * Get rental revenue breakdown
   */
  async getRentalRevenueBreakdown(
    userId: string,
    period: 'monthly' | 'quarterly' | 'yearly'
  ): Promise<RentalRevenueBreakdown> {
    const payments = await prisma.payment.findMany({
      where: {
        rental: {
          property: {
            OR: [
              { ownerId: userId },
              { agentId: userId },
            ],
          },
        },
        status: 'SUCCESS',
      },
      orderBy: { paidAt: 'asc' },
    });

    const grouped = this.groupPaymentsByPeriod(payments, period);

    return {
      period,
      data: grouped,
    };
  }

  /**
   * Get upcoming rental expirations
   */
  async getUpcomingExpirations(userId: string, daysAhead: number = 30): Promise<RentalExpirationAlert[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const rentals = await prisma.rental.findMany({
      where: {
        property: {
          OR: [
            { ownerId: userId },
            { agentId: userId },
          ],
        },
        status: 'ACTIVE',
        endDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
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
      orderBy: { endDate: 'asc' },
    });

    return rentals.map(rental => {
      const daysRemaining = Math.floor(
        (rental.endDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      let alertLevel: 'INFO' | 'WARNING' | 'CRITICAL';
      if (daysRemaining <= 7) {
        alertLevel = 'CRITICAL';
      } else if (daysRemaining <= 14) {
        alertLevel = 'WARNING';
      } else {
        alertLevel = 'INFO';
      }

      return {
        rentalId: rental.id,
        propertyId: rental.property.id,
        unitId: rental.unit?.id,
        propertyTitle: rental.property.title,
        unitNumber: rental.unit?.unitNumber,
        renter: {
          id: rental.renter.id,
          name: rental.renter.name || 'Unknown',
          email: rental.renter.email,
          phone: rental.renter.phone || undefined,
        },
        expiryDate: rental.endDate!,
        daysRemaining,
        monthlyRent: rental.monthlyRent.toNumber(),
        alertLevel,
      };
    });
  }

  /**
   * Helper: Group payments by period
   */
  private groupPaymentsByPeriod(payments: any[], period: 'monthly' | 'quarterly' | 'yearly') {
    const grouped: { [key: string]: any } = {};

    payments.forEach(payment => {
      if (!payment.paidAt) return;

      const date = new Date(payment.paidAt);
      let key: string;

      if (period === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'quarterly') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
      } else {
        key = `${date.getFullYear()}`;
      }

      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          totalRevenue: 0,
          rentPayments: 0,
          commissions: 0,
          platformFees: 0,
          netIncome: 0,
        };
      }

      const amount = payment.amount.toNumber();
      const commission = payment.agentCommission?.toNumber() || 0;
      const platformFee = payment.platformFee?.toNumber() || 0;
      const ownerAmount = payment.ownerAmount?.toNumber() || 0;

      grouped[key].totalRevenue += amount;
      grouped[key].rentPayments += amount;
      grouped[key].commissions += commission;
      grouped[key].platformFees += platformFee;
      grouped[key].netIncome += ownerAmount;
    });

    return Object.values(grouped);
  }
}

export default new RentalHistoryService();