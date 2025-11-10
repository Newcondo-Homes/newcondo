// backend/admin-service/src/services/reportingService.ts
import { PrismaClient } from '@newcondo/db';
import { 
  ReportConfig,
  ReportData,
  ReportFormat
} from '../types/reports';
import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';

const prisma = new PrismaClient();

export class ReportingService {
  /**
   * Generate comprehensive platform report
   */
  async generatePlatformReport(config: ReportConfig): Promise<ReportData> {
    const { startDate, endDate, sections } = config;

    const reportData: any = {
      metadata: {
        reportType: 'platform',
        generatedAt: new Date(),
        period: { startDate, endDate },
        generatedBy: config.userId
      },
      sections: {}
    };

    // Generate requested sections
    if (sections.includes('users')) {
      reportData.sections.users = await this.generateUserSection(startDate, endDate);
    }

    if (sections.includes('properties')) {
      reportData.sections.properties = await this.generatePropertySection(startDate, endDate);
    }

    if (sections.includes('revenue')) {
      reportData.sections.revenue = await this.generateRevenueSection(startDate, endDate);
    }

    if (sections.includes('agents')) {
      reportData.sections.agents = await this.generateAgentSection(startDate, endDate);
    }

    if (sections.includes('payments')) {
      reportData.sections.payments = await this.generatePaymentSection(startDate, endDate);
    }

    if (sections.includes('market')) {
      reportData.sections.market = await this.generateMarketSection(startDate, endDate);
    }

    return reportData;
  }

