// backend/shared/src/utils/commissionCalculator.ts
import { DecimalClass, Decimal } from '@newcondo/db';
import { calculateServiceFeeToCoverFlutterwaveCharge } from './commission'

/**
 * Commission distribution configuration
 */
export const COMMISSION_CONFIG = {
  // Newcondo takes 20% of rent as commission
  PLATFORM_COMMISSION_RATE: 0.20,
  
  // Agents split 50% of the platform commission (10% of total rent)
  AGENT_SHARE_OF_COMMISSION: 0.50,
  
  // Sub-agents split 50% with listing agent when involved
  SUB_AGENT_SPLIT_RATE: 0.50,
} as const;

export interface CommissionParties {
  hasListingAgent: boolean;
  hasSubAgent: boolean;
  listingAgentId?: string;
  subAgentId?: string;
  propertyOwnerId: string;
}

interface CommissionBreakdown {
  totalRent: Decimal;
  platformCommission: Decimal; // 20% of rent
  agentCommission: Decimal; // 10% of rent (50% of platform commission)
  ownerAmount: Decimal; // 80% of rent
  
  // Agent distribution
  listingAgentAmount: Decimal;
  subAgentAmount: Decimal;
  
  // Platform distribution
  newCondoAmount: Decimal; // Platform commission - agent commission
  
  // Detailed breakdown
  breakdown: {
    listingAgentId?: string;
    listingAgentAmount?: string; // FIXED: Made optional (?) to support conditional spreading
    subAgentId?: string;
    subAgentAmount?: string;     // FIXED: Made optional (?) to support conditional spreading
    propertyOwnerId: string;
    ownerAmount: string;
    platformAmount: string;
  };
}

/**
 * Calculate commission distribution for a rental payment
 * @param rentAmount - Total rent amount paid
 * @param parties - Information about involved parties
 * @returns Detailed commission breakdown
 */
export function calculateCommissionDistributionForRentPayment(
  rentAmount: Decimal | number,
  parties: CommissionParties
): CommissionBreakdown {
  // Fixed: Replaced custom DecimalClass with standard unified Decimal constructor
  const totalRent = typeof rentAmount === 'number' ? new DecimalClass(rentAmount) : rentAmount;
  
  // Calculate platform commission (20% of rent)
  const platformCommission = totalRent.mul(COMMISSION_CONFIG.PLATFORM_COMMISSION_RATE);
  
  // Calculate agent commission (50% of platform commission = 10% of rent)
  const totalAgentCommission = platformCommission.mul(COMMISSION_CONFIG.AGENT_SHARE_OF_COMMISSION);
  
  // Calculate owner amount (80% of rent)
  const ownerAmount = totalRent.sub(platformCommission);
  
  let listingAgentAmount = new DecimalClass(0);
  let subAgentAmount = new DecimalClass(0);
  let newCondoAmount = platformCommission;
  
  // If there are agents involved
  if (parties.hasListingAgent) {
    if (parties.hasSubAgent) {
      // Split agent commission 50/50 between listing agent and sub-agent
      listingAgentAmount = totalAgentCommission.mul(COMMISSION_CONFIG.SUB_AGENT_SPLIT_RATE);
      subAgentAmount = totalAgentCommission.mul(COMMISSION_CONFIG.SUB_AGENT_SPLIT_RATE);
    } else {
      // Listing agent gets full agent commission
      listingAgentAmount = totalAgentCommission;
    }
    
    // Newcondo gets platform commission minus agent commission
    newCondoAmount = platformCommission.sub(totalAgentCommission);
  }
  
  return {
    totalRent,
    platformCommission,
    agentCommission: totalAgentCommission,
    ownerAmount,
    listingAgentAmount,
    subAgentAmount,
    newCondoAmount,
    breakdown: {
      ...(parties.listingAgentId && {
        listingAgentId: parties.listingAgentId,
        listingAgentAmount: listingAgentAmount.toFixed(2),
      }),
      ...(parties.subAgentId && {
        subAgentId: parties.subAgentId,
        subAgentAmount: subAgentAmount.toFixed(2),
      }),
      propertyOwnerId: parties.propertyOwnerId,
      ownerAmount: ownerAmount.toFixed(2),
      platformAmount: newCondoAmount.toFixed(2),
    },
  };
}


/**
 * Calculate total amount to charge renter (rent + service fee)
 * @param rentAmount - Base rent amount
 * @returns Total amount including service fee
 */
export function calculateTotalChargeAmount(rentAmount: Decimal | number): {
  rentAmount: Decimal;
  serviceFee: Decimal;
  totalAmount: Decimal;
} {
  const rent = typeof rentAmount === 'number' ? new DecimalClass(rentAmount) : rentAmount;
  const serviceFee = calculateServiceFeeToCoverFlutterwaveCharge(rent);
  const totalAmount = rent.add(serviceFee);
  
  return {
    rentAmount: rent,
    serviceFee,
    totalAmount,
  };
}

/**
 * Validate commission distribution totals
 * @param breakdown - Commission breakdown to validate
 * @returns true if valid, throws error if invalid
 */
export function validateCommissionDistribution(breakdown: CommissionBreakdown): boolean {
  const {
    totalRent,
    ownerAmount,
    listingAgentAmount,
    subAgentAmount,
    newCondoAmount,
  } = breakdown;
  
  // Sum all distributions
  const totalDistributed = ownerAmount
    .add(listingAgentAmount)
    .add(subAgentAmount)
    .add(newCondoAmount);
  
  // Check if totals match (allowing for minor rounding differences)
  const difference = totalRent.sub(totalDistributed).abs();
  
  // Fixed compilation methods for handling standard decimal comparison operations
  const isValid = difference.lte(0.01); 
  
  if (!isValid) {
    throw new Error(
      `Commission distribution mismatch: Total rent ${totalRent.toString()} ` +
      `does not match distributed amount ${totalDistributed.toString()}`
    );
  }
  
  return true;
}

/**
 * Get commission summary for display
 * @param breakdown - Commission breakdown
 * @returns Human-readable summary
 */
export function getCommissionSummary(breakdown: CommissionBreakdown): string {
  const lines: string[] = [
    `Total Rent: NGN ${breakdown.totalRent.toFixed(2)}`,
    `Property Owner: NGN ${breakdown.ownerAmount.toFixed(2)} (80%)`,
  ];
  
  // Fixed compilation method: changed .greaterThan() to .gt() 
  if (breakdown.listingAgentAmount.gt(0)) {
    lines.push(
      `Listing Agent: NGN ${breakdown.listingAgentAmount.toFixed(2)} (${breakdown.subAgentAmount.gt(0) ? '5%' : '10%'})`
    );
  }
  
  if (breakdown.subAgentAmount.gt(0)) {
    lines.push(`Sub-Agent: NGN ${breakdown.subAgentAmount.toFixed(2)} (5%)`);
  }
  
  lines.push(`NewCondo Platform: NGN ${breakdown.newCondoAmount.toFixed(2)} (${breakdown.listingAgentAmount.gt(0) ? '10%' : '20%'})`);
  
  return lines.join('\n');
}