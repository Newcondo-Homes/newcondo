import { ALLOWED_ZONES } from "@/lib/geo-access-config";

export interface GeoCheckResult {
  allowed: boolean;
  state: string | null;
  city: string | null;
}

/** Great-circle distance between two lat/lng points, in kilometres. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Checks a lat/lng against ALLOWED_ZONES (see geo-access-config.ts).
 * Returns which state/city matched, or allowed:false if none did.
 */
export function checkGeoAccess(lat: number, lng: number): GeoCheckResult {
  for (const zone of ALLOWED_ZONES) {
    if (zone.allowWholeState) {
      if (haversineKm(lat, lng, zone.center.lat, zone.center.lng) <= zone.radiusKm) {
        return { allowed: true, state: zone.name, city: null };
      }
      continue;
    }
    for (const city of zone.cities) {
      if (haversineKm(lat, lng, city.lat, city.lng) <= city.radiusKm) {
        return { allowed: true, state: zone.name, city: city.name };
      }
    }
  }
  return { allowed: false, state: null, city: null };
}

/** Human-readable summary of currently-open areas, for the "restricted" message. */
export function describeAllowedAreas(): string {
  const parts: string[] = [];
  for (const zone of ALLOWED_ZONES) {
    if (zone.allowWholeState) {
      parts.push(`all of ${zone.name} State`);
    } else if (zone.cities.length) {
      parts.push(`${zone.cities.map((c) => c.name).join(", ")} (${zone.name} State)`);
    }
  }
  return parts.join(" and ");
}
