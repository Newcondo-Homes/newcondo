// backend/shared/src/utils/commission.ts

import { DecimalClass, Decimal } from '@newcondo/db';
import {
  CommissionBreakdown,
  CalculateCommissionInput,
  CommissionDistribution,
  CommissionTransfer,
  RecipientType,
  CommissionTransferStatus,
  AgentType
} from '../types/commission';

import { AgentInvolvementType } from '../types/commission';

/**
 * Platform commission rate (20% of rent)
 */
const PLATFORM_COMMISSION_RATE = 0.20;

/**
 * Agent share of platform commission (50% of the 20%)
 */
export const AGENT_COMMISSION_SHARE = 0.50;

/**
 * Flutterwave transaction fee rate (approximately 1.4%)
 */
export const FLUTTERWAVE_FEE_RATE = 0.014;

/**
 * Our service fee multiplier (2x Flutterwave fee to cover refund costs)
 */
export const SERVICE_FEE_MULTIPLIER = 2;


interface CreateDistributionInput {
  rentalId: string;
  propertyId: string;
  unitId?: string;
  breakdown: CommissionBreakdown;
  ownerVirtualAccountId: string;
  platformVirtualAccountId: string;
  listingAgentVirtualAccountId?: string;
  subAgentVirtualAccountId?: string;
}

/**
 * Calculate service fee (double Flutterwave's charge to cover refunds)
 * @param amount - Transaction amount
 * @returns Service fee amount
 */
export function calculateServiceFeeToCoverFlutterwaveCharge(amount: Decimal | number ): Decimal {
  const amountNum = typeof amount === 'number' ? new DecimalClass(amount) : amount;
  const flutterwaveFee = amountNum.mul(FLUTTERWAVE_FEE_RATE).add(100) ;
  const serviceFee = flutterwaveFee.mul(SERVICE_FEE_MULTIPLIER);

  return new DecimalClass(serviceFee).toDecimalPlaces(2);
}

/**
 * Calculate platform commission (20% of rent)
 */
export function calculatePlatformCommissionForRent(rentAmount: number | Decimal): Decimal {
  const amountNum = typeof rentAmount === 'number' ? rentAmount : rentAmount.toNumber();
  const commission = amountNum * PLATFORM_COMMISSION_RATE;

  return new DecimalClass(commission).toDecimalPlaces(2);
}

/**
 * Calculate agent commission based on agent type
 * - Listing agent only: Gets full 50% of platform commission
 * - Listing agent + Sub-agent: Each gets 25% of platform commission (split the 50%)
 */
export function calculateAgentCommission(
  rentAmount: number | Decimal,
  agentType: AgentType
): Decimal {
  const platformCommission = calculatePlatformCommissionForRent(rentAmount);
  const totalAgentShare = platformCommission.mul(AGENT_COMMISSION_SHARE);

  if (agentType === 'LISTING_AGENT') {
    // Listing agent gets full 50%
    return totalAgentShare;
  } else if (agentType === 'SUB_AGENT') {
    // Split 50% between listing agent and sub-agent (25% each)
    return totalAgentShare.div(2).toDecimalPlaces(2);
  }

  return new DecimalClass(0);
}

/**
 * Calculate complete commission breakdown for a rental payment
 */
export function calculateCommissionBreakdown(input: CalculateCommissionInput): CommissionBreakdown {
  const { rentAmount, propertyOwnerId, listingAgentId, subAgentId } = input;

  const totalRentAmount = typeof rentAmount === 'number'
    ? new DecimalClass(rentAmount)
    : rentAmount;

  // Determine agent involvement state
  let agentInvolvementType = AgentInvolvementType.NO_AGENT;
  if (subAgentId) {
    agentInvolvementType = AgentInvolvementType.SUB_AGENT;
  } else if (listingAgentId) {
    agentInvolvementType = AgentInvolvementType.LISTING_AGENT;
  }

  // Calculate service fee (non-refundable)
  // const serviceFee = calculateServiceFeeToCoverFlutterwaveCharge(totalRentAmount);

  // Calculate platform commission (20% of rent)
  const platformCommission = calculatePlatformCommissionForRent(totalRentAmount);

  // Calculate agent commissions
  let listingAgentShare = new DecimalClass(0);
  let subAgentShare = new DecimalClass(0);
  let newcondoCommission = platformCommission;

  if (agentInvolvementType === AgentInvolvementType.LISTING_AGENT) {
    // Both listing agent and sub-agent involved
    // Each gets 25% (half of the 50% agent share)
    listingAgentShare = calculateAgentCommission(totalRentAmount, AgentInvolvementType.LISTING_AGENT);

  } else if (agentInvolvementType === AgentInvolvementType.SUB_AGENT) {
    // Gets full 50% of the 20% commission
    // Both agents take a 25% split allocation of the platform commission
    listingAgentShare = calculateAgentCommission(totalRentAmount, agentInvolvementType);
    subAgentShare = calculateAgentCommission(totalRentAmount, agentInvolvementType);
  }

  // Deduct agent allocations from total platform cut to get the true network revenue
  const agentCommission = listingAgentShare.add(subAgentShare);

  // Calculate property owner amount (rent - platform commission)
  const propertyOwnerAmount = totalRentAmount.sub(platformCommission);

  // Calculate total amount including service fee

  return {
    totalRentAmount,
    platformCommission,
    agentCommission,       // Shared total allocation for agents
    listingAgentShare,     // Split breakout 1
    subAgentShare,         // Split breakout 2
    propertyOwnerAmount,   // Payout for host after 20% platform cut

    // Metadata block mapping tracking indices
    agentInvolvementType,
    listingAgentId,
    subAgentId,
    propertyOwnerId,
  };
}

