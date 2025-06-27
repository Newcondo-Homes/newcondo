// backend/shared/src/config/redis.ts
import Redis from 'ioredis';
import { z } from 'zod';

// Environment schema for Redis configuration
const redisEnvSchema = z.object({
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),
  REDIS_KEY_PREFIX: z.string().default('newcondo:'),
  REDIS_MAX_RETRIES: z.string().transform(Number).default('3'),
  REDIS_RETRY_DELAY: z.string().transform(Number).default('2000'),
});

// Validate environment variables
const redisEnv = redisEnvSchema.parse(process.env);

// Redis configuration options
const redisConfig = {
  // Use Redis URL if provided (for production), otherwise use individual config
  ...(redisEnv.REDIS_URL 
    ? { lazyConnect: true }
    : {
        host: redisEnv.REDIS_HOST,
        port: redisEnv.REDIS_PORT,
        password: redisEnv.REDIS_PASSWORD,
        db: redisEnv.REDIS_DB,
        lazyConnect: true,
      }
  ),
  
  // Connection options
  connectTimeout: 10000,
  commandTimeout: 5000,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: redisEnv.REDIS_MAX_RETRIES,
  
  // Retry strategy
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, redisEnv.REDIS_RETRY_DELAY);
    return delay;
  },
  
  // Key prefix for namespacing
  keyPrefix: redisEnv.REDIS_KEY_PREFIX,
  
  // Reconnect on error
  lazyConnect: true,
  keepAlive: 30000,
};

// Create Redis instance
export const redis = redisEnv.REDIS_URL 
  ? new Redis(redisEnv.REDIS_URL)
  : new Redis(redisConfig);

// Redis connection event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('ready', () => {
  console.log('🚀 Redis is ready to accept commands');
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

redis.on('close', () => {
  console.log('🔌 Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Helper functions for common Redis operations
export class RedisHelper {
  /**
   * Set a key with expiration
   */
  static async setWithExpiry(key: string, value: string, expireInSeconds: number): Promise<boolean> {
    try {
      const result = await redis.setex(key, expireInSeconds, value);
      return result === 'OK';
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  /**
   * Get a key value
   */
  static async get(key: string): Promise<string | null> {
    try {
      return await redis.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  /**
   * Delete a key
   */
  static async delete(key: string): Promise<boolean> {
    try {
      const result = await redis.del(key);
      return result > 0;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  /**
   * Set multiple keys at once
   */
  static async setMultiple(keyValuePairs: Record<string, string>): Promise<boolean> {
    try {
      const pipeline = redis.pipeline();
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        pipeline.set(key, value);
      });
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Redis MSET error:', error);
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  static async getMultiple(keys: string[]): Promise<(string | null)[]> {
    try {
      return await redis.mget(...keys);
    } catch (error) {
      console.error('Redis MGET error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Increment a counter
   */
  static async increment(key: string, by: number = 1): Promise<number | null> {
    try {
      return await redis.incrby(key, by);
    } catch (error) {
      console.error('Redis INCREMENT error:', error);
      return null;
    }
  }

  /**
   * Add to a set
   */
  static async addToSet(key: string, ...members: string[]): Promise<boolean> {
    try {
      await redis.sadd(key, ...members);
      return true;
    } catch (error) {
      console.error('Redis SADD error:', error);
      return false;
    }
  }

  /**
   * Check if member exists in set
   */
  static async isInSet(key: string, member: string): Promise<boolean> {
    try {
      const result = await redis.sismember(key, member);
      return result === 1;
    } catch (error) {
      console.error('Redis SISMEMBER error:', error);
      return false;
    }
  }

  /**
   * Get all members of a set
   */
  static async getSetMembers(key: string): Promise<string[]> {
    try {
      return await redis.smembers(key);
    } catch (error) {
      console.error('Redis SMEMBERS error:', error);
      return [];
    }
  }

  /**
   * Add to sorted set with score
   */
  static async addToSortedSet(key: string, score: number, member: string): Promise<boolean> {
    try {
      await redis.zadd(key, score, member);
      return true;
    } catch (error) {
      console.error('Redis ZADD error:', error);
      return false;
    }
  }

  /**
   * Get sorted set by score range
   */
  static async getSortedSetByScore(key: string, min: number, max: number): Promise<string[]> {
    try {
      return await redis.zrangebyscore(key, min, max);
    } catch (error) {
      console.error('Redis ZRANGEBYSCORE error:', error);
      return [];
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing Redis connection...');
  await redis.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing Redis connection...');
  await redis.quit();
  process.exit(0);
});

export default redis;