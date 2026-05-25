import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

// Import shared middleware
// import { logger, requestLogger } from "./utils/logger";
import { logger } from "./utils/logger";

// Import combined app middleware
import { healthCheck } from "./middleware/healthCheck";
import { errorHandler } from "./middleware/errorHandler";


// Import main router
import { mainRouter } from "./routes/index";

// Import configuration
import { config } from "./config/environment";

// Create Express app
const app: Express = express();

// Trust proxy for deployment platforms like Render
// app.set("trust proxy", 1);

const corsOriginValue = config.CORS_ORIGINS.includes("*")
  ? "*"
  : config.CORS_ORIGINS;

if (corsOriginValue === "*") {
  console.log("Cors is set to wild card");
} else {
  console.log("Cors is defined", corsOriginValue);
}
// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: config.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: corsOriginValue,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Rate limiting (more lenient for free tier)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.NODE_ENV === "production" ? 1000 : 10000, // requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Request logging middleware
// app.use(requestLogger);

// Health check endpoint (must be before rate limiting for monitoring)
app.get("/health", healthCheck);

// API versioning and main routes
app.use("/api/v1", mainRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NewCondo Combined Backend API",
    version: "1.0.0",
    environment: config.NODE_ENV,
    endpoints: {
      health: "/health",
      auth: "/api/v1/auth",
      properties: "/api/v1/properties",
      payments: "/api/v1/payments",
      bookings: "/api/v1/bookings",
      marking: "/api/v1/marking",
      admin: "/api/v1/admin",
      referrals: "/api/v1/referrals",
      notifications: "/api/v1/notifications",
      analytics: "/api/v1/analytics",
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    code: "NOT_FOUND",
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
app.use(errorHandler);

// Log startup
logger.info("✅ Combined NewCondo Backend initialized successfully");

// export { app };
export default app;
