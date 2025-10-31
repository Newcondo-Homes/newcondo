// apps/admin/src/lib/env.ts

import { z } from 'zod';

/**
 * Environment Variables Schema
 * Validates and types all environment variables used in the admin dashboard
 */

const envSchema = z.object({
  // API Configuration
  NEXT_PUBLIC_ADMIN_API_URL: z.string().url().default('http://localhost:4004/api/v1'),
  NEXT_PUBLIC_PLATFORM_URL: z.string().url().default('http://localhost:3000'),

  // Authentication
  NEXT_PUBLIC_AUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_ANALYTICS_EXPORT: z.string().transform(val => val === 'true').default('true'),
  NEXT_PUBLIC_ENABLE_BULK_OPERATIONS: z.string().transform(val => val === 'true').default('true'),
  NEXT_PUBLIC_ENABLE_REAL_TIME_UPDATES: z.string().transform(val => val === 'true').default('false'),

  // Rate Limiting
  NEXT_PUBLIC_API_RATE_LIMIT: z.string().transform(val => parseInt(val, 10)).default('100'),
  NEXT_PUBLIC_API_RATE_WINDOW: z.string().transform(val => parseInt(val, 10)).default('60'),

  // File Upload
  NEXT_PUBLIC_MAX_FILE_SIZE: z.string().transform(val => parseInt(val, 10)).default('5242880'), // 5MB
  NEXT_PUBLIC_MAX_IMAGE_SIZE: z.string().transform(val => parseInt(val, 10)).default('10485760'), // 10MB

  // Pagination
  NEXT_PUBLIC_DEFAULT_PAGE_SIZE: z.string().transform(val => parseInt(val, 10)).default('25'),
  NEXT_PUBLIC_MAX_PAGE_SIZE: z.string().transform(val => parseInt(val, 10)).default('100'),

  // Session
  NEXT_PUBLIC_SESSION_TIMEOUT: z.string().transform(val => parseInt(val, 10)).default('3600'), // 1 hour in seconds
  NEXT_PUBLIC_SESSION_WARNING: z.string().transform(val => parseInt(val, 10)).default('300'), // 5 minutes before timeout

  // Development
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Analytics
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),

  // Error Reporting
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: z.string().transform(val => val === 'true').default('false'),

  // Logging
  NEXT_PUBLIC_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  NEXT_PUBLIC_ENABLE_REQUEST_LOGGING: z.string().transform(val => val === 'true').default('false'),
});

/**
 * Validate environment variables
 */
const validateEnv = () => {
  try {
    return envSchema.parse({
      // API Configuration
      NEXT_PUBLIC_ADMIN_API_URL: process.env.NEXT_PUBLIC_ADMIN_API_URL,
      NEXT_PUBLIC_PLATFORM_URL: process.env.NEXT_PUBLIC_PLATFORM_URL,

      // Authentication
      NEXT_PUBLIC_AUTH_SECRET: process.env.NEXT_PUBLIC_AUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,

      // Feature Flags
      NEXT_PUBLIC_ENABLE_ANALYTICS_EXPORT: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_EXPORT,
      NEXT_PUBLIC_ENABLE_BULK_OPERATIONS: process.env.NEXT_PUBLIC_ENABLE_BULK_OPERATIONS,
      NEXT_PUBLIC_ENABLE_REAL_TIME_UPDATES: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME_UPDATES,

      // Rate Limiting
      NEXT_PUBLIC_API_RATE_LIMIT: process.env.NEXT_PUBLIC_API_RATE_LIMIT,
      NEXT_PUBLIC_API_RATE_WINDOW: process.env.NEXT_PUBLIC_API_RATE_WINDOW,

      // File Upload
      NEXT_PUBLIC_MAX_FILE_SIZE: process.env.NEXT_PUBLIC_MAX_FILE_SIZE,
      NEXT_PUBLIC_MAX_IMAGE_SIZE: process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE,

      // Pagination
      NEXT_PUBLIC_DEFAULT_PAGE_SIZE: process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE,
      NEXT_PUBLIC_MAX_PAGE_SIZE: process.env.NEXT_PUBLIC_MAX_PAGE_SIZE,

      // Session
      NEXT_PUBLIC_SESSION_TIMEOUT: process.env.NEXT_PUBLIC_SESSION_TIMEOUT,
      NEXT_PUBLIC_SESSION_WARNING: process.env.NEXT_PUBLIC_SESSION_WARNING,

      // Development
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,

      // Analytics
      NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,

      // Error Reporting
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_ENABLE_ERROR_REPORTING: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING,

      // Logging
      NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
      NEXT_PUBLIC_ENABLE_REQUEST_LOGGING: process.env.NEXT_PUBLIC_ENABLE_REQUEST_LOGGING,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      console.error(error.errors);
      throw new Error('Invalid environment variables');
    }
    throw error;
  }
};

/**
 * Validated and typed environment variables
 */
export const env = validateEnv();

/**
 * Type of the environment configuration
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in test
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Check if running in staging
 */
export const isStaging = env.NEXT_PUBLIC_APP_ENV === 'staging';

/**
 * Get API base URL
 */
export const getApiBaseUrl = () => env.NEXT_PUBLIC_ADMIN_API_URL;

/**
 * Get platform URL
 */
export const getPlatformUrl = () => env.NEXT_PUBLIC_PLATFORM_URL;

/**
 * Get full API URL
 */
export const getApiUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Feature flag helpers
 */
export const isFeatureEnabled = (feature: keyof Env): boolean => {
  return Boolean(env[feature]);
};

/**
 * Get environment info for debugging
 */
export const getEnvInfo = () => {
  return {
    nodeEnv: env.NODE_ENV,
    appEnv: env.NEXT_PUBLIC_APP_ENV,
    apiUrl: env.NEXT_PUBLIC_ADMIN_API_URL,
    platformUrl: env.NEXT_PUBLIC_PLATFORM_URL,
    isDevelopment,
    isProduction,
    isStaging,
    isTest,
  };
};

/**
 * Log environment info (only in development)
 */
if (isDevelopment && typeof window !== 'undefined') {
  console.log('🔧 Admin Dashboard Environment:', getEnvInfo());
}

/**
 * Export for use in configuration files
 */
export default env;