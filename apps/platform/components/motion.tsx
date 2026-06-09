"use client";

/* ============================================================
   Shared Framer Motion primitives & variants.
   One source of truth for the site's entrance choreography —
   imported by every section so timing/easing stay consistent.
   ============================================================ */
import { motion, type Variants, type Transition } from "framer-motion";
import type { ElementType, ReactNode, CSSProperties } from "react";

/* NewCondo easing — cubic-bezier(0.22, 1, 0.36, 1) and an expo-out. */
export const EASE = [0.22, 1, 0.36, 1] as const;
export const EXPO = [0.16, 1, 0.3, 1] as const;

/* ---- reveal variants ---- */
export const vFade: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};
export const vCard: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.85, ease: EXPO } },
};
export const vRow: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};
export const container = (stagger = 0.1, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/* scroll-reveal props — fire once when ~18% in view */
export const reveal = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, amount: 0.18 },
} as const;

/* on-load props */
export const mount = { initial: "hidden", animate: "show" } as const;

type RevealProps = {
  as?: ElementType;
  variants?: Variants;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  href?: string;
  [key: string]: unknown;
};

/** Scroll-revealed element. Renders `as` (default div) as a motion component. */
export function Reveal({ as = "div", variants = vFade, className, style, children, ...rest }: RevealProps) {
  const M = motion[as as keyof typeof motion] as ElementType;
  return (
    <M className={className} style={style} variants={variants} {...reveal} {...rest}>
      {children}
    </M>
  );
}

/** Stagger container — children with `variants` animate in sequence on scroll. */
export function Group({
  as = "div",
  className,
  style,
  stagger = 0.1,
  delay = 0,
  children,
  ...rest
}: RevealProps & { stagger?: number; delay?: number }) {
  const M = motion[as as keyof typeof motion] as ElementType;
  return (
    <M className={className} style={style} variants={container(stagger, delay)} {...reveal} {...rest}>
      {children}
    </M>
  );
}

/** A child item inside a <Group> — no own `initial/whileInView`; the parent drives it. */
export function Item({ as = "div", variants = vCard, className, style, children, ...rest }: RevealProps) {
  const M = motion[as as keyof typeof motion] as ElementType;
  return (
    <M className={className} style={style} variants={variants} {...rest}>
      {children}
    </M>
  );
}
