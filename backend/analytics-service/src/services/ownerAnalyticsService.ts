import { PrismaClient, Role, PropertyStatus, PaymentStatus } from '@prisma/client';
import { calculateCommission, CommissionBreakdown } from '../../../shared/src/utils/commissionCalculator';

const prisma = new PrismaClient();

interface DateFilter {
  startDate?: Date;
  endDate?: Date;
}

interface PortfolioOverview {
  totalProperties: number;
  activeListings: number;
  rentedProperties: number;
  draftProperties: number;
  totalRevenue: number;
  totalCommissionEarned: number;
  averageOccupancyRate: number;
  portfolioValue: number;
}

interface RevenueAnalytics {
  totalRevenue: number;
  periodRevenue: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  revenueByProperty: Array<{ propertyId: string; propertyTitle: string; revenue: number }>;
  projectedRevenue: number;
  growthRate: number;
}

interface CommissionEarnings {
  totalEarnings: number;
  periodEarnings: number;
  listingAgentCommissions: number;
  subAgentCommissions: number;
  markingServiceEarnings: number;
  pendingCommissions: number;
  paidCommissions: number;
  commissionsByProperty: Array<{
    propertyId: string;
    propertyTitle: string;
    commission: number;
  }>;
}

export class OwnerAnalyticsService {
  /**
   * Get owner's portfolio overview
   */
  async getPortfolioOverview(userId: string): Promise<PortfolioOverview> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        properties: {
          include: {
            rentals: {
              include: {
                payments: true,
              },
            },
            units: true,
          },
        },
        agentListings: {
          include: {
            rentals: {
              include: {
                payments: true,
              },
            },
            units: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Combine owned and agent-listed properties
    const allProperties = [
      ...user.properties,
      ...user.agentListings.filter(
        (ap) => !user.properties.some((p) => p.id === ap.id)
      ),
    ];

    const totalProperties = allProperties.length;
    const activeListings = allProperties.filter(
      (p) => p.status === PropertyStatus.PUBLISHED && p.isAvailable
    ).length;
    const rentedProperties = allProperties.filter(
      (p) => p.status === PropertyStatus.RENTED
    ).length;
    const draftProperties = allProperties.filter(
      (p) => p.status === PropertyStatus.DRAFT
    ).length;

    // Calculate total revenue
    const totalRevenue = allProperties.reduce((sum, property) => {
      const propertyRevenue = property.rentals.reduce((rSum, rental) => {
        const paidPayments = rental.payments.filter(
          (p) => p.status === PaymentStatus.SUCCESS || p.status === PaymentStatus.RELEASED
        );
        return rSum + paidPayments.reduce((pSum, p) => pSum + Number(p.amount), 0);
      }, 0);
      return sum + propertyRevenue;
    }, 0);

    // Calculate total commission earned (for agents)
    const totalCommissionEarned = user.role === Role.AGENT
      ? allProperties.reduce((sum, property) => {
          const commissions = property.rentals.reduce((rSum, rental) => {
            const paidPayments = rental.payments.filter(
              (p) => p.status === PaymentStatus.RELEASED && p.agentCommission
            );
            return rSum + paidPayments.reduce((pSum, p) => pSum + Number(p.agentCommission || 0), 0);
          }, 0);
          return sum + commissions;
        }, 0)
      : 0;

    // Calculate average occupancy rate
    const totalUnits = allProperties.reduce((sum, p) => {
      if (p.structure === 'MULTI_FAMILY') {
        return sum + (p.totalUnits || 0);
      }
      return sum + 1;
    }, 0);

    const occupiedUnits = allProperties.reduce((sum, p) => {
      if (p.structure === 'MULTI_FAMILY') {
        return sum + ((p.totalUnits || 0) - (p.availableUnits || 0));
      }
      return sum + (p.status === PropertyStatus.RENTED ? 1 : 0);
    }, 0);

    const averageOccupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // Calculate portfolio value (sum of all property prices)
    const portfolioValue = allProperties.reduce((sum, property) => {
      if (property.structure === 'MULTI_FAMILY') {
        return sum + property.units.reduce((uSum, unit) => uSum + Number(unit.price), 0);
      }
      return sum + Number(property.price || 0);
    }, 0);

    return {
      totalProperties,
      activeListings,
      rentedProperties,
      draftProperties,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCommissionEarned: Math.round(totalCommissionEarned * 100) / 100,
      averageOccupancyRate: Math.round(averageOccupancyRate * 100) / 100,
      portfolioValue: Math.round(portfolioValue * 100) / 100,
    };
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(
    userId: string,
    options: DateFilter & { groupBy?: string }
  ): Promise<RevenueAnalytics> {
    const { startDate, endDate, groupBy = 'month' } = options;

    const whereClause: any = {
      OR: [{ ownerId: userId }, { agentId: userId }],
    };

    const properties = await prisma.property.findMany({
      where: whereClause,
      include: {
        rentals: {
          where: {
            ...(startDate && endDate
              ? {
                  createdAt: {
                    gte: startDate,
                    lte: endDate,
                  },
                }
              : {}),
          },
          include: {
            payments: {
              where: {
                status: {
                  in: [PaymentStatus.SUCCESS, PaymentStatus.RELEASED],
                },
              },
            },
          },
        },
      },
    });

    // Calculate total revenue
    const totalRevenue = properties.reduce((sum, property) => {
      return (
        sum +
        property.rentals.reduce((rSum, rental) => {
          return (
            rSum +
            rental.payments.reduce((pSum, p) => pSum + Number(p.amount), 0)
          );
        }, 0)
      );
    }, 0);

    // Calculate period revenue
    const periodRevenue = totalRevenue; // Already filtered by date

    // Group revenue by month
    const revenueByMonth = this.groupRevenueByPeriod(properties, groupBy);

    // Calculate revenue by property
    const revenueByProperty = properties.map((property) => {
      const revenue = property.rentals.reduce((sum, rental) => {
        return (
          sum +
          rental.payments.reduce((pSum, p) => pSum + Number(p.amount), 0)
        );
      }, 0);

      return {
        propertyId: property.id,
        propertyTitle: property.title,
        revenue: Math.round(revenue * 100) / 100,
      };
    });

    // Calculate projected revenue (simple projection based on current trend)
    const projectedRevenue = this.calculateProjectedRevenue(revenueByMonth);

    // Calculate growth rate
    const growthRate = this.calculateGrowthRate(revenueByMonth);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      periodRevenue: Math.round(periodRevenue * 100) / 100,
      revenueByMonth,
      revenueByProperty: revenueByProperty.sort((a, b) => b.revenue - a.revenue),
      projectedRevenue: Math.round(projectedRevenue * 100) / 100,
      growthRate: Math.round(growthRate * 100) / 100,
    };
  }

  /**
   * Get commission earnings breakdown
   */
  async getCommissionEarnings(
    userId: string,
    filters: DateFilter
  ): Promise<CommissionEarnings> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.AGENT) {
      throw new Error('Only agents can view commission earnings');
    }

