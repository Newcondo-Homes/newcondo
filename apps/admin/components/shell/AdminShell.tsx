"use client";
// apps/admin/components/shell/AdminShell.tsx
// Frame: scope-filtered sidebar (ADMIN_NAV), topbar (notifications, account),
// impersonation banner. Nothing renders until /admin/me resolves, so no page
// ever flashes content the staff member can't access.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Menu, LogOut, Eye, Clock } from "lucide-react";
import { signOut } from "@newcondo/auth/client";
import api, { unwrap } from "@/lib/api/client";
import { A } from "@/lib/api/admin";
import { ADMIN_NAV, ADMIN_ROLES } from "@/lib/scopes";
import { useStaffMe, useOverview } from "@/hooks/useAdmin";
import { StaffProvider, useCan } from "@/components/auth/Can";
import { Boot, NoAccess } from "@/components/shell/NoAccess";
import { API_URL, API_URL_PROBLEM, ApiError } from "@/lib/api/client";
import { Prefetcher } from "@/components/providers/Prefetcher";
import { clearViews } from "@/lib/viewState";

interface Noti { id: string; title: string; body: string; to: string; readAt: string | null }

function ImpersonationBanner() {
  const { me } = useCan(); const qc = useQueryClient(); const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const end = useMutation({ mutationFn: A.endImpersonation, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "me"] }) });
  const s = me?.impersonating; if (!s) return null;
  const left = Math.max(0, new Date(s.expiresAt).getTime() - Date.now());
  const mm = Math.floor(left / 60000), ss = String(Math.floor(left / 1000) % 60).padStart(2, "0");
  return <div className="a-imp"><Eye size={16} /><span>Acting as <b>{s.targetName}</b> ({s.targetRole.toLowerCase()}) · actions are logged against you</span>
    <span className="cd"><Clock size={13} />{mm}:{ss}</span>
    <Link className="btn btn-sm" href={`/users/${s.targetUserId}`}>Open account</Link>
    <button className="btn btn-sm" style={{ marginLeft: 0 }} onClick={() => end.mutate()}>End session</button></div>;
}

