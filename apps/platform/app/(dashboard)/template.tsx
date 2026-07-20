"use client";

/* Page-enter transition for every (dashboard) route — Next remounts
   template.tsx per navigation, so each page fades/rises in. Subtle,
   once, respects the Newcondo easing. */
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
