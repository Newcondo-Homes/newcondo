// backend/combined-app/src/routes/payments.ts
import { Router } from 'express';
import type { Router as ExpressRouter } from 'express'

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

const router: ExpressRouter = Router();

// This endpoint will catch POST requests sent to /webhooks/flutterwave
router.post('/webhooks/flutterwave', async (req, res) => {
    try {
        // 1. Verify the request is genuinely from Flutterwave
        const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
        const signature = req.headers['verif-hash'];

        if (!signature || signature !== secretHash) {
            //   logger.warn('⚠️ Unauthorized Flutterwave webhook attempt blocked.');
            console.log('⚠️ Unauthorized Flutterwave webhook attempt blocked. ')
            return res.status(401).json({ error: 'Unauthorized signature' });
        }

        const payload = req.body;
        // logger.info(`📡 Flutterwave Webhook received for event: ${payload.event}`);
        console.log(`📡 Flutterwave Webhook received for event: ${payload.event}`)

        // 2. Handle the specific payment event
        if (payload.event === 'charge.completed') {
            const { status, tx_ref, amount, customer } = payload.data;

            if (status === 'successful') {
                // logger.info(`✅ Payment successful! Ref: ${tx_ref} | Amount: ${amount} | Customer: ${customer?.email}`);
                console.log(`✅ Payment successful! Ref: ${tx_ref} | Amount: ${amount} | Customer: ${customer?.email}`)

                // Update your database here
                // await prisma.invoice.update({
                //   where: { reference: tx_ref },
                //   data: { status: 'PAID' }
                // });
            }
        }

        // 3. ALWAYS return a 200 OK immediately so Flutterwave stops retrying
        return res.status(200).send('Webhook processed successfully');

    } catch (error) {
        // logger.error('❌ Error handling webhook execution:', error);
        console.error('❌ Error handling webhook execution:', error)
        return res.status(500).json({ error: 'Internal processing error' });
    }
});

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

export { router as paymentRouter }