import { PrismaClient, PaymentStatus, Prisma } from '@newcondo/db';
import { AppError } from '../../../shared/src/utils/response';

const prisma = new PrismaClient();

interface ReportFilters {
  startDate: Date;
  endDate: Date;
  propertyId?: string;
  userId?: string;
  category?: string;
}

export class ReportGenerationService {
  /**
   * Generate comprehensive platform report
   */
  async generatePlatformReport(startDate: Date, endDate: Date) {
    const [
      userStats,
      propertyStats,
      paymentStats,
      verificationStats,
      markingJobStats,
      supportTicketStats,
    ] = await Promise.all([
      this.getUserStats(startDate, endDate),
      this.getPropertyStats(startDate, endDate),
      this.getPaymentStats(startDate, endDate),
      this.getVerificationStats(startDate, endDate),
      this.getMarkingJobStats(startDate, endDate),
      this.getSupportTicketStats(startDate, endDate),
    ]);

    return {
      reportPeriod: { startDate, endDate },
      generatedAt: new Date(),
      users: userStats,
      properties: propertyStats,
      payments: paymentStats,
      verifications: verificationStats,
      markingJobs: markingJobStats,
      supportTickets: supportTicketStats,
    };
  }

  /**
   * Get user statistics
   */
  private async getUserStats(startDate: Date, endDate: Date) {
    const [totalUsers, newUsers, usersByRole, verifiedUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.user.count({
        where: {
          verificationStatus: 'VERIFIED',
        },
      }),
    ]);

    return {
      totalUsers,
      newUsers,
      usersByRole: usersByRole.reduce(
        (acc, item) => {
          acc[item.role] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      verifiedUsers,
      verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) + '%' : '0%',
    };
  }

  /**
   * Get property statistics
   */
  private async getPropertyStats(startDate: Date, endDate: Date) {
    const [
      totalProperties,
      newProperties,
      propertiesByStatus,
      propertiesByApprovalStatus,
      rentedProperties,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.property.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.property.groupBy({
        by: ['adminApprovalStatus'],
        _count: true,
      }),
      prisma.property.count({
        where: {
          status: 'RENTED',
        },
      }),
    ]);

