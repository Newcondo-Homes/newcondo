"use client";

/* ============================================================
   Dashboard data — TanStack Query.

   WHY PAGES FELT LIKE THEY RELOADED (and what fixes it):
   1. Each page fetched its data only when it mounted, so the FIRST visit to
      every page waited on the network. → Every query is now defined once as
      an option factory in `dashboardQueries` below, and <DashboardPrefetcher>
      (components/providers/dashboard-prefetch.tsx) warms the whole role's set
      the moment the dashboard opens. By the time you click a sidebar link the
      data is already in the cache: the page paints instantly, no skeleton.
   2. Revisits are served from cache: staleTime 5 min / gcTime 30 min in
      QueryProvider, refetchOnWindowFocus off. Stale data refreshes silently in
      the background — it never blanks the screen.
   3. Route payloads (RSC) are kept by the Next router cache for 5 min
      (next.config.ts → experimental.staleTimes), so loading.tsx doesn't flash
      on a page you've already opened, and sidebar links prefetch fully.
   4. template.tsx no longer replays a slide-in on every navigation.

   Hooks keep their names, keys and shapes — nothing that imports them
   changes. Hooks and the prefetcher share the SAME factories, so a
   prefetched entry is exactly what the page's hook reads.

   MOBILE NOTE (kept): dummy payloads never go through a timer. In dummy mode
   they are `initialData` with `staleTime: Infinity`; in live mode they are
   `placeholderData`, so the layout never collapses on a slow connection.
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
import * as money from "@/lib/api/money";

/** Dummy-or-live query options (see header). */
function dummyQuery<T>(
  key: readonly unknown[],
  dummy: T,
  call?: () => Promise<T>,
  extra?: Partial<UseQueryOptions<T>>
): UseQueryOptions<T> {
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
    ...(live ? { placeholderData: dummy } : { initialData: dummy, staleTime: Infinity }),
    ...extra,
  } as UseQueryOptions<T>;
}

/* Agent geolocation for nearby marking jobs. Not part of the prefetch set:
   it can trigger a permission prompt, which must come from the page. */
const nearbyJobs = () =>
  new Promise<AvailableJob[]>((res, rej) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) { rej(new Error("Geolocation unavailable (needs HTTPS)")); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => (api.getAvailableMarkingJobs(pos.coords.latitude, pos.coords.longitude) as Promise<AvailableJob[]>).then(res, rej),
      () => rej(new Error("Location permission needed for nearby jobs")),
      { timeout: 8000 }
    );
  });

function filterDummyBrowse(f: BrowseFilters): BrowseResult {
  let items = DUMMY_BROWSE;
  if (f.q) { const q = f.q.toLowerCase(); items = items.filter((p) => p.title.toLowerCase().includes(q) || p.area.toLowerCase().includes(q)); }
  if (f.state) items = items.filter((p) => p.state === f.state);
  if (f.type) items = items.filter((p) => p.propertyType === f.type);
  if (f.minPrice != null) items = items.filter((p) => p.price >= f.minPrice!);
  if (f.maxPrice != null) items = items.filter((p) => p.price <= f.maxPrice!);
  return { total: items.length, page: 1, pageSize: 24, items };
}

/* ============================================================
   THE FACTORIES — one per backend endpoint. Hooks AND the prefetcher use
   these, so keys and fetchers can never drift apart.
   ============================================================ */
