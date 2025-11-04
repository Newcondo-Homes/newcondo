// backend/shared/src/constants/commission.ts

/**
 * Commission rates and distribution rules for the platform
 */

export const COMMISSION_RATES = {
  // Platform commission on successful rent (20% of rent amount)
  PLATFORM_COMMISSION_RATE: 0.20,

  // Agent commission split (50% of platform commission when agent is involved)
  AGENT_COMMISSION_SPLIT: 0.50,

  // Platform fee split (50% of platform commission when agent is involved, 100% when no agent)
  PLATFORM_FEE_SPLIT: 0.50,

  // Sub-agent and listing agent split (each gets 50% of agent commission)
  SUB_AGENT_SPLIT: 0.50,
  LISTING_AGENT_SPLIT: 0.50,
} as const;

export const SERVICE_FEE = {
  // Service fee multiplier (double Flutterwave's charge to cover refunds)
  SERVICE_FEE_MULTIPLIER: 2,

  // Flutterwave transaction charge (1.4% + NGN 100)
  FLUTTERWAVE_PERCENTAGE: 0.014,
  FLUTTERWAVE_FIXED_FEE: 100,

  // Service fee is non-refundable
  IS_REFUNDABLE: false,
} as const;

/**
 * Calculate service fee for a transaction
 * Formula: 2 * (1.4% of amount + NGN 100)
 */
export function calculateServiceFee(amount: number): number {
  const flutterwaveCharge =
    amount * SERVICE_FEE.FLUTTERWAVE_PERCENTAGE + SERVICE_FEE.FLUTTERWAVE_FIXED_FEE;
  return flutterwaveCharge * SERVICE_FEE.SERVICE_FEE_MULTIPLIER;
}

/**
 * Calculate platform commission (20% of rent)
 */
export function calculatePlatformCommission(rentAmount: number): number {
  return rentAmount * COMMISSION_RATES.PLATFORM_COMMISSION_RATE;
}

/**
 * Calculate agent commission distribution
 * @param platformCommission - The 20% commission collected by platform
 * @param hasAgent - Whether an agent is involved
 * @param hasSubAgent - Whether a sub-agent is involved
 * @returns Object with commission breakdown
 */
export function calculateCommissionDistribution(
  platformCommission: number,
  hasAgent: boolean,
  hasSubAgent: boolean = false
) {
  if (!hasAgent) {
    // No agent involved: platform keeps 100% of commission
    return {
      platformAmount: platformCommission,
      listingAgentAmount: 0,
      subAgentAmount: 0,
      totalAgentAmount: 0,
    };
  }

  // Agent involved: platform and agent split 50/50
  const totalAgentAmount = platformCommission * COMMISSION_RATES.AGENT_COMMISSION_SPLIT;
  const platformAmount = platformCommission * COMMISSION_RATES.PLATFORM_FEE_SPLIT;

  if (hasSubAgent) {
    // Sub-agent involved: listing agent and sub-agent split the agent portion 50/50
    const listingAgentAmount = totalAgentAmount * COMMISSION_RATES.LISTING_AGENT_SPLIT;
    const subAgentAmount = totalAgentAmount * COMMISSION_RATES.SUB_AGENT_SPLIT;

    return {
      platformAmount,
      listingAgentAmount,
      subAgentAmount,
      totalAgentAmount,
    };
  }

  // Only listing agent: gets full agent portion
  return {
    platformAmount,
    listingAgentAmount: totalAgentAmount,
    subAgentAmount: 0,
    totalAgentAmount,
  };
}

/**
 * Calculate total payment amount including service fee
 */
export function calculateTotalPaymentAmount(rentAmount: number): number {
  const serviceFee = calculateServiceFee(rentAmount);
  return rentAmount + serviceFee;
}

/**
 * Calculate owner payout after commission deduction
 */
export function calculateOwnerPayout(
  rentAmount: number,
  platformCommission: number
): number {
  return rentAmount - platformCommission;
}

