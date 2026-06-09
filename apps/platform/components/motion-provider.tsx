"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wraps the app in Framer Motion's MotionConfig.
 * `reducedMotion="user"` makes every transform/opacity animation jump straight
 * to its resting state when the visitor prefers reduced motion — so content is
 * always visible, never stuck at an `initial` hidden state.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
