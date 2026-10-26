"use client";
// Shared vendor-app primitives on the globals.css classes (same visual
// language as the platform dashboard): Modal, Confirm, Stat, Badge, Empty,
// Tabs, SkeletonRows, Select.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown, Check, FileText } from "lucide-react";
import { readView, writeView } from "@/lib/viewState";

export function Modal({ title, sub, onClose, children, footer, wide }: { title?: ReactNode; sub?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const [leaving, setLeaving] = useState(false);
  const close = useCallback(() => setLeaving((l) => { if (!l) setTimeout(onClose, 190); return true; }), [onClose]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // no background scroll while a sheet is open (mobile)
    window.addEventListener("keydown", k);
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [close]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className={`scrim${leaving ? " leaving" : ""}`} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className={`modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true">
        <button className="modal-x" onClick={close} aria-label="Close"><X size={16} /></button>
        {title && <h2>{title}</h2>}
        {sub && <p className="m-sub">{sub}</p>}
        {children}
        {footer && <div className="m-foot">{footer}</div>}
      </div>
    </div>, document.body);
}

export function Confirm({ title, body, confirmLabel = "Confirm", danger = false, onConfirm, onClose }: { title: string; body: ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return <Modal title={title} onClose={onClose} footer={<><button className="btn btn-line" onClick={onClose}>Cancel</button><button className={`btn ${danger ? "btn-danger" : "btn-dark"}`} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button></>}>
    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)" }}>{body}</p>
  </Modal>;
}

export function Stat({ label, value, sub, icon, mono }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; mono?: boolean }) {
  return <div className="stat"><div className="stat-t"><span>{label}</span>{icon}</div><div className={`stat-v${mono ? " mono" : ""}`}>{value}</div>{sub && <div className="stat-s">{sub}</div>}</div>;
}

const BADGE: Record<string, [string, string]> = {
  VERIFIED: ["b-green", "Verified"], PENDING: ["b-amber", "Pending"], SUSPENDED: ["b-red", "Suspended"],
  ACTIVE: ["b-green", "Active"], PAUSED: ["b-amber", "Paused"], SCHEDULED: ["b-grey", "Scheduled"], COMPLETED: ["b-green", "Completed"],
  MISSED: ["b-red", "Missed"], LOCKED: ["b-red", "Locked"], PAID: ["b-green", "Paid"], PROCESSING: ["b-amber", "Payment processing"], BATCHED: ["b-amber", "Payment at 6 pm"],
  ANSWERED: ["b-green", "Answered"], NO_ANSWER: ["b-amber", "No answer"], RINGING: ["b-grey", "Ringing"], FAILED: ["b-red", "Failed"],
  // admin
  FROZEN: ["b-grey", "Frozen"], INVITED: ["b-amber", "Invite sent"], REJECTED: ["b-red", "Rejected"], PUBLISHED: ["b-green", "Live"], RENTED: ["b-ink", "Rented"], DRAFT: ["b-grey", "Draft"],
  UNAVAILABLE: ["b-grey", "Hidden"], IN_ESCROW: ["b-amber", "In escrow"], RELEASED: ["b-green", "Released"], DISPUTED: ["b-red", "Disputed"], REFUNDED: ["b-grey", "Refunded"],
  SETTLED: ["b-green", "Settled"], QUEUED: ["b-amber", "In queue"], ASSIGNED: ["b-amber", "Assigned"], IN_PROGRESS: ["b-amber", "In progress"], AWAITING_CONFIRMATION: ["b-amber", "Owner to confirm"],
  RESOLVED: ["b-green", "Resolved"], UNDER_REVIEW: ["b-amber", "Under review"], VOID: ["b-grey", "Void"], SUCCESS: ["b-green", "Paid"], NONE: ["b-grey", "No payment"],
  HELD: ["b-amber", "In escrow"], INVESTIGATING: ["b-amber", "Fix required"], CANCELLED: ["b-grey", "Cancelled"], EXPIRED: ["b-grey", "Expired"], ISSUE: ["b-red", "Issue reported"],
  PENDING_CONFIRMATION: ["b-amber", "Confirming"], TERMINATED: ["b-grey", "Ended"], QUALIFIED: ["b-green", "Qualified"], REWARDED: ["b-green", "Rewarded"],
  OPEN: ["b-red", "Open"], CLOSED: ["b-grey", "Closed"], RESCHEDULE_REQUESTED: ["b-amber", "Moving"], REQUESTED: ["b-grey", "Requested"],
};
export function Badge({ s, children }: { s: string; children?: ReactNode }) {
  const [cls, label] = BADGE[s] ?? ["b-grey", s];
  return <span className={`badge ${cls}`}>{children ?? label}</span>;
}

export function Empty({ title, sub, icon, action }: { title: string; sub?: string; icon?: ReactNode; action?: ReactNode }) {
  return <div className="empty"><span className="e-ic">{icon ?? <FileText size={22} />}</span><b>{title}</b>{sub && <p>{sub}</p>}{action}</div>;
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; n?: number }[] }) {
  return <div className="tabs" role="tablist">{items.map((i) => <button key={i.id} role="tab" aria-selected={value === i.id} className={value === i.id ? "on" : ""} onClick={() => onChange(i.id)}>{i.label}{i.n !== undefined && <span className="n">{i.n}</span>}</button>)}</div>;
}

export function SkeletonRows({ n = 3, h = 56 }: { n?: number; h?: number }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 14 }}>{Array.from({ length: n }).map((_, i) => <div key={i} className="sk" style={{ height: h, borderRadius: 14 }} />)}</div>;
}

export function Select({ value, onChange, options, placeholder = "Select…" }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const cur = options.find((o) => o.value === value);
  return <div className="ncsel" ref={ref}>
    <button type="button" className={`inp ncsel-t${open ? " open" : ""}`} onClick={() => setOpen(!open)}><span className={cur ? "" : "ncsel-ph"}>{cur?.label ?? placeholder}</span><ChevronDown size={16} /></button>
    {open && <div className="ncsel-m">{options.map((o) => <button type="button" key={o.value} className={`ncsel-o${o.value === value ? " on" : ""}`} onClick={() => { onChange(o.value); setOpen(false); }}>{o.label}{o.value === value && <Check size={14} />}</button>)}</div>}
  </div>;
}

/** Tab that survives leaving and coming back. Read synchronously on first render (lib/viewState),
 *  so the first query a page fires is for the tab you left on — already warm in the cache. */
export function usePersistedTab<T extends string>(key: string, def: T): [T, (v: T) => void] {
  const [t, setT] = useState<T>(() => readView<T>(`tab.${key}`, def));
  return [t, (v: T) => { setT(v); writeView(`tab.${key}`, v); }];
}
