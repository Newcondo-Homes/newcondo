// backend/admin-service/src/routes/referralAdmin.ts

import express from 'express';
import { referralAdminController } from '../controllers/referralAdminController';
import { referralAnalyticsController } from '../controllers/referralAnalyticsController';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// Referral management routes
router.get('/referrals', referralAdminController.getAllReferrals);
router.get('/referrals/:referralId', referralAdminController.getReferralDetails);
router.post('/referrals/:referralId/approve', referralAdminController.approveReferral);
router.post('/referrals/:referralId/reject', referralAdminController.rejectReferral);
router.post('/referrals/:referralId/distribute-rewards', referralAdminController.triggerRewardDistribution);

// Reward management routes
router.get('/rewards', referralAdminController.getAllRewards);
router.patch('/rewards/status', referralAdminController.updateRewardStatus);

// User management routes
router.get('/users/:userId/activity', referralAdminController.getUserReferralActivity);
router.post('/users/:userId/ban', referralAdminController.banUserFromReferralProgram);

// System overview routes
router.get('/overview', referralAdminController.getSystemOverview);
router.get('/top-referrers', referralAdminController.getTopReferrers);

// Payout management routes
router.get('/payouts/pending', referralAdminController.getPendingPayouts);

// Fraud detection routes
router.get('/suspicious-activities', referralAdminController.getSuspiciousActivities);

// Data export routes
router.get('/export', referralAdminController.exportReferralData);

// Analytics routes
router.get('/analytics/conversion-funnel', referralAnalyticsController.getConversionFunnel);
router.get('/analytics/trends', referralAnalyticsController.getReferralTrends);
router.get('/analytics/reward-distribution', referralAnalyticsController.getRewardDistributionStats);
router.get('/analytics/roi', referralAnalyticsController.getROIAnalysis);
router.get('/analytics/geographic', referralAnalyticsController.getGeographicDistribution);
router.get('/analytics/channels', referralAnalyticsController.getChannelPerformance);
router.get('/analytics/cohorts', referralAnalyticsController.getUserCohortAnalysis);
router.get('/analytics/ltv', referralAnalyticsController.getLTVBySource);
router.get('/analytics/redemption-patterns', referralAnalyticsController.getRedemptionPatterns);
router.get('/analytics/velocity', referralAnalyticsController.getReferralVelocity);
router.get('/analytics/predictions', referralAnalyticsController.getPredictiveAnalytics);

export default router;