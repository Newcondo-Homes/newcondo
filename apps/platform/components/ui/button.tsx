import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./icon";

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

type Variant = "dark" | "light" | "secondary" | "green";
type Size = "md" | "sm" | "block";

// `group` lets the arrow slide on hover (see icon span below).
const BASE =
  "group inline-flex items-center gap-2.5 font-semibold leading-none whitespace-nowrap rounded-full " +
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

function RButton({
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
      {icon && (
        <span className="inline-flex transition-transform duration-200 ease-nc group-hover:translate-x-1">
          <Icon name={icon} size={18} />
        </span>
      )}
    </Tag>
  );
}



const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants, RButton }