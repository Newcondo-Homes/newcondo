"use client";

/* ============================================================
   ReferralTracker — rendered by app/(links)/r/[code]/page.tsx.
   Server Components can't set cookies, so the two side effects of opening
   a referral link live here:
     1. POST /referrals/click/:code — counts the click (rate-limited; the
        backend hashes the IP, never stores it raw). Once per code per tab.
     2. nc_ref cookie for 30 days (= REFERRAL_ATTRIBUTION_WINDOW_DAYS in
        backend-shared referrals/limits.ts), so signing up later on the same
        device still attributes even without ?ref= in the URL.
   Renders nothing. Only mounted for a valid code.
   ============================================================ */
import { useEffect } from "react";

const COOKIE_DAYS = 30;

export function ReferralTracker({ code }: { code: string }) {
  useEffect(() => {
    const key = `nc_ref_click:${code}`;
    try {
      document.cookie = `nc_ref=${encodeURIComponent(code)}; Max-Age=${COOKIE_DAYS * 86400}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch { /* storage blocked — still try to count */ }
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return;
    fetch(`${base}/referrals/click/${encodeURIComponent(code)}`, { method: "POST", keepalive: true }).catch(() => {});
  }, [code]);
  return null;
}

/** Read the attribution code at signup: ?ref= wins, else the cookie. */
export function readReferralCode(search?: URLSearchParams | null): string | null {
  const q = search?.get("ref");
  if (q) return q;
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)nc_ref=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
