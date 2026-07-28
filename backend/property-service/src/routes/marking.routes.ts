/* ============================================================
   marking.routes — Express endpoints for property marking.
   Implements notebook Steps 5–9 server-side:
     • project the normalised polygon → GPS
     • compute centroid / bbox / fingerprint
     • duplicate-block via IoU against nearby marked properties
     • persist to the Prisma `Property` record
     • serve nearby marked polygons for the live-map overlays

   Mount in your service:
     import markingRoutes from "./routes/marking.routes";
     app.use("/api/marking", markingRoutes);

   The client (apps/platform) extracts the green polygon with
   green-extract.ts (OpenCV.js) OR drops a tap-pin, then POSTs the
   NORMALISED polygon + the map viewport bounds here. Doing projection
   + dedupe server-side keeps it authoritative and tamper-resistant.
   ============================================================ */

import { Router, type Request, type Response } from "express";
import type { Router as ExpressRouter } from "express";
// import { prisma } from "@newcondo/db";   // ← your shared Prisma client
import {
  polygonNormToGps,
  centroidOf,
  boundingBox,
  buildingFingerprint,
  checkDuplicate,
  type LatLng,
  type MapBounds,
  type PolygonNorm,
  type ExistingMark,
} from "../lib/marking-geo";

const router: ExpressRouter = Router();

const DUPLICATE_IOU_THRESHOLD = 0.3;

/* ---- validation helpers ----------------------------------------------------- */

function isBounds(b: unknown): b is MapBounds {
  const o = b as Record<string, unknown>;
  return (
    !!o &&
    ["north", "south", "east", "west"].every((k) => typeof o[k] === "number") &&
    (o.north as number) > (o.south as number) &&
    (o.east as number) > (o.west as number)
  );
}

function isPolygonNorm(p: unknown): p is PolygonNorm {
  return (
    Array.isArray(p) &&
    p.length >= 3 &&
    p.every(
      (v) =>
        Array.isArray(v) &&
        v.length === 2 &&
        v.every((n) => typeof n === "number" && n >= -0.001 && n <= 1.001)
    )
  );
}

/* ---- resolve the one-time marking link → property context ------------------- */
/* TODO: replace with a real lookup (MarkingLink table): expiry, single-use,
   the property being marked, and its city/area for the dedupe query. */
async function getMarkingContext(linkId: string): Promise<{ propertyId: string; city: string } | null> {
  // const link = await prisma.markingLink.findUnique({ where: { token: linkId } });
  // if (!link || link.usedAt || link.expiresAt < new Date()) return null;
  // return { propertyId: link.propertyId, city: link.property.city };
  return { propertyId: linkId, city: "Lagos" }; // placeholder
}

/* ---- load nearby already-marked polygons for dedupe ------------------------- */
/* In production store a bbox (north/south/east/west columns) per property and
   filter in SQL — or use PostGIS. Here we fetch candidates by city and prefilter
   by bbox in JS inside checkDuplicate(). */
async function loadNearbyMarks(city: string): Promise<ExistingMark[]> {
  // const rows = await prisma.property.findMany({
  //   where: { city, boundaryCoordinates: { not: null } },
  //   select: { id: true, boundaryCoordinates: true, boundaryBBox: true },
  // });
  // return rows.map((r) => ({
  //   id: r.id,
  //   polygon: r.boundaryCoordinates as unknown as LatLng[],
  //   bbox: (r.boundaryBBox as unknown as MapBounds) ?? undefined,
  // }));
  void city;
  return []; // placeholder
}

/* ============================================================
   POST /api/marking/:linkId/submit
   body: { boundaryNorm: [[nx,ny]...], bounds: MapBounds, images?: string[] }
   ============================================================ */
router.post("/:linkId/submit", async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;
    const { boundaryNorm, bounds, images } = req.body ?? {};

    if (!isPolygonNorm(boundaryNorm)) {
      return res.status(400).json({ error: "boundaryNorm must be ≥3 [nx,ny] vertices in [0,1]." });
    }
    if (!isBounds(bounds)) {
      return res.status(400).json({ error: "bounds must be { north>south, east>west }." });
    }

    const ctx = await getMarkingContext(linkId);
    if (!ctx) {
      return res.status(404).json({ error: "This marking link is invalid or has expired." });
    }

    // 1) project → GPS, derive centroid / bbox / fingerprint
    const gpsPolygon: LatLng[] = polygonNormToGps(boundaryNorm, bounds);
    const centroid = centroidOf(gpsPolygon);
    const bbox = boundingBox(gpsPolygon);
    const fingerprint = buildingFingerprint(centroid);

    // 2) duplicate-block (IoU ≥ threshold against nearby marks)
    const nearby = await loadNearbyMarks(ctx.city);
    const dup = checkDuplicate(gpsPolygon, nearby, DUPLICATE_IOU_THRESHOLD);
    if (dup.duplicate) {
      return res.status(409).json({
        error: "already_marked",
        message: "This building is already marked.",
        iou: Number(dup.iou.toFixed(3)),
        matchId: dup.matchId,
      });
    }

    // 3) persist (owner confirms before it goes live → boundaryVerified false)
    const record = {
      gpsCoordinates: JSON.stringify(centroid),
      boundaryCoordinates: gpsPolygon, // Prisma Json
      boundaryBBox: bbox, // Prisma Json (enables fast future dedupe)
      boundaryFingerprint: fingerprint,
      boundaryImages: Array.isArray(images) ? images : [],
      boundaryVerified: false,
      boundaryMarkedAt: new Date(),
    };

    // const property = await prisma.property.update({
    //   where: { id: ctx.propertyId },
    //   data: record,
    // });

    return res.status(200).json({
      ok: true,
      propertyId: ctx.propertyId,
      centroid,
      fingerprint,
      vertexCount: gpsPolygon.length,
      boundingBox: bbox,
      property: record, // remove once prisma.update is wired
    });
  } catch (err) {
    console.error("[marking submit]", err);
    return res.status(500).json({ error: "Failed to submit marking." });
  }
});

/* ============================================================
   GET /api/marking/nearby?north&south&east&west
   Returns marked polygons inside the viewport for the red-grey
   overlays a new user sees (notebook Step 9).
   ============================================================ */
router.get("/nearby", async (req: Request, res: Response) => {
  try {
    const north = Number(req.query.north);
    const south = Number(req.query.south);
    const east = Number(req.query.east);
    const west = Number(req.query.west);
    if (![north, south, east, west].every(Number.isFinite)) {
      return res.status(400).json({ error: "north, south, east, west query params required." });
    }

    // const rows = await prisma.property.findMany({
    //   where: {
    //     boundaryVerified: true,
    //     // bbox columns let Postgres filter the viewport directly:
    //     // boundaryNorth: { gte: south }, boundarySouth: { lte: north },
    //     // boundaryEast: { gte: west },  boundaryWest: { lte: east },
    //   },
    //   select: { id: true, boundaryCoordinates: true, title: true },
    // });
    // const marked = rows.map((r) => ({ id: r.id, label: r.title, polygon: r.boundaryCoordinates }));

    const marked: Array<{ id: string; label?: string; polygon: LatLng[] }> = []; // placeholder
    void [north, south, east, west];
    return res.status(200).json({ marked });
  } catch (err) {
    console.error("[marking nearby]", err);
    return res.status(500).json({ error: "Failed to load nearby marks." });
  }
});

export default router;
