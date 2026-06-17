/* ============================================================
   marking-core — shared types + geometry helpers for the
   property-marking experience.
   ============================================================ */

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

/** A property already marked by someone else — drawn as a red-grey mask. */
export interface MarkedProperty {
  id: string;
  label?: string;
  polygon: LatLngLiteral[];
}

/** Details resolved from the shareable marking link (owner-supplied). */
export interface PropertyLinkInfo {
  propertyId: string;
  address?: string;
  ownerName?: string;
  ownerPhone?: string;
  propertyType?: string;
}

export type MarkStep = "locate" | "mark" | "photos" | "submit";

/** Ray-casting point-in-polygon on plain {lat,lng} rings (no Maps SDK needed). */
export function pointInPolygon(point: LatLngLiteral, ring: LatLngLiteral[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].lng,
      yi = ring[i].lat;
    const xj = ring[j].lng,
      yj = ring[j].lat;
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** A small square (4 corners) of `meters` half-size around a center point. */
export function squareAround(c: LatLngLiteral, meters = 12): LatLngLiteral[] {
  const dLat = meters / 111_111;
  const dLng = meters / (111_111 * Math.cos((c.lat * Math.PI) / 180));
  return [
    { lat: c.lat + dLat, lng: c.lng - dLng },
    { lat: c.lat + dLat, lng: c.lng + dLng },
    { lat: c.lat - dLat, lng: c.lng + dLng },
    { lat: c.lat - dLat, lng: c.lng - dLng },
  ];
}

/** Human/mono-friendly coordinate string, e.g. "6.452044, 3.379205". */
export function formatLatLng(p: LatLngLiteral): string {
  return `${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`;
}
