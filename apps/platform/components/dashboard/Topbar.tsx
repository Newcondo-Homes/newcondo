"use client";

/* Topbar: crumb, notifications bell (popover), user menu, preview role
   switcher (remove in production — role comes from the session). */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast } from "@newcondo/ui/";
import { useRole } from "@/components/providers/role-provider";
import { ROLE_LABEL } from "./Sidebar";
import { useNotifications, useCacheUpdate } from "@/hooks/dashboard/useDashboardData";
import { useNotificationStream } from "@/hooks/dashboard/useNotificationStream";
import { markAllNotificationsRead, isLiveBackend } from "@/lib/api/dashboard";
import type { Notification, Role } from "@/lib/dashboard/data";

const CRUMB: Record<string, string> = {
  "/dashboard": "Dashboard", "/properties": "Properties", "/marking": "Marking", "/payments": "Payments",
  "/services": "Services", "/wallet": "Wallet & Accounts", "/referrals": "Referrals", "/profile": "Profile & Settings", "/browse": "Browse",
};
/* role-aware section names — matches each role's sidebar labels */
const CRUMB_ROLE: Partial<Record<Role, Record<string, string>>> = {
  RENTER: { "/payments": "My Rentals" },
  AGENT: { "/payments": "Commissions", "/properties": "My Listings" },
  OWNER: { "/properties": "My Properties" },
};
const N_ICON: Record<Notification["kind"], string> = { marking: "map-pin", payment: "credit-card", wallet: "wallet", verify: "shield-check" };

const pop = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
};

export function Topbar({ onBurger }: { onBurger: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, setRole, user } = useRole();
  const [open, setOpen] = useState<"notif" | "me" | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { data: notifs = [] } = useNotifications(role);
  useNotificationStream(role); // SSE: live pushes land in the same cache + toast
  const cache = useCacheUpdate();
  useEffect(() => {
    const h = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const unread = notifs.filter((n) => n.unread).length;
  const parts = pathname.split("/").filter(Boolean);
  const section = "/" + (parts[0] || "dashboard");
  const crumb = CRUMB_ROLE[role]?.[section] || CRUMB[section] || "Dashboard";
  const markAll = () => {
    // POST /api/v1/notifications/mark-all-read (notification-service); the
    // optimistic cache update keeps the badge instant either way
    if (isLiveBackend) markAllNotificationsRead().catch(() => {});
    cache.update<Notification[]>(["notifications", role], (l) => l.map((n) => ({ ...n, unread: false })));
    toast.info("All notifications marked as read");
  };
  return (
    <div className="sticky top-0 z-50 flex items-center gap-3.5 border-b border-border-hair bg-nc-background/80 px-[clamp(14px,3.5vw,44px)] py-2.5 backdrop-blur-xl">
      <button className="hidden max-[1000px]:flex text-ink" onClick={onBurger} aria-label="Menu"><Icon name="menu" size={20} /></button>
      <div className="flex min-w-0 items-center gap-2 text-[14.5px] font-semibold text-text-tertiary">
        <b className="whitespace-nowrap font-bold tracking-[-0.02em] text-text-primary">{crumb}</b>
        {parts.length > 1 && (<><Icon name="chevron-right" size={13} /><span className="truncate">{parts[1]}</span></>)}
      </div>
      <div ref={wrapRef} className="ml-auto flex items-center gap-2.5">
        {/* TODO: PREVIEW ONLY — in production the role comes from the session; delete this switcher */}
        <div className="flex gap-[3px] rounded-full bg-surface-sunken p-[3px] max-sm:hidden">
          {(["OWNER", "AGENT", "RENTER"] as Role[]).map((r) => (
            <button key={r} onClick={() => { setRole(r); router.push("/dashboard"); }}
              className={cx("rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors", role === r ? "bg-ink text-cream" : "text-text-tertiary")}>
              {ROLE_LABEL[r].split(" ")[0]}
            </button>
          ))}
        </div>
        <div className="relative">
          <button aria-label="Notifications" onClick={() => setOpen(open === "notif" ? null : "notif")}
            className="relative grid size-[38px] place-items-center rounded-full border border-nc-border bg-surface text-ink transition-colors hover:bg-surface-soft">
            <Icon name="bell" size={17} />
            {unread > 0 && <span className="absolute right-2 top-[7px] size-2 rounded-full border-2 border-surface bg-green" />}
          </button>
          <AnimatePresence>
            {open === "notif" && (
              <motion.div {...pop} className="absolute right-0 top-[46px] z-[70] w-[330px] rounded-[18px] border border-border-hair bg-surface p-2 shadow-pop max-sm:fixed max-sm:inset-x-3 max-sm:top-16 max-sm:w-auto">
                <div className="flex items-center justify-between px-3 pb-2 pt-2.5 text-[13px] font-bold">
                  <span>Notifications</span>
                  {unread > 0 && <button className="text-[12px] font-semibold text-green-dark" onClick={markAll}>Mark all read</button>}
                </div>
                {notifs.length === 0 && <div className="px-3 py-4 text-[13px] text-text-tertiary">You&rsquo;re all caught up.</div>}
                <div className="flex flex-col gap-[5px]">
                  {notifs.map((n) => (
                    <button key={n.id} onClick={() => { setOpen(null); router.push(n.to); }}
                      className={cx("flex gap-2.5 rounded-xl p-3 text-left transition-colors hover:bg-surface-sunken", n.unread && "bg-green-wash")}>
                      <span className={cx("grid size-8 flex-none place-items-center rounded-[10px]", n.unread ? "bg-white text-green-dark" : "bg-surface-sunken text-ink")}>
                        <Icon name={N_ICON[n.kind]} size={15} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13.5px] font-semibold leading-snug">{n.t}</span>
                        <span className="mt-0.5 block text-[12px] leading-snug text-text-tertiary">{n.s} · {n.time}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="relative">
          <button onClick={() => setOpen(open === "me" ? null : "me")} className="grid size-[38px] place-items-center rounded-full bg-ink text-[12.5px] font-bold text-cream">{user.initials}</button>
          <AnimatePresence>
            {open === "me" && (
              <motion.div {...pop} className="absolute right-0 top-[46px] z-[70] w-[250px] rounded-[18px] border border-border-hair bg-surface p-2 shadow-pop">
                <div className="mb-1.5 border-b border-border-hair px-3 pb-3 pt-2.5">
                  <div className="text-[14px] font-semibold">{user.name}</div>
                  <div className="mt-0.5 text-[12px] text-text-tertiary">{user.email}</div>
                </div>
                <Link href="/profile" onClick={() => setOpen(null)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium text-text-primary no-underline hover:bg-surface-sunken">
                  <Icon name="settings" size={16} />Profile &amp; Settings
                </Link>
                <button onClick={() => toast.info("Signed out (preview)", { description: "In production this calls signOut() from @newcondo/auth/client" })}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium text-danger hover:bg-surface-sunken">
                  <Icon name="log-out" size={16} />Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
