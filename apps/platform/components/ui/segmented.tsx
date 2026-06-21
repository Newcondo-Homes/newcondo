"use client";

import { motion, LayoutGroup } from "framer-motion";
import { cx } from "@/lib/cx";
import { AUDIENCES, type Audience } from "@/lib/pages-data";

/** Segmented audience control with an animated (layoutId) thumb. */
export function Segmented({
  audience,
  onAudience,
}: {
  audience: Audience;
  onAudience: (a: Audience) => void;
}) {
  return (
    <div className="seg" role="tablist" aria-label="Choose user type">
      <LayoutGroup>
        {AUDIENCES.map(([id, label]) => {
          const active = id === audience;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              className={cx("seg-btn", active && "active")}
              onClick={() => onAudience(id)}
            >
              {active && (
                <motion.span
                  layoutId="segThumb"
                  className="seg-thumb"
                  style={{ inset: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              <span className="relative z-[1]">{label}</span>
            </button>
          );
        })}
      </LayoutGroup>
    </div>
  );
}
