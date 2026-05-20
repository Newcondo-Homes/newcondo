// backend/shared/src/utils/caching.ts

import Redis from 'ioredis';

// Initialize Redis client (configuration should be in shared/src/config/redis.ts)
let redis: Redis | null = null;

export const initializeRedis = (redisUrl?: string) => {
  if (!redis) {
    redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
  }
  return redis;
};

export const getRedisClient = () => {
  if (!redis) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redis;
};

// Cache key generators
export const CacheKeys = {
  // Property listing cache keys
  PROPERTY_LIST: (page: number, limit: number, filters: string) => 
    `properties:list:${page}:${limit}:${filters}`,
  
  PROPERTY_DETAIL: (propertyId: string) => 
    `property:${propertyId}`,
  
  PROPERTY_IMAGES: (propertyId: string) => 
    `property:${propertyId}:images`,
  
  // Search cache keys
  SEARCH_RESULTS: (query: string, filters: string, page: number) => 
    `search:${encodeURIComponent(query)}:${filters}:${page}`,
  
  SEARCH_SUGGESTIONS: (query: string) => 
    `search:suggestions:${encodeURIComponent(query)}`,
  
  // Location-based cache keys
  PROPERTIES_BY_LOCATION: (city: string, state: string, page: number) => 
    `location:${city}:${state}:${page}`,
  
  // Popular/trending cache keys
  POPULAR_PROPERTIES: (timeframe: string) => 
    `popular:${timeframe}`,
  
  TRENDING_LOCATIONS: () => 'trending:locations',
  
  // Filter options cache
  FILTER_OPTIONS: (type: 'cities' | 'property_types' | 'price_ranges') => 
    `filters:${type}`,
  
  // User-specific cache
  USER_FAVORITES: (userId: string) => 
    `user:${userId}:favorites`,
  
  USER_RECENT_SEARCHES: (userId: string) => 
    `user:${userId}:recent_searches`,
  
  // Analytics cache
  PROPERTY_VIEWS: (propertyId: string) => 
    `analytics:views:${propertyId}`,
  
  DAILY_STATS: (date: string) => 
    `stats:daily:${date}`,
};

// Cache duration constants (in seconds)
export const CacheDurations = {
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
export class CacheManager {
  private redis: Redis;

  constructor() {
    this.redis = getRedisClient();
  }

  // Set cache with expiration
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      // Don't throw error to prevent cache failures from breaking the app
    }
  }

  // Get from cache
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
      return null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Delete from cache
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  // Delete multiple keys
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error(`Cache delete pattern error for pattern ${pattern}:`, error);
    }
  }

  // Increment counter (for analytics)
  async incr(key: string, ttl?: number): Promise<number> {
    try {
      const value = await this.redis.incr(key);
      if (ttl && value === 1) {
        await this.redis.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  }

  // Add to set (for favorites, recent searches, etc.)
  async sadd(key: string, value: string, ttl?: number): Promise<void> {
    try {
      await this.redis.sadd(key, value);
      if (ttl) {
        await this.redis.expire(key, ttl);
      }
    } catch (error) {
      console.error(`Cache sadd error for key ${key}:`, error);
    }
  }

  // Get set members
  async smembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key);
    } catch (error) {
      console.error(`Cache smembers error for key ${key}:`, error);
      return [];
    }
  }

  // Remove from set
  async srem(key: string, value: string): Promise<void> {
    try {
      await this.redis.srem(key, value);
    } catch (error) {
      console.error(`Cache srem error for key ${key}:`, error);
    }
  }

  // Check if member exists in set
  async sismember(key: string, value: string): Promise<boolean> {
    try {
      const result = await this.redis.sismember(key, value);
      return result === 1;
    } catch (error) {
      console.error(`Cache sismember error for key ${key}:`, error);
      return false;
    }
  }

  // Add to sorted set with score (for trending, popular items)
  async zadd(key: string, score: number, value: string, ttl?: number): Promise<void> {
    try {
      await this.redis.zadd(key, score, value);
      if (ttl) {
        await this.redis.expire(key, ttl);
      }
    } catch (error) {
      console.error(`Cache zadd error for key ${key}:`, error);
    }
  }

  // Get sorted set range (highest scores first)
  async zrevrange(key: string, start: number = 0, stop: number = -1): Promise<string[]> {
    try {
      return await this.redis.zrevrange(key, start, stop);
    } catch (error) {
      console.error(`Cache zrevrange error for key ${key}:`, error);
      return [];
    }
  }

  // Get sorted set range with scores
  async zrevrangeWithScores(key: string, start: number = 0, stop: number = -1): Promise<{ value: string; score: number }[]> {
    try {
      const results = await this.redis.zrevrange(key, start, stop, 'WITHSCORES');
      const formatted: { value: string; score: number }[] = [];
      
      for (let i = 0; i < results.length; i += 2) {
        formatted.push({
          value: results[i],
          score: parseFloat(results[i + 1])
        });
      }
      
      return formatted;
    } catch (error) {
      console.error(`Cache zrevrangeWithScores error for key ${key}:`, error);
      return [];
    }
  }
}

