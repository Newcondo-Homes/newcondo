/**
 * Format data for line charts
 */
export declare function formatLineChartData(data: Array<{
    date: string;
    value: number;
}>, label?: string): {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        tension: number;
    }[];
};
/**
 * Format data for bar charts
 */
export declare function formatBarChartData(data: Array<{
    label: string;
    value: number;
}>, datasetLabel?: string): {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string[];
        borderColor: string[];
        borderWidth: number;
    }[];
};
/**
 * Format data for pie charts
 */
export declare function formatPieChartData(data: Array<{
    label: string;
    value: number;
}>): {
    labels: string[];
    datasets: {
        data: number[];
        backgroundColor: string[];
        borderColor: string[];
        borderWidth: number;
    }[];
};
/**
 * Format data for multi-line charts
 */
export declare function formatMultiLineChartData(datasets: Array<{
    label: string;
    data: Array<{
        date: string;
        value: number;
    }>;
    color?: string;
}>): {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor: string | undefined;
        backgroundColor: string;
        tension: number;
    }[];
};
/**
 * Format data for stacked bar charts
 */
export declare function formatStackedBarChartData(categories: string[], datasets: Array<{
    label: string;
    data: number[];
    color?: string;
}>): {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string | undefined;
    }[];
};
/**
 * Format data for area charts
 */
export declare function formatAreaChartData(data: Array<{
    date: string;
    value: number;
}>, label?: string): {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        fill: boolean;
        borderColor: string;
        backgroundColor: string;
        tension: number;
    }[];
};
/**
 * Format data for scatter plots
 */
export declare function formatScatterPlotData(data: Array<{
    x: number;
    y: number;
}>, label?: string): {
    datasets: {
        label: string;
        data: {
            x: number;
            y: number;
        }[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
    }[];
};
/**
 * Format data for heatmap
 */
export declare function formatHeatmapData(data: Array<{
    x: string;
    y: string;
    value: number;
}>): {
    xLabels: string[];
    yLabels: string[];
    data: number[][];
};
/**
 * Format currency data
 */
export declare function formatCurrencyData(value: number, currency?: string, decimals?: number): string;
/**
 * Format large numbers with abbreviations
 */
export declare function formatLargeNumber(value: number): string;
//# sourceMappingURL=chartDataFormatter.d.ts.map