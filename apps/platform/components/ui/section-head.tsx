import { cx } from "@/lib/cx";
import { Eyebrow } from "./eyebrow";

export function SectionHead({
  eyebrow,
  title,
  lead,
  center = false,
  className = "",
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: string;
  center?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cx(center ? "max-w-[920px] mx-auto text-center" : "max-w-[920px]", "mb-14", className)}>
      {eyebrow && <Eyebrow className="mb-[18px]">{eyebrow}</Eyebrow>}
      <h2 className="nc-h2" data-reveal>
        {title}
      </h2>
      {lead && (
        <p className={cx("nc-lead mt-5", center && "mx-auto")} data-reveal>
          {lead}
        </p>
      )}
      {children}
    </div>
  );
}
