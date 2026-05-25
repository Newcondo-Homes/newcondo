"use strict";
/**
 * Marking Job Utilities
 * Handles time slots, queue management, and marking job calculations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistance = exports.isAgentWithinProximity = exports.generateMarkingToken = exports.validateMarkingCompletion = exports.formatTimeSlotExpiry = exports.calculateQueuePriority = exports.shouldAutoCancelJob = exports.getConfirmationTimeRemaining = exports.getTimeSlotRemaining = exports.getMarkingFee = exports.calculatePartialPaymentCycles = exports.calculateRemainingPaymentAfterPartialPayment = exports.getPartialPaymentAmount = exports.calculatePlatformFeeForMarkingJob = exports.markingCalculateAgentCommission = exports.isConfirmationDeadlinePassed = exports.isMarkingTimeSlotExpired = exports.calculateConfirmationDeadlineForPropertyOwner = exports.calculateMaxCompletionTime = exports.calculateTimeSlotExpiry = exports.NEWCONDO_MARKING_FEE = exports.FULL_MARKING_FEE = exports.PARTIAL_PAYMENT_AMOUNT = exports.CONFIRMATION_WINDOW_DAYS = exports.MAX_COMPLETION_DAYS = exports.MARKING_TIME_SLOT_HOURS = void 0;
const date_fns_1 = require("date-fns");
const db_1 = require("@newcondo/db");
// Constants
exports.MARKING_TIME_SLOT_HOURS = 3;
exports.MAX_COMPLETION_DAYS = 3;
exports.CONFIRMATION_WINDOW_DAYS = 2;
exports.PARTIAL_PAYMENT_AMOUNT = 1000; // NGN
exports.FULL_MARKING_FEE = 20000; // NGN
const AGENT_COMMISSION_PERCENTAGE = 0.25; // 25%
exports.NEWCONDO_MARKING_FEE = 25000; // NGN
/**
 * Calculate the time slot expiry for a marking job
 * @param assignedAt - The time when the job was assigned
 * @returns The expiry time (3 hours from assignment)
 */
const calculateTimeSlotExpiry = (assignedAt) => {
    return (0, date_fns_1.addHours)(assignedAt, exports.MARKING_TIME_SLOT_HOURS);
};
exports.calculateTimeSlotExpiry = calculateTimeSlotExpiry;
/**
 * Calculate the maximum completion time for a marking job
 * @param createdAt - The time when the job was created
 * @returns The maximum completion time (3 days from creation)
 */
const calculateMaxCompletionTime = (createdAt) => {
    return (0, date_fns_1.addDays)(createdAt, exports.MAX_COMPLETION_DAYS);
};
exports.calculateMaxCompletionTime = calculateMaxCompletionTime;
/**
 * Calculate the confirmation deadline for property owner
 * @param markedAt - The time when the property was marked
 * @returns The confirmation deadline (2 days from marking)
 */
const calculateConfirmationDeadlineForPropertyOwner = (markedAt) => {
    return (0, date_fns_1.addDays)(markedAt, exports.CONFIRMATION_WINDOW_DAYS);
};
exports.calculateConfirmationDeadlineForPropertyOwner = calculateConfirmationDeadlineForPropertyOwner;
/**
 * Check if a time slot has expired
 * @param timeSlotExpiry - The expiry time of the slot
 * @returns true if expired, false otherwise
 */
const isMarkingTimeSlotExpired = (timeSlotExpiry) => {
    return (0, date_fns_1.isBefore)(timeSlotExpiry, new Date());
};
exports.isMarkingTimeSlotExpired = isMarkingTimeSlotExpired;
/**
 * Check if the confirmation deadline has passed
 * @param confirmationDeadline - The confirmation deadline
 * @returns true if deadline passed, false otherwise
 */
const isConfirmationDeadlinePassed = (confirmationDeadline) => {
    return (0, date_fns_1.isBefore)(confirmationDeadline, new Date());
};
exports.isConfirmationDeadlinePassed = isConfirmationDeadlinePassed;
/**
 * Calculate agent commission for a marking job
 * @param markingFee - The total marking fee
 * @returns The agent's commission amount
 */
const markingCalculateAgentCommission = (markingFee) => {
    return markingFee * AGENT_COMMISSION_PERCENTAGE;
};
exports.markingCalculateAgentCommission = markingCalculateAgentCommission;
/**
 * Calculate platform fee for a marking job
 * @param markingFee - The total marking fee
 * @returns The platform's fee amount
 */
