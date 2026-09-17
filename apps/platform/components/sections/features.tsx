import { cx } from "@/lib/cx";
import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Group, Item, vFade } from "@/components/motion";
import { FEATURES, TIER_LABEL } from "@/lib/data";

export function Features() {
  return (
    <Section id="features" label="Features" cream>
      <SectionHead
        eyebrow="What's included"
        title="We didn't just build a listing site. We built a property management operation."
        lead="Every feature below is included in your subscription — not sold separately."
      />
      <Group stagger={0.07} className="grid grid-cols-3 gap-5 max-[1080px]:grid-cols-2 max-[620px]:grid-cols-1">
        {/* `tier` is "all" | "plus" | "premium" — NOT a boolean. Test it
            against TIER_LABEL, never for truthiness: "all" is truthy and
            would badge every card. */}
        {FEATURES.map(([ic, t, x, tier]) => {
          const tierLabel = TIER_LABEL[tier];
          return (
          <Item
            as="article"
            key={t}
            variants={vFade}
            className="relative bg-surface border border-[rgba(0,0,0,0.06)] rounded-card px-[30px] pt-8 pb-[34px] flex flex-col transition-[transform,box-shadow] duration-[450ms] ease-nc hover:-translate-y-1.5 hover:shadow-lift"
          >
            {tierLabel && (
              <span className="absolute top-[30px] right-7">
                <Badge>{tierLabel}</Badge>
              </span>
            )}
            <div
              className={cx(
                "w-[50px] h-[50px] rounded-[14px] flex items-center justify-center mb-[22px]",
                tierLabel ? "bg-ink text-cream" : "bg-surface-soft text-ink"
              )}
            >
              <Icon name={ic} size={24} />
            </div>
            <h3 className="text-[19px] font-bold tracking-[-0.02em] leading-[1.15] m-0 mb-[11px] text-text-primary max-w-[20ch]">
              {t}
            </h3>
            <p className="text-[14.5px] leading-[1.55] text-text-secondary m-0">{x}</p>
          </Item>
          );
        })}
      </Group>
    </Section>
  );
}
