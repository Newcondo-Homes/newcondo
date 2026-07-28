// backend/combined-backend/src/routes/referrals.ts — mounted at /api/v1/referrals
import { Router, type Router as ExpressRouter } from "express";
import { authMiddleware } from "@newcondo/backend-shared";
import { getReferralStats, recordInvite, getLeaderboard } from "@newcondo/referral-service";
import { ACTIVE_AREAS } from "@newcondo/backend-shared"; // constants/business

const router: ExpressRouter = Router();

router.get("/stats", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await getReferralStats(req.user!.id) }); } catch (e) { next(e); }
});
router.post("/invite", authMiddleware, async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await recordInvite(req.user!.id, String(req.body?.email ?? "")) }); } catch (e) { next(e); }
});
// Leaderboard — paginated (page/pageSize); requesterId lets the UI show "you"
router.get("/leaderboard", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await getLeaderboard({ page: req.query.page ? Number(req.query.page) : undefined, pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined, requesterId: req.user!.id }) }); } catch (e) { next(e); }
});
// Active coverage areas — straight from constants/business.ts (single source of truth)
router.get("/active-areas", async (_req, res) => {
  res.json({ success: true, data: ACTIVE_AREAS });
});
// attachReferral(code, userId) is called inside auth register (?ref=CODE);
// rewardOnFirstTransaction(payerId) is called from flutterwave.webhook.ts.

export { router as referralRouter };
