import { cx } from "@/lib/cx";

export function Badge({
  tone = "green",
  className = "",
  children,
}: {
  tone?: "green" | "bright"  | "ink";
  className?: string;
  children: React.ReactNode;
}) {
 const tones = {
  green: "text-green-dark bg-green-wash",
  bright: "text-ink bg-green-bright",
  ink: "text-cream bg-ink",
};
  return (
    <span
      className={cx(
        "inline-flex items-center text-[11px] font-bold tracking-[0.08em] uppercase px-[11px] py-[5px] rounded-full",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
