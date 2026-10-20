// apps/vendors/hooks/useVendor.ts
// TanStack Query hooks. staleTime/gcTime in providers mean pages paint from
// cache when you come back to them; mutations patch the cache so the UI
// updates instantly, then invalidate for the server's truth.
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as A from "@/lib/api/vendor";

export const qk = {
  me: ["vendor", "me"] as const,
  overview: ["vendor", "overview"] as const,
  jobs: (tab: string) => ["vendor", "jobs", tab] as const,
  job: (id: string) => ["vendor", "job", id] as const,
  clients: ["vendor", "clients"] as const,
  payouts: ["vendor", "payouts"] as const,
};

export const useMe = () => useQuery({ queryKey: qk.me, queryFn: A.getMe });
export const useOverview = () => useQuery({ queryKey: qk.overview, queryFn: A.getOverview, refetchInterval: 60_000 });
export const useJobs = (tab: string) => useQuery({ queryKey: qk.jobs(tab), queryFn: () => A.getJobs(tab) });
export const useJob = (id: string | null) => useQuery({ queryKey: qk.job(id ?? ""), queryFn: () => A.getJob(id!), enabled: !!id });
export const useClients = () => useQuery({ queryKey: qk.clients, queryFn: A.getClients });
export const usePayouts = () => useQuery({ queryKey: qk.payouts, queryFn: () => A.getPayouts() });

/** After a job changes, refresh every view that shows it. */
export function useRefreshJobs() {
  const qc = useQueryClient();
  return () => Promise.all(["overview", "jobs", "job", "payouts"].map((k) => qc.invalidateQueries({ queryKey: ["vendor", k] })));
}

export function useMeMutation<TArgs>(fn: (a: TArgs) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: (data) => { if (data && typeof data === "object" && "id" in data) qc.setQueryData(qk.me, data); } });
}