const calculatePlatformFeeForMarkingJob = (markingFee) => {
    return markingFee * (1 - AGENT_COMMISSION_PERCENTAGE);
};
exports.calculatePlatformFeeForMarkingJob = calculatePlatformFeeForMarkingJob;
/**
 * Calculate partial payment for initial marking completion
 * @returns The partial payment amount
 */
const getPartialPaymentAmount = () => {
    return exports.PARTIAL_PAYMENT_AMOUNT;
};
exports.getPartialPaymentAmount = getPartialPaymentAmount;
/**
 * Calculate remaining payment after partial payment
 * @param totalFee - The total marking fee
 * @param partialPayment - The partial payment already made
 * @returns The remaining payment amount
 */
const calculateRemainingPaymentAfterPartialPayment = (totalFee, partialPayment) => {
    return totalFee - partialPayment;
};
exports.calculateRemainingPaymentAfterPartialPayment = calculateRemainingPaymentAfterPartialPayment;
/**
 * Calculate how many partial payments can be made from the remaining fee
 * @param remainingFee - The remaining fee amount
 * @returns Number of partial payments possible
 */
const calculatePartialPaymentCycles = (remainingFee) => {
    return Math.floor(remainingFee / exports.PARTIAL_PAYMENT_AMOUNT);
};
exports.calculatePartialPaymentCycles = calculatePartialPaymentCycles;
/**
 * Get the marking fee based on who is marking
 * @param markerType - Type of marker ('self', 'newcondo', 'known_person', 'agent')
 * @returns The marking fee amount
 */
const getMarkingFee = (markerType) => {
    switch (markerType) {
        case 'self':
            return 0; // No fee if marking themselves
        case 'newcondo':
            return exports.NEWCONDO_MARKING_FEE;
        case 'known_person':
            return 0; // No fee if sending someone they know
        case 'agent':
            return exports.FULL_MARKING_FEE;
        default:
            return exports.FULL_MARKING_FEE;
    }
};
exports.getMarkingFee = getMarkingFee;
/**
 * Calculate time remaining in a time slot
 * @param timeSlotExpiry - The expiry time of the slot
 * @returns Milliseconds remaining (0 if expired)
 */
const getTimeSlotRemaining = (timeSlotExpiry) => {
    const now = new Date();
    if ((0, date_fns_1.isBefore)(timeSlotExpiry, now)) {
        return 0;
    }
    return (0, date_fns_1.differenceInMilliseconds)(timeSlotExpiry, now);
};
exports.getTimeSlotRemaining = getTimeSlotRemaining;
/**
 * Calculate time remaining until confirmation deadline
 * @param confirmationDeadline - The confirmation deadline
 * @returns Milliseconds remaining (0 if passed)
 */
const getConfirmationTimeRemaining = (confirmationDeadline) => {
    const now = new Date();
    if ((0, date_fns_1.isBefore)(confirmationDeadline, now)) {
        return 0;
    }
    return (0, date_fns_1.differenceInMilliseconds)(confirmationDeadline, now);
};
exports.getConfirmationTimeRemaining = getConfirmationTimeRemaining;
/**
 * Determine if a marking job should be auto-cancelled
 * @param createdAt - When the job was created
 * @param status - Current status of the job
 * @returns true if should be cancelled, false otherwise
 */
const shouldAutoCancelJob = (createdAt, status) => {
    if (status === db_1.MarkingJobStatus.COMPLETED || status === db_1.MarkingJobStatus.CANCELLED) {
        return false;
    }
    const maxCompletionTime = (0, exports.calculateMaxCompletionTime)(createdAt);
    return (0, date_fns_1.isBefore)(maxCompletionTime, new Date());
};
exports.shouldAutoCancelJob = shouldAutoCancelJob;
/**
 * Get priority score for queue sorting
 * @param urgencyLevel - The urgency level of the job
 * @param createdAt - When the job was created
 * @returns Priority score (higher = more priority)
 */
