// backend/combined-backend/src/routes/services.ts — mounted at /api/v1/services
import { Router, type Router as ExpressRouter } from "express";
import { authMiddleware, requireRole } from "@newcondo/backend-shared";
import { getServicesOverview, requestService, rescheduleJob, reportJobIssue } from "@newcondo/vendor-service";

const router: ExpressRouter = Router();
const owner = [authMiddleware, requireRole(["OWNER", "AGENT", "ADMIN"])] as const;

router.get("/overview", ...owner, async (req, res, next) => {
  try { res.json({ success: true, data: await getServicesOverview(req.user!.id) }); } catch (e) { next(e); }
});
router.post("/request", ...owner, async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await requestService({ ownerId: req.user!.id, propertyId: req.body.propertyId, serviceType: req.body.serviceType, notes: req.body.notes }) }); } catch (e) { next(e); }
});
router.post("/jobs/:id/reschedule", ...owner, async (req, res, next) => {
  try { res.json({ success: true, data: await rescheduleJob(req.params.id, req.user!.id) }); } catch (e) { next(e); }
});
router.post("/jobs/:id/issue", ...owner, async (req, res, next) => {
  try { res.json({ success: true, data: await reportJobIssue(req.params.id, req.user!.id, String(req.body?.reason ?? "")) }); } catch (e) { next(e); }
});

export { router as servicesRouter };
