// backend/shared/src/utils/commissionCalculator.ts

import { Decimal } from '@prisma/client/runtime/library';

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

export interface CommissionBreakdown {
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
    listingAgentAmount: string;
    subAgentId?: string;
    subAgentAmount: string;
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
export function calculateCommissionDistribution(
  rentAmount: Decimal | number,
  parties: CommissionParties
): CommissionBreakdown {
  const totalRent = new Decimal(rentAmount);
  
  // Calculate platform commission (20% of rent)
  const platformCommission = totalRent.mul(COMMISSION_CONFIG.PLATFORM_COMMISSION_RATE);
  
  // Calculate agent commission (50% of platform commission = 10% of rent)
  const totalAgentCommission = platformCommission.mul(COMMISSION_CONFIG.AGENT_SHARE_OF_COMMISSION);
  
  // Calculate owner amount (80% of rent)
  const ownerAmount = totalRent.sub(platformCommission);
  
  let listingAgentAmount = new Decimal(0);
  let subAgentAmount = new Decimal(0);
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
  // If no agents, Newcondo gets full platform commission (already set above)
  
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
 * Calculate service fee (double Flutterwave's charge to cover refunds)
 * @param amount - Transaction amount
 * @returns Service fee amount
 */
export function calculateServiceFee(amount: Decimal | number): Decimal {
  const txAmount = new Decimal(amount);
  
  // Flutterwave charges approximately 1.4% + NGN 100
  const flutterwaveCharge = txAmount.mul(0.014).add(100);
  
  // Double the charge to cover potential refunds
  const serviceFee = flutterwaveCharge.mul(2);
  
  return serviceFee;
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
  const rent = new Decimal(rentAmount);
  const serviceFee = calculateServiceFee(rent);
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
  const isValid = difference.lessThanOrEqualTo(0.01); // Allow 1 cent difference for rounding
  
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
  
  if (breakdown.listingAgentAmount.greaterThan(0)) {
    lines.push(
      `Listing Agent: NGN ${breakdown.listingAgentAmount.toFixed(2)} (${breakdown.subAgentAmount.greaterThan(0) ? '5%' : '10%'})`
    );
  }
  
  if (breakdown.subAgentAmount.greaterThan(0)) {
    lines.push(`Sub-Agent: NGN ${breakdown.subAgentAmount.toFixed(2)} (5%)`);
  }
  
  lines.push(`NewCondo Platform: NGN ${breakdown.newCondoAmount.toFixed(2)} (${breakdown.listingAgentAmount.greaterThan(0) ? '10%' : '20%'})`);
  
  return lines.join('\n');
}












// import { Decimal } from '@prisma/client/runtime/library';

// /**
//  * Commission rates and rules for Newcondo platform
//  */
// export const COMMISSION_RATES = {
//   PLATFORM_COMMISSION_RATE: 0.20, // 20% of rent
//   LISTING_AGENT_SHARE: 0.50, // 50% of platform commission
//   SUB_AGENT_SHARE: 0.50, // 50% of listing agent's share when sub-agent is involved
//   MARKING_SERVICE_AGENT_COMMISSION: 0.25, // 25% of marking fee
//   MARKING_SERVICE_PLATFORM_SHARE: 0.75, // 75% of marking fee
// } as const;

// export const MARKING_SERVICE_FEES = {
//   PROPERTY_OWNER_FEE: 20000, // 20,000 NGN
//   NEWCONDO_ADMIN_FEE: 25000, // 25,000 NGN
// } as const;

// export interface CommissionBreakdown {
//   totalRentAmount: number;
//   platformCommission: number;
//   listingAgentCommission: number;
//   subAgentCommission: number;
//   ownerAmount: number;
//   newCondoAmount: number;
// }

// export interface MarkingServiceCommissionBreakdown {
//   totalMarkingFee: number;
//   agentCommission: number;
//   platformAmount: number;
// }

// /**
//  * Calculate commission breakdown for a rental payment
//  */
// export function calculateCommission(
//   rentAmount: number,
//   hasListingAgent: boolean,
//   hasSubAgent: boolean
// ): CommissionBreakdown {
//   // Calculate platform's 20% commission
//   const platformCommission = rentAmount * COMMISSION_RATES.PLATFORM_COMMISSION_RATE;

//   let listingAgentCommission = 0;
//   let subAgentCommission = 0;
//   let newCondoAmount = platformCommission;

//   if (hasListingAgent) {
//     // Listing agent gets 50% of platform commission
//     listingAgentCommission = platformCommission * COMMISSION_RATES.LISTING_AGENT_SHARE;
//     newCondoAmount = platformCommission - listingAgentCommission;

//     if (hasSubAgent) {
//       // Sub-agent splits with listing agent (each gets 50% of the 50%)
//       subAgentCommission = listingAgentCommission * COMMISSION_RATES.SUB_AGENT_SHARE;
//       listingAgentCommission = listingAgentCommission * COMMISSION_RATES.SUB_AGENT_SHARE;
//     }
//   }

//   // Owner gets rent minus platform commission
//   const ownerAmount = rentAmount - platformCommission;

//   return {
//     totalRentAmount: Math.round(rentAmount * 100) / 100,
//     platformCommission: Math.round(platformCommission * 100) / 100,
//     listingAgentCommission: Math.round(listingAgentCommission * 100) / 100,
//     subAgentCommission: Math.round(subAgentCommission * 100) / 100,
//     ownerAmount: Math.round(ownerAmount * 100) / 100,
//     newCondoAmount: Math.round(newCondoAmount * 100) / 100,
//   };
// }

// /**
//  * Calculate commission breakdown for marking service
//  */
// export function calculateMarkingServiceCommission(
//   markingFee: number
// ): MarkingServiceCommissionBreakdown {
//   const agentCommission = markingFee * COMMISSION_RATES.MARKING_SERVICE_AGENT_COMMISSION;
//   const platformAmount = markingFee * COMMISSION_RATES.MARKING_SERVICE_PLATFORM_SHARE;

//   return {
//     totalMarkingFee: Math.round(markingFee * 100) / 100,
//     agentCommission: Math.round(agentCommission * 100) / 100,
//     platformAmount: Math.round(platformAmount * 100) / 100,
//   };
// }

// /**
//  * Calculate total commission for multiple properties
//  */
// export function calculateTotalCommissions(
//   rentals: Array<{
//     rentAmount: number;
//     hasListingAgent: boolean;
//     hasSubAgent: boolean;
//   }>
// ): {
//   totalCommissions: CommissionBreakdown;
//   breakdown: CommissionBreakdown[];
// } {
//   const breakdown = rentals.map((rental) =>
//     calculateCommission(rental.rentAmount, rental.hasListingAgent, rental.hasSubAgent)
//   );

//   const totalCommissions: CommissionBreakdown = {
//     totalRentAmount: 0,
//     platformCommission: 0,
//     listingAgentCommission: 0,
//     subAgentCommission: 0,
//     ownerAmount: 0,
//     newCondoAmount: 0,
//   };

//   breakdown.forEach((item) => {
//     totalCommissions.totalRentAmount += item.totalRentAmount;
//     totalCommissions.platformCommission += item.platformCommission;
//     totalCommissions.listingAgentCommission += item.listingAgentCommission;
//     totalCommissions.subAgentCommission += item.subAgentCommission;
//     totalCommissions.ownerAmount += item.ownerAmount;
//     totalCommissions.newCondoAmount += item.newCondoAmount;
//   });

//   // Round totals
//   Object.keys(totalCommissions).forEach((key) => {
//     totalCommissions[key as keyof CommissionBreakdown] =
//       Math.round(totalCommissions[key as keyof CommissionBreakdown] * 100) / 100;
//   });

//   return {
//     totalCommissions,
//     breakdown,
//   };
// }

// /**
//  * Calculate agent's expected earnings
//  */
// export function calculateAgentEarnings(
//   properties: Array<{
//     rentAmount: number;
//     isListingAgent: boolean;
//     hasSubAgent: boolean;
//   }>,
//   markingJobs: number = 0
// ): {
//   totalEarnings: number;
//   listingCommissions: number;
//   markingCommissions: number;
// } {
//   let listingCommissions = 0;

//   properties.forEach((property) => {
//     if (property.isListingAgent) {
//       const commission = calculateCommission(
//         property.rentAmount,
//         true,
//         property.hasSubAgent
//       );
//       listingCommissions += commission.listingAgentCommission;
//     }
//   });

//   const markingCommissions =
//     markingJobs * MARKING_SERVICE_FEES.PROPERTY_OWNER_FEE * COMMISSION_RATES.MARKING_SERVICE_AGENT_COMMISSION;

//   return {
//     totalEarnings: Math.round((listingCommissions + markingCommissions) * 100) / 100,
//     listingCommissions: Math.round(listingCommissions * 100) / 100,
//     markingCommissions: Math.round(markingCommissions * 100) / 100,
//   };
// }

// /**
//  * Calculate platform's expected revenue
//  */
// export function calculatePlatformRevenue(
//   rentals: Array<{
//     rentAmount: number;
//     hasListingAgent: boolean;
//     hasSubAgent: boolean;
//   }>,
//   markingJobs: number = 0
// ): {
//   totalRevenue: number;
//   rentalCommissions: number;
//   markingServiceRevenue: number;
// } {
//   let rentalCommissions = 0;

//   rentals.forEach((rental) => {
//     const commission = calculateCommission(
//       rental.rentAmount,
//       rental.hasListingAgent,
//       rental.hasSubAgent
//     );
//     rentalCommissions += commission.newCondoAmount;
//   });

//   const markingServiceRevenue =
//     markingJobs * MARKING_SERVICE_FEES.PROPERTY_OWNER_FEE * COMMISSION_RATES.MARKING_SERVICE_PLATFORM_SHARE;

//   return {
//     totalRevenue: Math.round((rentalCommissions + markingServiceRevenue) * 100) / 100,
//     rentalCommissions: Math.round(rentalCommissions * 100) / 100,
//     markingServiceRevenue: Math.round(markingServiceRevenue * 100) / 100,
//   };
// }

// /**
//  * Validate commission calculation
//  */
// export function validateCommissionBreakdown(breakdown: CommissionBreakdown): boolean {
//   const sum =
//     breakdown.ownerAmount +
//     breakdown.listingAgentCommission +
//     breakdown.subAgentCommission +
//     breakdown.newCondoAmount;

//   // Allow for small rounding differences
//   const difference = Math.abs(sum - breakdown.totalRentAmount);
//   return difference < 0.01;
// }

// /**
//  * Calculate commission for Decimal values (Prisma)
//  */
// export function calculateCommissionFromDecimal(
//   rentAmount: Decimal,
//   hasListingAgent: boolean,
//   hasSubAgent: boolean
// ): CommissionBreakdown {
//   return calculateCommission(Number(rentAmount), hasListingAgent, hasSubAgent);
// }

// /**
//  * Format commission breakdown for display
//  */
// export function formatCommissionBreakdown(breakdown: CommissionBreakdown): {
//   [key: string]: string;
// } {
//   return {
//     totalRentAmount: `₦${breakdown.totalRentAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
//     platformCommission: `₦${breakdown.platformCommission.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
//     listingAgentCommission: `₦${breakdown.listingAgentCommission.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
//     subAgentCommission: `₦${breakdown.subAgentCommission.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
//     ownerAmount: `₦${breakdown.ownerAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
//     newCondoAmount: `₦${breakdown.newCondoAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
//   };
// }