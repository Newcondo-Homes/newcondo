// backend/shared/src/utils/commission.ts

import { Decimal } from '@prisma/client/runtime/library';
import { 
  CommissionBreakdown, 
  CommissionDistribution,
  AgentType 
} from '../types/commission';

/**
 * Platform commission rate (20% of rent)
 */
export const PLATFORM_COMMISSION_RATE = 0.20;

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

/**
 * Calculate the total service fee (double Flutterwave's charge)
 */
export function calculateServiceFee(amount: number | Decimal): Decimal {
  const amountNum = typeof amount === 'number' ? amount : amount.toNumber();
  const flutterwaveFee = amountNum * FLUTTERWAVE_FEE_RATE;
  const serviceFee = flutterwaveFee * SERVICE_FEE_MULTIPLIER;
  
  return new Decimal(serviceFee).toDecimalPlaces(2);
}

/**
 * Calculate platform commission (20% of rent)
 */
export function calculatePlatformCommission(rentAmount: number | Decimal): Decimal {
  const amountNum = typeof rentAmount === 'number' ? rentAmount : rentAmount.toNumber();
  const commission = amountNum * PLATFORM_COMMISSION_RATE;
  
  return new Decimal(commission).toDecimalPlaces(2);
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
  const platformCommission = calculatePlatformCommission(rentAmount);
  const totalAgentShare = platformCommission.mul(AGENT_COMMISSION_SHARE);
  
  if (agentType === 'LISTING_ONLY') {
    // Listing agent gets full 50%
    return totalAgentShare;
  } else if (agentType === 'SUB_AGENT' || agentType === 'LISTING_AGENT') {
    // Split 50% between listing agent and sub-agent (25% each)
    return totalAgentShare.div(2).toDecimalPlaces(2);
  }
  
  return new Decimal(0);
}

/**
 * Calculate complete commission breakdown for a rental payment
 */
export function calculateCommissionBreakdown(params: {
  rentAmount: number | Decimal;
  hasListingAgent: boolean;
  hasSubAgent: boolean;
  listingAgentId?: string;
  subAgentId?: string;
}): CommissionBreakdown {
  const { rentAmount, hasListingAgent, hasSubAgent, listingAgentId, subAgentId } = params;
  
  const rentAmountDecimal = typeof rentAmount === 'number' 
    ? new Decimal(rentAmount) 
    : rentAmount;
  
  // Calculate service fee (non-refundable)
  const serviceFee = calculateServiceFee(rentAmountDecimal);
  
  // Calculate platform commission (20% of rent)
  const platformCommission = calculatePlatformCommission(rentAmountDecimal);
  
  // Calculate agent commissions
  let listingAgentCommission = new Decimal(0);
  let subAgentCommission = new Decimal(0);
  let newcondoCommission = platformCommission;
  
  if (hasListingAgent && hasSubAgent) {
    // Both listing agent and sub-agent involved
    // Each gets 25% (half of the 50% agent share)
    listingAgentCommission = calculateAgentCommission(rentAmountDecimal, 'LISTING_AGENT');
    subAgentCommission = calculateAgentCommission(rentAmountDecimal, 'SUB_AGENT');
    
    // Newcondo gets remaining 50% of the 20% commission
    newcondoCommission = platformCommission.sub(listingAgentCommission).sub(subAgentCommission);
  } else if (hasListingAgent) {
    // Only listing agent involved
    // Gets full 50% of the 20% commission
    listingAgentCommission = calculateAgentCommission(rentAmountDecimal, 'LISTING_ONLY');
    
    // Newcondo gets remaining 50% of the 20% commission
    newcondoCommission = platformCommission.sub(listingAgentCommission);
  }
  // If no agents, Newcondo gets the full 20% commission
  
  // Calculate property owner amount (rent - platform commission)
  const propertyOwnerAmount = rentAmountDecimal.sub(platformCommission);
  
  // Calculate total amount including service fee
  const totalAmount = rentAmountDecimal.add(serviceFee);
  
  return {
    rentAmount: rentAmountDecimal,
    serviceFee,
    platformCommission,
    listingAgentCommission,
    subAgentCommission,
    newcondoCommission,
    propertyOwnerAmount,
    totalAmount,
    listingAgentId,
    subAgentId,
  };
}

/**
 * Create distribution instructions for payment release
 */
export function createCommissionDistribution(
  breakdown: CommissionBreakdown,
  propertyOwnerId: string
): CommissionDistribution[] {
  const distributions: CommissionDistribution[] = [];
  
  // Property owner distribution
  distributions.push({
    recipientId: propertyOwnerId,
    recipientType: 'PROPERTY_OWNER',
    amount: breakdown.propertyOwnerAmount,
    description: 'Rental payment after commission',
  });
  
  // Listing agent distribution
  if (breakdown.listingAgentId && breakdown.listingAgentCommission.greaterThan(0)) {
    distributions.push({
      recipientId: breakdown.listingAgentId,
      recipientType: 'LISTING_AGENT',
      amount: breakdown.listingAgentCommission,
      description: 'Listing agent commission',
    });
  }
  
  // Sub-agent distribution
  if (breakdown.subAgentId && breakdown.subAgentCommission.greaterThan(0)) {
    distributions.push({
      recipientId: breakdown.subAgentId,
      recipientType: 'SUB_AGENT',
      amount: breakdown.subAgentCommission,
      description: 'Sub-agent commission',
    });
  }
  
  // Newcondo platform distribution
  distributions.push({
    recipientId: 'PLATFORM', // Special ID for platform account
    recipientType: 'PLATFORM',
    amount: breakdown.newcondoCommission.add(breakdown.serviceFee),
    description: 'Platform commission and service fee',
  });
  
  return distributions;
}

/**
 * Validate commission breakdown totals
 */
export function validateCommissionBreakdown(breakdown: CommissionBreakdown): boolean {
  const {
    rentAmount,
    platformCommission,
    listingAgentCommission,
    subAgentCommission,
    newcondoCommission,
    propertyOwnerAmount,
  } = breakdown;
  
  // Check that platform commission = listing + sub-agent + newcondo commission
  const totalCommissionDistribution = listingAgentCommission
    .add(subAgentCommission)
    .add(newcondoCommission);
  
  if (!platformCommission.equals(totalCommissionDistribution)) {
    return false;
  }
  
  // Check that rent amount = property owner amount + platform commission
  const totalDistribution = propertyOwnerAmount.add(platformCommission);
  
  if (!rentAmount.equals(totalDistribution)) {
    return false;
  }
  
  return true;
}

/**
 * Calculate refund amount (excludes service fee)
 */
export function calculateRefundAmount(
  totalPaid: number | Decimal,
  serviceFee: number | Decimal
): Decimal {
  const totalPaidDecimal = typeof totalPaid === 'number' 
    ? new Decimal(totalPaid) 
    : totalPaid;
  
  const serviceFeeDecimal = typeof serviceFee === 'number' 
    ? new Decimal(serviceFee) 
    : serviceFee;
  
  // Refund = Total paid - Service fee (service fee is non-refundable)
  const refundAmount = totalPaidDecimal.sub(serviceFeeDecimal);
  
  return refundAmount.toDecimalPlaces(2);
}