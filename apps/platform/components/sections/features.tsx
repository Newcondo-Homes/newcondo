import { cx } from "@/lib/cx";
import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { FEATURES } from "@/lib/data";

export function Features() {
  return (
    <Section id="features" label="Features" cream>
      <SectionHead
        eyebrow="What's included"
        title="We didn't just build a listing site. We built a property management operation."
        lead="Every feature below is included in your subscription — not sold separately."
      />
      <div className="grid grid-cols-3 gap-5 max-[1080px]:grid-cols-2 max-[620px]:grid-cols-1">
        {FEATURES.map(([ic, t, x, elite]) => (
          <article
            key={t}
            data-feat
            className="relative bg-surface border border-[rgba(0,0,0,0.06)] rounded-card px-[30px] pt-8 pb-[34px] flex flex-col transition-[transform,box-shadow] duration-[280ms] ease-nc hover:-translate-y-1.5 hover:shadow-lift"
          >
            {elite && (
              <span className="absolute top-[30px] right-7">
                <Badge>Elite</Badge>
              </span>
            )}
            <div
              className={cx(
                "w-[50px] h-[50px] rounded-[14px] flex items-center justify-center mb-[22px]",
                elite ? "bg-ink text-cream" : "bg-surface-soft text-ink"
              )}
            >
              <Icon name={ic} size={24} />
            </div>
            <h3 className="text-[19px] font-bold tracking-[-0.02em] leading-[1.15] m-0 mb-[11px] text-text-primary max-w-[20ch]">
              {t}
            </h3>
            <p className="text-[14.5px] leading-[1.55] text-text-secondary m-0">{x}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
