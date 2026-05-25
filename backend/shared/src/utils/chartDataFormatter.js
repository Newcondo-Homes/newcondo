"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatLineChartData = formatLineChartData;
exports.formatBarChartData = formatBarChartData;
exports.formatPieChartData = formatPieChartData;
exports.formatMultiLineChartData = formatMultiLineChartData;
exports.formatStackedBarChartData = formatStackedBarChartData;
exports.formatAreaChartData = formatAreaChartData;
exports.formatScatterPlotData = formatScatterPlotData;
exports.formatHeatmapData = formatHeatmapData;
exports.formatCurrencyData = formatCurrencyData;
exports.formatLargeNumber = formatLargeNumber;
/**
 * Format data for line charts
 */
function formatLineChartData(data, label = 'Value') {
    return {
        labels: data.map(d => d.date),
        datasets: [
            {
                label,
                data: data.map(d => d.value),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }
        ]
    };
}
/**
 * Format data for bar charts
 */
function formatBarChartData(data, datasetLabel = 'Value') {
    return {
        labels: data.map(d => d.label),
        datasets: [
            {
                label: datasetLabel,
                data: data.map(d => d.value),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }
        ]
    };
}
/**
 * Format data for pie charts
 */
function formatPieChartData(data) {
    return {
        labels: data.map(d => d.label),
        datasets: [
            {
                data: data.map(d => d.value),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(201, 203, 207, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(201, 203, 207, 1)'
                ],
                borderWidth: 1
            }
        ]
    };
}
/**
 * Format data for multi-line charts
 */
function formatMultiLineChartData(datasets) {
    const allDates = [...new Set(datasets.flatMap(ds => ds.data.map(d => d.date)))].sort();
    const colors = [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 206, 86)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
        'rgb(255, 159, 64)'
    ];
    return {
        labels: allDates,
        datasets: datasets.map((dataset, index) => {
            const dataMap = new Map(dataset.data.map(d => [d.date, d.value]));
            return {
                label: dataset.label,
                data: allDates.map(date => dataMap.get(date) || 0),
                borderColor: dataset.color || colors[index % colors.length],
                backgroundColor: dataset.color
                    ? dataset.color.replace('rgb', 'rgba').replace(')', ', 0.2)')
                    : colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.2)'),
                tension: 0.1
            };
        })
    };
}
/**
 * Format data for stacked bar charts
 */
function formatStackedBarChartData(categories, datasets) {
    const colors = [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)'
    ];
    return {
        labels: categories,
        datasets: datasets.map((dataset, index) => ({
            label: dataset.label,
            data: dataset.data,
            backgroundColor: dataset.color || colors[index % colors.length]
        }))
    };
}
/**
 * Format data for area charts
 */
function formatAreaChartData(data, label = 'Value') {
    return {
        labels: data.map(d => d.date),
        datasets: [
            {
                label,
                data: data.map(d => d.value),
                fill: true,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4
            }
        ]
    };
}
/**
 * Format data for scatter plots
 */
function formatScatterPlotData(data, label = 'Data Points') {
    return {
        datasets: [
            {
                label,
                data: data.map(d => ({ x: d.x, y: d.y })),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }
        ]
    };
}
/**
 * Format data for heatmap
 */
function formatHeatmapData(data) {
    const xLabels = [...new Set(data.map(d => d.x))];
    const yLabels = [...new Set(data.map(d => d.y))];
    const matrix = [];
    yLabels.forEach(y => {
        const row = [];
        xLabels.forEach(x => {
            const point = data.find(d => d.x === x && d.y === y);
            row.push(point ? point.value : 0);
        });
        matrix.push(row);
    });
    return {
        xLabels,
        yLabels,
        data: matrix
    };
}
/**
 * Format currency data
 */
function formatCurrencyData(value, currency = 'NGN', decimals = 2) {
    return `${currency} ${value.toLocaleString('en-NG', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })}`;
}
/**
 * Format large numbers with abbreviations
 */
function formatLargeNumber(value) {
    if (value >= 1000000000) {
        return `${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
}
//# sourceMappingURL=chartDataFormatter.js.map