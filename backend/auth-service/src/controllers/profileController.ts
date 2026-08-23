// backend/auth-service/src/controllers/profileController.ts
import { Request, Response } from "express";
import { prisma } from "@newcondo/db";
import { profileService } from "../services/profileService";
import {
  sendResponse,
  sendBadRequest,
  sendNotFound,
  sendInternalError,
} from "@newcondo/backend-shared";

import {
  updateProfileSchema,
  changePasswordSchema,
} from "../validations/profileValidation";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    if (!userId) {
      sendResponse(res, 401, "Unauthorized", null, { code: "AUTH_REQUIRED" });
      return;
    }

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

    if (!user) {
      sendNotFound(res, "User not found");
      return;
    }

    sendResponse(res, 200, "Profile retrieved successfully", { user });
  } catch (error) {
    console.error("Get profile error:", error);
    sendInternalError(res, "Failed to retrieve profile", error as Error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendResponse(res, 401, "Unauthorized", null, { code: "AUTH_REQUIRED" });
      return;
    }

    const validatedData = updateProfileSchema.parse(req.body);

    // Check if email is being changed and if it's already taken
    if (validatedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: userId },
        },
      });

      if (existingUser) {
        sendResponse(res, 401, "Email already in use", null, {
          code: "EMAIL_EXISTS",
        });
        return;
      }
    }

    // Check if phone is being changed and if it's already taken
    if (validatedData.phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          phone: validatedData.phone,
          id: { not: userId },
        },
      });

      if (existingUser) {
        sendResponse(res, 401, "Phone number already in use", null, {
          code: "PHONE_EXISTS",
        });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...validatedData,
        // If email is changed, mark as unverified
        ...(validatedData.email && { emailVerified: null }),
        // If phone is changed, mark as unverified
        ...(validatedData.phone && { phoneVerified: null }),
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

    sendResponse(res, 200, "Profile updated sucessfully", {
      user: {
        ...updatedUser,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendResponse(res, 401, "Validation Error", null, {
        code: "VALIDATION_ERROR",
      });
      return;
    }

    console.error("Update profile error:", error);
    sendInternalError(res, "Failed to update profile", error as Error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendResponse(res, 401, "Unauthorized", null, { code: "AUTH_REQUIRED" });
      return;
    }

    const validatedData = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      sendNotFound(res, "User not found");
      return;
    }

    // Verify current password
    if (user.passwordHash) {
      const isCurrentPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        user.passwordHash
      );

      if (!isCurrentPasswordValid) {
        sendResponse(res, 400, "Current password is incorrect", null, {
          code: "INVALID_PASSWORD",
        });
        return;
      }
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(
      validatedData.newPassword,
      saltRounds
    );

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword },
    });

    sendResponse(res, 200, "Password changed successfully");
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendResponse(res, 401, "Validation error", null, {
        code: "VALIDATION_ERROR",
      });
      return;
    }

    console.error("Change password error:", error);

    sendInternalError(res, "Internal server error", error as Error);
  }
};

export const updateEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { newEmail, otpCode, password } = req.body;

    if (!userId) {
      sendResponse(res, 401, "Unauthorized", null, { code: "AUTH_REQUIRED" });
      return;
    }

    if (!newEmail || !otpCode) {
      sendResponse(res, 400, "New email and OTP code are required", null);
      return;
    }

    const result = await profileService.updateEmail(userId, newEmail, otpCode, password);

    if (!result.success) {
       const status = /password/i.test(result.message ?? "") ? 401 : 400;
       sendResponse(res, status, result.message!, null);
       return
     }

    sendResponse(res, 200, "Password changed successfully");
  } catch (error) {
    console.error("Update email error:", error);
    sendInternalError(res, "Internal server error", error as Error);
  }
};

export const updatePhone = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { newPhone, otpCode, password } = req.body;

    if (!userId) {
      sendResponse(res, 401, "Unauthorized", null, { code: "AUTH_REQUIRED" });
      return;
    }

    if (!newPhone || !otpCode) {
      sendResponse(res, 400, "New email and OTP code are required", null);
      return;
    }

    const result = await profileService.updatePhone(userId, newPhone, otpCode, password);

    if (!result.success) {
       const status = /password/i.test(result.message ?? "") ? 401 : 400;
       sendResponse(res, status, result.message!, null);
       return
     }

    sendResponse(res, 200, "Password changed successfully");
  } catch (error) {
    console.error("Update phone error:", error);
    sendInternalError(res, "Internal server error", error as Error);
  }
};