// Property-specific cache operations
export class PropertyCacheManager extends CacheManager {
  
  // Cache invalidation helpers
  async invalidatePropertyCache(propertyId: string): Promise<void> {
    await Promise.all([
      this.del(CacheKeys.PROPERTY_DETAIL(propertyId)),
      this.del(CacheKeys.PROPERTY_IMAGES(propertyId)),
      this.delPattern(`properties:list:*`), // Invalidate all property lists
      this.delPattern(`search:*`), // Invalidate search results
      this.delPattern(`location:*`), // Invalidate location-based listings
    ]);
  }

  async invalidatePropertyListCache(): Promise<void> {
    await Promise.all([
      this.delPattern(`properties:list:*`),
      this.delPattern(`search:*`),
      this.delPattern(`location:*`),
      this.del(CacheKeys.POPULAR_PROPERTIES('daily')),
      this.del(CacheKeys.POPULAR_PROPERTIES('weekly')),
    ]);
  }

  async invalidateSearchCache(query?: string): Promise<void> {
    if (query) {
      await this.delPattern(`search:${encodeURIComponent(query)}:*`);
    } else {
      await this.delPattern(`search:*`);
    }
  }

  // Track property views
  async trackPropertyView(propertyId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await Promise.all([
      this.incr(CacheKeys.PROPERTY_VIEWS(propertyId), CacheDurations.PROPERTY_VIEWS),
      this.zadd(CacheKeys.POPULAR_PROPERTIES('daily'), Date.now(), propertyId, CacheDurations.DAILY_STATS),
      this.incr(CacheKeys.DAILY_STATS(today), CacheDurations.DAILY_STATS),
    ]);
  }

  // Get popular properties
  async getPopularProperties(timeframe: 'daily' | 'weekly' = 'daily', limit: number = 10): Promise<string[]> {
    return await this.zrevrange(CacheKeys.POPULAR_PROPERTIES(timeframe), 0, limit - 1);
  }

  // User favorites cache operations
  async addToFavorites(userId: string, propertyId: string): Promise<void> {
    await this.sadd(CacheKeys.USER_FAVORITES(userId), propertyId, CacheDurations.USER_FAVORITES);
  }

  async removeFromFavorites(userId: string, propertyId: string): Promise<void> {
    await this.srem(CacheKeys.USER_FAVORITES(userId), propertyId);
  }

  async getUserFavorites(userId: string): Promise<string[]> {
    return await this.smembers(CacheKeys.USER_FAVORITES(userId));
  }

  async isPropertyFavorited(userId: string, propertyId: string): Promise<boolean> {
    return await this.sismember(CacheKeys.USER_FAVORITES(userId), propertyId);
  }

  // Recent searches cache operations
  async addRecentSearch(userId: string, searchQuery: string): Promise<void> {
    const key = CacheKeys.USER_RECENT_SEARCHES(userId);
    const searches = await this.get<string[]>(key) || [];
    
    // Remove if already exists
    const filteredSearches = searches.filter(s => s !== searchQuery);
    
    // Add to beginning
    filteredSearches.unshift(searchQuery);
    
    // Keep only last 10 searches
    const recentSearches = filteredSearches.slice(0, 10);
    
    await this.set(key, recentSearches, CacheDurations.USER_RECENT_SEARCHES);
  }

  async getUserRecentSearches(userId: string): Promise<string[]> {
    return await this.get<string[]>(CacheKeys.USER_RECENT_SEARCHES(userId)) || [];
  }
}

// Export singleton instance
export const propertyCache = () => new PropertyCacheManager();
export const cacheManager = () => new CacheManager();

// Cache warming utilities
export const warmCache = async () => {
  try {
    // You can add cache warming logic here
    // For example, pre-load popular properties, trending locations, etc.
    console.log('Cache warming started...');
    
    // This would be implemented based on your specific needs
    // await warmPopularProperties();
    // await warmTrendingLocations();
    
    console.log('Cache warming completed.');
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
};