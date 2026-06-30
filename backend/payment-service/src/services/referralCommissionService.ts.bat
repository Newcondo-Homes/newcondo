// backend/payment-service/src/services/referralCommissionService.ts

import { PrismaClient } from '@newcondo/db';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

/**
 * Referral Commission Service
 * Handles commission calculation for referral-based transactions
 */

interface CommissionCalculationParams {
  paymentId: string;
  propertyId: string;
  unitId?: string;
  rentAmount: Decimal;
  renterId: string;
  referralCode?: string; // From cookie or session
}

interface CommissionBreakdown {
  totalRent: Decimal;
  platformCommission: Decimal; // 20% of rent
  propertyOwnerAmount: Decimal; // 80% of rent
  listingAgentCommission?: Decimal; // 50% of platform commission
  subAgentCommission?: Decimal; // 25% of platform commission each
  newCondoAmount: Decimal; // Remaining after agent commissions
  commissions: Array<{
    userId: string;
    userRole: string;
    amount: Decimal;
    type: string;
  }>;
}

/**
 * Referral Commission Service Class
 */
class ReferralCommissionService {
  private readonly PLATFORM_COMMISSION_RATE = 0.20; // 20%
  private readonly AGENT_COMMISSION_SPLIT = 0.50; // 50% of platform commission

  /**
   * Calculate commission breakdown for a payment
   */
  async calculateCommissions(
    params: CommissionCalculationParams
  ): Promise<CommissionBreakdown> {
    const { rentAmount, propertyId, unitId, renterId, referralCode } = params;

    // Get property details
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: { select: { id: true, role: true } },
        agent: { select: { id: true, role: true } },
      },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Calculate base commissions
    const platformCommission = this.calculatePlatformCommission(rentAmount);
    const propertyOwnerAmount = this.calculateOwnerAmount(rentAmount);

    const breakdown: CommissionBreakdown = {
      totalRent: rentAmount,
      platformCommission,
      propertyOwnerAmount,
      newCondoAmount: platformCommission,
      commissions: [],
    };

    // Add property owner payment
    breakdown.commissions.push({
      userId: property.ownerId,
      userRole: property.owner.role,
      amount: propertyOwnerAmount,
      type: 'PROPERTY_OWNER_PAYMENT',
    });

    // Check if there's a listing agent
    const hasListingAgent = property.agentId && !property.isOwnerListing;

    if (hasListingAgent && property.agentId) {
      // Calculate listing agent commission (50% of platform commission)
      const listingAgentCommission = this.calculateAgentCommission(
        platformCommission
      );
      breakdown.listingAgentCommission = listingAgentCommission;

      // Deduct from NewCondo's share
      breakdown.newCondoAmount = new Decimal(platformCommission)
        .minus(listingAgentCommission)
        .toDecimalPlaces(2);

      breakdown.commissions.push({
        userId: property.agentId,
        userRole: 'AGENT',
        amount: listingAgentCommission,
        type: 'LISTING_AGENT_COMMISSION',
      });
    }

