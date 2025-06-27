// backend/auth-service/src/services/sessionService.ts
import { prisma } from '@newcondo/db';
import { redis } from '../../../shared/src/config/redis';

// const prisma = new PrismaClient();

interface SessionData {
  userId: string;
  role: string;
  email: string;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  expires?: Date;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

export const sessionService = {
  async createSession(sessionToken: string, sessionData: SessionData) {
    try {
      // Store session in Redis for fast access
      await redis.setex(
        `session:${sessionToken}`,
        86400, // 24 hours
        JSON.stringify(sessionData)
      );

      // Also store in database for persistence
      await prisma.session.create({
        data: {
          sessionToken,
          userId: sessionData.userId,
          expires: new Date(Date.now() + 86400000) // 24 hours
        }
      });

      return true;
    } catch (error) {
      console.error('Session creation error:', error);
      return false;
    }
  },

  async getSession(sessionToken: string): Promise<SessionData | null> {
    try {
      // Try Redis first
      const redisSession = await redis.get(`session:${sessionToken}`);
      if (redisSession) {
        return JSON.parse(redisSession);
      }

      // Fallback to database
      const dbSession = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true }
      });

      if (!dbSession || dbSession.expires < new Date()) {
        return null;
      }

      const sessionData: SessionData = {
        userId: dbSession.userId,
        role: dbSession.user.role,
        email: dbSession.user.email,
        lastActivity: new Date(),
        expires: dbSession.expires
      };

      // Restore to Redis
      await redis.setex(
        `session:${sessionToken}`,
        86400,
        JSON.stringify(sessionData)
      );

      return sessionData;
    } catch (error) {
      console.error('Session retrieval error:', error);
      return null;
    }
  },

  async updateSession(sessionId: string, updateData: { expires: Date }) {
    try {
      // Update database session
      await prisma.session.update({
        where: { sessionToken: sessionId },
        data: updateData
      });

      // Update Redis if session exists there
      const sessionData = await redis.get(`session:${sessionId}`);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        // Calculate new TTL based on the expires date
        const ttl = Math.floor((updateData.expires.getTime() - Date.now()) / 1000);
        if (ttl > 0) {
          await redis.setex(`session:${sessionId}`, ttl, JSON.stringify(parsed));
        }
      }

      return true;
    } catch (error) {
      console.error('Session update error:', error);
      return false;
    }
  },

  async updateSessionActivity(sessionToken: string) {
    try {
      const session = await this.getSession(sessionToken);
      if (!session) return false;

      session.lastActivity = new Date();

      await redis.setex(
        `session:${sessionToken}`,
        86400,
        JSON.stringify(session)
      );

      return true;
    } catch (error) {
      console.error('Session update error:', error);
      return false;
    }
  },

  async deleteSession(sessionToken: string) {
    try {
      // Remove from Redis
      await redis.del(`session:${sessionToken}`);

      // Remove from database
      await prisma.session.delete({
        where: { sessionToken }
      });

      return true;
    } catch (error) {
      console.error('Session deletion error:', error);
      return false;
    }
  },

  async deleteAllUserSessions(userId: string) {
    try {
      // Get all user sessions from database
      const userSessions = await prisma.session.findMany({
        where: { userId }
      });

      // Remove from Redis
      if (userSessions.length > 0) {
        const redisKeys = userSessions.map(s => `session:${s.sessionToken}`);
        await redis.del(...redisKeys);
      }

      // Remove from database
      await prisma.session.deleteMany({
        where: { userId }
      });

      return true;
    } catch (error) {
      console.error('All sessions deletion error:', error);
      return false;
    }
  },

   async revokeUserSessions(userId: string) {
    try {
      return await this.deleteAllUserSessions(userId);
    } catch (error) {
      console.error('Session revocation error:', error);
      return false;
    }
  },

  async cleanupExpiredSessions() {
    try {
      // Clean up expired sessions from database
      await prisma.session.deleteMany({
        where: {
          expires: {
            lt: new Date()
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Session cleanup error:', error);
      return false;
    }
  }
};