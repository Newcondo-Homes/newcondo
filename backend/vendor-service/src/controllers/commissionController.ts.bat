import { Request, Response } from 'express';
import { commissionService } from '../services/commissionService';
import { logger } from '../../../shared/src/middleware/logger';

export class CommissionController {
  /**
   * Calculate commission breakdown for a rental
   */
  async calculateCommission(req: Request, res: Response): Promise<void> {
    try {
      const { rentalId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const breakdown = await commissionService.calculateCommission(rentalId);

      res.status(200).json({
        success: true,
        data: breakdown
      });
    } catch (error: any) {
      logger.error('Error calculating commission:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to calculate commission'
      });
    }
  }

  /**
   * Get commission history for user
   */
  async getCommissionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 20, status } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const history = await commissionService.getCommissionHistory(
        userId,
        Number(page),
        Number(limit),
        status as string | undefined
      );

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error: any) {
      logger.error('Error getting commission history:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get commission history'
      });
    }
  }

  /**
   * Get total commissions earned
   */
  async getTotalCommissions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const totals = await commissionService.getTotalCommissions(userId);

      res.status(200).json({
        success: true,
        data: totals
      });
    } catch (error: any) {
      logger.error('Error getting total commissions:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get total commissions'
      });
    }
  }

  /**
   * Get platform commission statistics (admin only)
   */
  async getPlatformCommissions(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { startDate, endDate } = req.query;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const stats = await commissionService.getPlatformCommissionStats(
        startDate as string,
        endDate as string
      );

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Error getting platform commissions:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get platform commissions'
      });
    }
  }
}

export const commissionController = new CommissionController();