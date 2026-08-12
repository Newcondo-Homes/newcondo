"use client";

/* Modal + ConfirmDialog with framer-motion enter/exit.
   Desktop: centered dialog. Mobile: bottom sheet.
   Usage: <AnimatePresence>{open && <Modal .../>}</AnimatePresence> —
   feature components already wrap conditionals in AnimatePresence.
   (In the monorepo you may prefer @newcondo/ui Dialog/Drawer; this keeps
   the exact Newcondo look with zero extra deps.) */
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { DBtn } from "./primitives";

const EASE = [0.22, 1, 0.36, 1] as const;

/* Body scroll-lock lives in hooks/useBodyScrollLock so the mobile sidebar
   drawer uses the exact same behaviour (refcounted, position-fixed, and an
   instant — not smooth — scroll restore on release). */

export function Modal({ title, sub, onClose, children, wide, footer }: {
  title?: string; sub?: string; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  useBodyScrollLock();
  // Portal to <body>: ancestors with backdrop-filter/transform (the sticky
  // glass Topbar!) become the containing block for position:fixed, which
  // anchored modals opened from the topbar (e.g. the notifications page) to
  // the bar and cut them off. Portaling guarantees viewport positioning.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <motion.div
      // overscroll-none stops a scroll gesture that reaches the end of the
      // sheet from chaining out to the page behind it.
      className="fixed inset-0 z-[100] flex items-center justify-center overscroll-none bg-ink/40 p-5 backdrop-blur-sm max-sm:items-end max-sm:p-0"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      // Touch equivalent of the mousedown scrim-close, so tapping outside
      // dismisses on phones too.
      onTouchStart={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog" aria-modal="true"
        className={cx(
          // Flex COLUMN, not a single scrolling box: header and footer are
          // flex-none and the body is the only scroll region. Previously the
          // panel scrolled as a whole with a sticky footer inside it, so on
          // short phones (iPhone 12/13 mini, 12 Pro) the last content — the
          // "Occupied flats update automatically…" banner — could never clear
          // the bar. Now the body owns the scroll and always reaches its end.
          "relative flex max-h-[92vh] flex-col rounded-3xl bg-surface shadow-pop",
          wide ? "w-[640px]" : "w-[480px]",
          "max-w-full max-sm:max-h-[94dvh] max-sm:w-full max-sm:rounded-b-none max-sm:rounded-t-[26px]"
        )}
        initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }} transition={{ duration: 0.26, ease: EASE }}
      >
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-20 grid size-[34px] place-items-center rounded-full bg-surface-sunken text-ink hover:bg-surface-soft">
          <Icon name="x" size={16} />
        </button>

        {(title || sub) && (
          <div className="flex-none px-6 pt-6 max-sm:px-[18px] max-sm:pt-5">
            {title && <h2 className="m-0 pr-9 text-[21px] font-bold tracking-[-0.03em]">{title}</h2>}
            {sub && <p className="mb-0 mt-1 text-[13.5px] leading-normal text-text-tertiary">{sub}</p>}
          </div>
        )}

        {/* The one scroll region. min-h-0 is required for a flex child to be
            allowed to shrink and scroll rather than pushing the footer out. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-1 pt-[18px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-sm:px-[18px]">
          {children}
        </div>

        {footer && (
          <div
            className={cx(
              "flex flex-none justify-end gap-2.5 border-t border-border-hair px-6 py-4",
              "max-sm:flex-wrap max-sm:px-[18px] max-sm:pb-[calc(14px+env(safe-area-inset-bottom))] max-sm:pt-3.5",
              "max-sm:[&>*]:min-w-0 max-sm:[&>*]:flex-1"
            )}
          >
            {footer}
          </div>
        )}
        {!footer && <div className="flex-none pb-6 max-sm:pb-[calc(18px+env(safe-area-inset-bottom))]" />}
      </motion.div>
    </motion.div>,
    document.body
  );
}

export function ConfirmDialog({ title, body, confirmLabel = "Confirm", danger, onConfirm, onClose }: {
  title: string; body: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}
      footer={<>
        <DBtn variant="line" onClick={onClose}>Cancel</DBtn>
        <DBtn variant={danger ? "danger" : "dark"} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</DBtn>
      </>}>
      <p className="m-0 text-[14px] leading-relaxed text-text-secondary">{body}</p>
    </Modal>
  );
}
