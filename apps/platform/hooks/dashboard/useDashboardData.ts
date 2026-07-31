"use client";

/* ============================================================
   Dashboard data hooks — TanStack Query.
   Each hook maps 1:1 to a backend endpoint (named in the TODO above its
   queryFn). Until the endpoint exists, the queryFn resolves dummy data
   after a short delay — the UI (skeletons, cached revisits) behaves
   exactly as it will in production.

   HOW TO WIRE THE BACKEND: replace each queryFn body with the real call,
   e.g. `() => api.get('/properties/my-listings')` using lib/api/client,
   and delete the DUMMY_* import. Keys and shapes stay the same.
   ============================================================ */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DUMMY_PROPERTIES, DUMMY_AGENT_LISTINGS, DUMMY_PROMOTIONS, DUMMY_SUBAGENT_REQUESTS,
  DUMMY_MARKING_JOBS_OWNER, DUMMY_AVAILABLE_JOBS, DUMMY_ACTIVE_JOB, DUMMY_JOB_HISTORY,
  DUMMY_ESCROW, DUMMY_PAYMENTS, DUMMY_VIRTUAL_ACCOUNTS, DUMMY_WALLETS, DUMMY_REFERRALS,
  DUMMY_SERVICES, DUMMY_NOTIFICATIONS, DUMMY_FLAT_UNITS, DUMMY_RENTER_RENTAL, DUMMY_CHARTS,
  DUMMY_TENANTS, DUMMY_BANK_ACCOUNTS, DUMMY_BROWSE,
  type Role, type Property, type AgentListing, type MarkingJob, type AvailableJob,
  type ActiveJob, type JobHistoryItem, type Tx, type Wallet, type VirtualAccount,
  type Notification, type FlatUnit, type Tenant, type BankAccount, type BrowseFilters, type BrowseResult,
} from "@/lib/dashboard/data";
import * as api from "@/lib/api/dashboard";

const simulate = <T,>(data: T, ms = 550) => new Promise<T>((res) => setTimeout(res, ms)).then(() => data);

/* Live-or-fallback: when NEXT_PUBLIC_API_URL is set the queryFn calls the
   combined backend (lib/api/dashboard.ts); if the endpoint isn't deployed
   yet it logs a warning and serves the dummy payload so the dashboard never
   blanks mid-rollout. Delete the fallback once all endpoints are live. */
async function fromApi<T>(call: () => Promise<T>, dummy: T, ms = 550): Promise<T> {
  if (!api.isLiveBackend) return simulate(dummy, ms);
  try { return await call(); } catch (e) { console.warn("[dashboard] API fallback → dummy data:", e); return dummy; }
}

/* -------- properties (owner) --------
   TODO(backend): GET /api/properties/my-listings */
export function useMyProperties() {
  return useQuery<Property[]>({ queryKey: ["properties", "mine"], queryFn: () => simulate(DUMMY_PROPERTIES) });
}
/* TODO(backend): GET /api/properties/:id/flats */
export function useFlatUnits(propertyId: string) {
  return useQuery<FlatUnit[]>({ queryKey: ["flats", propertyId], queryFn: () => simulate(DUMMY_FLAT_UNITS[propertyId] ?? [], 200) });
}

/* -------- agent listings & promotions --------
   TODO(backend): GET /api/agent/listings · GET /api/agent/promotions · GET /api/agent/sub-agent-requests */
export function useAgentListings() {
  return useQuery<AgentListing[]>({ queryKey: ["agent", "listings"], queryFn: () => simulate(DUMMY_AGENT_LISTINGS) });
}
export function usePromotions() {
  return useQuery({ queryKey: ["agent", "promotions"], queryFn: () => simulate(DUMMY_PROMOTIONS) });
}
export function useSubAgentRequests() {
  return useQuery({ queryKey: ["agent", "sub-agent-requests"], queryFn: () => simulate(DUMMY_SUBAGENT_REQUESTS) });
}

/* -------- marking --------
   Live: /api/v1/marking/* (marking-service via combined backend). Active-job
   + agent history payloads are mapped server-side to these DTO shapes. */
export function useOwnerMarkingJobs() {
  return useQuery<MarkingJob[]>({ queryKey: ["marking", "owner"], queryFn: () => fromApi(() => api.getOwnerMarkingJobs() as Promise<MarkingJob[]>, DUMMY_MARKING_JOBS_OWNER) });
}
export function useAvailableJobs() {
  // live mode: agent's geolocation → GET /marking/available-jobs?lat&lng (proximity-sorted)
  return useQuery<AvailableJob[]>({ queryKey: ["marking", "available"], queryFn: () => fromApi(() => new Promise<AvailableJob[]>((res, rej) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => (api.getAvailableMarkingJobs(pos.coords.latitude, pos.coords.longitude) as Promise<AvailableJob[]>).then(res, rej),
      () => rej(new Error("Location permission needed for nearby jobs")), { timeout: 8000 });
  }), DUMMY_AVAILABLE_JOBS) });
}
export function useActiveJob() {
  return useQuery<ActiveJob | null>({ queryKey: ["marking", "active"], queryFn: () => simulate(DUMMY_ACTIVE_JOB) });
}
export function useJobHistory() {
  // live: served inside GET /marking/jobs/history (agent). DTO-mapped server-side.
  return useQuery<JobHistoryItem[]>({ queryKey: ["marking", "history"], queryFn: () => simulate(DUMMY_JOB_HISTORY, 450) });
}