const calculateQueuePriority = (urgencyLevel, createdAt) => {
    // Base score from urgency
    let score = 0;
    switch (urgencyLevel) {
        case db_1.UrgencyLevel.URGENT:
            score = 1000;
            break;
        case db_1.UrgencyLevel.HIGH:
            score = 500;
            break;
        case db_1.UrgencyLevel.NORMAL:
            score = 100;
            break;
        case db_1.UrgencyLevel.LOW:
            score = 50;
            break;
    }
    // Add time-based score (older jobs get higher priority)
    const hoursOld = (0, date_fns_1.differenceInMilliseconds)(new Date(), createdAt) / (1000 * 60 * 60);
    score += hoursOld;
    return score;
};
exports.calculateQueuePriority = calculateQueuePriority;
/**
 * Format time slot expiry for display
 * @param timeSlotExpiry - The expiry time
 * @returns Human-readable time remaining
 */
const formatTimeSlotExpiry = (timeSlotExpiry) => {
    const remaining = (0, exports.getTimeSlotRemaining)(timeSlotExpiry);
    if (remaining === 0) {
        return 'Expired';
    }
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
};
exports.formatTimeSlotExpiry = formatTimeSlotExpiry;
/**
 * Validate marking completion data
 * @param data - Completion data to validate
 * @returns Validation result
 */
const validateMarkingCompletion = (data) => {
    const errors = [];
    if (!data.completionImages || data.completionImages.length === 0) {
        errors.push('At least one completion image is required');
    }
    if (data.completionImages && data.completionImages.length < 3) {
        errors.push('Minimum of 3 completion images required');
    }
    if (!data.boundaryData) {
        errors.push('Boundary data is required');
    }
    if (data.boundaryData) {
        // Validate boundary data structure
        if (!data.boundaryData.coordinates || !Array.isArray(data.boundaryData.coordinates)) {
            errors.push('Invalid boundary coordinates');
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
};
exports.validateMarkingCompletion = validateMarkingCompletion;
/**
 * Generate a shareable marking link token
 * @param propertyId - The property ID
 * @param ownerId - The owner ID
 * @returns A unique token for the shareable link
 */
const generateMarkingToken = (propertyId, ownerId) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${propertyId}-${ownerId}-${timestamp}-${random}`;
};
exports.generateMarkingToken = generateMarkingToken;
/**
 * Check if agent is within reasonable proximity to property
 * @param agentLat - Agent's latitude
 * @param agentLng - Agent's longitude
 * @param propertyLat - Property's latitude
 * @param propertyLng - Property's longitude
 * @param maxDistanceKm - Maximum distance in kilometers (default: 50km)
 * @returns true if within proximity, false otherwise
 */
const isAgentWithinProximity = (agentLat, agentLng, propertyLat, propertyLng, maxDistanceKm = 50) => {
    const distance = (0, exports.calculateDistance)(agentLat, agentLng, propertyLat, propertyLng);
    return distance <= maxDistanceKm;
};
exports.isAgentWithinProximity = isAgentWithinProximity;
/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
exports.calculateDistance = calculateDistance;
/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};
exports.default = {
    calculateTimeSlotExpiry: exports.calculateTimeSlotExpiry,
    calculateMaxCompletionTime: exports.calculateMaxCompletionTime,
    calculateConfirmationDeadlineForPropertyOwner: exports.calculateConfirmationDeadlineForPropertyOwner,
    isMarkingTimeSlotExpired: exports.isMarkingTimeSlotExpired,
    isConfirmationDeadlinePassed: exports.isConfirmationDeadlinePassed,
    markingCalculateAgentCommission: exports.markingCalculateAgentCommission,
    calculatePlatformFeeForMarkingJob: exports.calculatePlatformFeeForMarkingJob,
    getPartialPaymentAmount: exports.getPartialPaymentAmount,
    calculateRemainingPaymentAfterPartialPayment: exports.calculateRemainingPaymentAfterPartialPayment,
    calculatePartialPaymentCycles: exports.calculatePartialPaymentCycles,
    getMarkingFee: exports.getMarkingFee,
    getTimeSlotRemaining: exports.getTimeSlotRemaining,
    getConfirmationTimeRemaining: exports.getConfirmationTimeRemaining,
    shouldAutoCancelJob: exports.shouldAutoCancelJob,
    calculateQueuePriority: exports.calculateQueuePriority,
    formatTimeSlotExpiry: exports.formatTimeSlotExpiry,
    validateMarkingCompletion: exports.validateMarkingCompletion,
    generateMarkingToken: exports.generateMarkingToken,
    isAgentWithinProximity: exports.isAgentWithinProximity,
    calculateDistance: exports.calculateDistance,
};
//# sourceMappingURL=marking.js.map