/**
 * Commission Rates Constants
 * File: apps/platform/lib/constants/commission.ts
 * 
 * Commission rates and distribution rules for the NewCondo platform
 */

/**
 * Platform commission rates
 */
export const COMMISSION_RATES = {
  /**
   * Platform takes 20% of the rent as commission
   */
  PLATFORM_RATE: 0.2,

  /**
   * Agents receive 50% of the platform commission (10% of total rent)
   * when they are involved in the transaction
   */
  AGENT_SHARE: 0.5,

  /**
   * NewCondo receives 50% of the platform commission (10% of total rent)
   * when agents are involved, or 100% (20% of total rent) when no agents are involved
   */
  NEWCONDO_SHARE: 0.5,

  /**
   * When a sub-agent is involved, the listing agent receives 50% of the agent commission
   * (5% of total rent)
   */
  LISTING_AGENT_WITH_SUB: 0.5,

  /**
   * When a sub-agent is involved, the sub-agent receives 50% of the agent commission
   * (5% of total rent)
   */
  SUB_AGENT_SHARE: 0.5,

  /**
   * Property owner receives 80% of the rent after platform commission is deducted
   */
  OWNER_SHARE: 0.8,
} as const;

/**
 * Transaction fee rates
 */
export const TRANSACTION_FEES = {
  /**
   * Flutterwave standard transaction fee rate (1.4%)
   * This is the base rate, actual rate may vary
   */
  FLUTTERWAVE_RATE: 0.014,

  /**
   * Flutterwave capped fee for large transactions
   */
  FLUTTERWAVE_CAP: 2000, // NGN

  /**
   * Platform service fee multiplier
   * We charge double the Flutterwave fee to cover potential refund costs
   */
  SERVICE_FEE_MULTIPLIER: 2,

  /**
   * Minimum service fee in NGN
   */
  MIN_SERVICE_FEE: 100,
} as const;

/**
 * Commission distribution scenarios
 */
export enum CommissionScenario {
  /**
   * No agent involved - NewCondo receives full 20% commission
   */
  NO_AGENT = 'NO_AGENT',

  /**
   * Only listing agent - Agent gets 10%, NewCondo gets 10%
   */
  LISTING_AGENT_ONLY = 'LISTING_AGENT_ONLY',

  /**
   * Listing agent + Sub-agent - Each agent gets 5%, NewCondo gets 10%
   */
  WITH_SUB_AGENT = 'WITH_SUB_AGENT',
}

/**
 * Commission distribution rules by scenario
 */
export const COMMISSION_DISTRIBUTION: Record<
  CommissionScenario,
  {
    description: string;
    ownerPercentage: number;
    listingAgentPercentage: number;
    subAgentPercentage: number;
    newCondoPercentage: number;
  }
> = {
  [CommissionScenario.NO_AGENT]: {
    description: 'Direct property owner listing without agents',
    ownerPercentage: 80,
    listingAgentPercentage: 0,
    subAgentPercentage: 0,
    newCondoPercentage: 20,
  },
  [CommissionScenario.LISTING_AGENT_ONLY]: {
    description: 'Property listed by agent, no sub-agent promotion',
    ownerPercentage: 80,
    listingAgentPercentage: 10,
    subAgentPercentage: 0,
    newCondoPercentage: 10,
  },
  [CommissionScenario.WITH_SUB_AGENT]: {
    description: 'Property listed by agent and promoted by sub-agent',
    ownerPercentage: 80,
    listingAgentPercentage: 5,
    subAgentPercentage: 5,
    newCondoPercentage: 10,
  },
};

/**
 * Withdrawal settings
 */
export const WITHDRAWAL_SETTINGS = {
  /**
   * Minimum withdrawal amount in NGN
   */
  MIN_WITHDRAWAL: 1000,

  /**
   * Maximum withdrawal amount per transaction in NGN
   */
  MAX_WITHDRAWAL: 1000000,

  /**
   * Daily withdrawal limit in NGN
   */
  DAILY_LIMIT: 5000000,

  /**
   * Withdrawal processing time in business days
   */
  PROCESSING_DAYS: 1,

  /**
   * Maximum processing time in business days
   */
  MAX_PROCESSING_DAYS: 3,
} as const;

/**
 * Auto-transfer settings
 */
