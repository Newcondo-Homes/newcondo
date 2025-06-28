// backend/gateway/src/utils/circuitBreaker.ts
import { logger } from "./logger";
import { config } from "../config";

export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export interface CircuitBreakerOptions {
  threshold: number;
  timeout: number;
  monitoringPeriod?: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime?: number;
  private nextAttempt?: number;
  private readonly threshold: number;
  private readonly timeout: number;
  private readonly monitoringPeriod: number;

  constructor(
    private readonly serviceName: string,
    options: CircuitBreakerOptions
  ) {
    this.threshold = options.threshold;
    this.timeout = options.timeout;
    this.monitoringPeriod = options.monitoringPeriod || 60000; // 1 minute
  }

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        logger.info(`Circuit breaker for ${this.serviceName} is now HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.serviceName}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      logger.info(`Circuit breaker for ${this.serviceName} is now CLOSED`);
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.timeout;
      logger.warn(
        `Circuit breaker for ${this.serviceName} is now OPEN (failed during HALF_OPEN)`
      );
    } else if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.timeout;
      logger.warn(
        `Circuit breaker for ${this.serviceName} is now OPEN (threshold exceeded: ${this.failureCount}/${this.threshold})`
      );
    }
  }

  private shouldAttemptReset(): boolean {
    return this.nextAttempt !== undefined && Date.now() >= this.nextAttempt;
  }

  public getState(): CircuitState {
    return this.state;
  }

  public getFailureCount(): number {
    return this.failureCount;
  }

  public getMetrics() {
    return {
      serviceName: this.serviceName,
      state: this.state,
      failureCount: this.failureCount,
      threshold: this.threshold,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt,
    };
  }

  public reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttempt = undefined;
    logger.info(`Circuit breaker for ${this.serviceName} has been reset`);
  }
}

// Circuit breaker manager
export class CircuitBreakerManager {
  private static instance: CircuitBreakerManager;
  private circuitBreakers = new Map<string, CircuitBreaker>();

  private constructor() {}

  public static getInstance(): CircuitBreakerManager {
    if (!CircuitBreakerManager.instance) {
      CircuitBreakerManager.instance = new CircuitBreakerManager();
    }
    return CircuitBreakerManager.instance;
  }

  public getCircuitBreaker(serviceName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      const circuitBreaker = new CircuitBreaker(serviceName, {
        threshold: config.CIRCUIT_BREAKER_THRESHOLD,
        timeout: config.CIRCUIT_BREAKER_TIMEOUT,
      });
      this.circuitBreakers.set(serviceName, circuitBreaker);
    }
    return this.circuitBreakers.get(serviceName)!;
  }

  public getAllMetrics() {
    const metrics: Record<string, any> = {};
    for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
      metrics[serviceName] = circuitBreaker.getMetrics();
    }
    return metrics;
  }

  public resetAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }
    logger.info("All circuit breakers have been reset");
  }

  public resetService(serviceName: string): void {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }
}

export const circuitBreakerManager = CircuitBreakerManager.getInstance();
