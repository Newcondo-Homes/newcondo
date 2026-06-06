import { cx } from "@/lib/cx";

/**
 * Placeholder for real Nigerian property / portrait photography the team
 * will supply. Swap this for next/image once you have the asset, e.g.:
 *
 *   <Image src={src} alt={alt} fill className="object-cover" />
 *
 * It fills its (relatively positioned) parent.
 */
export function ImageSlot({
  placeholder,
  className = "",
}: {
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cx(
        "w-full h-full flex items-center justify-center text-center select-none text-text-on-dark-2 text-[13px]",
        className
      )}
      style={{
        background:
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 14px, transparent 14px 28px)",
      }}
    >
      {placeholder && <span className="px-5 opacity-70">{placeholder}</span>}
    </div>
  );
}