export const AUTO_TRANSFER_SETTINGS = {
  /**
   * Supported intervals for automatic transfers
   */
  INTERVALS: {
    IMMEDIATE: 'immediate',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
  } as const,

  /**
   * Minimum balance required for auto-transfer in NGN
   */
  MIN_BALANCE_THRESHOLD: 5000,

  /**
   * Processing time for scheduled transfers (in hours)
   */
  PROCESSING_TIME_HOURS: 24,
} as const;

/**
 * Virtual account settings
 */
export const VIRTUAL_ACCOUNT_SETTINGS = {
  /**
   * Currency for virtual accounts
   */
  CURRENCY: 'NGN',

  /**
   * Account name format for users
   */
  ACCOUNT_NAME_FORMAT: {
    USER: 'NewCondo - {userName}',
    PROPERTY: 'NewCondo Property - {propertyId}',
    ADMIN: 'NewCondo Platform',
  },

  /**
   * Initial balance for new accounts
   */
  INITIAL_BALANCE: 0,

  /**
   * Lock duration after payment (in milliseconds)
   * Locked until confirmation period passes
   */
  LOCK_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * Commission calculation helpers
 */
export function calculatePlatformCommission(rentAmount: number): number {
  return rentAmount * COMMISSION_RATES.PLATFORM_RATE;
}

export function calculateOwnerAmount(rentAmount: number): number {
  return rentAmount * COMMISSION_RATES.OWNER_SHARE;
}

export function calculateAgentCommission(rentAmount: number): number {
  const platformCommission = calculatePlatformCommission(rentAmount);
  return platformCommission * COMMISSION_RATES.AGENT_SHARE;
}

export function calculateNewCondoShare(
  rentAmount: number,
  hasAgent: boolean
): number {
  const platformCommission = calculatePlatformCommission(rentAmount);
  return hasAgent
    ? platformCommission * COMMISSION_RATES.NEWCONDO_SHARE
    : platformCommission;
}

export function calculateListingAgentShare(
  rentAmount: number,
  hasSubAgent: boolean
): number {
  const agentCommission = calculateAgentCommission(rentAmount);
  return hasSubAgent
    ? agentCommission * COMMISSION_RATES.LISTING_AGENT_WITH_SUB
    : agentCommission;
}

export function calculateSubAgentShare(rentAmount: number): number {
  const agentCommission = calculateAgentCommission(rentAmount);
  return agentCommission * COMMISSION_RATES.SUB_AGENT_SHARE;
}

/**
 * Transaction fee calculation helpers
 */
export function calculateFlutterwaveFee(amount: number): number {
  const fee = amount * TRANSACTION_FEES.FLUTTERWAVE_RATE;
  return Math.min(fee, TRANSACTION_FEES.FLUTTERWAVE_CAP);
}

export function calculatePlatformServiceFee(amount: number): number {
  const flutterwaveFee = calculateFlutterwaveFee(amount);
  const serviceFee = flutterwaveFee * TRANSACTION_FEES.SERVICE_FEE_MULTIPLIER;
  return Math.max(serviceFee, TRANSACTION_FEES.MIN_SERVICE_FEE);
}

export function calculateTotalTransactionFees(amount: number): {
  flutterwaveFee: number;
  serviceFee: number;
  total: number;
} {
  const flutterwaveFee = calculateFlutterwaveFee(amount);
  const serviceFee = calculatePlatformServiceFee(amount);
  
  return {
    flutterwaveFee,
    serviceFee,
    total: serviceFee, // Only service fee is charged to user
  };
}

/**
 * Determine commission scenario based on involvement
 */
export function determineCommissionScenario(
  hasListingAgent: boolean,
  hasSubAgent: boolean
): CommissionScenario {
  if (!hasListingAgent) {
    return CommissionScenario.NO_AGENT;
  }
  
  if (hasSubAgent) {
    return CommissionScenario.WITH_SUB_AGENT;
  }
  
  return CommissionScenario.LISTING_AGENT_ONLY;
}

/**
 * Get commission distribution for a scenario
 */
export function getCommissionDistribution(scenario: CommissionScenario) {
  return COMMISSION_DISTRIBUTION[scenario];
}

/**
 * Validate withdrawal amount
 */
export function isValidWithdrawalAmount(amount: number): {
  valid: boolean;
  error?: string;
} {
  if (amount < WITHDRAWAL_SETTINGS.MIN_WITHDRAWAL) {
    return {
      valid: false,
      error: `Minimum withdrawal amount is ₦${WITHDRAWAL_SETTINGS.MIN_WITHDRAWAL.toLocaleString()}`,
    };
  }
  
  if (amount > WITHDRAWAL_SETTINGS.MAX_WITHDRAWAL) {
    return {
      valid: false,
      error: `Maximum withdrawal amount is ₦${WITHDRAWAL_SETTINGS.MAX_WITHDRAWAL.toLocaleString()}`,
    };
  }
  
  return { valid: true };
}

/**
 * Check if amount exceeds daily limit
 */
export function exceedsDailyLimit(
  amount: number,
  dailyTotal: number
): boolean {
  return dailyTotal + amount > WITHDRAWAL_SETTINGS.DAILY_LIMIT;
}












// // apps/platform/lib/constants/commission.ts

// /**
//  * Commission Constants
//  * Defines commission rates and splits for the platform
//  */

// // Platform commission rate (20% of rent)
// export const PLATFORM_COMMISSION_RATE = 0.20;

// // Commission split for listing agent (50% of platform commission)
// export const LISTING_AGENT_COMMISSION_SPLIT = 0.50;

// // Commission split for sub-agent (50% of platform commission when involved)
// export const SUB_AGENT_COMMISSION_SPLIT = 0.50;

// // Platform's share when only listing agent is involved (50% of 20%)
// export const PLATFORM_SHARE_WITH_LISTING_AGENT = 0.50;

// // Platform's share when no agent is involved (100% of 20%)
// export const PLATFORM_SHARE_NO_AGENT = 1.00;

// // Property marking service fees
// export const MARKING_SERVICE_FEES = {
//   OWNER_PAYMENT: 20000, // Amount property owner pays for marking service
//   AGENT_COMPENSATION_RATE: 0.25, // 25% of marking fee goes to agent
//   PLATFORM_SHARE_RATE: 0.75, // 75% of marking fee goes to platform
//   NEWCONDO_ADMIN_MARKING_FEE: 25000, // Fee when Newcondo admin marks the property
//   INITIAL_AGENT_PAYMENT: 1000, // Small payment to agent after marking (before confirmation)
// } as const;

// // Calculate derived marking service amounts
// export const MARKING_SERVICE_AMOUNTS = {
//   AGENT_TOTAL_COMPENSATION: MARKING_SERVICE_FEES.OWNER_PAYMENT * MARKING_SERVICE_FEES.AGENT_COMPENSATION_RATE,
//   PLATFORM_SHARE: MARKING_SERVICE_FEES.OWNER_PAYMENT * MARKING_SERVICE_FEES.PLATFORM_SHARE_RATE,
//   AGENT_INITIAL_PAYMENT: MARKING_SERVICE_FEES.INITIAL_AGENT_PAYMENT,
//   AGENT_FINAL_PAYMENT: (MARKING_SERVICE_FEES.OWNER_PAYMENT * MARKING_SERVICE_FEES.AGENT_COMPENSATION_RATE) - MARKING_SERVICE_FEES.INITIAL_AGENT_PAYMENT,
// } as const;

// // Commission calculation helpers
// export const calculatePlatformCommission = (rentAmount: number): number => {
//   return rentAmount * PLATFORM_COMMISSION_RATE;
// };

// export const calculateListingAgentCommission = (rentAmount: number, hasSubAgent: boolean): number => {
//   const platformCommission = calculatePlatformCommission(rentAmount);
  
//   if (hasSubAgent) {
//     // Split 50/50 between listing agent and sub-agent
//     return platformCommission * LISTING_AGENT_COMMISSION_SPLIT;
//   }
  
//   // Listing agent gets full 50% of platform commission
//   return platformCommission * LISTING_AGENT_COMMISSION_SPLIT;
// };

// export const calculateSubAgentCommission = (rentAmount: number): number => {
//   const platformCommission = calculatePlatformCommission(rentAmount);
//   return platformCommission * SUB_AGENT_COMMISSION_SPLIT;
// };

// export const calculatePlatformShare = (rentAmount: number, hasListingAgent: boolean, hasSubAgent: boolean): number => {
//   const platformCommission = calculatePlatformCommission(rentAmount);
  
//   if (!hasListingAgent) {
//     // No agents involved - platform gets 100% of commission
//     return platformCommission * PLATFORM_SHARE_NO_AGENT;
//   }
  
//   if (hasSubAgent) {
//     // Both listing agent and sub-agent involved - platform gets 0%
//     return 0;
//   }
  
//   // Only listing agent involved - platform gets 50% of commission
//   return platformCommission * PLATFORM_SHARE_WITH_LISTING_AGENT;
// };

// export const calculateOwnerAmount = (rentAmount: number): number => {
//   const platformCommission = calculatePlatformCommission(rentAmount);
//   return rentAmount - platformCommission;
// };

// // Commission breakdown type
// export interface CommissionBreakdown {
//   rentAmount: number;
//   platformCommission: number;
//   listingAgentCommission: number;
//   subAgentCommission: number;
//   platformShare: number;
//   ownerAmount: number;
// }

// export const calculateFullCommissionBreakdown = (
//   rentAmount: number,
//   hasListingAgent: boolean,
//   hasSubAgent: boolean
// ): CommissionBreakdown => {
//   const platformCommission = calculatePlatformCommission(rentAmount);
//   const listingAgentCommission = hasListingAgent 
//     ? calculateListingAgentCommission(rentAmount, hasSubAgent) 
//     : 0;
//   const subAgentCommission = hasSubAgent 
//     ? calculateSubAgentCommission(rentAmount) 
//     : 0;
//   const platformShare = calculatePlatformShare(rentAmount, hasListingAgent, hasSubAgent);
//   const ownerAmount = calculateOwnerAmount(rentAmount);

//   return {
//     rentAmount,
//     platformCommission,
//     listingAgentCommission,
//     subAgentCommission,
//     platformShare,
//     ownerAmount,
//   };
// };

// // Commission status
// export const COMMISSION_STATUS = {
//   PENDING: 'pending',
//   HELD: 'held',
//   RELEASED: 'released',
//   PAID: 'paid',
// } as const;

// export type CommissionStatus = typeof COMMISSION_STATUS[keyof typeof COMMISSION_STATUS];

// // Commission status labels
// export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
//   [COMMISSION_STATUS.PENDING]: 'Pending',
//   [COMMISSION_STATUS.HELD]: 'Held (Confirmation Period)',
//   [COMMISSION_STATUS.RELEASED]: 'Released',
//   [COMMISSION_STATUS.PAID]: 'Paid',
// };

// // Minimum withdrawal amount
// export const MIN_WITHDRAWAL_AMOUNT = 1000; // NGN

// // Auto-transfer options
// export const AUTO_TRANSFER_OPTIONS = {
//   IMMEDIATE: 'immediate',
//   DAILY: 'daily',
//   WEEKLY: 'weekly',
//   MONTHLY: 'monthly',
//   MANUAL: 'manual',
// } as const;

// export type AutoTransferOption = typeof AUTO_TRANSFER_OPTIONS[keyof typeof AUTO_TRANSFER_OPTIONS];

// // Auto-transfer labels
// export const AUTO_TRANSFER_LABELS: Record<AutoTransferOption, string> = {
//   [AUTO_TRANSFER_OPTIONS.IMMEDIATE]: 'Immediate (After Confirmation)',
//   [AUTO_TRANSFER_OPTIONS.DAILY]: 'Daily',
//   [AUTO_TRANSFER_OPTIONS.WEEKLY]: 'Weekly',
//   [AUTO_TRANSFER_OPTIONS.MONTHLY]: 'Monthly',
//   [AUTO_TRANSFER_OPTIONS.MANUAL]: 'Manual Only',
// };

// // Export all constants
// export default {
//   PLATFORM_COMMISSION_RATE,
//   LISTING_AGENT_COMMISSION_SPLIT,
//   SUB_AGENT_COMMISSION_SPLIT,
//   PLATFORM_SHARE_WITH_LISTING_AGENT,
//   PLATFORM_SHARE_NO_AGENT,
//   MARKING_SERVICE_FEES,
//   MARKING_SERVICE_AMOUNTS,
//   COMMISSION_STATUS,
//   COMMISSION_STATUS_LABELS,
//   MIN_WITHDRAWAL_AMOUNT,
//   AUTO_TRANSFER_OPTIONS,
//   AUTO_TRANSFER_LABELS,
//   calculatePlatformCommission,
//   calculateListingAgentCommission,
//   calculateSubAgentCommission,
//   calculatePlatformShare,
//   calculateOwnerAmount,
//   calculateFullCommissionBreakdown,
// };