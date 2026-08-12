"use client";

/* ============================================================
   Dashboard data hooks — TanStack Query.
   Each hook maps 1:1 to a backend endpoint (named in the TODO above its
   queryFn). Until the endpoint exists, the hook serves dummy data.

   MOBILE FIX — why dummy data sometimes never appeared on phones:
   the old helper resolved every dummy payload through
   `new Promise(res => setTimeout(res, 550))`. Mobile browsers
   aggressively throttle (and in backgrounded tabs, effectively suspend)
   timers, so that promise could stay pending indefinitely — the query
   sat in `isLoading` forever and the skeletons never resolved, no
   matter how many times the page was refreshed.

   Dummy payloads are static, so they no longer go through a timer at
   all: `dummyQuery()` hands them to TanStack as `initialData` with
   `staleTime: Infinity`. Data is present on first render, survives
   navigation, and can never hang. The artificial delay only remains in
   live mode, where a real network promise settles on its own.

   HOW TO WIRE THE BACKEND: replace each queryFn body with the real call,
   e.g. `() => api.get('/properties/my-listings')` using lib/api/client,
   and delete the DUMMY_* import. Keys and shapes stay the same.
   ============================================================ */
import { useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
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

/**
 * Dummy-or-live query.
 *
 * DUMMY MODE (no NEXT_PUBLIC_API_URL): the payload is supplied as
 * `initialData`, so it's on screen the moment the component mounts —
 * no timer, no pending promise, nothing for a mobile browser to throttle.
 * `staleTime: Infinity` stops TanStack re-running the queryFn on every
 * navigation, which is what made pages re-skeleton on each visit.
 *
 * LIVE MODE: normal fetch, with the dummy payload kept as a fallback so
 * the dashboard never blanks while endpoints are still rolling out.
 */
function dummyQuery<T>(
  key: readonly unknown[],
  dummy: T,
  call?: () => Promise<T>,
  extra?: Partial<UseQueryOptions<T>>
) {
  const live = api.isLiveBackend && !!call;
  return {
    queryKey: key,
    queryFn: async (): Promise<T> => {
      if (!live) return dummy;
      try {
        return await call!();
      } catch (e) {
        console.warn("[dashboard] API fallback → dummy data:", e);
        return dummy;
      }
    },
    // Present immediately in dummy mode; in live mode we let the real
    // request populate but still show dummy as placeholder so the layout
    // never collapses to an empty state on a slow mobile connection.
    ...(live ? { placeholderData: dummy } : { initialData: dummy, staleTime: Infinity }),
    ...extra,
  } as UseQueryOptions<T>;
}

/* -------- properties (owner) --------
   GET /api/v1/properties/mine — every listing the user owns OR is the
   listing agent for, including DRAFT ones that haven't been marked yet.
   A property created in the Create-listing wizard shows up here right
   away because that flow invalidates ["properties","mine"]. */
export function useMyProperties() {
  return useQuery<Property[]>(
    dummyQuery(["properties", "mine"], DUMMY_PROPERTIES, () => api.getMyProperties() as Promise<Property[]>)
  );
}
/* Listings still awaiting GPS marking — feeds the Property dropdown in the
   Request-marking wizard. Marked properties are excluded server-side, since
   re-marking is what double-listing protection prevents.
   GET /api/v1/properties/unmarked */
export function useUnmarkedProperties() {
  return useQuery<Property[]>(
    dummyQuery(
      ["properties", "unmarked"],
      DUMMY_PROPERTIES.filter((p) => !p.marked),
      () => api.getUnmarkedProperties() as Promise<Property[]>
    )
  );
}
/* TODO(backend): GET /api/properties/:id/flats */
export function useFlatUnits(propertyId: string) {
  return useQuery<FlatUnit[]>(dummyQuery(["flats", propertyId], DUMMY_FLAT_UNITS[propertyId] ?? []));
}

/* -------- agent listings & promotions --------
   TODO(backend): GET /api/agent/listings · GET /api/agent/promotions · GET /api/agent/sub-agent-requests */
export function useAgentListings() {
  return useQuery<AgentListing[]>(dummyQuery(["agent", "listings"], DUMMY_AGENT_LISTINGS));
}
export function usePromotions() {
  return useQuery(dummyQuery(["agent", "promotions"], DUMMY_PROMOTIONS));
}
export function useSubAgentRequests() {
  return useQuery(dummyQuery(["agent", "sub-agent-requests"], DUMMY_SUBAGENT_REQUESTS));
}

/* -------- marking --------
   Live: /api/v1/marking/* (marking-service via combined backend). */
export function useOwnerMarkingJobs() {
  return useQuery<MarkingJob[]>(
    dummyQuery(["marking", "owner"], DUMMY_MARKING_JOBS_OWNER, () => api.getOwnerMarkingJobs() as Promise<MarkingJob[]>)
  );
}
export function useAvailableJobs() {
  // live mode: agent's geolocation → GET /marking/available-jobs?lat&lng.
  // NOTE: navigator.geolocation is unavailable on insecure origins, so when
  // testing on a phone over http://<lan-ip>:3000 this always rejects — the
  // dummy fallback below is what keeps the page populated in that case.
  return useQuery<AvailableJob[]>(
    dummyQuery(["marking", "available"], DUMMY_AVAILABLE_JOBS, () =>
      new Promise<AvailableJob[]>((res, rej) => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          rej(new Error("Geolocation unavailable (needs HTTPS)"));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => (api.getAvailableMarkingJobs(pos.coords.latitude, pos.coords.longitude) as Promise<AvailableJob[]>).then(res, rej),
          () => rej(new Error("Location permission needed for nearby jobs")),
          { timeout: 8000 }
        );
      })
    )
  );
}
export function useActiveJob() {
  // Explicit generic: DUMMY_ACTIVE_JOB is non-null, so dummyQuery would infer
  // T = ActiveJob and the options wouldn't match useQuery<ActiveJob | null>.
  return useQuery<ActiveJob | null>(dummyQuery<ActiveJob | null>(["marking", "active"], DUMMY_ACTIVE_JOB));
}
export function useJobHistory() {
  return useQuery<JobHistoryItem[]>(dummyQuery(["marking", "history"], DUMMY_JOB_HISTORY));
}

