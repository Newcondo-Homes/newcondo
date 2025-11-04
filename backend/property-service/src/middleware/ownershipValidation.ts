// backend/property-service/src/middleware/ownershipValidation.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to verify that the authenticated user owns or is the agent for a property
 */
export const verifyPropertyOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    const propertyId = req.params.propertyId || req.body.propertyId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required',
      });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        ownerId: true,
        agentId: true,
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    const isOwner = property.ownerId === userId;
    const isAgent = property.agentId === userId;

    if (!isOwner && !isAgent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this property',
      });
    }

    // Attach property access info to request
    (req as any).propertyAccess = {
      isOwner,
      isAgent,
      propertyId: property.id,
      ownerId: property.ownerId,
      agentId: property.agentId,
    };

    next();
  } catch (error) {
    console.error('Ownership validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating property ownership',
    });
  }
};

/**
 * Middleware to verify that the user is the property owner (not just agent)
 */
export const verifyPropertyOwnerOnly = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    const propertyId = req.params.propertyId || req.body.propertyId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required',
      });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    if (property.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only property owners can perform this action',
      });
    }

    (req as any).propertyAccess = {
      isOwner: true,
      isAgent: false,
      propertyId: property.id,
      ownerId: property.ownerId,
    };

    next();
  } catch (error) {
    console.error('Owner validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating property ownership',
    });
  }
};

/**
 * Middleware to verify user is an agent
 */
export const verifyAgentRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'AGENT') {
      return res.status(403).json({
        success: false,
        message: 'This action is only available to agents',
      });
    }

    next();
  } catch (error) {
    console.error('Agent role validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating agent role',
    });
  }
};

/**
 * Middleware to verify unit belongs to property
 */
export const verifyUnitOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    const propertyId = req.params.propertyId || req.body.propertyId;
    const unitId = req.params.unitId || req.body.unitId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!propertyId || !unitId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID and Unit ID are required',
      });
    }

    // Verify property ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        ownerId: true,
        agentId: true,
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    const isOwner = property.ownerId === userId;
    const isAgent = property.agentId === userId;

    if (!isOwner && !isAgent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this property',
      });
    }

    // Verify unit belongs to property
    const unit = await prisma.propertyUnit.findFirst({
      where: {
        id: unitId,
        propertyId: propertyId,
      },
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found or does not belong to this property',
      });
    }

    (req as any).propertyAccess = {
      isOwner,
      isAgent,
      propertyId: property.id,
      ownerId: property.ownerId,
      agentId: property.agentId,
      unitId: unit.id,
    };

    next();
  } catch (error) {
    console.error('Unit ownership validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating unit ownership',
    });
  }
};