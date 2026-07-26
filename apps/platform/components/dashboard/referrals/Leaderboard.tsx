"use client";

/* Leaderboard + ActiveAreas + CopyLinkModal — referral-page pieces.
   Leaderboard: GET /api/v1/referrals/leaderboard (paginated, requester rank).
   Areas: GET /api/v1/referrals/active-areas — straight from
   backend-shared constants/business.ts ACTIVE_AREAS (single source of truth).
   Copy confirm: modal on desktop / bottom sheet on mobile (Modal handles
   both) reinforcing that affiliation only works in active areas. */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { Modal } from "@/components/dashboard/Modal";
import { Card, CardH, DBtn, Banner, SkeletonRows } from "@/components/dashboard/primitives";
import * as api from "@/lib/api/dashboard";
import { ngn } from "@/lib/dashboard/format";
import { ACTIVE_AREAS, REFERRALS, type ActiveArea } from "@/lib/constants/business";

export interface LeaderRow { rank: number; name: string; role: string; converted: number; signedUp: number; credits: number; isYou?: boolean; }
export interface LeaderboardData { total: number; page: number; pageSize: number; totalPages: number; yourRank: number | null; entries: LeaderRow[]; }

/* Dummy fallback — mirrors the backend DTO exactly */
const DUMMY_LEADERS: LeaderRow[] = [
  { rank: 1, name: "Fatima B.", role: "AGENT", converted: 11, signedUp: 19, credits: 96500 },
  { rank: 2, name: "Emeka O.", role: "AGENT", converted: 8, signedUp: 14, credits: 72000, isYou: true },
  { rank: 3, name: "Dele O.", role: "AGENT", converted: 6, signedUp: 12, credits: 51000 },
  { rank: 4, name: "Ngozi K.", role: "AGENT", converted: 5, signedUp: 9, credits: 43500 },
  { rank: 5, name: "Adaeze O.", role: "OWNER", converted: 4, signedUp: 8, credits: 40000 },
  { rank: 6, name: "Ibrahim M.", role: "AGENT", converted: 4, signedUp: 6, credits: 34000 },
  { rank: 7, name: "Kunle T.", role: "AGENT", converted: 3, signedUp: 7, credits: 27500 },
  { rank: 8, name: "Blessing A.", role: "RENTER", converted: 3, signedUp: 5, credits: 9000 },
  { rank: 9, name: "Chinedu N.", role: "OWNER", converted: 2, signedUp: 4, credits: 20000 },
  { rank: 10, name: "Amara O.", role: "AGENT", converted: 2, signedUp: 3, credits: 15500 },
  { rank: 11, name: "Tobi A.", role: "RENTER", converted: 1, signedUp: 3, credits: 2000 },
  { rank: 12, name: "Uche D.", role: "AGENT", converted: 1, signedUp: 2, credits: 7500 },
];
const dummyPage = (page: number, pageSize: number): LeaderboardData => ({
  total: DUMMY_LEADERS.length, page, pageSize, totalPages: Math.ceil(DUMMY_LEADERS.length / pageSize), yourRank: 2,
  entries: DUMMY_LEADERS.slice((page - 1) * pageSize, page * pageSize),
});

export function useLeaderboard(page: number, pageSize: number) {
  return useQuery<LeaderboardData>({
    queryKey: ["referrals", "leaderboard", page, pageSize],
    queryFn: async () => {
      if (!api.isLiveBackend) return new Promise((r) => setTimeout(() => r(dummyPage(page, pageSize)), 350));
      try { return (await api.getLeaderboard(page, pageSize)) as LeaderboardData; }
      catch { return dummyPage(page, pageSize); }
    },
    placeholderData: (prev) => prev,
  });
}

const medal = (rank: number) => rank === 1 ? "bg-ink text-cream" : rank === 2 ? "bg-[#ECE9DE] text-ink" : rank === 3 ? "bg-green-wash text-green-dark" : "bg-surface-sunken text-text-secondary";