export const dashboardQueries = {
  // GET /properties/mine — owned OR listing-agent, DRAFT included
  myProperties: () => dummyQuery<Property[]>(["properties", "mine"], DUMMY_PROPERTIES, () => api.getMyProperties() as Promise<Property[]>),
  // GET /properties/unmarked — feeds the Request-marking dropdown
  unmarkedProperties: () => dummyQuery<Property[]>(["properties", "unmarked"], DUMMY_PROPERTIES.filter((p) => !p.marked), () => api.getUnmarkedProperties() as Promise<Property[]>),
  // TODO(backend): GET /properties/:id/flats
  flatUnits: (propertyId: string) => dummyQuery<FlatUnit[]>(["flats", propertyId], DUMMY_FLAT_UNITS[propertyId] ?? []),
  // TODO(backend): GET /agent/listings · /agent/promotions · /agent/sub-agent-requests
  agentListings: () => dummyQuery<AgentListing[]>(["agent", "listings"], DUMMY_AGENT_LISTINGS),
  promotions: () => dummyQuery(["agent", "promotions"], DUMMY_PROMOTIONS),
  subAgentRequests: () => dummyQuery(["agent", "sub-agent-requests"], DUMMY_SUBAGENT_REQUESTS),
  // /marking/* (marking-service)
  ownerMarkingJobs: () => dummyQuery<MarkingJob[]>(["marking", "owner"], DUMMY_MARKING_JOBS_OWNER, () => api.getOwnerMarkingJobs() as Promise<MarkingJob[]>),
  availableJobs: () => dummyQuery<AvailableJob[]>(["marking", "available"], DUMMY_AVAILABLE_JOBS, nearbyJobs),
  activeJob: () => dummyQuery<ActiveJob | null>(["marking", "active"], DUMMY_ACTIVE_JOB),
  jobHistory: () => dummyQuery<JobHistoryItem[]>(["marking", "history"], DUMMY_JOB_HISTORY),
  // money — TODO(backend): GET /payments/history?role= · /pending-confirmations
  payments: (role: Role) => dummyQuery<Tx[]>(["payments", role], DUMMY_PAYMENTS[role]),
  pendingEscrow: (role: Role) => dummyQuery(["escrow", role], role === "OWNER" ? DUMMY_ESCROW : []),
  // GET /payments/wallet — ledger balances (available · pending · locked)
  wallet: (role: Role) => dummyQuery<Wallet>(["wallet", role], DUMMY_WALLETS[role], () => api.getWalletApi() as Promise<Wallet>),
  virtualAccounts: (role: Role) => dummyQuery<VirtualAccount[]>(["virtual-accounts", role], DUMMY_VIRTUAL_ACCOUNTS[role]),
  // MONEY CORE — GET /payments/wallet/ledger · /wallet/funding-account
  walletStatement: (page = 1) => dummyQuery<money.Paged<money.LedgerLine>>(["wallet", "ledger", page], money.DUMMY_STATEMENT, () => money.getWalletStatement(page)),
  fundingAccount: () => dummyQuery<money.FundingAccount>(["wallet", "funding-account"], money.DUMMY_FUNDING, () => money.getFundingAccount()),
  // MONEY CORE — GET /payments/billing/summary · /billing/properties/:id
  billingSummary: () => dummyQuery<money.BillingSummary>(["billing", "summary"], money.DUMMY_BILLING, money.getBillingSummary),
  propertyPlan: (propertyId: string) =>
    dummyQuery<money.PropertyPlanState>(["billing", "property", propertyId], { propertyId, periodEnd: null, canUseSeat: false, offPlan: false, line: null }, () => money.getPropertyPlan(propertyId)),
  // TODO(backend): GET /rentals/mine (renter)
  renterRental: () => dummyQuery(["rental", "mine"], DUMMY_RENTER_RENTAL),
  // GET /services/overview (vendor-service)
  services: () => dummyQuery<typeof DUMMY_SERVICES>(["services"], DUMMY_SERVICES, api.getServicesOverview as () => Promise<typeof DUMMY_SERVICES>),
  // GET /referrals/stats (legacy page shape) · /referrals/me · /referrals/programs (v2 engine)
  referrals: () => dummyQuery<typeof DUMMY_REFERRALS>(["referrals"], DUMMY_REFERRALS, api.getReferralStats as () => Promise<typeof DUMMY_REFERRALS>),
  referralOverview: () => dummyQuery<money.ReferralOverview>(["referrals", "me"], money.DUMMY_REFERRAL_OVERVIEW, money.getReferralOverview),
  referralPrograms: () => dummyQuery<money.ReferralPrograms>(["referrals", "programs"], money.DUMMY_REFERRAL_PROGRAMS, money.getReferralPrograms),
  // GET /notifications — SSE (useNotificationStream) prepends into this key
  notifications: (role: Role) => dummyQuery<Notification[]>(["notifications", role], DUMMY_NOTIFICATIONS[role], api.getNotifications),
  charts: () => dummyQuery(["analytics", "charts"], DUMMY_CHARTS),
  // GET /properties/:id/tenants — lister-only, enforced server-side
  tenants: (propertyId: string) => dummyQuery<Tenant[]>(["tenants", propertyId], DUMMY_TENANTS[propertyId] ?? [], () => api.getTenants(propertyId)),
  bankAccounts: (role: Role) => dummyQuery<BankAccount[]>(["bank-accounts", role], DUMMY_BANK_ACCOUNTS[role], api.getBankAccounts),
  // GET /properties/browse — PUBLISHED + marked only, Redis-cached 60s
  browse: (f: BrowseFilters) =>
    dummyQuery<BrowseResult>(["browse", f], filterDummyBrowse(f), () => api.browseProperties(f), {
      placeholderData: (prev: BrowseResult | undefined) => prev,
    } as Partial<UseQueryOptions<BrowseResult>>),
};

