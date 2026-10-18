// backend/combined-backend/src/routes/referrals.ts — mounted at /api/v1/referrals
// ============================================================
// Referrals v2 (spec §13). Existing endpoints kept (/stats /invite
// /leaderboard /active-areas) so the current page keeps working; new ones
// feed the programs / credit / milestone panels.
//   GET  /me                       code, link, stats, credit, caps, milestones
//   GET  /me/referrals?page=&status=
//   GET  /me/ledger?page=&status=
//   GET  /programs                 rendered from rules.ts (no literals in UI)
//   GET  /campaigns/sprint         public, cached 30s
//   POST /code/apply   {code}      onboarding only
//   POST /service-credits/:ledgerId/redeem {propertyId, preferredWindow}
//   GET  /public/:code             PUBLIC — /r/[code] page: masked referrer + welcome reward
//   POST /click/:code              PUBLIC — ReferralTracker on /r/[code] calls this
//   Admin: GET /admin/rules · /admin/exposure · /admin/fraud-queue · /admin/ledger
//          POST /admin/:id/clear-hold · /admin/:id/void
// Never returns a referee's contact details or what they paid.
// ============================================================
import { Router, type Router as ExpressRouter } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware, requireRole, ACTIVE_AREAS, Referrals } from "@newcondo/backend-shared";
import { getReferralStats, recordInvite, getLeaderboard } from "@newcondo/referral-service";
import { requestService } from "@newcondo/vendor-service";

const router: ExpressRouter = Router();
const admin = [authMiddleware, requireRole(["ADMIN"])] as const;
const publicLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false });
const applyLimiter = rateLimit({ windowMs: 15 * 60_000, max: 10, standardHeaders: true, legacyHeaders: false });
const pageOf = (q: unknown) => Math.max(1, Number(q) || 1);

/* ---- existing ---- */
router.get("/stats", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await getReferralStats(req.user!.id) }); } catch (e) { next(e); }
});
router.post("/invite", authMiddleware, async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await recordInvite(req.user!.id, String(req.body?.email ?? "")) }); } catch (e) { next(e); }
});
router.get("/leaderboard", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await getLeaderboard({ page: req.query.page ? Number(req.query.page) : undefined, pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined, requesterId: req.user!.id }) }); } catch (e) { next(e); }
});
router.get("/active-areas", async (_req, res) => {
  res.json({ success: true, data: ACTIVE_AREAS });
});

/* ---- v2: the referrer's own data ---- */
router.get("/me", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await Referrals.referralOverview(req.user!.id) }); } catch (e) { next(e); }
});
router.get("/me/referrals", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await Referrals.referralList(req.user!.id, { page: pageOf(req.query.page), status: req.query.status ? String(req.query.status) : undefined }) }); } catch (e) { next(e); }
});
router.get("/me/ledger", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await Referrals.referralLedgerList(req.user!.id, { page: pageOf(req.query.page), status: req.query.status ? String(req.query.status) : undefined }) }); } catch (e) { next(e); }
});
router.get("/programs", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await Referrals.programsFor(req.user!.id, String(req.user!.role)) }); } catch (e) { next(e); }
});
router.get("/campaigns/sprint", async (_req, res, next) => {
  try { res.set("Cache-Control", "public, max-age=30"); res.json({ success: true, data: await Referrals.sprintStatus() }); } catch (e) { next(e); }
});
router.get("/invited-by", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: { label: await Referrals.invitedByLabel(req.user!.id) } }); } catch (e) { next(e); }
});
router.post("/code/apply", applyLimiter, authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await Referrals.applyReferralCode(req.user!.id, String(req.body?.code ?? "")) }); } catch (e) { next(e); }
});
router.post("/service-credits/:ledgerId/redeem", authMiddleware, requireRole(["OWNER"]), async (req, res, next) => {
  try {
    res.json({ success: true, data: await Referrals.redeemServiceCredit({
      userId: req.user!.id, ledgerId: req.params.ledgerId, propertyId: String(req.body?.propertyId ?? ""),
      preferredWindow: req.body?.preferredWindow ? String(req.body.preferredWindow) : undefined,
      createRequest: (a) => requestService(a) as Promise<{ id: string }>,
    }) });
  } catch (e) { next(e); }
});

/* ---- public: /r/[code] invitation page lookup (no auth, cached 60s) ---- */
router.get("/public/:code", publicLimiter, async (req, res, next) => {
  try {
    const data = await Referrals.publicInvitation(req.params.code);
    res.set("Cache-Control", "public, max-age=60");
    res.status(data.valid ? 200 : 404).json(data);
  } catch (e) { next(e); }
});

/* ---- public click tracking ---- */
router.post("/click/:code", publicLimiter, async (req, res, next) => {
  try {
    const out = await Referrals.recordReferralClick(req.params.code, { ip: req.ip, device: String(req.headers["x-device-id"] ?? req.headers["user-agent"] ?? "") });
    res.json({ success: true, data: out });
  } catch (e) { next(e); }
});

/* ---- admin ---- */
router.get("/admin/rules", ...admin, async (_req, res, next) => {
  try { res.json({ success: true, data: await Referrals.adminRules() }); } catch (e) { next(e); }
});
router.get("/admin/exposure", ...admin, async (_req, res, next) => {
  try { res.json({ success: true, data: await Referrals.adminExposure() }); } catch (e) { next(e); }
});
router.get("/admin/fraud-queue", ...admin, async (req, res, next) => {
  try { res.json({ success: true, data: await Referrals.adminFraudQueue(pageOf(req.query.page)) }); } catch (e) { next(e); }
});
router.get("/admin/ledger", ...admin, async (req, res, next) => {
  try { res.json({ success: true, data: await Referrals.adminLedgerSearch({ userId: req.query.userId as string, ruleId: req.query.ruleId as string, status: req.query.status as string, page: pageOf(req.query.page) }) }); } catch (e) { next(e); }
});
router.post("/admin/:id/clear-hold", ...admin, async (req, res, next) => {
  try { res.json({ success: true, data: await Referrals.clearFraudHold(req.params.id) }); } catch (e) { next(e); }
});
router.post("/admin/:id/void", ...admin, async (req, res, next) => {
  try { await Referrals.voidReferral(req.params.id, String(req.body?.reason ?? "Voided by admin")); res.json({ success: true }); } catch (e) { next(e); }
});

export { router as referralRouter };
