// backend/gateway/src/utils/metrics.ts
import { createLogger } from './logger';

const logger = createLogger('Metrics');

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerMinute: number;
}

export interface ServiceMetrics {
  [serviceName: string]: {
    requests: number;
    errors: number;
    averageLatency: number;
    lastRequest: number;
  };
}

class Metrics {
  private metrics: Map<string, MetricData[]> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private responseTimes: Map<string, number[]> = new Map();
  private serviceMetrics: Map<string, ServiceMetrics[string]> = new Map();
  private readonly MAX_METRIC_HISTORY = 1000;
  private readonly METRIC_CLEANUP_INTERVAL = 300000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  /**
   * Record a metric
   */
  public recordMetric(name: string, value: number, labels?: Record<string, string>) {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      labels
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Keep only recent metrics
    if (metricHistory.length > this.MAX_METRIC_HISTORY) {
      metricHistory.splice(0, metricHistory.length - this.MAX_METRIC_HISTORY);
    }

    logger.debug('Metric recorded', { name, value, labels });
  }

  /**
   * Increment a counter metric
   */
  public incrementCounter(name: string, labels?: Record<string, string>) {
    const currentValue = this.getLatestMetricValue(name) || 0;
    this.recordMetric(name, currentValue + 1, labels);
  }

  /**
   * Record request start
   */
  public recordRequestStart(path: string, method: string, service?: string) {
    const key = `${method}:${path}`;
    const count = this.requestCounts.get(key) || 0;
    this.requestCounts.set(key, count + 1);

    this.recordMetric('gateway.requests.total', count + 1, {
      path,
      method,
      service: service || 'unknown'
    });
  }

  /**
   * Record request completion
   */
  public recordRequestComplete(
    path: string,
    method: string,
    statusCode: number,
    duration: number,
    service?: string
  ) {
    const key = `${method}:${path}`;
    
    // Record response time
    if (!this.responseTimes.has(key)) {
      this.responseTimes.set(key, []);
    }
    const times = this.responseTimes.get(key)!;
    times.push(duration);
    
    // Keep only recent response times
    if (times.length > 100) {
      times.splice(0, times.length - 100);
    }

    // Record metrics
    this.recordMetric('gateway.requests.duration', duration, {
      path,
      method,
      status_code: statusCode.toString(),
      service: service || 'unknown'
    });

    // Record success/error metrics
    if (statusCode >= 200 && statusCode < 400) {
      this.incrementCounter('gateway.requests.success', {
        path,
        method,
        service: service || 'unknown'
      });
    } else {
      this.incrementCounter('gateway.requests.error', {
        path,
        method,
        status_code: statusCode.toString(),
        service: service || 'unknown'
      });
    }

    // Update service metrics
    if (service) {
      this.updateServiceMetrics(service, statusCode >= 400, duration);
    }
  }

  /**
   * Update service-specific metrics
   */
  private updateServiceMetrics(serviceName: string, isError: boolean, latency: number) {
    const existing = this.serviceMetrics.get(serviceName) || {
      requests: 0,
      errors: 0,
      averageLatency: 0,
      lastRequest: 0
    };

    existing.requests += 1;
    if (isError) {
      existing.errors += 1;
    }
    
    // Calculate rolling average latency
    existing.averageLatency = (existing.averageLatency * (existing.requests - 1) + latency) / existing.requests;
    existing.lastRequest = Date.now();

    this.serviceMetrics.set(serviceName, existing);
  }

