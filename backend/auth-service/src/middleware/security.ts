import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import crypto from "crypto";

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.newcondo.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Request ID middleware for tracking
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = crypto.randomUUID();
  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
};

// IP whitelist/blacklist middleware
const BLOCKED_IPS = new Set<string>();
const ALLOWED_IPS = new Set<string>(); // Empty means all IPs allowed

export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || "";

  // Check if IP is blocked
  if (BLOCKED_IPS.has(clientIP)) {
    return res.status(403).json({
      error: "Access denied",
      code: "IP_BLOCKED",
    });
  }

  // Check if IP whitelist is enabled and IP is not in whitelist
  if (ALLOWED_IPS.size > 0 && !ALLOWED_IPS.has(clientIP)) {
    return res.status(403).json({
      error: "Access denied",
      code: "IP_NOT_WHITELISTED",
    });
  }

  next();
};

// Suspicious activity detection
const SUSPICIOUS_PATTERNS = [
  /script/i,
  /javascript/i,
  /vbscript/i,
  /onload/i,
  /onerror/i,
  /<script/i,
  /eval\(/i,
  /expression\(/i,
];

export const suspiciousActivityDetector = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const checkPayload = (obj: any): boolean => {
    if (typeof obj === "string") {
      return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(obj));
    }

    if (typeof obj === "object" && obj !== null) {
      return Object.values(obj).some((value) => checkPayload(value));
    }

    return false;
  };

  // Check request body for suspicious content
  if (req.body && checkPayload(req.body)) {
    console.warn(`Suspicious activity detected from IP: ${req.ip}`, {
      body: req.body,
      headers: req.headers,
      url: req.url,
    });

    return res.status(400).json({
      error: "Invalid request content",
      code: "SUSPICIOUS_ACTIVITY",
    });
  }

  next();
};

// Device fingerprinting middleware
export const deviceFingerprint = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userAgent = req.headers["user-agent"] || "";
  const acceptLanguage = req.headers["accept-language"] || "";
  const acceptEncoding = req.headers["accept-encoding"] || "";

  // Create a simple device fingerprint
  const fingerprint = crypto
    .createHash("sha256")
    .update(`${userAgent}${acceptLanguage}${acceptEncoding}`)
    .digest("hex");

  req.deviceFingerprint = fingerprint;
  next();
};
