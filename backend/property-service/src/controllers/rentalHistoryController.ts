// backend/property-service/src/controllers/rentalHistoryController.ts

import { Request, Response } from 'express';
import rentalHistoryService from '../services/rentalHistoryService';
import { RentalHistoryFilters } from '../types/rentalHistory';

export class RentalHistoryController {
  /**
   * Get rental history with filters
   * GET /api/rental-history
   */
  async getRentalHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const filters: RentalHistoryFilters = {
        propertyId: req.query.propertyId as string,
        unitId: req.query.unitId as string,
        status: req.query.status as any,
        startDateFrom: req.query.startDateFrom ? new Date(req.query.startDateFrom as string) : undefined,
        startDateTo: req.query.startDateTo ? new Date(req.query.startDateTo as string) : undefined,
        endDateFrom: req.query.endDateFrom ? new Date(req.query.endDateFrom as string) : undefined,
        endDateTo: req.query.endDateTo ? new Date(req.query.endDateTo as string) : undefined,
        renterId: req.query.renterId as string,
        minRent: req.query.minRent ? parseFloat(req.query.minRent as string) : undefined,
        maxRent: req.query.maxRent ? parseFloat(req.query.maxRent as string) : undefined,
        isConfirmed: req.query.isConfirmed === 'true' ? true : req.query.isConfirmed === 'false' ? false : undefined,
        sortBy: req.query.sortBy as any || 'startDate',
        sortOrder: req.query.sortOrder as any || 'desc',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      const result = await rentalHistoryService.getRentalHistory(userId, filters);

      return res.status(200).json({
        success: true,
        data: result.rentals,
        pagination: {
          total: result.total,
          pages: result.pages,
          currentPage: filters.page,
          limit: filters.limit,
        },
      });
    } catch (error: any) {
      console.error('Get rental history error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch rental history',
      });
    }
  }

  /**
   * Get rental summary statistics
   * GET /api/rental-history/summary
   */
  async getRentalSummary(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const summary = await rentalHistoryService.getRentalSummary(userId);

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('Get rental summary error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch rental summary',
      });
    }
  }

  /**
   * Get property rental timeline
   * GET /api/rental-history/properties/:propertyId/timeline
   */
  async getPropertyRentalTimeline(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      const timeline = await rentalHistoryService.getPropertyRentalTimeline(propertyId, userId);

      return res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (error: any) {
      console.error('Get property rental timeline error:', error);
      return res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch property rental timeline',
      });
    }
  }

  /**
   * Get tenant rental profile
   * GET /api/rental-history/tenants/:renterId/profile
   */
  async getTenantRentalProfile(req: Request, res: Response) {
    try {
      const { renterId } = req.params;
      const userId = (req as any).user.id;

      const profile = await rentalHistoryService.getTenantRentalProfile(renterId, userId);

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      console.error('Get tenant rental profile error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch tenant rental profile',
      });
    }
  }

  /**
   * Get payment history
   * GET /api/rental-history/payments
   */
  async getPaymentHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const filters = {
        rentalId: req.query.rentalId as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      const result = await rentalHistoryService.getPaymentHistory(userId, filters);

      return res.status(200).json({
        success: true,
        data: result.payments,
        pagination: {
          total: result.total,
          currentPage: filters.page,
          limit: filters.limit,
          pages: Math.ceil(result.total / filters.limit),
        },
      });
    } catch (error: any) {
      console.error('Get payment history error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch payment history',
      });
    }
  }

  /**
   * Get rental revenue breakdown
   * GET /api/rental-history/revenue-breakdown
   */
  async getRentalRevenueBreakdown(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const period = (req.query.period as 'monthly' | 'quarterly' | 'yearly') || 'monthly';

      const breakdown = await rentalHistoryService.getRentalRevenueBreakdown(userId, period);

      return res.status(200).json({
        success: true,
        data: breakdown,
      });
    } catch (error: any) {
      console.error('Get rental revenue breakdown error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch rental revenue breakdown',
      });
    }
  }

  /**
   * Get upcoming rental expirations
   * GET /api/rental-history/upcoming-expirations
   */
  async getUpcomingExpirations(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const daysAhead = parseInt(req.query.daysAhead as string) || 30;

      const expirations = await rentalHistoryService.getUpcomingExpirations(userId, daysAhead);

      return res.status(200).json({
        success: true,
        data: expirations,
      });
    } catch (error: any) {
      console.error('Get upcoming expirations error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch upcoming expirations',
      });
    }
  }

  /**
   * Get single rental details
   * GET /api/rental-history/rentals/:rentalId
   */
  async getRentalDetails(req: Request, res: Response) {
    try {
      const { rentalId } = req.params;
      const userId = (req as any).user.id;

      const result = await rentalHistoryService.getRentalHistory(userId, {
        page: 1,
        limit: 1,
      });

      const rental = result.rentals.find(r => r.id === rentalId);

      if (!rental) {
        return res.status(404).json({
          success: false,
          message: 'Rental not found or you do not have access',
        });
      }

      return res.status(200).json({
        success: true,
        data: rental,
      });
    } catch (error: any) {
      console.error('Get rental details error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch rental details',
      });
    }
  }

  /**
   * Export rental history
   * GET /api/rental-history/export
   */
  async exportRentalHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const format = req.query.format as string || 'json';

      const validFormats = ['json', 'csv', 'pdf'];
      if (!validFormats.includes(format)) {
        return res.status(400).json({
          success: false,
          message: 'Valid format is required (json, csv, or pdf)',
        });
      }

      const filters: RentalHistoryFilters = {
        propertyId: req.query.propertyId as string,
        status: req.query.status as any,
        page: 1,
        limit: 1000, // Get all records for export
      };

      const result = await rentalHistoryService.getRentalHistory(userId, filters);

      if (format === 'json') {
        return res.status(200).json({
          success: true,
          data: result.rentals,
          exportedAt: new Date(),
          totalRecords: result.total,
        });
      }

      // CSV and PDF export would be implemented here
      return res.status(501).json({
        success: false,
        message: `${format.toUpperCase()} export not yet implemented`,
      });
    } catch (error: any) {
      console.error('Export rental history error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to export rental history',
      });
    }
  }

  /**
   * Get rental statistics for a specific property
   * GET /api/rental-history/properties/:propertyId/statistics
   */
  async getPropertyRentalStatistics(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      // Get timeline which includes statistics
      const timeline = await rentalHistoryService.getPropertyRentalTimeline(propertyId, userId);

      // Get all rentals for this property
      const rentals = await rentalHistoryService.getRentalHistory(userId, {
        propertyId,
        limit: 1000,
      });

      const statistics = {
        propertyId,
        totalRentals: rentals.total,
        totalRevenue: timeline.totalRevenue,
        occupancyRate: timeline.occupancyRate,
        averageRentalDuration: timeline.timeline.length > 0
          ? timeline.timeline.reduce((sum, t) => sum + t.duration, 0) / timeline.timeline.length
          : 0,
        currentStatus: timeline.timeline.length > 0
          ? timeline.timeline[timeline.timeline.length - 1].status
          : 'VACANT',
      };

      return res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      console.error('Get property rental statistics error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch property rental statistics',
      });
    }
  }
}

export default new RentalHistoryController();