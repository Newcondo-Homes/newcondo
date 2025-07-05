// backend/combined-app/src/routes/analytics.ts
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import type { Router as ExpressRouter } from 'express'

// Import analytics service controllers
// import {
//   platformController,
//   propertyController,
//   userController,
//   revenueController
// } from '../../../analytics-service/src/controllers';

// Import analytics service middleware
// import { analyticsValidation } from '../../../analytics-service/src/middleware/analyticsValidation';

// Import shared middleware
// import { authMiddleware } from '../../../shared/src/middleware/auth';
// import { validationMiddleware } from '../../../shared/src/middleware/validation';

const router: ExpressRouter = Router();

// Platform Analytics Routes
// router.get(
//   '/platform/overview',
//   authMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await platformController.getPlatformOverview(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/platform/growth',
//   authMiddleware,
//   analyticsValidation.getGrowthMetrics,
//   validationMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await platformController.getGrowthMetrics(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/platform/engagement',
//   authMiddleware,
//   analyticsValidation.getEngagementMetrics,
//   validationMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await platformController.getEngagementMetrics(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/platform/traffic',
//   authMiddleware,
//   analyticsValidation.getTrafficMetrics,
//   validationMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await platformController.getTrafficMetrics(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Property Analytics Routes
// router.get(
//   '/properties/overview',
//   authMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await propertyController.getPropertyOverview(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/properties/performance',
//   authMiddleware,
//   analyticsValidation.getPropertyPerformance,
//   validationMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await propertyController.getPropertyPerformance(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/properties/geography',
//   authMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await propertyController.getGeographicalDistribution(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/properties/pricing-trends',
//   authMiddleware,
//   analyticsValidation.getPricingTrends,
//   validationMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await propertyController.getPricingTrends(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/properties/:propertyId/analytics',
//   authMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await propertyController.getIndividualPropertyAnalytics(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // User Analytics Routes
// router.get(
//   '/users/overview',
//   authMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await userController.getUserOverview(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/users/behavior',
//   authMiddleware,
//   analyticsValidation.getUserBehavior,
//   validationMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await userController.getUserBehaviorAnalytics(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/users/demographics',
//   authMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await userController.getUserDemographics(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/users/retention',
//   authMiddleware,
//   analyticsValidation.getRetentionMetrics,
//   validationMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await userController.getUserRetentionMetrics(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/users/acquisition',
//   authMiddleware,
//   analyticsValidation.getAcquisitionMetrics,
//   validationMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await userController.getUserAcquisitionMetrics(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Revenue Analytics Routes
// router.get(
//   '/revenue/overview',
//   authMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await revenueController.getRevenueOverview(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/revenue/trends',
//   authMiddleware,
//   analyticsValidation.getRevenueTrends,
//   validationMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await revenueController.getRevenueTrends(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/revenue/streams',
//   authMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await revenueController.getRevenueStreams(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/revenue/forecasting',
//   authMiddleware,
//   analyticsValidation.getRevenueForecasting,
//   validationMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await revenueController.getRevenueForecasting(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/revenue/by-property-type',
//   authMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await revenueController.getRevenueByPropertyType(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/revenue/commission-analysis',
//   authMiddleware,
//   analyticsValidation.getCommissionAnalysis,
//   validationMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await revenueController.getCommissionAnalysis(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Report Generation Routes
// router.post(
//   '/reports/generate',
//   authMiddleware,
//   analyticsValidation.generateReport,
//   validationMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await platformController.generateCustomReport(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/reports/scheduled',
//   authMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await platformController.getScheduledReports(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// router.get(
//   '/reports/:reportId/download',
//   authMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await platformController.downloadReport(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

export default router;