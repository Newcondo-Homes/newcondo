/* ============================================================
   marking-geo (server) — Node port of the Colab marking algorithm.
   Identical math to the frontend components/marking/marking-geo.ts;
   the only difference is SHA-256 via node:crypto instead of Web Crypto.

   In the monorepo you'd ideally lift this into a shared package
   (e.g. @newcondo/geo) and import it from both apps/platform and
   backend/property-service instead of duplicating. Kept standalone
   here so the service runs on its own.
   ============================================================ */

import { createHash } from "node:crypto";

export interface LatLng {
  lat: number;
  lng: number;
}
export interface MapBounds {
  north: number;
  south: number;
  west: number;
  east: number;
}
export type PolygonNorm = Array<[number, number]>;

/* ---- projection ------------------------------------------------------------- */

export function normalizedToLatLng(nx: number, ny: number, b: MapBounds): LatLng {
  return {
    lat: b.north - ny * (b.north - b.south),
    lng: b.west + nx * (b.east - b.west),
  };
}

export function polygonNormToGps(poly: PolygonNorm, b: MapBounds): LatLng[] {
  return poly.map(([nx, ny]) => normalizedToLatLng(nx, ny, b));
}

/* ---- centroid / bbox / fingerprint ----------------------------------------- */

export function centroidOf(poly: LatLng[]): LatLng {
  const n = poly.length || 1;
  return {
    lat: poly.reduce((s, p) => s + p.lat, 0) / n,
    lng: poly.reduce((s, p) => s + p.lng, 0) / n,
  };
}

export function boundingBox(poly: LatLng[]): MapBounds {
  const lats = poly.map((p) => p.lat);
  const lngs = poly.map((p) => p.lng);
  return { north: Math.max(...lats), south: Math.min(...lats), east: Math.max(...lngs), west: Math.min(...lngs) };
}

export function fingerprintKey(c: LatLng): string {
  const r6 = (x: number) => String(Math.round(x * 1e6) / 1e6);
  return `${r6(c.lat)},${r6(c.lng)}`;
}

/** SHA-256 of rounded centroid → first 16 hex chars (matches the notebook). */
export function buildingFingerprint(c: LatLng): string {
  return createHash("sha256").update(fingerprintKey(c)).digest("hex").slice(0, 16);
}

/* ---- duplicate detection ---------------------------------------------------- */

export function pointInPolygon(point: LatLng, ring: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].lng;
    const yi = ring[i].lat;
    const xj = ring[j].lng;
    const yj = ring[j].lat;
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function bboxesOverlap(a: MapBounds, b: MapBounds): boolean {
  return !(a.east < b.west || a.west > b.east || a.north < b.south || a.south > b.north);
}

export function polygonsIoU(a: LatLng[], b: LatLng[], res = 256): number {
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
  matchId: string | null;
  iou: number;
}

export interface ExistingMark {
  id: string;
  polygon: LatLng[];
  bbox?: MapBounds;
}

/** Returns the first existing mark whose IoU with the new polygon ≥ threshold. */
export function checkDuplicate(
  newPoly: LatLng[],
  existing: ExistingMark[],
  threshold = 0.3
): DuplicateResult {
  const newBox = boundingBox(newPoly);
  for (const e of existing) {
    // cheap bbox prefilter before the expensive raster IoU
    if (e.bbox && !bboxesOverlap(newBox, e.bbox)) continue;
    const iou = polygonsIoU(newPoly, e.polygon);
    if (iou >= threshold) return { duplicate: true, matchId: e.id, iou };
  }
  return { duplicate: false, matchId: null, iou: 0 };
}
