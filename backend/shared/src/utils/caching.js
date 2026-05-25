"use strict";
// backend/shared/src/utils/caching.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warmCache = exports.cacheManager = exports.propertyCache = exports.PropertyCacheManager = exports.CacheManager = exports.CacheDurations = exports.CacheKeys = exports.getRedisClient = exports.initializeRedis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
// Initialize Redis client (configuration should be in shared/src/config/redis.ts)
let redis = null;
const initializeRedis = (redisUrl) => {
    if (!redis) {
        redis = new ioredis_1.default(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    }
    return redis;
};
exports.initializeRedis = initializeRedis;
const getRedisClient = () => {
    if (!redis) {
        throw new Error('Redis client not initialized. Call initializeRedis() first.');
    }
    return redis;
};
exports.getRedisClient = getRedisClient;
// Cache key generators
exports.CacheKeys = {
    // Property listing cache keys
    PROPERTY_LIST: (page, limit, filters) => `properties:list:${page}:${limit}:${filters}`,
    PROPERTY_DETAIL: (propertyId) => `property:${propertyId}`,
    PROPERTY_IMAGES: (propertyId) => `property:${propertyId}:images`,
    // Search cache keys
    SEARCH_RESULTS: (query, filters, page) => `search:${encodeURIComponent(query)}:${filters}:${page}`,
    SEARCH_SUGGESTIONS: (query) => `search:suggestions:${encodeURIComponent(query)}`,
    // Location-based cache keys
    PROPERTIES_BY_LOCATION: (city, state, page) => `location:${city}:${state}:${page}`,
    // Popular/trending cache keys
    POPULAR_PROPERTIES: (timeframe) => `popular:${timeframe}`,
    TRENDING_LOCATIONS: () => 'trending:locations',
    // Filter options cache
    FILTER_OPTIONS: (type) => `filters:${type}`,
    // User-specific cache
    USER_FAVORITES: (userId) => `user:${userId}:favorites`,
    USER_RECENT_SEARCHES: (userId) => `user:${userId}:recent_searches`,
    // Analytics cache
    PROPERTY_VIEWS: (propertyId) => `analytics:views:${propertyId}`,
    DAILY_STATS: (date) => `stats:daily:${date}`,
};
// Cache duration constants (in seconds)
exports.CacheDurations = {
    PROPERTY_LIST: 300, // 5 minutes
    PROPERTY_DETAIL: 600, // 10 minutes
    PROPERTY_IMAGES: 1800, // 30 minutes
    SEARCH_RESULTS: 300, // 5 minutes
    SEARCH_SUGGESTIONS: 3600, // 1 hour
    POPULAR_PROPERTIES: 1800, // 30 minutes
    TRENDING_LOCATIONS: 3600, // 1 hour
    FILTER_OPTIONS: 3600, // 1 hour
    USER_FAVORITES: 300, // 5 minutes
    USER_RECENT_SEARCHES: 86400, // 24 hours
    PROPERTY_VIEWS: 3600, // 1 hour
    DAILY_STATS: 86400, // 24 hours
    LOCATION_DATA: 1800, // 30 minutes
};
// Generic cache operations
class CacheManager {
    constructor() {
        this.redis = (0, exports.getRedisClient)();
    }
    // Set cache with expiration
    async set(key, value, ttl) {
        try {
            const serializedValue = JSON.stringify(value);
            if (ttl) {
                await this.redis.setex(key, ttl, serializedValue);
            }
            else {
                await this.redis.set(key, serializedValue);
            }
        }
        catch (error) {
            console.error(`Cache set error for key ${key}:`, error);
            // Don't throw error to prevent cache failures from breaking the app
        }
    }
    // Get from cache
    async get(key) {
        try {
            const cached = await this.redis.get(key);
            if (cached) {
                return JSON.parse(cached);
            }
            return null;
        }
        catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }
    // Delete from cache
    async del(key) {
        try {
            await this.redis.del(key);
        }
        catch (error) {
            console.error(`Cache delete error for key ${key}:`, error);
        }
    }
    // Delete multiple keys
    async delPattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
        catch (error) {
            console.error(`Cache delete pattern error for pattern ${pattern}:`, error);
        }
    }
    // Increment counter (for analytics)
    async incr(key, ttl) {
        try {
            const value = await this.redis.incr(key);
            if (ttl && value === 1) {
                await this.redis.expire(key, ttl);
            }
            return value;
        }
        catch (error) {
            console.error(`Cache incr error for key ${key}:`, error);
            return 0;
        }
    }
    // Add to set (for favorites, recent searches, etc.)
    async sadd(key, value, ttl) {
        try {
            await this.redis.sadd(key, value);
            if (ttl) {
                await this.redis.expire(key, ttl);
            }
        }
        catch (error) {
            console.error(`Cache sadd error for key ${key}:`, error);
        }
    }
    // Get set members
    async smembers(key) {
        try {
            return await this.redis.smembers(key);
        }
        catch (error) {
            console.error(`Cache smembers error for key ${key}:`, error);
            return [];
        }
    }
    // Remove from set
    async srem(key, value) {
        try {
            await this.redis.srem(key, value);
        }
        catch (error) {
            console.error(`Cache srem error for key ${key}:`, error);
        }
    }
    // Check if member exists in set
    async sismember(key, value) {
        try {
            const result = await this.redis.sismember(key, value);
            return result === 1;
        }
        catch (error) {
            console.error(`Cache sismember error for key ${key}:`, error);
            return false;
        }
    }
    // Add to sorted set with score (for trending, popular items)
    async zadd(key, score, value, ttl) {
        try {
            await this.redis.zadd(key, score, value);
            if (ttl) {
                await this.redis.expire(key, ttl);
            }
        }
        catch (error) {
            console.error(`Cache zadd error for key ${key}:`, error);
        }
    }
    // Get sorted set range (highest scores first)
    async zrevrange(key, start = 0, stop = -1) {
        try {
            return await this.redis.zrevrange(key, start, stop);
        }
        catch (error) {
            console.error(`Cache zrevrange error for key ${key}:`, error);
            return [];
        }
    }
    // Get sorted set range with scores
    async zrevrangeWithScores(key, start = 0, stop = -1) {
        try {
            const results = await this.redis.zrevrange(key, start, stop, 'WITHSCORES');
            const formatted = [];
            for (let i = 0; i < results.length; i += 2) {
                formatted.push({
                    value: results[i],
                    score: parseFloat(results[i + 1])
                });
            }
            return formatted;
        }
        catch (error) {
            console.error(`Cache zrevrangeWithScores error for key ${key}:`, error);
            return [];
        }
    }
}
exports.CacheManager = CacheManager;
// Property-specific cache operations
class PropertyCacheManager extends CacheManager {
    // Cache invalidation helpers
    async invalidatePropertyCache(propertyId) {
        await Promise.all([
            this.del(exports.CacheKeys.PROPERTY_DETAIL(propertyId)),
            this.del(exports.CacheKeys.PROPERTY_IMAGES(propertyId)),
            this.delPattern(`properties:list:*`), // Invalidate all property lists
            this.delPattern(`search:*`), // Invalidate search results
            this.delPattern(`location:*`), // Invalidate location-based listings
        ]);
    }
    async invalidatePropertyListCache() {
        await Promise.all([
            this.delPattern(`properties:list:*`),
            this.delPattern(`search:*`),
            this.delPattern(`location:*`),
            this.del(exports.CacheKeys.POPULAR_PROPERTIES('daily')),
            this.del(exports.CacheKeys.POPULAR_PROPERTIES('weekly')),
        ]);
    }
    async invalidateSearchCache(query) {
        if (query) {
            await this.delPattern(`search:${encodeURIComponent(query)}:*`);
        }
        else {
            await this.delPattern(`search:*`);
        }
    }
    // Track property views
    async trackPropertyView(propertyId) {
        const today = new Date().toISOString().split('T')[0];
        await Promise.all([
            this.incr(exports.CacheKeys.PROPERTY_VIEWS(propertyId), exports.CacheDurations.PROPERTY_VIEWS),
            this.zadd(exports.CacheKeys.POPULAR_PROPERTIES('daily'), Date.now(), propertyId, exports.CacheDurations.DAILY_STATS),
            this.incr(exports.CacheKeys.DAILY_STATS(today), exports.CacheDurations.DAILY_STATS),
        ]);
    }
    // Get popular properties
    async getPopularProperties(timeframe = 'daily', limit = 10) {
        return await this.zrevrange(exports.CacheKeys.POPULAR_PROPERTIES(timeframe), 0, limit - 1);
    }
    // User favorites cache operations
    async addToFavorites(userId, propertyId) {
        await this.sadd(exports.CacheKeys.USER_FAVORITES(userId), propertyId, exports.CacheDurations.USER_FAVORITES);
    }
    async removeFromFavorites(userId, propertyId) {
        await this.srem(exports.CacheKeys.USER_FAVORITES(userId), propertyId);
    }
    async getUserFavorites(userId) {
        return await this.smembers(exports.CacheKeys.USER_FAVORITES(userId));
    }
    async isPropertyFavorited(userId, propertyId) {
        return await this.sismember(exports.CacheKeys.USER_FAVORITES(userId), propertyId);
    }
    // Recent searches cache operations
    async addRecentSearch(userId, searchQuery) {
        const key = exports.CacheKeys.USER_RECENT_SEARCHES(userId);
        const searches = await this.get(key) || [];
        // Remove if already exists
        const filteredSearches = searches.filter(s => s !== searchQuery);
        // Add to beginning
        filteredSearches.unshift(searchQuery);
        // Keep only last 10 searches
        const recentSearches = filteredSearches.slice(0, 10);
        await this.set(key, recentSearches, exports.CacheDurations.USER_RECENT_SEARCHES);
    }
    async getUserRecentSearches(userId) {
        return await this.get(exports.CacheKeys.USER_RECENT_SEARCHES(userId)) || [];
    }
}
exports.PropertyCacheManager = PropertyCacheManager;
// Export singleton instance
const propertyCache = () => new PropertyCacheManager();
exports.propertyCache = propertyCache;
const cacheManager = () => new CacheManager();
exports.cacheManager = cacheManager;
// Cache warming utilities
const warmCache = async () => {
    try {
        // You can add cache warming logic here
        // For example, pre-load popular properties, trending locations, etc.
        console.log('Cache warming started...');
        // This would be implemented based on your specific needs
        // await warmPopularProperties();
        // await warmTrendingLocations();
        console.log('Cache warming completed.');
    }
    catch (error) {
        console.error('Cache warming failed:', error);
    }
};
exports.warmCache = warmCache;
//# sourceMappingURL=caching.js.map