import { PrismaClient, Payment, Property, Rental } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

interface CommissionBreakdown {
  totalRent: Decimal;
  platformCommission: Decimal; // 20% of rent
  agentShare: Decimal; // 50% of platform commission
  listingAgentShare: Decimal;
  subAgentShare: Decimal;
  ownerShare: Decimal;
  newCondoShare: Decimal;
}

interface CommissionDistribution {
  ownerId: string;
  ownerAmount: Decimal;
  listingAgentId?: string;
  listingAgentAmount?: Decimal;
  subAgentId?: string;
  subAgentAmount?: Decimal;
  newCondoAmount: Decimal;
  platformFee: Decimal;
}

export class CommissionService {
  /**
   * Calculate commission breakdown for a rental payment
   */
  async calculateCommission(
    payment: Payment & { rental: Rental & { property: Property } }
  ): Promise<CommissionBreakdown> {
    const rental = payment.rental;
    const property = rental.property;
    const totalRent = payment.amount;

    // Platform takes 20% commission
    const platformCommission = totalRent.mul(new Decimal(0.2));
    
    // Agent gets 50% of platform commission (10% of total rent)
    const agentShare = platformCommission.mul(new Decimal(0.5));
    
    // NewCondo gets the remaining 50% of platform commission (10% of total rent)
    let newCondoShare = platformCommission.mul(new Decimal(0.5));
    
    let listingAgentShare = new Decimal(0);
    let subAgentShare = new Decimal(0);

    // Check if there's a listing agent
    if (property.agentId) {
      // Check if payment came through a sub-agent referral link
      const subAgentId = await this.getSubAgentFromPayment(payment.id);
      
      if (subAgentId && subAgentId !== property.agentId) {
        // Split agent share 50/50 between listing agent and sub-agent
        listingAgentShare = agentShare.mul(new Decimal(0.5));
        subAgentShare = agentShare.mul(new Decimal(0.5));
      } else {
        // Listing agent gets full agent share
        listingAgentShare = agentShare;
      }
    } else {
      // No agent involved, NewCondo gets full 20% commission
      newCondoShare = platformCommission;
    }

    // Owner gets 80% of rent (total rent - platform commission)
    const ownerShare = totalRent.sub(platformCommission);

    return {
      totalRent,
      platformCommission,
      agentShare,
      listingAgentShare,
      subAgentShare,
      ownerShare,
      newCondoShare,
    };
  }

  /**
   * Distribute commission to all parties involved
   */
  async distributeCommission(
    paymentId: string
  ): Promise<CommissionDistribution> {
    // Get payment with all related data
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        rental: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!payment || !payment.rental) {
      throw new Error('Payment or rental not found');
    }

    const property = payment.rental.property;
    const breakdown = await this.calculateCommission(payment as any);

    // Get sub-agent if exists
    const subAgentId = await this.getSubAgentFromPayment(paymentId);

    // Update virtual account balances
    await this.updateVirtualAccountBalances({
      ownerId: property.ownerId,
      ownerAmount: breakdown.ownerShare,
      listingAgentId: property.agentId || undefined,
      listingAgentAmount: breakdown.listingAgentShare.greaterThan(0) 
        ? breakdown.listingAgentShare 
        : undefined,
      subAgentId: subAgentId || undefined,
      subAgentAmount: breakdown.subAgentShare.greaterThan(0) 
        ? breakdown.subAgentShare 
        : undefined,
      newCondoAmount: breakdown.newCondoShare,
    });