/* -------- money --------
   TODO(backend): GET /api/payments/history?role= · /pending-confirmations ·
   GET /api/wallet · GET /api/virtual-accounts */
export function usePayments(role: Role) {
  return useQuery<Tx[]>(dummyQuery(["payments", role], DUMMY_PAYMENTS[role]));
}
export function usePendingEscrow(role: Role) {
  return useQuery(dummyQuery(["escrow", role], role === "OWNER" ? DUMMY_ESCROW : []));
}
export function useWallet(role: Role) {
  // GET /api/v1/payments/wallet — available (RELEASED − withdrawn), locked (HELD), autoPayout
  return useQuery<Wallet>(dummyQuery(["wallet", role], DUMMY_WALLETS[role], () => api.getWalletApi() as Promise<Wallet>));
}
export function useVirtualAccounts(role: Role) {
  return useQuery<VirtualAccount[]>(dummyQuery(["virtual-accounts", role], DUMMY_VIRTUAL_ACCOUNTS[role]));
}
/* TODO(backend): GET /api/rentals/mine (renter) */
export function useRenterRental() {
  return useQuery(dummyQuery(["rental", "mine"], DUMMY_RENTER_RENTAL));
}

/* -------- services / referrals / notifications / analytics -------- */
export function useServices() {
  // GET /api/v1/services/overview (vendor-service) — plan + jobs.
  return useQuery<typeof DUMMY_SERVICES>(
    dummyQuery(["services"], DUMMY_SERVICES, api.getServicesOverview as () => Promise<typeof DUMMY_SERVICES>)
  );
}
export function useReferrals() {
  // GET /api/v1/referrals/stats (referral-service)
  return useQuery<typeof DUMMY_REFERRALS>(
    dummyQuery(["referrals"], DUMMY_REFERRALS, api.getReferralStats as () => Promise<typeof DUMMY_REFERRALS>)
  );
}
export function useNotifications(role: Role) {
  // list from GET /api/v1/notifications; real-time arrivals come through
  // useNotificationStream (SSE) which prepends into this same cache key.
  // staleTime is finite here (even in dummy mode the bell should reflect
  // optimistic mark-all-read writes) — handled via setQueryData, so the
  // Infinity staleTime from dummyQuery is fine and intentional.
  return useQuery<Notification[]>(dummyQuery(["notifications", role], DUMMY_NOTIFICATIONS[role], api.getNotifications));
}
export function useCharts() {
  return useQuery(dummyQuery(["analytics", "charts"], DUMMY_CHARTS));
}

/* -------- tenants (owner + listing agent) --------
   GET /api/v1/properties/:id/tenants — lister-only, ownership enforced
   server-side in property-service tenantService. */
export function useTenants(propertyId: string) {
  return useQuery<Tenant[]>(
    dummyQuery(["tenants", propertyId], DUMMY_TENANTS[propertyId] ?? [], () => api.getTenants(propertyId))
  );
}

/* -------- bank accounts (payout destinations) -------- */
export function useBankAccounts(role: Role) {
  return useQuery<BankAccount[]>(dummyQuery(["bank-accounts", role], DUMMY_BANK_ACCOUNTS[role], api.getBankAccounts));
}

/* -------- public browse grid --------
   GET /api/v1/properties/browse — PUBLISHED+marked only, Redis-cached 60s. */
export function useBrowse(f: BrowseFilters) {
  return useQuery<BrowseResult>(
    dummyQuery(["browse", f], filterDummyBrowse(f), () => api.browseProperties(f), {
      placeholderData: (prev: BrowseResult | undefined) => prev,
    } as Partial<UseQueryOptions<BrowseResult>>)
  );
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

/* -------- optimistic cache updates -------- */
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
