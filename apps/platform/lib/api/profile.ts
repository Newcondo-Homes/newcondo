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
  /**
   * STALE_SESSION means the JWT is valid but its user row is gone (deleted by
   * an admin, or swept by the stub-cleanup job). Nothing the user does can make
   * the write succeed, so callers must sign out and restart rather than retry.
   */
  code?: "STALE_SESSION" | string;
  data?: { id: string; userType: UserType; phone: string | null; email?: string | null };
}

export async function updateProfile(patch: {
  userType?: UserType;
  phone?: string;
  /** Facebook often returns no email, so SocialAccountDetails collects one. */
  email?: string;
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
      return {
        success: false,
        error: json?.error ?? "Could not update your profile",
        // Preserve the code so the caller can distinguish a dead session from a
        // validation failure — they need opposite handling.
        code: json?.code,
      };
    }
    return json;
  } catch {
    return { success: false, error: "Network error — please try again" };
  }
}

/** Fresh, authoritative isPremium read — bypasses stale/cached JWT claims. */
export async function getSubscriptionStatus(): Promise<{
  success: boolean;
  isPremium?: boolean;
  premiumExpiresAt?: string | null;
}> {
  try {
    const res = await fetch("/api/user/subscription-status", { credentials: "include" });
    const json = (await res.json().catch(() => null)) as {
      success: boolean;
      data?: { isPremium: boolean; premiumExpiresAt: string | null };
    } | null;
    if (!res.ok || !json?.success || !json.data) return { success: false };
    return { success: true, isPremium: json.data.isPremium, premiumExpiresAt: json.data.premiumExpiresAt };
  } catch {
    return { success: false };
  }
}
