"use client";

import { Check } from "lucide-react";
import { cx } from "@/lib/cx";

export interface StepItem {
  key: string;
  label: string;
}

export default function MarkingStepper({ steps, active }: { steps: StepItem[]; active: number }) {
  return (
    <ol className="flex list-none items-center gap-1.5 p-0 sm:gap-2">
      {steps.map((s, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <li key={s.key} className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={cx(
                "grid h-6 w-6 flex-none place-items-center rounded-full border text-[11px] font-semibold transition-colors duration-300 ease-nc",
                done
                  ? "border-ink bg-ink text-cream"
                  : current
                    ? "border-ink bg-surface text-ink"
                    : "border-border bg-surface text-text-tertiary"
              )}
            >
              {done ? <Check size={13} strokeWidth={2.6} /> : i + 1}
            </span>
            <span
              className={cx(
                "text-[12.5px] font-semibold transition-colors duration-300 ease-nc max-[680px]:hidden",
                done || current ? "text-text-primary" : "text-text-tertiary"
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-0.5 h-px w-6 bg-border sm:w-8 max-[680px]:w-3" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
