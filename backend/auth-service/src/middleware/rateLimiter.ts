import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General auth rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit?.resetTime ? (req.rateLimit.resetTime - Date.now()) / 1000 : 900)
    });
  }
});

// OTP rate limiter - more restrictive
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // limit each IP to 3 OTP requests per windowMs
  message: {
    error: 'Too many OTP requests, please try again later',
    code: 'OTP_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many OTP requests, please try again later',
      code: 'OTP_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit?.resetTime ? (req.rateLimit.resetTime - Date.now()) / 1000 : 600)
    });
  }
});

// Login rate limiter - account lockout focused
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed login attempts
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req: Request) => {
    // Use email/phone as key instead of IP for account-specific limiting
    return req.body.email || req.body.phone || req.ip;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Account temporarily locked due to too many failed login attempts',
      code: 'ACCOUNT_LOCKED',
      retryAfter: Math.round(req.rateLimit?.resetTime ? (req.rateLimit.resetTime - Date.now()) / 1000 : 900)
    });
  }
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    error: 'Too many password reset attempts, please try again later',
    code: 'PASSWORD_RESET_RATE_LIMIT'
  },
  keyGenerator: (req: Request) => {
    return req.body.email || req.ip;
  }
});

// Registration rate limiter
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour per IP
  message: {
    error: 'Too many registration attempts, please try again later',
    code: 'REGISTRATION_RATE_LIMIT'
  }
});