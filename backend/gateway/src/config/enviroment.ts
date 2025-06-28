// backend/gateway/src/config/environment.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('8000'),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // CORS Configuration
  ALLOWED_ORIGINS: z.string().transform((val) => val.split(',').map(origin => origin.trim())),
  
  // Service URLs
  AUTH_SERVICE_URL: z.string().url(),
  PROPERTY_SERVICE_URL: z.string().url(),
  PAYMENT_SERVICE_URL: z.string().url(),
  BOOKING_SERVICE_URL: z.string().url(),
  MARKING_SERVICE_URL: z.string().url(),
  ADMIN_SERVICE_URL: z.string().url(),
  REFERRAL_SERVICE_URL: z.string().url(),
  NOTIFICATION_SERVICE_URL: z.string().url(),
  ANALYTICS_SERVICE_URL: z.string().url(),
  
  // Redis Configuration (for caching and session management)
  REDIS_URL: z.string().url(),
  
  // Monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_REQUEST_LOGGING: z.string().transform((val) => val === 'true').default('true'),
});

export const config = envSchema.parse(process.env);