"use strict";
// backend/shared/src/constants/commission.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMISSION_CONSTANTS = exports.SERVICE_FEE = exports.COMMISSION_RATES = void 0;
exports.calculateServiceFee = calculateServiceFee;
exports.calculatePlatformCommission = calculatePlatformCommission;
exports.calculateCommissionDistributionForAgent = calculateCommissionDistributionForAgent;
exports.calculateTotalPaymentAmount = calculateTotalPaymentAmount;
exports.calculateOwnerPayout = calculateOwnerPayout;
exports.calculateCompleteBreakdown = calculateCompleteBreakdown;
/**
 * Commission rates and distribution rules for the platform
 */
exports.COMMISSION_RATES = {
    // Platform commission on successful rent (20% of rent amount)
    PLATFORM_COMMISSION_RATE: 0.20,
    // Agent commission split (50% of platform commission when agent is involved)
    AGENT_COMMISSION_SPLIT: 0.50,
    // Platform fee split (50% of platform commission when agent is involved, 100% when no agent)
    PLATFORM_FEE_SPLIT: 0.50,
    // Sub-agent and listing agent split (each gets 50% of agent commission)
    SUB_AGENT_SPLIT: 0.50,
    LISTING_AGENT_SPLIT: 0.50,
};
exports.SERVICE_FEE = {
    // Service fee multiplier (double Flutterwave's charge to cover refunds)
    SERVICE_FEE_MULTIPLIER: 2,
    // Flutterwave transaction charge (1.4% + NGN 100)
    FLUTTERWAVE_PERCENTAGE: 0.014,
    FLUTTERWAVE_FIXED_FEE: 100,
    // Service fee is non-refundable
    IS_REFUNDABLE: false,
};
/**
 * Calculate service fee for a transaction
 * Formula: 2 * (1.4% of amount + NGN 100)
 */
function calculateServiceFee(amount) {
    const flutterwaveCharge = amount * exports.SERVICE_FEE.FLUTTERWAVE_PERCENTAGE + exports.SERVICE_FEE.FLUTTERWAVE_FIXED_FEE;
    return flutterwaveCharge * exports.SERVICE_FEE.SERVICE_FEE_MULTIPLIER;
}
/**
 * Calculate platform commission (20% of rent)
 */
function calculatePlatformCommission(rentAmount) {
    return rentAmount * exports.COMMISSION_RATES.PLATFORM_COMMISSION_RATE;
}
/**
 * Calculate agent commission distribution
 * @param platformCommission - The 20% commission collected by platform
 * @param hasAgent - Whether an agent is involved
 * @param hasSubAgent - Whether a sub-agent is involved
 * @returns Object with commission breakdown
 */
function calculateCommissionDistributionForAgent(platformCommission, hasAgent, hasSubAgent = false) {
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
    const totalAgentAmount = platformCommission * exports.COMMISSION_RATES.AGENT_COMMISSION_SPLIT;
    const platformAmount = platformCommission * exports.COMMISSION_RATES.PLATFORM_FEE_SPLIT;
    if (hasSubAgent) {
        // Sub-agent involved: listing agent and sub-agent split the agent portion 50/50
        const listingAgentAmount = totalAgentAmount * exports.COMMISSION_RATES.LISTING_AGENT_SPLIT;
        const subAgentAmount = totalAgentAmount * exports.COMMISSION_RATES.SUB_AGENT_SPLIT;
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
function calculateTotalPaymentAmount(rentAmount) {
    const serviceFee = calculateServiceFee(rentAmount);
    return rentAmount + serviceFee;
}
/**
 * Calculate owner payout after commission deduction
 */
function calculateOwnerPayout(rentAmount, platformCommission) {
    return rentAmount - platformCommission;
}
/**
 * Calculate complete commission breakdown
 */
function calculateCompleteBreakdown(rentAmount, hasAgent, hasSubAgent = false) {
    const serviceFee = calculateServiceFee(rentAmount);
    const totalPaymentAmount = calculateTotalPaymentAmount(rentAmount);
    const platformCommission = calculatePlatformCommission(rentAmount);
    const distribution = calculateCommissionDistributionForAgent(platformCommission, hasAgent, hasSubAgent);
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
exports.COMMISSION_CONSTANTS = {
    RATES: exports.COMMISSION_RATES,
    SERVICE_FEE: exports.SERVICE_FEE,
    calculateServiceFee,
    calculatePlatformCommission,
    calculateCommissionDistributionForAgent,
    calculateTotalPaymentAmount,
    calculateOwnerPayout,
    calculateCompleteBreakdown,
};
//# sourceMappingURL=commission.js.map