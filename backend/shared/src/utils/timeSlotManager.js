"use strict";
/**
 * Time Slot Manager Utility
 * Location: backend/shared/src/utils/timeSlotManager.ts
 *
 * Handles time slot expiry and rotation logic for property marking queue system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompletionWindowStatus = exports.createCompletionWindow = exports.getRemainingTime = exports.isTimeSlotExpired = exports.createTimeSlot = exports.timeSlotManager = exports.TimeSlotManager = void 0;
const date_fns_1 = require("date-fns");
const DEFAULT_CONFIG = {
    slotDurationHours: 3,
    maxCompletionDays: 3,
    bufferMinutes: 15,
    warningThresholdMinutes: 30,
};
/**
 * Time Slot Manager Class
 */
class TimeSlotManager {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Create a new time slot for an agent
     */
    createTimeSlot(startTime = new Date()) {
        const endTime = (0, date_fns_1.addHours)(startTime, this.config.slotDurationHours);
        const expiresAt = (0, date_fns_1.addHours)(startTime, this.config.slotDurationHours);
        return {
            startTime,
            endTime,
            expiresAt,
            isExpired: false,
            remainingMinutes: this.config.slotDurationHours * 60,
            warningRequired: false,
        };
    }
    /**
     * Check if a time slot has expired
     */
    isTimeSlotExpired(expiresAt) {
        return (0, date_fns_1.isBefore)(expiresAt, new Date());
    }
    /**
     * Calculate remaining time in a time slot
     */
    getRemainingTime(expiresAt) {
        const now = new Date();
        if ((0, date_fns_1.isBefore)(expiresAt, now)) {
            return {
                remainingMinutes: 0,
                remainingHours: 0,
                isExpired: true,
            };
        }
        const remainingMinutes = (0, date_fns_1.differenceInMinutes)(expiresAt, now);
        const remainingHours = (0, date_fns_1.differenceInHours)(expiresAt, now);
        return {
            remainingMinutes,
            remainingHours,
            isExpired: false,
        };
    }
    /**
     * Check if time slot requires expiry warning
     */
    requiresWarning(expiresAt) {
        const { remainingMinutes, isExpired } = this.getRemainingTime(expiresAt);
        if (isExpired)
            return false;
        return remainingMinutes <= this.config.warningThresholdMinutes;
    }
    /**
     * Get time slot status with all details
     */
    getTimeSlotStatus(expiresAt) {
        const { remainingMinutes, remainingHours, isExpired } = this.getRemainingTime(expiresAt);
        const warningRequired = this.requiresWarning(expiresAt);
        const startTime = (0, date_fns_1.addHours)(expiresAt, -this.config.slotDurationHours);
        return {
            startTime,
            endTime: expiresAt,
            expiresAt,
            isExpired,
            remainingMinutes,
            warningRequired,
        };
    }
    /**
     * Create completion window for property owner (max 3 days)
     */
    createCompletionWindow(startDate = new Date()) {
        const deadline = (0, date_fns_1.addDays)(startDate, this.config.maxCompletionDays);
        return {
            deadline,
            isExpired: false,
            remainingDays: this.config.maxCompletionDays,
            remainingHours: this.config.maxCompletionDays * 24,
        };
    }
    /**
     * Check if completion window has expired
     */
    isCompletionWindowExpired(deadline) {
        return (0, date_fns_1.isBefore)(deadline, new Date());
    }
    /**
     * Get completion window status
     */
    getCompletionWindowStatus(deadline) {
        const now = new Date();
        const isExpired = (0, date_fns_1.isBefore)(deadline, now);
        if (isExpired) {
            return {
                deadline,
                isExpired: true,
                remainingDays: 0,
                remainingHours: 0,
            };
        }
        const remainingHours = (0, date_fns_1.differenceInHours)(deadline, now);
        const remainingDays = Math.floor(remainingHours / 24);
        return {
            deadline,
            isExpired: false,
            remainingDays,
            remainingHours,
        };
    }
    /**
     * Calculate next rotation time (when current slot expires)
     */
    getNextRotationTime(currentExpiresAt) {
        if (this.isTimeSlotExpired(currentExpiresAt)) {
            return new Date(); // Rotate immediately if expired
        }
        return currentExpiresAt;
    }
    /**
     * Extend time slot (e.g., for special circumstances)
     */
    extendTimeSlot(currentExpiresAt, additionalHours) {
        return (0, date_fns_1.addHours)(currentExpiresAt, additionalHours);
    }
    /**
     * Calculate total elapsed time since slot creation
     */
    getElapsedTime(startTime) {
        const now = new Date();
        const elapsedMinutes = (0, date_fns_1.differenceInMinutes)(now, startTime);
        const elapsedHours = (0, date_fns_1.differenceInHours)(now, startTime);
        return {
            elapsedMinutes,
            elapsedHours,
        };
    }
    /**
     * Check if time is within buffer period before expiry
     */
    isInBufferPeriod(expiresAt) {
        const { remainingMinutes, isExpired } = this.getRemainingTime(expiresAt);
        if (isExpired)
            return false;
        return remainingMinutes <= this.config.bufferMinutes;
    }
    /**
     * Get all expired time slots from a list
     */
    filterExpiredSlots(slots) {
        const now = new Date();
        return slots
            .filter(slot => (0, date_fns_1.isBefore)(slot.expiresAt, now))
            .map(slot => slot.id);
    }
    /**
     * Sort time slots by expiry time (soonest first)
     */
    sortByExpiry(slots) {
        return [...slots].sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
    }
    /**
     * Calculate optimal next slot start time (accounting for queue)
     */
    calculateNextSlotStart(queueLength) {
        const now = new Date();
        // Add buffer time based on queue length
        return (0, date_fns_1.addHours)(now, Math.floor(queueLength / 5) * 0.5);
    }
    /**
     * Validate if a time slot can be created
     */
    canCreateTimeSlot(requestedStartTime) {
        const now = new Date();
        if ((0, date_fns_1.isBefore)(requestedStartTime, now)) {
            return {
                isValid: false,
                reason: 'Start time cannot be in the past',
            };
        }
        return { isValid: true };
    }
    /**
     * Get formatted time remaining string
     */
    formatRemainingTime(expiresAt) {
        const { remainingMinutes, remainingHours, isExpired } = this.getRemainingTime(expiresAt);
        if (isExpired) {
            return 'Expired';
        }
        if (remainingHours > 0) {
            const minutes = remainingMinutes % 60;
            return `${remainingHours}h ${minutes}m`;
        }
        return `${remainingMinutes}m`;
    }
    /**
     * Get time slot expiry notification data
     */
    getExpiryNotificationData(expiresAt) {
        const { remainingMinutes, isExpired } = this.getRemainingTime(expiresAt);
        if (isExpired) {
            return {
                shouldNotify: true,
                urgency: 'critical',
                message: 'Your time slot has expired',
            };
        }
        if (remainingMinutes <= 15) {
            return {
                shouldNotify: true,
                urgency: 'critical',
                message: `Only ${remainingMinutes} minutes remaining!`,
            };
        }
        if (remainingMinutes <= 30) {
            return {
                shouldNotify: true,
                urgency: 'high',
                message: `${remainingMinutes} minutes remaining in your time slot`,
            };
        }
        if (remainingMinutes <= 60) {
            return {
                shouldNotify: true,
                urgency: 'medium',
                message: 'Less than 1 hour remaining',
            };
        }
        return {
            shouldNotify: false,
            urgency: 'low',
            message: '',
        };
    }
}
exports.TimeSlotManager = TimeSlotManager;
// Export singleton instance with default config
exports.timeSlotManager = new TimeSlotManager();
// Export helper functions for quick access
const createTimeSlot = (startTime) => exports.timeSlotManager.createTimeSlot(startTime);
exports.createTimeSlot = createTimeSlot;
const isTimeSlotExpired = (expiresAt) => exports.timeSlotManager.isTimeSlotExpired(expiresAt);
exports.isTimeSlotExpired = isTimeSlotExpired;
const getRemainingTime = (expiresAt) => exports.timeSlotManager.getRemainingTime(expiresAt);
exports.getRemainingTime = getRemainingTime;
const createCompletionWindow = (startDate) => exports.timeSlotManager.createCompletionWindow(startDate);
exports.createCompletionWindow = createCompletionWindow;
const getCompletionWindowStatus = (deadline) => exports.timeSlotManager.getCompletionWindowStatus(deadline);
exports.getCompletionWindowStatus = getCompletionWindowStatus;
//# sourceMappingURL=timeSlotManager.js.map