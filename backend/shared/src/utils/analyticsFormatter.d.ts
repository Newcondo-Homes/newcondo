/**
 * Format currency values for display
 */
export declare function analyticsFormatCurrency(amount: number, currency?: string): string;
/**
 * Format large numbers with abbreviations (K, M, B)
 */
export declare function formatCompactNumber(value: number): string;
/**
 * Format date for analytics display
 */
export declare function formatAnalyticsDate(date: Date, format?: 'short' | 'long' | 'iso'): string;
/**
 * Format duration in hours/minutes
 */
export declare function formatDuration(hours: number): string;
/**
 * Format occupancy rate with status
 */
export declare function formatOccupancyRate(rate: number): {
    formatted: string;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    color: string;
};
/**
 * Format growth rate with indicator
 */
export declare function analyticsFormatGrowthRate(rate: number): {
    formatted: string;
    indicator: 'up' | 'down' | 'neutral';
    color: string;
};
/**
 * Calculate and format change between two values
 */
export declare function formatChange(current: number, previous: number): {
    absolute: string;
    percentage: string;
    indicator: 'up' | 'down' | 'neutral';
};
/**
 * Format analytics period label
 */
export declare function formatPeriodLabel(period: string): string;
/**
 * Format time series data for charts
 */
export interface TimeSeriesData {
    date: string;
    value: number;
}
export declare function formatTimeSeriesData(data: Array<{
    date: Date | string;
    value: number;
}>, dateFormat?: 'short' | 'long' | 'iso'): TimeSeriesData[];
/**
 * Format property performance rating
 */
export declare function formatPerformanceRating(rating: string): {
    label: string;
    color: string;
    icon: string;
};
/**
 * Calculate and format comparison to average
 */
export declare function formatComparisonToAverage(value: number, average: number): {
    difference: string;
    percentage: string;
    status: 'above' | 'below' | 'equal';
    formatted: string;
};
/**
 * Format conversion rate with benchmark
 */
export declare function formatConversionRate(rate: number, benchmark?: number): {
    formatted: string;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    comparisonToBenchmark: string;
};
/**
 * Format analytics summary for export
 */
export declare function formatAnalyticsSummary(data: any): string;
/**
 * Format CSV data for export
 */
export declare function formatCSV(data: Array<{
    [key: string]: any;
}>): string;
//# sourceMappingURL=analyticsFormatter.d.ts.map