    const { startDate, endDate } = filters;

    // Get all properties where user is the agent
    const properties = await prisma.property.findMany({
      where: {
        agentId: userId,
      },
      include: {
        rentals: {
          where: {
            ...(startDate && endDate
              ? {
                  createdAt: {
                    gte: startDate,
                    lte: endDate,
                  },
                }
              : {}),
          },
          include: {
            payments: true,
          },
        },
      },
    });

    let totalEarnings = 0;
    let pendingCommissions = 0;
    let paidCommissions = 0;
    let listingAgentCommissions = 0;

    const commissionsByProperty: Array<{
      propertyId: string;
      propertyTitle: string;
      commission: number;
    }> = [];

    properties.forEach((property) => {
      let propertyCommission = 0;

      property.rentals.forEach((rental) => {
        rental.payments.forEach((payment) => {
          if (payment.agentCommission) {
            const commission = Number(payment.agentCommission);
            propertyCommission += commission;
            totalEarnings += commission;
            listingAgentCommissions += commission;

            if (payment.status === PaymentStatus.RELEASED && payment.isReleased) {
              paidCommissions += commission;
            } else {
              pendingCommissions += commission;
            }
          }
        });
      });

      if (propertyCommission > 0) {
        commissionsByProperty.push({
          propertyId: property.id,
          propertyTitle: property.title,
          commission: Math.round(propertyCommission * 100) / 100,
        });
      }
    });

