import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { createHash } from 'crypto';

// Redis client singleton
class RedisClient {
  private static instance: Redis | null = null;
  
  static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      });
    }
    return this.instance;
  }
}

// Cache key generators
const generateCacheKey = (prefix: string, params: any): string => {
  const hash = createHash('md5').update(JSON.stringify(params)).digest('hex');
  return `${prefix}:${hash}`;
};

const generateSearchCacheKey = (query: any, userId?: string): string => {
  const searchParams = {
    ...query,
    userId: userId || 'anonymous' // Include user ID for personalized results
  };
  return generateCacheKey('property_search', searchParams);
};

const generatePropertyCacheKey = (propertyId: string, userId?: string): string => {
  return generateCacheKey('property_details', { propertyId, userId: userId || 'anonymous' });
};

const generateFavoritesCacheKey = (userId: string): string => {
  return `user_favorites:${userId}`;
};

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  PROPERTY_SEARCH: 300, // 5 minutes
  PROPERTY_DETAILS: 600, // 10 minutes
  FAVORITES: 1800, // 30 minutes
  PROPERTY_LIST: 180, // 3 minutes
  COMPARISON: 900, // 15 minutes
  FILTERS: 3600, // 1 hour
};

// Cache headers for client-side caching
const setCacheHeaders = (res: Response, ttl: number) => {
  res.set({
    'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`,
    'ETag': `"${Date.now()}"`,
    'Last-Modified': new Date().toUTCString(),
    'Vary': 'Accept-Encoding, Authorization'
  });
};

// Middleware for caching property search results
const cacheSearchResults = (ttl: number = CACHE_TTL.PROPERTY_SEARCH) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const redis = RedisClient.getInstance();
      const userId = req.user?.id;
      const cacheKey = generateSearchCacheKey(req.validatedQuery || req.query, userId);
      
      // Try to get cached result
      const cachedResult = await redis.get(cacheKey);
      
      if (cachedResult) {
        const parsedResult = JSON.parse(cachedResult);
        
        // Set cache headers
        setCacheHeaders(res, ttl);
        res.set('X-Cache', 'HIT');
        
        return res.json({
          ...parsedResult,
          cached: true,
          cacheTimestamp: new Date().toISOString()
        });
      }
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache the response
      res.json = function(data: any) {
        // Cache the successful response
        if (res.statusCode === 200 && data.success !== false) {
          redis.setex(cacheKey, ttl, JSON.stringify(data)).catch(console.error);
        }
        
        // Set cache headers
        setCacheHeaders(res, ttl);
        res.set('X-Cache', 'MISS');
        
        // Call original json method
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching if Redis is down
    }
  };
};

// Middleware for caching property details
const cachePropertyDetails = (ttl: number = CACHE_TTL.PROPERTY_DETAILS) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const redis = RedisClient.getInstance();
      const userId = req.user?.id;
      const propertyId = req.params.id || req.validatedParams?.id;
      
      if (!propertyId) {
        return next();
      }
      
      const cacheKey = generatePropertyCacheKey(propertyId, userId);
      
      // Try to get cached result
      const cachedResult = await redis.get(cacheKey);
      
      if (cachedResult) {
        const parsedResult = JSON.parse(cachedResult);
        
        // Increment view count in background (don't wait)
        updateViewCountAsync(propertyId).catch(console.error);
        
        setCacheHeaders(res, ttl);
        res.set('X-Cache', 'HIT');
        
        return res.json({
          ...parsedResult,
          cached: true,
          cacheTimestamp: new Date().toISOString()
        });
      }
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache the response
      res.json = function(data: any) {
        // Cache the successful response
        if (res.statusCode === 200 && data.success !== false) {
          redis.setex(cacheKey, ttl, JSON.stringify(data)).catch(console.error);
        }
        
        setCacheHeaders(res, ttl);
        res.set('X-Cache', 'MISS');
        
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Property details cache error:', error);
      next();
    }
  };
};

// Middleware for caching user favorites
const cacheFavorites = (ttl: number = CACHE_TTL.FAVORITES) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const redis = RedisClient.getInstance();
      const userId = req.user?.id;
      
      if (!userId) {
        return next();
      }
      
      const cacheKey = generateFavoritesCacheKey(userId);
      
      // Try to get cached result
      const cachedResult = await redis.get(cacheKey);
      
      if (cachedResult) {
        const parsedResult = JSON.parse(cachedResult);
        
        setCacheHeaders(res, ttl);
        res.set('X-Cache', 'HIT');
        
        return res.json({
          ...parsedResult,
          cached: true,
          cacheTimestamp: new Date().toISOString()
        });
      }
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache the response
      res.json = function(data: any) {
        if (res.statusCode === 200 && data.success !== false) {
          redis.setex(cacheKey, ttl, JSON.stringify(data)).catch(console.error);
        }
        
        setCacheHeaders(res, ttl);
        res.set('X-Cache', 'MISS');
        
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Favorites cache error:', error);
      next();
    }
  };
};

// Cache invalidation functions
const invalidatePropertyCache = async (propertyId: string) => {
  try {
    const redis = RedisClient.getInstance();
    const pattern = `*property*${propertyId}*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

const invalidateSearchCache = async () => {
  try {
    const redis = RedisClient.getInstance();
    const keys = await redis.keys('property_search:*');
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Search cache invalidation error:', error);
  }
};

const invalidateFavoritesCache = async (userId: string) => {
  try {
    const redis = RedisClient.getInstance();
    const cacheKey = generateFavoritesCacheKey(userId);
    await redis.del(cacheKey);
  } catch (error) {
    console.error('Favorites cache invalidation error:', error);
  }
};

// Background view count update
const updateViewCountAsync = async (propertyId: string) => {
  try {
    const redis = RedisClient.getInstance();
    const viewKey = `property_views:${propertyId}`;
    
    // Increment view count in Redis
    await redis.incr(viewKey);
    
    // Set expiry if not exists
    const ttl = await redis.ttl(viewKey);
    if (ttl === -1) {
      await redis.expire(viewKey, 3600); // 1 hour
    }
  } catch (error) {
    console.error('View count update error:', error);
  }
};

// Middleware to handle conditional requests (ETags)
const handleConditionalRequests = (req: Request, res: Response, next: NextFunction) => {
  const ifNoneMatch = req.headers['if-none-match'];
  const ifModifiedSince = req.headers['if-modified-since'];
  
  // Store original json method to intercept response
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Generate ETag
    const etag = `"${createHash('md5').update(JSON.stringify(data)).digest('hex')}"`;
    res.set('ETag', etag);
    
    // Check if client has fresh copy
    if (ifNoneMatch === etag) {
      return res.status(304).end();
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Image caching headers
const cacheImages = (maxAge: number = 86400) => { // 1 day default
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
      res.set({
        'Cache-Control': `public, max-age=${maxAge}, immutable`,
        'Expires': new Date(Date.now() + maxAge * 1000).toUTCString()
      });
    }
    next();
  };
};

export {
  cacheSearchResults,
  cachePropertyDetails,
  cacheFavorites,
  handleConditionalRequests,
  cacheImages,
  invalidatePropertyCache,
  invalidateSearchCache,
  invalidateFavoritesCache,
  updateViewCountAsync,
  RedisClient,
  CACHE_TTL
};