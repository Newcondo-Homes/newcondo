import { Request, Response } from 'express';
import { conflictDetectionService } from '../services/conflictDetectionService';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';
import { AppError } from '../../../shared/src/middleware/errorHandler';

// Extend the Request interface to potentially include user info from auth middleware
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'USER' | 'ADMIN' | 'PROPERTY_OWNER'; // Assuming roles are checked
  };
}


export const conflictController = {
  /**
   * Detect booking conflicts for a property/unit
   */
  detectConflicts: async (req: Request, res: Response) => {
    try {
      const { propertyId, unitId, startDate, endDate } = req.body;

      const conflicts = await conflictDetectionService.detectConflicts({
        propertyId,
        unitId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });

      return successResponse(
        res,
        conflicts,
        conflicts.hasConflict
          ? 'Conflicts detected'
          : 'No conflicts found'
      );
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Check real-time availability
   */
  checkAvailability: async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      const { unitId, date } = req.query;

      const availability = await conflictDetectionService.checkAvailability(
        propertyId,
        unitId as string | undefined,
        date ? new Date(date as string) : new Date()
      );

      return successResponse(res, availability, 'Availability checked');
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Get property availability calendar
   */
  getAvailabilityCalendar: async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      const { unitId, startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', 400);
      }

      const calendar = await conflictDetectionService.getAvailabilityCalendar(
        propertyId,
        unitId as string | undefined,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      return successResponse(res, calendar, 'Calendar retrieved');
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Detect simultaneous booking attempts
   */
  detectSimultaneousAttempts: async (req: Request, res: Response) => {
    try {
      const { propertyId, unitId } = req.body;

      const attempts = await conflictDetectionService.detectSimultaneousAttempts(
        propertyId,
        unitId
      );

      return successResponse(
        res,
        attempts,
        'Simultaneous attempts detected'
      );
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Get conflict history for property
   */
  getConflictHistory: async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      const { unitId, startDate, endDate, page = '1', limit = '20' } = req.query;

      const history = await conflictDetectionService.getConflictHistory({
        propertyId,
        unitId: unitId as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      return successResponse(res, history, 'Conflict history retrieved');
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Validate booking window
   */
  validateBookingWindow: async (req: Request, res: Response) => {
    try {
      const { propertyId, unitId, startDate, endDate } = req.body;

      const validation = await conflictDetectionService.validateBookingWindow({
        propertyId,
        unitId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });

      return successResponse(
        res,
        validation,
        validation.isValid
          ? 'Booking window is valid'
          : 'Booking window has issues'
      );
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Get overlapping bookings
   */
  getOverlappingBookings: async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      const { unitId, startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', 400);
      }

      const overlapping = await conflictDetectionService.getOverlappingBookings(
        propertyId,
        unitId as string | undefined,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      return successResponse(res, overlapping, 'Overlapping bookings retrieved');
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Resolve booking conflict (Admin)
   */
  resolveConflict: async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      if (!isAdmin) {
        throw new AppError('Admin access required', 403);
      }

      const { conflictId } = req.params;
      const { resolution, notes } = req.body;

      // Ensure req.user is available before accessing its ID
      if (!req.user) {
        throw new AppError('User not authenticated for resolution', 401);
      }

      const result = await conflictDetectionService.resolveConflict(
        conflictId,
        resolution,
        req.user.id,
        notes
      );

      return successResponse(res, result, 'Conflict resolved');
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Get conflict statistics
   */
  getConflictStatistics: async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      if (!isAdmin) {
        throw new AppError('Admin access required', 403);
      }
      
      const { propertyId, unitId } = req.query;

      const statistics = await conflictDetectionService.getConflictStatistics(
        propertyId as string | undefined,
        unitId as string | undefined
      );

      return successResponse(res, statistics, 'Conflict statistics retrieved');
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },
};