  /**
   * Generate revenue report
   */
  async generateRevenueReport(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'month'
  ): Promise<ReportData> {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startDate, lte: endDate }
      },
      include: {
        user: {
          select: { name: true, email: true }
        },
        rental: {
          include: {
            property: {
              select: { title: true, city: true, state: true }
            }
          }
        }
      }
    });

    const grouped = this.groupPaymentsByPeriod(payments, groupBy);
    const breakdown = this.calculateRevenueBreakdown(payments);
    const commission = this.calculateCommissionBreakdown(payments);

    return {
      metadata: {
        reportType: 'revenue',
        generatedAt: new Date(),
        period: { startDate, endDate },
        totalRecords: payments.length
      },
      summary: {
        totalRevenue: breakdown.total,
        platformRevenue: breakdown.platformFee,
        agentCommissions: breakdown.agentCommissions,
        ownerPayments: breakdown.ownerPayments
      },
      data: {
        grouped,
        breakdown,
        commission,
        transactions: payments.map(p => ({
          id: p.id,
          amount: p.amount.toNumber(),
          type: p.paymentType,
          date: p.paidAt,
          user: p.user.name,
          property: p.rental?.property?.title
        }))
      }
    };
  }

  /**
   * Generate agent performance report
   */
  async generateAgentReport(
    startDate: Date,
    endDate: Date,
    agentId?: string
  ): Promise<ReportData> {
    const whereClause: any = {
      role: 'AGENT'
    };

    if (agentId) {
      whereClause.id = agentId;
    }

    const agents = await prisma.user.findMany({
      where: whereClause,
      include: {
        agentListings: {
          where: {
            createdAt: { gte: startDate, lte: endDate }
          }
        },
        assignedMarkingJobs: {
          where: {
            createdAt: { gte: startDate, lte: endDate }
          }
        },
        referrals: true
      }
    });

    const agentPerformance = await Promise.all(
      agents.map(async (agent) => {
        const earnings = await this.calculateAgentEarnings(agent.id, startDate, endDate);
        const reliability = await this.calculateReliabilityScore(agent.id);

        return {
          agentId: agent.id,
          name: agent.name,
          email: agent.email,
          totalListings: agent.agentListings.length,
          completedMarkingJobs: agent.assignedMarkingJobs.filter(
            j => j.status === 'COMPLETED'
          ).length,
          totalMarkingJobs: agent.assignedMarkingJobs.length,
          referrals: agent.referrals.length,
          earnings: earnings.toNumber(),
          reliabilityScore: agent.agentReliabilityScore?.toNumber() || 0,
          performanceRating: this.calculatePerformanceRating(agent)
        };
      })
    );

    return {
      metadata: {
        reportType: 'agent-performance',
        generatedAt: new Date(),
        period: { startDate, endDate },
        totalRecords: agents.length
      },
      summary: {
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.isAvailableForMarking).length,
        totalListings: agentPerformance.reduce((sum, a) => sum + a.totalListings, 0),
        totalMarkingJobs: agentPerformance.reduce((sum, a) => sum + a.totalMarkingJobs, 0),
        averageReliability: agentPerformance.reduce((sum, a) => sum + a.reliabilityScore, 0) / agents.length
      },
      data: {
        agents: agentPerformance
      }
    };
  }

  /**
   * Generate property market report
   */
  async generateMarketReport(
    startDate: Date,
    endDate: Date,
    location?: { state?: string; city?: string }
  ): Promise<ReportData> {
    const whereClause: any = {
      createdAt: { gte: startDate, lte: endDate }
    };

    if (location?.state) whereClause.state = location.state;
    if (location?.city) whereClause.city = location.city;

    const properties = await prisma.property.findMany({
      where: whereClause,
      include: {
        rentals: true
      }
    });

    const priceStats = this.calculatePriceStatistics(properties);
    const typeDistribution = this.calculateTypeDistribution(properties);
    const locationDistribution = this.calculateLocationDistribution(properties);
    const occupancyRate = this.calculateOccupancyRate(properties);

    return {
      metadata: {
        reportType: 'market-analysis',
        generatedAt: new Date(),
        period: { startDate, endDate },
        location: location || 'All Locations'
      },
      summary: {
        totalProperties: properties.length,
        averagePrice: priceStats.average,
        medianPrice: priceStats.median,
        occupancyRate,
        mostPopularType: typeDistribution[0]?.type
      },
      data: {
        priceStatistics: priceStats,
        propertyTypes: typeDistribution,
        locations: locationDistribution,
        trends: await this.calculateMarketTrends(startDate, endDate, location)
      }
    };
  }

  /**
   * Export report to CSV
   */
  async exportToCSV(reportData: ReportData): Promise<string> {
    const flatData = this.flattenReportData(reportData);
    
    const parser = new Parser({
      fields: Object.keys(flatData[0] || {})
    });

    return parser.parse(flatData);
  }

  /**
   * Export report to Excel
   */
  async exportToExcel(reportData: ReportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Add metadata
    worksheet.addRow(['Report Type', reportData.metadata.reportType]);
    worksheet.addRow(['Generated At', reportData.metadata.generatedAt]);
    worksheet.addRow(['Period', 
      `${reportData.metadata.period.startDate} to ${reportData.metadata.period.endDate}`
    ]);
    worksheet.addRow([]);

    // Add summary
    if (reportData.summary) {
      worksheet.addRow(['Summary']);
      Object.entries(reportData.summary).forEach(([key, value]) => {
        worksheet.addRow([key, value]);
      });
      worksheet.addRow([]);
    }

    // Add data
    if (reportData.data) {
      const flatData = this.flattenReportData(reportData);
      if (flatData.length > 0) {
        const headers = Object.keys(flatData[0]);
        worksheet.addRow(headers);

        flatData.forEach(row => {
          worksheet.addRow(Object.values(row));
        });
      }
    }

    // Style the worksheet
    worksheet.getRow(1).font = { bold: true };
    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  /**
   * Schedule automated report generation
   */
  async scheduleReport(config: ReportConfig & { 
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  }) {
    // This would integrate with a job scheduler like Bull or node-cron
    // For now, return the config
    return {
      scheduled: true,
      config,
      nextRun: this.calculateNextRunTime(config.frequency)
    };
  }

  // Helper methods
  private async generateUserSection(startDate: Date, endDate: Date) {
    const [total, newUsers, verifiedUsers, premiumUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      prisma.user.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.user.count({ where: { isPremium: true } })
    ]);

    return {
      total,
      newUsers,
      verifiedUsers,
      premiumUsers,
      verificationRate: total > 0 ? (verifiedUsers / total) * 100 : 0
    };
  }

  private async generatePropertySection(startDate: Date, endDate: Date) {
    const [total, newListings, published, rented] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      prisma.property.count({ where: { status: 'PUBLISHED' } }),
      prisma.property.count({ where: { status: 'RENTED' } })
    ]);

    return { total, newListings, published, rented };
  }

  private async generateRevenueSection(startDate: Date, endDate: Date) {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startDate, lte: endDate }
      }
    });

    const total = payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const platformFee = payments.reduce((sum, p) => sum + (p.platformFee?.toNumber() || 0), 0);

    return {
      totalRevenue: total,
      platformRevenue: platformFee,
      transactionCount: payments.length
    };
  }

  private async generateAgentSection(startDate: Date, endDate: Date) {
    const agents = await prisma.user.count({ where: { role: 'AGENT' } });
    const activeAgents = await prisma.user.count({
      where: {
        role: 'AGENT',
        isAvailableForMarking: true
      }
    });

    return { totalAgents: agents, activeAgents };
  }

  private async generatePaymentSection(startDate: Date, endDate: Date) {
    const payments = await prisma.payment.groupBy({
      by: ['status', 'paymentType'],
      _count: true,
      _sum: { amount: true },
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    return payments;
  }

  private async generateMarketSection(startDate: Date, endDate: Date) {
    const avgPrice = await prisma.property.aggregate({
      _avg: { price: true },
      where: { price: { not: null } }
    });

    return {
      averagePrice: avgPrice._avg.price?.toNumber() || 0
    };
  }

  private groupPaymentsByPeriod(payments: any[], groupBy: string) {
    const grouped = new Map<string, number>();

    payments.forEach(payment => {
      let key: string;
      const date = new Date(payment.paidAt);

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const week = this.getWeekNumber(date);
        key = `${date.getFullYear()}-W${week}`;
      } else {
        key = date.toISOString().slice(0, 7);
      }

      grouped.set(key, (grouped.get(key) || 0) + payment.amount.toNumber());
    });

    return Array.from(grouped.entries()).map(([period, amount]) => ({
      period,
      amount
    }));
  }

  private calculateRevenueBreakdown(payments: any[]) {
    const total = payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const platformFee = payments.reduce((sum, p) => sum + (p.platformFee?.toNumber() || 0), 0);
    const agentCommissions = payments.reduce((sum, p) => sum + (p.agentCommission?.toNumber() || 0), 0);
    const ownerPayments = payments.reduce((sum, p) => sum + (p.ownerAmount?.toNumber() || 0), 0);

    return { total, platformFee, agentCommissions, ownerPayments };
  }

  private calculateCommissionBreakdown(payments: any[]) {
    const byType = new Map<string, number>();

    payments.forEach(payment => {
      const type = payment.paymentType;
      byType.set(type, (byType.get(type) || 0) + (payment.platformFee?.toNumber() || 0));
    });

    return Array.from(byType.entries()).map(([type, amount]) => ({
      type,
      amount
    }));
  }

  private async calculateAgentEarnings(
    agentId: string,
    startDate: Date,
    endDate: Date
  ) {
    const result = await prisma.payment.aggregate({
      _sum: { agentCommission: true },
      where: {
        status: 'SUCCESS',
        rental: {
          property: {
            agentId
          }
        },
        paidAt: { gte: startDate, lte: endDate }
      }
    });

    return result._sum.agentCommission || 0;
  }

  private async calculateReliabilityScore(agentId: string) {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { agentReliabilityScore: true }
    });

    return agent?.agentReliabilityScore?.toNumber() || 0;
  }

  private calculatePerformanceRating(agent: any): string {
    const score = agent.agentReliabilityScore?.toNumber() || 0;
    if (score >= 4.5) return 'Excellent';
    if (score >= 4.0) return 'Very Good';
    if (score >= 3.5) return 'Good';
    if (score >= 3.0) return 'Average';
    return 'Below Average';
  }

  private calculatePriceStatistics(properties: any[]) {
    const prices = properties
      .filter(p => p.price)
      .map(p => p.price.toNumber())
      .sort((a, b) => a - b);

    const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const median = prices[Math.floor(prices.length / 2)];
    const min = prices[0];
    const max = prices[prices.length - 1];

    return { average, median, min, max };
  }

  private calculateTypeDistribution(properties: any[]) {
    const distribution = new Map<string, number>();

    properties.forEach(property => {
      const type = property.propertyType;
      distribution.set(type, (distribution.get(type) || 0) + 1);
    });

    return Array.from(distribution.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateLocationDistribution(properties: any[]) {
    const distribution = new Map<string, number>();

    properties.forEach(property => {
      const location = `${property.city}, ${property.state}`;
      distribution.set(location, (distribution.get(location) || 0) + 1);
    });

    return Array.from(distribution.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateOccupancyRate(properties: any[]): number {
    const rented = properties.filter(p => p.rentals && p.rentals.length > 0).length;
    return properties.length > 0 ? (rented / properties.length) * 100 : 0;
  }

  private async calculateMarketTrends(
    startDate: Date,
    endDate: Date,
    location?: any
  ) {
    // Calculate month-over-month trends
    return {
      priceGrowth: 0,
      supplyGrowth: 0,
      demandGrowth: 0
    };
  }

  private flattenReportData(reportData: ReportData): any[] {
    const flatData: any[] = [];

    if (reportData.data) {
      if (Array.isArray(reportData.data)) {
        return reportData.data;
      }

      // Flatten nested objects
      Object.entries(reportData.data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => flatData.push({ section: key, ...item }));
        } else {
          flatData.push({ section: key, ...value });
        }
      });
    }

    return flatData;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private calculateNextRunTime(frequency: string): Date {
    const now = new Date();

    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
    }

    return now;
  }
}

export default new ReportingService();