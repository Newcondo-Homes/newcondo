"use client";

/* Role-aware sidebar — mirrors the nav model per role. */
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { useRole } from "@/components/providers/role-provider";
import { useOwnerMarkingJobs, usePendingEscrow } from "@/hooks/dashboard/useDashboardData";
import type { Role } from "@/lib/dashboard/data";

interface NavItem { name: string; href: string; icon: string; countKey?: "marking" | "escrow"; pill?: string; }
interface NavGroup { group: string; items: NavItem[]; }

const NAV: Record<Role, NavGroup[]> = {
  OWNER: [
    { group: "Manage", items: [
      { name: "Dashboard", href: "/dashboard", icon: "home" },
      { name: "My Properties", href: "/properties", icon: "building-2" },
      { name: "Marking Jobs", href: "/marking", icon: "map-pin", countKey: "marking" },
      { name: "Services", href: "/services", icon: "briefcase" },
    ]},
    { group: "Money", items: [
      { name: "Payments", href: "/payments", icon: "credit-card", countKey: "escrow" },
      { name: "Wallet & Accounts", href: "/wallet", icon: "wallet" },
    ]},
    { group: "Grow", items: [{ name: "Referrals", href: "/referrals", icon: "gift" }] },
  ],
  AGENT: [
    { group: "Manage", items: [
      { name: "Dashboard", href: "/dashboard", icon: "home" },
      { name: "My Listings", href: "/properties", icon: "building-2" },
      { name: "Marking Queue", href: "/marking", icon: "map-pin", pill: "Available" },
      { name: "Services", href: "/services", icon: "briefcase" },
    ]},
    { group: "Money", items: [
      { name: "Commissions", href: "/payments", icon: "credit-card" },
      { name: "Wallet & Accounts", href: "/wallet", icon: "wallet" },
    ]},
    { group: "Grow", items: [{ name: "Referrals", href: "/referrals", icon: "gift" }] },
  ],
  RENTER: [
    { group: "Home", items: [
      { name: "Dashboard", href: "/dashboard", icon: "home" },
      { name: "Browse", href: "/browse", icon: "search" },
      { name: "My Rentals", href: "/payments", icon: "receipt" },
      { name: "Wallet", href: "/wallet", icon: "wallet" },
    ]},
    { group: "Grow", items: [{ name: "Referrals", href: "/referrals", icon: "gift" }] },
  ],
};
export const ROLE_LABEL: Record<Role, string> = { OWNER: "Property owner", AGENT: "Agent", RENTER: "Renter" };

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role, user } = useRole();
  const marking = useOwnerMarkingJobs();
  const escrow = usePendingEscrow(role);
  const counts = {
    marking: role === "OWNER" ? (marking.data ?? []).filter((j) => j.status === "AWAITING_CONFIRMATION").length : 0,
    escrow: (escrow.data ?? []).length,
  };
  const isOn = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(href + "/"));
  return (
    <>
      <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5 px-2.5 pb-4 text-[19px] font-bold tracking-[-0.04em] text-ink no-underline">
        <Image src="/assets/logo-mark-dark.png" alt="" width={26} height={26} />
        newcondo
      </Link>
      <div className="mb-3.5 flex items-center gap-2.5 rounded-2xl bg-surface-sunken p-3">
        <div className="grid size-9 flex-none place-items-center rounded-full bg-ink text-[12.5px] font-bold text-cream">{user.initials}</div>
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-semibold leading-tight">{user.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-text-tertiary">
            {ROLE_LABEL[role]} · {user.plan}
            {user.verificationStatus === "VERIFIED" && <Icon name="shield-check" size={12} className="text-green-dark" />}
          </div>
        </div>
      </div>
      {NAV[role].map((g) => (
        <div key={g.group}>
          <div className="px-2.5 pb-1.5 pt-3.5 text-[10.5px] font-semibold uppercase tracking-[0.13em] text-text-tertiary">{g.group}</div>
          <nav className="flex flex-col gap-0.5">
            {g.items.map((it) => (
              <Link key={it.href} href={it.href} onClick={onNavigate}
                className={cx(
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-[9.5px] text-[14px] font-medium no-underline transition-colors duration-150 ease-nc",
                  isOn(it.href) ? "bg-ink font-semibold text-cream" : "text-text-secondary hover:bg-surface-sunken hover:text-ink"
                )}>
                <Icon name={it.icon} size={17} />
                {it.name}
                {it.pill && role === "AGENT" && user.isAvailableForMarking && (
                  <span className={cx("ml-auto rounded-full px-2 py-[3px] text-[10.5px] font-bold", isOn(it.href) ? "bg-green-bright text-ink" : "bg-green-wash text-green-dark")}>{it.pill}</span>
                )}
                {it.countKey && counts[it.countKey] > 0 && (
                  <span className={cx("ml-auto min-w-[19px] rounded-full px-1.5 py-[2.5px] text-center text-[11px] font-bold", isOn(it.href) ? "bg-cream/20 text-cream" : "bg-surface-sunken text-text-secondary")}>{counts[it.countKey]}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      ))}
      <div className="mt-auto border-t border-border-hair pt-3">
        {role === "RENTER" && (
          <div className="mb-1.5 rounded-[18px] bg-ink p-4 text-cream">
            <h4 className="m-0 text-[14px] font-semibold tracking-[-0.02em]">Go Premium</h4>
            <p className="mb-2.5 mt-1 text-[12px] leading-normal text-text-on-dark-2">Unlock marking-job income and your virtual wallet.</p>
            <Link href="/profile" onClick={onNavigate} className="inline-flex rounded-full bg-green-bright px-3.5 py-2 text-[13px] font-semibold text-ink no-underline">Upgrade</Link>
          </div>
        )}
        <Link href="/profile" onClick={onNavigate}
          className={cx(
            "flex items-center gap-2.5 rounded-xl px-2.5 py-[9.5px] text-[14px] font-medium no-underline transition-colors duration-150 ease-nc",
            isOn("/profile") ? "bg-ink font-semibold text-cream" : "text-text-secondary hover:bg-surface-sunken hover:text-ink"
          )}>
          <Icon name="settings" size={17} />
          Profile &amp; Settings
          {user.verificationStatus === "PENDING" && <span className="ml-auto rounded-full bg-[#B8860B]/12 px-1.5 py-[2.5px] text-[11px] font-bold text-[#B8860B]">!</span>}
        </Link>
      </div>
    </>
  );
}
