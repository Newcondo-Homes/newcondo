// backend/property-service/src/controllers/boundaryController.ts

import { Request, Response } from 'express';
import { BoundaryService } from '../services/boundaryService';
import { asyncHandler } from '../../../shared/src/utils/asyncHandler';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';
import { BadRequestError, UnauthorizedError } from '../../../shared/src/utils/errors';
import { boundaryValidationSchema } from '../middleware/boundaryValidation';

export class BoundaryController {
  /**
   * Validate boundary coordinates
   */
  static validateBoundary = asyncHandler(async (req: Request, res: Response) => {
    const { coordinates } = req.body;

    if (!coordinates || !Array.isArray(coordinates)) {
      throw new BadRequestError('Invalid coordinates provided');
    }

    const validation = await BoundaryService.validateBoundary(coordinates);
    
    return successResponse(res, {
      validation,
      message: validation.isValid ? 'Boundary is valid' : 'Boundary validation failed'
    });
  });

  /**
   * Check for duplicate properties
   */
  static checkDuplicates = asyncHandler(async (req: Request, res: Response) => {
    const { coordinates, propertyId } = req.body;

    if (!coordinates || !Array.isArray(coordinates)) {
      throw new BadRequestError('Invalid coordinates provided');
    }

    const duplicateCheck = await BoundaryService.checkForDuplicates(coordinates, propertyId);
    
    return successResponse(res, {
      duplicateCheck,
      message: duplicateCheck.hasDuplicates ? 'Duplicate properties found' : 'No duplicates found'
    });
  });

  /**
   * Save property boundary
   */
  static saveBoundary = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const { propertyId, boundaryCoordinates, gpsCoordinates, boundaryImages } = req.body;

    // Validate required fields
    if (!propertyId || !boundaryCoordinates || !gpsCoordinates) {
      throw new BadRequestError('Missing required fields');
    }

    // Validate coordinates format
    if (!Array.isArray(boundaryCoordinates) || boundaryCoordinates.length < 3) {
      throw new BadRequestError('Invalid boundary coordinates');
    }

    if (!gpsCoordinates.lat || !gpsCoordinates.lng) {
      throw new BadRequestError('Invalid GPS coordinates');
    }

    // Check if user owns the property or is an authorized agent
    const property = await db.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { ownerId: userId },
          { agentId: userId }
        ]
      }
    });

    if (!property) {
      throw new UnauthorizedError('You are not authorized to modify this property');
    }

    const boundary = await BoundaryService.saveBoundary({
      propertyId,
      boundaryCoordinates,
      gpsCoordinates,
      boundaryImages,
      userId
    });

    return successResponse(res, {
      boundary,
      message: 'Property boundary saved successfully'
    });
  });

  /**
   * Get boundaries in area
   */
  static getBoundariesInArea = asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      throw new BadRequestError('Latitude and longitude are required');
    }

    const center = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string)
    };

    const searchRadius = radius ? parseFloat(radius as string) : 0.002;

    const boundaries = await BoundaryService.getBoundariesInArea(center, searchRadius);

    return successResponse(res, {
      boundaries,
      count: boundaries.length,
      message: 'Boundaries retrieved successfully'
    });
  });

  /**
   * Get property boundary details
   */
  static getPropertyBoundary = asyncHandler(async (req: Request, res: Response) => {
    const { propertyId } = req.params;

    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        address: true,
        gpsCoordinates: true,
        boundaryCoordinates: true,
        boundaryVerified: true,
        boundaryMarkedAt: true,
        boundaryMarkedBy: true,
        boundaryImages: true,
        buildingFingerprint: true,
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!property) {
      throw new BadRequestError('Property not found');
    }

    const boundary = property.boundaryCoordinates ? {
      propertyId: property.id,
      coordinates: property.boundaryCoordinates,
      gpsCoordinates: property.gpsCoordinates ? JSON.parse(property.gpsCoordinates) : null,
      title: property.title,
      address: property.address,
      isVerified: property.boundaryVerified,
      markedAt: property.boundaryMarkedAt,
      markedBy: property.boundaryMarkedBy,
      images: property.boundaryImages,
      fingerprint: property.buildingFingerprint,
      owner: property.owner
    } : null;

    return successResponse(res, {
      boundary,
      message: boundary ? 'Property boundary retrieved successfully' : 'Property boundary not found'
    });
  });

  /**
   * Update property boundary
   */
  static updateBoundary = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const { propertyId } = req.params;
    const { boundaryCoordinates, gpsCoordinates, boundaryImages } = req.body;

    // Check authorization
    const property = await db.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { ownerId: userId },
          { agentId: userId }
        ]
      }
    });

    if (!property) {
      throw new UnauthorizedError('You are not authorized to modify this property');
    }

    const boundary = await BoundaryService.saveBoundary({
      propertyId,
      boundaryCoordinates,
      gpsCoordinates,
      boundaryImages,
      userId
    });

    return successResponse(res, {
      boundary,
      message: 'Property boundary updated successfully'
    });
  });

  /**
   * Delete property boundary
   */
  static deleteBoundary = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const { propertyId } = req.params;

    // Check authorization
    const property = await db.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { ownerId: userId },
          { agentId: userId }
        ]
      }
    });

    if (!property) {
      throw new UnauthorizedError('You are not authorized to modify this property');
    }

    await db.property.update({
      where: { id: propertyId },
      data: {
        boundaryCoordinates: null,
        gpsCoordinates: null,
        boundaryVerified: false,
        boundaryMarkedBy: null,
        boundaryMarkedAt: null,
        boundaryImages: [],
        buildingFingerprint: null
      }
    });

    return successResponse(res, {
      message: 'Property boundary deleted successfully'
    });
  });

  /**
   * Get nearby properties for duplicate checking
   */
  static getNearbyProperties = asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius = 0.001 } = req.query;

    if (!lat || !lng) {
      throw new BadRequestError('Latitude and longitude are required');
    }

    const center = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string)
    };

    const searchRadius = parseFloat(radius as string);

    const properties = await db.property.findMany({
      where: {
        AND: [
          {
            gpsCoordinates: {
              not: null
            }
          },
          {
            status: {
              not: 'DRAFT'
            }
          }
        ]
      },
      select: {
        id: true,
        title: true,
        address: true,
        gpsCoordinates: true,
        boundaryCoordinates: true,
        boundaryVerified: true,
        price: true,
        propertyType: true,
        owner: {
          select: {
            name: true
          }
        }
      }
    });

    // Filter by distance
    const nearbyProperties = properties.filter(property => {
      if (!property.gpsCoordinates) return false;
      
      const coords = JSON.parse(property.gpsCoordinates);
      const distance = BoundaryService['calculateDistance'](center, coords);
      return distance <= searchRadius;
    });

    return successResponse(res, {
      properties: nearbyProperties,
      count: nearbyProperties.length,
      message: 'Nearby properties retrieved successfully'
    });
  });
}