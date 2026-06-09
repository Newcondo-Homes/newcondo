import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Eyebrow } from "./eyebrow";
import { Reveal } from "@/components/motion";

export function SectionHead({
  eyebrow,
  title,
  lead,
  center = false,
  className = "",
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
  center?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cx(center ? "max-w-[920px] mx-auto text-center" : "max-w-[920px]", "mb-14", className)}>
      {eyebrow && <Eyebrow className="mb-[18px]">{eyebrow}</Eyebrow>}
      <Reveal as="h2" className="nc-h2">
        {title}
      </Reveal>
      {lead && (
        <Reveal as="p" className={cx("nc-lead mt-5", center && "mx-auto")}>
          {lead}
        </Reveal>
      )}
      {children}
    </div>
  );
}
