import { Router } from 'express';
import { auth } from '../../../shared/src/middleware/auth';
import { validateRequest } from '../../../shared/src/middleware/validation';
import { rateLimiter } from '../../../shared/src/middleware/rateLimiter';
import { rentalController } from '../controllers/rentalController';
import { z } from 'zod';

const router = Router();

// Validation schemas
const initiateRentalPaymentSchema = z.object({
  body: z.object({
    propertyId: z.string().cuid(),
    unitId: z.string().cuid().optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    paymentType: z.enum(['RENT', 'DEPOSIT']),
    amount: z.number().positive(),
    currency: z.string().default('NGN'),
    paymentMethod: z.enum(['card', 'bank_transfer', 'ussd']).optional(),
    redirectUrl: z.string().url().optional(),
    description: z.string().optional()
  })
});

const confirmRentalPaymentSchema = z.object({
  body: z.object({
    transactionId: z.string(),
    confirm: z.boolean()
  })
});

const cancelRentalSchema = z.object({
  body: z.object({
    reason: z.string().optional()
  })
});

const retryPaymentSchema = z.object({
  body: z.object({
    paymentMethod: z.enum(['card', 'bank_transfer', 'ussd']).optional()
  })
});

// Routes

/**
 * @route POST /api/rentals/payments/initiate
 * @desc Initiate rental payment (rent or deposit)
 * @access Private (Renters)
 */
router.post(
  '/payments/initiate',
  auth,
  rateLimiter(10, 15), // 10 requests per 15 minutes
  validateRequest(initiateRentalPaymentSchema),
  rentalController.initiatePayment
);

/**
 * @route GET /api/rentals/payments/:paymentId
 * @desc Get rental payment details
 * @access Private (Payment owner or property owner)
 */
router.get(
  '/payments/:paymentId',
  auth,
  rentalController.getPaymentDetails
);

/**
 * @route POST /api/rentals/payments/:paymentId/confirm
 * @desc Confirm or cancel rental payment within confirmation period
 * @access Private (Payment owner)
 */
router.post(
  '/payments/:paymentId/confirm',
  auth,
  rateLimiter(5, 10), // 5 requests per 10 minutes
  validateRequest(confirmRentalPaymentSchema),
  rentalController.confirmPayment
);

/**
 * @route POST /api/rentals/payments/:paymentId/retry
 * @desc Retry failed rental payment
 * @access Private (Payment owner)
 */
router.post(
  '/payments/:paymentId/retry',
  auth,
  rateLimiter(3, 10), // 3 retries per 10 minutes
  validateRequest(retryPaymentSchema),
  rentalController.retryPayment
);

/**
 * @route GET /api/rentals/:rentalId
 * @desc Get rental details
 * @access Private (Renter or Property Owner)
 */
router.get(
  '/:rentalId',
  auth,
  rentalController.getRental
);

/**
 * @route GET /api/rentals
 * @desc Get user's rentals (as renter or property owner)
 * @access Private
 */
router.get(
  '/',
  auth,
  rentalController.getUserRentals
);

/**
 * @route POST /api/rentals/:rentalId/cancel
 * @desc Cancel rental agreement
 * @access Private (Renter or Property Owner)
 */
router.post(
  '/:rentalId/cancel',
  auth,
  rateLimiter(2, 60), // 2 cancellations per hour
  validateRequest(cancelRentalSchema),
  rentalController.cancelRental
);

/**
 * @route GET /api/rentals/:rentalId/payments
 * @desc Get all payments for a rental
 * @access Private (Renter or Property Owner)
 */
router.get(
  '/:rentalId/payments',
  auth,
  rentalController.getRentalPayments
);

/**
 * @route POST /api/rentals/:rentalId/payments/monthly
 * @desc Pay monthly rent
 * @access Private (Renter)
 */
router.post(
  '/:rentalId/payments/monthly',
  auth,
  rateLimiter(5, 15), // 5 monthly payments per 15 minutes
  validateRequest(z.object({
    body: z.object({
      amount: z.number().positive(),
      paymentMethod: z.enum(['card', 'bank_transfer', 'ussd']).optional(),
      description: z.string().optional()
    })
  })),
  rentalController.payMonthlyRent
);

/**
 * @route GET /api/rentals/statistics
 * @desc Get rental statistics for user
 * @access Private
 */
router.get(
  '/statistics',
  auth,
  rentalController.getRentalStatistics
);

/**
 * @route POST /api/rentals/:rentalId/extend
 * @desc Extend rental agreement
 * @access Private (Renter)
 */
router.post(
  '/:rentalId/extend',
  auth,
  rateLimiter(2, 24 * 60), // 2 extensions per day
  validateRequest(z.object({
    body: z.object({
      newEndDate: z.string().datetime(),
      additionalAmount: z.number().positive().optional()
    })
  })),
  rentalController.extendRental
);

export default router;