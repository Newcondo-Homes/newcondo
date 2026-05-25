/**
 * Time Slot Manager Utility
 * Location: backend/shared/src/utils/timeSlotManager.ts
 *
 * Handles time slot expiry and rotation logic for property marking queue system
 */
interface TimeSlotConfig {
    slotDurationHours: number;
    maxCompletionDays: number;
    bufferMinutes: number;
    warningThresholdMinutes: number;
}
export interface TimeSlot {
    startTime: Date;
    endTime: Date;
    expiresAt: Date;
    isExpired: boolean;
    remainingMinutes: number;
    warningRequired: boolean;
}
export interface CompletionWindow {
    deadline: Date;
    isExpired: boolean;
    remainingDays: number;
    remainingHours: number;
}
/**
 * Time Slot Manager Class
 */
export declare class TimeSlotManager {
    private config;
    constructor(config?: Partial<TimeSlotConfig>);
    /**
     * Create a new time slot for an agent
     */
    createTimeSlot(startTime?: Date): TimeSlot;
    /**
     * Check if a time slot has expired
     */
    isTimeSlotExpired(expiresAt: Date): boolean;
    /**
     * Calculate remaining time in a time slot
     */
    getRemainingTime(expiresAt: Date): {
        remainingMinutes: number;
        remainingHours: number;
        isExpired: boolean;
    };
    /**
     * Check if time slot requires expiry warning
     */
    requiresWarning(expiresAt: Date): boolean;
    /**
     * Get time slot status with all details
     */
    getTimeSlotStatus(expiresAt: Date): TimeSlot;
    /**
     * Create completion window for property owner (max 3 days)
     */
    createCompletionWindow(startDate?: Date): CompletionWindow;
    /**
     * Check if completion window has expired
     */
    isCompletionWindowExpired(deadline: Date): boolean;
    /**
     * Get completion window status
     */
    getCompletionWindowStatus(deadline: Date): CompletionWindow;
    /**
     * Calculate next rotation time (when current slot expires)
     */
    getNextRotationTime(currentExpiresAt: Date): Date;
    /**
     * Extend time slot (e.g., for special circumstances)
     */
    extendTimeSlot(currentExpiresAt: Date, additionalHours: number): Date;
    /**
     * Calculate total elapsed time since slot creation
     */
    getElapsedTime(startTime: Date): {
        elapsedMinutes: number;
        elapsedHours: number;
    };
    /**
     * Check if time is within buffer period before expiry
     */
    isInBufferPeriod(expiresAt: Date): boolean;
    /**
     * Get all expired time slots from a list
     */
    filterExpiredSlots(slots: {
        expiresAt: Date;
        id: string;
    }[]): string[];
    /**
     * Sort time slots by expiry time (soonest first)
     */
    sortByExpiry<T extends {
        expiresAt: Date;
    }>(slots: T[]): T[];
    /**
     * Calculate optimal next slot start time (accounting for queue)
     */
    calculateNextSlotStart(queueLength: number): Date;
    /**
     * Validate if a time slot can be created
     */
    canCreateTimeSlot(requestedStartTime: Date): {
        isValid: boolean;
        reason?: string;
    };
    /**
     * Get formatted time remaining string
     */
    formatRemainingTime(expiresAt: Date): string;
    /**
     * Get time slot expiry notification data
     */
    getExpiryNotificationData(expiresAt: Date): {
        shouldNotify: boolean;
        urgency: 'low' | 'medium' | 'high' | 'critical';
        message: string;
    };
}
export declare const timeSlotManager: TimeSlotManager;
export declare const createTimeSlot: (startTime?: Date) => TimeSlot;
export declare const isTimeSlotExpired: (expiresAt: Date) => boolean;
export declare const getRemainingTime: (expiresAt: Date) => {
    remainingMinutes: number;
    remainingHours: number;
    isExpired: boolean;
};
export declare const createCompletionWindow: (startDate?: Date) => CompletionWindow;
export declare const getCompletionWindowStatus: (deadline: Date) => CompletionWindow;
export {};
//# sourceMappingURL=timeSlotManager.d.ts.map