import Redis from 'ioredis';
export declare const initializeRedis: (redisUrl?: string) => Redis;
export declare const getRedisClient: () => Redis;
export declare const CacheKeys: {
    PROPERTY_LIST: (page: number, limit: number, filters: string) => string;
    PROPERTY_DETAIL: (propertyId: string) => string;
    PROPERTY_IMAGES: (propertyId: string) => string;
    SEARCH_RESULTS: (query: string, filters: string, page: number) => string;
    SEARCH_SUGGESTIONS: (query: string) => string;
    PROPERTIES_BY_LOCATION: (city: string, state: string, page: number) => string;
    POPULAR_PROPERTIES: (timeframe: string) => string;
    TRENDING_LOCATIONS: () => string;
    FILTER_OPTIONS: (type: "cities" | "property_types" | "price_ranges") => string;
    USER_FAVORITES: (userId: string) => string;
    USER_RECENT_SEARCHES: (userId: string) => string;
    PROPERTY_VIEWS: (propertyId: string) => string;
    DAILY_STATS: (date: string) => string;
};
export declare const CacheDurations: {
    PROPERTY_LIST: number;
    PROPERTY_DETAIL: number;
    PROPERTY_IMAGES: number;
    SEARCH_RESULTS: number;
    SEARCH_SUGGESTIONS: number;
    POPULAR_PROPERTIES: number;
    TRENDING_LOCATIONS: number;
    FILTER_OPTIONS: number;
    USER_FAVORITES: number;
    USER_RECENT_SEARCHES: number;
    PROPERTY_VIEWS: number;
    DAILY_STATS: number;
    LOCATION_DATA: number;
};
export declare class CacheManager {
    private redis;
    constructor();
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<void>;
    incr(key: string, ttl?: number): Promise<number>;
    sadd(key: string, value: string, ttl?: number): Promise<void>;
    smembers(key: string): Promise<string[]>;
    srem(key: string, value: string): Promise<void>;
    sismember(key: string, value: string): Promise<boolean>;
    zadd(key: string, score: number, value: string, ttl?: number): Promise<void>;
    zrevrange(key: string, start?: number, stop?: number): Promise<string[]>;
    zrevrangeWithScores(key: string, start?: number, stop?: number): Promise<{
        value: string;
        score: number;
    }[]>;
}
export declare class PropertyCacheManager extends CacheManager {
    invalidatePropertyCache(propertyId: string): Promise<void>;
    invalidatePropertyListCache(): Promise<void>;
    invalidateSearchCache(query?: string): Promise<void>;
    trackPropertyView(propertyId: string): Promise<void>;
    getPopularProperties(timeframe?: 'daily' | 'weekly', limit?: number): Promise<string[]>;
    addToFavorites(userId: string, propertyId: string): Promise<void>;
    removeFromFavorites(userId: string, propertyId: string): Promise<void>;
    getUserFavorites(userId: string): Promise<string[]>;
    isPropertyFavorited(userId: string, propertyId: string): Promise<boolean>;
    addRecentSearch(userId: string, searchQuery: string): Promise<void>;
    getUserRecentSearches(userId: string): Promise<string[]>;
}
export declare const propertyCache: () => PropertyCacheManager;
export declare const cacheManager: () => CacheManager;
export declare const warmCache: () => Promise<void>;
//# sourceMappingURL=caching.d.ts.map