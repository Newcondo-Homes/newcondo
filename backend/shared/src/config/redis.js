"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisHelper = exports.redis = void 0;
// backend/shared/src/config/redis.ts
const ioredis_1 = __importDefault(require("ioredis"));
const zod_1 = require("zod");
// Environment schema for Redis configuration
const redisEnvSchema = zod_1.z.object({
    REDIS_URL: zod_1.z.string().optional(),
    REDIS_HOST: zod_1.z.string().default('localhost'),
    REDIS_PORT: zod_1.z.string().transform(Number).default('6379'),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    REDIS_DB: zod_1.z.string().transform(Number).default('0'),
    REDIS_KEY_PREFIX: zod_1.z.string().default('newcondo:'),
    REDIS_MAX_RETRIES: zod_1.z.string().transform(Number).default('3'),
    REDIS_RETRY_DELAY: zod_1.z.string().transform(Number).default('2000'),
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
        }),
    // Connection options
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: redisEnv.REDIS_MAX_RETRIES,
    // Retry strategy
    retryStrategy: (times) => {
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
exports.redis = redisEnv.REDIS_URL
    ? new ioredis_1.default(redisEnv.REDIS_URL)
    : new ioredis_1.default(redisConfig);
// Redis connection event handlers
exports.redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});
exports.redis.on('ready', () => {
    console.log('🚀 Redis is ready to accept commands');
});
exports.redis.on('error', (error) => {
    console.error('❌ Redis connection error:', error);
});
exports.redis.on('close', () => {
    console.log('🔌 Redis connection closed');
});
exports.redis.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
});
// Helper functions for common Redis operations
class RedisHelper {
    /**
     * Set a key with expiration
     */
    static async setWithExpiry(key, value, expireInSeconds) {
        try {
            const result = await exports.redis.setex(key, expireInSeconds, value);
            return result === 'OK';
        }
        catch (error) {
            console.error('Redis SET error:', error);
            return false;
        }
    }
    /**
     * Get a key value
     */
    static async get(key) {
        try {
            return await exports.redis.get(key);
        }
        catch (error) {
            console.error('Redis GET error:', error);
            return null;
        }
    }
    /**
     * Delete a key
     */
    static async delete(key) {
        try {
            const result = await exports.redis.del(key);
            return result > 0;
        }
        catch (error) {
            console.error('Redis DELETE error:', error);
            return false;
        }
    }
    /**
     * Check if key exists
     */
    static async exists(key) {
        try {
            const result = await exports.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            console.error('Redis EXISTS error:', error);
            return false;
        }
    }
    /**
     * Set multiple keys at once
     */
    static async setMultiple(keyValuePairs) {
        try {
            const pipeline = exports.redis.pipeline();
            Object.entries(keyValuePairs).forEach(([key, value]) => {
                pipeline.set(key, value);
            });
            await pipeline.exec();
            return true;
        }
        catch (error) {
            console.error('Redis MSET error:', error);
            return false;
        }
    }
    /**
     * Get multiple keys at once
     */
    static async getMultiple(keys) {
        try {
            return await exports.redis.mget(...keys);
        }
        catch (error) {
            console.error('Redis MGET error:', error);
            return keys.map(() => null);
        }
    }
    /**
     * Increment a counter
     */
    static async increment(key, by = 1) {
        try {
            return await exports.redis.incrby(key, by);
        }
        catch (error) {
            console.error('Redis INCREMENT error:', error);
            return null;
        }
    }
    /**
     * Add to a set
     */
    static async addToSet(key, ...members) {
        try {
            await exports.redis.sadd(key, ...members);
            return true;
        }
        catch (error) {
            console.error('Redis SADD error:', error);
            return false;
        }
    }
    /**
     * Check if member exists in set
     */
    static async isInSet(key, member) {
        try {
            const result = await exports.redis.sismember(key, member);
            return result === 1;
        }
        catch (error) {
            console.error('Redis SISMEMBER error:', error);
            return false;
        }
    }
    /**
     * Get all members of a set
     */
    static async getSetMembers(key) {
        try {
            return await exports.redis.smembers(key);
        }
        catch (error) {
            console.error('Redis SMEMBERS error:', error);
            return [];
        }
    }
    /**
     * Add to sorted set with score
     */
    static async addToSortedSet(key, score, member) {
        try {
            await exports.redis.zadd(key, score, member);
            return true;
        }
        catch (error) {
            console.error('Redis ZADD error:', error);
            return false;
        }
    }
    /**
     * Get sorted set by score range
     */
    static async getSortedSetByScore(key, min, max) {
        try {
            return await exports.redis.zrangebyscore(key, min, max);
        }
        catch (error) {
            console.error('Redis ZRANGEBYSCORE error:', error);
            return [];
        }
    }
}
exports.RedisHelper = RedisHelper;
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Closing Redis connection...');
    await exports.redis.quit();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Closing Redis connection...');
    await exports.redis.quit();
    process.exit(0);
});
exports.default = exports.redis;
//# sourceMappingURL=redis.js.map