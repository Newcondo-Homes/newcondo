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