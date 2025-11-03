// backend/auth-service/src/config/authConfig.ts
import { z } from 'zod';

const authConfigSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Session configuration
  SESSION_TIMEOUT: z.string().default('30m'),
  MAX_SESSION_PER_USER: z.number().default(5),
  
  // Account lockout configuration
  MAX_LOGIN_ATTEMPTS: z.number().default(5),
  LOCKOUT_DURATION: z.number().default(900000), // 15 minutes in milliseconds
  LOCKOUT_INCREMENT_FACTOR: z.number().default(2),
  
  // Rate limiting
  RATE_LIMIT_WINDOW: z.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.number().default(10),
  
  // OTP configuration
  OTP_EXPIRES_IN: z.number().default(300000), // 5 minutes
  OTP_MAX_ATTEMPTS: z.number().default(3),
  OTP_LENGTH: z.number().default(6),
  
  // Password requirements
  PASSWORD_MIN_LENGTH: z.number().default(8),
  PASSWORD_REQUIRE_UPPERCASE: z.boolean().default(true),
  PASSWORD_REQUIRE_LOWERCASE: z.boolean().default(true),
  PASSWORD_REQUIRE_NUMBERS: z.boolean().default(true),
  PASSWORD_REQUIRE_SYMBOLS: z.boolean().default(false),
  
  // Email service
  EMAIL_SERVICE: z.enum(['resend', 'sendgrid']).default('resend'),
  FROM_EMAIL: z.string().email(),
  FROM_NAME: z.string().default('NewCondo'),
  
  // Database
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  
  // External providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
  
  // Frontend URLs
  FRONTEND_URL: z.string().url(),
  RESET_PASSWORD_URL: z.string().url(),
  VERIFY_EMAIL_URL: z.string().url(),
  
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.number().default(3001),
});

export type AuthConfig = z.infer<typeof authConfigSchema>;

export const authConfig: AuthConfig = authConfigSchema.parse({
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
  
  SESSION_TIMEOUT: process.env.SESSION_TIMEOUT,
  MAX_SESSION_PER_USER: process.env.MAX_SESSION_PER_USER ? parseInt(process.env.MAX_SESSION_PER_USER) : undefined,
  
  MAX_LOGIN_ATTEMPTS: process.env.MAX_LOGIN_ATTEMPTS ? parseInt(process.env.MAX_LOGIN_ATTEMPTS) : undefined,
  LOCKOUT_DURATION: process.env.LOCKOUT_DURATION ? parseInt(process.env.LOCKOUT_DURATION) : undefined,
  LOCKOUT_INCREMENT_FACTOR: process.env.LOCKOUT_INCREMENT_FACTOR ? parseFloat(process.env.LOCKOUT_INCREMENT_FACTOR) : undefined,
  
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : undefined,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : undefined,
  
  OTP_EXPIRES_IN: process.env.OTP_EXPIRES_IN ? parseInt(process.env.OTP_EXPIRES_IN) : undefined,
  OTP_MAX_ATTEMPTS: process.env.OTP_MAX_ATTEMPTS ? parseInt(process.env.OTP_MAX_ATTEMPTS) : undefined,
  OTP_LENGTH: process.env.OTP_LENGTH ? parseInt(process.env.OTP_LENGTH) : undefined,
  
  PASSWORD_MIN_LENGTH: process.env.PASSWORD_MIN_LENGTH ? parseInt(process.env.PASSWORD_MIN_LENGTH) : undefined,
  PASSWORD_REQUIRE_UPPERCASE: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
  PASSWORD_REQUIRE_LOWERCASE: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
  PASSWORD_REQUIRE_NUMBERS: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
  PASSWORD_REQUIRE_SYMBOLS: process.env.PASSWORD_REQUIRE_SYMBOLS === 'true',
  
  EMAIL_SERVICE: process.env.EMAIL_SERVICE as 'resend' | 'sendgrid',
  FROM_EMAIL: process.env.FROM_EMAIL,
  FROM_NAME: process.env.FROM_NAME,
  
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
  
  FRONTEND_URL: process.env.FRONTEND_URL,
  RESET_PASSWORD_URL: process.env.RESET_PASSWORD_URL,
  VERIFY_EMAIL_URL: process.env.VERIFY_EMAIL_URL,
  
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  PORT: process.env.PORT ? parseInt(process.env.PORT) : undefined,
});

export default authConfig;