import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type IntervalType = 'day' | 'week' | 'month';

export class AggregationService {
  /**
   * Aggregate data by time interval
   */
  async aggregateByInterval(
    model: string,
    startDate: Date,
    endDate: Date,
    dateField: string,
    interval: IntervalType
  ) {
    const data = await this.fetchData(model, startDate, endDate, dateField);
    return this.groupByInterval(data, dateField, interval);
  }

  /**
   * Aggregate data by day
   */
  async aggregateByDay(
    model: string,
    startDate: Date,
    endDate: Date,
    dateField: string
  ) {
    return this.aggregateByInterval(model, startDate, endDate, dateField, 'day');
  }

  /**
   * Aggregate revenue data
   */
  async aggregateRevenue(
    startDate: Date,
    endDate: Date,
    interval: IntervalType
  ) {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startDate, lte: endDate }
      },
      select: {
        amount: true,
        platformFee: true,
        paidAt: true
      },
      orderBy: { paidAt: 'asc' }
    });

    const grouped = new Map<string, { revenue: number; platformFee: number; count: number }>();

    payments.forEach(payment => {
      const key = this.getIntervalKey(payment.paidAt, interval);
      const existing = grouped.get(key) || { revenue: 0, platformFee: 0, count: 0 };
      
      grouped.set(key, {
        revenue: existing.revenue + Number(payment.amount),
        platformFee: existing.platformFee + Number(payment.platformFee || 0),
        count: existing.count + 1
      });
    });

    return Array.from(grouped.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        platformFee: data.platformFee,
        transactionCount: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Aggregate user activity
   */
  async aggregateUserActivity(
    startDate: Date,
    endDate: Date,
    interval: IntervalType
  ) {
    const events = await prisma.eventLog.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate }
      },
      select: {
        type: true,
        userId: true,
        timestamp: true
      },
      orderBy: { timestamp: 'asc' }
    });

    const grouped = new Map<string, { events: number; uniqueUsers: Set<string> }>();

    events.forEach(event => {
      const key = this.getIntervalKey(event.timestamp, interval);
      const existing = grouped.get(key) || { events: 0, uniqueUsers: new Set() };
      
      existing.events++;
      if (event.userId) {
        existing.uniqueUsers.add(event.userId);
      }

      grouped.set(key, existing);
    });

    return Array.from(grouped.entries())
      .map(([date, data]) => ({
        date,
        totalEvents: data.events,
        uniqueUsers: data.uniqueUsers.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Aggregate property metrics
   */
  async aggregatePropertyMetrics(
    startDate: Date,
    endDate: Date,
    interval: IntervalType
  ) {
    const properties = await prisma.property.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      select: {
        createdAt: true,
        status: true,
        propertyType: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const grouped = new Map<string, {
      total: number;
      byStatus: Map<string, number>;
      byType: Map<string, number>;
    }>();

    properties.forEach(property => {
      const key = this.getIntervalKey(property.createdAt, interval);
      const existing = grouped.get(key) || {
        total: 0,
        byStatus: new Map(),
        byType: new Map()
      };

      existing.total++;
      existing.byStatus.set(
        property.status,
        (existing.byStatus.get(property.status) || 0) + 1
      );
      existing.byType.set(
        property.propertyType,
        (existing.byType.get(property.propertyType) || 0) + 1
      );

      grouped.set(key, existing);
    });

    return Array.from(grouped.entries())
      .map(([date, data]) => ({
        date,
        total: data.total,
        byStatus: Object.fromEntries(data.byStatus),
        byType: Object.fromEntries(data.byType)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Aggregate marking job metrics
   */
  async aggregateMarkingJobMetrics(
    startDate: Date,
    endDate: Date,
    interval: IntervalType
  ) {
    const jobs = await prisma.propertyMarkingJob.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      select: {
        createdAt: true,
        status: true,
        markingFee: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const grouped = new Map<string, {
      total: number;
      completed: number;
      revenue: number;
      byStatus: Map<string, number>;
    }>();

    jobs.forEach(job => {
      const key = this.getIntervalKey(job.createdAt, interval);
      const existing = grouped.get(key) || {
        total: 0,
        completed: 0,
        revenue: 0,
        byStatus: new Map()
      };

      existing.total++;
      if (job.status === 'COMPLETED') {
        existing.completed++;
        existing.revenue += Number(job.markingFee) * 0.75; // 75% platform fee
      }
      existing.byStatus.set(
        job.status,
        (existing.byStatus.get(job.status) || 0) + 1
      );

      grouped.set(key, existing);
    });

    return Array.from(grouped.entries())
      .map(([date, data]) => ({
        date,
        total: data.total,
        completed: data.completed,
        revenue: data.revenue,
        byStatus: Object.fromEntries(data.byStatus)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Aggregate conversion funnel
   */
  async aggregateConversionFunnel(startDate: Date, endDate: Date) {
    const [
      signups,
      verified,
      withListings,
      withPayments
    ] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          verificationStatus: 'VERIFIED'
        }
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          properties: { some: {} }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          payments: { some: { status: 'SUCCESS' } }
        }
      })
    ]);

    return {
      signups,
      verified,
      verificationRate: signups > 0 ? (verified / signups) * 100 : 0,
      withListings,
      listingRate: signups > 0 ? (withListings / signups) * 100 : 0,
      withPayments,
      paymentRate: signups > 0 ? (withPayments / signups) * 100 : 0
    };
  }

  /**
   * Aggregate cohort analysis
   */
  async aggregateCohortAnalysis(cohortDate: Date, weeks: number = 8) {
    const cohortStart = new Date(cohortDate);
    cohortStart.setHours(0, 0, 0, 0);
    
    const cohortEnd = new Date(cohortStart);
    cohortEnd.setDate(cohortEnd.getDate() + 7); // 1 week cohort

    // Get users in cohort
    const cohortUsers = await prisma.user.findMany({
      where: {
        createdAt: { gte: cohortStart, lt: cohortEnd }
      },
      select: { id: true }
    });

    const cohortUserIds = cohortUsers.map(u => u.id);
    const cohortSize = cohortUserIds.length;

    // Track retention for each week
    const retention: Array<{
      week: number;
      activeUsers: number;
      retentionRate: number;
    }> = [];

    for (let week = 0; week < weeks; week++) {
      const weekStart = new Date(cohortStart);
      weekStart.setDate(weekStart.getDate() + (week * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const activeUsers = await prisma.eventLog.groupBy({
        by: ['userId'],
        where: {
          userId: { in: cohortUserIds },
          timestamp: { gte: weekStart, lt: weekEnd }
        }
      });

      retention.push({
        week,
        activeUsers: activeUsers.length,
        retentionRate: cohortSize > 0 ? (activeUsers.length / cohortSize) * 100 : 0
      });
    }

    return {
      cohortDate: cohortStart,
      cohortSize,
      retention
    };
  }

  // Private helper methods

  private async fetchData(
    model: string,
    startDate: Date,
    endDate: Date,
    dateField: string
  ): Promise<any[]> {
    const modelName = model as keyof typeof prisma;
    
    if (!(modelName in prisma)) {
      throw new Error(`Invalid model: ${model}`);
    }

    const modelDelegate = (prisma as any)[modelName];
    
    return modelDelegate.findMany({
      where: {
        [dateField]: { gte: startDate, lte: endDate }
      },
      orderBy: { [dateField]: 'asc' }
    });
  }

  private groupByInterval(
    data: any[],
    dateField: string,
    interval: IntervalType
  ) {
    const grouped = new Map<string, number>();
    let cumulative = 0;

    data.forEach(item => {
      const key = this.getIntervalKey(item[dateField], interval);
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([date, count]) => {
        cumulative += count;
        return { date, count, cumulative };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getIntervalKey(date: Date, interval: IntervalType): string {
    const d = new Date(date);
    
    switch (interval) {
      case 'day':
        return d.toISOString().split('T')[0];
      
      case 'week':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().split('T')[0];
      
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      default:
        return d.toISOString().split('T')[0];
    }
  }
}