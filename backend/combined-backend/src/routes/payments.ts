// backend/combined-app/src/routes/payments.ts
import { Router } from 'express';
// import { paymentController } from '../../payment-service/src/controllers/paymentController';
// import { webhookController } from '../../payment-service/src/controllers/webhookController';
// import { rentalController } from '../../payment-service/src/controllers/rentalController';
// import { virtualAccountController } from '../../payment-service/src/controllers/virtualAccountController';
// import { confirmationController } from '../../payment-service/src/controllers/confirmationController';

// Import middleware from payment service
// import { paymentValidation } from '../../payment-service/src/middleware/paymentValidation';
// import { lockingMiddleware } from '../../payment-service/src/middleware/lockingMiddleware';

// Import shared middleware
// import { authenticateToken } from '../../shared/src/middleware/auth';
// import { validateRequest } from '../../shared/src/middleware/validation';

const router = Router();

// Payment initialization routes
// router.post('/initialize',
//   authenticateToken,
//   paymentValidation.validatePaymentInitialization,
//   validateRequest,
//   paymentController.initializePayment
// );

// router.post('/verify',
//   authenticateToken,
//   paymentValidation.validatePaymentVerification,
//   validateRequest,
//   paymentController.verifyPayment
// );

// // Payment history and status
// router.get('/history',
//   authenticateToken,
//   paymentController.getPaymentHistory
// );

// router.get('/:paymentId/status',
//   authenticateToken,
//   paymentController.getPaymentStatus
// );

// router.get('/:paymentId',
//   authenticateToken,
//   paymentController.getPaymentDetails
// );

// // Rental payments
// router.post('/rent',
//   authenticateToken,
//   lockingMiddleware.preventDoubleBooking,
//   paymentValidation.validateRentalPayment,
//   validateRequest,
//   rentalController.initiateRentalPayment
// );

// router.post('/rent/verify',
//   authenticateToken,
//   paymentValidation.validateRentalVerification,
//   validateRequest,
//   rentalController.verifyRentalPayment
// );

// router.get('/rent/history',
//   authenticateToken,
//   rentalController.getRentalPaymentHistory
// );

// // Virtual account management
// router.get('/virtual-accounts',
//   authenticateToken,
//   virtualAccountController.getUserVirtualAccounts
// );

// router.post('/virtual-accounts',
//   authenticateToken,
//   paymentValidation.validateVirtualAccountCreation,
//   validateRequest,
//   virtualAccountController.createVirtualAccount
// );

// router.get('/virtual-accounts/:accountId',
//   authenticateToken,
//   virtualAccountController.getVirtualAccountDetails
// );

// router.get('/virtual-accounts/:accountId/balance',
//   authenticateToken,
//   virtualAccountController.getAccountBalance
// );

// router.get('/virtual-accounts/:accountId/transactions',
//   authenticateToken,
//   virtualAccountController.getAccountTransactions
// );

// router.post('/virtual-accounts/:accountId/fund',
//   authenticateToken,
//   paymentValidation.validateAccountFunding,
//   validateRequest,
//   virtualAccountController.fundAccount
// );

// router.post('/virtual-accounts/:accountId/withdraw',
//   authenticateToken,
//   paymentValidation.validateAccountWithdrawal,
//   validateRequest,
//   virtualAccountController.withdrawFromAccount
// );

// // Payment confirmation routes
// router.post('/confirm',
//   authenticateToken,
//   paymentValidation.validatePaymentConfirmation,
//   validateRequest,
//   confirmationController.confirmPayment
// );

// router.post('/dispute',
//   authenticateToken,
//   paymentValidation.validatePaymentDispute,
//   validateRequest,
//   confirmationController.disputePayment
// );

// // Refund routes
// router.post('/refund',
//   authenticateToken,
//   paymentValidation.validateRefundRequest,
//   validateRequest,
//   paymentController.initiateRefund
// );

// router.get('/refunds/history',
//   authenticateToken,
//   paymentController.getRefundHistory
// );

// // Property marking payments
// router.post('/marking-service',
//   authenticateToken,
//   paymentValidation.validateMarkingPayment,
//   validateRequest,
//   paymentController.initiateMarkingPayment
// );

// router.post('/marking-service/verify',
//   authenticateToken,
//   paymentController.verifyMarkingPayment
// );

// // Webhook routes (no authentication for external services)
// router.post('/webhooks/flutterwave',
//   webhookController.handleFlutterwaveWebhook
// );

// router.post('/webhooks/paystack',
//   webhookController.handlePaystackWebhook
// );

// // Payment analytics
// router.get('/analytics/summary',
//   authenticateToken,
//   paymentController.getPaymentAnalytics
// );

// router.get('/analytics/revenue',
//   authenticateToken,
//   paymentController.getRevenueAnalytics
// );

export default router;