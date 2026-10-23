// backend/vendor-service/src/utils/geo.ts
export interface LatLng { lat: number; lng: number }

/** Property.gpsCoordinates is stored as "lat,lng". */
export function parseLatLng(s: string | null | undefined): LatLng | null {
  if (!s) return null;
  const [a, b] = s.split(",").map((x) => Number(x.trim()));
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180 ? { lat: a, lng: b } : null;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
