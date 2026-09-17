import { cx } from "@/lib/cx";
import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { Button } from "@/components/ui/nc-button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Group, Item, Reveal, vFade } from "@/components/motion";
import Link from "next/link";
import { PLAN_ESSENTIAL, PLAN_ELITE } from "@/lib/data";
import { SUBSCRIPTION_PLANS, formatNaira } from "@/lib/constants/business";

/* Prices, taglines and commission rates come from the shared single source of
   truth (backend/shared/src/constants/subscriptionPlans.ts) — the same file
   the backend charges from. The feature bullets stay in @/lib/data because
   this page's marketing copy is longer than the in-product feature list. */
const essential = SUBSCRIPTION_PLANS.OWNER_ESSENTIAL;
const elite = SUBSCRIPTION_PLANS.OWNER_ELITE;

/* "Why Elite pays for itself" — derived, so the arithmetic can never contradict
   the prices above it. At 20% → 15% on ₦200,000 of rent: saves ₦10,000/month
   against an ₦18,500 subscription, i.e. a net ₦8,500. */
const SAMPLE_RENT = 200_000;
const pct = (rate: number) => `${Math.round(rate * 100)}%`;
const monthlySaving = SAMPLE_RENT * (essential.commissionRate - elite.commissionRate);
const netCost = elite.amountNaira - monthlySaving;

function PlanList({ items, elite: isElite = false }: { items: string[]; elite?: boolean }) {
  return (
    <ul className="list-none p-0 m-0 mt-[26px] flex flex-col gap-[13px]">
      {items.map((it) => (
        <li
          key={it}
          className={cx(
            "flex items-start gap-[11px] text-[15px] leading-[1.4]",
            isElite ? "text-text-on-dark" : "text-text-secondary"
          )}
        >
          <Icon name="check" size={18} className={cx("flex-none mt-px", isElite ? "text-green-bright" : "text-green-dark")} />
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

      <Group stagger={0.12} className="grid grid-cols-2 gap-6 max-w-[1040px] mx-auto max-[860px]:grid-cols-1">
        {/* Essential */}
        <Item as="article" variants={vFade} className="js-plan bg-surface border border-[rgba(0,0,0,0.06)] rounded-card px-[38px] pt-10 pb-11 relative flex flex-col">
          <div>
            <h3 className="text-[28px] font-bold tracking-[-0.03em] m-0 mb-1.5 text-text-primary">{essential.name}</h3>
            <p className="text-[14.5px] text-text-secondary m-0">{essential.tagline}</p>
          </div>
          <div className="flex items-baseline gap-1.5 mt-[26px] mb-6">
            <span className="text-[46px] font-bold tracking-[-0.04em] text-text-primary">{formatNaira(essential.amountNaira)}</span>
            <span className="text-[16px] text-text-tertiary">/month</span>
          </div>
          <Link href="/onboarding">
            <Button as="button" variant="dark" size="block" icon="arrow-right">
              Start with {essential.name}
            </Button>
          </Link>
          <PlanList items={PLAN_ESSENTIAL} />
        </Item>

        {/* Elite */}
        <Item as="article" variants={vFade} className="js-plan bg-ink text-cream border border-transparent rounded-card px-[38px] pt-10 pb-11 relative flex flex-col">
          {elite.badge && (
            <span className="absolute top-[30px] right-[34px]">
              <Badge tone="bright">{elite.badge}</Badge>
            </span>
          )}
          <div>
            <h3 className="text-[28px] font-bold tracking-[-0.03em] m-0 mb-1.5 text-cream">{elite.name}</h3>
            <p className="text-[14.5px] text-text-on-dark-2 m-0">{elite.tagline}</p>
          </div>
          <div className="flex items-baseline gap-1.5 mt-[26px] mb-6">
            <span className="text-[46px] font-bold tracking-[-0.04em] text-cream">{formatNaira(elite.amountNaira)}</span>
            <span className="text-[16px] text-text-on-dark-2">/month</span>
          </div>
          <Link href="/onboarding">
            <Button as="button" variant="light" size="block" icon="arrow-right">
              Start with {elite.name}
            </Button>
          </Link>
          <p className="text-[14px] font-semibold text-text-on-dark-2 mt-7 mb-1.5">Everything in {essential.name}, plus:</p>
          <PlanList items={PLAN_ELITE} elite />
        </Item>
      </Group>

      <Reveal
        className="flex gap-[22px] items-start max-w-[1040px] mx-auto mt-[30px] bg-surface border border-[rgba(0,0,0,0.06)] rounded-card px-[34px] py-8 max-[860px]:flex-col"
      >
        <div className="w-[52px] h-[52px] rounded-[14px] bg-green-wash text-green-dark flex items-center justify-center flex-none">
          <Icon name="calculator" size={26} />
        </div>
        <div>
          <h4 className="nc-h4 m-0 mb-2.5">Why {elite.name} pays for itself</h4>
          <p className="text-[15.5px] leading-[1.6] text-text-secondary m-0 max-w-[70ch]">
            On {elite.name}, commission drops from {pct(essential.commissionRate)} to {pct(elite.commissionRate)}. Collect{" "}
            {formatNaira(SAMPLE_RENT)}/month in rent and that{" "}
            {pct(essential.commissionRate - elite.commissionRate)} saves you{" "}
            <strong className="text-text-primary">{formatNaira(monthlySaving)} every month</strong>. Your subscription is{" "}
            {formatNaira(elite.amountNaira)} — so you&apos;re essentially paying {formatNaira(netCost)}/month for an account
            manager, rent default insurance, emergency maintenance, unlimited listings, and every other {elite.name} benefit.
            Most {elite.name} subscribers are cash-positive from their commission saving alone.
          </p>
          <p className="inline-flex items-center gap-[9px] mt-3.5 font-semibold text-green-dark">
            <Icon name="gift" size={18} /> Pay annually and get 2 months free on either plan.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