/** Any factory's options, type-erased. TanStack's option types are invariant
 *  in their data type (`enabled`/`queryFn` take a typed Query), so
 *  UseQueryOptions<Property[]> can't widen to UseQueryOptions<unknown>. The
 *  prefetcher only hands these back to queryClient.prefetchQuery, which
 *  doesn't care about the data type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyQueryOptions = UseQueryOptions<any, any, any, any>;

/** What each role's dashboard needs, warmed on entry (dashboard-prefetch.tsx).
 *  Per-property queries (flats, tenants, plan) are warmed from the property
 *  list once it lands. Geolocation-backed queries are deliberately excluded. */
export function prefetchSetFor(role: Role): AnyQueryOptions[] {
  const q = dashboardQueries;
  const shared: AnyQueryOptions[] = [q.wallet(role), q.bankAccounts(role), q.payments(role), q.notifications(role), q.referrals(), q.referralOverview(), q.referralPrograms(), q.walletStatement(), q.fundingAccount()];
  const byRole: Record<Role, AnyQueryOptions[]> = {
    OWNER: [q.myProperties(), q.unmarkedProperties(), q.ownerMarkingJobs(), q.pendingEscrow(role), q.services(), q.charts(), q.billingSummary(), q.virtualAccounts(role)],
    AGENT: [q.agentListings(), q.promotions(), q.subAgentRequests(), q.myProperties(), q.unmarkedProperties(), q.ownerMarkingJobs(), q.activeJob(), q.jobHistory(), q.services(), q.charts(), q.virtualAccounts(role)],
    RENTER: [q.renterRental(), q.browse({})],
  };
  return [...byRole[role], ...shared];
}

/* ============================================================
   HOOKS — unchanged names, keys and shapes.
   ============================================================ */
export const useMyProperties = () => useQuery<Property[]>(dashboardQueries.myProperties());
export const useUnmarkedProperties = () => useQuery<Property[]>(dashboardQueries.unmarkedProperties());
export const useFlatUnits = (propertyId: string) => useQuery<FlatUnit[]>(dashboardQueries.flatUnits(propertyId));
export const useAgentListings = () => useQuery<AgentListing[]>(dashboardQueries.agentListings());
export const usePromotions = () => useQuery(dashboardQueries.promotions());
export const useSubAgentRequests = () => useQuery(dashboardQueries.subAgentRequests());
export const useOwnerMarkingJobs = () => useQuery<MarkingJob[]>(dashboardQueries.ownerMarkingJobs());
// NOTE: navigator.geolocation is unavailable on insecure origins (http://<lan-ip>:3000),
// so on a phone over LAN this rejects and the dummy fallback keeps the page populated.
export const useAvailableJobs = () => useQuery<AvailableJob[]>(dashboardQueries.availableJobs());
export const useActiveJob = () => useQuery<ActiveJob | null>(dashboardQueries.activeJob());
export const useJobHistory = () => useQuery<JobHistoryItem[]>(dashboardQueries.jobHistory());
export const usePayments = (role: Role) => useQuery<Tx[]>(dashboardQueries.payments(role));
export const usePendingEscrow = (role: Role) => useQuery(dashboardQueries.pendingEscrow(role));
export const useWallet = (role: Role) => useQuery<Wallet>(dashboardQueries.wallet(role));
export const useVirtualAccounts = (role: Role) => useQuery<VirtualAccount[]>(dashboardQueries.virtualAccounts(role));
export const useRenterRental = () => useQuery(dashboardQueries.renterRental());
export const useServices = () => useQuery<typeof DUMMY_SERVICES>(dashboardQueries.services());
export const useReferrals = () => useQuery<typeof DUMMY_REFERRALS>(dashboardQueries.referrals());
export const useNotifications = (role: Role) => useQuery<Notification[]>(dashboardQueries.notifications(role));
export const useCharts = () => useQuery(dashboardQueries.charts());
export const useTenants = (propertyId: string) => useQuery<Tenant[]>(dashboardQueries.tenants(propertyId));
export const useBankAccounts = (role: Role) => useQuery<BankAccount[]>(dashboardQueries.bankAccounts(role));
export const useBrowse = (f: BrowseFilters) => useQuery<BrowseResult>(dashboardQueries.browse(f));

/* ---- MONEY CORE + referrals v2 ---- */
export const useWalletStatement = (page = 1) => useQuery(dashboardQueries.walletStatement(page));
export const useFundingAccount = () => useQuery(dashboardQueries.fundingAccount());
export const useBillingSummary = () => useQuery(dashboardQueries.billingSummary());
export const usePropertyPlan = (propertyId: string) => useQuery(dashboardQueries.propertyPlan(propertyId));
export const useReferralOverview = () => useQuery(dashboardQueries.referralOverview());
export const useReferralPrograms = () => useQuery(dashboardQueries.referralPrograms());

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
