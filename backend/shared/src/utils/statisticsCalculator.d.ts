/**
 * Calculate z-score for a value
 */
export declare function calculateZScore(value: number, mean: number, stdDev: number): number;
/**
 * Calculate confidence interval
 */
export declare function calculateConfidenceInterval(mean: number, stdDev: number, sampleSize: number, confidenceLevel?: number): {
    lower: number;
    upper: number;
};
/**
 * Perform linear regression
 */
export declare function linearRegression(x: number[], y: number[]): {
    slope: number;
    intercept: number;
    rSquared: number;
};
/**
 * Calculate compound annual growth rate (CAGR)
 */
export declare function calculateCAGRValue(beginningValue: number, endingValue: number, periods: number): number;
/**
 * Calculate year-over-year growth
 */
export declare function calculateYoYGrowthValue(currentValue: number, previousValue: number): number;
/**
 * Calculate month-over-month growth
 */
export declare function calculateMoMGrowthValue(currentValue: number, previousValue: number): number;
/**
 * Calculate weighted average
 */
export declare function calculateWeightedAverage(values: number[], weights: number[]): number;
/**
 * Calculate probability distribution
 */
export declare function calculateProbabilityDistribution(values: number[]): Array<{
    value: number;
    probability: number;
}>;
/**
 * Calculate cumulative distribution function
 */
export declare function calculateCDF(values: number[]): Array<{
    value: number;
    cdf: number;
}>;
/**
 * Detect outliers using IQR method
 */
export declare function detectOutliers(values: number[]): {
    outliers: number[];
    lowerBound: number;
    upperBound: number;
};
/**
 * Normalize data to 0-1 range
 */
export declare function normalizeData(values: number[]): number[];
/**
 * Standardize data (z-score normalization)
 */
export declare function standardizeData(values: number[]): number[];
//# sourceMappingURL=statisticsCalculator.d.ts.map