/**
 * Complete commission breakdown for a rental payment
 */
export interface CommissionBreakdown {
  rentAmount: number;
  serviceFee: number;
  totalPaymentAmount: number;
  platformCommission: number;
  platformAmount: number;
  listingAgentAmount: number;
  subAgentAmount: number;
  totalAgentAmount: number;
  ownerPayout: number;
}

/**
 * Calculate complete commission breakdown
 */
export function calculateCompleteBreakdown(
  rentAmount: number,
  hasAgent: boolean,
  hasSubAgent: boolean = false
): CommissionBreakdown {
  const serviceFee = calculateServiceFee(rentAmount);
  const totalPaymentAmount = calculateTotalPaymentAmount(rentAmount);
  const platformCommission = calculatePlatformCommission(rentAmount);
  const distribution = calculateCommissionDistribution(
    platformCommission,
    hasAgent,
    hasSubAgent
  );
  const ownerPayout = calculateOwnerPayout(rentAmount, platformCommission);

  return {
    rentAmount,
    serviceFee,
    totalPaymentAmount,
    platformCommission,
    platformAmount: distribution.platformAmount,
    listingAgentAmount: distribution.listingAgentAmount,
    subAgentAmount: distribution.subAgentAmount,
    totalAgentAmount: distribution.totalAgentAmount,
    ownerPayout,
  };
}

export const COMMISSION_CONSTANTS = {
  RATES: COMMISSION_RATES,
  SERVICE_FEE,
  calculateServiceFee,
  calculatePlatformCommission,
  calculateCommissionDistribution,
  calculateTotalPaymentAmount,
  calculateOwnerPayout,
  calculateCompleteBreakdown,
} as const;


// // backend/shared/src/constants/commission.ts

// /**
//  * Commission rate constants for the Newcondo platform
//  * 
//  * Commission Structure:
//  * - Platform takes 20% of rent as total commission
//  * - If agent involved: Split 50/50 between agent(s) and platform
//  * - If no agent: Platform keeps full 20%
//  * - If sub-agent involved: Listing agent and sub-agent split the agent portion 50/50
//  */

// /**
//  * Total commission rate taken from rent payments
//  * @constant 0.20 = 20%
//  */
// export const TOTAL_COMMISSION_RATE = 0.20;

// /**
//  * Platform's share of the total commission when agents are involved
//  * @constant 0.50 = 50% of the 20% commission
//  */
// export const PLATFORM_COMMISSION_SPLIT = 0.50;

// /**
//  * Agent's share of the total commission
//  * @constant 0.50 = 50% of the 20% commission
//  */
// export const AGENT_COMMISSION_SPLIT = 0.50;

// /**
//  * Listing agent's share when a sub-agent is involved
//  * @constant 0.50 = 50% of the agent commission
//  */
// export const LISTING_AGENT_SPLIT = 0.50;

// /**
//  * Sub-agent's share when they bring in a renter
//  * @constant 0.50 = 50% of the agent commission
//  */
// export const SUB_AGENT_SPLIT = 0.50;

// /**
//  * Commission distribution scenarios
//  */
// export const COMMISSION_SCENARIOS = {
//   /**
//    * No agent involved - Platform gets full 20%
//    */
//   NO_AGENT: {
//     platformRate: TOTAL_COMMISSION_RATE,
//     agentRate: 0,
//     description: 'Direct owner listing - Platform receives full 20% commission'
//   },
  
//   /**
//    * Listing agent only (no sub-agent)
//    * Platform: 10% (50% of 20%)
//    * Listing Agent: 10% (50% of 20%)
//    */
//   LISTING_AGENT_ONLY: {
//     platformRate: TOTAL_COMMISSION_RATE * PLATFORM_COMMISSION_SPLIT,
//     listingAgentRate: TOTAL_COMMISSION_RATE * AGENT_COMMISSION_SPLIT,
//     description: 'Listing agent without sub-agent - 50/50 split of 20% commission'
//   },
  
