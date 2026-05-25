/**
 * Get date range from string format
 */
export declare function getDateRange(range: string): {
    startDate: Date;
    endDate: Date;
};
/**
 * Get date range for specific periods
 */
export declare function getPresetDateRange(preset: string): {
    startDate: Date;
    endDate: Date;
};
/**
 * Format date for display
 */
export declare function formatDateHelper(date: Date, format?: string): string;
/**
 * Get days between two dates
 */
export declare function getDaysBetween(startDate: Date, endDate: Date): number;
/**
 * Get all dates in range
 */
export declare function getDatesInRange(startDate: Date, endDate: Date): Date[];
/**
 * Check if date is today
 */
export declare function isToday(date: Date): boolean;
/**
 * Check if date is within range
 */
export declare function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean;
//# sourceMappingURL=dateRangeHelper.d.ts.map