// backend/property-service/src/services/cacheService.ts

import Redis from 'ioredis';
import { createHash } from 'crypto';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean; // Whether to compress large objects
  tags?: string[]; // Tags for cache invalidation
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

export class CacheService {
  private redis: Redis;
  private stats: CacheStats;
  private defaultTTL: number = 3600; // 1 hour
  private compressionThreshold: number = 1024; // Compress objects larger than 1KB

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableReadyCheck: true,
      enableOfflineQueue: false
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };

    this.setupEventHandlers();
  }

  /**
   * Set up Redis event handlers
   */
  private setupEventHandlers() {
    this.redis.on('connect', () => {
      console.log('Cache service connected to Redis');
    });

    this.redis.on('error', (error) => {
      console.error('Cache service Redis error:', error);
      this.stats.errors++;
    });

    this.redis.on('close', () => {
      console.log('Cache service Redis connection closed');
    });
  }

  /**
   * Generate cache key with namespace
   */
  private generateKey(key: string, namespace: string = 'property'): string {
    return `${namespace}:${key}`;
  }

  /**
   * Hash large keys to prevent Redis key length limits
   */
  private hashKey(key: string): string {
    if (key.length > 250) {
      return createHash('sha256').update(key).digest('hex');
    }
    return key;
  }

  /**
   * Serialize data for storage
   */
  private serialize(data: any, compress: boolean = false): string {
    const serialized = JSON.stringify(data);
    
    if (compress && serialized.length > this.compressionThreshold) {
      // In a production environment, you might want to use compression
      // like zlib, but for simplicity, we'll just store as-is
      return JSON.stringify({ __compressed: false, data });
    }
    
    return serialized;
  }

  /**
   * Deserialize data from storage
   */
  private deserialize(data: string): any {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed && typeof parsed === 'object' && parsed.__compressed !== undefined) {
        return parsed.data;
      }
      
      return parsed;
    } catch (error) {
      console.error('Cache deserialization error:', error);
      return null;
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string, namespace?: string): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(this.hashKey(key), namespace);
      const result = await this.redis.get(cacheKey);
      
      if (result === null) {
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      return this.deserialize(result) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(