// backend/gateway/src/config/index.ts
import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number).default(3000),

  // JWT Configuration
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),

  // Redis Configuration
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // Service URLs
  AUTH_SERVICE_URL: z.string().default("http://localhost:3001"),
  PROPERTY_SERVICE_URL: z.string().default("http://localhost:3002"),
  PAYMENT_SERVICE_URL: z.string().default("http://localhost:3003"),
  BOOKING_SERVICE_URL: z.string().default("http://localhost:3004"),
  ADMIN_SERVICE_URL: z.string().default("http://localhost:3005"),
  MARKING_SERVICE_URL: z.string().default("http://localhost:3006"),
  REFERRAL_SERVICE_URL: z.string().default("http://localhost:3007"),
  NOTIFICATION_SERVICE_URL: z.string().default("http://localhost:3008"),
  ANALYTICS_SERVICE_URL: z.string().default("http://localhost:3009"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),

  // Health Check
  HEALTH_CHECK_INTERVAL: z.string().transform(Number).default(30000), // 30 seconds
  HEALTH_CHECK_TIMEOUT: z.string().transform(Number).default(5000), // 5 seconds

  // Load Balancer
  ENABLE_LOAD_BALANCER: z
    .string()
    .transform((val) => val === "true")
    .default(false),
  CIRCUIT_BREAKER_THRESHOLD: z.string().transform(Number).default(5),
  CIRCUIT_BREAKER_TIMEOUT: z.string().transform(Number).default(60000), // 1 minute
});

export type Config = z.infer<typeof configSchema>;

export const config: Config = configSchema.parse(process.env);

export const serviceConfig = {
  services: {
    auth: {
      name: "auth-service",
      url: config.AUTH_SERVICE_URL,
      healthPath: "/health",
      timeout: 5000,
    },
    property: {
      name: "property-service",
      url: config.PROPERTY_SERVICE_URL,
      healthPath: "/health",
      timeout: 10000,
    },
    payment: {
      name: "payment-service",
      url: config.PAYMENT_SERVICE_URL,
      healthPath: "/health",
      timeout: 15000,
    },
    booking: {
      name: "booking-service",
      url: config.BOOKING_SERVICE_URL,
      healthPath: "/health",
      timeout: 8000,
    },
    admin: {
      name: "admin-service",
      url: config.ADMIN_SERVICE_URL,
      healthPath: "/health",
      timeout: 5000,
    },
    marking: {
      name: "marking-service",
      url: config.MARKING_SERVICE_URL,
      healthPath: "/health",
      timeout: 8000,
    },
    referral: {
      name: "referral-service",
      url: config.REFERRAL_SERVICE_URL,
      healthPath: "/health",
      timeout: 5000,
    },
    notification: {
      name: "notification-service",
      url: config.NOTIFICATION_SERVICE_URL,
      healthPath: "/health",
      timeout: 8000,
    },
    analytics: {
      name: "analytics-service",
      url: config.ANALYTICS_SERVICE_URL,
      healthPath: "/health",
      timeout: 10000,
    },
  },
  routes: {
    "/api/auth": "auth",
    "/api/properties": "property",
    "/api/payments": "payment",
    "/api/bookings": "booking",
    "/api/admin": "admin",
    "/api/marking": "marking",
    "/api/referrals": "referral",
    "/api/notifications": "notification",
    "/api/analytics": "analytics",
  },
} as const;
