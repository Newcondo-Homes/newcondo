// backend/referral-service/src/controllers/referralController.ts

import { Request, Response, NextFunction } from 'express';
import referralService from '../services/referralService';
import qualificationService from '../services/qualificationService';
import linkGenerationService from '../services/linkGenerationService';
import { ReferralFilters } from '../types';

export class ReferralController {
  /**
   * Get referral dashboard data
   * GET /api/referrals/dashboard
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const dashboard = await referralService.getReferralDashboard(userId);

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get or create referral code
   * GET /api/referrals/code
   */
  async getReferralCode(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const referralCode = await referralService.getOrCreateReferralCode(userId);

      res.json({
        success: true,
        data: { referralCode },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get referral link and share links
   * GET /api/referrals/links
   */
  async getReferralLinks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const links = await linkGenerationService.generateReferralLink(userId);

      res.json({
        success: true,
        data: links,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate referral code
   * GET /api/referrals/validate/:code
   */
  async validateCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;

      const validation = await referralService.validateReferralCode(code);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's referrals
   * GET /api/referrals
   */
  async getReferrals(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: ReferralFilters = {
        status: req.query.status as any,
        referralType: req.query.referralType as any,
        qualificationMet: req.query.qualificationMet === 'true',
        rewardPaid: req.query.rewardPaid === 'true',
      };

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      const result = await referralService.getReferrals(userId, filters, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get referral statistics
   * GET /api/referrals/statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const statistics = await referralService.getReferralStatistics(userId);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get referral eligibility
   * GET /api/referrals/eligibility
   */
  async checkEligibility(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const eligibility = await qualificationService.checkReferralEligibility(userId);

      res.json({
        success: true,
        data: eligibility,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific referral details
   * GET /api/referrals/:referralId
   */
  async getReferralById(req: Request, res: Response, next: NextFunction) {
    try {
      const { referralId } = req.params;

      const referral = await referralService.getReferralByReferredId(referralId);

      if (!referral) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Referral not found',
          },
        });
      }

      res.json({
        success: true,
        data: referral,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Regenerate referral code
   * POST /api/referrals/regenerate
   */
  async regenerateCode(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const newCode = await linkGenerationService.regenerateReferralCode(userId);

      res.json({
        success: true,
        data: {
          referralCode: newCode,
          message: 'Referral code regenerated successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate custom referral link
   * POST /api/referrals/custom-link
   */
  async generateCustomLink(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { channel, campaign, medium } = req.body;

      const customLink = await linkGenerationService.generateCustomLink(userId, {
        channel,
        campaign,
        medium,
      });

      res.json({
        success: true,
        data: { customLink },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ReferralController();