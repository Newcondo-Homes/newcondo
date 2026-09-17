// backend/combined-app/src/routes/payments.ts
import { Router } from 'express';
import type { Router as ExpressRouter } from 'express'
import {
    authMiddleware,
    sendResponse,
} from "@newcondo/backend-shared"

import {
    initiateSubscription,
    createFreeRenterSubscription,
    redeemReviewAccess,
} from "@newcondo/payment-service"

// onboarding services
import {
    getOnboardingState,
    assertCanInitiate,
    changeAccountType,
    resetPendingOnboarding,
} from "@newcondo/payment-service"

// flutterwave webhook
import {
    flutterwaveWebhook
} from "@newcondo/payment-service"
import { prisma, SubscriptionPlan, Role } from "@newcondo/db";

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


// GET /api/v1/payments/subscriptions/onboarding-state
// Frontend calls this on entering /onboarding when the user is authenticated.
// Returns which step to resume from and whether to redirect to dashboard.
router.get("/subscriptions/onboarding-state", authMiddleware, async (req, res) => {
    try {
        const state = await getOnboardingState(req.user!.id);
        return res.status(200).json({ success: true, data: state });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/v1/payments/subscriptions/onboarding/account-type
// User wants to change their role mid-onboarding (only allowed while PENDING).
router.post("/subscriptions/onboarding/account-type", authMiddleware, async (req, res) => {
    try {
        const { newRole } = req.body as { newRole: Role };
        const result = await changeAccountType(req.user!.id, newRole);
        if (!result.ok) {
            return res.status(409).json({ success: false, error: result.reason });
        }
        return res.status(200).json({ success: true });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/v1/payments/subscriptions/onboarding/reset
// User wants to pick a different plan — wipes the PENDING record so they
// can re-initiate. Refuses if subscription is already active.
router.post("/subscriptions/onboarding/reset", authMiddleware, async (req, res) => {
    try {
        const result = await resetPendingOnboarding(req.user!.id);
        if (!result.ok) {
            return res.status(409).json({
                success: false,
                error: "Cannot reset an active subscription.",
            });
        }
        return res.status(200).json({ success: true });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/v1/payments/subscriptions/initiate — ADD the guard at the top
// Replace your existing initiate handler with this:
router.post("/subscriptions/initiate", authMiddleware, async (req, res) => {
    try {
        const { planType } = req.body as { planType: SubscriptionPlan };
        const userId = req.user!.id;

        if (!userId) {
            sendResponse(res, 401, "Unauthorized", null, { code: "AUTH_REQUIRED" });
            return;
        }

        if (!planType || !Object.values(SubscriptionPlan).includes(planType)) {
            return res.status(400).json({ success: false, error: "Invalid plan type" });
        }

        // Guard — stop a replay from charging an already-active customer
        const guard = await assertCanInitiate(userId);
        if (!guard.ok) {
            return res.status(409).json({
                success: false,
                code: "ALREADY_ACTIVE",
                error: guard.reason,
            });
        }

        const result = await initiateSubscription(userId, planType);
        return res.status(200).json({ success: true, data: result });

    } catch (err: any) {
        console.error("Subscription initiation error:", err.message);
        return res.status(400).json({ success: false, error: err.message });
    }
});


// GET /api/v1/payments/subscriptions/me
router.get("/subscriptions/me", authMiddleware, async (req, res) => {
    try {
        const userId = req.user!.id;

        if (!userId) {
            sendResponse(res, 401, "Unauthorized", null, { code: "AUTH_REQUIRED" });
            return;
        }
        const subscription = await prisma.subscription.findUnique({
            where: { userId: userId },
            include: {
                invoices: { orderBy: { createdAt: "desc" }, take: 5 },
            },
        });
        return res.status(200).json({ success: true, data: subscription });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/v1/payments/subscriptions/renter-signup
// Called automatically when a new renter registers — triggered from auth service
router.post("/subscriptions/renter-signup", authMiddleware, async (req, res) => {
    try {
        const subscription = await createFreeRenterSubscription(req.user!.id);
        return res.status(200).json({ success: true, data: subscription });
    } catch (err: any) {
        return res.status(400).json({ success: false, error: err.message });
    }
});




// POST /api/v1/payments/webhooks/flutterwave
// This endpoint will catch POST requests sent to /webhooks/flutterwave
// No auth — Flutterwave is not logged in. Self-verifies via verif-hash header.
// The flutterwaveWebhook handler contains all the logic.
router.post('/webhooks/flutterwave', flutterwaveWebhook);



// POST /api/v1/payments/subscriptions/review-access
// Platform app review (Meta / Google / Apple). Newcondo has no free tier, so a
// reviewer signing in with their own account dead-ends at the Flutterwave step
// and can never exercise the OAuth permission under review. This exchanges a
// backend-env code for a comped ACTIVE subscription at ₦0 — Flutterwave is
// never called, so live payments keep working for real customers throughout.
// Entirely disabled unless REVIEW_ACCESS_CODE is set. See reviewAccess.service.ts.
router.post("/subscriptions/review-access", authMiddleware, async (req, res) => {
    try {
        const userId = req.user!.id;

        if (!userId) {
            sendResponse(res, 401, "Unauthorized", null, { code: "AUTH_REQUIRED" });
            return;
        }

        const { code } = req.body as { code?: string };
        const result = await redeemReviewAccess(userId, String(code ?? ""));

        return res.status(200).json({ success: true, data: result });
    } catch (err: any) {
        // ServiceError from @newcondo/backend-shared carries a statusCode
        // (403 wrong code, 409 already subscribed, 429 throttled); anything
        // else falls back to 400 like the handlers around it.
        const status = err.statusCode ?? err.status ?? 400;
        return res.status(status).json({ success: false, error: err.message });
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