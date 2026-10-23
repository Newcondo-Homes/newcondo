// apps/vendors/lib/queries.ts
// ============================================================
// ONE list of everything the vendor dashboard shows. Shared by the server
// (preloads it into the HTML on first load) and the client (warms anything
// the server didn't finish, and reads it from cache on every page).
// No "use client" and no browser-only imports — the server layout imports it.
// ============================================================

export const qk = {
  me: ["vendor", "me"] as const,
  overview: ["vendor", "overview"] as const,
  jobs: (tab: string) => ["vendor", "jobs", tab] as const,
  job: (id: string) => ["vendor", "job", id] as const,
  clients: ["vendor", "clients"] as const,
  payouts: ["vendor", "payouts"] as const,
  notifications: ["notifications"] as const,
};

export const JOB_TABS = ["todo", "pending", "paid", "all"] as const;

/** Query key → backend path (relative to /api/v1). Every response is
 *  `{ success, data }`; the cache stores `data`, same as the client's unwrap(). */
export const VENDOR_PRELOAD: { key: readonly unknown[]; path: string }[] = [
  { key: qk.me, path: "/vendors/me" },
  { key: qk.overview, path: "/vendors/me/overview" },
  ...JOB_TABS.map((t) => ({ key: qk.jobs(t), path: `/vendors/me/jobs?tab=${t}&page=1` })),
  { key: qk.clients, path: "/vendors/me/clients" },
  { key: qk.payouts, path: "/vendors/me/payouts?page=1" },
  { key: qk.notifications, path: "/notifications" },
];

/** Every dashboard route — prefetched once so page switches never wait on the server. */
export const DASHBOARD_ROUTES = ["/dashboard", "/jobs", "/schedule", "/clients", "/payouts", "/settings"];

/** How long cached data counts as fresh. Matches the QueryClient default in Providers. */
export const FRESH_MS = 5 * 60_000;
