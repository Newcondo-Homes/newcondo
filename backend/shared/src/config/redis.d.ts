import Redis from 'ioredis';
export declare const redis: Redis;
export declare class RedisHelper {
    /**
     * Set a key with expiration
     */
    static setWithExpiry(key: string, value: string, expireInSeconds: number): Promise<boolean>;
    /**
     * Get a key value
     */
    static get(key: string): Promise<string | null>;
    /**
     * Delete a key
     */
    static delete(key: string): Promise<boolean>;
    /**
     * Check if key exists
     */
    static exists(key: string): Promise<boolean>;
    /**
     * Set multiple keys at once
     */
    static setMultiple(keyValuePairs: Record<string, string>): Promise<boolean>;
    /**
     * Get multiple keys at once
     */
    static getMultiple(keys: string[]): Promise<(string | null)[]>;
    /**
     * Increment a counter
     */
    static increment(key: string, by?: number): Promise<number | null>;
    /**
     * Add to a set
     */
    static addToSet(key: string, ...members: string[]): Promise<boolean>;
    /**
     * Check if member exists in set
     */
    static isInSet(key: string, member: string): Promise<boolean>;
    /**
     * Get all members of a set
     */
    static getSetMembers(key: string): Promise<string[]>;
    /**
     * Add to sorted set with score
     */
    static addToSortedSet(key: string, score: number, member: string): Promise<boolean>;
    /**
     * Get sorted set by score range
     */
    static getSortedSetByScore(key: string, min: number, max: number): Promise<string[]>;
}
export default redis;
//# sourceMappingURL=redis.d.ts.map