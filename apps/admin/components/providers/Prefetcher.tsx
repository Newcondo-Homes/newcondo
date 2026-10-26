"use client";
// apps/admin/components/providers/Prefetcher.tsx
// ============================================================
// Warms the TanStack cache for EVERY page this staff member can open, right
// after the dashboard first loads — so switching pages never waits on the API.
//
//   • Scope-aware: only fetches what /admin/me says they may see (no 403 noise).
//   • Uses the exact query keys the pages use: each table's saved view
//     (search / filter / page from lib/viewState) or its default.
//   • Runs at idle priority, in small batches, after the current page has
//     painted — the page you're on always wins, and the backend's 240 req/min
//     staff limit is never approached (~17 requests total).
//   • Prefetch never overwrites fresher data: prefetchQuery is a no-op for
//     anything already cached and not stale.
//   • Re-runs when scopes change (a super admin grants a new permission).
// ============================================================
import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { A, type ListParams, type Page } from "@/lib/api/admin";
import { prefetchList, qk } from "@/hooks/useAdmin";
import { useCan } from "@/components/auth/Can";
import { readView, tableKey, DEFAULT_TABLE, paramsFor, type TableView } from "@/lib/viewState";
import type { AdminScope } from "@/lib/scopes";

type Fetcher = (p: ListParams) => Promise<Page<unknown>>;
interface Warm { name: string; fetcher: Fetcher; filter?: string; scope?: AdminScope; any?: AdminScope[] }

/** One line per table in the app. `filter` = that table's first filter chip (its default). */
export const WARM: Warm[] = [
  { name: "approvals:identity", fetcher: A.identityQueue as Fetcher, scope: "verification.review" },
  { name: "approvals:listing", fetcher: A.listingQueue as Fetcher, scope: "listings.review" },
  { name: "marking", fetcher: A.marking as Fetcher, scope: "marking.read" },
  { name: "disputes", fetcher: A.disputes as Fetcher, filter: "open", any: ["disputes.manage", "support.tickets"] },
  { name: "visits", fetcher: A.visitIssues as Fetcher, scope: "vendors.read" },
  { name: "support", fetcher: A.tickets as Fetcher, filter: "open", scope: "support.tickets" },
  { name: "users", fetcher: A.users as Fetcher, scope: "users.read" },
  { name: "vendors", fetcher: A.vendors as Fetcher, scope: "vendors.read" },
  { name: "properties", fetcher: A.properties as Fetcher, scope: "listings.read" },
  { name: "rent", fetcher: A.rent as Fetcher, scope: "payments.read" },
  { name: "ledger", fetcher: A.ledger as Fetcher, scope: "payments.read" },
  { name: "failed", fetcher: A.failedTransfers as Fetcher, scope: "payments.read" },
  { name: "referrals", fetcher: A.referrals as Fetcher, scope: "referrals.read" },
  { name: "staff", fetcher: A.staff as Fetcher, scope: "staff.manage" },
  { name: "audit", fetcher: A.audit as Fetcher, scope: "audit.read" },
];

type IdleWindow = { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void };
/** Run at idle priority; falls back to a short timeout (Safari has no requestIdleCallback). */
const idle = (fn: () => void): (() => void) => {
  const w = globalThis as unknown as IdleWindow;
  if (typeof w.requestIdleCallback === "function") { const h = w.requestIdleCallback(fn, { timeout: 1500 }); return () => w.cancelIdleCallback?.(h); }
  const t = globalThis.setTimeout(fn, 200); return () => globalThis.clearTimeout(t);
};

export async function warmAll(qc: QueryClient, can: (s: AdminScope) => boolean) {
  await qc.prefetchQuery({ queryKey: qk.overview, queryFn: A.overview });
  const jobs = WARM.filter((w) => (w.scope ? can(w.scope) : true) && (w.any ? w.any.some(can) : true)).map((w) => () => {
    const v = readView<TableView>(tableKey(w.name), { ...DEFAULT_TABLE, filter: w.filter ?? "all" });
    return prefetchList(qc, w.name, w.fetcher, paramsFor(v));
  });
  for (let i = 0; i < jobs.length; i += 4) await Promise.allSettled(jobs.slice(i, i + 4).map((j) => j()));
}

export function Prefetcher() {
  const qc = useQueryClient();
  const { me, can } = useCan();
  const scopeKey = me?.scopes.join(",") ?? "";
  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    const cancel = idle(() => { if (!cancelled) void warmAll(qc, can); });
    return () => { cancelled = true; cancel(); };
  }, [scopeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