/* -------- money --------
   TODO(backend): GET /api/payments/history?role= · GET /api/payments/pending-confirmations ·
   GET /api/wallet · GET /api/virtual-accounts */
export function usePayments(role: Role) {
  return useQuery<Tx[]>({ queryKey: ["payments", role], queryFn: () => simulate(DUMMY_PAYMENTS[role]) });
}
export function usePendingEscrow(role: Role) {
  return useQuery({ queryKey: ["escrow", role], queryFn: () => simulate(role === "OWNER" ? DUMMY_ESCROW : []) });
}
export function useWallet(role: Role) {
  // GET /api/v1/payments/wallet — available (RELEASED − withdrawn), locked (HELD), autoPayout
  return useQuery<Wallet>({ queryKey: ["wallet", role], queryFn: () => fromApi(() => api.getWalletApi() as Promise<Wallet>, DUMMY_WALLETS[role]) });
}
export function useVirtualAccounts(role: Role) {
  return useQuery<VirtualAccount[]>({ queryKey: ["virtual-accounts", role], queryFn: () => simulate(DUMMY_VIRTUAL_ACCOUNTS[role]) });
}
/* TODO(backend): GET /api/rentals/mine (renter) */
export function useRenterRental() {
  return useQuery({ queryKey: ["rental", "mine"], queryFn: () => simulate(DUMMY_RENTER_RENTAL) });
}

/* -------- services / referrals / notifications / analytics -------- */
export function useServices() {
  // GET /api/v1/services/overview (vendor-service) — plan + jobs.
  // Explicit generic: without it TanStack infers `{}` from the untyped API
  // response and every `data.x` access fails type-check in the production build.
  return useQuery<typeof DUMMY_SERVICES>({ queryKey: ["services"], queryFn: () => fromApi(api.getServicesOverview as () => Promise<typeof DUMMY_SERVICES>, DUMMY_SERVICES) });
}
export function useReferrals() {
  // GET /api/v1/referrals/stats (referral-service) — link, funnel counts, credits, history
  return useQuery<typeof DUMMY_REFERRALS>({ queryKey: ["referrals"], queryFn: () => fromApi(api.getReferralStats as () => Promise<typeof DUMMY_REFERRALS>, DUMMY_REFERRALS) });
}
export function useNotifications(role: Role) {
  // list from GET /api/v1/notifications; real-time arrivals come through
  // useNotificationStream (SSE) which prepends into this same cache key
  return useQuery<Notification[]>({ queryKey: ["notifications", role], queryFn: () => fromApi(api.getNotifications, DUMMY_NOTIFICATIONS[role], 250) });
}
export function useCharts() {
  return useQuery({ queryKey: ["analytics", "charts"], queryFn: () => simulate(DUMMY_CHARTS, 200) });
}

/* -------- tenants (owner + listing agent) --------
   GET /api/v1/properties/:id/tenants — lister-only, ownership enforced
   server-side in property-service tenantService. */
export function useTenants(propertyId: string) {
  return useQuery<Tenant[]>({ queryKey: ["tenants", propertyId], queryFn: () => fromApi(() => api.getTenants(propertyId), DUMMY_TENANTS[propertyId] ?? [], 400) });
}

/* -------- bank accounts (payout destinations) --------
   GET /api/v1/payments/bank-accounts. Mutations live in the wallet page via
   useCacheUpdate + api calls (add resolves the holder name via Flutterwave
   name-enquiry server-side). */
export function useBankAccounts(role: Role) {
  return useQuery<BankAccount[]>({ queryKey: ["bank-accounts", role], queryFn: () => fromApi(api.getBankAccounts, DUMMY_BANK_ACCOUNTS[role]) });
}

/* -------- public browse grid --------
   GET /api/v1/properties/browse — PUBLISHED+marked only, Redis-cached 60s.
   keepPreviousData-style caching per filter combo so paging feels instant. */
export function useBrowse(f: BrowseFilters) {
  return useQuery<BrowseResult>({
    queryKey: ["browse", f],
    queryFn: () => fromApi(() => api.browseProperties(f), filterDummyBrowse(f), 500),
    placeholderData: (prev) => prev,
  });
}
function filterDummyBrowse(f: BrowseFilters): BrowseResult {
  let items = DUMMY_BROWSE;
  if (f.q) { const q = f.q.toLowerCase(); items = items.filter((p) => p.title.toLowerCase().includes(q) || p.area.toLowerCase().includes(q)); }
  if (f.state) items = items.filter((p) => p.state === f.state);
  if (f.type) items = items.filter((p) => p.propertyType === f.type);
  if (f.minPrice != null) items = items.filter((p) => p.price >= f.minPrice!);
  if (f.maxPrice != null) items = items.filter((p) => p.price <= f.maxPrice!);
  return { total: items.length, page: 1, pageSize: 24, items };
}

/* -------- optimistic cache updates --------
   Used by the "mutations" below. In production each of these becomes a
   useMutation({ mutationFn: api.patch(...), onSuccess: invalidateQueries })
   — the optimistic setQueryData can stay for snappy UX. */
export function useCacheUpdate() {
  const qc = useQueryClient();
  return {
    update<T>(key: readonly unknown[], fn: (old: T) => T) {
      qc.setQueryData(key, (old: T | undefined) => (old === undefined ? old : fn(old)));
    },
    invalidate(key: readonly unknown[]) {
      qc.invalidateQueries({ queryKey: key });
    },
  };
}