/**
 * Create distribution instructions for payment release
 */
export function createCommissionDistribution(
  input: CreateDistributionInput
): CommissionDistribution {

  const {
    rentalId,
    propertyId,
    unitId,
    breakdown,
    ownerVirtualAccountId,
    platformVirtualAccountId,
    listingAgentVirtualAccountId,
    subAgentVirtualAccountId
  } = input;

  const transfers: CommissionTransfer[] = [];

  // 1. Platform (Newcondo) Allocation
  // Platform net earnings = platformCommission minus what we pay out to the working agents
  const platformNetPayout = breakdown.platformCommission.sub(breakdown.agentCommission);

  transfers.push({
    id: `tx_plat_${rentalId}_${Date.now()}`,
    recipientId: 'newcondo_platform',
    recipientType: RecipientType.PLATFORM,
    amount: platformNetPayout,
    virtualAccountId: platformVirtualAccountId,
    status: CommissionTransferStatus.PENDING,
  });

  // 2. Listing Agent Allocation
  if (breakdown.listingAgentId && breakdown.listingAgentShare.gt(0) && listingAgentVirtualAccountId) {
    transfers.push({
      id: `tx_list_${rentalId}_${Date.now()}`,
      recipientId: breakdown.listingAgentId,
      recipientType: RecipientType.LISTING_AGENT,
      amount: breakdown.listingAgentShare,
      virtualAccountId: listingAgentVirtualAccountId,
      status: CommissionTransferStatus.PENDING,
    });
  }

  // 3. Sub-Agent Allocation (Fixed property names from errors)
  if (breakdown.subAgentId && breakdown.subAgentShare.gt(0) && subAgentVirtualAccountId) {
    transfers.push({
      id: `tx_sub_${rentalId}_${Date.now()}`,
      recipientId: breakdown.subAgentId,
      recipientType: RecipientType.SUB_AGENT,
      amount: breakdown.subAgentShare, // Fixed from subAgentCommission
      virtualAccountId: subAgentVirtualAccountId,
      status: CommissionTransferStatus.PENDING,
    });
  }

  // 4. Property Owner Allocation
  transfers.push({
    id: `tx_own_${rentalId}_${Date.now()}`,
    recipientId: breakdown.propertyOwnerId,
    recipientType: RecipientType.PROPERTY_OWNER,
    amount: breakdown.propertyOwnerAmount,
    virtualAccountId: ownerVirtualAccountId,
    status: CommissionTransferStatus.PENDING,
  });



  return {
    rentalId,
    propertyId,
    unitId,
    breakdown,
    isDistributed: false,
    transfers,
  };
}


/**
 * Validates that a commission breakdown's math is correct and balances completely.
 */
export function validateCommissionBreakdown(breakdown: CommissionBreakdown): boolean {
  try {
    // 1. Extract the correct property names from your interface
    const {
      totalRentAmount,       // Fixed from rentAmount
      platformCommission,
      agentCommission,
      listingAgentShare,     // Fixed from listingAgentCommission
      subAgentShare,         // Fixed from subAgentCommission
      propertyOwnerAmount
    } = breakdown;

    // 2. Validation: Ensure all values are initialized instances of Decimal
    if (
      !totalRentAmount ||
      !platformCommission ||
      !agentCommission ||
      !propertyOwnerAmount
    ) {
      console.error('❌ Validation failed: One or more required Decimal fields are missing.');
      return false;
    }

    // 3. Validation: Agent allocations must exactly equal the total agent pool commission
    const calculatedAgentSum = listingAgentShare.add(subAgentShare);
    if (!calculatedAgentSum.equals(agentCommission)) {
      console.error('❌ Validation failed: Agent split shares do not sum up to total agentCommission.', {
        expected: agentCommission.toString(),
        actual: calculatedAgentSum.toString()
      });
      return false;
    }

    // 4. Validation: Platform cut + Property Owner share must exactly equal the Total Rent
    // (Remember: agentCommission comes OUT of the platformCommission pool, not in addition to it)
    const totalDistributed = platformCommission.add(propertyOwnerAmount);

    if (!totalDistributed.equals(totalRentAmount)) {
      console.error('❌ Validation failed: Financial leak detected. Payouts do not balance total rent.', {
        totalRentAmount: totalRentAmount.toString(),
        totalDistributed: totalDistributed.toString()
      });
      return false;
    }

    // 5. Validation: Ensure no negative numbers slipped through edge cases
    if (
      totalRentAmount.isNegative() ||
      platformCommission.isNegative() ||
      propertyOwnerAmount.isNegative()
    ) {
      console.error('❌ Validation failed: Negative transaction amounts are invalid.');
      return false;
    }

    console.log('✅ Commission breakdown validation passed successfully.');
    return true;

  } catch (error) {
    console.error('❌ Error executing commission validation syntax:', error);
    return false;
  }
}

/**
 * Calculate refund amount (excludes service fee)
 */
export function calculateRefundAmount(
  totalPaid: number | Decimal,
  serviceFee: number | Decimal
): Decimal {
  const totalPaidDecimal = typeof totalPaid === 'number'
    ? new DecimalClass(totalPaid)
    : totalPaid;

  const serviceFeeDecimal = typeof serviceFee === 'number'
    ? new DecimalClass(serviceFee)
    : serviceFee;

  // Refund = Total paid - Service fee (service fee is non-refundable)
  const refundAmount = totalPaidDecimal.sub(serviceFeeDecimal);

  return refundAmount.toDecimalPlaces(2);
}