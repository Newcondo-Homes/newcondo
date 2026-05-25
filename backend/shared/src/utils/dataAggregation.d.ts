/**
 * Aggregate array of numbers
 */
export declare function aggregateNumbers(numbers: number[]): {
    sum: number;
    average: number;
    min: number;
    max: number;
    count: number;
};
/**
 * Group data by key
 */
export declare function groupBy<T>(data: T[], keyExtractor: (item: T) => string): Record<string, T[]>;
/**
 * Calculate percentile
 */
export declare function calculatePercentile(values: number[], percentile: number): number;
/**
 * Calculate median
 */
export declare function calculateMedian(values: number[]): number;
/**
 * Calculate mode
 */
export declare function calculateMode(values: number[]): number;
/**
 * Calculate variance
 */
export declare function calculateVariance(values: number[]): number;
/**
 * Calculate standard deviation
 */
export declare function calculateStdDev(values: number[]): number;
/**
 * Calculate correlation coefficient
 */
export declare function calculateCorrelation(x: number[], y: number[]): number;
/**
 * Moving average calculation
 */
export declare function calculateMovingAverage(values: number[], window: number): number[];
/**
 * Exponential moving average
 */
export declare function calculateEMA(values: number[], period: number): number[];
/**
 * Sum array values
 */
export declare function sum(values: number[]): number;
/**
 * Average array values
 */
export declare function average(values: number[]): number;
/**
 * Aggregate time series data
 */
export declare function aggregateTimeSeries<T extends {
    date: Date;
    value: number;
}>(data: T[], interval: 'hour' | 'day' | 'week' | 'month'): Array<{
    date: string;
    value: number;
}>;
//# sourceMappingURL=dataAggregation.d.ts.map