// backend/payment-service/src/services/commissionCalculationService.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CommissionCalculationInput {
  rentAmount: number;
  propertyId: string;
  referralCode?: string;
}

interface CommissionBreakdown {
  rentAmount: number;
  platformCommission: number;
  platformCommissionPercentage: number;
  listingAgentCommission: number;
  subAgentCommission: number;
  propertyOwnerAmount: number;
  newcondoAmount: number;
  flutterwaveFee: number;
  transactionFee: number;
  totalDeductions: number;
}

export class CommissionCalculationService {
  private readonly PLATFORM_COMMISSION_RATE = 0.20; // 20% platform commission
  private readonly AGENT_SPLIT_RATE = 0.50; // Agents get 50% of platform commission
  private readonly FLUTTERWAVE_FEE_RATE = 0.014; // 1.4% Flutterwave fee
  private readonly FLUTTERWAVE_CAP = 2000; // NGN 2,000 cap
  private readonly TRANSACTION_FEE = 100; // NGN 100 standard transaction fee

  /**
   * Calculate commission breakdown for a rental payment
   */
  async calculateCommission(input: CommissionCalculationInput): Promise<CommissionBreakdown> {
    const { rentAmount, propertyId, referralCode } = input;

    // Get property details
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: true,
        agent: true,
      },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Calculate base commission (20% of rent)
    const platformCommission = rentAmount * this.PLATFORM_COMMISSION_RATE;

    let listingAgentCommission = 0;
    let subAgentCommission = 0;
    let newcondoAmount = platformCommission;

    // Check if there's a listing agent
    const hasListingAgent = !!property.agentId;

    if (hasListingAgent) {
      // Listing agent gets 50% of platform commission
      listingAgentCommission = platformCommission * this.AGENT_SPLIT_RATE;
      newcondoAmount = platformCommission * this.AGENT_SPLIT_RATE;
    }

    // Check if payment came through a sub-agent referral
    if (referralCode) {
      const referral = await prisma.agentReferral.findUnique({
        where: { referralCode },
        include: { agent: true },
      });

      if (referral && referral.propertyId === propertyId && referral.isActive) {
        // Sub-agent gets 50% of agent's share
        subAgentCommission = listingAgentCommission * 0.50;
        listingAgentCommission = listingAgentCommission * 0.50;
      }
    }

    // Calculate Flutterwave fee (1.4% capped at NGN 2,000)
    const flutterwaveFeeCalculated = rentAmount * this.FLUTTERWAVE_FEE_RATE;
    const flutterwaveFee = Math.min(flutterwaveFeeCalculated, this.FLUTTERWAVE_CAP);

    // Calculate total transaction fee (double for potential refund)
    const transactionFee = this.TRANSACTION_FEE * 2;

    // Calculate total deductions
    const totalDeductions = platformCommission + flutterwaveFee + transactionFee;

    // Calculate property owner amount
    const propertyOwnerAmount = rentAmount - totalDeductions;

    return {
      rentAmount,
      platformCommission,
      platformCommissionPercentage: this.PLATFORM_COMMISSION_RATE * 100,
      listingAgentCommission,
      subAgentCommission,
      propertyOwnerAmount,
      newcondoAmount,
      flutterwaveFee,
      transactionFee,
      totalDeductions,
    };
  }

  /**
   * Get commission breakdown for a specific payment
   */
  async getPaymentCommissionBreakdown(paymentId: string, userId: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        OR: [
          { userId },
          { rental: { property: { ownerId: userId } } },
          { rental: { property: { agentId: userId } } },
        ],
      },
      include: {
        rental: {
          include: {
            property: {
              include: {
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
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

    if (!payment || !payment.rental) {
      return null;
    }

    const rentAmount = Number(payment.amount);
    const platformCommission = Number(payment.platformFee || 0);
    const agentCommission = Number(payment.agentCommission || 0);
    const ownerAmount = Number(payment.ownerAmount || 0);

    // Calculate Flutterwave fee
    const flutterwaveFeeCalculated = rentAmount * this.FLUTTERWAVE_FEE_RATE;
    const flutterwaveFee = Math.min(flutterwaveFeeCalculated, this.FLUTTERWAVE_CAP);

    const transactionFee = this.TRANSACTION_FEE * 2;

    // Check if there was a referral
    const referralConversion = await prisma.referralConversion.findUnique({
      where: { paymentId },
      include: {
        referral: {
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
    });

    return {
      payment: {
        id: payment.id,
        amount: rentAmount,
        status: payment.status,
        paidAt: payment.paidAt?.toISOString(),
        isReleased: payment.isReleased,
        releasedAt: payment.releasedAt?.toISOString(),
        confirmationPeriodEnd: payment.confirmationPeriodEnd?.toISOString(),
      },
      property: {
        id: payment.rental.property.id,
        title: payment.rental.property.title,
        address: payment.rental.property.address,
      },
      breakdown: {
        rentAmount,
        platformCommission,
        platformCommissionPercentage: this.PLATFORM_COMMISSION_RATE * 100,
        listingAgentCommission: referralConversion ? agentCommission / 2 : agentCommission,
        subAgentCommission: referralConversion ? agentCommission / 2 : 0,
        propertyOwnerAmount: ownerAmount,
        newcondoAmount: platformCommission - agentCommission,
        flutterwaveFee,
        transactionFee,
        totalDeductions: rentAmount - ownerAmount,
      },
      parties: {
        owner: payment.rental.property.owner,
        listingAgent: payment.rental.property.agent,
        subAgent: referralConversion?.referral.agent,
      },
    };
  }

  /**
   * Process commission distribution after confirmation period
   */
  async processCommissionDistribution(paymentId: string): Promise<void> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        rental: {
          include: {
            property: {
              include: {
                virtualAccount: true,
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

    const rentAmount = Number(payment.amount);
    const platformFee = Number(payment.platformFee || 0);
    const agentCommission = Number(payment.agentCommission || 0);
    const ownerAmount = Number(payment.ownerAmount || 0);

    // Check for referral conversion
    const referralConversion = await prisma.referralConversion.findUnique({
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

    // Distribute to property owner virtual account
    if (payment.rental.property.virtualAccount) {
      await prisma.virtualAccount.update({
        where: { id: payment.rental.property.virtualAccount.id },
        data: {
          balance: {
            increment: ownerAmount,
          },
        },
      });
    }

    // Distribute to listing agent
    if (payment.rental.property.agent && agentCommission > 0) {
      const agentVirtualAccount = payment.rental.property.agent.virtualAccounts[0];
      if (agentVirtualAccount) {
        const agentShare = referralConversion ? agentCommission / 2 : agentCommission;
        await prisma.virtualAccount.update({
          where: { id: agentVirtualAccount.id },
          data: {
            balance: {
              increment: agentShare,
            },
          },
        });
      }
    }

    // Distribute to sub-agent if referral
    if (referralConversion) {
      const subAgentVirtualAccount = referralConversion.referral.agent.virtualAccounts[0];
      if (subAgentVirtualAccount) {
        const subAgentShare = agentCommission / 2;
        await prisma.virtualAccount.update({
          where: { id: subAgentVirtualAccount.id },
          data: {
            balance: {
              increment: subAgentShare,
            },
          },
        });

        // Mark referral conversion as paid
        await prisma.referralConversion.update({
          where: { id: referralConversion.id },
          data: {
            isPaid: true,
            paidAt: new Date(),
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
}

export const commissionCalculationService = new CommissionCalculationService();