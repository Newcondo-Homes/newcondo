"use client";

/* Shared dashboard primitives: PageHead, StatCard, StatusBadge, Tabs,
   EmptyState, Skeletons, KV, Banner, Countdown, Meter, MapPlaceholder,
   CopyField, Thumb. All styled on the globals.css Newcondo tokens. */
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast } from "@newcondo/ui";
import { hoursLabel, minsLabel } from "@/lib/dashboard/format";

/* ---------- page head ---------- */
export function PageHead({ title, sub, actions, back }: { title: string; sub?: string; actions?: ReactNode; back?: "HISTORY" | string }) {
  const router = useRouter();
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4 max-sm:mb-4">
      <div className="min-w-0">
        {back && (
          <button onClick={() => (back === "HISTORY" ? router.back() : router.push(back))}
            className="mb-2.5 flex items-center gap-2 text-[13.5px] font-semibold text-text-secondary hover:text-ink">
            <Icon name="arrow-left" size={15} />Back
          </button>
        )}
        <h1 className="m-0 text-[clamp(23px,3vw,34px)] font-bold leading-none tracking-[-0.04em]">{title}</h1>
        {sub && <p className="mb-0 mt-2 text-[14.5px] text-text-tertiary [text-wrap:pretty]">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5 max-sm:w-full max-sm:[&>*]:flex-1">{actions}</div>}
    </div>
  );
}

/* ---------- pill buttons (dashboard-scale; the marketing Button is larger) ---------- */
export function DBtn({ variant = "dark", sm, className, children, disabled, onClick }: {
  variant?: "dark" | "line" | "green" | "danger" | "ghost"; sm?: boolean; className?: string; children: ReactNode; disabled?: boolean; onClick?: () => void;
}) {
  const v = {
    dark: "bg-ink text-cream hover:bg-black hover:shadow-card border-transparent",
    line: "bg-surface text-ink border-border-strong hover:bg-surface-soft",
    green: "bg-green text-white hover:bg-green-dark border-transparent",
    danger: "bg-danger text-white hover:bg-[#a33224] border-transparent",
    ghost: "bg-transparent text-text-secondary hover:text-ink border-transparent",
  }[variant];
  return (
    <button disabled={disabled} onClick={onClick}
      className={cx("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border font-semibold leading-none transition-all duration-200 ease-nc active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55",
        sm ? "px-[15px] py-[8.5px] text-[13px]" : "px-5 py-[11.5px] text-[14px]", v, className)}>
      {children}
    </button>
  );
}

/* ---------- stat card ---------- */
export function StatCard({ label, value, sub, icon, mono, trend }: { label: string; value: ReactNode; sub?: ReactNode; icon?: string; mono?: boolean; trend?: number }) {
  return (
    <div className="rounded-[20px] border border-border-hair bg-surface px-5 py-[18px] shadow-[0_1px_2px_rgba(19,19,19,0.04)] max-sm:px-4 max-sm:py-[15px]">
      <div className="flex items-center justify-between text-[12.5px] font-semibold text-text-tertiary">
        <span>{label}</span>{icon && <Icon name={icon} size={16} />}
      </div>
      <div className={cx("mt-2 font-bold tracking-[-0.035em]", mono ? "font-mono text-[20px] sm:text-[23px] tracking-[-0.01em]" : "text-[22px] sm:text-[26px]")}>{value}</div>
      {(sub || trend !== undefined) && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-text-tertiary">
          {trend !== undefined && <span className={cx("font-semibold", trend > 0 ? "text-green-dark" : "text-danger")}>{trend > 0 ? "+" : ""}{trend}%</span>}
          {sub}
        </div>
      )}
    </div>
  );
}

