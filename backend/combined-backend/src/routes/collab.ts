// backend/combined-backend/src/routes/collab.ts
// Share links, sub-agent promotion requests, owner→agent invites.
// Mounted at /api/v1 root (mountRoute("/", collabRouter)) — paths below are
// absolute so the frontend has one obvious URL per feature.
import { Router, type Router as ExpressRouter } from "express";
import { authMiddleware, requireRole } from "@newcondo/backend-shared";
import {
  getOrCreateShareLink, resolveShareLink,
  requestPromotion, listPromotionRequests, approvePromotion, declinePromotion, subAgentEffectiveRate,
  createAgentInvite, validateAgentInvite, acceptAgentInvite, listLinkedOwners,
} from "@newcondo/property-service";

const router: ExpressRouter = Router();
const lister = [authMiddleware, requireRole(["OWNER", "AGENT", "ADMIN"])] as const;
const agent = [authMiddleware, requireRole(["AGENT", "ADMIN"])] as const;
const owner = [authMiddleware, requireRole(["OWNER", "ADMIN"])] as const;

/* ---- share links ---- */
// Lister "Share" button → SHARE link; approved sub-agent "Copy link" → PROMO link
router.post("/properties/:propertyId/share-link", authMiddleware, async (req, res, next) => {
  try {
    const kind = req.body?.kind === "PROMO" ? "PROMO" : "SHARE";
    res.status(201).json({ success: true, data: await getOrCreateShareLink({ propertyId: req.params.propertyId, creatorId: req.user!.id, kind }) });
  } catch (e) { next(e); }
});
// PUBLIC — the /share/[shareCode] page resolves property + attribution
router.get("/share/:code", async (req, res, next) => {
  try { res.json({ success: true, data: await resolveShareLink(req.params.code) }); } catch (e) { next(e); }
});

/* ---- sub-agent promotion requests ---- */
router.post("/properties/:propertyId/promotion-requests", ...agent, async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await requestPromotion({ propertyId: req.params.propertyId, subAgentId: req.user!.id }) }); } catch (e) { next(e); }
});
router.get("/promotion-requests", ...lister, async (req, res, next) => {
  try { res.json({ success: true, data: { requests: await listPromotionRequests(req.user!.id), splitPct: Math.round(subAgentEffectiveRate() * 1000) / 10 } }); } catch (e) { next(e); }
});
router.post("/promotion-requests/:id/approve", ...lister, async (req, res, next) => {
  try { res.json({ success: true, data: await approvePromotion(req.params.id, req.user!.id) }); } catch (e) { next(e); }
});
router.post("/promotion-requests/:id/decline", ...lister, async (req, res, next) => {
  try { res.json({ success: true, data: await declinePromotion(req.params.id, req.user!.id, req.body?.reason) }); } catch (e) { next(e); }
});

/* ---- owner → agent invites ---- */
router.post("/agent-invites", ...owner, async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await createAgentInvite({ ownerId: req.user!.id, agentEmail: req.body?.agentEmail }) }); } catch (e) { next(e); }
});
router.get("/agent-invites/owners", ...agent, async (req, res, next) => {
  try { res.json({ success: true, data: await listLinkedOwners(req.user!.id) }); } catch (e) { next(e); }
});
router.get("/agent-invites/:token", async (req, res, next) => { // PUBLIC — invite page context
  try { res.json({ success: true, data: await validateAgentInvite(req.params.token) }); } catch (e) { next(e); }
});
router.post("/agent-invites/accept", ...agent, async (req, res, next) => {
  try { res.json({ success: true, data: await acceptAgentInvite(String(req.body?.token ?? ""), req.user!.id) }); } catch (e) { next(e); }
});

export { router as collabRouter };
