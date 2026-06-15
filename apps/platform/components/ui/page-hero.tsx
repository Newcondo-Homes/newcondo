"use client";

/* ============================================================
   PageHero — compact dark header band for brand sub-pages
   (About / Careers / Support). Mirrors the landing hero's ink
   aesthetic, but short. Pairs with the cream/white Sections below.
   ============================================================ */

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { container, mount, EASE, EXPO } from "@/components/motion";

const line = { hidden: { y: "115%" }, show: { y: "0%", transition: { duration: 0.9, ease: EXPO } } };
const fade = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } };

export function PageHero({
  eyebrow,
  title,
  lead,
  label,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  label?: string;
  children?: ReactNode;
}) {
  return (
    <section
      className="relative bg-ink overflow-hidden pt-[clamp(150px,20vh,210px)] pb-[clamp(64px,9vw,104px)]"
      data-screen-label={label ?? "Page hero"}
    >
      {/* soft radial glow, no canvas — keeps sub-pages light */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{ background: "radial-gradient(820px 420px at 78% -8%, rgba(45,138,91,0.28), transparent 60%)" }}
        aria-hidden="true"
      />
      <motion.div
        className="relative z-[2] w-full max-w-[1440px] mx-auto px-[var(--gutter)]"
        variants={container(0.1, 0.05)}
        {...mount}
      >
        <motion.span variants={fade} className="block text-[12px] font-semibold tracking-[0.16em] uppercase text-green-bright mb-[22px]">
          {eyebrow}
        </motion.span>
        <h1 className="m-0 font-bold text-cream max-w-[20ch] text-[clamp(40px,6vw,80px)] leading-[0.97] tracking-[-0.045em]">
          {Array.isArray(title) ? (
            title.map((t, i) => (
              <span key={i} className="line-mask">
                <motion.span className="block" variants={line}>{t}</motion.span>
              </span>
            ))
          ) : (
            <span className="line-mask">
              <motion.span className="block" variants={line}>{title}</motion.span>
            </span>
          )}
        </h1>
        {lead && (
          <motion.p variants={fade} className="text-[clamp(16px,1.35vw,19px)] leading-[1.55] text-text-on-dark-2 max-w-[620px] mt-9">
            {lead}
          </motion.p>
        )}
        {children && (
          <motion.div variants={fade} className="mt-9">
            {children}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