function LeaderLine({ r }: { r: LeaderRow }) {
  return (
    <div className={cx("flex items-center gap-3 border-b border-border-hair px-4 py-3 last:border-b-0", r.isYou && "bg-green-wash/60")}>
      <span className={cx("grid size-8 flex-none place-items-center rounded-full text-[12.5px] font-bold", medal(r.rank))}>{r.rank}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold tracking-[-0.01em]">{r.name}{r.isYou && <span className="ml-1.5 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-cream">You</span>}</div>
        <div className="mt-0.5 text-[11.5px] text-text-tertiary">{r.role === "AGENT" ? "Agent" : r.role === "OWNER" ? "Owner" : "Renter"} · {r.signedUp} signups</div>
      </div>
      <div className="flex-none text-right">
        <div className="text-[13px] font-bold tabular-nums">{r.converted} <span className="text-[11px] font-medium text-text-tertiary">converted</span></div>
        <div className="mt-0.5 font-mono text-[11.5px] font-medium text-green-dark">{ngn(r.credits)}</div>
      </div>
    </div>
  );
}

export function LeaderboardCard() {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading } = useLeaderboard(1, REFERRALS.leaderboardPageSize);
  const top = data?.entries.slice(0, REFERRALS.leaderboardTopN) ?? [];
  return (
    <Card tight>
      <CardH pad title="Leaderboard"
        right={data?.yourRank ? <span className="rounded-full bg-surface-sunken px-2.5 py-1 text-[11.5px] font-semibold text-text-secondary">Your rank: #{data.yourRank}</span> : undefined} />
      <p className="mx-4 mb-2 mt-0 text-[12.5px] leading-normal text-text-tertiary">Every click, signup and conversion on your link is tracked. Top affiliates this quarter:</p>
      {isLoading && !data ? <div className="px-4 pb-4"><SkeletonRows n={4} h={48} /></div> : top.map((r) => <LeaderLine key={r.rank} r={r} />)}
      <button onClick={() => setExpanded(true)} className="flex w-full items-center justify-center gap-1.5 px-4 py-3 text-[13px] font-semibold text-green-dark transition-colors hover:text-ink">
        View full leaderboard<Icon name="chevron-down" size={14} />
      </button>
      <AnimatePresence>{expanded && <LeaderboardModal onClose={() => setExpanded(false)} />}</AnimatePresence>
    </Card>
  );
}

/* Expanded leaderboard — modal (desktop) / sheet (mobile), page numbers only
   (no scrolling): first · windowed numbers · last. */