    return {
      totalProperties,
      newProperties,
      propertiesByStatus: propertiesByStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      propertiesByApprovalStatus: propertiesByApprovalStatus.reduce(
        (acc, item) => {
          acc[item.adminApprovalStatus] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      rentedProperties,
      occupancyRate:
        totalProperties > 0 ? ((rentedProperties / totalProperties) * 100).toFixed(2) + '%' : '0%'
    };
  }





  /**
 * Get payment statistics
 */
  private async getPaymentStats(startDate: Date, endDate: Date) {
    const where: Prisma.PaymentWhereInput = {
      createdAt: { gte: startDate, lte: endDate },
    };

    const [
      totalPayments,
      totalAmount,
      paymentsByStatus,
      paymentsByType,
      commissionData,
    ] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ['paymentType'],
        where,
        _count: true,
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          ...where,
          status: PaymentStatus.SUCCESS,
        },
        _sum: {
          agentCommission: true,
          platformFee: true,
          ownerAmount: true,
        },
      }),
    ]);

    return {
      totalPayments,
      totalAmount: Number(totalAmount._sum.amount || 0),
      paymentsByStatus: paymentsByStatus.map((item) => ({
        status: item.status,
        count: item._count,
        amount: Number(item._sum.amount || 0),
      })),
      paymentsByType: paymentsByType.map((item) => ({
        type: item.paymentType,
        count: item._count,
        amount: Number(item._sum.amount || 0),
      })),
      commissions: {
        agentCommissions: Number(commissionData._sum.agentCommission || 0),
        platformFees: Number(commissionData._sum.platformFee || 0),
        ownerPayments: Number(commissionData._sum.ownerAmount || 0),
      },
    };
  }

  /**
   * Get verification statistics
   */
  private async getVerificationStats(startDate: Date, endDate: Date) {
    const [
      totalVerificationRequests,
      verifiedUsers,
      rejectedUsers,
      pendingUsers,
      averageVerificationTime,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          verificationStatus: { not: 'PENDING' },
        },
      }),
      prisma.user.count({
        where: {
          verifiedAt: { gte: startDate, lte: endDate },
          verificationStatus: 'VERIFIED',
        },
      }),
      prisma.user.count({
        where: {
          updatedAt: { gte: startDate, lte: endDate },
          verificationStatus: 'REJECTED',
        },
      }),
      prisma.user.count({
        where: {
          verificationStatus: 'PENDING',
        },
      }),
      this.calculateAverageVerificationTime(startDate, endDate),
    ]);

    return {
      totalVerificationRequests,
      verifiedUsers,
      rejectedUsers,
      pendingUsers,
      approvalRate:
        totalVerificationRequests > 0
          ? ((verifiedUsers / totalVerificationRequests) * 100).toFixed(2) + '%'
          : '0%',
      averageVerificationTime,
    };
  }

  /**
   * Calculate average verification time
   */
  private async calculateAverageVerificationTime(startDate: Date, endDate: Date) {
    const verifiedUsers = await prisma.user.findMany({
      where: {
        verifiedAt: { gte: startDate, lte: endDate },
        verificationStatus: 'VERIFIED',
      },
      select: {
        createdAt: true,
        verifiedAt: true,
      },
    });

    if (verifiedUsers.length === 0) return 'N/A';

    const totalHours = verifiedUsers.reduce((sum, user) => {
      if (!user.verifiedAt) return sum;
      const diff = user.verifiedAt.getTime() - user.createdAt.getTime();
      return sum + diff / (1000 * 60 * 60); // Convert to hours
    }, 0);

    const averageHours = totalHours / verifiedUsers.length;
    return `${averageHours.toFixed(1)} hours`;
  }

  /**
   * Get marking job statistics
   */
  private async getMarkingJobStats(startDate: Date, endDate: Date) {
    const where: Prisma.PropertyMarkingJobWhereInput = {
      createdAt: { gte: startDate, lte: endDate },
    };

    const [totalJobs, jobsByStatus, completedJobs, averageCompletionTime] = await Promise.all([
      prisma.propertyMarkingJob.count({ where }),
      prisma.propertyMarkingJob.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.propertyMarkingJob.count({
        where: {
          ...where,
          status: 'COMPLETED',
        },
      }),
      this.calculateAverageMarkingTime(startDate, endDate),
    ]);

    return {
      totalJobs,
      jobsByStatus: jobsByStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      completedJobs,
      completionRate: totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(2) + '%' : '0%',
      averageCompletionTime,
    };
  }

  /**
   * Calculate average marking completion time
   */
  private async calculateAverageMarkingTime(startDate: Date, endDate: Date) {
    const completedJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        completedAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    });

    if (completedJobs.length === 0) return 'N/A';

    const totalHours = completedJobs.reduce((sum, job) => {
      if (!job.completedAt) return sum;
      const diff = job.completedAt.getTime() - job.createdAt.getTime();
      return sum + diff / (1000 * 60 * 60); // Convert to hours
    }, 0);

    const averageHours = totalHours / completedJobs.length;
    return `${averageHours.toFixed(1)} hours`;
  }

  /**
   * Get support ticket statistics
   */
  private async getSupportTicketStats(startDate: Date, endDate: Date) {
    const where: Prisma.SupportTicketWhereInput = {
      createdAt: { gte: startDate, lte: endDate },
    };

    const [
      totalTickets,
      ticketsByStatus,
      ticketsByCategory,
      ticketsByPriority,
      resolvedTickets,
      averageResolutionTime,
    ] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.supportTicket.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
      prisma.supportTicket.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
      prisma.supportTicket.count({
        where: {
          resolvedAt: { gte: startDate, lte: endDate },
          status: 'RESOLVED',
        },
      }),
      this.calculateAverageResolutionTime(startDate, endDate),
    ]);

    return {
      totalTickets,
      ticketsByStatus: ticketsByStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      ticketsByCategory: ticketsByCategory.reduce(
        (acc, item) => {
          acc[item.category] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      ticketsByPriority: ticketsByPriority.reduce(
        (acc, item) => {
          acc[item.priority] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      resolvedTickets,
      resolutionRate: totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(2) + '%' : '0%',
      averageResolutionTime,
    };
  }

  /**
   * Calculate average ticket resolution time
   */
  private async calculateAverageResolutionTime(startDate: Date, endDate: Date) {
    const resolvedTickets = await prisma.supportTicket.findMany({
      where: {
        resolvedAt: { gte: startDate, lte: endDate },
        status: 'RESOLVED',
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    if (resolvedTickets.length === 0) return 'N/A';

    const totalHours = resolvedTickets.reduce((sum, ticket) => {
      if (!ticket.resolvedAt) return sum;
      const diff = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
      return sum + diff / (1000 * 60 * 60); // Convert to hours
    }, 0);

    const averageHours = totalHours / resolvedTickets.length;
    return `${averageHours.toFixed(1)} hours`;
  }

  /**
   * Generate revenue report
   */
  async generateRevenueReport(startDate: Date, endDate: Date) {
    const where: Prisma.PaymentWhereInput = {
      paidAt: { gte: startDate, lte: endDate },
      status: PaymentStatus.SUCCESS,
    };

    const [
      totalRevenue,
      revenueByType,
      revenueByMonth,
      commissionBreakdown,
      topProperties,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where,
        _sum: {
          amount: true,
          platformFee: true,
          agentCommission: true,
        },
      }),
      prisma.payment.groupBy({
        by: ['paymentType'],
        where,
        _sum: { amount: true, platformFee: true },
        _count: true,
      }),
      prisma.$queryRaw<Array<{ month: string; revenue: number; count: number }>>`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "paidAt"), 'YYYY-MM') as month,
          SUM("amount")::DECIMAL as revenue,
          COUNT(*)::INTEGER as count
        FROM "Payment"
        WHERE "status" = ${PaymentStatus.SUCCESS}
          AND "paidAt" >= ${startDate}
          AND "paidAt" <= ${endDate}
        GROUP BY DATE_TRUNC('month', "paidAt")
        ORDER BY month ASC
      `,
      this.getCommissionBreakdown(startDate, endDate),
      this.getTopRevenueProperties(startDate, endDate, 10),
    ]);

    return {
      reportPeriod: { startDate, endDate },
      generatedAt: new Date(),
      summary: {
        totalRevenue: Number(totalRevenue._sum.amount || 0),
        platformFees: Number(totalRevenue._sum.platformFee || 0),
        agentCommissions: Number(totalRevenue._sum.agentCommission || 0),
      },
      revenueByType: revenueByType.map((item) => ({
        type: item.paymentType,
        revenue: Number(item._sum.amount || 0),
        platformFee: Number(item._sum.platformFee || 0),
        count: item._count,
      })),
      revenueByMonth: revenueByMonth.map((item) => ({
        month: item.month,
        revenue: Number(item.revenue),
        count: item.count,
      })),
      commissionBreakdown,
      topProperties,
    };
  }

  /**
   * Get commission breakdown
   */
  private async getCommissionBreakdown(startDate: Date, endDate: Date) {
    const payments = await prisma.payment.findMany({
      where: {
        paidAt: { gte: startDate, lte: endDate },
        status: PaymentStatus.SUCCESS,
        agentCommission: { not: null },
      },
      include: {
        rental: {
          include: {
            property: {
              include: {
                agent: {
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
    });

    const agentCommissions = payments.reduce(
      (acc, payment) => {
        const agentId = payment.rental?.property.agentId;
        if (!agentId || !payment.agentCommission) return acc;

        if (!acc[agentId]) {
          acc[agentId] = {
            agent: payment.rental?.property.agent,
            totalCommission: 0,
            paymentCount: 0,
          };
        }

        acc[agentId].totalCommission += Number(payment.agentCommission);
        acc[agentId].paymentCount += 1;

        return acc;
      },
      {} as Record<string, any>
    );

    return Object.values(agentCommissions).sort(
      (a: any, b: any) => b.totalCommission - a.totalCommission
    );
  }

  /**
   * Get top revenue generating properties
   */
  private async getTopRevenueProperties(startDate: Date, endDate: Date, limit: number = 10) {
    const properties = await prisma.$queryRaw<
      Array<{
        propertyId: string;
        title: string;
        revenue: number;
        paymentCount: number;
      }>
    >`
      SELECT 
        p.id as "propertyId",
        p.title,
        SUM(pay.amount)::DECIMAL as revenue,
        COUNT(pay.id)::INTEGER as "paymentCount"
      FROM "Payment" pay
      JOIN "Rental" r ON pay."rentalId" = r.id
      JOIN "Property" p ON r."propertyId" = p.id
      WHERE pay.status = ${PaymentStatus.SUCCESS}
        AND pay."paidAt" >= ${startDate}
        AND pay."paidAt" <= ${endDate}
      GROUP BY p.id, p.title
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;

    return properties.map((p) => ({
      ...p,
      revenue: Number(p.revenue),
    }));
  }

  /**
   * Generate user activity report
   */
  async generateUserActivityReport(startDate: Date, endDate: Date) {
    const [
      newUsers,
      activeUsers,
      usersByRole,
      topPropertyOwners,
      topAgents,
      topRenters,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.getActiveUsers(startDate, endDate),
      prisma.user.groupBy({
        by: ['role'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),
      this.getTopPropertyOwners(startDate, endDate),
      this.getTopAgents(startDate, endDate),
      this.getTopRenters(startDate, endDate),
    ]);

    return {
      reportPeriod: { startDate, endDate },
      generatedAt: new Date(),
      newUsers,
      activeUsers,
      usersByRole: usersByRole.reduce(
        (acc, item) => {
          acc[item.role] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      topPropertyOwners,
      topAgents,
      topRenters,
    };
  }

  /**
   * Get active users (users with activity in the period)
   */
  private async getActiveUsers(startDate: Date, endDate: Date) {
    const activeUserIds = await prisma.eventLog.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    return activeUserIds.filter((u) => u.userId).length;
  }

  /**
   * Get top property owners by number of properties
   */
  private async getTopPropertyOwners(startDate: Date, endDate: Date) {
    return prisma.$queryRaw<
      Array<{
        userId: string;
        name: string;
        email: string;
        propertyCount: number;
        totalRevenue: number;
      }>
    >`
      SELECT 
        u.id as "userId",
        u.name,
        u.email,
        COUNT(DISTINCT p.id)::INTEGER as "propertyCount",
        COALESCE(SUM(pay.amount), 0)::DECIMAL as "totalRevenue"
      FROM "User" u
      JOIN "Property" p ON u.id = p."ownerId"
      LEFT JOIN "Rental" r ON p.id = r."propertyId"
      LEFT JOIN "Payment" pay ON r.id = pay."rentalId" 
        AND pay.status = ${PaymentStatus.SUCCESS}
        AND pay."paidAt" >= ${startDate}
        AND pay."paidAt" <= ${endDate}
      WHERE p."createdAt" >= ${startDate}
        AND p."createdAt" <= ${endDate}
      GROUP BY u.id, u.name, u.email
      ORDER BY "propertyCount" DESC
      LIMIT 10
    `;
  }

  /**
   * Get top agents by commission earned
   */
  private async getTopAgents(startDate: Date, endDate: Date) {
    return prisma.$queryRaw<
      Array<{
        userId: string;
        name: string;
        email: string;
        totalCommission: number;
        dealCount: number;
      }>
    >`
      SELECT 
        u.id as "userId",
        u.name,
        u.email,
        COALESCE(SUM(pay."agentCommission"), 0)::DECIMAL as "totalCommission",
        COUNT(pay.id)::INTEGER as "dealCount"
      FROM "User" u
      JOIN "Property" p ON u.id = p."agentId"
      JOIN "Rental" r ON p.id = r."propertyId"
      JOIN "Payment" pay ON r.id = pay."rentalId"
      WHERE pay.status = ${PaymentStatus.SUCCESS}
        AND pay."paidAt" >= ${startDate}
        AND pay."paidAt" <= ${endDate}
        AND pay."agentCommission" IS NOT NULL
      GROUP BY u.id, u.name, u.email
      ORDER BY "totalCommission" DESC
      LIMIT 10
    `;
  }

  /**
   * Get top renters by total payments
   */
  private async getTopRenters(startDate: Date, endDate: Date) {
    return prisma.$queryRaw<
      Array<{
        userId: string;
        name: string;
        email: string;
        totalPayments: number;
        paymentCount: number;
      }>
    >`
      SELECT 
        u.id as "userId",
        u.name,
        u.email,
        COALESCE(SUM(pay.amount), 0)::DECIMAL as "totalPayments",
        COUNT(pay.id)::INTEGER as "paymentCount"
      FROM "User" u
      JOIN "Payment" pay ON u.id = pay."userId"
      WHERE pay.status = ${PaymentStatus.SUCCESS}
        AND pay."paidAt" >= ${startDate}
        AND pay."paidAt" <= ${endDate}
      GROUP BY u.id, u.name, u.email
      ORDER BY "totalPayments" DESC
      LIMIT 10
    `;
  }

  /**
   * Export report to CSV format
   */
  async exportReportToCSV(reportType: string, startDate: Date, endDate: Date) {
    let report;
    switch (reportType) {
      case 'platform':
        report = await this.generatePlatformReport(startDate, endDate);
        break;
      case 'revenue':
        report = await this.generateRevenueReport(startDate, endDate);
        break;
      case 'user-activity':
        report = await this.generateUserActivityReport(startDate, endDate);
        break;
      default:
        throw new AppError('Invalid report type', 400);
    }

    return {
      reportType,
      data: report,
      format: 'json', // In real implementation, convert to CSV
    };


  }
}

export const reportGenerationService = new ReportGenerationService();