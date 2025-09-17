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


// import express from 'express';
// import { authMiddleware } from '../../../shared/src/middleware/auth';
// import { validateRequest } from '../../../shared/src/middleware/validation';
// import { paymentValidation } from '../middleware/paymentValidation';
// import { lockingMiddleware } from '../middleware/lockingMiddleware';
// import {
//   initiateRentPayment,
//   payRent,
//   payDeposit,
//   getRentalPayments,
//   getRentalBalance,
//   calculateRentAmount,
//   scheduleRentPayment,
//   cancelScheduledPayment,
//   getUpcomingPayments,
//   processRecurringPayment,
//   handlePartialPayment,
//   generateRentInvoice,
//   getRentPaymentHistory
// } from '../controllers/rentalController';

// const router = express.Router();

// // Apply auth middleware to all routes
// router.use(authMiddleware);

// /**
//  * @route   POST /api/rentals/:propertyId/rent/initiate
//  * @desc    Initiate rent payment for a property
//  * @access  Private
//  * @body    { unitId?, paymentMethod?, isRecurring? }
//  */
// router.post(
//   '/:propertyId/rent/initiate',
//   validateRequest(paymentValidation.initiateRentPayment),
//   lockingMiddleware.acquirePropertyLock,
//   initiateRentPayment
// );

// /**
//  * @route   POST /api/rentals/:propertyId/rent/pay
//  * @desc    Process rent payment
//  * @access  Private
//  * @body    { amount, unitId?, paymentMethod?, promoCode? }
//  */
// router.post(
//   '/:propertyId/rent/pay',
//   validateRequest(paymentValidation.payRent),
//   lockingMiddleware.acquirePropertyLock,
//   payRent
// );

// /**
//  * @route   POST /api/rentals/:propertyId/deposit/pay
//  * @desc    Pay security deposit
//  * @access  Private
//  * @body    { amount, unitId?, paymentMethod? }
//  */
// router.post(
//   '/:propertyId/deposit/pay',
//   validateRequest(paymentValidation.payDeposit),
//   lockingMiddleware.acquirePropertyLock,
//   payDeposit
// );

// /**
//  * @route   GET /api/rentals/:propertyId/payments
//  * @desc    Get all payments for a rental property
//  * @access  Private
//  * @query   { unitId?, status?, paymentType?, page?, limit? }
//  */
// router.get(
//   '/:propertyId/payments',
//   validateRequest(paymentValidation.getRentalPayments),
//   getRentalPayments
// );

// /**
//  * @route   GET /api/rentals/:propertyId/balance
//  * @desc    Get current rental balance and payment status
//  * @access  Private
//  * @query   { unitId? }
//  */
// router.get(
//   '/:propertyId/balance',
//   validateRequest(paymentValidation.getRentalBalance),
//   getRentalBalance
// );

// /**
//  * @route   GET /api/rentals/:propertyId/calculate
//  * @desc    Calculate rent amount including fees and discounts
//  * @access  Private
//  * @query   { unitId?, months?, promoCode? }
//  */
// router.get(
//   '/:propertyId/calculate',
//   validateRequest(paymentValidation.calculateRentAmount),
//   calculateRentAmount
// );

// /**
//  * @route   POST /api/rentals/:propertyId/schedule
//  * @desc    Schedule recurring rent payment
//  * @access  Private
//  * @body    { unitId?, paymentMethod, scheduledDate, isRecurring, frequency? }
//  */
// router.post(
//   '/:propertyId/schedule',
//   validateRequest(paymentValidation.scheduleRentPayment),
//   scheduleRentPayment
// );

// /**
//  * @route   DELETE /api/rentals/:propertyId/schedule/:scheduleId
//  * @desc    Cancel scheduled rent payment
//  * @access  Private
//  */
// router.delete(
//   '/:propertyId/schedule/:scheduleId',
//   validateRequest(paymentValidation.cancelScheduledPayment),
//   cancelScheduledPayment
// );

// /**
//  * @route   GET /api/rentals/upcoming-payments
//  * @desc    Get user's upcoming rental payments
//  * @access  Private
//  * @query   { days?, status? }
//  */
// router.get(
//   '/upcoming-payments',
//   validateRequest(paymentValidation.getUpcomingPayments),
//   getUpcomingPayments
// );

// /**
//  * @route   POST /api/rentals/process-recurring
//  * @desc    Process scheduled recurring payments (internal/cron job)
//  * @access  Private (System/Admin only)
//  */
// router.post(
//   '/process-recurring',
//   validateRequest(paymentValidation.processRecurringPayment),
//   processRecurringPayment
// );

// /**
//  * @route   POST /api/rentals/:propertyId/partial-payment
//  * @desc    Handle partial rent payment
//  * @access  Private
//  * @body    { amount, unitId?, paymentMethod, remainingBalance? }
//  */
// router.post(
//   '/:propertyId/partial-payment',
//   validateRequest(paymentValidation.handlePartialPayment),
//   handlePartialPayment
// );

// /**
//  * @route   GET /api/rentals/:propertyId/invoice
//  * @desc    Generate rent payment invoice/receipt
//  * @access  Private
//  * @query   { unitId?, month?, year?, format? }
//  */
// router.get(
//   '/:propertyId/invoice',
//   validateRequest(paymentValidation.generateRentInvoice),
//   generateRentInvoice
// );

// /**
//  * @route   GET /api/rentals/:propertyId/history
//  * @desc    Get detailed rent payment history
//  * @access  Private
//  * @query   { unitId?, startDate?, endDate?, page?, limit? }
//  */
// router.get(
//   '/:propertyId/history',
//   validateRequest(paymentValidation.getRentPaymentHistory),
//   getRentPaymentHistory
// );

// export default router;