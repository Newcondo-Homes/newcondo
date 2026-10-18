// backend/combined-backend/src/routes/payments.billing.ts
// ============================================================
// MONEY CORE routes, mounted at /api/v1/payments (same surface as the rest of
// payments, so the frontend still has ONE base path).
//
//   Owner billing (per-property plans)
//     GET    /billing/summary                       every property + next bill
//     GET    /billing/properties/:id                one property's plan state
//     GET    /billing/properties/:id/quote?tier=    prorated price for a tier
//     POST   /billing/properties/:id/plan  {tier}   charge saved card, or return
//                                                   an Inline checkout payload
//     POST   /billing/properties/:id/discontinue    stop at period end
//     POST   /billing/properties/:id/resume
//     POST   /billing/properties/:id/tier  {tier}   scheduled for next renewal
//   Wallet (ledger)
//     GET    /wallet/ledger?page=                   statement
//     GET    /wallet/funding-account?reference=     where to send a transfer
//     GET    /wallet/withdraw/quote?amount=         ++ FLW FEES: fee + what lands in the bank
//   Admin
//     GET    /admin/money/suspense                  unmatched inbound transfers
//     GET    /admin/money/reconcile                 run reconciliation now
//     POST   /admin/money/rent/:paymentId/refund    refund rent still in escrow
//     POST   /admin/money/vendors/jobs/:id/pay      pay a vendor now
//
// Every handler takes the user from the JWT (authMiddleware) — ownership is
// enforced again inside the services, never trusted from the body.
// ============================================================
import { Router, type Router as ExpressRouter } from "express";
import { authMiddleware, requireRole, listSuspense, reconcileLedger } from "@newcondo/backend-shared";
import {
  billingSummary, propertyPlanFor, quotePropertyPlan, startPropertyPlan,
  discontinuePropertyPlan, resumePropertyPlan, changePropertyTier,
  getWalletStatement, getFundingAccount, refundHeldRent, payVendorForJob, quoteWithdrawal,
} from "@newcondo/payment-service";

const router: ExpressRouter = Router();
const owner = [authMiddleware, requireRole(["OWNER"])] as const;
const admin = [authMiddleware, requireRole(["ADMIN"])] as const;
const tierOf = (v: unknown) => String(v ?? "").toUpperCase();

/* ---- owner billing ---- */
router.get("/billing/summary", ...owner, async (req, res, next) => {
  try { res.json({ success: true, data: await billingSummary(req.user!.id) }); } catch (e) { next(e); }
});
router.get("/billing/properties/:id", ...owner, async (req, res, next) => {
  try { res.json({ success: true, data: await propertyPlanFor(req.user!.id, req.params.id) }); } catch (e) { next(e); }
});
router.get("/billing/properties/:id/quote", ...owner, async (req, res, next) => {
  try { res.json({ success: true, data: await quotePropertyPlan(req.user!.id, req.params.id, tierOf(req.query.tier)) }); } catch (e) { next(e); }
});
router.post("/billing/properties/:id/plan", ...owner, async (req, res, next) => {
  try {
    res.json({ success: true, data: await startPropertyPlan({ ownerId: req.user!.id, email: req.user!.email, propertyId: req.params.id, tier: tierOf(req.body?.tier) }) });
  } catch (e) { next(e); }
});
router.post("/billing/properties/:id/discontinue", ...owner, async (req, res, next) => {
  try { res.json({ success: true, data: await discontinuePropertyPlan(req.user!.id, req.params.id) }); } catch (e) { next(e); }
});
router.post("/billing/properties/:id/resume", ...owner, async (req, res, next) => {
  try { res.json({ success: true, data: await resumePropertyPlan(req.user!.id, req.params.id) }); } catch (e) { next(e); }
});
router.post("/billing/properties/:id/tier", ...owner, async (req, res, next) => {
  try { res.json({ success: true, data: await changePropertyTier(req.user!.id, req.params.id, tierOf(req.body?.tier)) }); } catch (e) { next(e); }
});

/* ---- wallet ledger ---- */
router.get("/wallet/ledger", authMiddleware, async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1, pageSize = Number(req.query.pageSize) || 20;
    res.json({ success: true, data: await getWalletStatement(req.user!.id, page, pageSize) });
  } catch (e) { next(e); }
});
router.get("/wallet/funding-account", authMiddleware, async (req, res, next) => {
  try {
    const ref = typeof req.query.reference === "string" && /^NC-[A-Z]+-[A-Za-z0-9-]+$/.test(req.query.reference) ? req.query.reference : undefined;
    res.json({ success: true, data: await getFundingAccount(req.user!.id, ref) });
  } catch (e) { next(e); }
});

router.get("/wallet/withdraw/quote", authMiddleware, (req, res) => {
  res.json({ success: true, data: quoteWithdrawal(Number(req.query.amount) || 0) });
});

/* ---- admin ---- */
router.get("/admin/money/suspense", ...admin, async (req, res, next) => {
  try { res.json({ success: true, data: await listSuspense({ page: Number(req.query.page) || 1 }) }); } catch (e) { next(e); }
});
router.get("/admin/money/reconcile", ...admin, async (_req, res, next) => {
  try { res.json({ success: true, data: await reconcileLedger() }); } catch (e) { next(e); }
});
router.post("/admin/money/rent/:paymentId/refund", ...admin, async (req, res, next) => {
  try { await refundHeldRent(req.params.paymentId, String(req.body?.reason ?? "Dispute upheld"), req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
});
router.post("/admin/money/vendors/jobs/:id/pay", ...admin, async (req, res, next) => {
  try { res.json({ success: true, data: await payVendorForJob(req.params.id, req.user!.id) }); } catch (e) { next(e); }
});

export { router as paymentsBillingRouter };