    // Check for sub-agent referral
    if (referralCode) {
      const subAgentInfo = await this.findSubAgentReferral(
        referralCode,
        propertyId
      );

      if (
        subAgentInfo &&
        subAgentInfo.agentId !== property.agentId // Ensure it's not the listing agent
      ) {
        // Calculate sub-agent commission
        const subAgentCommission = this.calculateSubAgentCommission(
          platformCommission,
          hasListingAgent
        );

        breakdown.subAgentCommission = subAgentCommission;

        // If there's a listing agent, they split the 50%
        // Otherwise, sub-agent gets full 50%
        if (hasListingAgent && property.agentId) {
          // Split: 25% listing agent, 25% sub-agent
          const adjustedListingCommission = this.calculateAgentCommission(
            platformCommission
          ).div(2);
          const adjustedSubCommission = adjustedListingCommission;

          // Update listing agent commission
          const listingCommissionIndex = breakdown.commissions.findIndex(
            (c) => c.type === 'LISTING_AGENT_COMMISSION'
          );
          if (listingCommissionIndex !== -1) {
            breakdown.commissions[listingCommissionIndex].amount =
              adjustedListingCommission;
          }

          // Add sub-agent commission
          breakdown.commissions.push({
            userId: subAgentInfo.agentId,
            userRole: 'AGENT',
            amount: adjustedSubCommission,
            type: 'SUB_AGENT_COMMISSION',
          });

          // Adjust NewCondo amount
          breakdown.newCondoAmount = new Decimal(platformCommission)
            .minus(adjustedListingCommission)
            .minus(adjustedSubCommission)
            .toDecimalPlaces(2);
        } else {
          // No listing agent, sub-agent gets full 50%
          breakdown.commissions.push({
            userId: subAgentInfo.agentId,
            userRole: 'AGENT',
            amount: subAgentCommission,
            type: 'SUB_AGENT_COMMISSION',
          });

          breakdown.newCondoAmount = new Decimal(platformCommission)
            .minus(subAgentCommission)
            .toDecimalPlaces(2);
        }
      }
    }

    // Add NewCondo platform fee
    breakdown.commissions.push({
      userId: 'NEWCONDO_PLATFORM',
      userRole: 'PLATFORM',
      amount: breakdown.newCondoAmount,
      type: 'PLATFORM_FEE',
    });