//   /**
//    * Listing agent + Sub-agent
//    * Platform: 10% (50% of 20%)
//    * Listing Agent: 5% (25% of 20% = 50% of agent portion)
//    * Sub Agent: 5% (25% of 20% = 50% of agent portion)
//    */
//   WITH_SUB_AGENT: {
//     platformRate: TOTAL_COMMISSION_RATE * PLATFORM_COMMISSION_SPLIT,
//     listingAgentRate: (TOTAL_COMMISSION_RATE * AGENT_COMMISSION_SPLIT) * LISTING_AGENT_SPLIT,
//     subAgentRate: (TOTAL_COMMISSION_RATE * AGENT_COMMISSION_SPLIT) * SUB_AGENT_SPLIT,
//     description: 'Listing agent with sub-agent - Platform 10%, Listing agent 5%, Sub-agent 5%'
//   }
// } as const;

// /**
//  * Minimum commission amount in NGN
//  * If calculated commission is below this, use this as minimum
//  */
// export const MINIMUM_COMMISSION_AMOUNT = 500; // 500 NGN

// /**
//  * Maximum commission amount in NGN (if needed for caps)
//  * Set to null for no maximum
//  */
// export const MAXIMUM_COMMISSION_AMOUNT: number | null = null;

// /**
//  * Commission calculation precision (decimal places)
//  */
// export const COMMISSION_DECIMAL_PLACES = 2;

// /**
//  * Default currency for commissions
//  */
// export const COMMISSION_CURRENCY = 'NGN';

// /**
//  * Helper to calculate commission amounts
//  */
// export const calculateCommission = {
//   /**
//    * Calculate platform commission based on scenario
//    */
//   platform(rentAmount: number, hasAgent: boolean): number {
//     const rate = hasAgent 
//       ? COMMISSION_SCENARIOS.LISTING_AGENT_ONLY.platformRate
//       : COMMISSION_SCENARIOS.NO_AGENT.platformRate;
//     return Math.max(
//       Number((rentAmount * rate).toFixed(COMMISSION_DECIMAL_PLACES)),
//       MINIMUM_COMMISSION_AMOUNT
//     );
//   },

//   /**
//    * Calculate listing agent commission
//    */
//   listingAgent(rentAmount: number, hasSubAgent: boolean): number {
//     const rate = hasSubAgent
//       ? COMMISSION_SCENARIOS.WITH_SUB_AGENT.listingAgentRate
//       : COMMISSION_SCENARIOS.LISTING_AGENT_ONLY.listingAgentRate;
//     return Number((rentAmount * rate).toFixed(COMMISSION_DECIMAL_PLACES));
//   },

//   /**
//    * Calculate sub-agent commission
//    */
//   subAgent(rentAmount: number): number {
//     return Number(
//       (rentAmount * COMMISSION_SCENARIOS.WITH_SUB_AGENT.subAgentRate)
//         .toFixed(COMMISSION_DECIMAL_PLACES)
//     );
//   },

//   /**
//    * Calculate property owner's amount after commission
//    */
//   ownerAmount(rentAmount: number): number {
//     const commission = rentAmount * TOTAL_COMMISSION_RATE;
//     return Number((rentAmount - commission).toFixed(COMMISSION_DECIMAL_PLACES));
//   },

//   /**
//    * Calculate total commission (always 20% of rent)
//    */
//   total(rentAmount: number): number {
//     return Number((rentAmount * TOTAL_COMMISSION_RATE).toFixed(COMMISSION_DECIMAL_PLACES));
//   }
// };

// /**
//  * Commission payment status
//  */
// export const COMMISSION_STATUS = {
//   PENDING: 'PENDING',
//   HELD: 'HELD',
//   RELEASED: 'RELEASED',
//   PAID: 'PAID',
//   FAILED: 'FAILED'
// } as const;

