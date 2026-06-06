import { cx } from "@/lib/cx";

export function Eyebrow({
  className = "",
  children,
  onDark = false,
}: {
  className?: string;
  children: React.ReactNode;
  onDark?: boolean;
}) {
  return (
    <span
      data-reveal
      className={cx(
        "block text-[12px] font-semibold tracking-[0.14em] uppercase",
        onDark ? "text-green-bright" : "text-text-tertiary",
        className
      )}
    >
      {children}
    </span>
  );
}
