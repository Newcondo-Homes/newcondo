// src/config/environment.ts
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();


// Environment validation schema
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number).default("5000"),

  // CORS configuration
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:5173,http://localhost:4000")
    .transform((val) => val.split(",").map((origin) => origin.trim())),

  // Subscription billing — "charge" is required for renewals to collect.
  RENEWAL_MODE: z.enum(["detect", "charge"]).default("detect"),
  
  // Database configuration
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  REDIS_URL: z.string().optional(),

  // JWT configuration
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT refresh secret must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Email configuration
  RESEND_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default("noreply@newcondo.com"),

  // mailgun
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),
  MAILGUN_URL: z.string().default("https://api.mailgun.net"),

  // SMS configuration
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TERMII_API_KEY: z.string().optional(),

  // File upload configuration
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // Payment configuration
  FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_ENCRYPTION_KEY: z.string().optional(),
  FLUTTERWAVE_BASE_URL: z
    .string()
    .default("https://api.flutterwave.com/v3"),
  FLUTTERWAVE_WEBHOOK_SECRET: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),

  FRONTEND_URL: z.string().default("http://localhost:3000"),
  WEBHOOK_URL: z.string().default("http://localhost:5000"),

  // Google Maps configuration
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // OAuth configuration
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("900000"), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default("1000"),

  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // Feature flags
  ENABLE_EMAIL_VERIFICATION: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  ENABLE_SMS_VERIFICATION: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  ENABLE_PROPERTY_BOUNDARIES: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  ENABLE_DUPLICATE_DETECTION: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  ENABLE_MARKING_SERVICE: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  ENABLE_VIRTUAL_ACCOUNTS: z
    .string()
    .transform((val) => val === "true")
    .default("true"),

  // External service URLs (for development)
  AUTH_SERVICE_URL: z.string().optional(),
  PROPERTY_SERVICE_URL: z.string().optional(),
  PAYMENT_SERVICE_URL: z.string().optional(),
  BOOKING_SERVICE_URL: z.string().optional(),
  MARKING_SERVICE_URL: z.string().optional(),
  ADMIN_SERVICE_URL: z.string().optional(),
  REFERRAL_SERVICE_URL: z.string().optional(),
  NOTIFICATION_SERVICE_URL: z.string().optional(),
  ANALYTICS_SERVICE_URL: z.string().optional(),
});


function assertProductionVars(
  cfg: z.infer<typeof envSchema>
): void {
  if (cfg.NODE_ENV !== "production") return;

  const required: Array<[keyof typeof cfg, string]> = [
    ["MAILGUN_API_KEY", "MAILGUN_API_KEY is required in production"],
    ["MAILGUN_DOMAIN", "MAILGUN_DOMAIN is required in production"],
    ["REDIS_URL", "REDIS_URL is required in production (sessions and OTP storage)"],
  ];

  const missing = required
    .filter(([key]) => !cfg[key])
    .map(([, msg]) => msg);

  if (missing.length > 0) {
    throw new Error(
      `Production environment check failed:\n${missing.join("\n")}`
    );
  }
}

// Validate environment variables
const validateEnv = () => {
  try {
    const parsed = envSchema.parse(process.env);
    assertProductionVars(parsed);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      ).join("\n");
      throw new Error(
        `Environment validation failed:\n${missingVars}`
      );
    }
    throw error;
  }
};

// Export the validated configuration
export const config = validateEnv();

// Use these in code instead of checking NODE_ENV strings directly

export const isProduction = config.NODE_ENV === "production";
export const isDevelopment = config.NODE_ENV === "development";
export const isTest = config.NODE_ENV === "test";