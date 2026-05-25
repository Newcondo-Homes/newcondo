/**
 * Marking Job Utilities
 * Handles time slots, queue management, and marking job calculations
 */
import { MarkingJobStatus, UrgencyLevel } from '@newcondo/db';
export declare const MARKING_TIME_SLOT_HOURS = 3;
export declare const MAX_COMPLETION_DAYS = 3;
export declare const CONFIRMATION_WINDOW_DAYS = 2;
export declare const PARTIAL_PAYMENT_AMOUNT = 1000;
export declare const FULL_MARKING_FEE = 20000;
export declare const NEWCONDO_MARKING_FEE = 25000;
/**
 * Calculate the time slot expiry for a marking job
 * @param assignedAt - The time when the job was assigned
 * @returns The expiry time (3 hours from assignment)
 */
export declare const calculateTimeSlotExpiry: (assignedAt: Date) => Date;
/**
 * Calculate the maximum completion time for a marking job
 * @param createdAt - The time when the job was created
 * @returns The maximum completion time (3 days from creation)
 */
export declare const calculateMaxCompletionTime: (createdAt: Date) => Date;
/**
 * Calculate the confirmation deadline for property owner
 * @param markedAt - The time when the property was marked
 * @returns The confirmation deadline (2 days from marking)
 */
export declare const calculateConfirmationDeadlineForPropertyOwner: (markedAt: Date) => Date;
/**
 * Check if a time slot has expired
 * @param timeSlotExpiry - The expiry time of the slot
 * @returns true if expired, false otherwise
 */
export declare const isMarkingTimeSlotExpired: (timeSlotExpiry: Date) => boolean;
/**
 * Check if the confirmation deadline has passed
 * @param confirmationDeadline - The confirmation deadline
 * @returns true if deadline passed, false otherwise
 */
export declare const isConfirmationDeadlinePassed: (confirmationDeadline: Date) => boolean;
/**
 * Calculate agent commission for a marking job
 * @param markingFee - The total marking fee
 * @returns The agent's commission amount
 */
export declare const markingCalculateAgentCommission: (markingFee: number) => number;
/**
 * Calculate platform fee for a marking job
 * @param markingFee - The total marking fee
 * @returns The platform's fee amount
 */
export declare const calculatePlatformFeeForMarkingJob: (markingFee: number) => number;
/**
 * Calculate partial payment for initial marking completion
 * @returns The partial payment amount
 */
export declare const getPartialPaymentAmount: () => number;
/**
 * Calculate remaining payment after partial payment
 * @param totalFee - The total marking fee
 * @param partialPayment - The partial payment already made
 * @returns The remaining payment amount
 */
export declare const calculateRemainingPaymentAfterPartialPayment: (totalFee: number, partialPayment: number) => number;
/**
 * Calculate how many partial payments can be made from the remaining fee
 * @param remainingFee - The remaining fee amount
 * @returns Number of partial payments possible
 */
export declare const calculatePartialPaymentCycles: (remainingFee: number) => number;
/**
 * Get the marking fee based on who is marking
 * @param markerType - Type of marker ('self', 'newcondo', 'known_person', 'agent')
 * @returns The marking fee amount
 */
export declare const getMarkingFee: (markerType: "self" | "newcondo" | "known_person" | "agent") => number;
/**
 * Calculate time remaining in a time slot
 * @param timeSlotExpiry - The expiry time of the slot
 * @returns Milliseconds remaining (0 if expired)
 */
export declare const getTimeSlotRemaining: (timeSlotExpiry: Date) => number;
/**
 * Calculate time remaining until confirmation deadline
 * @param confirmationDeadline - The confirmation deadline
 * @returns Milliseconds remaining (0 if passed)
 */
export declare const getConfirmationTimeRemaining: (confirmationDeadline: Date) => number;
/**
 * Determine if a marking job should be auto-cancelled
 * @param createdAt - When the job was created
 * @param status - Current status of the job
 * @returns true if should be cancelled, false otherwise
 */
export declare const shouldAutoCancelJob: (createdAt: Date, status: MarkingJobStatus) => boolean;
/**
 * Get priority score for queue sorting
 * @param urgencyLevel - The urgency level of the job
 * @param createdAt - When the job was created
 * @returns Priority score (higher = more priority)
 */
export declare const calculateQueuePriority: (urgencyLevel: UrgencyLevel, createdAt: Date) => number;
/**
 * Format time slot expiry for display
 * @param timeSlotExpiry - The expiry time
 * @returns Human-readable time remaining
 */
export declare const formatTimeSlotExpiry: (timeSlotExpiry: Date) => string;
/**
 * Validate marking completion data
 * @param data - Completion data to validate
 * @returns Validation result
 */
export declare const validateMarkingCompletion: (data: {
    completionImages?: string[];
    boundaryData?: any;
    completionNotes?: string;
}) => {
    valid: boolean;
    errors: string[];
};
/**
 * Generate a shareable marking link token
 * @param propertyId - The property ID
 * @param ownerId - The owner ID
 * @returns A unique token for the shareable link
 */
export declare const generateMarkingToken: (propertyId: string, ownerId: string) => string;
/**
 * Check if agent is within reasonable proximity to property
 * @param agentLat - Agent's latitude
 * @param agentLng - Agent's longitude
 * @param propertyLat - Property's latitude
 * @param propertyLng - Property's longitude
 * @param maxDistanceKm - Maximum distance in kilometers (default: 50km)
 * @returns true if within proximity, false otherwise
 */
export declare const isAgentWithinProximity: (agentLat: number, agentLng: number, propertyLat: number, propertyLng: number, maxDistanceKm?: number) => boolean;
/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in kilometers
 */
export declare const calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
declare const _default: {
    calculateTimeSlotExpiry: (assignedAt: Date) => Date;
    calculateMaxCompletionTime: (createdAt: Date) => Date;
    calculateConfirmationDeadlineForPropertyOwner: (markedAt: Date) => Date;
    isMarkingTimeSlotExpired: (timeSlotExpiry: Date) => boolean;
    isConfirmationDeadlinePassed: (confirmationDeadline: Date) => boolean;
    markingCalculateAgentCommission: (markingFee: number) => number;
    calculatePlatformFeeForMarkingJob: (markingFee: number) => number;
    getPartialPaymentAmount: () => number;
    calculateRemainingPaymentAfterPartialPayment: (totalFee: number, partialPayment: number) => number;
    calculatePartialPaymentCycles: (remainingFee: number) => number;
    getMarkingFee: (markerType: "self" | "newcondo" | "known_person" | "agent") => number;
    getTimeSlotRemaining: (timeSlotExpiry: Date) => number;
    getConfirmationTimeRemaining: (confirmationDeadline: Date) => number;
    shouldAutoCancelJob: (createdAt: Date, status: MarkingJobStatus) => boolean;
    calculateQueuePriority: (urgencyLevel: UrgencyLevel, createdAt: Date) => number;
    formatTimeSlotExpiry: (timeSlotExpiry: Date) => string;
    validateMarkingCompletion: (data: {
        completionImages?: string[];
        boundaryData?: any;
        completionNotes?: string;
    }) => {
        valid: boolean;
        errors: string[];
    };
    generateMarkingToken: (propertyId: string, ownerId: string) => string;
    isAgentWithinProximity: (agentLat: number, agentLng: number, propertyLat: number, propertyLng: number, maxDistanceKm?: number) => boolean;
    calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
};
export default _default;
//# sourceMappingURL=marking.d.ts.map