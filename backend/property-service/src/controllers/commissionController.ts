// backend/payment-service/src/controllers/commissionController.ts

import { Request, Response } from 'express';
import { commissionCalculationService } from '../services/commissionCalculationService';
import { earningsService } from '../services/earningsService';
import { standardResponse } from '../../../shared/src/utils/response';

export class CommissionController {
  /**
   * Get commission dashboard
   */
  async getCommissionDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const dashboard = await earningsService.getCommissionDashboard(userId);

      res.status(200).json(standardResponse.success(dashboard, 'Commission dashboard retrieved successfully'));
    } catch (error) {
      console.error('Get commission dashboard error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve commission dashboard'));
    }
  }

  /**
   * Get commission breakdown for a specific payment
   */
  async getPaymentCommissionBreakdown(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { paymentId } = req.params;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const breakdown = await commissionCalculationService.getPaymentCommissionBreakdown(paymentId, userId);

      if (!breakdown) {
        res.status(404).json(standardResponse.error('Payment not found or access denied', 404));
        return;
      }

      res.status(200).json(standardResponse.success(breakdown, 'Commission breakdown retrieved successfully'));
    } catch (error) {
      console.error('Get payment commission breakdown error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve commission breakdown'));
    }
  }

  /**
   * Get earnings summary
   */
  async getEarningsSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.query;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const summary = await earningsService.getEarningsSummary(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.status(200).json(standardResponse.success(summary, 'Earnings summary retrieved successfully'));
    } catch (error) {
      console.error('Get earnings summary error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve earnings summary'));
    }
  }

  /**
   * Get commission history
   */
  async getCommissionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10, status, startDate, endDate } = req.query;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const history = await earningsService.getCommissionHistory(userId, {
        page: Number(page),
        limit: Number(limit),
        status: status as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.status(200).json(standardResponse.success(history, 'Commission history retrieved successfully'));
    } catch (error) {
      console.error('Get commission history error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve commission history'));
    }
  }

  /**
   * Get pending earnings
   */
  async getPendingEarnings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const pendingEarnings = await earningsService.getPendingEarnings(userId);

      res.status(200).json(standardResponse.success(pendingEarnings, 'Pending earnings retrieved successfully'));
    } catch (error) {
      console.error('Get pending earnings error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve pending earnings'));
    }
  }

  /**
   * Get released earnings
   */
  async getReleasedEarnings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10 } = req.query;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const releasedEarnings = await earningsService.getReleasedEarnings(userId, {
        page: Number(page),
        limit: Number(limit),
      });

      res.status(200).json(standardResponse.success(releasedEarnings, 'Released earnings retrieved successfully'));
    } catch (error) {
      console.error('Get released earnings error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve released earnings'));
    }
  }

  /**
   * Get earnings by property
   */
  async getEarningsByProperty(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10 } = req.query;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const earnings = await earningsService.getEarningsByProperty(userId, {
        page: Number(page),
        limit: Number(limit),
      });

      res.status(200).json(standardResponse.success(earnings, 'Earnings by property retrieved successfully'));
    } catch (error) {
      console.error('Get earnings by property error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve earnings by property'));
    }
  }

  /**
   * Get earnings analytics
   */
  async getEarningsAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { period = 'month' } = req.query;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const analytics = await earningsService.getEarningsAnalytics(userId, period as 'week' | 'month' | 'year');

      res.status(200).json(standardResponse.success(analytics, 'Earnings analytics retrieved successfully'));
    } catch (error) {
      console.error('Get earnings analytics error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve earnings analytics'));
    }
  }

  /**
   * Calculate commission for a rental payment
   */
  async calculateCommission(req: Request, res: Response): Promise<void> {
    try {
      const { rentAmount, propertyId, referralCode } = req.body;

      if (!rentAmount || !propertyId) {
        res.status(400).json(standardResponse.error('Rent amount and property ID are required', 400));
        return;
      }

      const calculation = await commissionCalculationService.calculateCommission({
        rentAmount: Number(rentAmount),
        propertyId,
        referralCode,
      });

      res.status(200).json(standardResponse.success(calculation, 'Commission calculated successfully'));
    } catch (error) {
      console.error('Calculate commission error:', error);
      res.status(500).json(standardResponse.error('Failed to calculate commission'));
    }
  }
}

export const commissionController = new CommissionController();