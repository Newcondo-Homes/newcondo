import { cx } from "@/lib/cx";
import { Icon } from "./icon";

type Variant = "dark" | "light";

const VARIANTS: Record<Variant, string> = {
  dark: "bg-ink text-cream hover:bg-black",
  light: "bg-cream text-ink hover:shadow-[0_14px_40px_rgba(0,0,0,0.28)]",
};

export interface CircleBtnProps {
  as?: "a" | "button";
  href?: string;
  variant?: Variant;
  size?: number;
  className?: string;
  icon?: string;
  iconSize?: number;
  onClick?: () => void;
  "aria-label"?: string;
}

export function CircleBtn({
  as = "a",
  variant = "dark",
  size = 56,
  className = "",
  icon = "arrow-right",
  iconSize = 22,
  ...rest
}: CircleBtnProps) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      className={cx(
        "circle-btn inline-flex items-center justify-center rounded-full flex-none cursor-pointer no-underline " +
          "border border-transparent transition-[transform,background,box-shadow] duration-200 ease-nc active:scale-[0.97]",
        VARIANTS[variant],
        className
      )}
      style={{ width: size, height: size }}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </Tag>
  );
}
