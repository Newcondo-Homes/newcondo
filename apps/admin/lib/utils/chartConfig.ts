// apps/admin/src/lib/utils/chartConfig.ts

import { ChartOptions } from '@/types/charts';

/**
 * Default chart configuration for Recharts
 */
export const defaultChartConfig: Partial<ChartOptions> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 750,
    easing: 'easeInOutQuart',
  },
};

/**
 * Line chart configuration
 */
export const lineChartConfig = {
  ...defaultChartConfig,
  strokeWidth: 2,
  dot: {
    r: 4,
    strokeWidth: 2,
  },
  activeDot: {
    r: 6,
  },
};

/**
 * Bar chart configuration
 */
export const barChartConfig = {
  ...defaultChartConfig,
  barSize: 40,
  radius: [8, 8, 0, 0],
};

/**
 * Pie chart configuration
 */
export const pieChartConfig = {
  ...defaultChartConfig,
  innerRadius: '50%',
  outerRadius: '80%',
  paddingAngle: 2,
};

/**
 * Area chart configuration
 */
export const areaChartConfig = {
  ...defaultChartConfig,
  strokeWidth: 2,
  fillOpacity: 0.6,
};

/**
 * Get responsive chart dimensions based on container
 */
export const getResponsiveChartDimensions = (
  containerWidth: number,
  aspectRatio: number = 16 / 9
) => {
  return {
    width: containerWidth,
    height: containerWidth / aspectRatio,
  };
};

/**
 * Chart margin configuration
 */
export const chartMargins = {
  default: { top: 20, right: 30, left: 20, bottom: 20 },
  tight: { top: 10, right: 10, left: 10, bottom: 10 },
  loose: { top: 40, right: 50, left: 40, bottom: 40 },
};

/**
 * Tooltip configuration
 */
export const tooltipConfig = {
  contentStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  itemStyle: {
    color: '#374151',
    fontSize: '14px',
  },
  labelStyle: {
    fontWeight: 600,
    marginBottom: '4px',
  },
};

/**
 * Legend configuration
 */
export const legendConfig = {
  iconType: 'circle' as const,
  iconSize: 10,
  wrapperStyle: {
    paddingTop: '20px',
  },
};

/**
 * Grid configuration
 */
export const gridConfig = {
  strokeDasharray: '3 3',
  stroke: '#e5e7eb',
};

/**
 * Axis configuration
 */
export const axisConfig = {
  tick: {
    fill: '#6b7280',
    fontSize: 12,
  },
  axisLine: {
    stroke: '#d1d5db',
  },
};