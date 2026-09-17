"use client";

import { useMemo, useState } from "react";
import { Check, ArrowRight, ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import { cx } from "@/lib/cx";
import { UserType } from "@/types/api";
import type { Plan, BillingCycle } from "@/types/api";
import { plansFor, formatNaira, type SubscriptionPlanSpec } from "@/lib/constants/business";

/* ============================================================
   Role-aware subscription plans.

   Plans are NOT defined here any more. Price, features, badges and
   entitlements all come from the single source of truth in
   backend/shared/src/constants/subscriptionPlans.ts, reached through the
   frontend shim (@/lib/constants/business). The backend's PLAN_CONFIG and
   the Flutterwave plan sync script read the same file, so the price on this
   card is the price that gets charged — by construction.
   ============================================================ */

/** Shared plan spec → the `Plan` shape these cards render. */
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
}: {
  role: UserType;
  onChoose: (plan: Plan) => void;
  onBack?: () => void;
  /** Preselect a plan id (resumed PENDING checkout, or the last one tapped). */
  initialPlanId?: string;
  /** Billing cycle to price — wire to a monthly/annual toggle when you add one. */
  cycle?: BillingCycle;
}) {
  // plansFor() maps UserType → PlanRole internally (PROPERTY_MANAGER/ADMIN
  // fall back to owner plans, as the old PLANS_BY_ROLE[OWNER] default did).
  const plans = useMemo(() => plansFor(role, cycle).map(toUiPlan), [role, cycle]);

  // Preselect a resumed plan when one exists (an abandoned PENDING checkout, or
  // the last plan tapped before the tab was discarded) so a returning user sees
  // their own choice already highlighted rather than our default.
  const [selected, setSelected] = useState<string>(
    (initialPlanId && plans.some((p) => p.id === initialPlanId) ? initialPlanId : null) ??
      plans.find((p) => p.highlight)?.id ??
      plans[0].id
  );
  const [submitting, setSubmitting] = useState(false);
  const [pulse, setPulse] = useState(false);

  const active = plans.find((p) => p.id === selected) ?? plans[0];

  const pick = (id: string) => {
    setSelected(id);
    // restart the one-shot attention pulse on the Subscribe button
    setPulse(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setPulse(true)));
  };

  const handleContinue = () => {
    setSubmitting(true);
    onChoose(active);
  };

  return (
    <div className="w-full">
      <div className={cx("grid gap-3.5 max-[560px]:gap-3", plans.length === 1 ? "mx-auto max-w-[460px] grid-cols-1" : plans.length === 2 ? "grid-cols-2 max-[680px]:grid-cols-1" : "grid-cols-3")}>
        {plans.map((plan) => {
          const isElite = !!plan.highlight;
          const isActive = selected === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => pick(plan.id)}
              className={cx(
                "group relative flex flex-col rounded-card border p-6 text-left transition-[transform,box-shadow,border-color] duration-200 ease-nc hover:-translate-y-1 max-[560px]:rounded-[20px] max-[560px]:p-[18px]",
                isElite ? "bg-ink text-cream" : "bg-surface text-text-primary",
                isActive
                  ? isElite
                    ? "border-transparent shadow-lift ring-2 ring-green-bright"
                    : "border-ink shadow-lift ring-1 ring-ink"
                  : isElite
                    ? "border-transparent shadow-card"
                    : "border-border-hair shadow-card hover:border-border"
              )}
            >
              {plan.badge && (
                <span
                  className={cx(
                    "absolute right-6 top-6 inline-flex items-center rounded-full px-[11px] py-[5px] text-[11px] font-bold uppercase tracking-[0.08em] max-[560px]:right-[18px] max-[560px]:top-[18px]",
                    isElite ? "bg-green-bright text-ink" : "bg-green-wash text-green-dark"
                  )}
                >
                  {plan.badge}
                </span>
              )}

              <h3 className={cx("m-0 text-[22px] font-bold tracking-[-0.03em] max-[560px]:text-[20px]", isElite ? "text-cream" : "text-text-primary")}>
                {plan.name}
              </h3>
              <p className={cx("m-0 mt-1 text-[13.5px] max-[560px]:text-[13px]", isElite ? "text-text-on-dark-2" : "text-text-secondary")}>
                {plan.tagline}
              </p>

              <div className="mt-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 max-[560px]:mt-3.5">
                <span className={cx("text-[32px] font-bold tracking-[-0.04em] max-[560px]:text-[28px]", isElite ? "text-cream" : "text-text-primary")}>
                  {plan.price === 0 ? "Free" : formatNaira(plan.price)}
                </span>
                {plan.price > 0 && (
                  <span className={cx("text-[15px]", isElite ? "text-text-on-dark-2" : "text-text-tertiary")}>
                    {cycle === "ANNUAL" ? "/year" : "/month"}
                  </span>
                )}
                {plan.strikePrice && (
                  <span className={cx("text-[17px] font-medium line-through", isElite ? "text-text-on-dark-2" : "text-text-tertiary")}>
                    {formatNaira(plan.strikePrice)}/mo
                  </span>
                )}
              </div>
              {plan.priceNote && (
                <p className={cx("m-0 mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold", isElite ? "text-green-bright" : "text-green-dark")}>
                  <Check size={14} strokeWidth={2.6} className="flex-none" />
                  {plan.priceNote}
                </p>
              )}

              <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0 max-[560px]:mt-3 max-[560px]:gap-1.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className={cx("flex items-start gap-2.5 text-[13.5px] leading-[1.35] max-[560px]:gap-2 max-[560px]:text-[12.5px] max-[560px]:leading-[1.3]", isElite ? "text-text-on-dark" : "text-text-secondary")}
                  >
                    <Check size={17} strokeWidth={2.1} className={cx("mt-px flex-none max-[560px]:size-4", isElite ? "text-green-bright" : "text-green-dark")} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* selection indicator */}
              <span
                className={cx(
                  "mt-5 inline-flex items-center justify-center gap-2 rounded-full border py-[11px] text-[14.5px] font-semibold transition-colors duration-200 ease-nc max-[560px]:mt-4 max-[560px]:py-2.5 max-[560px]:text-[14px]",
                  isActive
                    ? isElite
                      ? "border-green-bright bg-green-bright text-ink"
                      : "border-ink bg-ink text-cream"
                    : isElite
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
                {active.price === 0 ? "Continue with " : "Subscribe — "}
                {active.price === 0
                  ? active.name
                  : `${formatNaira(active.price)}/${cycle === "ANNUAL" ? "yr" : "mo"}`}
                <ArrowRight size={18} strokeWidth={2} className="onb-sub-arrow" />
              </>
            )}
          </button>
        </div>
      </div>

      <p className="mt-3.5 text-center text-[12.5px] leading-[1.5] text-text-tertiary">
        {active.price === 0
          ? "No card required. You can upgrade anytime from your dashboard."
          : cycle === "ANNUAL"
            ? "Billed yearly · cancel anytime · secured by Flutterwave."
            : "Billed monthly · cancel anytime · secured by Flutterwave. Pay annually and get 2 months free."}
      </p>
    </div>
  );
}
