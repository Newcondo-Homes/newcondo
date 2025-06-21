// backend/auth-service/src/controllers/profileController.ts
import { Request, Response } from 'express';
import { prisma } from '@newcondo/db';
import { profileService } from '../services/profileService';
import { standardResponse } from '../../../shared/src/utils/response';
// import { AuthRequest } from '../types/auth';
import { updateProfileSchema, changePasswordSchema } from '../validations/profileValidation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json(
        standardResponse(false, 'Unauthorized', null, 'AUTH_REQUIRED')
      );
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
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json(
        standardResponse(false, 'User not found', null, 'USER_NOT_FOUND')
      );
    }

    return res.status(200).json(
      standardResponse(true, 'Profile retrieved successfully', user)
    );
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json(
      standardResponse(false, 'Internal server error', null, 'INTERNAL_ERROR')
    );
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json(
        standardResponse(false, 'Unauthorized', null, 'AUTH_REQUIRED')
      );
    }

    const validatedData = updateProfileSchema.parse(req.body);

    // Check if email is being changed and if it's already taken
    if (validatedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json(
          standardResponse(false, 'Email already in use', null, 'EMAIL_EXISTS')
        );
      }
    }

    // Check if phone is being changed and if it's already taken
    if (validatedData.phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          phone: validatedData.phone,
          id: { not: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json(
          standardResponse(false, 'Phone number already in use', null, 'PHONE_EXISTS')
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...validatedData,
        // If email is changed, mark as unverified
        ...(validatedData.email && { emailVerified: null }),
        // If phone is changed, mark as unverified  
        ...(validatedData.phone && { phoneVerified: null })
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
        updatedAt: true
      }
    });

    return res.status(200).json(
      standardResponse(true, 'Profile updated successfully', updatedUser)
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        standardResponse(false, 'Validation error', error.errors, 'VALIDATION_ERROR')
      );
    }

    console.error('Update profile error:', error);
    return res.status(500).json(
      standardResponse(false, 'Internal server error', null, 'INTERNAL_ERROR')
    );
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json(
        standardResponse(false, 'Unauthorized', null, 'AUTH_REQUIRED')
      );
    }

    const validatedData = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true }
    });

    if (!user) {
      return res.status(404).json(
        standardResponse(false, 'User not found', null, 'USER_NOT_FOUND')
      );
    }

    // Verify current password
    if (user.passwordHash) {
      const isCurrentPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        user.passwordHash
      );

      if (!isCurrentPasswordValid) {
        return res.status(400).json(
          standardResponse(false, 'Current password is incorrect', null, 'INVALID_PASSWORD')
        );
      }
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword }
    });

    return res.status(200).json(
      standardResponse(true, 'Password changed successfully', null)
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        standardResponse(false, 'Validation error', error.errors, 'VALIDATION_ERROR')
      );
    }

    console.error('Change password error:', error);
    return res.status(500).json(
      standardResponse(false, 'Internal server error', null, 'INTERNAL_ERROR')
    );
  }
};

export const updateEmail =   async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { newEmail, otpCode } = req.body;

      if (!userId) {
        return res.status(401).json(standardResponse(false, 'Unauthorized', null));
      }

      if (!newEmail || !otpCode) {
        return res.status(400).json(
          standardResponse(false, 'New email and OTP code are required', null)
        );
      }

      const result = await profileService.updateEmail(userId, newEmail, otpCode);
      
      if (!result.success) {
        return res.status(400).json(standardResponse(false, result.message, null));
      }

      return res.json(standardResponse(true, 'Email updated successfully', result.data));
    } catch (error) {
      console.error('Update email error:', error);
      return res.status(500).json(standardResponse(false, 'Internal server error', null));
    }
  }


export const updatePhone = async (req: Request, res: Response)=> {
    try {
      const userId = req.user?.id;
      const { newPhone, otpCode } = req.body;

      if (!userId) {
        return res.status(401).json(standardResponse(false, 'Unauthorized', null));
      }

      if (!newPhone || !otpCode) {
        return res.status(400).json(
          standardResponse(false, 'New phone and OTP code are required', null)
        );
      }

      const result = await profileService.updatePhone(userId, newPhone, otpCode);
      
      if (!result.success) {
        return res.status(400).json(standardResponse(false, result.message, null));
      }

      return res.json(standardResponse(true, 'Phone updated successfully', result.data));
    } catch (error) {
      console.error('Update phone error:', error);
      return res.status(500).json(standardResponse(false, 'Internal server error', null));
    }
  }

export const getActivity =   async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(standardResponse(false, 'Unauthorized', null));
      }

      const { page = 1, limit = 20 } = req.query;
      const activities = await profileService.getUserActivity(
        userId, 
        parseInt(page as string), 
        parseInt(limit as string)
      );

      return res.json(standardResponse(true, 'Activity retrieved successfully', activities));
    } catch (error) {
      console.error('Get activity error:', error);
      return res.status(500).json(standardResponse(false, 'Internal server error', null));
    }
  }
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json(
        standardResponse(false, 'Unauthorized', null, 'AUTH_REQUIRED')
      );
    }

    // Check if user has active rentals or properties
    const userWithRelations = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        properties: {
          where: { status: { not: 'UNAVAILABLE' } }
        },
        rentals: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!userWithRelations) {
      return res.status(404).json(
        standardResponse(false, 'User not found', null, 'USER_NOT_FOUND')
      );
    }

    if (userWithRelations.properties.length > 0 || userWithRelations.rentals.length > 0) {
      return res.status(400).json(
        standardResponse(
          false, 
          'Cannot delete account with active properties or rentals', 
          null, 
          'ACTIVE_RELATIONS'
        )
      );
    }

    // Soft delete by anonymizing user data
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@deleted.com`,
        phone: null,
        name: 'Deleted User',
        passwordHash: null,
        image: null,
        emailVerified: null,
        phoneVerified: null,
        verificationStatus: 'REJECTED',
        idDocument: null,
        selfieImage: null,
        address: null,
        city: null,
        state: null
      }
    });

    return res.status(200).json(
      standardResponse(true, 'Account deleted successfully', null)
    );
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json(
      standardResponse(false, 'Internal server error', null, 'INTERNAL_ERROR')
    );
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json(
        standardResponse(false, 'Unauthorized', null, 'AUTH_REQUIRED')
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        properties: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        },
        rentals: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        },
        assignedMarkingJobs: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        },
        referrals: {
          select: {
            id: true,
            isActive: true,
            rewardPaid: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json(
        standardResponse(false, 'User not found', null, 'USER_NOT_FOUND')
      );
    }

    const stats = {
      totalProperties: user.properties.length,
      activeProperties: user.properties.filter(p => p.status === 'PUBLISHED').length,
      totalRentals: user.rentals.length,
      activeRentals: user.rentals.filter(r => r.status === 'ACTIVE').length,
      markingJobsCompleted: user.assignedMarkingJobs.filter(j => j.status === 'COMPLETED').length,
      totalMarkingJobs: user.assignedMarkingJobs.length,
      totalReferrals: user.referrals.length,
      activeReferrals: user.referrals.filter(r => r.isActive).length,
      reliabilityScore: user.agentReliabilityScore?.toNumber() || 0,
      joinedDate: user.createdAt
    };

    return res.status(200).json(
      standardResponse(true, 'User stats retrieved successfully', stats)
    );
  } catch (error) {
    console.error('Get user stats error:', error);
    return res.status(500).json(
      standardResponse(false, 'Internal server error', null, 'INTERNAL_ERROR')
    );
  }
};