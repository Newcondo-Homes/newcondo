/**
 * Property Marking Service Fee Structure
 * All amounts in Naira (NGN)
 */
/**
 * Base marking fee charged to property owners
 */
export declare const MARKING_BASE_FEE = 20000;
/**
 * Fee for Newcondo admin to mark a property
 */
export declare const NEWCONDO_ADMIN_MARKING_FEE = 25000;
/**
 * Agent/Renter commission percentage for marking jobs
 */
export declare const AGENT_COMMISSION_PERCENTAGE = 25;
/**
 * Calculate agent commission from marking fee
 */
export declare const calculateAgentCommissionFromMarkingFee: (markingFee: number) => number;
/**
 * Calculate platform fee (remaining after agent commission)
 */
export declare const calculatePlatformFeeAfterAgentCommission: (markingFee: number) => number;
/**
 * Initial payment to agent upon marking (before confirmation)
 * Small advance to incentivize quick marking
 */
export declare const INITIAL_AGENT_PAYMENT = 1000;
/**
 * Calculate remaining payment after initial advance
 */
export declare const calculateRemainingPayment: (markingFee: number) => number;
/**
 * Time-based compensation for expired confirmations
 * If property owner doesn't confirm within deadline, agent gets paid incrementally
 */
export declare const COMPENSATION_PER_EXPIRY = 2000;
/**
 * Maximum number of expiry cycles before full payment
 */
export declare const MAX_EXPIRY_CYCLES: number;
/**
 * Fee breakdown for property owner
 */
export interface MarkingFeeBreakdown {
    totalFee: number;
    agentCommission: number;
    platformFee: number;
    initialPayment: number;
    remainingPayment: number;
}
/**
 * Get complete fee breakdown
 */
export declare const getMarkingFeeBreakdown: (markingFee?: number) => MarkingFeeBreakdown;
/**
 * Marking service type pricing
 */
export declare enum MarkingServiceType {
    SELF_MARK = "SELF_MARK",// Free - owner marks themselves
    PERSONAL_CONTACT = "PERSONAL_CONTACT",// Free - owner sends someone they know
    NEWCONDO_AGENT = "NEWCONDO_AGENT",// ₦20,000 - Assign to platform agent
    NEWCONDO_ADMIN = "NEWCONDO_ADMIN"
}
/**
 * Get fee for marking service type
 */
export declare const getMarkingFeeByType: (serviceType: MarkingServiceType) => number;
/**
 * Time-based pricing modifiers (for future use)
 */
export declare const URGENCY_MULTIPLIERS: {
    LOW: number;
    NORMAL: number;
    HIGH: number;
    URGENT: number;
};
/**
 * Calculate total fee with urgency modifier
 */
export declare const calculateFeeWithUrgency: (baseFee: number, urgencyLevel: keyof typeof URGENCY_MULTIPLIERS) => number;
/**
 * Refund policy constants
 */
export declare const REFUND_POLICY: {
    FULL_REFUND_HOURS: number;
    PARTIAL_REFUND_PERCENTAGE: number;
    NO_REFUND_HOURS: number;
};
/**
 * Calculate refund amount based on time elapsed
 */
export declare const calculateRefundAmountBasedOnElapsedTime: (paidAmount: number, hoursElapsed: number) => number;
/**
 * Fee display formatting
 */
export declare const formatFeeDisplay: (amount: number) => string;
/**
 * Fee validation
 */
export declare const isValidMarkingFee: (amount: number) => boolean;
//# sourceMappingURL=markingFees.d.ts.map