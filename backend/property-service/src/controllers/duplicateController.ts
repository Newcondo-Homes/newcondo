// backend/property-service/src/controllers/duplicateController.ts

import { Request, Response } from 'express';
import { DuplicateService } from '../services/duplicateService';
import { ApiResponse } from '../../../shared/src/utils/response';
import { logger } from '../../../shared/src/utils/logger';

export class DuplicateController {
  /**
   * Check if a property is a duplicate
   */
  static async checkDuplicate(req: Request, res: Response): Promise<void> {
    try {
      const {
        coordinates,
        boundaryCoordinates,
        address,
        city,
        state,
        features,
        images,
        excludePropertyId
      } = req.body;

      // Validate required fields
      if (!coordinates || !coordinates.lat || !coordinates.lng) {
        res.status(400).json(ApiResponse.error('Property coordinates are required'));
        return;
      }

      if (!address || !city || !state) {
        res.status(400).json(ApiResponse.error('Address, city, and state are required'));
        return;
      }

      const result = await DuplicateService.checkForDuplicates(
        {
          coordinates,
          boundaryCoordinates,
          address,
          city,
          state,
          features: features || [],
          images: images || []
        },
        excludePropertyId
      );

      res.json(ApiResponse.success('Duplicate check completed', result));
    } catch (error) {
      logger.error('Error checking for duplicates:', error);
      res.status(500).json(ApiResponse.error('Failed to check for duplicates'));
    }
  }

  /**
   * Get marked properties for overlay display
   */
  static async getMarkedPropertiesOverlay(req: Request, res: Response): Promise<void> {
    try {
      const { north, south, east, west } = req.query;

      // Validate bounds
      if (!north || !south || !east || !west) {
        res.status(400).json(ApiResponse.error('Map bounds are required'));
        return;
      }

      const bounds = {
        north: parseFloat(north as string),
        south: parseFloat(south as string),
        east: parseFloat(east as string),
        west: parseFloat(west as string)
      };

      // Validate bounds values
      if (
        isNaN(bounds.north) || isNaN(bounds.south) ||
        isNaN(bounds.east) || isNaN(bounds.west)
      ) {
        res.status(400).json(ApiResponse.error('Invalid map bounds'));
        return;
      }

      const overlayProperties = await DuplicateService.getMarkedPropertiesForOverlay(bounds);

      // Mark properties owned by current user
      const userId = req.user?.id;
      const formattedProperties = overlayProperties.map(property => ({
        ...property,
        isOwn: property.ownerId === userId
      }));

      res.json(ApiResponse.success('Marked properties retrieved', formattedProperties));
    } catch (error) {
      logger.error('Error getting marked properties overlay:', error);
      res.status(500).json(ApiResponse.error('Failed to get marked properties overlay'));
    }
  }

  /**
   * Report a duplicate property
   */
  static async reportDuplicate(req: Request, res: Response): Promise<void> {
    try {
      const { originalPropertyId, duplicatePropertyId } = req.body;
      const reportedBy = req.user?.id;

      // Validate required fields
      if (!originalPropertyId || !duplicatePropertyId) {
        res.status(400).json(ApiResponse.error('Original and duplicate property IDs are required'));
        return;
      }

      if (originalPropertyId === duplicatePropertyId) {
        res.status(400).json(ApiResponse.error('Cannot report a property as duplicate of itself'));
        return;
      }

      const duplicateReport = await DuplicateService.reportDuplicate(
        originalPropertyId,
        duplicatePropertyId,
        reportedBy
      );

      res.json(ApiResponse.success('Duplicate reported successfully', duplicateReport));
    } catch (error) {
      logger.error('Error reporting duplicate:', error);
      
      if (error instanceof Error && error.message === 'Duplicate report already exists') {
        res.status(409).json(ApiResponse.error(error.message));
      } else {
        res.status(500).json(ApiResponse.error('Failed to report duplicate'));
      }
    }
  }

  /**
   * Validate property boundary constraints
   */
  static async validateBoundaryConstraints(req: Request, res: Response): Promise<void> {
    try {
      const { boundaryCoordinates, maxAreaSquareMeters } = req.body;

      if (!boundaryCoordinates) {
        res.status(400).json(ApiResponse.error('Boundary coordinates are required'));
        return;
      }

      const validation = DuplicateService.validateBoundaryConstraints(
        boundaryCoordinates,
        maxAreaSquareMeters
      );

      if (validation.isValid) {
        res.json(ApiResponse.success('Boundary constraints are valid', validation));
      } else {
        res.status(400).json(ApiResponse.error('Boundary validation failed', validation));
      }
    } catch (error) {
      logger.error('Error validating boundary constraints:', error);
      res.status(500).json(ApiResponse.error('Failed to validate boundary constraints'));
    }
  }

  /**
   * Generate property fingerprint
   */
  static async generateFingerprint(req: Request, res: Response): Promise<void> {
    try {
      const {
        coordinates,
        boundaryCoordinates,
        address,
        features,
        images
      } = req.body;

      // Validate required fields
      if (!coordinates || !coordinates.lat || !coordinates.lng) {
        res.status(400).json(ApiResponse.error('Property coordinates are required'));
        return;
      }

      if (!address) {
        res.status(400).json(ApiResponse.error('Property address is required'));
        return;
      }

      const fingerprint = await DuplicateService.generatePropertyFingerprint({
        coordinates,
        boundaryCoordinates,
        address,
        features: features || [],
        images: images || []
      });

      res.json(ApiResponse.success('Property fingerprint generated', { fingerprint }));
    } catch (error) {
      logger.error('Error generating property fingerprint:', error);
      res.status(500).json(ApiResponse.error('Failed to generate property fingerprint'));
    }
  }
}