"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cx } from "@/lib/cx";
import { EASE } from "@/components/motion";
import { UserType } from "@/types/api";
import type { OnboardingProfile, Plan, PaymentResult } from "@/types/api";
import OnboardingForm from "./onboarding-form";
import PlanSelector from "./plan-selector";
import PaymentProcessing from "./payment-processing";
import PaymentSuccess from "./payment-success";
import FitToViewport from "./fit-to-viewport";

const LOGO_DARK = "/assets/logo-mark-dark.png";

/* ------------------------------------------------------------------ */
/* Flow phases                                                         */
/* ------------------------------------------------------------------ */
type Phase = "register" | "plan" | "payment" | "success";

const STEPS: { key: Phase | "done"; label: string }[] = [
  { key: "register", label: "Account" },
  { key: "plan", label: "Plan" },
  { key: "payment", label: "Payment" },
];

const PHASE_INDEX: Record<Phase, number> = {
  register: 0,
  plan: 1,
  payment: 2,
  success: 3,
};

const PHASE_MAXW: Record<Phase, string> = {
  register: "max-w-4xl",
  plan: "max-w-[1000px]",
  payment: "max-w-[480px]",
  success: "max-w-[560px]",
};

export default function OnboardingFlow() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("register");
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [payment, setPayment] = useState<PaymentResult | null>(null);

  const goToDashboard = useCallback(() => router.push("/dashboard"), [router]);

  const activeIndex = PHASE_INDEX[phase];

  return (
    <main
      data-screen-label="Onboarding"
      className="flex h-dvh flex-col overflow-hidden bg-background px-[clamp(20px,5vw,48px)] pb-[clamp(14px,2.4vh,26px)] pt-[clamp(14px,2.4vh,28px)]"
    >
      {/* ── brand + progress (pinned, never scaled) ── */}
      <header className="mx-auto flex w-full max-w-4xl flex-none flex-col items-center gap-[clamp(10px,1.8vh,18px)]">
        <Link href="/" className="flex items-center gap-[11px] text-[22px] font-bold tracking-[-0.04em] text-ink no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_DARK} alt="Newcondo" className="h-auto w-[30px]" />
          <span>newcondo</span>
        </Link>

        <ol className="flex w-full max-w-[420px] list-none items-center justify-between gap-2 p-0">
          {STEPS.map((step, i) => {
            const done = i < activeIndex || phase === "success";
            const current = i === activeIndex && phase !== "success";
            return (
              <li key={step.key} className="flex flex-1 items-center gap-2 last:flex-none">
                <span className="flex items-center gap-2">
                  <span
                    className={cx(
                      "grid h-7 w-7 flex-none place-items-center rounded-full border text-[13px] font-semibold transition-colors duration-300 ease-nc",
                      done
                        ? "border-ink bg-ink text-cream"
                        : current
                          ? "border-ink bg-surface text-ink"
                          : "border-border bg-surface text-text-tertiary"
                    )}
                  >
                    {done ? <Check size={15} strokeWidth={2.6} /> : i + 1}
                  </span>
                  <span
                    className={cx(
                      "text-[13.5px] font-semibold transition-colors duration-300 ease-nc max-[520px]:hidden",
                      done || current ? "text-text-primary" : "text-text-tertiary"
                    )}
                  >
                    {step.label}
                  </span>
                </span>
                {i < STEPS.length - 1 && (
                  <span className="h-px flex-1 bg-border">
                    <span
                      className="block h-full bg-ink transition-[width] duration-500 ease-nc"
                      style={{ width: i < activeIndex ? "100%" : "0%" }}
                    />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </header>

      {/* ── step content (scales to fit the remaining height) ── */}
      <div className="flex min-h-0 w-full flex-1 justify-center pt-[clamp(12px,2.4vh,30px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="h-full w-full"
          >
            <FitToViewport className={cx("mx-auto", PHASE_MAXW[phase])}>
            {phase === "register" && (
              <OnboardingForm
                onRegistered={(p) => {
                  setProfile(p);
                  setPhase("plan");
                }}
              />
            )}

            {phase === "plan" && profile && (
              <div>
                <div className="mb-5 text-center">
                  <h1 className="m-0 text-[clamp(26px,3.2vw,40px)] font-bold leading-[1.02] tracking-[-0.04em] text-text-primary text-balance">
                    Choose your plan
                  </h1>
                  <p className="mx-auto mt-2 max-w-[52ch] text-[15.5px] leading-[1.5] text-text-secondary">
                    {profile.role === UserType.PROPERTY_OWNER
                      ? "Every plan includes escrow rent, verified tenants, and your dashboard."
                      : "Start free or unlock priority access. Change this anytime from your dashboard."}
                  </p>
                </div>
                <PlanSelector
                  role={profile.role}
                  onBack={() => setPhase("register")}
                  onChoose={(chosen) => {
                    setPlan(chosen);
                    setPhase("payment");
                  }}
                />
              </div>
            )}

            {phase === "payment" && plan && (
              <PaymentProcessing
                plan={plan}
                onComplete={(result) => {
                  setPayment(result);
                  setPhase("success");
                }}
              />
            )}

            {phase === "success" && profile && plan && (
              <PaymentSuccess
                profile={profile}
                plan={plan}
                payment={payment ?? undefined}
                onContinue={goToDashboard}
              />
            )}
            </FitToViewport>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
