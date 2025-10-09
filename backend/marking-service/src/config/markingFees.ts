/**
 * Marking Service Fee Structure
 * Defines all fees, commissions, and payment splits for the marking service
 */

export const MARKING_FEES = {
  // Base marking fee (paid by property owner to get house marked)
  BASE_MARKING_FEE: 20000, // 20,000 NGN

  // Agent commission as percentage of base fee
  AGENT_COMMISSION_PERCENTAGE: 0.25, // 25%

  // Agent commission in naira
  AGENT_COMMISSION_AMOUNT: 5000, // 25% of 20,000 = 5,000 NGN

  // Newcondo platform fee (remaining amount)
  PLATFORM_FEE_AMOUNT: 15000, // 75% of 20,000 = 15,000 NGN

  // Initial payment to agent upon job completion (before property owner confirmation)
  AGENT_INITIAL_PAYMENT: 1000, // 1,000 NGN (partial payment)

  // Final payment to agent (released after property owner confirmation)
  AGENT_FINAL_PAYMENT: 4000, // 4,000 NGN (remaining agent commission)

  // Alternative marking option: Admin marking fee (Newcondo does the marking)
  ADMIN_MARKING_FEE: 25000, // 25,000 NGN (property owner pays this for admin to mark)

  // Referral bonus (if applicable)
  REFERRAL_BONUS_PERCENTAGE: 0.05, // 5% of marking fee
  REFERRAL_BONUS_AMOUNT: 1000, // 5% of 20,000 = 1,000 NGN

  // Penalty or refund amounts
  NO_SHOW_PENALTY: 500, // Penalty if marker doesn't show up
  CANCELLATION_FEE: 0, // No cancellation fee (refundable)

  // Payment breakdown for property owner
  OWNER_PAYMENT_BREAKDOWN: {
    baseMarkingFee: 20000,
    tax: 0, // No VAT for service-based transactions in Nigeria (may vary)
    total: 20000,
  },

  // Payment breakdown for agent
  AGENT_PAYMENT_BREAKDOWN: {
    initialPayment: 1000, // On job completion
    finalPayment: 4000, // On property owner confirmation
    total: 5000,
  },

  // Payment breakdown for Newcondo
  PLATFORM_PAYMENT_BREAKDOWN: {
    platformFee: 15000, // Main platform fee
    refundReserve: 0, // Reserved for refunds (if needed)
    total: 15000,
  },

  // Currency
  CURRENCY: 'NGN',

  // Transaction metadata
  TRANSACTION_TYPES: {
    MARKING_PAYMENT: 'MARKING_PAYMENT',
    AGENT_COMMISSION: 'AGENT_COMMISSION',
    PLATFORM_FEE: 'PLATFORM_FEE',
    REFUND: 'REFUND',
    PENALTY: 'PENALTY',
  },

  // Payment holds and releases
  PAYMENT_HOLD: {
    // Amount held from agent payment initially
    agentInitialHold: 1000,
    // Amount held from platform fee (if any)
    platformHold: 0,
    // Hold duration (auto-released if not confirmed)
    holdDurationDays: 7,
  },

  // Virtual account details
  VIRTUAL_ACCOUNT: {
    // Minimum balance to maintain
    minimumBalance: 0,
    // Maximum balance limit
    maximumBalance: 10000000, // 10 million NGN
    // Withdrawal minimum
    withdrawalMinimum: 1000,
    // Withdrawal maximum per transaction
    withdrawalMaximum: 1000000, // 1 million NGN
  },

  // Fee adjustments for special cases
  ADJUSTMENTS: {
    // Premium agents (high reliability score) - reduced fee
    premiumAgentDiscount: 0, // No discount currently
    
    // Urgent marking requests - price increase
    urgentMarkingPremium: 2000, // Additional 2,000 NGN
    
    // Bulk marking (multiple properties) - discount
    bulkMarkingDiscount: 0, // No bulk discount currently
  },

  // Minimum and maximum fees
  LIMITS: {
    minimumFee: 5000, // Minimum marking fee
    maximumFee: 100000, // Maximum marking fee
  },

  // Fee validation
  validateFee(amount: number): boolean {
    return amount >= this.LIMITS.minimumFee && amount <= this.LIMITS.maximumFee;
  },

  // Calculate agent commission
  calculateAgentCommission(baseFee: number = this.BASE_MARKING_FEE): number {
    return Math.round(baseFee * this.AGENT_COMMISSION_PERCENTAGE);
  },

  // Calculate platform fee
  calculatePlatformFee(baseFee: number = this.BASE_MARKING_FEE): number {
    return baseFee - this.calculateAgentCommission(baseFee);
  },

  // Calculate initial payment to agent
  calculateInitialPayment(baseFee: number = this.BASE_MARKING_FEE): number {
    return this.AGENT_INITIAL_PAYMENT;
  },

  // Calculate final payment to agent
  calculateFinalPayment(baseFee: number = this.BASE_MARKING_FEE): number {
    return this.calculateAgentCommission(baseFee) - this.calculateInitialPayment(baseFee);
  },

  // Get full payment breakdown
  getPaymentBreakdown(baseFee: number = this.BASE_MARKING_FEE) {
    return {
      ownerPayment: baseFee,
      agentInitialPayment: this.calculateInitialPayment(baseFee),
      agentFinalPayment: this.calculateFinalPayment(baseFee),
      agentTotalPayment: this.calculateAgentCommission(baseFee),
      platformFee: this.calculatePlatformFee(baseFee),
      currency: this.CURRENCY,
    };
  },
};

export default MARKING_FEES;