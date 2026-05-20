import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { errorHandler } from "@newcondo/backend-shared";
import { authRoutes } from "./routes/auth";
import { otpRoutes } from "./routes/otp";
import profileRoutes from "./routes/profile";

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Stricter rate limiting for auth endpoints
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 auth requests per windowMs
//   message: "Too many authentication attempts, please try again later",
// })

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan("combined"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);

//auth routes with strict rate limiting
// app.use("/api/auth", authLimiter, authRoutes)
// app.use("/api/otp", authLimiter, otpRoutes)

app.use("/api/profile", profileRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "auth-service" });
});

// Error handling
app.use(errorHandler);

export default app;
