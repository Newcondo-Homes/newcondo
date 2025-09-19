// backend/property-service/src/middleware/propertyAccountValidation.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@newcondo/db';
import { z } from 'zod';
import { errorResponse } from '../../../shared/src/utils/response';
import { AuthenticatedRequest } from '../../../shared/src/types/common';

const prisma = new PrismaClient();

// Validation schemas
const createAccountValidationSchema = z.object({
  body: z.object({
    propertyId: z.string().cuid('Invalid property ID format'),
    ownerName: z.string()
      .min(2, 'Owner name must be at least 2 characters')
      .max(100, 'Owner name cannot exceed 100 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Owner name can only contain letters, spaces, hyphens, and apostrophes'),
  }),
});

const accountParamsValidationSchema = z.object({
  params: z.object({
    accountId: z.string().cuid('Invalid account ID format'),
  }),
});

const propertyParamsValidationSchema = z.object({
  params: z.object({
    propertyId: z.string().cuid('Invalid property ID format'),
  }),
});

/**
 * Middleware to validate property account creation request
 */
export const validatePropertyAccountCreation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request format
    const validation = createAccountValidationSchema.safeParse(req);
    if (!validation.success) {
      errorResponse(res, 'Validation failed', 400, validation.error.errors);
      return;
    }

    const { propertyId } = req.body;
    const userId = req.user!.id;

    // Check if property exists and user is the owner
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: { id: true, name: true, role: true }
        },
        virtualAccount: {
          select: { id: true, isActive: true }
        }
      }
    });

    if (!property) {
      errorResponse(res, 'Property not found', 404);
      return;
    }

    // Check ownership
    if (property.ownerId !== userId) {
      errorResponse(res, 'You are not authorized to create a virtual account for this property', 403);
      return;
    }

    // Check if property already has an active virtual account
    if (property.virtualAccount && property.virtualAccount.isActive) {
      errorResponse(res, 'Property already has an active virtual account', 409);
      return;
    }

    // Check if property is approved
    if (property.adminApprovalStatus !== 'APPROVED') {
      errorResponse(res, 'Property must be approved before creating a virtual account', 400);
      return;
    }

    // Check user verification status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        verificationStatus: true, 
        role: true,
        isB2BCustomer: true 
      }
    });

    if (!user || user.verificationStatus !== 'VERIFIED') {
      errorResponse(res, 'User must be verified before creating virtual accounts', 400);
      return;
    }

    // Add validated data to request
    req.validatedProperty = property;
    req.validatedUser = user;

    next();
  } catch (error) {
    console.error('Error in validatePropertyAccountCreation middleware:', error);
    errorResponse(res, 'Internal server error during validation', 500);
  }
};

/**
 * Middleware to validate property ownership for virtual account access
 */
export const validatePropertyOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request format
    const validation = propertyParamsValidationSchema.safeParse(req);
    if (!validation.success) {
      errorResponse(res, 'Invalid property ID format', 400, validation.error.errors);
      return;
    }

    const { propertyId } = req.params;
    const userId = req.user!.id;

    // Check if property exists and user has access
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: { id: true, name: true }
        },
        agent: {
          select: { id: true, name: true }
        },
        virtualAccount: true
      }
    });

    if (!property) {
      errorResponse(res, 'Property not found', 404);
      return;
    }

    // Check if user is owner or authorized agent
    const isOwner = property.ownerId === userId;
    const isAuthorizedAgent = property.agentId === userId;

    if (!isOwner && !isAuthorizedAgent) {
      errorResponse(res, 'You are not authorized to access this property\'s virtual account', 403);
      return;
    }

    // Add validated data to request
    req.validatedProperty = property;

    next();
  } catch (error) {
    console.error('Error in validatePropertyOwnership middleware:', error);
    errorResponse(res, 'Internal server error during validation', 500);
  }
};

/**
 * Middleware to validate virtual account access
 */
