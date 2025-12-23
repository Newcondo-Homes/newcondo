// backend/referral-service/src/services/commissionService.ts

import { PrismaClient } from '@newcondo/db';
import { calculateCommissionSplit } from '../utils/rewardCalculator';
import { COMMISSION_RATES } from '../config/rewards';

const prisma = new PrismaClient();

export class CommissionService {
  /**
   * Calculate commission for a rent payment
   */
  async calculateRentCommission(paymentId: string): Promise<{
    platformFee: number;
    listingAgentCommission: number;
    subAgentCommission: number;
    ownerAmount: number;
  }> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        rental: {
          include: {
            property: {
              include: {
                agent: true,
              },
            },
          },
        },
      },
    });

    if (!payment || !payment.rental) {
      throw new Error('Payment or rental not found');
    }

    const rentAmount = Number(payment.amount);
    const hasListingAgent = !!payment.rental.property.agentId;

    // Check if payment came through a sub-agent referral
    const agentReferral = await prisma.agentReferralConversion.findUnique({
      where: { paymentId },
      include: {
        referral: {
          include: {
            agent: true,
          },
        },
      },
    });

    const hasSubAgent = !!agentReferral;

    return calculateCommissionSplit(rentAmount, hasListingAgent, hasSubAgent);
  }

  /**
   * Distribute commission after confirmation period
   */
  async distributeCommission(paymentId: string): Promise<void> {
    const commission = await this.calculateRentCommission(paymentId);

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        rental: {
          include: {
            property: {
              include: {
                owner: {
                  include: {
                    virtualAccounts: true,
                  },
                },
                agent: {
                  include: {
                    virtualAccounts: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment || !payment.rental) {
      throw new Error('Payment or rental not found');
    }

    // Get virtual accounts
    const ownerVA = payment.rental.property.owner.virtualAccounts[0];
    const agentVA = payment.rental.property.agent?.virtualAccounts[0];

    // Get sub-agent if exists
    const agentReferral = await prisma.agentReferralConversion.findUnique({
      where: { paymentId },
      include: {
        referral: {
          include: {
            agent: {
              include: {
                virtualAccounts: true,
              },
            },
          },
        },
      },
    });

    const subAgentVA = agentReferral?.referral.agent.virtualAccounts[0];

    // Credit owner's virtual account
    if (ownerVA) {
      await prisma.virtualAccount.update({
        where: { id: ownerVA.id },
        data: {
          balance: {
            increment: commission.ownerAmount,
          },
        },
      });
    }

    // Credit listing agent's virtual account
    if (agentVA && commission.listingAgentCommission > 0) {
      await prisma.virtualAccount.update({
        where: { id: agentVA.id },
        data: {
          balance: {
            increment: commission.listingAgentCommission,
          },
        },
      });
    }

    // Credit sub-agent's virtual account
    if (subAgentVA && commission.subAgentCommission > 0) {
      await prisma.virtualAccount.update({
        where: { id: subAgentVA.id },
        data: {
          balance: {
            increment: commission.subAgentCommission,
          },
        },
      });

      // Mark commission as paid in agent referral conversion
      if (agentReferral) {
        await prisma.agentReferralConversion.update({
          where: { id: agentReferral.id },
          data: {
            isPaid: true,
            paidAt: new Date(),
          },
        });
      }
    }

    // Update payment with commission details
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        platformFee: commission.platformFee,
        agentCommission: commission.listingAgentCommission + commission.subAgentCommission,
        ownerAmount: commission.ownerAmount,
        isReleased: true,
        releasedAt: new Date(),
      },
    });
  }

  /**
   * Get commission breakdown for a property
   */
  async getPropertyCommissionBreakdown(propertyId: string): Promise<{
    totalRevenue: number;
    platformEarnings: number;
    listingAgentEarnings: number;
    subAgentEarnings: number;
    ownerEarnings: number;
  }> {
    const payments = await prisma.payment.findMany({
      where: {
        rental: {
          propertyId,
        },
        status: 'SUCCESS',
        isReleased: true,
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const platformEarnings = payments.reduce((sum, p) => sum + Number(p.platformFee || 0), 0);
    const agentEarnings = payments.reduce((sum, p) => sum + Number(p.agentCommission || 0), 0);
    const ownerEarnings = payments.reduce((sum, p) => sum + Number(p.ownerAmount || 0), 0);

    // Get sub-agent specific earnings
    const agentReferrals = await prisma.agentReferralConversion.findMany({
      where: {
        payment: {
          rental: {
            propertyId,
          },
        },
        isPaid: true,
      },
    });

    const subAgentEarnings = agentReferrals.reduce(
      (sum, ar) => sum + Number(ar.commission),
      0
    );

    const listingAgentEarnings = agentEarnings - subAgentEarnings;

    return {
      totalRevenue,
      platformEarnings,
      listingAgentEarnings,
      subAgentEarnings,
      ownerEarnings,
    };
  }

  /**
   * Get user's total commission earnings
   */
  async getUserCommissionEarnings(userId: string): Promise<{
    totalEarnings: number;
    listingAgentEarnings: number;
    subAgentEarnings: number;
    pendingEarnings: number;
  }> {
    // Get listing agent earnings
    const listingAgentPayments = await prisma.payment.findMany({
      where: {
        rental: {
          property: {
            agentId: userId,
          },
        },
        status: 'SUCCESS',
        isReleased: true,
      },
    });

    const listingAgentEarnings = listingAgentPayments.reduce(
      (sum, p) => sum + Number(p.agentCommission || 0),
      0
    );

    // Get sub-agent earnings
    const subAgentConversions = await prisma.agentReferralConversion.findMany({
      where: {
        referral: {
          agentId: userId,
        },
        isPaid: true,
      },
    });

    const subAgentEarnings = subAgentConversions.reduce(
      (sum, c) => sum + Number(c.commission),
      0
    );

    // Get pending earnings
    const pendingConversions = await prisma.agentReferralConversion.findMany({
      where: {
        referral: {
          agentId: userId,
        },
        isPaid: false,
      },
    });

    const pendingEarnings = pendingConversions.reduce(
      (sum, c) => sum + Number(c.commission),
      0
    );

    return {
      totalEarnings: listingAgentEarnings + subAgentEarnings,
      listingAgentEarnings,
      subAgentEarnings,
      pendingEarnings,
    };
  }
}

export default new CommissionService();