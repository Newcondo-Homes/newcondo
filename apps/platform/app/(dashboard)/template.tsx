"use client";

/* Page-enter transition for (dashboard) routes. Next remounts template.tsx on
   every navigation — the old 14px rise + full fade replayed on each click and
   made cached pages LOOK like they were reloading. Now a short opacity settle
   (0.85 → 1, 160ms): the page is already there, it just eases in. Respects
   prefers-reduced-motion via MotionProvider. */
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0.85 }} animate={{ opacity: 1 }} transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
