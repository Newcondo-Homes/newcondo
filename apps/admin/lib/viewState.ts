"use client";
// apps/admin/lib/viewState.ts
// In-memory view state (table search/filter/page, active tabs) that survives
// navigating between dashboard pages, mirrored to sessionStorage for reloads.
//
// Why: pages used to start every table at "all / page 1" and only THEN read the
// saved filter in an effect — so each visit fired a first query, threw it away
// and fired a second one, showing a skeleton every time. Reading the saved value
// synchronously on first render means the very first query key is the right one,
// and it is already in the TanStack cache (see Prefetcher).
//
// Safe to read sessionStorage during render: dashboard pages only render after
// /admin/me resolves on the client (AdminShell), never on the server.
const mem = new Map<string, unknown>();

export function readView<T>(key: string, def: T): T {
  if (mem.has(key)) return mem.get(key) as T;
  if (typeof window !== "undefined") {
    try { const raw = sessionStorage.getItem(`adm.v.${key}`); if (raw != null) { const v = JSON.parse(raw) as T; mem.set(key, v); return v; } } catch { /* ignore */ }
  }
  return def;
}

export function writeView<T>(key: string, v: T) {
  mem.set(key, v);
  try { sessionStorage.setItem(`adm.v.${key}`, JSON.stringify(v)); } catch { /* private mode / quota */ }
}

/** Cleared on sign-out so the next staff member on this browser starts clean. */
export function clearViews() {
  mem.clear();
  try { Object.keys(sessionStorage).filter((k) => k.startsWith("adm.v.")).forEach((k) => sessionStorage.removeItem(k)); } catch { /* ignore */ }
}

export interface TableView { q: string; filter: string; page: number }
export const tableKey = (name: string) => `tbl.${name}`;
export const DEFAULT_TABLE: TableView = { q: "", filter: "all", page: 1 };

/** The exact params a DataTable sends for its current view — shared with the Prefetcher so cache keys match. */
export const paramsFor = (v: TableView) => ({ page: v.page, ...(v.q ? { q: v.q } : {}), ...(v.filter !== "all" ? { filter: v.filter } : {}) });