export const validatePropertyAccountAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request format
    const validation = accountParamsValidationSchema.safeParse(req);
    if (!validation.success) {
      errorResponse(res, 'Invalid account ID format', 400, validation.error.errors);
      return;
    }

    const { accountId } = req.params;
    const userId = req.user!.id;

    // Check if virtual account exists and user has access
    const virtualAccount = await prisma.virtualAccount.findUnique({
      where: { id: accountId },
      include: {
        user: {
          select: { id: true, name: true }
        },
        property: {
          include: {
            owner: { select: { id: true, name: true } },
            agent: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!virtualAccount) {
      errorResponse(res, 'Virtual account not found', 404);
      return;
    }

    // Check if user is account owner or property owner/agent
    const isAccountOwner = virtualAccount.userId === userId;
    const isPropertyOwner = virtualAccount.property?.ownerId === userId;
    const isAuthorizedAgent = virtualAccount.property?.agentId === userId;

    if (!isAccountOwner && !isPropertyOwner && !isAuthorizedAgent) {
      errorResponse(res, 'You are not authorized to access this virtual account', 403);
      return;
    }

    // Add validated data to request
    req.validatedVirtualAccount = virtualAccount;

    next();
  } catch (error) {
    console.error('Error in validatePropertyAccountAccess middleware:', error);
    errorResponse(res, 'Internal server error during validation', 500);
  }
};

/**
 * Middleware to validate virtual account balance operations
 */
export const validateBalanceOperation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accountId } = req.params;
    const userId = req.user!.id;

    // Get virtual account with current balance
    const virtualAccount = await prisma.virtualAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        balance: true,
        isActive: true,
        userId: true,
        property: {
          select: {
            id: true,
            ownerId: true,
            status: true
          }
        }
      }
    });

    if (!virtualAccount) {
      errorResponse(res, 'Virtual account not found', 404);
      return;
    }

    if (!virtualAccount.isActive) {
      errorResponse(res, 'Virtual account is not active', 400);
      return;
    }

    // Check ownership
    if (virtualAccount.userId !== userId && virtualAccount.property?.ownerId !== userId) {
      errorResponse(res, 'You are not authorized to perform balance operations on this account', 403);
      return;
    }

    // Add validated data to request
    req.validatedVirtualAccount = virtualAccount;

    next();
  } catch (error) {
    console.error('Error in validateBalanceOperation middleware:', error);
    errorResponse(res, 'Internal server error during validation', 500);
  }
};

/**
 * Middleware to validate virtual account transaction operations
 */
export const validateTransactionOperation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount } = req.body;
    const { accountId } = req.params;

    // Validate amount
    if (!amount || amount <= 0) {
      errorResponse(res, 'Amount must be greater than zero', 400);
      return;
    }

    if (amount > 10000000) { // 10 million NGN limit
      errorResponse(res, 'Amount exceeds maximum transaction limit', 400);
      return;
    }

    // Get virtual account
    const virtualAccount = await prisma.virtualAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        balance: true,
        isActive: true,
        currency: true,
        property: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    if (!virtualAccount) {
      errorResponse(res, 'Virtual account not found', 404);
      return;
    }

    if (!virtualAccount.isActive) {
      errorResponse(res, 'Virtual account is not active', 400);
      return;
    }

    // For withdrawal operations, check sufficient balance
    if (req.route.path.includes('withdraw') && virtualAccount.balance < amount) {
      errorResponse(res, 'Insufficient balance for withdrawal', 400);
      return;
    }

    req.validatedVirtualAccount = virtualAccount;
    req.validatedAmount = amount;

    next();
  } catch (error) {
    console.error('Error in validateTransactionOperation middleware:', error);
    errorResponse(res, 'Internal server error during validation', 500);
  }
};

// Extend AuthenticatedRequest interface
declare global {
  namespace Express {
    interface Request {
      validatedProperty?: any;
      validatedUser?: any;
      validatedVirtualAccount?: any;
      validatedAmount?: number;
    }
  }
}