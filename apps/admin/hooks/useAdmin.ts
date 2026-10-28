// apps/admin/hooks/useAdmin.ts
// TanStack Query hooks. Every page reads through these, and <Prefetcher/> fills
// the SAME keys up front — so a page mounts with its data already in cache.
// `useAction` wraps a mutation with pending → success/error toasts and
// invalidates only the keys it touches (refetched in the background).
"use client";
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { A, type ListParams, type Page } from "@/lib/api/admin";

/** Canonical list params — undefined keys dropped so the prefetched key and the page's key are identical. */
const norm = (p: ListParams): ListParams => ({ page: p.page, ...(p.q ? { q: p.q } : {}), ...(p.filter && p.filter !== "all" ? { filter: p.filter } : {}) });

export const qk = {
  me: ["admin", "me"] as const,
  overview: ["admin", "overview"] as const,
  list: (name: string, p: ListParams) => ["admin", name, "list", norm(p)] as const,
  one: (name: string, id: string) => ["admin", name, "one", id] as const,
  extra: (name: string, ...rest: (string | undefined)[]) => ["admin", name, "extra", ...rest] as const,
};

// retry: never on 401/403 (not staff / signed out) — only on network blips, once.
export const useStaffMe = () => useQuery({ queryKey: qk.me, queryFn: A.me, staleTime: 60_000, refetchInterval: 60_000,
  retry: (n, e) => n < 1 && ![401, 403].includes((e as { status?: number | null }).status ?? 0) });
export const useOverview = () => useQuery({ queryKey: qk.overview, queryFn: A.overview, staleTime: 60_000, refetchInterval: 60_000 });

export function useList<T>(name: string, fn: (p: ListParams) => Promise<Page<T>>, p: ListParams) {
  return useQuery({ queryKey: qk.list(name, p), queryFn: () => fn(norm(p)), placeholderData: keepPreviousData });
}
export const useOne = <T,>(name: string, id: string, fn: (id: string) => Promise<T>) => useQuery({ queryKey: qk.one(name, id), queryFn: () => fn(id) });

/** Warm a list page (used by the Prefetcher and by pagers for the next page). */
export const prefetchList = <T,>(qc: QueryClient, name: string, fn: (p: ListParams) => Promise<Page<T>>, p: ListParams) =>
  qc.prefetchQuery({ queryKey: qk.list(name, p), queryFn: () => fn(norm(p)) });
/** Warm a detail page (row hover / focus) so opening it is instant. */
export const prefetchOne = <T,>(qc: QueryClient, name: string, id: string, fn: (id: string) => Promise<T>) =>
  qc.prefetchQuery({ queryKey: qk.one(name, id), queryFn: () => fn(id) });

export function useAction<TArgs>(fn: (a: TArgs) => Promise<unknown>, msg: { pending: string; success: string; sub?: string }, invalidate: string[] = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: TArgs) => { const id = toast.loading(msg.pending); try { const r = await fn(a); toast.success(msg.success, { id, description: msg.sub }); return r; } catch (e) { toast.error("That didn’t work", { id, description: (e as Error).message }); throw e; } },
    // "approvals:identity" invalidates exactly that list; "users" invalidates the users list AND every cached user detail.
    onSuccess: () => Promise.all([...new Set([...invalidate, "overview", "audit"])].map((k) => qc.invalidateQueries({ queryKey: ["admin", k] }))),
  });
}
