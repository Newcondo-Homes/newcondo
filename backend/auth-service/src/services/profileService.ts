import { prisma } from "@newcondo/db";
import bcrypt from "bcryptjs";
import { otpService } from "./otpService";
import sharp from "sharp";
import { createUploadthing, type FileRouter } from "uploadthing/server";
import { UploadThingError, UTApi } from "uploadthing/server";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import {
  GetUserActivityResponse,
  // UserProfile,
  UpdateUserProfileData,
} from "../types/profile";

import {
  serializeUserProfile,
  SerializableUserProfile,
} from "../utils/profileUtils";

interface OptimizedImageResult {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  size: number;
}

const utapi = new UTApi();

class ProfileService {
  /**
   * Optimize image to reduce size and ensure it's under 1MB
   */
  private async optimizeImage(
    file: Express.Multer.File,
    maxSizeBytes: number = 1024 * 1024 // 1MB
  ): Promise<OptimizedImageResult> {
    try {
      const originalBuffer = file.buffer;
      let quality = 90;
      let optimizedBuffer: Buffer;
      let currentSize: number;

      // Get image metadata
      const metadata = await sharp(originalBuffer).metadata();
      const { width, height } = metadata;

      // Calculate optimal dimensions (max 1200px on longest side)
      const maxDimension = 1200;
      let newWidth = width || maxDimension;
      let newHeight = height || maxDimension;

      if (newWidth > maxDimension || newHeight > maxDimension) {
        const aspectRatio = newWidth / newHeight;
        if (newWidth > newHeight) {
          newWidth = maxDimension;
          newHeight = Math.round(maxDimension / aspectRatio);
        } else {
          newHeight = maxDimension;
          newWidth = Math.round(maxDimension * aspectRatio);
        }
      }

      // Start optimization process
      do {
        optimizedBuffer = await sharp(originalBuffer)
          .resize(newWidth, newHeight, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({
            quality,
            progressive: true,
            mozjpeg: true,
          })
          .toBuffer();

        currentSize = optimizedBuffer.length;

        // If still too large, reduce quality or dimensions
        if (currentSize > maxSizeBytes && quality > 30) {
          quality -= 10;
        } else if (currentSize > maxSizeBytes && quality <= 30) {
          // Reduce dimensions further
          newWidth = Math.round(newWidth * 0.9);
          newHeight = Math.round(newHeight * 0.9);
          quality = 80; // Reset quality
        }
      } while (
        currentSize > maxSizeBytes &&
        (quality > 20 || (newWidth > 200 && newHeight > 200))
      );

      // Generate optimized filename
      const fileExtension = ".jpg"; // Always convert to JPEG for optimization
      const originalName = path.parse(file.originalname).name;
      const optimizedFilename = `${originalName}_${uuidv4()}${fileExtension}`;

      return {
        buffer: optimizedBuffer,
        filename: optimizedFilename,
        mimetype: "image/jpeg",
        size: currentSize,
      };
    } catch (error) {
      console.error("Image optimization error:", error);
      throw new Error("Failed to optimize image");
    }
  }

  /**
   * Upload image to UploadThing
   */
  private async uploadToUploadThing(
    optimizedImage: OptimizedImageResult,
    userId: string
  ): Promise<string> {
    try {
      // Create a temporary file for UploadThing
      const tempDir = path.join(process.cwd(), "temp");
      await fs.mkdir(tempDir, { recursive: true });

      const tempFilePath = path.join(tempDir, optimizedImage.filename);
      await fs.writeFile(tempFilePath, optimizedImage.buffer);

      // Create file object for UploadThing
      const fileForUpload = new File(
        [optimizedImage.buffer],
        optimizedImage.filename,
        { type: optimizedImage.mimetype }
      );

      // Upload to UploadThing
      // const uploadResult = await utapi.uploadFiles([fileForUpload], {
      //   metadata: {
      //     userId,
      //     type: "profile_image",
      //     originalSize: optimizedImage.size.toString(),
      //   },
      // });
      const uploadResult = await utapi.uploadFiles([fileForUpload]);

      // TODO: store details of file uploaded by a user in the database
      // uncomment the code below, and begin working on 'this.storeFileMetadata(uploadResult[0].data.key)

      // Store metadata separately if needed (in your database)
      // You can create a separate method to store file metadata:
      // await this.storeFileMetadata(uploadResult[0].data.key, {
      //   userId,
      //   type: "profile_image",
      //   originalSize: optimizedImage.size.toString(),
      // });

      // Clean up temp file
      await fs.unlink(tempFilePath).catch(() => { }); // Ignore cleanup errors

      if (!uploadResult[0]?.data?.url) {
        throw new Error("Upload failed - no URL returned");
      }

      return uploadResult[0].data.url;
    } catch (error) {
      console.error("UploadThing upload error:", error);
      throw new Error("Failed to upload image to storage");
    }
  }


  /**
   * Upload and optimize profile image
   */
  async uploadProfileImage(
    file: Express.Multer.File,
    userId: string
  ): Promise<string> {
    try {
      // Validate file type
      const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(
          "Invalid file type. Only JPEG, PNG, and WebP are allowed."
        );
      }

      // Validate file size (10MB max before optimization)
      const maxUploadSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxUploadSize) {
        throw new Error("File too large. Maximum size is 10MB.");
      }

      // Get current user to check for existing image
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { image: true },
      });

      // Optimize image
      const optimizedImage = await this.optimizeImage(file);

      console.log(
        `Image optimized: ${file.size} bytes -> ${optimizedImage.size} bytes`
      );

      // Upload optimized image
      const imageUrl = await this.uploadToUploadThing(optimizedImage, userId);

      // Delete old image if exists
      if (user?.image) {
        await this.deleteProfileImage(user.image).catch((error) => {
          console.warn("Failed to delete old profile image:", error);
        });
      }

      return imageUrl;
    } catch (error) {
      console.error("Profile image upload error:", error);
      throw error;
    }
  }

  /**
   * Delete profile image from UploadThing
   */
  async deleteProfileImage(imageUrl: string): Promise<void> {
    try {
      // Extract file key from URL
      const fileKey = this.extractFileKeyFromUrl(imageUrl);
      if (!fileKey) {
        console.warn("Could not extract file key from URL:", imageUrl);
        return;
      }

      await utapi.deleteFiles([fileKey]);
    } catch (error) {
      console.error("Delete profile image error:", error);
      throw new Error("Failed to delete profile image");
    }
  }

  /**
   * Extract file key from UploadThing URL
   */
  private extractFileKeyFromUrl(url: string): string | null {
    try {
      // UploadThing URLs typically follow this pattern:
      // https://uploadthing-prod.s3.us-west-2.amazonaws.com/file-key
      const urlParts = url.split("/");
      return urlParts[urlParts.length - 1] || null;
    } catch (error) {
      console.error("Error extracting file key:", error);
      return null;
    }
  }

  /**
   * Check image upload limits for user
   */
  async checkUploadLimits(userId: string): Promise<{
    canUpload: boolean;
    reason?: string;
    remainingUploads?: number;
  }> {
    try {
      // Get user's upload count for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayUploads = await prisma.eventLog.count({
        where: {
          userId,
          type: "PROFILE_IMAGE_UPDATED",
          timestamp: {
            gte: today,
          },
        },
      });

      const maxUploadsPerDay = 5; // Configure as needed

      if (todayUploads >= maxUploadsPerDay) {
        return {
          canUpload: false,
          reason: "Daily upload limit exceeded",
          remainingUploads: 0,
        };
      }

      return {
        canUpload: true,
        remainingUploads: maxUploadsPerDay - todayUploads,
      };
    } catch (error) {
      console.error("Check upload limits error:", error);
      return {
        canUpload: false,
        reason: "Unable to verify upload limits",
      };
    }
  }

  async getUserProfile(
    userId: string
  ): Promise<SerializableUserProfile | null> {
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

      return user ? serializeUserProfile(user) : null;
    } catch (error) {
      console.error("Get user profile error:", error);
      throw error;
    }
  }

  async updateUserProfile(
    userId: string,
    updateData: UpdateUserProfileData
  ): Promise<SerializableUserProfile> {
    try {
      // Remove sensitive fields that shouldn't be updated directly

      // Defensive approach: explicitly allow only certain fields
      // This protects against any additional fields that might be passed
      const allowedFieldNames = [
        "name",
        "image",
        "dateOfBirth",
        "address",
        "city",
        "state",
        "country",
        "isAvailableForMarking",
        "agentServiceAreas",
      ];

      const allowedFields = Object.fromEntries(
        Object.entries(updateData).filter(
          ([key, value]) =>
            allowedFieldNames.includes(key) && value !== undefined
        )
      );
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
      await this.logActivity(userId, "PROFILE_UPDATED", {
        updatedFields: Object.keys(allowedFields),
      });

      return serializeUserProfile(updatedUser);
      // return updatedUser;
    } catch (error) {
      console.error("Update user profile error:", error);
      throw error;
    }
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    try {
      // Get user's current password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!user || !user.passwordHash) {
        return { success: false, message: "User not found or no password set" };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );
      if (!isCurrentPasswordValid) {
        return { success: false, message: "Current password is incorrect" };
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
      await this.logActivity(userId, "PASSWORD_UPDATED", {});

      return { success: true, message: "Password updated successfully" };
    } catch (error) {
      console.error("Update password error:", error);
      throw error;
    }
  }

  async updateEmail(userId: string, newEmail: string, otpCode: string, password?: string) {
    try {
      const auth = await this.verifyPasswordOrSocial(userId, password);
      if (!auth.ok) return { success: false, message: auth.message };

      // Verify OTP for new email
      const isOtpValid = await otpService.verifyOTP(
        newEmail,
        otpCode,
        "EMAIL_VERIFICATION"
      );
      if (!isOtpValid) {
        return { success: false, message: "Invalid or expired OTP code" };
      }

      // Check if email is already in use
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail },
      });

      if (existingUser && existingUser.id !== userId) {
        return { success: false, message: "Email is already in use" };
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
      await this.logActivity(userId, "EMAIL_UPDATED", { newEmail });

      return {
        success: true,
        message: "Email updated successfully",
        data: updatedUser,
      };
    } catch (error) {
      console.error("Update email error:", error);
      throw error;
    }
  }

  async updatePhone(userId: string, newPhone: string, otpCode: string, password?: string) {
    try {
      const auth = await this.verifyPasswordOrSocial(userId, password);
      if (!auth.ok) return { success: false, message: auth.message };

      // Verify OTP for new phone
      const isOtpValid = await otpService.verifyOTP(
        newPhone,
        otpCode,
        "PHONE_VERIFICATION"
      );
      if (!isOtpValid) {
        return { success: false, message: "Invalid or expired OTP code" };
      }

      // Check if phone is already in use
      const existingUser = await prisma.user.findUnique({
        where: { phone: newPhone },
      });

      if (existingUser && existingUser.id !== userId) {
        return { success: false, message: "Phone number is already in use" };
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
      await this.logActivity(userId, "PHONE_UPDATED", { newPhone });

      return {
        success: true,
        message: "Phone updated successfully",
        data: updatedUser,
      };
    } catch (error) {
      console.error("Update phone error:", error);
      throw error;
    }
  }

  async getUserActivity(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<GetUserActivityResponse> {
    try {
      const skip = (page - 1) * limit;

      const rawActivities = await prisma.eventLog.findMany({
        where: { userId },
        orderBy: { timestamp: "desc" },
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

      // Transform the raw activities to match our interface
      const activities = rawActivities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        metadata: activity.metadata as Record<string, any> | null,
        timestamp: activity.timestamp,
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
      }));

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
      console.error("Get user activity error:", error);
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
        return { success: false, message: "User not found or no password set" };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return { success: false, message: "Password is incorrect" };
      }

      // Log the account deletion before deleting
      await this.logActivity(userId, "ACCOUNT_DELETED", {});

      // Delete user account (this will cascade delete related records)
      await prisma.user.delete({
        where: { id: userId },
      });

      return { success: true, message: "Account deleted successfully" };
    } catch (error) {
      console.error("Delete account error:", error);
      throw error;
    }
  }

  private async verifyPasswordOrSocial(
    userId: string,
    password?: string
  ): Promise<{ ok: boolean; message?: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) return { ok: false, message: "User not found" };

    // No password set → social-only account.
    if (!user.passwordHash) return { ok: true };

    if (!password) {
      return { ok: false, message: "Enter your password to confirm this change" };
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return { ok: false, message: "That password is incorrect" };
    return { ok: true };
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
      console.error("Log activity error:", error);
      // Don't throw error for logging failures
    }
  }
}

export const profileService = new ProfileService();