/* ---------- status badge ---------- */
const BADGE: Record<string, [string, string]> = {
  PUBLISHED: ["green", "Live"], RENTED: ["ink", "Rented"], DRAFT: ["grey", "Draft"],
  PENDING_MARKING: ["amber", "Needs marking"], PENDING_REVIEW: ["amber", "In review"], UNAVAILABLE: ["grey", "Unavailable"],
  RELEASED: ["green", "Released"], SETTLED: ["grey", "Settled"], DEDUCTED: ["grey", "Deducted"], PAID: ["green", "Paid"],
  CONFIRMED: ["green", "Confirmed"], PARTIAL: ["amber", "Drip payout"], IN_ESCROW: ["amber", "In escrow"],
  AWAITING_CONFIRMATION: ["amber", "Confirm marking"], COMPLETED: ["green", "Completed"], IN_QUEUE: ["amber", "In queue"],
  CONVERTED: ["green", "Converted"], SIGNED_UP: ["amber", "Signed up"], INVITED: ["grey", "Invited"],
  VERIFIED: ["green", "Verified"], PENDING: ["amber", "Pending"], REJECTED: ["red", "Rejected"],
  OCCUPIED: ["ink", "Occupied"], VACANT: ["green", "Vacant"], UNDER_CONSTRUCTION: ["amber", "Under construction"],
  SCHEDULED: ["amber", "Scheduled"], ACTIVE: ["green", "Active"], IN_PROGRESS: ["amber", "In progress"], ISSUE: ["red", "Issue raised"],
  PUBLIC: ["green", "Public"], PERMISSION: ["amber", "By approval"], RESTRICTED: ["grey", "Restricted"],
};
const TONE: Record<string, string> = {
  green: "bg-green-wash text-green-dark", amber: "bg-[#B8860B]/10 text-[#8a6508]",
  red: "bg-danger/10 text-danger", ink: "bg-ink text-cream", grey: "bg-surface-sunken text-text-secondary",
};
export function StatusBadge({ s, children }: { s: string; children?: ReactNode }) {
  const [tone, label] = BADGE[s] ?? ["grey", s];
  return <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold", TONE[tone])}>{children ?? label}</span>;
}

