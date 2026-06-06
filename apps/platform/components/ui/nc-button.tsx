import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./icon";

type Variant = "dark" | "light" | "secondary" | "green";
type Size = "md" | "sm" | "block";

const BASE =
  "inline-flex items-center gap-2.5 font-semibold leading-none whitespace-nowrap rounded-full " +
  "border border-transparent cursor-pointer transition-[transform,background,box-shadow,color] " +
  "duration-200 ease-nc active:scale-[0.97] no-underline";

const VARIANTS: Record<Variant, string> = {
  dark: "bg-ink text-cream hover:bg-black hover:shadow-card",
  light: "bg-cream text-ink hover:bg-white hover:shadow-[0_14px_40px_rgba(0,0,0,0.28)]",
  secondary: "bg-transparent text-ink border-[rgba(0,0,0,0.14)] hover:bg-black/[0.04]",
  green: "bg-green text-white hover:bg-green-dark",
};

const SIZES: Record<Size, string> = {
  md: "text-[16px] px-7 py-[17px]",
  sm: "text-[15px] px-[22px] py-[13px]",
  block: "text-[16px] px-7 py-[17px] w-full justify-center",
};

export interface ButtonProps {
  as?: "a" | "button";
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  icon?: string;
  children: ReactNode;
  onClick?: () => void;
  "aria-label"?: string;
}

export function Button({
  as = "a",
  variant = "dark",
  size = "md",
  className = "",
  icon,
  children,
  ...rest
}: ButtonProps) {
  // Polymorphic <a>/<button>; cast keeps the union simple.
  const Tag = as as React.ElementType;
  return (
    <Tag className={cx(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {children}
      {icon && <Icon name={icon} size={18} />}
    </Tag>
  );
}
