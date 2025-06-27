import { Role } from "@newcondo/db";
import { RateLimitInfo } from "express-rate-limit";

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        name?: string | null;
        emailVerified?: boolean;
        phoneVerified?: boolean;
        verificationStatus?: string;
        iat?: number;
        exp?: number;
      };
      rateLimit?: RateLimitInfo;
      sessionId?: string;
      deviceFingerprint?: string;
    }
  }
}

// Export empty object to make this a module
export {};
