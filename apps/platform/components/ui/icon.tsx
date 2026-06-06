import { icons, type LucideProps } from "lucide-react";

function toPascal(name: string): string {
  return name
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

/**
 * Render any Lucide icon by its kebab-case name (e.g. "arrow-right").
 * Handy when the icon is data-driven. For static icons you can of course
 * import the named component directly: `import { ArrowRight } from "lucide-react"`.
 */
export function Icon({ name, strokeWidth = 1.85, ...props }: { name: string } & LucideProps) {
  const Cmp = icons[toPascal(name) as keyof typeof icons];
  if (!Cmp) return null;
  return <Cmp strokeWidth={strokeWidth} {...props} />;
}
