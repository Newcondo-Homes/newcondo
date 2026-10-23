"use client";
// apps/vendors/components/providers/VendorDataProvider.tsx
// ============================================================
// Wraps the whole dashboard (inside the root QueryClientProvider):
//   1. Hands the server's session token to the API client synchronously, so
//      the first requests don't wait on a /api/auth/session round trip.
//   2. Hydrates everything the server preloaded into the TanStack cache
//      before any page renders → pages paint with data, no spinners.
//   3. Warm-up: fetches whatever the server didn't finish, and prefetches
//      every dashboard route so the Next router has them cached
//      (experimental.staleTimes in next.config.ts keeps them 5 min).
// Pages then only READ from the cache. Background refreshes (mutations,
// the 60s overview poll) update data in place without blanking the page.
// ============================================================
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { HydrationBoundary, useQueryClient, type DehydratedState } from "@tanstack/react-query";
import api, { unwrap, primeAccessToken } from "@/lib/api/client";
import { VENDOR_PRELOAD, DASHBOARD_ROUTES } from "@/lib/queries";

function Warmup() {
  const qc = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    // No-op for anything already fresh (i.e. everything the server preloaded).
    for (const p of VENDOR_PRELOAD) void qc.prefetchQuery({ queryKey: p.key, queryFn: () => api.get(p.path).then(unwrap) });
    for (const r of DASHBOARD_ROUTES) router.prefetch(r);
  }, [qc, router]);
  return null;
}

export function VendorDataProvider({ state, accessToken, children }: { state: DehydratedState; accessToken?: string; children: ReactNode }) {
  primeAccessToken(accessToken); // during render, before any child query fires
  return <HydrationBoundary state={state}><Warmup />{children}</HydrationBoundary>;
}
