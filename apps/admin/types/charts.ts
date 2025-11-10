// apps/admin/src/types/charts.ts

/**
 * Chart type
 */
export type ChartType = 
  | 'line' 
  | 'bar' 
  | 'area' 
  | 'pie' 
  | 'donut' 
  | 'scatter' 
  | 'heatmap' 
  | 'radar'
  | 'funnel'
  | 'gauge';

/**
 * Chart configuration
 */
export interface ChartConfig {
  type: ChartType;
  title?: string;
  subtitle?: string;
  width?: number | string;
  height?: number | string;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  animation?: {
    duration?: number;
    easing?: string;
  };
  legend?: {
    show?: boolean;
    position?: 'top' | 'bottom' | 'left' | 'right';
  };
  tooltip?: {
    enabled?: boolean;
    format?: string;
  };
  colors?: string[];
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

/**
 * Chart series
 */
export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: ChartType;
  yAxisId?: string;
}

/**
 * Chart data
 */
export interface ChartData {
  labels?: string[];
  datasets: ChartSeries[];
}

/**
 * Line chart options
 */
export interface LineChartOptions extends ChartConfig {
  type: 'line';
  strokeWidth?: number;
  showDataPoints?: boolean;
  smooth?: boolean;
  fill?: boolean;
  fillOpacity?: number;
  stacked?: boolean;
}

/**
 * Bar chart options
 */
export interface BarChartOptions extends ChartConfig {
  type: 'bar';
  barWidth?: number;
  horizontal?: boolean;
  stacked?: boolean;
  grouped?: boolean;
  showValues?: boolean;
}

/**
 * Area chart options
 */
export interface AreaChartOptions extends ChartConfig {
  type: 'area';
  strokeWidth?: number;
  fillOpacity?: number;
  stacked?: boolean;
  smooth?: boolean;
}

/**
 * Pie chart options
 */
export interface PieChartOptions extends ChartConfig {
  type: 'pie' | 'donut';
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  showLabels?: boolean;
  showPercentages?: boolean;
}

/**
 * Chart axis configuration
 */
export interface ChartAxisConfig {
  id?: string;
  label?: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
  min?: number;
  max?: number;
  tickCount?: number;
  tickFormat?: string;
  grid?: boolean;
  gridColor?: string;
}

/**
 * Chart options with axes
 */
export interface ChartOptionsWithAxes extends ChartConfig {
  xAxis?: ChartAxisConfig;
  yAxis?: ChartAxisConfig;
  secondaryYAxis?: ChartAxisConfig;
}

/**
 * Comparison chart data
 */
export interface ComparisonChartData {
  categories: string[];
  series: Array<{
    name: string;
    data: number[];
    color?: string;
  }>;
  comparisonPeriod: string;
}

/**
 * Trend chart data
 */
export interface TrendChartData {
  timeline: string[];
  values: number[];
  trend: 'up' | 'down' | 'stable';
  trendLine?: number[];
  movingAverage?: number[];
}

/**
 * Distribution chart data
 */
export interface DistributionChartData {
  labels: string[];
  values: number[];
  percentages: number[];
  colors?: string[];
}

/**
 * Heatmap chart data
 */
export interface HeatmapChartData {
  xLabels: string[];
  yLabels: string[];
  data: number[][];
  colorScale?: {
    min: string;
    max: string;
  };
}

/**
 * Funnel chart data
 */
export interface FunnelChartData {
  stages: Array<{
    name: string;
    value: number;
    percentage: number;
    dropoff?: number;
  }>;
}

/**
 * Gauge chart options
 */
export interface GaugeChartOptions extends ChartConfig {
  type: 'gauge';
  min: number;
  max: number;
  value: number;
  thresholds?: Array<{
    value: number;
    color: string;
    label?: string;
  }>;
  showValue?: boolean;
  units?: string;
}

/**
 * Chart export options
 */
export interface ChartExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf';
  width?: number;
  height?: number;
  backgroundColor?: string;
  quality?: number;
  filename?: string;
}

/**
 * Interactive chart features
 */
export interface InteractiveChartFeatures {
  zoom?: boolean;
  pan?: boolean;
  brush?: boolean;
  crosshair?: boolean;
  clickHandler?: (data: ChartDataPoint) => void;
  hoverHandler?: (data: ChartDataPoint) => void;
}

/**
 * Chart theme
 */
export interface ChartTheme {
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  colors: string[];
  fontFamily: string;
  fontSize: number;
}

/**
 * Multi-series chart data
 */
export interface MultiSeriesChartData {
  labels: string[];
  series: Array<{
    id: string;
    name: string;
    data: number[];
    type?: ChartType;
    yAxisId?: string;
    color?: string;
  }>;
}

/**
 * Time series chart options
 */
export interface TimeSeriesChartOptions extends LineChartOptions {
  timeFormat?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month' | 'year';
  showGaps?: boolean;
  interpolation?: 'linear' | 'step' | 'smooth';
}

/**
 * Chart annotation
 */
export interface ChartAnnotation {
  type: 'line' | 'area' | 'text' | 'point';
  value?: number;
  xValue?: string | number;
  yValue?: number;
  text?: string;
  color?: string;
  dashStyle?: 'solid' | 'dashed' | 'dotted';
}

/**
 * Chart with annotations
 */
export interface AnnotatedChartOptions extends ChartConfig {
  annotations?: ChartAnnotation[];
}

/**
 * Chart drill-down data
 */
export interface ChartDrillDownData {
  parentId?: string;
  level: number;
  data: ChartData;
  breadcrumb: string[];
}

/**
 * Real-time chart options
 */
export interface RealTimeChartOptions extends LineChartOptions {
  updateInterval: number;
  maxDataPoints?: number;
  autoScroll?: boolean;
  pauseOnHover?: boolean;
}

/**
 * Chart performance metrics
 */
export interface ChartPerformanceMetrics {
  renderTime: number;
  dataPoints: number;
  memoryUsage: number;
  fps?: number;
}

/**
 * Chart accessibility options
 */
export interface ChartAccessibilityOptions {
  ariaLabel?: string;
  description?: string;
  highContrast?: boolean;
  keyboardNavigation?: boolean;
  screenReaderSupport?: boolean;
}

/**
 * Chart options (union type)
 */
export type ChartOptions = 
  | LineChartOptions 
  | BarChartOptions 
  | AreaChartOptions 
  | PieChartOptions
  | GaugeChartOptions
  | ChartOptionsWithAxes
  | TimeSeriesChartOptions
  | RealTimeChartOptions;