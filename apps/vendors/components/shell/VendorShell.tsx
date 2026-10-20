"use client";
// Vendor app frame: sidebar (role-specific nav), topbar (notifications,
// account), and the two job sheets every page can open.
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Home, Briefcase, Clock, Building2, Wallet, Settings, Bell, Menu, LogOut, ShieldCheck, ChevronRight } from "lucide-react";
import { signOut } from "@newcondo/auth/client";
import api, { unwrap } from "@/lib/api/client";
import { useMe, useOverview } from "@/hooks/useVendor";
import { useUI } from "@/store/ui";
import { VENDORS } from "@/lib/constants";
import { Badge } from "@/components/ui/primitives";
import { JobSheet } from "@/components/jobs/JobSheet";
import { VerifyVisitSheet } from "@/components/jobs/VerifyVisitSheet";

const NAV = [
  { group: "Work", items: [
    { href: "/dashboard", label: "Today", icon: Home, count: "today" as const },
    { href: "/jobs", label: "Jobs", icon: Briefcase },
    { href: "/schedule", label: "Schedule", icon: Clock },
    { href: "/clients", label: "Clients", icon: Building2 },
  ]},
  { group: "Money", items: [{ href: "/payouts", label: "Payouts", icon: Wallet, count: "pending" as const }] },
];
const TITLES: Record<string, string> = { "/dashboard": "Today", "/jobs": "Jobs", "/schedule": "Schedule", "/clients": "Clients", "/payouts": "Payouts", "/settings": "Business & Settings" };

interface Noti { id: string; title: string; body: string; to: string; readAt: string | null; createdAt: string }

export function VendorShell({ children, user }: { children: ReactNode; user: { name: string; email: string } }) {
  const path = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [mobileNav, setMobileNav] = useState(false);
  const [pop, setPop] = useState<"n" | "me" | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { data: me } = useMe();
  const { data: ov } = useOverview();
  const { openJob, verifyJob, setOpenJob, setVerifyJob } = useUI();
  const qc = useQueryClient();
  // Notifications: same endpoints as the platform (notification-service).
  const { data: notis = [] } = useQuery({ queryKey: ["notifications"], queryFn: () => api.get("/notifications").then(unwrap<Noti[]>), refetchInterval: 30_000 });
  const markAll = useMutation({ mutationFn: () => api.post("/notifications/mark-all-read"), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
  const unread = notis.filter((n) => !n.readAt).length;

  useEffect(() => { const id = params.get("open"); if (id) setOpenJob(id); }, [params, setOpenJob]); // deep links from notifications
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setPop(null); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  useEffect(() => setMobileNav(false), [path]);

  const counts = { today: ov?.counts.todayLeft ?? 0, pending: ov?.counts.pendingJobs ?? 0 };
  const initials = (me?.name ?? user.name).split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return <div className="app">
    {mobileNav && <div className="sb-scrim" onClick={() => setMobileNav(false)} />}
    <aside className={`sb${mobileNav ? " open" : ""}`}>
      <Link href="/dashboard" className="sb-brand"><img src="/logo-mark-dark.png" alt="" />newcondo<span className="v-tag">vendors</span></Link>
      <div className="sb-user">
        <div className="sb-user-av">{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div className="sb-user-n">{me?.name ?? user.name}</div>
          <div className="sb-user-r">{me?.services.map((s) => VENDORS.services[s as keyof typeof VENDORS.services]?.label).join(" · ")}{me?.status === "VERIFIED" && <ShieldCheck size={12} color="var(--green-dark)" />}</div>
        </div>
      </div>
      {NAV.map((g) => <div key={g.group}>
        <div className="sb-group">{g.group}</div>
        <nav className="sb-nav">{g.items.map((it) => { const n = it.count ? counts[it.count] : 0; const Ic = it.icon; return <Link key={it.href} href={it.href} prefetch className={`sb-item${path === it.href ? " on" : ""}`}><Ic size={17} />{it.label}{n > 0 && <span className="sb-count">{n}</span>}</Link>; })}</nav>
      </div>)}
      <div className="sb-foot">
        <div className="v-hours"><b>Service hours</b><span>Mon – Thu & Sat · 9:00 – 17:00</span><span className="hint">No visits on Fridays or Sundays.</span></div>
        <nav className="sb-nav"><Link href="/settings" className={`sb-item${path === "/settings" ? " on" : ""}`}><Settings size={17} />Business & Settings</Link></nav>
      </div>
    </aside>
    <div className="main">
      <div className="tb">
        <button className="tb-burger" onClick={() => setMobileNav(true)} aria-label="Menu"><Menu size={20} /></button>
        <div className="tb-crumb"><b>{TITLES[path] ?? "Today"}</b></div>
        <div className="tb-right" ref={ref}>
          <div style={{ position: "relative" }}>
            <button className="tb-icbtn" onClick={() => setPop(pop === "n" ? null : "n")} aria-label="Notifications"><Bell size={17} />{unread > 0 && <span className="tb-dot" />}</button>
            {pop === "n" && <div className="pop">
              <div className="pop-h"><span>Notifications</span>{unread > 0 && <button onClick={() => markAll.mutate()}>Mark all read</button>}</div>
              {notis.length === 0 && <div style={{ padding: "18px 12px", fontSize: 13, color: "var(--text-tertiary)" }}>You&apos;re all caught up.</div>}
              {notis.slice(0, 6).map((n) => <div key={n.id} className={`noti${!n.readAt ? " unread" : ""}`} onClick={() => { setPop(null); router.push(n.to); }}>
                <span className="noti-ic"><Briefcase size={15} /></span>
                <div style={{ minWidth: 0 }}><div className="noti-t">{n.title}</div><div className="noti-s">{n.body}</div></div>
              </div>)}
            </div>}
          </div>
          <div style={{ position: "relative" }}>
            <button className="tb-avatar" onClick={() => setPop(pop === "me" ? null : "me")}>{initials}</button>
            {pop === "me" && <div className="pop" style={{ width: 260 }}>
              <div style={{ padding: "10px 12px 12px", borderBottom: "1px solid var(--border-hair)", marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{me?.name ?? user.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{user.email}</div>
                {me && <div style={{ marginTop: 8, display: "flex", gap: 6 }}><Badge s={me.status} /><span className="badge b-grey">{me.kind === "COMPANY" ? "Company" : "Individual"}</span></div>}
              </div>
              <Link className="menu-i" href="/settings" onClick={() => setPop(null)}><Settings size={16} />Business & Settings<ChevronRight size={14} style={{ marginLeft: "auto" }} /></Link>
              <button className="menu-i danger" onClick={() => signOut({ redirectTo: "/login" })}><LogOut size={16} />Sign out</button>
            </div>}
          </div>
        </div>
      </div>
      {me && me.status !== "VERIFIED" && <div className="banner warn" style={{ margin: "14px clamp(18px,3.5vw,44px) 0" }}><span>Your account is <b>{me.status.toLowerCase()}</b>. Finish documents, bank and service areas in Settings — you&apos;ll start receiving clients once Newcondo verifies you.</span><Link className="btn btn-dark btn-sm" href="/settings">Finish setup</Link></div>}
      <div className="content" key={path}>{children}</div>
    </div>
    {openJob && <JobSheet id={openJob} onClose={() => { setOpenJob(null); if (params.get("open")) router.replace(path); }} />}
    {verifyJob && <VerifyVisitSheet id={verifyJob} onClose={() => setVerifyJob(null)} />}
  </div>;
}
