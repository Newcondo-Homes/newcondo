/* ============================================================
   Browser-storage helpers for the location gate. Access decisions
   are remembered on-device (localStorage) so returning visitors
   aren't asked again — nothing is sent to or stored on a server.
   ============================================================ */

const STORAGE_KEY = "nc_geo_access_v1";
export const IP_BYPASS_COOKIE = "nc_ip_bypass";

export interface StoredAccess {
  allowed: true;
  state: string;
  city: string | null;
  lat: number;
  lng: number;
  ts: number;
}

export function readStoredAccess(): StoredAccess | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAccess>;
    if (parsed && parsed.allowed === true && typeof parsed.lat === "number") {
      return parsed as StoredAccess;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeStoredAccess(data: Omit<StoredAccess, "ts" | "allowed">): void {
  if (typeof window === "undefined") return;
  try {
    const record: StoredAccess = { ...data, allowed: true, ts: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* storage unavailable (private mode, quota) — visitor will just be asked again */
  }
}

// Note: this cookie is httpOnly (set in middleware.ts) — client JS is never
// allowed to read or write it, so it can't be spoofed from devtools. It's
// checked server-side in app/layout.tsx via next/headers' cookies(), not here.
