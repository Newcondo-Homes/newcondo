// apps/vendors/lib/server/preload.ts — SERVER ONLY (imported by the dashboard layout)
// ============================================================
// Fetches every dashboard query in parallel while the layout renders, so the
// first HTML already contains all the data (TanStack Query dehydrate →
// HydrationBoundary). The dashboard layout persists across client-side
// navigations, so this runs once per full page load — not on every click.
//
// Time-boxed: a slow backend never holds the page hostage. Anything not back
// within the budget is skipped here and fetched by the client warm-up
// (VendorDataProvider) a moment later.
// ============================================================
import { QueryClient, dehydrate, type DehydratedState } from "@tanstack/react-query";
import { VENDOR_PRELOAD, FRESH_MS } from "@/lib/queries";

// API_URL = internal/private URL if the frontend and backend share a network
// (Render private service); falls back to the public one.
const API = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

async function getJson(path: string, token: string, signal: AbortSignal): Promise<unknown> {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store", signal });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  const j = (await r.json()) as { data?: unknown };
  return j.data;
}

export async function preloadVendorData(token: string | undefined, budgetMs = 2500): Promise<DehydratedState> {
  const qc = new QueryClient({ defaultOptions: { queries: { staleTime: FRESH_MS, retry: false } } });
  if (token && API) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), budgetMs);
    // prefetchQuery never throws; failed or aborted queries just aren't dehydrated.
    await Promise.allSettled(VENDOR_PRELOAD.map((p) => qc.prefetchQuery({ queryKey: p.key, queryFn: () => getJson(p.path, token, ctrl.signal) })));
    clearTimeout(timer);
  }
  return dehydrate(qc); // successful queries only — errors/pending fall to the client
}
