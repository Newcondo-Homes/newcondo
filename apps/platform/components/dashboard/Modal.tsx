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
import { DBtn } from "./primitives";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Modal({ title, sub, onClose, children, wide, footer }: {
  title?: string; sub?: string; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  // Portal to <body>: ancestors with backdrop-filter/transform (the sticky
  // glass Topbar!) become the containing block for position:fixed, which
  // anchored modals opened from the topbar (e.g. the notifications page) to
  // the bar and cut them off. Portaling guarantees viewport positioning.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-5 backdrop-blur-sm max-sm:items-end max-sm:p-0"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog" aria-modal="true"
        className={cx(
          // Desktop: no visible scrollbar — tall wizards fit within 92vh and any
          // rare overflow scrolls with the scrollbar hidden (kept reachable).
          "relative max-h-[92vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-3xl bg-surface p-6 shadow-pop",
          wide ? "w-[640px]" : "w-[480px]",
          "max-w-full max-sm:max-h-[94dvh] max-sm:w-full max-sm:rounded-b-none max-sm:rounded-t-[26px] max-sm:px-[18px] max-sm:pb-[calc(20px+env(safe-area-inset-bottom))]"
        )}
        initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }} transition={{ duration: 0.26, ease: EASE }}
      >
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid size-[34px] place-items-center rounded-full bg-surface-sunken text-ink hover:bg-surface-soft">
          <Icon name="x" size={16} />
        </button>
        {title && <h2 className="m-0 pr-9 text-[21px] font-bold tracking-[-0.03em]">{title}</h2>}
        {sub && <p className="mb-[18px] mt-1 text-[13.5px] leading-normal text-text-tertiary">{sub}</p>}
        {children}
        {footer && <div className="mt-5 flex justify-end gap-2.5 max-sm:sticky max-sm:bottom-0 max-sm:-mx-1 max-sm:bg-surface max-sm:px-1 max-sm:pt-3 max-sm:[&>*]:flex-1">{footer}</div>}
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
