"use client";
// apps/admin/components/ui/DataTable.tsx
// Server-paginated table: search (debounced) · filter chips · page numbers with
// First/Last. No infinite scroll. On phones rows collapse into labelled cards.
//
// Instant by design:
//   • search / filter / page are restored synchronously from lib/viewState, so
//     the FIRST query key on mount is the one <Prefetcher/> already filled
//   • the skeleton only shows when there is truly nothing cached; refetches
//     happen silently behind the rows (a thin bar shows while they run)
//   • the next page is prefetched as soon as the current one lands
//   • rows can warm their detail page on hover (prefetchRow) so opening is instant
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useList, prefetchList } from "@/hooks/useAdmin";
import type { ListParams, Page } from "@/lib/api/admin";
import { readView, writeView, tableKey, DEFAULT_TABLE, type TableView } from "@/lib/viewState";
import { Empty, SkeletonRows } from "./primitives";

export interface Col<T> { label: string; cell: (r: T) => ReactNode; right?: boolean; width?: number | string }
export interface Filter { value: string; label: string }

export function DataTable<T extends { id: string }>({ name, fetcher, cols, filters, onRow, prefetchRow, tools, empty = "Nothing matches these filters", defaultFilter }: {
  name: string; fetcher: (p: ListParams) => Promise<Page<T>>; cols: Col<T>[]; filters?: Filter[]; onRow?: (r: T) => void;
  prefetchRow?: (r: T) => void; tools?: ReactNode; empty?: string; defaultFilter?: string;
}) {
  const qc = useQueryClient();
  const init = useRef<TableView>(readView(tableKey(name), { ...DEFAULT_TABLE, filter: defaultFilter ?? filters?.[0]?.value ?? "all" })).current;
  const [q, setQ] = useState(init.q); const [dq, setDq] = useState(init.q);
  const [filter, setFilter] = useState(init.filter);
  const [page, setPage] = useState(init.page);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(t);
  }, [q]);
  useEffect(() => { writeView<TableView>(tableKey(name), { q: dq, filter, page }); }, [name, dq, filter, page]);

  const params: ListParams = { page, q: dq || undefined, filter };
  const { data, isPending, isFetching, isPlaceholderData, error } = useList<T>(name, fetcher, params);
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 10)));
  useEffect(() => { if (data && page < pages) void prefetchList(qc, name, fetcher, { ...params, page: page + 1 }); }, [data, page, pages]); // eslint-disable-line react-hooks/exhaustive-deps
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);
  const pick = (v: string) => { setFilter(v); setPage(1); };

  return <div className="card tight" style={{ position: "relative" }}>
    {isFetching && !isPending && <div className="a-refresh" aria-hidden />}
    <div className="a-tools">
      <div className="a-search"><Search size={16} /><input className="inp" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {filters && <div className="a-filters">{filters.map((f) => <button key={f.value} className={`a-chip${filter === f.value ? " on" : ""}`} onClick={() => pick(f.value)}>{f.label}</button>)}</div>}
      {tools}
    </div>
    {isPending ? <SkeletonRows n={5} /> : error && !data ? <Empty title="Couldn’t load this list" sub={(error as Error).message} /> : !data?.rows.length ? <Empty title={empty} sub="Try a different search or clear the filter." />
      : <div className="a-scroll" style={isPlaceholderData ? { opacity: .6, transition: "opacity .15s" } : { transition: "opacity .15s" }}><table className="tbl a-tbl">
        <thead><tr>{cols.map((c) => <th key={c.label} style={{ width: c.width, textAlign: c.right ? "right" : "left" }}>{c.label}</th>)}</tr></thead>
        <tbody>{data.rows.map((r) => <tr key={r.id} className={onRow ? "a-row" : ""} onClick={onRow ? () => onRow(r) : undefined} onMouseEnter={prefetchRow ? () => prefetchRow(r) : undefined} onFocus={prefetchRow ? () => prefetchRow(r) : undefined} tabIndex={onRow ? 0 : undefined} onKeyDown={onRow ? (e) => { if (e.key === "Enter") onRow(r); } : undefined}>
          {cols.map((c) => <td key={c.label} data-l={c.label} style={{ textAlign: c.right ? "right" : "left" }}>{c.cell(r)}</td>)}
        </tr>)}</tbody>
      </table></div>}
    <div className="a-pager">
      <span>{data ? `${data.total === 0 ? 0 : (page - 1) * data.pageSize + 1}–${Math.min(page * data.pageSize, data.total)} of ${data.total}` : " "}</span>
      {pages > 1 && <div className="pg">
        <button className="btn btn-line btn-sm" disabled={page === 1} onClick={() => setPage(1)}>First</button>
        {nums.map((n) => <button key={n} className={`btn btn-sm ${n === page ? "btn-dark" : "btn-line"}`} onClick={() => setPage(n)} onMouseEnter={() => void prefetchList(qc, name, fetcher, { ...params, page: n })}>{n}</button>)}
        <button className="btn btn-line btn-sm" disabled={page === pages} onClick={() => setPage(pages)}>Last</button>
      </div>}
    </div>
  </div>;
}

export const Person = ({ name, sub }: { name: string | null; sub?: ReactNode }) => {
  const ini = (name ?? "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return <div className="a-cell"><span className="a-av">{ini}</span><div style={{ minWidth: 0 }}><div className="a-name">{name ?? "—"}</div>{sub && <div className="a-sub">{sub}</div>}</div></div>;
};
export const naira = (kobo: string | number, isKobo = true) => `₦${Math.round(Number(kobo) / (isKobo ? 100 : 1)).toLocaleString("en-NG")}`;
export const when = (iso: string | null) => iso ? new Date(iso).toLocaleString("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
