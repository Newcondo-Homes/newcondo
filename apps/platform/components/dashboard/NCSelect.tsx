"use client";

/* NCSelect — design-system dropdown (pill-radius input, pop menu, check on
   selected, rotating chevron). Drop-in replacement for native <select>.
   In the monorepo you can swap this for the @newcondo/ui (shadcn) Select
   restyled with the same classes. */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";

type Opt = string | { value: string; label: string };

export function NCSelect({ value, onChange, options, placeholder = "Select…", disabled, error }: {
  value: string; onChange: (v: string) => void; options: Opt[]; placeholder?: string; disabled?: boolean; error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const cur = opts.find((o) => o.value === value);
  return (
    <div ref={ref} className={cx("relative min-w-0", disabled && "pointer-events-none opacity-55")}>
      <button type="button" onClick={() => setOpen(!open)}
        className={cx(
          "flex w-full items-center justify-between gap-2.5 rounded-2xl border bg-surface px-3.5 py-3 text-left text-[14.5px] text-text-primary outline-none transition-shadow",
          error ? "border-danger" : open ? "border-ink shadow-[0_0_0_4px_rgba(19,19,19,0.06)]" : "border-nc-border"
        )}>
        <span className={cx("truncate", !cur && "text-text-tertiary")}>{cur ? cur.label : placeholder}</span>
        <Icon name="chevron-down" size={16} className={cx("flex-none text-text-tertiary transition-transform duration-200 ease-nc", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-[calc(100%+6px)] z-[90] max-h-[236px] overflow-auto rounded-2xl border border-border-hair bg-surface p-1.5 shadow-pop">
            {opts.map((o) => (
              <button type="button" key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                className={cx("flex w-full items-center justify-between gap-2.5 rounded-[11px] px-3 py-2.5 text-left text-[14px] transition-colors hover:bg-surface-sunken",
                  o.value === value ? "font-semibold" : "font-medium")}>
                {o.label}
                {o.value === value && <Icon name="check" size={14} strokeWidth={2.5} className="text-green-dark" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* form field wrapper */
export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold tracking-[-0.01em]">{label}</label>
      {children}
      {hint && !error && <span className="text-[12px] text-text-tertiary">{hint}</span>}
      {error && <span className="flex items-center gap-1 text-[12px] text-danger"><Icon name="triangle-alert" size={12} />{error}</span>}
    </div>
  );
}
export const inputCls = (err?: boolean) =>
  cx("w-full rounded-2xl border bg-surface px-3.5 py-3 text-[14.5px] text-text-primary outline-none transition-shadow placeholder:text-text-tertiary focus:border-ink focus:shadow-[0_0_0_4px_rgba(19,19,19,0.06)]",
    err ? "border-danger" : "border-nc-border");
