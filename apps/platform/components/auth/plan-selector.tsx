"use client";

import { useMemo, useState } from "react";
import { Check, ArrowRight, ArrowLeft, ChevronDown, Loader2, Building2 } from "lucide-react";
import { cx } from "@/lib/cx";
import { UserType } from "@/types/api";
import type { Plan, BillingCycle } from "@/types/api";
import {
  plansFor,
  formatNaira,
  formatRate,
  requiresCustomQuote,
  MAX_PLOTS_SELF_SERVE,
  type SubscriptionPlanSpec,
} from "@/lib/constants/business";

/* ============================================================
   Role-aware subscription plans.

   Plans are NOT defined here. Price, features, service level and entitlements
   come from the single source of truth in backend/shared/src/constants/
   subscriptionPlans.ts, via the frontend shim (@/lib/constants/business). The
   backend's PLAN_CONFIG and the recurring-charge job read the same file, so
   the price on this card is the price that gets charged — by construction.

   OWNERS: the tier belongs to a PROPERTY, not the account. This step is
   "choose a tier for THIS property"; adding another property later is another
   choice and another line on the bill. Properties above
   MAX_PLOTS_SELF_SERVE plots can't be self-served — they route to sales.
   ============================================================ */

/** Shared plan spec → the `Plan` shape the rest of the checkout expects. */
const toUiPlan = (p: SubscriptionPlanSpec): Plan => ({
  id: p.uiId,
  name: p.name,
  tagline: p.tagline,
  price: p.amountNaira,
  strikePrice: p.strikeAmountNaira,
  priceNote: p.priceNote,
  highlight: p.highlight,
  badge: p.badge,
  features: p.features,
  // Hand the backend code through so the checkout never re-derives it.
  subscriptionPlan: p.code,
});

