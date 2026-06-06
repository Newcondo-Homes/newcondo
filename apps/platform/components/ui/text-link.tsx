import { cx } from "@/lib/cx";
import { Icon } from "./icon";

export function TextLink({
  href = "#",
  children,
  className = "",
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      data-reveal
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
    </a>
  );
}