function Frame({ children, user }: { children: ReactNode; user: { name: string; email: string } }) {
  const path = usePathname(); const router = useRouter(); const qc = useQueryClient();
  const { me, can, canAny } = useCan();
  const { data: ov } = useOverview();
  const [mobileNav, setMobileNav] = useState(false);
  const [pop, setPop] = useState<"n" | "me" | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setMobileNav(false), [path]);
  // Preload the JS for every page this person can open, so a page switch never waits on a route chunk.
  // (Next only does this in production builds; `next dev` compiles routes on first visit.)
  const allowedHrefs = ADMIN_NAV.flatMap((g) => g.items).filter((it) => (it.scope ? can(it.scope) : true) && (it.any ? canAny(it.any) : true)).map((it) => it.href);
  useEffect(() => { allowedHrefs.forEach((h) => router.prefetch(h)); }, [allowedHrefs.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  const { data: notis = [] } = useQuery({ queryKey: ["notifications"], queryFn: () => api.get("/notifications").then(unwrap<Noti[]>), staleTime: 30_000, refetchInterval: 30_000 });
  const markAll = useMutation({ mutationFn: () => api.post("/notifications/mark-all-read"), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setPop(null); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const q: Record<string, number | null> = ov?.queues ?? {};
  const sum = (keys?: readonly string[]) => (keys ?? []).reduce((n: number, k: string) => n + (q[k] ?? 0), 0);
  const unread = notis.filter((n) => !n.readAt).length;
  const ini = (me?.name ?? user.name).split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const title = ADMIN_NAV.flatMap((g) => g.items).find((i) => path.startsWith(i.href))?.label ?? "Overview";

  return <div className="app">
    {mobileNav && <div className="sb-scrim" onClick={() => setMobileNav(false)} />}
    <aside className={`sb${mobileNav ? " open" : ""}`}>
      <Link href="/overview" className="sb-brand"><img src="/logo-mark-dark.png" alt="" />newcondo<span className="a-tag">admin</span></Link>
      <div className="sb-user"><div className="sb-user-av">{ini}</div><div style={{ minWidth: 0 }}><div className="sb-user-n">{me?.name ?? user.name}</div><div className="sb-user-r">{me ? `${ADMIN_ROLES[me.role].label} · ${me.scopes.length} permissions` : ""}</div></div></div>
      <div style={{ overflow: "auto", flex: 1, minHeight: 0 }}>
        {ADMIN_NAV.map((g) => { const items = g.items.filter((it) => (it.scope ? can(it.scope) : true) && (it.any ? canAny(it.any) : true)); if (!items.length) return null;
          return <div key={g.group}><div className="sb-group">{g.group}</div><nav className="sb-nav">{items.map((it) => { const Ic = it.icon; const n = sum(it.count);
            return <Link key={it.href} href={it.href} prefetch className={`sb-item${path.startsWith(it.href) ? " on" : ""}`}><Ic size={17} />{it.label}{n > 0 && <span className="sb-count">{n}</span>}</Link>; })}</nav></div>; })}
      </div>
    </aside>
    <div className="main">
      <ImpersonationBanner />
      <div className="tb">
        <button className="tb-burger" onClick={() => setMobileNav(true)} aria-label="Menu"><Menu size={20} /></button>
        <div className="tb-crumb"><b>{title}</b></div>
        <div className="tb-right" ref={ref}>
          <div style={{ position: "relative" }}>
            <button className="tb-icbtn" onClick={() => setPop(pop === "n" ? null : "n")} aria-label="Notifications"><Bell size={17} />{unread > 0 && <span className="tb-dot" />}</button>
            {pop === "n" && <div className="pop">
              <div className="pop-h"><span>Notifications</span>{unread > 0 && <button onClick={() => markAll.mutate()}>Mark all read</button>}</div>
              {notis.length === 0 && <div style={{ padding: "18px 12px", fontSize: 13, color: "var(--text-tertiary)" }}>You&apos;re all caught up.</div>}
              {notis.slice(0, 6).map((n) => <div key={n.id} className={`noti${!n.readAt ? " unread" : ""}`} onClick={() => { setPop(null); router.push(n.to); }}><div style={{ minWidth: 0 }}><div className="noti-t">{n.title}</div><div className="noti-s">{n.body}</div></div></div>)}
            </div>}
          </div>
          <div style={{ position: "relative" }}>
            <button className="tb-avatar" onClick={() => setPop(pop === "me" ? null : "me")}>{ini}</button>
            {pop === "me" && <div className="pop" style={{ width: 270 }}>
              <div style={{ padding: "10px 12px 12px", borderBottom: "1px solid var(--border-hair)", marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{me?.name ?? user.name}</div><div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{user.email}</div>
                {me && <div style={{ marginTop: 8, display: "flex", gap: 6 }}><span className="badge b-ink">{ADMIN_ROLES[me.role].label}</span><span className="badge b-grey">{me.scopes.length} permissions</span></div>}
              </div>
              <button className="menu-i danger" onClick={() => { qc.clear(); clearViews(); void signOut({ redirectTo: "/login" }); }}><LogOut size={16} />Sign out</button>
            </div>}
          </div>
        </div>
      </div>
      <div className="content" key={path}>{children}</div>
    </div>
  </div>;
}

export function AdminShell({ children, user }: { children: ReactNode; user: { name: string; email: string } }) {
  const { data: me, isPending, error, refetch, isFetching } = useStaffMe();
  if (API_URL_PROBLEM) return <NoAccess title="The API isn’t configured" body="The dashboard can’t load any data until it knows where combined-backend is." detail={<><b>Fix:</b> {API_URL_PROBLEM}. Set NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1 and restart <b>pnpm dev</b>.</>} />;
  // Block only on the FIRST load. A failed background refresh keeps cached data on screen.
  if (isPending && !me) return <Boot label={isFetching ? "Loading your dashboard…" : "Connecting…"} />;
  if (!me) {
    const e = error as ApiError | null;
    if (e?.status === 403) return <NoAccess title="No admin access" body={e.message || "Your staff account isn’t active."} detail={<>Signed in as <b>{user.email}</b>. If you were just invited, open the invite link and set a password first.</>} />;
    return <NoAccess title="Couldn’t load the dashboard" body={e?.message ?? "Something went wrong talking to the API."} onRetry={() => void refetch()}
      detail={<><b>Checked:</b> {API_URL}/admin/me{e?.status ? ` → HTTP ${e.status}` : " → no response"}<br /><b>Make sure:</b> combined-backend is running, and JWT_SECRET / AUTH_SECRET match between it and this app.</>} />;
  }
  return <StaffProvider me={me}><Prefetcher /><Frame user={user}>{children}</Frame></StaffProvider>;
}
