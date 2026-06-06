import { cx } from "@/lib/cx";
import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { Button } from "@/components/ui/nc-button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { PLAN_ESSENTIAL, PLAN_ELITE } from "@/lib/data";

function PlanList({ items, elite = false }: { items: string[]; elite?: boolean }) {
  return (
    <ul className="list-none p-0 m-0 mt-[26px] flex flex-col gap-[13px]">
      {items.map((it) => (
        <li
          key={it}
          className={cx(
            "flex items-start gap-[11px] text-[15px] leading-[1.4]",
            elite ? "text-text-on-dark" : "text-text-secondary"
          )}
        >
          <Icon name="check" size={18} className={cx("flex-none mt-px", elite ? "text-green-bright" : "text-green-dark")} />
          {it}
        </li>
      ))}
    </ul>
  );
}

export function Pricing() {
  return (
    <Section id="pricing" label="Pricing" cream>
      <SectionHead
        center
        eyebrow="Simple, honest pricing"
        title="Pick the plan that makes owning property feel like owning property — not a second job."
        lead="Both plans include escrow rent collection, tenant verification, legal agreements, fumigation, waste management, photography, blacklist access, and the full Newcondo platform. Elite adds the features that make it pay for itself."
      />

      <div className="grid grid-cols-2 gap-6 max-w-[1040px] mx-auto max-[860px]:grid-cols-1">
        {/* Essential */}
        <article data-reveal className="js-plan bg-surface border border-[rgba(0,0,0,0.06)] rounded-card px-[38px] pt-10 pb-11 relative flex flex-col">
          <div>
            <h3 className="text-[28px] font-bold tracking-[-0.03em] m-0 mb-1.5 text-text-primary">Essential</h3>
            <p className="text-[14.5px] text-text-secondary m-0">Landlords with 1–2 properties</p>
          </div>
          <div className="flex items-baseline gap-1.5 mt-[26px] mb-6">
            <span className="text-[46px] font-bold tracking-[-0.04em] text-text-primary">₦7,500</span>
            <span className="text-[16px] text-text-tertiary">/month</span>
          </div>
          <Button as="a" href="#" variant="dark" size="block" icon="arrow-right">
            Start with Essential
          </Button>
          <PlanList items={PLAN_ESSENTIAL} />
        </article>

        {/* Elite */}
        <article data-reveal className="js-plan bg-ink text-cream border border-transparent rounded-card px-[38px] pt-10 pb-11 relative flex flex-col">
          <span className="absolute top-[30px] right-[34px]">
            <Badge tone="bright">Most popular</Badge>
          </span>
          <div>
            <h3 className="text-[28px] font-bold tracking-[-0.03em] m-0 mb-1.5 text-cream">Elite</h3>
            <p className="text-[14.5px] text-text-on-dark-2 m-0">3+ properties, diaspora owners, serious investors</p>
          </div>
          <div className="flex items-baseline gap-1.5 mt-[26px] mb-6">
            <span className="text-[46px] font-bold tracking-[-0.04em] text-cream">₦18,500</span>
            <span className="text-[16px] text-text-on-dark-2">/month</span>
          </div>
          <Button as="a" href="#" variant="light" size="block" icon="arrow-right">
            Start with Elite
          </Button>
          <p className="text-[14px] font-semibold text-text-on-dark-2 mt-7 mb-1.5">Everything in Essential, plus:</p>
          <PlanList items={PLAN_ELITE} elite />
        </article>
      </div>

      <div
        data-reveal
        className="flex gap-[22px] items-start max-w-[1040px] mx-auto mt-[30px] bg-surface border border-[rgba(0,0,0,0.06)] rounded-card px-[34px] py-8 max-[860px]:flex-col"
      >
        <div className="w-[52px] h-[52px] rounded-[14px] bg-green-wash text-green-dark flex items-center justify-center flex-none">
          <Icon name="calculator" size={26} />
        </div>
        <div>
          <h4 className="nc-h4 m-0 mb-2.5">Why Elite pays for itself</h4>
          <p className="text-[15.5px] leading-[1.6] text-text-secondary m-0 max-w-[70ch]">
            On Elite, commission drops from 20% to 15%. Collect ₦200,000/month in rent and that 5% saves you{" "}
            <strong className="text-text-primary">₦10,000 every month</strong>. Your subscription is ₦18,500 — so you&apos;re
            essentially paying ₦8,500/month for an account manager, rent default insurance, emergency maintenance, unlimited
            listings, and every other Elite benefit. Most Elite subscribers are cash-positive from their commission saving alone.
          </p>
          <p className="inline-flex items-center gap-[9px] mt-3.5 font-semibold text-green-dark">
            <Icon name="gift" size={18} /> Pay annually and get 2 months free on either plan.
          </p>
        </div>
      </div>
    </Section>
  );
}
