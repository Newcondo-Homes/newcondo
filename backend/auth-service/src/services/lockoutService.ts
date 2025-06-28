// backend/auth-service/src/services/lockoutService.ts
import { redis } from "../../../shared/src/config/redis";
import { prisma } from "@newcondo/db";
import {
  sendAccountLockedEmail,
  sendAccountUnlockedEmail,
} from "../../../shared/src/utils/email";

interface LockoutData {
  attempts: number;
  lockedUntil?: Date;
  lastAttempt: Date;
}

export const lockoutService = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
  ATTEMPT_WINDOW: 15 * 60 * 1000, // 15 minutes window

  async recordFailedAttempt(
    identifier: string,
    ipAddress?: string
  ): Promise<{
    locked: boolean;
    remainingAttempts: number;
    lockedUntil?: Date;
  }> {
    try {
      const key = `lockout:${identifier}`;
      const lockoutData = await this.getLockoutData(identifier);

      // Reset attempts if last attempt was outside the window
      const now = new Date();
      const shouldReset =
        lockoutData.lastAttempt &&
        now.getTime() - lockoutData.lastAttempt.getTime() > this.ATTEMPT_WINDOW;

      const attempts = shouldReset ? 1 : (lockoutData.attempts || 0) + 1;
      const newLockoutData: LockoutData = {
        attempts,
        lastAttempt: now,
      };

      // Check if account should be locked
      if (attempts >= this.MAX_ATTEMPTS) {
        const lockedUntil = new Date(now.getTime() + this.LOCKOUT_DURATION);
        newLockoutData.lockedUntil = lockedUntil;

        // Log security event
        await this.logSecurityEvent(identifier, "ACCOUNT_LOCKED", {
          attempts,
          ipAddress,
          lockedUntil,
        });

        // Notify user via email
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { phone: identifier }],
          },
        });

        if (user && user.email) {
          await sendAccountLockedEmail({
            to: user.email,
            name: user.name || "User",
            lockedUntil,
            unlockTime: this.formatUnlockTime(lockedUntil),
          });
        }
      }

      // Store in Redis
      await redis.setex(
        key,
        Math.ceil(this.LOCKOUT_DURATION / 1000),
        JSON.stringify(newLockoutData)
      );

      return {
        locked:
          !!newLockoutData.lockedUntil && newLockoutData.lockedUntil > now,
        remainingAttempts: Math.max(0, this.MAX_ATTEMPTS - attempts),
        lockedUntil: newLockoutData.lockedUntil,
      };
    } catch (error) {
      console.error("Failed attempt recording error:", error);
      throw error;
    }
  },

  async isAccountLocked(
    identifier: string
  ): Promise<{
    locked: boolean;
    lockedUntil?: Date;
    remainingAttempts: number;
  }> {
    try {
      const lockoutData = await this.getLockoutData(identifier);
      const now = new Date();

      if (lockoutData.lockedUntil && lockoutData.lockedUntil > now) {
        return {
          locked: true,
          lockedUntil: lockoutData.lockedUntil,
          remainingAttempts: 0,
        };
      }

      return {
        locked: false,
        remainingAttempts: Math.max(
          0,
          this.MAX_ATTEMPTS - (lockoutData.attempts || 0)
        ),
      };
    } catch (error) {
      console.error("Account lock check error:", error);
      return { locked: false, remainingAttempts: this.MAX_ATTEMPTS };
    }
  },

  async clearFailedAttempts(identifier: string) {
    try {
      const key = `lockout:${identifier}`;
      await redis.del(key);
      return true;
    } catch (error) {
      console.error("Clear failed attempts error:", error);
      return false;
    }
  },

  async unlockAccount(identifier: string, adminId?: string) {
    try {
      const key = `lockout:${identifier}`;
      await redis.del(key);

      // Log unlock event
      await this.logSecurityEvent(identifier, "ACCOUNT_UNLOCKED", {
        unlockedBy: adminId || "SYSTEM",
        unlockedAt: new Date(),
      });

      // Notify user
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { phone: identifier }],
        },
      });

      if (user && user.email) {
        await sendAccountUnlockedEmail({
          to: user.email,
          name: user.name || "User",
          unlockedBy: adminId ? "administrator" : "automatic",
        });
      }

      return true;
    } catch (error) {
      console.error("Account unlock error:", error);
      return false;
    }
  },

  async getLockoutData(identifier: string): Promise<LockoutData> {
    try {
      const key = `lockout:${identifier}`;
      const data = await redis.get(key);

      if (data) {
        const parsed = JSON.parse(data);
        return {
          attempts: parsed.attempts || 0,
          lockedUntil: parsed.lockedUntil
            ? new Date(parsed.lockedUntil)
            : undefined,
          lastAttempt: parsed.lastAttempt
            ? new Date(parsed.lastAttempt)
            : new Date(),
        };
      }

      return { attempts: 0, lastAttempt: new Date() };
    } catch (error) {
      console.error("Get lockout data error:", error);
      return { attempts: 0, lastAttempt: new Date() };
    }
  },

  async logSecurityEvent(identifier: string, event: string, metadata: any) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { phone: identifier }],
        },
      });

      if (user) {
        await prisma.eventLog.create({
          data: {
            userId: user.id,
            type: event,
            metadata,
            timestamp: new Date(),
          },
        });
      }
    } catch (error) {
      console.error("Security event logging error:", error);
    }
  },

  formatUnlockTime(lockedUntil: Date): string {
    const minutes = Math.ceil(
      (lockedUntil.getTime() - Date.now()) / (1000 * 60)
    );
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  },
};
