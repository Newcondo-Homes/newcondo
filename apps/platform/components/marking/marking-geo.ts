/* ============================================================
   marking-geo — TypeScript port of the Colab marking algorithm.

   Mirrors newcondo_from_segmented_image.ipynb:
     • pixel / normalized ↔ GPS projection via map-viewport bounds
     • centroid, bounding box, SHA-256 building fingerprint
     • IoU duplicate detection (raster overlap, threshold 0.30)
     • DB payload shaped for the Prisma `Property` record

   This module is pure and isomorphic — the SAME functions run in the
   browser (suggest/preview) and on the Node/Express backend (the
   authoritative save). The only env-specific bit is the SHA-256 hash,
   which uses Web Crypto here; the backend file uses node:crypto.
   ============================================================ */

import { pointInPolygon, type LatLngLiteral } from "./marking-core";

/** GPS bounds of the map screenshot/viewport — from map.getBounds() in the live app. */
export interface MapBounds {
  north: number; // lat of TOP edge
  south: number; // lat of BOTTOM edge
  west: number; // lng of LEFT edge
  east: number; // lng of RIGHT edge
}

/** Polygon vertices normalised to [0,1] of the mask image — dimension-independent. */
export type PolygonNorm = Array<[number, number]>;

/* ---- projection (notebook Step 3 + Step 5) ---------------------------------- */

/** Normalised [0,1] vertex → GPS. nx runs west→east, ny runs north→south. */
export function normalizedToLatLng(nx: number, ny: number, b: MapBounds): LatLngLiteral {
  return {
    lat: b.north - ny * (b.north - b.south),
    lng: b.west + nx * (b.east - b.west),
  };
}

export function pixelToLatLng(px: number, py: number, imgW: number, imgH: number, b: MapBounds): LatLngLiteral {
  return normalizedToLatLng(px / imgW, py / imgH, b);
}

export function latLngToPixel(lat: number, lng: number, imgW: number, imgH: number, b: MapBounds) {
  return {
    x: Math.round(((lng - b.west) / (b.east - b.west)) * imgW),
    y: Math.round(((b.north - lat) / (b.north - b.south)) * imgH),
  };
}

/** Whole normalised polygon → GPS polygon (the value stored in boundaryCoordinates). */
export function polygonNormToGps(poly: PolygonNorm, b: MapBounds): LatLngLiteral[] {
  return poly.map(([nx, ny]) => normalizedToLatLng(nx, ny, b));
}

/* ---- centroid / bbox / fingerprint (notebook Step 7) ------------------------ */

export function centroidOf(poly: LatLngLiteral[]): LatLngLiteral {
  const n = poly.length || 1;
  return {
    lat: poly.reduce((s, p) => s + p.lat, 0) / n,
    lng: poly.reduce((s, p) => s + p.lng, 0) / n,
  };
}

export function boundingBox(poly: LatLngLiteral[]): MapBounds {
  const lats = poly.map((p) => p.lat);
  const lngs = poly.map((p) => p.lng);
  return { north: Math.max(...lats), south: Math.min(...lats), east: Math.max(...lngs), west: Math.min(...lngs) };
}

/** Matches the notebook's `f"{round(lat,6)},{round(lng,6)}"` key (no trailing zeros). */
export function fingerprintKey(c: LatLngLiteral): string {
  const r6 = (x: number) => String(Math.round(x * 1e6) / 1e6);
  return `${r6(c.lat)},${r6(c.lng)}`;
}

/** SHA-256 of the rounded centroid → first 16 hex chars (stable duplicate key). */
export async function buildingFingerprint(c: LatLngLiteral): Promise<string> {
  const data = new TextEncoder().encode(fingerprintKey(c));
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

/* ---- duplicate detection (notebook Step 8) ---------------------------------- */

/**
 * IoU of two GPS polygons by rasterising over their combined bounds.
 * res = grid resolution per side (256 ≈ the notebook's behaviour, fast in JS).
 */
export function polygonsIoU(a: LatLngLiteral[], b: LatLngLiteral[], res = 256): number {
  if (a.length < 3 || b.length < 3) return 0;
  const all = [...a, ...b];
  const north = Math.max(...all.map((p) => p.lat));
  const south = Math.min(...all.map((p) => p.lat));
  const east = Math.max(...all.map((p) => p.lng));
  const west = Math.min(...all.map((p) => p.lng));
  if (north === south || east === west) return 0;

  let inter = 0;
  let union = 0;
  for (let j = 0; j < res; j++) {
    const lat = north - ((j + 0.5) / res) * (north - south);
    for (let i = 0; i < res; i++) {
      const lng = west + ((i + 0.5) / res) * (east - west);
      const inA = pointInPolygon({ lat, lng }, a);
      const inB = pointInPolygon({ lat, lng }, b);
      if (inA || inB) union++;
      if (inA && inB) inter++;
    }
  }
  return union > 0 ? inter / union : 0;
}

export interface DuplicateResult {
  duplicate: boolean;
  index: number;
  iou: number;
}

/** True if the new polygon overlaps any existing polygon at ≥ threshold IoU. */
export function checkDuplicate(
  newPoly: LatLngLiteral[],
  dbPolys: LatLngLiteral[][],
  threshold = 0.3
): DuplicateResult {
  for (let i = 0; i < dbPolys.length; i++) {
    const iou = polygonsIoU(newPoly, dbPolys[i]);
    if (iou >= threshold) return { duplicate: true, index: i, iou };
  }
  return { duplicate: false, index: -1, iou: 0 };
}

/** Cheap bbox-overlap prefilter — run before IoU to skip far-away polygons. */
export function bboxesOverlap(a: MapBounds, b: MapBounds): boolean {
  return !(a.east < b.west || a.west > b.east || a.north < b.south || a.south > b.north);
}

/* ---- DB payload (notebook Step 7) ------------------------------------------- */

export interface MarkingPayload {
  /** Prisma String field — JSON-encoded centroid {lat,lng}. */
  gpsCoordinates: string;
  /** Prisma Json field — the GPS polygon. */
  boundaryCoordinates: LatLngLiteral[];
  boundaryVerified: boolean;
  boundaryMarkedAt: string;
  markingMeta: {
    vertexCount: number;
    boundingBox: MapBounds;
    centroid: LatLngLiteral;
    fingerprint: string;
  };
}

/** Build the DB-ready record from a normalised polygon + the viewport bounds. */
export async function buildMarkingPayload(
  polyNorm: PolygonNorm,
  bounds: MapBounds,
  opts: { verified?: boolean } = {}
): Promise<MarkingPayload> {
  const gps = polygonNormToGps(polyNorm, bounds);
  const centroid = centroidOf(gps);
  const fingerprint = await buildingFingerprint(centroid);
  return {
    gpsCoordinates: JSON.stringify(centroid),
    boundaryCoordinates: gps,
    boundaryVerified: opts.verified ?? false,
    boundaryMarkedAt: new Date().toISOString(),
    markingMeta: {
      vertexCount: gps.length,
      boundingBox: boundingBox(gps),
      centroid,
      fingerprint,
    },
  };
}