export const getActivity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendResponse(res, 401, "Unauthorized", null, { code: "AUTH_REQUIRED" });
      return;
    }

    const { page = 1, limit = 20 } = req.query;
    const activities = await profileService.getUserActivity(
      userId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    sendResponse(res, 200, "Password changed successfully");
  } catch (error) {
    console.error("Get activity error:", error);
    sendInternalError(res, "Internal server error", error as Error);
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendResponse(res, 401, "Unauthorized", null, { code: "AUTH_REQUIRED" });
      return;
    }

    // Check if user has active rentals or properties
    const userWithRelations = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        properties: {
          where: { status: { not: "UNAVAILABLE" } },
        },
        rentals: {
          where: { status: "ACTIVE" },
        },
      },
    });

    if (!userWithRelations) {
      sendNotFound(res, "User not found");
      return;
    }

    if (
      userWithRelations.properties.length > 0 ||
      userWithRelations.rentals.length > 0
    ) {
      sendResponse(
        res,
        400,
        "Cannot delete account with active properties or rentals",
        null
      );
      return;
    }

    // Soft delete by anonymizing user data
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@deleted.com`,
        phone: null,
        name: "Deleted User",
        passwordHash: null,
        image: null,
        emailVerified: null,
        phoneVerified: null,
        verificationStatus: "REJECTED",
        address: null,
        city: null,
        state: null,
      },
    });

    sendResponse(res, 200, "Password changed successfully");
  } catch (error) {
    console.error("Delete account error:", error);
    sendInternalError(res, "Internal server error", error as Error);
  }
};

export const deleteProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // await this.profileService.deleteProfile(req.user.id);

    res.status(200).json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    sendInternalError(res, "Internal server error", error as Error);
  }
};

export const getUserStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendResponse(res, 401, "Unauthorized", null, { code: "AUTH_REQUIRED" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        properties: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
        rentals: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
        assignedMarkingJobs: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
        referrals: {
          select: {
            id: true,
            isActive: true,
            rewardPaid: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      sendNotFound(res, "User not found");
      return;
    }

    const stats = {
      totalProperties: user.properties.length,
      activeProperties: user.properties.filter((p) => p.status === "PUBLISHED")
        .length,
      totalRentals: user.rentals.length,
      activeRentals: user.rentals.filter((r) => r.status === "ACTIVE").length,
      markingJobsCompleted: user.assignedMarkingJobs.filter(
        (j) => j.status === "COMPLETED"
      ).length,
      totalMarkingJobs: user.assignedMarkingJobs.length,
      totalReferrals: user.referrals.length,
      activeReferrals: user.referrals.filter((r) => r.isActive).length,
      reliabilityScore: user.agentReliabilityScore?.toNumber() || 0,
      joinedDate: user.createdAt,
    };

    sendResponse(res, 200, "Password changed successfully");
  } catch (error) {
    console.error("Get user stats error:", error);
    sendInternalError(res, "Internal server error", error as Error);
  }
};

/**
 * Upload profile image
 */
export const uploadProfileImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendResponse(res, 401, "Unauthorized", null, { code: "AUTH_REQUIRED" });
      return;
    }

    if (!req.file) {
      sendBadRequest(res, "Image file is required");
      return;
    }

    // Process image upload (implement your upload logic here)
    const imageUrl = await profileService.uploadProfileImage(req.file, userId);

    // Update user image URL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    // Log image upload
    await prisma.eventLog.create({
      data: {
        userId,
        type: "PROFILE_IMAGE_UPDATED",
      },
    });

    sendResponse(res, 200, "Profile image updated successfully", {
      user: updatedUser,
      imageUrl,
    });
  } catch (error) {
    console.error("Upload profile image error:", error);
    sendInternalError(res, "Failed to upload profile image", error as Error);
  }
};

/**
 * Delete profile image
 */
export const deleteProfileImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendResponse(res, 401, "Unauthorized", null, { code: "AUTH_REQUIRED" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });

    if (!user?.image) {
      sendBadRequest(res, "No profile image to delete");
      return;
    }

    // Delete image from storage
    await profileService.deleteProfileImage(user.image);

    // Remove image URL from user
    await prisma.user.update({
      where: { id: userId },
      data: { image: null },
    });

    // Log image deletion
    await prisma.eventLog.create({
      data: {
        userId,
        type: "PROFILE_IMAGE_DELETED",
      },
    });

    sendResponse(res, 200, "Profile image deleted successfully", null);
  } catch (error) {
    console.error("Delete profile image error:", error);
    sendInternalError(res, "Failed to delete profile image", error as Error);
  }
};

export const getUploadLimits = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendResponse(res, 401, "Unauthorized", null, { code: "AUTH_REQUIRED" });
      return;
    }

    const limits = await profileService.checkUploadLimits(userId);

    sendResponse(res, 200, "Upload limits retrieved successfully", {
      limits,
    });
  } catch (error) {
    console.error("Get upload limits error:", error);
    sendInternalError(res, "Failed to retrieve upload limits", error as Error);
  }
};