/* ---------- tabs (pill segmented; wraps on mobile — never a scrollbar) ---------- */
export function Tabs({ value, onChange, items }: { value: string; onChange: (v: string) => void; items: [string, string, number?][] }) {
  return (
    <div className="mb-4 flex w-max max-w-full flex-wrap gap-1 rounded-full bg-surface-sunken p-1 max-sm:w-full max-sm:rounded-[20px]">
      {items.map(([k, label, n]) => (
        <button key={k} onClick={() => onChange(k)}
          className={cx("whitespace-nowrap rounded-full px-4 py-2 text-[13.5px] font-semibold transition-all duration-150 ease-nc max-sm:flex-auto max-sm:px-2 max-sm:text-[12px]",
            value === k ? "bg-surface text-ink shadow-[0_1px_2px_rgba(19,19,19,0.06)]" : "text-text-secondary")}>
          {label}{n !== undefined && <span className="ml-1.5 text-[11px] font-bold text-text-tertiary">{n}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- card / list row / thumb ---------- */
export function Card({ className, children, tight }: { className?: string; children: ReactNode; tight?: boolean }) {
  return <div className={cx("rounded-[22px] border border-border-hair bg-surface shadow-[0_1px_2px_rgba(19,19,19,0.04)] max-sm:rounded-[18px]", tight ? "overflow-hidden" : "p-[22px] max-sm:p-4", className)}>{children}</div>;
}
export function CardH({ title, right, pad }: { title: ReactNode; right?: ReactNode; pad?: boolean }) {
  return (
    <div className={cx("flex items-center justify-between gap-3", pad ? "px-5 pb-1 pt-[18px] max-sm:px-4" : "mb-3.5")}>
      <h3 className="m-0 text-[15.5px] font-bold tracking-[-0.02em] sm:text-[16.5px]">{title}</h3>
      {right}
    </div>
  );
}
export function Thumb({ icon = "building-2", size = 58, className }: { icon?: string; size?: number; className?: string }) {
  return <div className={cx("grid flex-none place-items-center rounded-[14px] bg-surface-sunken text-text-tertiary", className)} style={{ width: size, height: size }}><Icon name={icon} size={Math.round(size / 2.8)} /></div>;
}
export function Row({ onClick, children, className }: { onClick?: () => void; children: ReactNode; className?: string }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick}
      className={cx("flex w-full items-center gap-3.5 border-b border-border-hair px-4 py-3 text-left transition-colors last:border-b-0 max-sm:flex-wrap max-sm:gap-y-2",
        onClick && "hover:bg-surface-sunken", className)}>
      {children}
    </Comp>
  );
}

/* ---------- empty / skeleton ---------- */
export function EmptyState({ icon = "file-text", title, sub, action }: { icon?: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-11 text-center text-text-tertiary">
      <span className="mb-3.5 grid size-[52px] place-items-center rounded-2xl bg-surface-sunken"><Icon name={icon} size={22} /></span>
      <b className="text-[15px] tracking-[-0.01em] text-text-primary">{title}</b>
      {sub && <p className="mb-3.5 mt-1.5 max-w-[38ch] text-[13px] leading-normal">{sub}</p>}
      {action}
    </div>
  );
}
export function SkeletonRows({ n = 3, h = 52 }: { n?: number; h?: number }) {
  return (
    <div className="flex flex-col gap-2.5 py-1">
      {Array.from({ length: n }).map((_, i) => <div key={i} className="animate-pulse rounded-[14px] bg-surface-sunken" style={{ height: h }} />)}
    </div>
  );
}

/* ---------- key-value / banner ---------- */
export function KV({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3.5 border-b border-border-hair py-[9px] text-[13.5px] last:border-b-0">
      <span className="text-text-tertiary">{k}</span>
      <span className={cx("text-right font-semibold", mono && "font-mono font-medium")}>{v}</span>
    </div>
  );
}
export function Banner({ tone = "info", icon, children, action }: { tone?: "info" | "warn"; icon?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className={cx("flex items-center gap-3 rounded-[18px] px-4 py-[13px] text-[13.5px] leading-normal max-sm:flex-wrap",
      tone === "warn" ? "bg-[#B8860B]/10 text-[#6d4a06]" : "bg-surface-sunken text-text-secondary")}>
      {icon && <span className={cx("flex flex-none", tone === "warn" ? "text-[#B8860B]" : "text-text-tertiary")}><Icon name={icon} size={17} /></span>}
      <div className="min-w-0 flex-1 [&_b]:text-text-primary">{children}</div>
      {action && <div className="flex-none max-sm:w-full max-sm:[&>*]:w-full">{action}</div>}
    </div>
  );
}

/* ---------- countdown chip / meter ---------- */
export function Countdown({ hoursLeft, minsLeft, label = "left", green }: { hoursLeft?: number; minsLeft?: number; label?: string; green?: boolean }) {
  const txt = minsLeft != null ? minsLabel(minsLeft) : hoursLabel(hoursLeft ?? 0);
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-[5px] font-mono text-[12.5px]",
      green ? "bg-green-wash text-green-dark" : "bg-[#B8860B]/10 text-[#8a6508]")}>
      <Icon name="clock" size={13} />{txt} {label}
    </span>
  );
}
export function Meter({ pct, warn }: { pct: number; warn?: boolean }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
      <div className={cx("h-full rounded-full transition-[width] duration-500 ease-nc", warn ? "bg-[#B8860B]" : "bg-ink")} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

/* ---------- map placeholder ----------
   Placeholder for the react-google-maps/api map + boundary overlay
   (components/marking/SyncedMaps.tsx renders the real thing). */
export function MapPlaceholder({ h = 200, marked, tag = "Google Maps — default view" }: { h?: number; marked?: boolean; tag?: string }) {
  return (
    <div className="relative min-w-0 max-w-full overflow-hidden rounded-2xl border border-nc-border bg-[#e8e6dc]" style={{ height: h }}>
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className={cx("absolute rounded", marked ? "bg-[rgba(192,57,43,0.32)] border-2 border-[#c0392b]" : "bg-green/20 border-2 border-green")} style={{ left: "40%", top: "34%", width: "17%", height: "24%" }} />
      <div className="absolute rounded border-2 border-border-strong bg-ink/5" style={{ left: "63%", top: "52%", width: "12%", height: "17%" }} />
      <div className="absolute rounded border-2 border-border-strong bg-ink/5" style={{ left: "20%", top: "55%", width: "13%", height: "19%" }} />
      <span className="absolute text-ink drop-shadow-md" style={{ left: "46%", top: "22%" }}><Icon name="map-pin" size={26} /></span>
      <span className="absolute bottom-3 right-3 rounded-full bg-white px-2.5 py-[5px] text-[11.5px] font-semibold shadow-sm">{tag}</span>
    </div>
  );
}

/* ---------- copy-to-clipboard field ---------- */
export function CopyField({ value, toastMsg = "Link copied to clipboard" }: { value: string; toastMsg?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText("https://" + value); } catch {}
    setCopied(true);
    toast.success(toastMsg, { description: value });
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-nc-border bg-surface-sunken py-[5px] pl-4 pr-[5px]">
      <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-text-secondary">{value}</span>
      <button onClick={copy} className={cx("flex flex-none items-center gap-1.5 rounded-full px-[15px] py-[9px] text-[13px] font-semibold text-cream transition-colors", copied ? "bg-green" : "bg-ink")}>
        <Icon name={copied ? "check" : "copy"} size={13} strokeWidth={2.2} />{copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/* ---------- photo placeholder grid ---------- */
export function PhotoGrid({ n, cols = 3, h = 58, labels }: { n: number; cols?: number; h?: number; labels?: string[] }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="relative grid place-items-center rounded-[10px] bg-surface-sunken text-text-tertiary" style={{ height: h }}>
          <Icon name="camera" size={15} />
          {labels?.[i] && <span className="absolute bottom-1 text-[9.5px] font-semibold uppercase tracking-wide">{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}
