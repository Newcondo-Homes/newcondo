"use client";

import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./icon";
import { Reveal, vFade } from "@/components/motion";

export function TextLink({
  href = "#",
  children,
  className = "",
}: {
  href?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Reveal
      as="a"
      href={href}
      variants={vFade}
      className={cx(
        "group inline-flex items-center gap-[9px] no-underline font-semibold text-[16px] text-ink",
        className
      )}
    >
      {children}
      <Icon
        name="arrow-right"
        size={18}
        className="transition-transform duration-200 ease-nc group-hover:translate-x-[5px]"
      />
    </Reveal>
  );
}
