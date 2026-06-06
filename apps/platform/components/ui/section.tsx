import { cx } from "@/lib/cx";

/**
 * Page section wrapper. `cream` renders a full-bleed warm background with a
 * centered max-width inner column (alternating cream/white sections is a
 * NewCondo signature). Otherwise the section itself is the max-width column.
 */
export function Section({
  id,
  label,
  cream = false,
  className = "",
  innerClassName = "",
  children,
}: {
  id?: string;
  label?: string;
  cream?: boolean;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
}) {
  const pad = "py-[clamp(64px,9vw,128px)] px-[var(--gutter)]";
  if (cream) {
    return (
      <section id={id} data-screen-label={label} className={cx("bg-surface-soft", className)}>
        <div className={cx("max-w-[1440px] mx-auto", pad, innerClassName)}>{children}</div>
      </section>
    );
  }
  return (
    <section id={id} data-screen-label={label} className={cx("max-w-[1440px] mx-auto", pad, className)}>
      {children}
    </section>
  );
}
