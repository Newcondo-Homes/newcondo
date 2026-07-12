/* ============================================================
   Signed, tamper-proof geo-access token.

   Why: localStorage alone can be hand-edited by any visitor via
   devtools to fake "allowed" access. This module signs the access
   decision server-side with an HMAC secret the browser never sees,
   so the cookie can be READ by the client but never forged or
   edited — any tampering invalidates the signature.

   Flow:
     1. Client gets GPS coords, POSTs them to /api/geo-access.
     2. That route (server-only) checks the coords against
        ALLOWED_ZONES and, if allowed, calls signGeoAccess() and
        sets the result as an httpOnly cookie.
     3. On every later request, app/layout.tsx (a server component)
        calls verifyGeoAccess() on that cookie. A tampered or
        expired token verifies to null — the visitor is asked again.
   ============================================================ */

import { createHmac, timingSafeEqual } from "crypto";

// Set GEO_ACCESS_SECRET in your real environment (.env.local / hosting
// provider's env vars) — a long random string. The fallback below only
// exists so local dev doesn't crash without a .env file; it is NOT safe
// for production (anyone who reads this source could forge tokens).
const SECRET = process.env.GEO_ACCESS_SECRET || "dev-only-insecure-secret-change-me";

export const GEO_ACCESS_COOKIE = "nc_geo_access";
export const GEO_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface GeoAccessClaim {
  allowed: true;
  state: string;
  city: string | null;
  /** epoch ms when this claim was issued — used for our own expiry check, independent of cookie maxAge */
  iat: number;
}

function hmac(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

/** Server-only: builds the signed `payload.signature` cookie value. */
export function signGeoAccess(claim: Omit<GeoAccessClaim, "iat">): string {
  const full: GeoAccessClaim = { ...claim, iat: Date.now() };
  const payload = Buffer.from(JSON.stringify(full)).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

/** Server-only: verifies + decodes a cookie value. Returns null if missing, malformed, tampered, or expired. */
export function verifyGeoAccess(token: string | undefined | null): GeoAccessClaim | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = hmac(payload);

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null; // forged/altered

  try {
    const claim = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as GeoAccessClaim;
    if (claim.allowed !== true) return null;
    if (Date.now() - claim.iat > GEO_ACCESS_MAX_AGE_SECONDS * 1000) return null; // expired
    return claim;
  } catch {
    return null;
  }
}
