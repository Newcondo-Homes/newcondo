// backend/gateway/src/config/redis.ts
import { createClient, RedisClientType } from 'redis';
import { config } from './index';
import { logger } from '../utils/logger';

class RedisClient {
  private static instance: RedisClient;
  private client: RedisClientType;
  private isConnected = false;

  private constructor() {
    this.client = createClient({
      url: config.REDIS_URL,
      socket: {
        reconnectDelay: 5000,
        connectTimeout: 10000,
      },
    });

    this.setupEventHandlers();
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis: Connecting...');
    });

    this.client.on('ready', () => {
      logger.info('Redis: Connected and ready');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      logger.error('Redis: Connection error', error);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.info('Redis: Connection ended');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis: Reconnecting...');
    });
  }

  public async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
      }
    } catch (error) {
      logger.error('Redis: Failed to connect', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
      }
    } catch (error) {
      logger.error('Redis: Failed to disconnect', error);
      throw error;
    }
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  public isClientConnected(): boolean {
    return this.isConnected;
  }

  // Helper methods for common operations
  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error(`Redis: Failed to get key ${key}`, error);
      return null;
    }
  }

  public async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error(`Redis: Failed to set key ${key}`, error);
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis: Failed to delete key ${key}`, error);
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis: Failed to check existence of key ${key}`, error);
      return false;
    }
  }

  public async incr(key: string): Promise<number | null> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error(`Redis: Failed to increment key ${key}`, error);
      return null;
    }
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error(`Redis: Failed to set expiry for key ${key}`, error);
      return false;
    }
  }

  public async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      logger.error(`Redis: Failed to hget ${field} from ${key}`, error);
      return null;
    }
  }

  public async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      await this.client.hSet(key, field, value);
      return true;
    } catch (error) {
      logger.error(`Redis: Failed to hset ${field} in ${key}`, error);
      return false;
    }
  }

  public async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      logger.error(`Redis: Failed to hgetall from ${key}`, error);
      return null;
    }
  }
}

export const redisClient = RedisClient.getInstance();