  /**
   * Get latest metric value
   */
  public getLatestMetricValue(name: string): number | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }
    return metrics[metrics.length - 1].value;
  }

  /**
   * Get metric history
   */
  public getMetricHistory(name: string, since?: number): MetricData[] {
    const metrics = this.metrics.get(name);
    if (!metrics) {
      return [];
    }

    if (since) {
      return metrics.filter(m => m.timestamp >= since);
    }

    return [...metrics];
  }

  /**
   * Get request metrics for a path
   */
  public getRequestMetrics(path: string, method: string): RequestMetrics {
    const key = `${method}:${path}`;
    const totalRequests = this.requestCounts.get(key) || 0;
    const responseTimes = this.responseTimes.get(key) || [];

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Get recent successful and failed requests
    const recentMetrics = this.getMetricHistory('gateway.requests.total', oneMinuteAgo)
      .filter(m => m.labels?.path === path && m.labels?.method === method);

    const recentSuccessMetrics = this.getMetricHistory('gateway.requests.success', oneMinuteAgo)
      .filter(m => m.labels?.path === path && m.labels?.method === method);

    const recentErrorMetrics = this.getMetricHistory('gateway.requests.error', oneMinuteAgo)
      .filter(m => m.labels?.path === path && m.labels?.method === method);

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    return {
      totalRequests,
      successfulRequests: recentSuccessMetrics.length,
      failedRequests: recentErrorMetrics.length,
      averageResponseTime,
      requestsPerMinute: recentMetrics.length
    };
  }

  /**
   * Get service metrics
   */
  public getServiceMetrics(): ServiceMetrics {
    const result: ServiceMetrics = {};
    
    this.serviceMetrics.forEach((metrics, serviceName) => {
      result[serviceName] = { ...metrics };
    });

    return result;
  }

  /**
   * Get all metrics summary
   */
  public getMetricsSummary() {
    const summary = {
      totalMetrics: this.metrics.size,
      totalDataPoints: Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0),
      services: this.getServiceMetrics(),
      recentActivity: {
        lastMinute: this.getRecentActivity(60000),
        lastFiveMinutes: this.getRecentActivity(300000),
        lastHour: this.getRecentActivity(3600000)
      }
    };

    return summary;
  }

  /**
   * Get recent activity within a time window
   */
  private getRecentActivity(timeWindow: number) {
    const since = Date.now() - timeWindow;
    let totalRequests = 0;
    let totalErrors = 0;

    // Count requests from all metrics
    this.metrics.forEach((metrics, name) => {
      if (name === 'gateway.requests.total') {
        totalRequests += metrics.filter(m => m.timestamp >= since).length;
      } else if (name === 'gateway.requests.error') {
        totalErrors += metrics.filter(m => m.timestamp >= since).length;
      }
    });

    return {
      requests: totalRequests,
      errors: totalErrors,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0
    };
  }

  /**
   * Clear old metrics
   */
  private cleanup() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    this.metrics.forEach((metrics, name) => {
      const filteredMetrics = metrics.filter(m => m.timestamp >= cutoff);
      if (filteredMetrics.length !== metrics.length) {
        this.metrics.set(name, filteredMetrics);
        logger.debug('Cleaned up old metrics', {
          metric: name,
          removed: metrics.length - filteredMetrics.length,
          remaining: filteredMetrics.length
        });
      }
    });

    // Clean up response times
    this.responseTimes.forEach((times, key) => {
      if (times.length > 100) {
        times.splice(0, times.length - 100);
      }
    });
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.METRIC_CLEANUP_INTERVAL);

    logger.info('Metrics cleanup interval started', {
      interval: this.METRIC_CLEANUP_INTERVAL
    });
  }

  /**
   * Stop cleanup interval
   */
  public stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Metrics cleanup interval stopped');
    }
  }

  /**
   * Export metrics in Prometheus format
   */
  public exportPrometheusMetrics(): string {
    const lines: string[] = [];

    this.metrics.forEach((metrics, name) => {
      const latest = metrics[metrics.length - 1];
      if (latest) {
        let line = `${name.replace(/[.-]/g, '_')} ${latest.value}`;
        
        if (latest.labels) {
          const labelStr = Object.entries(latest.labels)
            .map(([key, value]) => `${key}="${value}"`)
            .join(',');
          line = `${name.replace(/[.-]/g, '_')}{${labelStr}} ${latest.value}`;
        }
        
        lines.push(line);
      }
    });

    return lines.join('\n');
  }
}

// Singleton instance
export const metrics = new Metrics();

// Graceful shutdown
process.on('SIGTERM', () => {
  metrics.stopCleanup();
});

process.on('SIGINT', () => {
  metrics.stopCleanup();
});