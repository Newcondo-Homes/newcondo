// backend/auth-service/src/services/passwordResetService.ts
import { prisma } from '@newcondo/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { emailService } from '../../../shared/src/utils/email';

// const prisma = new prisma();

export const passwordResetService = {
  async requestPasswordReset(email: string) {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal if user exists
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token in database (you might want to create a separate table for this)
      // For now, we'll use the OTPCode model with a special type
      await prisma.oTPCode.upsert({
        where: {
          identifier_type: {
            identifier: email,
            type: 'PASSWORD_RESET'
          }
        },
        create: {
          identifier: email,
          code: resetToken,
          type: 'PASSWORD_RESET',
          expiresAt: resetTokenExpiry,
          attempts: 0,
          maxAttempts: 1, // Only one reset attempt per token
          verified: false
        },
        update: {
          code: resetToken,
          expiresAt: resetTokenExpiry,
          attempts: 0,
          verified: false
        }
      });

      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      await emailService.sendPasswordResetEmail({
        to: email,
        name: user.name || 'User',
        resetUrl
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  },

  async verifyResetToken(token: string): Promise<boolean> {
    try {
      const resetRecord = await prisma.oTPCode.findFirst({
        where: {
          code: token,
          type: 'PASSWORD_RESET',
          verified: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      return !!resetRecord;
    } catch (error) {
      console.error('Reset token verification error:', error);
      return false;
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Verify token again
      const resetRecord = await prisma.oTPCode.findFirst({
        where: {
          code: token,
          type: 'PASSWORD_RESET',
          verified: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!resetRecord) {
        return {
          success: false,
          message: 'Invalid or expired reset token'
        };
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: resetRecord.identifier }
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password and mark token as used
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: hashedPassword }
        }),
        prisma.oTPCode.update({
          where: { id: resetRecord.id },
          data: { verified: true }
        })
      ]);

      // Send confirmation email
      await emailService.sendPasswordChangeConfirmation({
        to: user.email,
        name: user.name || 'User'
      });

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: 'An error occurred while resetting your password'
      };
    }
  }
};