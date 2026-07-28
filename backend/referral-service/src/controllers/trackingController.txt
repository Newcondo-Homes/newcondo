// backend/referral-service/src/controllers/trackingController.ts

import { Request, Response, NextFunction } from 'express';
import trackingService from '../services/trackingService';
import attributionService from '../services/attributionService';
import { CreateClickDTO } from '../types';

export class TrackingController {
  /**
   * Track a referral click
   * POST /api/tracking/click
   */
  async trackClick(req: Request, res: Response, next: NextFunction) {
    try {
      const { referralCode, sessionId, referrerUrl, landingPage } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
      const userAgent = req.headers['user-agent'];

      const clickData: CreateClickDTO = {
        referralCode,
        ipAddress,
        userAgent,
        referrerUrl,
        landingPage,
        sessionId,
      };

      await trackingService.trackClick(clickData);

      res.json({
        success: true,
        data: {
          message: 'Click tracked successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Track a conversion
   * POST /api/tracking/conversion
   */
  async trackConversion(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;

      // Attribute conversion
      const attribution = await attributionService.attributeConversion(
        userId,
        sessionId,
        ipAddress
      );

      res.json({
        success: true,
        data: {
          message: 'Conversion tracked successfully',
          attribution,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get click analytics for a referral code
   * GET /api/tracking/analytics/:referralCode
   */
  async getClickAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { referralCode } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      const analytics = await trackingService.getClickAnalytics(referralCode, days);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get performance metrics for user's referral
   * GET /api/tracking/performance
   */
  async getPerformanceMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const days = parseInt(req.query.days as string) || 30;

      // Get user's referral code
      const { PrismaClient } = await import('@newcondo/db');
      const prisma = new PrismaClient();
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      });

      if (!user?.referralCode) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User does not have a referral code',
          },
        });
      }

      const metrics = await trackingService.getReferralPerformanceMetrics(
        user.referralCode,
        days
      );

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get attribution data for current user
   * GET /api/tracking/attribution
   */
  async getUserAttribution(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const attribution = await attributionService.getUserAttribution(userId);

      res.json({
        success: true,
        data: attribution,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Detect fraud for user
   * GET /api/tracking/fraud-check
   */
  async checkFraud(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;

      const fraudResult = await trackingService.detectFraud(userId, ipAddress);

      res.json({
        success: true,
        data: fraudResult,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get multi-touch attribution
   * GET /api/tracking/multi-touch-attribution
   */
  async getMultiTouchAttribution(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const attributions = await attributionService.getMultiTouchAttribution(userId);

      res.json({
        success: true,
        data: {
          attributions,
          count: attributions.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TrackingController();