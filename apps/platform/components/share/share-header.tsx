"use client";

/* ============================================================
   Minimal public glass header for the shared-property page.
   A visitor (often not logged in) lands here from a share link —
   so the only CTA is "Sign in to book". Mirrors the landing
   navbar's glass treatment but stripped down.
   ============================================================ */
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/nc-button";
import { EASE } from "@/components/motion";

const LOGO_DARK = "/assets/logo-mark-dark.png";

export function ShareHeader() {
  return (
    <motion.header
      data-screen-label="Share header"
      className="sticky top-0 z-50 bg-[rgba(255,255,255,0.8)] backdrop-blur-[18px] border-b border-[rgba(15,23,42,0.07)]"
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: EASE, delay: 0.05 }}
    >
      <div className="max-w-[1440px] mx-auto px-[var(--gutter)] py-[15px] flex items-center justify-between gap-6">
        <a href="/" className="flex items-center gap-[11px] no-underline font-bold text-[21px] tracking-[-0.04em] text-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_DARK} alt="NewCondo" className="w-[30px] h-auto" />
          <span>newcondo</span>
        </a>
        <div className="flex items-center gap-[18px]">
          <span className="hidden sm:inline-flex items-center gap-[7px] text-[14.5px] font-medium text-text-secondary">
            <Icon name="shield-check" size={18} /> Verified listing
          </span>
          <Button as="a" href="/login" variant="dark" size="sm" icon="arrow-right">
            Rent now
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