export default function PlanSelector({
  role,
  onChoose,
  onBack,
  initialPlanId,
  cycle = "MONTHLY",
  plots,
  onRequestQuote,
}: {
  role: UserType;
  onChoose: (plan: Plan) => void;
  onBack?: () => void;
  /** Preselect a plan id (resumed PENDING checkout, or the last one tapped). */
  initialPlanId?: string;
  /** Billing cycle to price — wire to a monthly/annual toggle when you add one. */
  cycle?: BillingCycle;
  /** Plot count of the property being listed, when the form captured it.
   *  Above MAX_PLOTS_SELF_SERVE this step becomes a quote request. */
  plots?: number | null;
  /** Called instead of onChoose when the property needs a custom quote. */
  onRequestQuote?: () => void;
}) {
  // plansFor() maps UserType → PlanRole internally (PROPERTY_MANAGER/ADMIN
  // fall back to owner plans, as the old PLANS_BY_ROLE[OWNER] default did)
  // and excludes custom-priced tiers, which aren't self-serve.
  const plans = useMemo(() => plansFor(role, cycle), [role, cycle]);
  const perProperty = plans.some((p) => p.pricingUnit === "PER_PROPERTY");

  // Preselect a resumed plan when one exists (an abandoned PENDING checkout,
  // or the last plan tapped before the tab was discarded) so a returning user
  // sees their own choice already highlighted rather than our default.
  // uiAliases are honoured, so a draft saved as "elite" lands on Premium.
  const [selected, setSelected] = useState<string>(() => {
    const resumed = initialPlanId?.toLowerCase();
    const match = resumed
      ? plans.find((p) => p.uiId.toLowerCase() === resumed || p.uiAliases?.some((a) => a.toLowerCase() === resumed))
      : undefined;
    return match?.uiId ?? plans.find((p) => p.highlight)?.uiId ?? plans[0].uiId;
  });
  const [submitting, setSubmitting] = useState(false);
  const [pulse, setPulse] = useState(false);

  const active = plans.find((p) => p.uiId === selected) ?? plans[0];

  /* Above the plot cap there is no self-serve price to show — fumigation and
     waste vendor pricing is built around a compound of up to 3 plots. Showing
     cards we can't honour would be worse than routing to sales. An unknown
     plot count is treated as within the cap: never block a checkout on data
     the form didn't collect. */
  const needsQuote = requiresCustomQuote(plots);

  const pick = (id: string) => {
    setSelected(id);
    // restart the one-shot attention pulse on the Subscribe button
    setPulse(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setPulse(true)));
  };

  const handleContinue = () => {
    setSubmitting(true);
    onChoose(toUiPlan(active));
  };

  if (needsQuote) {
    return (
      <div className="w-full">
        <div className="mx-auto max-w-[520px] rounded-card border border-border-hair bg-surface p-7 text-center shadow-card">
          <span className="mx-auto mb-4 flex size-[52px] items-center justify-center rounded-[14px] bg-surface-sunken text-ink">
            <Building2 size={26} strokeWidth={1.9} />
          </span>
          <h3 className="m-0 text-[22px] font-bold tracking-[-0.03em]">This property needs a quote</h3>
          <p className="m-0 mt-2.5 text-[14.5px] leading-[1.55] text-text-secondary">
            Essential, Plus and Premium are priced for a property of up to {MAX_PLOTS_SELF_SERVE} plots — one to three
            buildings inside one fence. At {plots} plots, we price yours on the same cost model, scaled to size. One
            conversation, one number, then it bills automatically like any other property.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => onRequestQuote?.()}
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-8 py-[15px] text-[16px] font-semibold leading-none text-cream transition-[transform,background] duration-200 ease-nc hover:bg-black active:scale-[0.97]"
            >
              Request a quote <ArrowRight size={18} strokeWidth={2} />
            </button>
            {onBack && (
              <button type="button" onClick={onBack} className="text-[14.5px] font-semibold text-text-secondary hover:text-ink">
                Back
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {perProperty && (
        <p className="mb-4 text-center text-[13px] leading-[1.5] text-text-tertiary">
          Choose the service level for <span className="font-semibold text-text-secondary">this property</span>. Each property
          you list gets its own tier — you can mix them.
        </p>
      )}

      <div
        className={cx(
          "grid gap-3.5 max-[560px]:gap-3",
          plans.length === 1
            ? "mx-auto max-w-[460px] grid-cols-1"
            : plans.length === 2
              ? "grid-cols-2 max-[680px]:grid-cols-1"
              : "grid-cols-3 max-[900px]:grid-cols-1 max-[900px]:mx-auto max-[900px]:max-w-[460px]"
        )}
      >
        {plans.map((plan) => {
          const isDark = !!plan.highlight;
          const isActive = selected === plan.uiId;
          return (
            <button
              key={plan.uiId}
              type="button"
              onClick={() => pick(plan.uiId)}
              className={cx(
                "group relative flex flex-col rounded-card border p-6 text-left transition-[transform,box-shadow,border-color] duration-200 ease-nc hover:-translate-y-1 max-[560px]:rounded-[20px] max-[560px]:p-[18px]",
                isDark ? "bg-ink text-cream" : "bg-surface text-text-primary",
                isActive
                  ? isDark
                    ? "border-transparent shadow-lift ring-2 ring-green-bright"
                    : "border-ink shadow-lift ring-1 ring-ink"
                  : isDark
                    ? "border-transparent shadow-card"
                    : "border-border-hair shadow-card hover:border-border"
              )}
            >
              {plan.badge && (
                <span
                  className={cx(
                    "absolute right-6 top-6 inline-flex items-center rounded-full px-[11px] py-[5px] text-[11px] font-bold uppercase tracking-[0.08em] max-[560px]:right-[18px] max-[560px]:top-[18px]",
                    isDark ? "bg-green-bright text-ink" : "bg-green-wash text-green-dark"
                  )}
                >
                  {plan.badge}
                </span>
              )}

              <h3 className={cx("m-0 text-[22px] font-bold tracking-[-0.03em] max-[560px]:text-[20px]", isDark ? "text-cream" : "text-text-primary")}>
                {plan.name}
              </h3>
              <p className={cx("m-0 mt-1 text-[13px] leading-[1.4] max-[560px]:text-[12.5px]", isDark ? "text-text-on-dark-2" : "text-text-secondary")}>
                {plan.tagline}
              </p>

              <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 max-[560px]:mt-3.5">
                <span className={cx("text-[30px] font-bold tracking-[-0.04em] max-[560px]:text-[27px]", isDark ? "text-cream" : "text-text-primary")}>
                  {plan.amountNaira === 0 ? "Free" : formatNaira(plan.amountNaira)}
                </span>
                {plan.amountNaira > 0 && plan.unitLabel && (
                  <span className={cx("text-[13.5px]", isDark ? "text-text-on-dark-2" : "text-text-tertiary")}>
                    {plan.unitLabel}
                  </span>
                )}
                {plan.strikeAmountNaira && (
                  <span className={cx("text-[16px] font-medium line-through", isDark ? "text-text-on-dark-2" : "text-text-tertiary")}>
                    {formatNaira(plan.strikeAmountNaira)}/mo
                  </span>
                )}
              </div>
              {plan.priceNote && (
                <p className={cx("m-0 mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold", isDark ? "text-green-bright" : "text-green-dark")}>
                  <Check size={14} strokeWidth={2.6} className="flex-none" />
                  {plan.priceNote}
                </p>
              )}
              {plan.role === "OWNER" && (
                <p className={cx("m-0 mt-1.5 text-[12.5px]", isDark ? "text-text-on-dark-2" : "text-text-tertiary")}>
                  {formatRate(plan.commissionRate)} commission on rent
                </p>
              )}

              <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0 max-[560px]:mt-3 max-[560px]:gap-1.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className={cx("flex items-start gap-2.5 text-[13px] leading-[1.35] max-[560px]:gap-2 max-[560px]:text-[12.5px] max-[560px]:leading-[1.3]", isDark ? "text-text-on-dark" : "text-text-secondary")}
                  >
                    <Check size={16} strokeWidth={2.1} className={cx("mt-px flex-none", isDark ? "text-green-bright" : "text-green-dark")} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* selection indicator */}
              <span
                className={cx(
                  "mt-5 inline-flex items-center justify-center gap-2 rounded-full border py-[11px] text-[14.5px] font-semibold transition-colors duration-200 ease-nc max-[560px]:mt-4 max-[560px]:py-2.5 max-[560px]:text-[14px]",
                  isActive
                    ? isDark
                      ? "border-green-bright bg-green-bright text-ink"
                      : "border-ink bg-ink text-cream"
                    : isDark
                      ? "border-[rgba(249,249,239,0.25)] text-cream"
                      : "border-border-strong text-ink"
                )}
              >
                {isActive ? (
                  <>
                    <Check size={16} strokeWidth={2.4} /> Selected
                  </>
                ) : (
                  "Choose plan"
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* actions */}
      <div className="mt-6 flex items-center justify-between gap-4 max-[520px]:flex-col-reverse max-[520px]:items-stretch">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="group inline-flex items-center gap-2 self-center text-[14.5px] font-semibold text-text-secondary transition-colors duration-200 ease-nc hover:text-ink disabled:opacity-60 max-[520px]:self-center"
          >
            <ArrowLeft size={17} strokeWidth={2} className="transition-transform duration-200 ease-nc group-hover:-translate-x-1" />
            Back
          </button>
        ) : (
          <span />
        )}

        <div className="flex flex-col items-center gap-[7px] max-[520px]:w-full">
          {!submitting && (
            <span className="onb-cue inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-green-dark">
              Tap Subscribe to continue
              <ChevronDown size={15} strokeWidth={2.4} className="onb-cue-chev" />
            </span>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={submitting}
            className={cx(
              "inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-8 py-[15px] text-[16px] font-semibold leading-none text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:bg-black hover:shadow-card active:scale-[0.97] disabled:cursor-default disabled:opacity-70 max-[520px]:w-full",
              !submitting && "onb-sub-hint",
              pulse && "onb-sub-emph"
            )}
          >
            {submitting ? (
              <>
                <Loader2 size={18} strokeWidth={2} className="animate-spin" /> Starting…
              </>
            ) : (
              <>
                {active.amountNaira === 0 ? "Continue with " : "Subscribe — "}
                {active.amountNaira === 0
                  ? active.name
                  : `${formatNaira(active.amountNaira)}/${cycle === "ANNUAL" ? "yr" : "mo"}`}
                <ArrowRight size={18} strokeWidth={2} className="onb-sub-arrow" />
              </>
            )}
          </button>
        </div>
      </div>

      <p className="mt-3.5 text-center text-[12.5px] leading-[1.5] text-text-tertiary">
        {active.amountNaira === 0
          ? "No card required. You can upgrade anytime from your dashboard."
          : cycle === "ANNUAL"
            ? "Billed yearly · cancel anytime · secured by Flutterwave."
            : "Billed monthly · cancel anytime · secured by Flutterwave. Pay annually and get 2 months free."}
      </p>
    </div>
  );
}