    return breakdown;
  }

  /**
   * Distribute commissions to virtual accounts
   */
  async distributeCommissions(
    paymentId: string,
    breakdown: CommissionBreakdown
  ): Promise<void> {
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

    // Create commission records for each recipient
    for (const commission of breakdown.commissions) {
      if (commission.userId === 'NEWCONDO_PLATFORM') {
        // Handle platform fee separately
        continue;
      }

      // Find or create virtual account for user
      const virtualAccount = await this.getOrCreateVirtualAccount(
        commission.userId,
        payment.rental.propertyId
      );

      // Credit the virtual account (held until confirmation period ends)
      await prisma.$transaction([
        // Update payment record with commission details
        prisma.payment.update({
          where: { id: paymentId },
          data: {
            agentCommission:
              commission.type === 'LISTING_AGENT_COMMISSION' ||
              commission.type === 'SUB_AGENT_COMMISSION'
                ? commission.amount
                : undefined,
            platformFee:
              commission.type === 'PLATFORM_FEE'
                ? commission.amount
                : breakdown.newCondoAmount,
            ownerAmount:
              commission.type === 'PROPERTY_OWNER_PAYMENT'
                ? commission.amount
                : undefined,
          },
        }),

        // Log the commission allocation
        prisma.eventLog.create({
          data: {
            userId: commission.userId,
            type: 'COMMISSION_ALLOCATED',
            metadata: {
              paymentId,
              amount: commission.amount.toString(),
              commissionType: commission.type,
              status: 'HELD', // Held until confirmation period
            },
          },
        }),
      ]);
    }

    // Create referral conversion record if applicable
    const referralCode = await this.getReferralCodeFromPayment(paymentId);
    if (referralCode) {
      await this.recordReferralConversion(paymentId, referralCode, breakdown);
    }
  }

  /**
   * Release commissions after confirmation period
   */
  async releaseCommissions(paymentId: string): Promise<void> {
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
      },
    });

    if (!payment || !payment.rental) {
      throw new Error('Payment or rental not found');
    }

    const commissions = [
      {
        userId: payment.rental.property.ownerId,
        amount: payment.ownerAmount,
      },
      payment.rental.property.agentId && payment.agentCommission
        ? {
            userId: payment.rental.property.agentId,
            amount: payment.agentCommission,
          }
        : null,
    ].filter(Boolean) as Array<{ userId: string; amount: Decimal | null }>;

    for (const commission of commissions) {
      if (!commission.amount) continue;

      // Find virtual account
      const virtualAccount = await prisma.virtualAccount.findFirst({
        where: {
          userId: commission.userId,
          propertyId: payment.rental.propertyId,
        },
      });

      if (virtualAccount) {
        // Credit the virtual account
        await prisma.virtualAccount.update({
          where: { id: virtualAccount.id },
          data: {
            balance: {
              increment: commission.amount,
            },
          },
        });

        // Log the release
        await prisma.eventLog.create({
          data: {
            userId: commission.userId,
            type: 'COMMISSION_RELEASED',
            metadata: {
              paymentId,
              amount: commission.amount.toString(),
              virtualAccountId: virtualAccount.id,
            },
          },
        });
      }
    }

    // Mark payment as released
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        isReleased: true,
        releasedAt: new Date(),
      },
    });
  }

  // Helper methods

  private calculatePlatformCommission(rentAmount: Decimal): Decimal {
    return new Decimal(rentAmount)
      .times(this.PLATFORM_COMMISSION_RATE)
      .toDecimalPlaces(2);
  }

  private calculateOwnerAmount(rentAmount: Decimal): Decimal {
    return new Decimal(rentAmount)
      .times(1 - this.PLATFORM_COMMISSION_RATE)
      .toDecimalPlaces(2);
  }

  private calculateAgentCommission(platformCommission: Decimal): Decimal {
    return new Decimal(platformCommission)
      .times(this.AGENT_COMMISSION_SPLIT)
      .toDecimalPlaces(2);
  }

  private calculateSubAgentCommission(
    platformCommission: Decimal,
    hasListingAgent: boolean
  ): Decimal {
    if (hasListingAgent) {
      // Split 50% between listing agent and sub-agent (25% each)
      return new Decimal(platformCommission)
        .times(this.AGENT_COMMISSION_SPLIT)
        .div(2)
        .toDecimalPlaces(2);
    } else {
      // Sub-agent gets full 50%
      return this.calculateAgentCommission(platformCommission);
    }
  }

  private async findSubAgentReferral(
    referralCode: string,
    propertyId: string
  ) {
    const agentReferral = await prisma.agentReferral.findFirst({
      where: {
        referralCode,
        propertyId,
        isActive: true,
      },
      select: {
        id: true,
        agentId: true,
      },
    });

    return agentReferral;
  }

  private async getOrCreateVirtualAccount(
    userId: string,
    propertyId: string
  ) {
    let virtualAccount = await prisma.virtualAccount.findFirst({
      where: {
        userId,
        propertyId,
      },
    });

    if (!virtualAccount) {
      // Create virtual account
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      if (!user) throw new Error('User not found');

      virtualAccount = await prisma.virtualAccount.create({
        data: {
          userId,
          propertyId,
          accountNumber: this.generateAccountNumber(),
          accountName: user.name || user.email,
          bankCode: '000', // Placeholder
          balance: 0,
          isActive: true,
        },
      });
    }

    return virtualAccount;
  }

  private generateAccountNumber(): string {
    return `NC${Date.now()}${Math.floor(Math.random() * 1000)}`.substring(0, 10);
  }

  private async getReferralCodeFromPayment(
    paymentId: string
  ): Promise<string | null> {
    // This would be stored in payment metadata or session
    // For now, return null
    return null;
  }

  private async recordReferralConversion(
    paymentId: string,
    referralCode: string,
    breakdown: CommissionBreakdown
  ) {
    const agentReferral = await prisma.agentReferral.findFirst({
      where: { referralCode },
    });

    if (!agentReferral) return;

    const subAgentCommission = breakdown.commissions.find(
      (c) => c.type === 'SUB_AGENT_COMMISSION'
    );

    if (subAgentCommission) {
      await prisma.agentReferralConversion.create({
        data: {
          referralId: agentReferral.id,
          paymentId,
          amount: breakdown.totalRent,
          commission: subAgentCommission.amount,
          isPaid: false,
        },
      });
    }
  }
}

export const referralCommissionService = new ReferralCommissionService();