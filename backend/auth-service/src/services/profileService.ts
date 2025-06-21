import { PrismaClient } from '@newcondo/db';
import bcrypt from 'bcrypt';
import { otpService } from './otpService';

const prisma = new PrismaClient();

class ProfileService {
  async getUserProfile(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          emailVerified: true,
          phoneVerified: true,
          image: true,
          role: true,
          verificationStatus: true,
          dateOfBirth: true,
          address: true,
          city: true,
          state: true,
          country: true,
          isPremium: true,
          premiumExpiresAt: true,
          referralCode: true,
          isAvailableForMarking: true,
          agentServiceAreas: true,
          agentReliabilityScore: true,
          totalMarkingJobs: true,
          completedMarkingJobs: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updateData: any) {
    try {
      // Remove sensitive fields that shouldn't be updated directly
      const {
        id,
        email,
        phone,
        passwordHash,
        emailVerified,
        phoneVerified,
        verificationStatus,
        createdAt,
        updatedAt,
        ...allowedFields
      } = updateData;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...allowedFields,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          emailVerified: true,
          phoneVerified: true,
          image: true,
          role: true,
          verificationStatus: true,
          dateOfBirth: true,
          address: true,
          city: true,
          state: true,
          country: true,
          isPremium: true,
          premiumExpiresAt: true,
          referralCode: true,
          isAvailableForMarking: true,
          agentServiceAreas: true,
          agentReliabilityScore: true,
          totalMarkingJobs: true,
          completedMarkingJobs: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Log the profile update
      await this.logActivity(userId, 'PROFILE_UPDATED', {
        updatedFields: Object.keys(allowedFields),
      });

      return updatedUser;
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      // Get user's current password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!user || !user.passwordHash) {
        return { success: false, message: 'User not found or no password set' };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        },
      });

      // Log the password update
      await this.logActivity(userId, 'PASSWORD_UPDATED', {});

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  async updateEmail(userId: string, newEmail: string, otpCode: string) {
    try {
      // Verify OTP for new email
      const isOtpValid = await otpService.verifyOTP(newEmail, otpCode, 'EMAIL_VERIFICATION');
      if (!isOtpValid) {
        return { success: false, message: 'Invalid or expired OTP code' };
      }

      // Check if email is already in use
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail },
      });

      if (existingUser && existingUser.id !== userId) {
        return { success: false, message: 'Email is already in use' };
      }

      // Update email
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          email: newEmail,
          emailVerified: new Date(),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          emailVerified: true,
        },
      });

      // Log the email update
      await this.logActivity(userId, 'EMAIL_UPDATED', { newEmail });

      return { success: true, message: 'Email updated successfully', data: updatedUser };
    } catch (error) {
      console.error('Update email error:', error);
      throw error;
    }
  }

  async updatePhone(userId: string, newPhone: string, otpCode: string) {
    try {
      // Verify OTP for new phone
      const isOtpValid = await otpService.verifyOTP(newPhone, otpCode, 'PHONE_VERIFICATION');
      if (!isOtpValid) {
        return { success: false, message: 'Invalid or expired OTP code' };
      }

      // Check if phone is already in use
      const existingUser = await prisma.user.findUnique({
        where: { phone: newPhone },
      });

      if (existingUser && existingUser.id !== userId) {
        return { success: false, message: 'Phone number is already in use' };
      }

      // Update phone
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          phone: newPhone,
          phoneVerified: new Date(),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          phone: true,
          phoneVerified: true,
        },
      });

      // Log the phone update
      await this.logActivity(userId, 'PHONE_UPDATED', { newPhone });

      return { success: true, message: 'Phone updated successfully', data: updatedUser };
    } catch (error) {
      console.error('Update phone error:', error);
      throw error;
    }
  }

  async getUserActivity(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const activities = await prisma.eventLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          metadata: true,
          timestamp: true,
          ipAddress: true,
          userAgent: true,
        },
      });

      const totalCount = await prisma.eventLog.count({
        where: { userId },
      });

      return {
        activities,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error('Get user activity error:', error);
      throw error;
    }
  }

  async deleteAccount(userId: string, password: string) {
    try {
      // Get user's password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!user || !user.passwordHash) {
        return { success: false, message: 'User not found or no password set' };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return { success: false, message: 'Password is incorrect' };
      }

      // Log the account deletion before deleting
      await this.logActivity(userId, 'ACCOUNT_DELETED', {});

      // Delete user account (this will cascade delete related records)
      await prisma.user.delete({
        where: { id: userId },
      });

      return { success: true, message: 'Account deleted successfully' };
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }

  private async logActivity(userId: string, type: string, metadata: any) {
    try {
      await prisma.eventLog.create({
        data: {
          userId,
          type,
          metadata,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Log activity error:', error);
      // Don't throw error for logging failures
    }
  }
}

export const profileService = new ProfileService();