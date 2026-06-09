"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "@/components/motion";

/**
 * Pageload overlay — covers the viewport on first paint, then fades out.
 * Framer Motion's AnimatePresence handles the exit so content underneath is
 * never left hidden (fail-safe: if JS never runs, the overlay simply isn't
 * rendered server-side, so the page is fully visible).
 */
export function Pageload() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 650);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {!gone && (
        <motion.div
          key="pageload"
          className="fixed inset-0 z-[200] bg-background flex items-start justify-start"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="flex items-center gap-[11px] px-[var(--gutter)] py-[26px] font-bold text-[21px] tracking-[-0.04em] text-ink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-mark-dark.png" alt="" className="w-[30px] h-auto" />
            <span>newcondo</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
