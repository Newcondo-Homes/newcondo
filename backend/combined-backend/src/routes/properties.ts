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
  listUnmarkedProperties,
  listMyProperties,
  requestPromotion,
  presignPropertyPhotos,
  attachPropertyPhotos,
  listPropertyPhotos,
  deletePropertyPhoto,
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


// Create a listing. Always lands as DRAFT + boundaryVerified:false, so it
// cannot appear in Browse until it's marked AND admin-approved.
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

// Every listing this user owns or is the listing agent for, DRAFT included.
// This is what My Properties reads — without it a freshly-created listing
// never appears in the dashboard even though the row exists in the DB.
router.get("/properties/mine", authMiddleware, requireRole(["OWNER", "AGENT"]), async (req, res, next) => {
  try {
    res.json({ success: true, data: await listMyProperties(req.user!.id) });
  } catch (e) { next(e); }
});


/* ---------------- property photos (S3 direct upload) ----------------
   The browser PUTs straight to S3 with a presigned url, then tells us the
   keys. Bytes never touch Express, so there's no body-size limit to tune
   and a slow mobile upload can't hold a Node socket open. */

router.post("/properties/:id/photos/presign", authMiddleware, requireRole(["OWNER", "AGENT"]), async (req, res, next) => {
  try {
    const data = await presignPropertyPhotos(req.params.id, req.user!.id, req.body?.files ?? []);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post("/properties/:id/photos", authMiddleware, requireRole(["OWNER", "AGENT"]), async (req, res, next) => {
  try {
    const photos = await attachPropertyPhotos(req.params.id, req.user!.id, req.body?.keys ?? []);
    res.json({ success: true, data: { photos } });
  } catch (e) { next(e); }
});

// Signed, time-limited GET urls — the bucket itself stays private.
router.get("/properties/:id/photos", authMiddleware, async (req, res, next) => {
  try {
    res.json({ success: true, data: await listPropertyPhotos(req.params.id) });
  } catch (e) { next(e); }
});

router.delete("/properties/:id/photos/:photoId", authMiddleware, requireRole(["OWNER", "AGENT"]), async (req, res, next) => {
  try {
    const photos = await deletePropertyPhoto(req.params.id, req.user!.id, req.params.photoId);
    res.json({ success: true, data: { photos } });
  } catch (e) { next(e); }
});

// Sub-agent taps "Promote" on a Browse property.
//   PUBLIC / autoApproveAgents → 200 { status: "APPROVED", promoUrl, splitPct }
//   PERMISSION_BASED / REQUEST_BASED → 200 { status: "PENDING" }
//   RESTRICTED → 403 (surfaced in the UI as "the listing agent has restricted…")
//   already promoting / pending / at sub-agent cap → 409
// Import from property-service: `requestPromotion`.
router.post("/properties/:id/promote", authMiddleware, requireRole(["AGENT"]), async (req, res, next) => {
  try {
    const data = await requestPromotion({ propertyId: req.params.id, subAgentId: req.user!.id });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});


export { router as propertyRouter };