    // Get marking service earnings
    const markingJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        assignedAgentId: userId,
        status: 'COMPLETED',
        ...(startDate && endDate
          ? {
              completedAt: {
                gte: startDate,
                lte: endDate,
              },
            }
          : {}),
      },
    });

    const markingServiceEarnings = markingJobs.reduce(
      (sum, job) => sum + Number(job.markingFee) * 0.25, // 25% of marking fee goes to agent
      0
    );

    return {
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      periodEarnings: Math.round(totalEarnings * 100) / 100,
      listingAgentCommissions: Math.round(listingAgentCommissions * 100) / 100,
      subAgentCommissions: 0, // Will be calculated separately for sub-agents
      markingServiceEarnings: Math.round(markingServiceEarnings * 100) / 100,
      pendingCommissions: Math.round(pendingCommissions * 100) / 100,
      paidCommissions: Math.round(paidCommissions * 100) / 100,
      commissionsByProperty: commissionsByProperty.sort((a, b) => b.commission - a.commission),
    };
  }

  /**
   * Get agent referral analytics
   */
  async getReferralAnalytics(
    userId: string,
    filters: DateFilter
  ): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.AGENT) {
      throw new Error('Only agents can view referral analytics');
    }

    const { startDate, endDate } = filters;

    // Get event logs for property views via shareable links
    // This would track when users view properties through agent's promotion links
    const referralEvents = await prisma.eventLog.findMany({
      where: {
        type: 'PROPERTY_VIEWED_VIA_REFERRAL',
        metadata: {
          path: ['agentId'],
          equals: userId,
        },
        ...(startDate && endDate
          ? {
              timestamp: {
                gte: startDate,
                lte: endDate,
              },
            }
          : {}),
      },
    });

    // Group by property
    const viewsByProperty = new Map<string, number>();
    referralEvents.forEach((event: any) => {
      const propertyId = event.metadata?.propertyId;
      if (propertyId) {
        viewsByProperty.set(propertyId, (viewsByProperty.get(propertyId) || 0) + 1);
      }
    });

    // Get conversions (payments made through referral links)
    const referralPayments = await prisma.payment.findMany({
      where: {
        status: {
          in: [PaymentStatus.SUCCESS, PaymentStatus.RELEASED],
        },
        rental: {
          property: {
            // This would need a referredBy field in the rental model
            // For now, we'll use a simplified approach
          },
        },
        ...(startDate && endDate
          ? {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            }
          : {}),
      },
      include: {
        rental: {
          include: {
            property: true,
          },
        },
      },
    });

    const totalReferralViews = referralEvents.length;
    const uniqueProperties = viewsByProperty.size;
    const totalConversions = referralPayments.length;
    const conversionRate = totalReferralViews > 0 
      ? (totalConversions / totalReferralViews) * 100 
      : 0;

    // Calculate earnings from referrals
    const referralEarnings = referralPayments.reduce((sum, payment) => {
      return sum + Number(payment.agentCommission || 0);
    }, 0);

    return {
      totalReferralViews,
      uniqueProperties,
      totalConversions,
      conversionRate: Math.round(conversionRate * 100) / 100,
      referralEarnings: Math.round(referralEarnings * 100) / 100,
      topPerformingProperties: Array.from(viewsByProperty.entries())
        .map(([propertyId, views]) => ({ propertyId, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10),
    };
  }

  /**
   * Get occupancy analytics
   */
  async getOccupancyAnalytics(
    userId: string,
    period: string
  ): Promise<any> {
    const properties = await prisma.property.findMany({
      where: {
        OR: [{ ownerId: userId }, { agentId: userId }],
      },
      include: {
        rentals: {
          where: {
            status: 'ACTIVE',
          },
        },
        units: true,
      },
    });

    // Calculate current occupancy
    const totalUnits = properties.reduce((sum, p) => {
      if (p.structure === 'MULTI_FAMILY') {
        return sum + (p.totalUnits || 0);
      }
      return sum + 1;
    }, 0);

    const occupiedUnits = properties.reduce((sum, p) => {
      if (p.structure === 'MULTI_FAMILY') {
        return sum + ((p.totalUnits || 0) - (p.availableUnits || 0));
      }
      return sum + (p.status === PropertyStatus.RENTED ? 1 : 0);
    }, 0);

    const currentOccupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // Calculate occupancy by property
    const occupancyByProperty = properties.map((property) => {
      let totalPropertyUnits: number;
      let occupiedPropertyUnits: number;

      if (property.structure === 'MULTI_FAMILY') {
        totalPropertyUnits = property.totalUnits || 0;
        occupiedPropertyUnits = totalPropertyUnits - (property.availableUnits || 0);
      } else {
        totalPropertyUnits = 1;
        occupiedPropertyUnits = property.status === PropertyStatus.RENTED ? 1 : 0;
      }

      const occupancyRate = totalPropertyUnits > 0 
        ? (occupiedPropertyUnits / totalPropertyUnits) * 100 
        : 0;

      return {
        propertyId: property.id,
        propertyTitle: property.title,
        totalUnits: totalPropertyUnits,
        occupiedUnits: occupiedPropertyUnits,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
      };
    });

    // Historical occupancy (if period is 'historical')
    let historicalData: Array<{ month: string; occupancyRate: number }> = [];
    
    if (period === 'historical') {
      historicalData = await this.calculateHistoricalOccupancy(userId, 12); // Last 12 months
    }

    return {
      currentOccupancy: {
        totalUnits,
        occupiedUnits,
        vacantUnits: totalUnits - occupiedUnits,
        occupancyRate: Math.round(currentOccupancyRate * 100) / 100,
      },
      occupancyByProperty: occupancyByProperty.sort((a, b) => b.occupancyRate - a.occupancyRate),
      historicalData,
      averageOccupancyRate: Math.round(currentOccupancyRate * 100) / 100,
    };
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(
    userId: string,
    months: number
  ): Promise<any> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get monthly metrics
    const properties = await prisma.property.findMany({
      where: {
        OR: [{ ownerId: userId }, { agentId: userId }],
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        rentals: {
          include: {
            payments: {
              where: {
                status: {
                  in: [PaymentStatus.SUCCESS, PaymentStatus.RELEASED],
                },
              },
            },
          },
        },
      },
    });

    // Get view events
    const viewEvents = await prisma.eventLog.findMany({
      where: {
        type: 'PROPERTY_VIEWED',
        timestamp: {
          gte: startDate,
        },
      },
    });

    // Group data by month
    const monthlyData = new Map<string, any>();

    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      monthlyData.set(monthKey, {
        month: monthKey,
        views: 0,
        rentals: 0,
        revenue: 0,
        newListings: 0,
      });
    }

    // Populate view data
    viewEvents.forEach((event) => {
      const monthKey = `${event.timestamp.getFullYear()}-${String(
        event.timestamp.getMonth() + 1
      ).padStart(2, '0')}`;
      
      if (monthlyData.has(monthKey)) {
        const data = monthlyData.get(monthKey);
        data.views += 1;
      }
    });

    // Populate rental and revenue data
    properties.forEach((property) => {
      const createdMonthKey = `${property.createdAt.getFullYear()}-${String(
        property.createdAt.getMonth() + 1
      ).padStart(2, '0')}`;
      
      if (monthlyData.has(createdMonthKey)) {
        const data = monthlyData.get(createdMonthKey);
        data.newListings += 1;
      }

      property.rentals.forEach((rental) => {
        const rentalMonthKey = `${rental.createdAt.getFullYear()}-${String(
          rental.createdAt.getMonth() + 1
        ).padStart(2, '0')}`;
        
        if (monthlyData.has(rentalMonthKey)) {
          const data = monthlyData.get(rentalMonthKey);
          data.rentals += 1;
          
          rental.payments.forEach((payment) => {
            data.revenue += Number(payment.amount);
          });
        }
      });
    });

    const trends = Array.from(monthlyData.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((data) => ({
        ...data,
        revenue: Math.round(data.revenue * 100) / 100,
      }));

    return {
      trends,
      summary: {
        totalViews: trends.reduce((sum, t) => sum + t.views, 0),
        totalRentals: trends.reduce((sum, t) => sum + t.rentals, 0),
        totalRevenue: Math.round(trends.reduce((sum, t) => sum + t.revenue, 0) * 100) / 100,
        totalNewListings: trends.reduce((sum, t) => sum + t.newListings, 0),
      },
    };
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary(
    userId: string,
    filters: DateFilter
  ): Promise<any> {
    const { startDate, endDate } = filters;

    const properties = await prisma.property.findMany({
      where: {
        OR: [{ ownerId: userId }, { agentId: userId }],
      },
      include: {
        rentals: {
          where: {
            ...(startDate && endDate
              ? {
                  createdAt: {
                    gte: startDate,
                    lte: endDate,
                  },
                }
              : {}),
          },
          include: {
            payments: {
              where: {
                status: {
                  in: [PaymentStatus.SUCCESS, PaymentStatus.RELEASED],
                },
              },
            },
          },
        },
        virtualAccount: true,
      },
    });

    // Calculate total income
    const totalIncome = properties.reduce((sum, property) => {
      return (
        sum +
        property.rentals.reduce((rSum, rental) => {
          return (
            rSum +
            rental.payments.reduce((pSum, p) => pSum + Number(p.ownerAmount || p.amount), 0)
          );
        }, 0)
      );
    }, 0);

    // Calculate total commission earned (for agents)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const totalCommissions = user?.role === Role.AGENT
      ? properties.reduce((sum, property) => {
          return (
            sum +
            property.rentals.reduce((rSum, rental) => {
              return (
                rSum +
                rental.payments.reduce((pSum, p) => pSum + Number(p.agentCommission || 0), 0)
              );
            }, 0)
          );
        }, 0)
      : 0;

    // Calculate platform fees paid
    const platformFees = properties.reduce((sum, property) => {
      return (
        sum +
        property.rentals.reduce((rSum, rental) => {
          return (
            rSum +
            rental.payments.reduce((pSum, p) => pSum + Number(p.platformFee || 0), 0)
          );
        }, 0)
      );
    }, 0);

    // Get virtual account balance
    const virtualAccounts = await prisma.virtualAccount.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    const availableBalance = virtualAccounts.reduce(
      (sum, account) => sum + Number(account.balance),
      0
    );

    // Calculate pending payments
    const pendingPayments = await prisma.payment.findMany({
      where: {
        userId,
        status: PaymentStatus.HELD,
      },
    });

    const pendingAmount = pendingPayments.reduce(
      (sum, payment) => sum + Number(payment.ownerAmount || payment.amount),
      0
    );

    return {
      income: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalCommissions: Math.round(totalCommissions * 100) / 100,
        netIncome: Math.round((totalIncome + totalCommissions - platformFees) * 100) / 100,
      },
      expenses: {
        platformFees: Math.round(platformFees * 100) / 100,
      },
      balance: {
        availableBalance: Math.round(availableBalance * 100) / 100,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        totalBalance: Math.round((availableBalance + pendingAmount) * 100) / 100,
      },
      summary: {
        totalEarnings: Math.round((totalIncome + totalCommissions) * 100) / 100,
        totalDeductions: Math.round(platformFees * 100) / 100,
        netEarnings: Math.round((totalIncome + totalCommissions - platformFees) * 100) / 100,
      },
    };
  }

  /**
   * Get marking service analytics
   */
  async getMarkingServiceAnalytics(
    userId: string,
    filters: DateFilter
  ): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.AGENT) {
      throw new Error('Only agents can view marking service analytics');
    }

    const { startDate, endDate } = filters;

    const markingJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        assignedAgentId: userId,
        ...(startDate && endDate
          ? {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            }
          : {}),
      },
      include: {
        property: true,
      },
    });

    const totalJobs = markingJobs.length;
    const completedJobs = markingJobs.filter((j) => j.status === 'COMPLETED').length;
    const inProgressJobs = markingJobs.filter((j) => j.status === 'IN_PROGRESS').length;
    const cancelledJobs = markingJobs.filter((j) => j.status === 'CANCELLED').length;

    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    // Calculate earnings
    const totalEarnings = markingJobs
      .filter((j) => j.status === 'COMPLETED')
      .reduce((sum, job) => sum + Number(job.markingFee) * 0.25, 0); // 25% commission

    // Calculate average completion time
    const completedJobsWithTime = markingJobs.filter(
      (j) => j.status === 'COMPLETED' && j.completedAt && j.assignedAt
    );

    const averageCompletionTime = completedJobsWithTime.length > 0
      ? completedJobsWithTime.reduce((sum, job) => {
          const hours = (job.completedAt!.getTime() - job.assignedAt!.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / completedJobsWithTime.length
      : 0;

    return {
      totalJobs,
      completedJobs,
      inProgressJobs,
      cancelledJobs,
      completionRate: Math.round(completionRate * 100) / 100,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
      reliabilityScore: user.agentReliabilityScore ? Number(user.agentReliabilityScore) : 0,
      jobsByStatus: {
        queued: markingJobs.filter((j) => j.status === 'QUEUED').length,
        assigned: markingJobs.filter((j) => j.status === 'ASSIGNED').length,
        inProgress: inProgressJobs,
        completed: completedJobs,
        cancelled: cancelledJobs,
        expired: markingJobs.filter((j) => j.status === 'EXPIRED').length,
      },
    };
  }

  /**
   * Export analytics data
   */
  async exportAnalyticsData(
    userId: string,
    options: { format: string; startDate?: Date; endDate?: Date }
  ): Promise<any> {
    const { format, startDate, endDate } = options;

    // Gather all analytics data
    const portfolio = await this.getPortfolioOverview(userId);
    const revenue = await this.getRevenueAnalytics(userId, { startDate, endDate });
    const financial = await this.getFinancialSummary(userId, { startDate, endDate });

    const exportData = {
      generatedAt: new Date().toISOString(),
      userId,
      period: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      },
      portfolio,
      revenue,
      financial,
    };

    // In a real implementation, you would convert this to CSV, PDF, or XLSX
    // For now, return the structured data with a download URL
    return {
      format,
      data: exportData,
      downloadUrl: `/api/analytics/download/${userId}/${Date.now()}.${format}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  // Helper methods

  private groupRevenueByPeriod(
    properties: any[],
    groupBy: string
  ): Array<{ month: string; revenue: number }> {
    const grouped = new Map<string, number>();

    properties.forEach((property) => {
      property.rentals.forEach((rental: any) => {
        rental.payments.forEach((payment: any) => {
          const date = new Date(payment.createdAt);
          let key: string;

          switch (groupBy) {
            case 'day':
              key = date.toISOString().split('T')[0];
              break;
            case 'week':
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay());
              key = weekStart.toISOString().split('T')[0];
              break;
            case 'month':
              key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              break;
            case 'year':
              key = String(date.getFullYear());
              break;
            default:
              key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          }

          grouped.set(key, (grouped.get(key) || 0) + Number(payment.amount));
        });
      });
    });

    return Array.from(grouped.entries())
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateProjectedRevenue(revenueByMonth: Array<{ month: string; revenue: number }>): number {
    if (revenueByMonth.length < 2) return 0;

    // Simple linear projection based on last 3 months average
    const recentMonths = revenueByMonth.slice(-3);
    const averageRevenue = recentMonths.reduce((sum, m) => sum + m.revenue, 0) / recentMonths.length;

    return averageRevenue;
  }

  private calculateGrowthRate(revenueByMonth: Array<{ month: string; revenue: number }>): number {
    if (revenueByMonth.length < 2) return 0;

    const current = revenueByMonth[revenueByMonth.length - 1].revenue;
    const previous = revenueByMonth[revenueByMonth.length - 2].revenue;

    if (previous === 0) return 0;

    return ((current - previous) / previous) * 100;
  }

  private async calculateHistoricalOccupancy(
    userId: string,
    months: number
  ): Promise<Array<{ month: string; occupancyRate: number }>> {
    const historicalData: Array<{ month: string; occupancyRate: number }> = [];

    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      // In a real implementation, you would query historical snapshots
      // For now, use current occupancy as placeholder
      historicalData.push({
        month: monthKey,
        occupancyRate: 75 + Math.random() * 20, // Mock data
      });
    }

    return historicalData.reverse();
  }
}