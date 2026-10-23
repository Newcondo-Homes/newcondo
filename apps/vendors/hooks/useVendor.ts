// apps/vendors/hooks/useVendor.ts
// TanStack Query hooks. The dashboard layout preloads every one of these
// (lib/queries.ts → VENDOR_PRELOAD), so on any page they resolve straight
// from cache. Mutations patch the cache so the UI updates instantly, then
// invalidate for the server's truth — refetches happen in the background
// while the current data stays on screen.
"use client";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import * as A from "@/lib/api/vendor";
import { qk } from "@/lib/queries";
import type { VendorJobDTO } from "@/lib/types";

export { qk };

export const useMe = () => useQuery({ queryKey: qk.me, queryFn: A.getMe });
export const useOverview = () => useQuery({ queryKey: qk.overview, queryFn: A.getOverview, refetchInterval: 60_000 });
export const useJobs = (tab: string) => useQuery({ queryKey: qk.jobs(tab), queryFn: () => A.getJobs(tab) });
export const useClients = () => useQuery({ queryKey: qk.clients, queryFn: A.getClients });
export const usePayouts = () => useQuery({ queryKey: qk.payouts, queryFn: () => A.getPayouts() });

/** A job that's already in any cached list (overview / jobs tabs / payouts). */
function cachedJob(qc: QueryClient, id: string): { job: VendorJobDTO; at: number } | undefined {
  for (const q of qc.getQueryCache().findAll({ queryKey: ["vendor"] })) {
    const d = q.state.data as { jobs?: VendorJobDTO[]; today?: VendorJobDTO[] } | undefined;
    const job = (d?.jobs ?? d?.today)?.find?.((j) => j.id === id);
    if (job) return { job, at: q.state.dataUpdatedAt };
  }
}

/** Job sheets open instantly from list data; the detail call only refreshes it. */
export function useJob(id: string | null) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.job(id ?? ""), queryFn: () => A.getJob(id!), enabled: !!id,
    initialData: () => (id ? cachedJob(qc, id)?.job : undefined),
    initialDataUpdatedAt: () => (id ? cachedJob(qc, id)?.at : undefined),
  });
}

/** After a job changes, refresh every view that shows it (in the background). */
export function useRefreshJobs() {
  const qc = useQueryClient();
  return () => Promise.all(["overview", "jobs", "job", "payouts"].map((k) => qc.invalidateQueries({ queryKey: ["vendor", k] })));
}

export function useMeMutation<TArgs>(fn: (a: TArgs) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: (data) => { if (data && typeof data === "object" && "id" in data) qc.setQueryData(qk.me, data); } });
}
