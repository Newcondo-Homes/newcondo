// backend/combined-backend/src/routes/properties.ts
// Mounted at /api/v1/properties. Imports through the @newcondo/property-service
// barrel — same pattern as payments.ts uses @newcondo/payment-service.
import { Router, type Router as ExpressRouter } from "express";
import { authMiddleware, requireRole } from "@newcondo/backend-shared";
import {
  browseProperties,
  listTenants,
  getTenantDetailService,
  createTenantInvite,
  validateTenantInvite,
  acceptTenantInvite,
  createProperty,
  listUnmarkedProperties
} from "@newcondo/property-service";
import { publishNotification } from "@newcondo/backend-shared";

const router: ExpressRouter = Router();
const listerOnly = [authMiddleware, requireRole(["OWNER", "AGENT", "ADMIN"])] as const;

// GET /api/v1/properties/browse — PUBLIC search grid (only PUBLISHED +
// boundaryVerified + admin-APPROVED ever returned; 60s Redis cache inside).
router.get("/browse", async (req, res, next) => {
  try {
    const q = req.query;
    const data = await browseProperties({
      q: q.q as string | undefined, state: q.state as string | undefined,
      city: q.city as string | undefined,
      type: q.type as string | undefined,
      minPrice: q.minPrice ? Number(q.minPrice) : undefined,
      maxPrice: q.maxPrice ? Number(q.maxPrice) : undefined,
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// ---- tenants (dashboard "Tenants" card; lister-only, ownership re-checked in service) ----
router.get("/:propertyId/tenants", ...listerOnly, async (req, res, next) => {
  try { res.json({ success: true, data: await listTenants(req.params.propertyId, req.user!.id) }); } catch (e) { next(e); }
});
router.get("/tenants/:rentalId", ...listerOnly, async (req, res, next) => {
  try { res.json({ success: true, data: await getTenantDetailService(req.params.rentalId, req.user!.id) }); } catch (e) { next(e); }
});

// ---- tenant invite links (renter onboarding is invite-only) ----
router.post("/:propertyId/tenant-invites", ...listerOnly, async (req, res, next) => {
  try {
    const invite = await createTenantInvite({ propertyId: req.params.propertyId, inviterId: req.user!.id, unitId: req.body?.unitId });
    res.status(201).json({ success: true, data: invite });
  } catch (e) { next(e); }
});
// PUBLIC — the /tenant-invite/[token] onboarding page fetches context pre-auth
router.get("/tenant-invites/:token", async (req, res, next) => {
  try { res.json({ success: true, data: await validateTenantInvite(req.params.token) }); } catch (e) { next(e); }
});
// Called right after the invited renter registers + signs in
router.post("/tenant-invites/accept", authMiddleware, async (req, res, next) => {
  try {
    const result = await acceptTenantInvite(String(req.body?.token ?? ""), req.user!.id);
    await publishNotification({
      userId: result.inviterId, kind: "tenant", title: "A tenant joined Newcondo",
      body: `${req.user!.name ?? "Your tenant"} onboarded via your invite link${result.unitNumber ? ` (${result.unitNumber})` : ""}.`,
      to: `/properties/${result.propertyId}`, entityType: "rental", entityId: result.rental.id,
    });
    res.status(201).json({ success: true, data: result.rental });
  } catch (e) { next(e); }
});


// create lising
router.post("/properties", authMiddleware, requireRole(["OWNER", "AGENT"]), async (req, res, next) => {
  try {
    const data = await createProperty(req.user!.id, req.body ?? {});
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

// Properties this user may still request marking for (unmarked only) —
// feeds the Property dropdown in the Request-marking wizard.
router.get("/properties/unmarked", authMiddleware, requireRole(["OWNER", "AGENT"]), async (req, res, next) => {
  try {
    res.json({ success: true, data: await listUnmarkedProperties(req.user!.id) });
  } catch (e) { next(e); }
});

export { router as propertyRouter };
