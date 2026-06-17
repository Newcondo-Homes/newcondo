import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Reveal, vLead, lateViewport } from "@/components/motion";

export function Eyebrow({
  className = "",
  children,
  onDark = false,
}: {
  className?: string;
  children: ReactNode;
  onDark?: boolean;
}) {
  return (
    <Reveal
      as="span"
      variants={vLead}
      viewport={lateViewport}
      className={cx(
        "block text-[12px] font-semibold tracking-[0.14em] uppercase",
        onDark ? "text-green-bright" : "text-text-tertiary",
        className
      )}
    >
      {children}
    </Reveal>
  );
}
