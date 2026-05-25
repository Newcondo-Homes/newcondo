"use strict";
// backend/shared/src/constants/markingFees.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidMarkingFee = exports.formatFeeDisplay = exports.calculateRefundAmountBasedOnElapsedTime = exports.REFUND_POLICY = exports.calculateFeeWithUrgency = exports.URGENCY_MULTIPLIERS = exports.getMarkingFeeByType = exports.MarkingServiceType = exports.getMarkingFeeBreakdown = exports.MAX_EXPIRY_CYCLES = exports.COMPENSATION_PER_EXPIRY = exports.calculateRemainingPayment = exports.INITIAL_AGENT_PAYMENT = exports.calculatePlatformFeeAfterAgentCommission = exports.calculateAgentCommissionFromMarkingFee = exports.AGENT_COMMISSION_PERCENTAGE = exports.NEWCONDO_ADMIN_MARKING_FEE = exports.MARKING_BASE_FEE = void 0;
/**
 * Property Marking Service Fee Structure
 * All amounts in Naira (NGN)
 */
/**
 * Base marking fee charged to property owners
 */
exports.MARKING_BASE_FEE = 20000; // ₦20,000
/**
 * Fee for Newcondo admin to mark a property
 */
exports.NEWCONDO_ADMIN_MARKING_FEE = 25000; // ₦25,000
/**
 * Agent/Renter commission percentage for marking jobs
 */
exports.AGENT_COMMISSION_PERCENTAGE = 25; // 25%
/**
 * Calculate agent commission from marking fee
 */
const calculateAgentCommissionFromMarkingFee = (markingFee) => {
    return (markingFee * exports.AGENT_COMMISSION_PERCENTAGE) / 100;
};
exports.calculateAgentCommissionFromMarkingFee = calculateAgentCommissionFromMarkingFee;
/**
 * Calculate platform fee (remaining after agent commission)
 */
const calculatePlatformFeeAfterAgentCommission = (markingFee) => {
    return markingFee - (0, exports.calculateAgentCommissionFromMarkingFee)(markingFee);
};
exports.calculatePlatformFeeAfterAgentCommission = calculatePlatformFeeAfterAgentCommission;
/**
 * Initial payment to agent upon marking (before confirmation)
 * Small advance to incentivize quick marking
 */
exports.INITIAL_AGENT_PAYMENT = 1000; // ₦1,000
/**
 * Calculate remaining payment after initial advance
 */
const calculateRemainingPayment = (markingFee) => {
    return (0, exports.calculateAgentCommissionFromMarkingFee)(markingFee) - exports.INITIAL_AGENT_PAYMENT;
};
exports.calculateRemainingPayment = calculateRemainingPayment;
/**
 * Time-based compensation for expired confirmations
 * If property owner doesn't confirm within deadline, agent gets paid incrementally
 */
exports.COMPENSATION_PER_EXPIRY = 2000; // ₦2,000 per expiry cycle
/**
 * Maximum number of expiry cycles before full payment
 */
exports.MAX_EXPIRY_CYCLES = Math.ceil((0, exports.calculateAgentCommissionFromMarkingFee)(exports.MARKING_BASE_FEE) / exports.COMPENSATION_PER_EXPIRY);
/**
 * Get complete fee breakdown
 */
const getMarkingFeeBreakdown = (markingFee = exports.MARKING_BASE_FEE) => {
    const agentCommission = (0, exports.calculateAgentCommissionFromMarkingFee)(markingFee);
    return {
        totalFee: markingFee,
        agentCommission,
        platformFee: (0, exports.calculatePlatformFeeAfterAgentCommission)(markingFee),
        initialPayment: exports.INITIAL_AGENT_PAYMENT,
        remainingPayment: agentCommission - exports.INITIAL_AGENT_PAYMENT
    };
};
exports.getMarkingFeeBreakdown = getMarkingFeeBreakdown;
/**
 * Marking service type pricing
 */
var MarkingServiceType;
(function (MarkingServiceType) {
    MarkingServiceType["SELF_MARK"] = "SELF_MARK";
    MarkingServiceType["PERSONAL_CONTACT"] = "PERSONAL_CONTACT";
    MarkingServiceType["NEWCONDO_AGENT"] = "NEWCONDO_AGENT";
    MarkingServiceType["NEWCONDO_ADMIN"] = "NEWCONDO_ADMIN"; // ₦25,000 - Admin marks
})(MarkingServiceType || (exports.MarkingServiceType = MarkingServiceType = {}));
/**
 * Get fee for marking service type
 */
const getMarkingFeeByType = (serviceType) => {
    switch (serviceType) {
        case MarkingServiceType.SELF_MARK:
            return 0;
        case MarkingServiceType.PERSONAL_CONTACT:
            return 0;
        case MarkingServiceType.NEWCONDO_AGENT:
            return exports.MARKING_BASE_FEE;
        case MarkingServiceType.NEWCONDO_ADMIN:
            return exports.NEWCONDO_ADMIN_MARKING_FEE;
        default:
            return 0;
    }
};
exports.getMarkingFeeByType = getMarkingFeeByType;
/**
 * Time-based pricing modifiers (for future use)
 */
exports.URGENCY_MULTIPLIERS = {
    LOW: 1.0, // No additional fee
    NORMAL: 1.0, // No additional fee
    HIGH: 1.2, // 20% increase
    URGENT: 1.5 // 50% increase
};
/**
 * Calculate total fee with urgency modifier
 */
const calculateFeeWithUrgency = (baseFee, urgencyLevel) => {
    return baseFee * exports.URGENCY_MULTIPLIERS[urgencyLevel];
};
exports.calculateFeeWithUrgency = calculateFeeWithUrgency;
/**
 * Refund policy constants
 */
exports.REFUND_POLICY = {
    FULL_REFUND_HOURS: 24, // Full refund if cancelled within 24 hours
    PARTIAL_REFUND_PERCENTAGE: 50, // 50% refund after 24 hours
    NO_REFUND_HOURS: 48 // No refund after 48 hours
};
/**
 * Calculate refund amount based on time elapsed
 */
const calculateRefundAmountBasedOnElapsedTime = (paidAmount, hoursElapsed) => {
    if (hoursElapsed <= exports.REFUND_POLICY.FULL_REFUND_HOURS) {
        return paidAmount;
    }
    else if (hoursElapsed <= exports.REFUND_POLICY.NO_REFUND_HOURS) {
        return (paidAmount * exports.REFUND_POLICY.PARTIAL_REFUND_PERCENTAGE) / 100;
    }
    return 0;
};
exports.calculateRefundAmountBasedOnElapsedTime = calculateRefundAmountBasedOnElapsedTime;
/**
 * Fee display formatting
 */
const formatFeeDisplay = (amount) => {
    return `₦${amount.toLocaleString('en-NG')}`;
};
exports.formatFeeDisplay = formatFeeDisplay;
/**
 * Fee validation
 */
const isValidMarkingFee = (amount) => {
    return amount >= 0 && amount <= 100000; // Max ₦100,000
};
exports.isValidMarkingFee = isValidMarkingFee;
//# sourceMappingURL=markingFees.js.map