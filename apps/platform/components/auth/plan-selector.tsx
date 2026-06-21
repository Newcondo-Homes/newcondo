"use client";

import { useState } from "react";
import { Check, ArrowRight, ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import { cx } from "@/lib/cx";
import { UserType } from "@/types/api";
import type { Plan } from "@/types/api";

/* ============================================================
   Role-aware monthly subscription plans.
   Property-owner pricing mirrors the marketing site (Essential /
   Elite). Renter + Agent sets are defined for completeness.
   ============================================================ */
const PLANS_BY_ROLE: Partial<Record<UserType, Plan[]>> = {
  [UserType.OWNER]: [
    {
      id: "essential",
      name: "Essential",
      tagline: "Landlords with 1–2 properties",
      price: 7500,
      features: [
        "List up to 2 properties",
        "Escrow rent collection",
        "Identity-verified tenants",
        "Auto tenancy agreements",
        "1× annual fumigation",
        "20% platform commission",
      ],
    },
    {
      id: "elite",
      name: "Elite",
      tagline: "3+ properties · diaspora owners",
      price: 18500,
      highlight: true,
      badge: "Most popular",
      features: [
        "Everything in Essential",
        "Unlimited listings",
        "Commission drops to 15%",
        "24-hour emergency maintenance",
        "Dedicated account manager",
        "Rent default insurance",
      ],
    },
  ],
  // Renter plans — kept for when renter onboarding re-opens (UserTypeSelector).
  [UserType.RENTER]: [
    {
      id: "renter-free",
      name: "Basic",
      tagline: "Browse and apply",
      price: 0,
      features: [
        "Browse verified listings",
        "Save and compare homes",
        "Deposit held in escrow",
        "Tracked, accountable agents",
      ],
    },
    {
      id: "renter-plus",
      name: "Renter+",
      tagline: "Move faster, get seen first",
      price: 2500,
      highlight: true,
      badge: "Recommended",
      features: [
        "Everything in Basic",
        "Priority application review",
        "Early access to new listings",
        "Verified-renter badge",
        "Rent-payment history record",
      ],
    },
  ],
  [UserType.AGENT]: [
    {
      id: "agent-starter",
      name: "Starter",
      tagline: "New agents getting started",
      price: 0,
      features: ["List & promote properties", "Tracked promotion links", "Commission on closed lets", "Standard listing visibility"],
    },
    {
      id: "agent-pro",
      name: "Pro",
      tagline: "High-volume, full-time agents",
      price: 9500,
      highlight: true,
      badge: "Most popular",
      features: ["Everything in Starter", "Priority listing placement", "Priority marking-job queue", "Lower platform fee", "Performance dashboard"],
    },
  ],
};

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

export default function PlanSelector({
  role,
  onChoose,
  onBack,
}: {
  role: UserType;
  onChoose: (plan: Plan) => void;
  onBack?: () => void;
}) {
  const plans = PLANS_BY_ROLE[role] ?? PLANS_BY_ROLE[UserType.OWNER] ?? [];
  const [selected, setSelected] = useState<string>(
    plans.find((p) => p.highlight)?.id ?? plans[0].id
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
      <div className={cx("grid gap-4", plans.length === 2 ? "grid-cols-2 max-[680px]:grid-cols-1" : "grid-cols-3")}>
        {plans.map((plan) => {
          const isElite = !!plan.highlight;
          const isActive = selected === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => pick(plan.id)}
              className={cx(
                "group relative flex flex-col rounded-card border p-6 text-left transition-[transform,box-shadow,border-color] duration-200 ease-nc hover:-translate-y-1",
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
                    "absolute right-6 top-6 inline-flex items-center rounded-full px-[11px] py-[5px] text-[11px] font-bold uppercase tracking-[0.08em]",
                    isElite ? "bg-green-bright text-ink" : "bg-green-wash text-green-dark"
                  )}
                >
                  {plan.badge}
                </span>
              )}

              <h3 className={cx("m-0 text-[24px] font-bold tracking-[-0.03em]", isElite ? "text-cream" : "text-text-primary")}>
                {plan.name}
              </h3>
              <p className={cx("m-0 mt-1 text-[14px]", isElite ? "text-text-on-dark-2" : "text-text-secondary")}>
                {plan.tagline}
              </p>

              <div className="mt-[18px] flex items-baseline gap-1.5">
                <span className={cx("text-[36px] font-bold tracking-[-0.04em]", isElite ? "text-cream" : "text-text-primary")}>
                  {plan.price === 0 ? "Free" : naira(plan.price)}
                </span>
                {plan.price > 0 && (
                  <span className={cx("text-[15px]", isElite ? "text-text-on-dark-2" : "text-text-tertiary")}>/month</span>
                )}
              </div>

              <ul className="m-0 mt-[18px] flex list-none flex-col gap-[9px] p-0">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className={cx("flex items-start gap-2.5 text-[14px] leading-[1.35]", isElite ? "text-text-on-dark" : "text-text-secondary")}
                  >
                    <Check size={17} strokeWidth={2.1} className={cx("mt-px flex-none", isElite ? "text-green-bright" : "text-green-dark")} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* selection indicator */}
              <span
                className={cx(
                  "mt-5 inline-flex items-center justify-center gap-2 rounded-full border py-[11px] text-[14.5px] font-semibold transition-colors duration-200 ease-nc",
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
                {active.price === 0 ? active.name : `${naira(active.price)}/mo`}
                <ArrowRight size={18} strokeWidth={2} className="onb-sub-arrow" />
              </>
            )}
          </button>
        </div>
      </div>

      <p className="mt-3.5 text-center text-[12.5px] leading-[1.5] text-text-tertiary">
        {active.price === 0
          ? "No card required. You can upgrade anytime from your dashboard."
          : "Billed monthly · cancel anytime · secured by Flutterwave. Pay annually and get 2 months free."}
      </p>
    </div>
  );
}
