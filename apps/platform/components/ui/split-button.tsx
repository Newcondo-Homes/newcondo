"use client";

import { motion, type Variants } from "framer-motion";
import { cx } from "@/lib/cx";
import { Icon } from "./icon";
import Link from "next/link";

/**
 * Pill label + circular arrow that pull apart on hover.
 * Self-contained Framer Motion: variant propagation drives the pull-apart
 * (pill slides left, circle slides right, arrow rotates -45°) — no global hook.
 */
const BTN_BASE =
  "inline-flex items-center gap-2.5 font-semibold leading-none whitespace-nowrap rounded-full " +
  "border border-transparent no-underline text-[16px] px-7 py-[17px]";
const BTN_VARIANT = {
  light: "bg-cream text-ink hover:bg-white",
  dark: "bg-ink text-cream hover:bg-black",
} as const;

const pill: Variants = { rest: { x: 0, scale: 1 }, hover: { x: -5, scale: 1.02, transition: { duration: 0.35, ease: "easeOut" } } };
const circle: Variants = { rest: { x: 0, scale: 1 }, hover: { x: 5, scale: 1.02, transition: { duration: 0.35, ease: "easeOut" } } };
const arrow: Variants = { rest: { rotate: 0 }, hover: { rotate: -45, transition: { duration: 0.35, ease: "easeOut" } } };

const MotionLink = motion.create(Link);

export function SplitButton({
  href = "#",
  label,
  variant = "light",
  className = "",
  ariaLabel,
  onClick,
}: {
  href?: string;
  label: string;
  variant?: "light" | "dark";
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
}) {
  const circleCls = variant === "light" ? "bg-cream text-ink" : "bg-ink text-cream";
  return (
    <motion.div
      className={cx("cta-group inline-flex items-center gap-2.5", className)}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
    >
      <MotionLink
        href={href}
        variants={pill}
        className={cx(BTN_BASE, BTN_VARIANT[variant], "pill-btn")}
        onClick={onClick}
      >
        {label}
      </MotionLink>
      <MotionLink
        href={href}
        aria-label={ariaLabel ?? "Continue"}
        variants={circle}
        className={cx("circle-btn inline-flex items-center justify-center rounded-full flex-none no-underline", circleCls)}
        style={{ width: 56, height: 56 }}
        onClick={onClick}
      >
        <motion.span variants={arrow} style={{ display: "inline-flex" }}>
          <Icon name="arrow-right" size={22} />
        </motion.span>
      </MotionLink>
    </motion.div>
  );
}