    // Update payment record with commission breakdown
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        agentCommission: breakdown.listingAgentShare.add(breakdown.subAgentShare),
        platformFee: breakdown.newCondoShare,
        ownerAmount: breakdown.ownerShare,
        isReleased: true,
        releasedAt: new Date(),
      },
    });

    return {
      ownerId: property.ownerId,
      ownerAmount: breakdown.ownerShare,
      listingAgentId: property.agentId || undefined,
      listingAgentAmount: breakdown.listingAgentShare.greaterThan(0) 
        ? breakdown.listingAgentShare 
        : undefined,
      subAgentId: subAgentId || undefined,
      subAgentAmount: breakdown.subAgentShare.greaterThan(0) 
        ? breakdown.subAgentShare 
        : undefined,
      newCondoAmount: breakdown.newCondoShare,
      platformFee: breakdown.newCondoShare,
    };
  }

  /**
   * Update virtual account balances for all parties
   */
  private async updateVirtualAccountBalances(
    distribution: Omit<CommissionDistribution, 'platformFee'>
  ): Promise<void> {
    const updates: Promise<any>[] = [];

    // Update owner's virtual account
    updates.push(
      prisma.virtualAccount.updateMany({
        where: { userId: distribution.ownerId },
        data: {
          balance: {
            increment: distribution.ownerAmount,
          },
        },
      })
    );

    // Update listing agent's virtual account
    if (distribution.listingAgentId && distribution.listingAgentAmount) {
      updates.push(
        prisma.virtualAccount.updateMany({
          where: { userId: distribution.listingAgentId },
          data: {
            balance: {
              increment: distribution.listingAgentAmount,
            },
          },
        })
      );
    }

    // Update sub-agent's virtual account
    if (distribution.subAgentId && distribution.subAgentAmount) {
      updates.push(
        prisma.virtualAccount.updateMany({
          where: { userId: distribution.subAgentId },
          data: {
            balance: {
              increment: distribution.subAgentAmount,
            },
          },
        })
      );
    }

    // Update NewCondo's virtual account (admin account)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (adminUser) {
      updates.push(
        prisma.virtualAccount.updateMany({
          where: { userId: adminUser.id },
          data: {
            balance: {
              increment: distribution.newCondoAmount,
            },
          },
        })
      );
    }

    await Promise.all(updates);
  }

  /**
   * Get sub-agent ID from payment metadata
   * This assumes you store the referral/sub-agent info when payment is created
   */
  private async getSubAgentFromPayment(paymentId: string): Promise<string | null> {
    // Implementation depends on how you track sub-agent referrals
    // You might store this in EventLog or a separate ReferralTracking table
    const event = await prisma.eventLog.findFirst({
      where: {
        type: 'PAYMENT_CREATED',
        metadata: {
          path: ['paymentId'],
          equals: paymentId,
        },
      },
    });

    if (event && typeof event.metadata === 'object' && event.metadata !== null) {
      const metadata = event.metadata as any;
      return metadata.subAgentId || null;
    }

    return null;
  }

  /**
   * Calculate total commissions for a date range (for analytics)
   */
  async calculateTotalCommissions(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalPlatformCommission: Decimal;
    totalAgentCommission: Decimal;
    totalOwnerPayouts: Decimal;
  }> {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'RELEASED',
        releasedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let totalPlatformCommission = new Decimal(0);
    let totalAgentCommission = new Decimal(0);
    let totalOwnerPayouts = new Decimal(0);

    for (const payment of payments) {
      totalPlatformCommission = totalPlatformCommission.add(
        payment.platformFee || new Decimal(0)
      );
      totalAgentCommission = totalAgentCommission.add(
        payment.agentCommission || new Decimal(0)
      );
      totalOwnerPayouts = totalOwnerPayouts.add(
        payment.ownerAmount || new Decimal(0)
      );
    }

    return {
      totalPlatformCommission,
      totalAgentCommission,
      totalOwnerPayouts,
    };
  }

  /**
   * Get commission breakdown for a specific user
   */
  async getUserCommissionSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalEarned: Decimal;
    totalCommissions: Decimal;
    paymentCount: number;
  }> {
    const whereClause: any = {
      OR: [
        { rental: { property: { ownerId: userId } } },
        { rental: { property: { agentId: userId } } },
      ],
      status: 'RELEASED',
    };

    if (startDate && endDate) {
      whereClause.releasedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        rental: {
          include: {
            property: true,
          },
        },
      },
    });

    let totalEarned = new Decimal(0);
    let totalCommissions = new Decimal(0);

    for (const payment of payments) {
      if (payment.rental?.property.ownerId === userId) {
        totalEarned = totalEarned.add(payment.ownerAmount || new Decimal(0));
      }
      if (payment.rental?.property.agentId === userId) {
        totalCommissions = totalCommissions.add(payment.agentCommission || new Decimal(0));
      }
    }

    return {
      totalEarned: totalEarned.add(totalCommissions),
      totalCommissions,
      paymentCount: payments.length,
    };
  }
}

export const commissionService = new CommissionService();