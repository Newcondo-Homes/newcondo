import { cx } from "@/lib/cx";
import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { Button } from "@/components/ui/nc-button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Group, Item, Reveal, vFade } from "@/components/motion";
import Link from "next/link";
import { PLANS as PLAN_COPY } from "@/lib/data";
import {
  SUBSCRIPTION_PLANS,
  OWNER_TIER_ORDER,
  MAX_PLOTS_SELF_SERVE,
  formatNaira,
  formatRate,
  type SubscriptionPlanSpec,
} from "@/lib/constants/business";

/* Three owner tiers: Essential / Plus / Premium. Prices, taglines, badges,
   service level and commission rates come from the shared single source of
   truth (backend/shared/src/constants/subscriptionPlans.ts) — the same file
   billing computes from, so a card can never quote a price the checkout
   won't charge. The longer marketing bullet lists come from @/lib/data's
   PLANS array, matched by plan code.

   The tier belongs to a PROPERTY, not an account: an owner can run one
   property on Premium and another on Essential, and the bill is the sum. */
const featuresFor = (plan: SubscriptionPlanSpec): string[] =>
  PLAN_COPY.find((p) => p.code === plan.code)?.features ?? plan.features;

const essential = SUBSCRIPTION_PLANS.OWNER_ESSENTIAL;
const premium = SUBSCRIPTION_PLANS.OWNER_PREMIUM;

/* "Why Premium pays for itself" — derived, so the arithmetic can never
   contradict the prices above it. At 20% → 15% on ₦200,000 of rent: saves
   ₦10,000/month against an ₦18,250 subscription. */
const SAMPLE_RENT = 200_000;
const monthlySaving = SAMPLE_RENT * (essential.commissionRate - premium.commissionRate);
const netCost = premium.amountNaira - monthlySaving;

function PlanList({ items, dark = false }: { items: string[]; dark?: boolean }) {
  return (
    <ul className="list-none p-0 m-0 mt-[26px] flex flex-col gap-[13px]">
      {items.map((it) => (
        <li key={it} className={cx("flex items-start gap-[11px] text-[14.5px] leading-[1.4]", dark ? "text-text-on-dark" : "text-text-secondary")}>
          <Icon name="check" size={18} className={cx("flex-none mt-px", dark ? "text-green-bright" : "text-green-dark")} />
          {it}
        </li>
      ))}
    </ul>
  );
}

function PlanCard({ plan }: { plan: SubscriptionPlanSpec }) {
  const dark = !!plan.highlight;
  const all = featuresFor(plan);
  // A copy list may open with "Everything in Essential, plus:" — that is a
  // heading, not a checklist item, so it is split off and rendered as one.
  const hasLeadIn = all[0]?.startsWith("Everything in");
  const leadIn = hasLeadIn ? all[0] : null;
  const items = hasLeadIn ? all.slice(1) : all;
  return (
    <Item
      as="article"
      variants={vFade}
      className={cx(
        "js-plan relative rounded-card px-[30px] pt-10 pb-11 flex flex-col",
        dark ? "bg-ink text-cream border border-transparent" : "bg-surface border border-[rgba(0,0,0,0.06)]"
      )}
    >
      {plan.badge && (
        <span className="absolute top-[30px] right-[34px]">
          <Badge tone={dark ? "bright" : "green"}>{plan.badge}</Badge>
        </span>
      )}
      <div>
        <h3 className={cx("text-[28px] font-bold tracking-[-0.03em] m-0 mb-1.5", dark ? "text-cream" : "text-text-primary")}>{plan.name}</h3>
        <p className={cx("text-[14.5px] leading-[1.45] m-0 min-h-[42px]", dark ? "text-text-on-dark-2" : "text-text-secondary")}>{plan.tagline}</p>
      </div>
      <div className="flex items-baseline gap-1.5 mt-[22px] flex-wrap">
        <span className={cx("text-[40px] font-bold tracking-[-0.04em]", dark ? "text-cream" : "text-text-primary")}>{formatNaira(plan.amountNaira)}</span>
        <span className={cx("text-[15px]", dark ? "text-text-on-dark-2" : "text-text-tertiary")}>{plan.unitLabel}</span>
      </div>
      <p className={cx("text-[13px] m-0 mt-1.5 mb-6", dark ? "text-text-on-dark-2" : "text-text-tertiary")}>
        {formatRate(plan.commissionRate)} commission on rent
      </p>
      <Link href="/onboarding">
        <Button as="button" variant={dark ? "light" : "dark"} size="block" icon="arrow-right">
          Start with {plan.name}
        </Button>
      </Link>
      {/* The tiers stack, so Plus and Premium lead with what the previous tier
          already gave you — the pattern the two-tier Elite card used. Kept as
          a label line rather than a bullet: it isn't a feature. */}
      {leadIn && (
        <p className={cx("text-[14px] font-semibold mt-7 mb-1.5", dark ? "text-text-on-dark-2" : "text-text-secondary")}>
          {leadIn}
        </p>
      )}
      <PlanList items={items} dark={dark} />
    </Item>
  );
}

