/* ============================================================
   Profile patch client — same-origin, cookie-authed.

   Talks to OUR Next.js route (app/api/user/profile/route.ts), not the
   Express backend: it's same-origin, so the NextAuth session cookie
   authenticates it directly — no Bearer token juggling needed, unlike
   lib/api/subscriptions.ts which crosses to the separate Express API.
   ============================================================ */

import type { UserType } from "@/types/api";

export interface ProfilePatchResult {
  success: boolean;
  error?: string;
  data?: { id: string; userType: UserType; phone: string | null };
}

export async function updateProfile(patch: {
  userType?: UserType;
  phone?: string;
}): Promise<ProfilePatchResult> {
  try {
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = (await res.json().catch(() => null)) as ProfilePatchResult | null;
    if (!res.ok || !json?.success) {
      return { success: false, error: json?.error ?? "Could not update your profile" };
    }
    return json;
  } catch {
    return { success: false, error: "Network error — please try again" };
  }
}
