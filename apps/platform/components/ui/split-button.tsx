import { cx } from "@/lib/cx";
import { Button } from "./nc-button";
import { CircleBtn } from "./circle-button";

/**
 * Pill label + circular arrow that pull apart on hover.
 * The pull-apart tween is wired globally in <SiteAnimations /> via the
 * `[data-splitbtn]` hook, so this stays a plain (server) component.
 */
export function SplitButton({
  href = "#",
  label,
  variant = "light",
  className = "",
  ariaLabel,
}: {
  href?: string;
  label: string;
  variant?: "light" | "dark" ;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div data-splitbtn className={cx("cta-group inline-flex items-center gap-2.5", className)}>
      <Button as="a" href={href} variant={variant} className="pill-btn">
        {label}
      </Button>
      <CircleBtn as="a" href={href} variant={variant} aria-label={ariaLabel ?? "Continue"} />
    </div>
  );
}
