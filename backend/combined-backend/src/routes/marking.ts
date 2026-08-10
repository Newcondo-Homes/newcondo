// backend/combined-backend/src/routes/marking.ts — mounted at /api/v1/marking
import { Router, type Router as ExpressRouter } from "express";
import { authMiddleware, requireRole } from "@newcondo/backend-shared";
import * as m from "@newcondo/marking-service";
 import { 
  initiateMarkingPayment,
  getSavedCardForMarking,
  chargeMarkingWithSavedCard,
} from "@newcondo/marking-service";

const router: ExpressRouter = Router();
const lister = [authMiddleware, requireRole(["OWNER", "AGENT", "ADMIN"])] as const;
const agent = [authMiddleware, requireRole(["AGENT", "ADMIN"])] as const;

// owner/agent: create job (paid methods: call AFTER Flutterwave charge verifies)
router.post("/jobs", ...lister, async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await m.createMarkingJob({ ...req.body, requesterId: req.user!.id }) }); } catch (e) { next(e); }
});
router.get("/jobs/mine", ...lister, async (req, res, next) => {
  try { res.json({ success: true, data: await m.ownerJobs(req.user!.id) }); } catch (e) { next(e); }
});
router.post("/jobs/:id/confirm", ...lister, async (req, res, next) => {
  try { await m.confirmMarking(req.params.id, req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
});
router.post("/jobs/:id/dispute", ...lister, async (req, res, next) => {
  try { await m.disputeMarking(req.params.id, req.user!.id, String(req.body?.reason ?? "")); res.json({ success: true }); } catch (e) { next(e); }
});

// agent: queue + marking
router.get("/available-jobs", ...agent, async (req, res, next) => {
  try {
    res.json({ success: true, data: await m.availableJobs({
      city: req.query.city ? String(req.query.city) : undefined,
      state: req.query.state ? String(req.query.state) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    }) });
  } catch (e) { next(e); }
});

router.post("/queue/:jobId/join", ...agent, async (req, res, next) => {
  try { res.json({ success: true, data: await m.joinQueue(req.params.jobId, req.user!.id) }); } catch (e) { next(e); }
});
router.post("/jobs/:id/photos/presign", ...agent, async (req, res, next) => {
  try { res.json({ success: true, data: await m.presignMarkingPhotos(req.params.id, req.user!.id, req.body?.photos ?? []) }); } catch (e) { next(e); }
});
router.post("/jobs/:id/complete", ...agent, async (req, res, next) => {
  try { res.json({ success: true, data: await m.completeMarking({ jobId: req.params.id, agentId: req.user!.id, polygonNorm: req.body.polygonNorm, mapBounds: req.body.mapBounds, photoKeys: req.body.photoKeys ?? [] }) }); } catch (e) { next(e); }
});
// Paid methods (BROADCAST/NEWCONDO): pay first via Flutterwave, then the
// NC-MKFEE-* webhook creates + broadcasts the job (confirmMarkingFeePaid).
router.post("/jobs/initiate-payment", authMiddleware, requireRole(["OWNER", "AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const { propertyId, method, contactName, contactPhone, accessNotes } = req.body ?? {};
    res.json({ success: true, data: await initiateMarkingPayment({ propertyId, method, contactName, contactPhone, accessNotes, requesterId: req.user!.id, requesterEmail: req.user!.email }) });
  } catch (e) { next(e); }
});


// Does the caller have a card we can charge without showing a checkout?
// The UI calls this when the paid-method step opens so it can render either
// "Pay ₦25,000 with saved card ••••4242" or the Inline checkout button.
router.get("/saved-card", authMiddleware, requireRole(["OWNER", "AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    res.json({ success: true, data: await getSavedCardForMarking(req.user!.id) });
  } catch (e) { next(e); }
});

// Charge the saved card server-to-server. Returns { ok:true, jobId } on
// success (the job is already live — confirmMarkingFeePaid ran inline), or
// { ok:false, failureCode, failureMessage, retryWithInline } so the client
// can show the right modal (insufficient funds vs declined card).
// NOTE: never throws on a declined charge — a decline is a 200 with ok:false,
// because it's an expected business outcome, not a server error.
router.post("/jobs/pay-with-saved-card", authMiddleware, requireRole(["OWNER", "AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const { propertyId, method, contactName, contactPhone, accessNotes } = req.body ?? {};
    const result = await chargeMarkingWithSavedCard({
      propertyId, method, contactName, contactPhone, accessNotes,
      requesterId: req.user!.id,
      requesterEmail: req.user!.email,
    });
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

// the building green → polygon extracted server-side → returns { polygonNorm,
// maskKey }. The client then calls /complete with that polygonNorm + mapBounds.
router.post("/jobs/:id/segment", ...agent, async (req, res, next) => {
  try { res.json({ success: true, data: await m.segmentBuilding({ screenshotKey: String(req.body.screenshotKey), geo: req.body.geo }) }); } catch (e) { next(e); }
});
router.get("/jobs/history", ...agent, async (req, res, next) => {
  try { res.json({ success: true, data: await m.agentHistory(req.user!.id) }); } catch (e) { next(e); }
});

export { router as markingRouter };
