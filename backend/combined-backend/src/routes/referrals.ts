// backend/combined-app/src/routes/referrals.ts
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';

// Import referral service controllers
import {
  referralController,
  trackingController,
  rewardController
} from '../../../referral-service/src/controllers';

// Import referral service middleware
import { referralValidation } from '../../../referral-service/src/middleware/referralValidation';

// Import shared middleware
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { validationMiddleware } from '../../../shared/src/middleware/validation';

const router = Router();

// Referral Management Routes
router.post(
  '/create',
  authMiddleware,
  referralValidation.createReferral,
  validationMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await referralController.createReferral(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/my-referrals',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await referralController.getUserReferrals(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/stats',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await referralController.getReferralStats(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/link/:userId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await referralController.getReferralLink(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Tracking Routes
router.post(
  '/track/click',
  trackingController.trackClick
);

router.post(
  '/track/signup',
  referralValidation.trackSignup,
  validationMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await trackingController.trackSignup(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/track/conversion',
  authMiddleware,
  referralValidation.trackConversion,
  validationMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await trackingController.trackConversion(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Reward Routes
router.get(
  '/rewards',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await rewardController.getUserRewards(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/rewards/claim/:rewardId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await rewardController.claimReward(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/rewards/history',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await rewardController.getRewardHistory(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Referral program info
router.get(
  '/program-info',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await referralController.getProgramInfo(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;