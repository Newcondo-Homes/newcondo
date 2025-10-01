// backend/property-service/src/controllers/availabilityController.ts

import { Request, Response, NextFunction } from 'express';
import { availabilityService } from '../services/availabilityService';
import { PropertyStructure } from '@newcondo/db';

export class AvailabilityController {
  /**
   * Get real-time availability for a property
   */
  async getPropertyAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;

      if (!propertyId) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Property ID is required',
        });
        return;
      }

      const availability = await availabilityService.getPropertyAvailability(propertyId);

      res.status(200).json({
        success: true,
        data: availability,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get availability for a specific unit
   */
  async getUnitAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId, unitId } = req.params;

      if (!propertyId || !unitId) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Property ID and Unit ID are required',
        });
        return;
      }

      const availability = await availabilityService.getUnitAvailability(propertyId, unitId);

      if (!availability) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Unit not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: availability,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get availability for multiple properties (bulk check)
   */
  async getBulkAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyIds } = req.body;

      if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Property IDs array is required',
        });
        return;
      }

      if (propertyIds.length > 50) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Maximum 50 properties per request',
        });
        return;
      }

      const availabilities = await availabilityService.getBulkAvailability(propertyIds);

      res.status(200).json({
        success: true,
        data: {
          availabilities,
          count: availabilities.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update property availability status
   */
  async updateAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const { isAvailable, availableFrom, unitId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      // Verify ownership
      const hasPermission = await availabilityService.verifyOwnership(propertyId, userId);
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to update this property',
        });
        return;
      }

      const result = await availabilityService.updateAvailability({
        propertyId,
        unitId,
        isAvailable,
        availableFrom: availableFrom ? new Date(availableFrom) : undefined,
        updatedBy: userId,
      });

      res.status(200).json({
        success: true,
        message: 'Availability updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Auto-delist property after successful payment
   */
  async delistProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const { unitId, rentalId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const result = await availabilityService.delistAfterPayment({
        propertyId,
        unitId,
        rentalId,
        userId,
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Delist Failed',
          message: result.message,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get availability statistics for a property
   */
  async getAvailabilityStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      // Verify ownership or admin
      const hasPermission = await availabilityService.verifyOwnership(propertyId, userId);
      const isAdmin = req.user?.role === 'ADMIN';

      if (!hasPermission && !isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
        });
        return;
      }

      const stats = await availabilityService.getAvailabilityStats(propertyId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if property/unit is available for booking
   */
  async checkBookingAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const { unitId, startDate, endDate } = req.query;

      if (!propertyId) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Property ID is required',
        });
        return;
      }

      const result = await availabilityService.checkBookingAvailability({
        propertyId,
        unitId: unitId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get availability timeline for a property
   */
  async getAvailabilityTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const { startDate, endDate, unitId } = req.query;

      if (!propertyId) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Property ID is required',
        });
        return;
      }

      const timeline = await availabilityService.getAvailabilityTimeline({
        propertyId,
        unitId: unitId as string,
        startDate: startDate ? new Date(startDate as string) : new Date(),
        endDate: endDate ? new Date(endDate as string) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      });

      res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync availability with external systems
   */
  async syncAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const hasPermission = await availabilityService.verifyOwnership(propertyId, userId);
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
        });
        return;
      }

      const result = await availabilityService.syncAvailability(propertyId);

      res.status(200).json({
        success: true,
        message: 'Availability synced successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get properties with upcoming availability
   */
  async getUpcomingAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { days = 30, city, propertyType } = req.query;

      const properties = await availabilityService.getUpcomingAvailability({
        days: parseInt(days as string),
        city: city as string,
        propertyType: propertyType as string,
      });

      res.status(200).json({
        success: true,
        data: {
          properties,
          count: properties.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const availabilityController = new AvailabilityController();