// /**
//  * Validation rules for commission calculations
//  */
// export const COMMISSION_VALIDATION = {
//   minRentAmount: 1000, // Minimum rent amount in NGN
//   maxRentAmount: 10000000, // Maximum rent amount in NGN (10M)
//   allowNegativeCommission: false,
//   roundingMethod: 'ROUND_HALF_UP' as const
// } as const;
















// /**
//  * Commission rates and rules for the Newcondo platform
//  */

// // Platform commission rates
// export const PLATFORM_COMMISSION_RATE = 0.20; // 20% of rent
// export const LISTING_AGENT_SHARE = 0.50; // 50% of platform commission
// export const SUB_AGENT_SHARE = 0.50; // 50% of listing agent's share

// // Marking service rates
// export const MARKING_SERVICE_AGENT_COMMISSION = 0.25; // 25% of marking fee
// export const MARKING_SERVICE_PLATFORM_SHARE = 0.75; // 75% of marking fee

// // Marking service fees
// export const PROPERTY_OWNER_MARKING_FEE = 20000; // 20,000 NGN
// export const NEWCONDO_ADMIN_MARKING_FEE = 25000; // 25,000 NGN
// export const MARKING_FEE_INITIAL_PAYMENT = 1000; // 1,000 NGN upfront to agent

// // Payment confirmation and release
// export const PAYMENT_HOLD_PERIOD_HOURS = 24; // 24 hours hold period
// export const CONFIRMATION_DEADLINE_HOURS = 24; // 24 hours to confirm
// export const AUTO_RELEASE_AFTER_CONFIRMATION_HOURS = 0; // Release immediately after confirmation

// // Commission distribution timing
// export const COMMISSION_RELEASE_DELAY_HOURS = 24; // Release after 24 hours hold period

// // Refund processing
// export const PLATFORM_FEE_NON_REFUNDABLE = true;
// export const REFUND_PROCESSING_FEE_MULTIPLIER = 2; // Charge 2x Flutterwave fee for refunds

// // Virtual account settings
// export const VIRTUAL_ACCOUNT_CURRENCY = 'NGN';
// export const VIRTUAL_ACCOUNT_BANK_CODE = '000'; // Flutterwave bank code

// // Commission thresholds
// export const MINIMUM_COMMISSION_AMOUNT = 100; // Minimum commission in NGN
// export const MAXIMUM_COMMISSION_PERCENTAGE = 0.50; // Maximum 50% commission

// // Payment splitting
// export const OWNER_RECEIVES_AFTER_COMMISSION = true; // Owner gets rent minus commission
// export const AGENT_COMMISSION_PAID_SEPARATELY = true; // Agent commission paid to their account

// // Dispute settings
// export const DISPUTE_PERIOD_DAYS = 7; // Days to raise a dispute
// export const DISPUTE_RESOLUTION_DAYS = 14; // Days to resolve a dispute

// // Commission calculation rules
// export const COMMISSION_CALCULATION_RULES = {
//   // When property has listing agent
//   WITH_LISTING_AGENT: {
//     platformTakes: PLATFORM_COMMISSION_RATE,
//     listingAgentGets: PLATFORM_COMMISSION_RATE * LISTING_AGENT_SHARE,
//     newcondoGets: PLATFORM_COMMISSION_RATE * (1 - LISTING_AGENT_SHARE),
//   },
//   // When property has listing agent and sub-agent
//   WITH_SUB_AGENT: {
//     platformTakes: PLATFORM_COMMISSION_RATE,
//     listingAgentGets: PLATFORM_COMMISSION_RATE * LISTING_AGENT_SHARE * SUB_AGENT_SHARE,
//     subAgentGets: PLATFORM_COMMISSION_RATE * LISTING_AGENT_SHARE * SUB_AGENT_SHARE,
//     newcondoGets: PLATFORM_COMMISSION_RATE * (1 - LISTING_AGENT_SHARE),
//   },
//   // When property has no agent (owner direct listing)
//   NO_AGENT: {
//     platformTakes: PLATFORM_COMMISSION_RATE,
//     newcondoGets: PLATFORM_COMMISSION_RATE,
//   },
// } as const;

