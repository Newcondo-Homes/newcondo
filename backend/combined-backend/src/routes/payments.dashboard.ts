// backend/combined-backend/src/routes/payments.dashboard.ts
// Dashboard money features, mounted INSIDE the existing payments router
// (routes/payments.ts adds: router.use(paymentsDashboardRouter)) so the
// frontend keeps a single /api/v1/payments/* surface.
import { Router, type Router as ExpressRouter } from "express";
import { authMiddleware } from "@newcondo/backend-shared";
import {
  listBankAccounts, addBankAccount, setDefaultBankAccount, deleteBankAccount,
  requestBankOtp, verifyBankOtp,
  buildReceiptData, generateReceiptPdf,
  quoteRent, initiateRent,
  getWallet, withdraw, setAutoPayout,
} from "@newcondo/payment-service";

const router: ExpressRouter = Router();

// ---- payout bank accounts (user-managed; virtual accounts are AUTO-created,
//      so there is deliberately NO create-VA endpoint) ----
router.get("/bank-accounts", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await listBankAccounts(req.user!.id) }); } catch (e) { next(e); }
});
// Sensitive bank operations require a fresh OTP: request one (branded email),
// then pass `otp` in the add / change-default body.
router.post("/bank-accounts/request-otp", authMiddleware, async (req, res, next) => {
  try { await requestBankOtp(req.user!.id, req.user!.email, req.user!.name); res.json({ success: true }); } catch (e) { next(e); }
});
router.post("/bank-accounts", authMiddleware, async (req, res, next) => {
  try {
    const { bankName, bankCode, accountNumber, otp } = req.body ?? {};
    await verifyBankOtp(req.user!.id, String(otp ?? ""));
    res.status(201).json({ success: true, data: await addBankAccount(req.user!.id, { bankName, bankCode, accountNumber }) });
  } catch (e) { next(e); }
});
router.patch("/bank-accounts/:id/default", authMiddleware, async (req, res, next) => {
  try {
    await verifyBankOtp(req.user!.id, String(req.body?.otp ?? ""));
    res.json({ success: true, data: await setDefaultBankAccount(req.params.id, req.user!.id) });
  } catch (e) { next(e); }
});
router.delete("/bank-accounts/:id", authMiddleware, async (req, res, next) => {
  try { await deleteBankAccount(req.params.id, req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
});

// ---- receipts (ownership enforced in the service) ----
router.get("/:paymentId/receipt", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await buildReceiptData(req.params.paymentId, req.user!.id) }); } catch (e) { next(e); }
});
router.get("/:paymentId/receipt.pdf", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await generateReceiptPdf(req.params.paymentId, req.user!.id) }); } catch (e) { next(e); }
});

// ---- renter rent checkout (escrow + double-booking lock) ----
// unitNumber = PropertyUnit.unitNumber ("Main unit" for SINGLE_UNIT properties)
router.get("/rent/quote", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await quoteRent(String(req.query.propertyId), String(req.query.unitNumber)) }); } catch (e) { next(e); }
});
router.post("/rent/initiate", authMiddleware, async (req, res, next) => {
  try {
    const { propertyId, unitNumber, shareCode } = req.body ?? {};
    res.json({ success: true, data: await initiateRent({ propertyId, unitNumber, shareCode, renterId: req.user!.id, renterEmail: req.user!.email }) });
  } catch (e) { next(e); }
});
// NOTE: the confirm side is webhook-driven — flutterwave.webhook.ts must call
// confirmRentPaid(tx_ref) when a charge with a NC-RENT-* flutterwaveRef verifies.

// ---- wallet: balances, withdraw (Flutterwave transfer to default bank), auto-payout ----
router.get("/wallet", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await getWallet(req.user!.id) }); } catch (e) { next(e); }
});
router.post("/wallet/withdraw", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await withdraw(req.user!.id, Number(req.body?.amount)) }); } catch (e) { next(e); }
});
router.patch("/wallet/auto-payout", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await setAutoPayout(req.user!.id, req.body?.mode) }); } catch (e) { next(e); }
});
// Transfer webhook: flutterwave.webhook.ts must call settleWithdrawal(reference, ok)
// on transfer.completed / transfer.failed events (NC-WD-* references).

// Renter escrow VA — idempotent; creates the Flutterwave permanent virtual
// account from the user's BVN (400 with a clear message when BVN is missing).
router.post("/renter-va/ensure", authMiddleware, async (req, res, next) => {
  try {
    const { ensureRenterVirtualAccount } = await import("@newcondo/payment-service");
    res.json({ success: true, data: await ensureRenterVirtualAccount({ userId: req.user!.id, bvn: req.body?.bvn }) });
  } catch (e) { next(e); }
});

export { router as paymentsDashboardRouter };