export function Pricing() {
  const tiers = OWNER_TIER_ORDER.map((code) => SUBSCRIPTION_PLANS[code]);
  return (
    <Section id="pricing" label="Pricing" cream>
      <SectionHead
        center
        eyebrow="Simple, honest pricing"
        title="Pick the service level that makes owning property feel like owning property — not a second job."
        lead="Every tier includes escrow rent collection, tenant verification, legal agreements, monthly waste management, photography, blacklist access and the full Newcondo platform. The tiers differ in how often we show up: exterior fumigation and inspection reports. Priced per property, per month — and you pick the tier for each property separately."
      />

      <Group stagger={0.1} className="grid grid-cols-3 gap-5 max-w-[1200px] mx-auto max-[1080px]:grid-cols-1 max-[1080px]:max-w-[520px]">
        {tiers.map((plan) => <PlanCard key={plan.code} plan={plan} />)}
      </Group>

      <Reveal className="max-w-[1200px] mx-auto mt-5 flex items-center justify-center gap-2.5 text-[14px] text-text-secondary text-center flex-wrap">
        <Icon name="layers" size={17} className="text-green-dark flex-none" />
        Mix tiers freely — one property on {premium.name}, another on {essential.name}. Your bill is the sum.
      </Reveal>

      <Reveal className="flex gap-[22px] items-start max-w-[1200px] mx-auto mt-[30px] bg-surface border border-[rgba(0,0,0,0.06)] rounded-card px-[34px] py-8 max-[860px]:flex-col">
        <div className="w-[52px] h-[52px] rounded-[14px] bg-green-wash text-green-dark flex items-center justify-center flex-none">
          <Icon name="calculator" size={26} />
        </div>
        <div>
          <h4 className="nc-h4 m-0 mb-2.5">Why {premium.name} pays for itself</h4>
          <p className="text-[15.5px] leading-[1.6] text-text-secondary m-0 max-w-[70ch]">
            On {premium.name}, commission drops from {formatRate(essential.commissionRate)} to {formatRate(premium.commissionRate)}. Collect{" "}
            {formatNaira(SAMPLE_RENT)}/month in rent on a property and that difference saves you{" "}
            <strong className="text-text-primary">{formatNaira(monthlySaving)} every month</strong>. The subscription is{" "}
            {formatNaira(premium.amountNaira)} — so you&apos;re effectively paying {formatNaira(netCost)}/month for twice the
            fumigation, two inspection reports a year, an account manager, rent default insurance and 24-hour emergency
            maintenance.
          </p>
          <p className="inline-flex items-center gap-[9px] mt-3.5 font-semibold text-green-dark">
            <Icon name="gift" size={18} /> Pay annually and get 2 months free on any tier.
          </p>
        </div>
      </Reveal>

      <Reveal className="flex gap-[22px] items-start max-w-[1200px] mx-auto mt-4 bg-surface border border-[rgba(0,0,0,0.06)] rounded-card px-[34px] py-8 max-[860px]:flex-col">
        <div className="w-[52px] h-[52px] rounded-[14px] bg-surface-soft text-ink flex items-center justify-center flex-none">
          <Icon name="building-2" size={26} />
        </div>
        <div>
          <h4 className="nc-h4 m-0 mb-2.5">Property bigger than {MAX_PLOTS_SELF_SERVE} plots, or an estate?</h4>
          <p className="text-[15.5px] leading-[1.6] text-text-secondary m-0 max-w-[70ch]">
            These tiers are priced for properties up to {MAX_PLOTS_SELF_SERVE} plots of land — one to three buildings, one
            fence, one owner. Larger single properties and estates get a custom quote built on the same cost model, scaled to
            size.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 mt-3.5 font-semibold text-ink border-b border-[rgba(19,19,19,0.25)] pb-0.5 no-underline transition-colors duration-200 ease-nc hover:border-ink"
          >
            Talk to sales <Icon name="arrow-right" size={17} />
          </a>
        </div>
      </Reveal>
    </Section>
  );
}