// // Marking service commission rules
// export const MARKING_SERVICE_RULES = {
//   AGENT_MARKING: {
//     agentGets: PROPERTY_OWNER_MARKING_FEE * MARKING_SERVICE_AGENT_COMMISSION,
//     platformGets: PROPERTY_OWNER_MARKING_FEE * MARKING_SERVICE_PLATFORM_SHARE,
//   },
//   NEWCONDO_MARKING: {
//     platformGets: NEWCONDO_ADMIN_MARKING_FEE,
//   },
// } as const;

// // Commission status values
// export const COMMISSION_STATUS = {
//   PENDING: 'PENDING',
//   HELD: 'HELD',
//   RELEASED: 'RELEASED',
//   CANCELLED: 'CANCELLED',
//   DISPUTED: 'DISPUTED',
//   REFUNDED: 'REFUNDED',
// } as const;

// // Commission types
// export const COMMISSION_TYPES = {
//   LISTING_AGENT: 'listing_agent',
//   SUB_AGENT: 'sub_agent',
//   PLATFORM: 'platform',
//   MARKING_SERVICE: 'marking_service',
// } as const;

// // Virtual account naming conventions
// export const VIRTUAL_ACCOUNT_NAMING = {
//   OWNER_PREFIX: 'OWN',
//   AGENT_PREFIX: 'AGT',
//   PLATFORM_PREFIX: 'PLT',
//   PROPERTY_PREFIX: 'PROP',
// } as const;

// // Commission calculation precision
// export const COMMISSION_DECIMAL_PLACES = 2;
// export const COMMISSION_ROUNDING_METHOD = 'round' as const; // 'round', 'floor', 'ceil'

// // Flutterwave transaction fees (estimate)
// export const FLUTTERWAVE_TRANSACTION_FEE_PERCENTAGE = 0.014; // 1.4%
// export const FLUTTERWAVE_TRANSACTION_FEE_CAP = 2000; // 2,000 NGN cap
// export const FLUTTERWAVE_TRANSACTION_FEE_MINIMUM = 10; // 10 NGN minimum

// // Service charge calculation
// export const calculateServiceCharge = (amount: number): number => {
//   const feePercentage = amount * FLUTTERWAVE_TRANSACTION_FEE_PERCENTAGE;
//   const fee = Math.min(feePercentage, FLUTTERWAVE_TRANSACTION_FEE_CAP);
//   return Math.max(fee, FLUTTERWAVE_TRANSACTION_FEE_MINIMUM);
// };

// // Double service charge for refunds
// export const calculateRefundServiceCharge = (amount: number): number => {
//   return calculateServiceCharge(amount) * REFUND_PROCESSING_FEE_MULTIPLIER;
// };

// // Commission error codes
// export const COMMISSION_ERROR_CODES = {
//   INVALID_AMOUNT: 'COMMISSION_INVALID_AMOUNT',
//   INVALID_RATE: 'COMMISSION_INVALID_RATE',
//   INSUFFICIENT_FUNDS: 'COMMISSION_INSUFFICIENT_FUNDS',
//   ALREADY_RELEASED: 'COMMISSION_ALREADY_RELEASED',
//   HOLD_PERIOD_ACTIVE: 'COMMISSION_HOLD_PERIOD_ACTIVE',
//   DISPUTE_PENDING: 'COMMISSION_DISPUTE_PENDING',
//   CALCULATION_ERROR: 'COMMISSION_CALCULATION_ERROR',
//   DISTRIBUTION_FAILED: 'COMMISSION_DISTRIBUTION_FAILED',
// } as const;