function LeaderboardModal({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useLeaderboard(page, REFERRALS.leaderboardPageSize);
  const totalPages = data?.totalPages ?? 1;
  const nums = pageWindow(page, totalPages);
  return (
    <Modal wide title="Affiliate leaderboard" sub={`Ranked by converted referrals · ${data?.total ?? "…"} affiliates tracked${data?.yourRank ? ` · you are #${data.yourRank}` : ""}`} onClose={onClose}
      footer={
        <div className="flex w-full flex-wrap items-center justify-center gap-1.5">
          <PgBtn disabled={page === 1} onClick={() => setPage(1)} label="First" />
          {nums.map((n) => (
            <button key={n} onClick={() => setPage(n)}
              className={cx("grid size-9 place-items-center rounded-full text-[13px] font-semibold transition-colors", n === page ? "bg-ink text-cream" : "bg-surface-sunken text-text-secondary hover:bg-[#ECE9DE] hover:text-ink")}>
              {n}
            </button>
          ))}
          <PgBtn disabled={page === totalPages} onClick={() => setPage(totalPages)} label="Last" />
        </div>
      }>
      <div className="overflow-hidden rounded-2xl border border-border-hair">
        {isLoading && !data ? <div className="p-4"><SkeletonRows n={6} h={44} /></div> : (data?.entries ?? []).map((r) => <LeaderLine key={r.rank} r={r} />)}
      </div>
      <p className="mb-0 mt-3 text-center text-[11.5px] text-text-tertiary">Page {page} of {totalPages} · names are shortened for privacy · updates every few minutes</p>
    </Modal>
  );
}
function PgBtn({ disabled, onClick, label }: { disabled: boolean; onClick: () => void; label: string }) {
  return <button disabled={disabled} onClick={onClick} className={cx("rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors", disabled ? "cursor-default bg-surface-sunken text-text-tertiary opacity-50" : "bg-surface-sunken text-text-secondary hover:bg-[#ECE9DE] hover:text-ink")}>{label}</button>;
}
function pageWindow(page: number, total: number): number[] {
  const span = 5;
  let start = Math.max(1, Math.min(page - 2, total - span + 1));
  return Array.from({ length: Math.min(span, total) }, (_, i) => start + i);
}

/* ---------- active coverage areas ---------- */
export function useActiveAreas() {
  return useQuery<ActiveArea[]>({
    queryKey: ["referrals", "active-areas"],
    queryFn: async () => {
      if (!api.isLiveBackend) return ACTIVE_AREAS;
      try { return (await api.getActiveAreas()) as ActiveArea[]; } catch { return ACTIVE_AREAS; }
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function ActiveAreasCard() {
  const { data = ACTIVE_AREAS } = useActiveAreas();
  return (
    <Card tight>
      <CardH pad title="Active coverage areas" right={<span className="text-[12px] text-text-tertiary">we launch area by area</span>} />
      <p className="mx-4 mb-2 mt-0 text-[12.5px] leading-normal text-text-tertiary">Your link converts only in these areas — signups from anywhere else can&rsquo;t transact yet.</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead><tr>
            {["State", "City", "Areas", "Live since"].map((h) => <th key={h} className="border-b border-border-hair px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">{h}</th>)}
          </tr></thead>
          <tbody>
            {data.map((a) => (
              <tr key={a.state + a.city} className="border-b border-border-hair last:border-b-0">
                <td className="px-4 py-3 text-[13px] font-semibold whitespace-nowrap">{a.state}</td>
                <td className="px-4 py-3 text-[13px] whitespace-nowrap">{a.city}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {a.areas.map((ar) => <span key={ar} className="rounded-full bg-surface-sunken px-2.5 py-1 text-[11.5px] font-medium text-text-secondary">{ar}</span>)}
                  </div>
                </td>
                <td className="px-4 py-3 text-[12px] text-text-tertiary whitespace-nowrap">{a.launched}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---------- copy-confirm modal: link copied + where it works ---------- */
export function CopiedLinkModal({ link, onClose }: { link: string; onClose: () => void }) {
  const { data = ACTIVE_AREAS } = useActiveAreas();
  return (
    <Modal title="Link copied" sub="Share it anywhere — but it only converts in Newcondo's active areas." onClose={onClose}
      footer={<DBtn onClick={onClose}>Got it</DBtn>}>
      <div className="mb-3.5 flex items-center gap-3 rounded-2xl bg-green-wash px-4 py-3">
        <span className="grid size-9 flex-none place-items-center rounded-full bg-green-dark text-white"><Icon name="check" size={16} strokeWidth={2.5} /></span>
        <span className="min-w-0 truncate font-mono text-[12.5px] text-text-secondary">{link}</span>
      </div>
      <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">Where your link works right now</div>
      <div className="mb-3 flex flex-col gap-2">
        {data.map((a) => (
          <div key={a.state + a.city} className="flex items-start gap-2.5 rounded-xl border border-border-hair px-3.5 py-2.5">
            <Icon name="map-pin" size={15} className="mt-0.5 flex-none text-green-dark" />
            <div className="min-w-0 text-[12.5px] leading-normal"><b className="font-semibold">{a.city}, {a.state}</b><span className="text-text-tertiary"> — {a.areas.join(", ")}</span></div>
          </div>
        ))}
      </div>
      <Banner icon="info">We roll out area by area for logistics — referrals from outside these areas are recorded but can&rsquo;t convert until their area goes live.</Banner>
    </Modal>
  );
}
