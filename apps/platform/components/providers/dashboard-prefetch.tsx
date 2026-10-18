"use client";

/* ============================================================
   DashboardPrefetcher — loads everything the dashboard needs ONCE, as soon
   as it opens, so moving between pages never waits on the network.

     1. Data: every query in prefetchSetFor(role) goes into the TanStack
        cache (same factories the pages' hooks use → exact cache hits).
     2. Detail data: once the property list is cached, each property's flats,
        tenants and plan are warmed too, so opening a property is instant.
     3. Routes: every sidebar destination is prefetched into the Next router
        cache (kept 5 min by next.config.ts staleTimes), so loading.tsx
        skeletons don't flash on navigation.

   Runs on idle so it never competes with the first paint, and only once per
   role per session (role switches in design preview re-run it).
   ============================================================ */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient, type FetchQueryOptions, type QueryClient } from "@tanstack/react-query";
import { useRole } from "@/components/providers/role-provider";
import { NAV } from "@/components/dashboard/Sidebar";
import { dashboardQueries, prefetchSetFor, type AnyQueryOptions } from "@/hooks/dashboard/useDashboardData";
import type { Property, AgentListing } from "@/lib/dashboard/data";

const DETAIL_LIMIT = 12; // warm the first N properties' detail pages

/* UseQueryOptions (hooks) and FetchQueryOptions (client) differ only in
   hook-only fields; one cast here, nowhere else. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asFetch = <T,>(o: AnyQueryOptions) => o as unknown as FetchQueryOptions<T, any, T, any>;
const warm = (qc: QueryClient, o: AnyQueryOptions) => qc.prefetchQuery(asFetch(o));

export function DashboardPrefetcher() {
  const qc = useQueryClient();
  const router = useRouter();
  const { role } = useRole();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await Promise.allSettled(prefetchSetFor(role).map((o) => warm(qc, o)));

      for (const group of NAV[role]) for (const item of group.items) router.prefetch(item.href);
      router.prefetch("/profile");

      if (role === "RENTER" || cancelled) return;
      const list = role === "AGENT"
        ? await qc.fetchQuery(asFetch<AgentListing[]>(dashboardQueries.agentListings())).catch(() => [] as AgentListing[])
        : await qc.fetchQuery(asFetch<Property[]>(dashboardQueries.myProperties())).catch(() => [] as Property[]);
      for (const p of (list ?? []).slice(0, DETAIL_LIMIT)) {
        if (cancelled) return;
        void warm(qc, dashboardQueries.flatUnits(p.id));
        void warm(qc, dashboardQueries.tenants(p.id));
        if (role === "OWNER") void warm(qc, dashboardQueries.propertyPlan(p.id));
        router.prefetch(`/properties/${p.id}`);
      }
    };

    // Feature-check via `in`: TS's DOM lib types requestIdleCallback as always
    // defined (TS2774), but older Safari doesn't have it.
    const idle = "requestIdleCallback" in window;
    const handle = idle
      ? window.requestIdleCallback(() => void run(), { timeout: 1500 })
      : (window as Window).setTimeout(() => void run(), 300);
    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [role, qc, router]);

  return null;
}
