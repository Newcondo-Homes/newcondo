import { icons, type LucideProps } from "lucide-react";

// Lucide renamed several icons (e.g. home→house); older kebab names used
// across the dashboard resolve through these aliases instead of silently
// rendering nothing.
const ALIASES: Record<string, string> = {
  home: "house",
  "refresh-cw": "refresh-cw",
  "edit-3": "pen-line",
  edit: "square-pen",
  "alert-triangle": "triangle-alert",
  "check-circle-2": "circle-check-big",
  "x-circle": "circle-x",
  "help-circle": "circle-help",
  "loader-2": "loader-circle",
  "more-horizontal": "ellipsis",
};

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
  const Cmp =
    icons[toPascal(name) as keyof typeof icons] ??
    icons[toPascal(ALIASES[name] ?? "") as keyof typeof icons] ??
    icons.Circle; // visible fallback — never render an empty gap
  return <Cmp strokeWidth={strokeWidth} {...props} />;
}
