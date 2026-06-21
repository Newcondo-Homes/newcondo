"use client";

/* ============================================================
   OnboardingFlow

   Phases: register → verify → plan → payment(finalize) → success

   Key behaviours:
   • Deep-link role: /onboarding?role=agent|renter|owner pre-selects the
     role (so /agents and /renters can drop users straight in).
   • Deferred registration: the details form only COLLECTS data; the
     account is created in the payment(finalize) step after a plan is
     chosen — free → register; paid → charge then register.
   • OTP verify sits between details and plan; its Back button is locked
     until the code expires (then a fresh code is issued on return).
   • Social sign-in (Google/Facebook button, or Google One Tap for
     existing Gmail users) creates the account via OAuth and RETURNS here
     authenticated → we skip register/verify and resume at the plan step.
   ============================================================ */

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
// NOTE: useSession comes from your NextAuth client; adjust the import if your
// auth package exposes it elsewhere. Requires a SessionProvider above this tree.
import { useSession } from "@newcondo/auth/client";
import { cx } from "@/lib/cx";
import { EASE } from "@/components/motion";
import { UserType } from "@/types/api";
import type { Plan, PaymentResult } from "@/types/api";
import OnboardingForm, { type OnboardingDraft } from "./onboarding-form";
import PlanSelector from "./plan-selector";
import PaymentProcessing from "./payment-processing";
import PaymentSuccess from "./payment-success";
import FitToViewport from "./fit-to-viewport";
import { OTPVerificationPanel } from "@/components/auth/OTPVerificationPanel";

const LOGO_DARK = "/assets/logo-mark-dark.png";

/* ------------------------------------------------------------------ */
/* Flow phases                                                         */
/* ------------------------------------------------------------------ */
type Phase = "register" | "verify" | "plan" | "payment" | "success";

const STEPS: { key: Phase | "done"; label: string }[] = [
  { key: "register", label: "Account" },
  { key: "verify", label: "Verify" },
  { key: "plan", label: "Plan" },
  { key: "payment", label: "Payment" },
];

const PHASE_INDEX: Record<Phase, number> = {
  register: 0,
  verify: 1,
  plan: 2,
  payment: 3,
  success: 4,
};

const PHASE_MAXW: Record<Phase, string> = {
  register: "max-w-4xl",
  verify: "max-w-[460px]",
  plan: "max-w-[1000px]",
  payment: "max-w-[480px]",
  success: "max-w-[560px]",
};

/** Map a ?role= slug (from /agents, /renters, OAuth callback) to a UserType. */
function roleFromParam(p: string | null): UserType | undefined {
  switch ((p ?? "").toLowerCase()) {
    case "agent":
    case "agents":
      return UserType.AGENT;
    case "renter":
    case "renters":
      return UserType.RENTER;
    case "owner":
    case "owners":
    case "property-owner":
    case "property_owner":
      return UserType.OWNER;
    default:
      return undefined;
  }
}

export default function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { goToDashboard } = useAuth();

  const initialRole = roleFromParam(searchParams.get("role"));

  const [phase, setPhase] = useState<Phase>("register");
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  /* ── Social / authenticated entry ──
     If we arrive already authenticated AT THE START of the flow (returning
     from Google/Facebook, or One Tap), skip account creation and resume at
     the plan step. The `phase === "register"` guard is critical: it stops
     this from firing later, when our own deferred register() in the finalize
     step makes the session authenticated. */
  const initializedFromSession = useRef(false);
  useEffect(() => {
    if (initializedFromSession.current) return;
    if (status !== "authenticated" || !session?.user) return;

    // Only treat as a social/return entry at the very beginning.
    if (phase !== "register" || draft) {
      initializedFromSession.current = true;
      return;
    }

    initializedFromSession.current = true;
    const u = session.user as {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      userType?: UserType;
    };

    setDraft({
      name: u.name ?? "",
      email: u.email ?? "",
      phone: u.phone ?? "",
      password: "", // unused — account already exists
      role: initialRole ?? u.userType ?? UserType.OWNER,
    });
    setAlreadyRegistered(true);
    setPhase("plan");
  }, [status, session, phase, draft, initialRole]);

  // const goToDashboard = useCallback(() => router.push("/dashboard"), [router]);
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

        <ol className="flex w-full max-w-[460px] list-none items-center justify-between gap-2 p-0">
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
                  initialRole={initialRole}
                  onDetailsSubmit={(d) => {
                    setDraft(d);
                    setPhase("verify");
                  }}
                />
              )}

              {phase === "verify" && draft && (
                <OTPVerificationPanel
                  email={draft.email}
                  type="EMAIL_VERIFICATION"
                  sendOnMount
                  disableBackUntilExpired
                  onVerified={() => setPhase("plan")}
                  onBack={() => setPhase("register")}
                  backLabel="Back to details"
                />
              )}

              {phase === "plan" && draft && (
                <div>
                  <div className="mb-5 text-center">
                    <h1 className="m-0 text-[clamp(26px,3.2vw,40px)] font-bold leading-[1.02] tracking-[-0.04em] text-text-primary text-balance">
                      Choose your plan
                    </h1>
                    <p className="mx-auto mt-2 max-w-[52ch] text-[15.5px] leading-[1.5] text-text-secondary">
                      {draft.role === UserType.OWNER
                        ? "Every plan includes escrow rent, verified tenants, and your dashboard."
                        : "Start free or unlock priority access. Change this anytime from your dashboard."}
                    </p>
                  </div>
                  <PlanSelector
                    role={draft.role}
                    // Social users have no details/OTP to return to — hide Back for them.
                    onBack={alreadyRegistered ? undefined : () => setPhase("verify")}
                    onChoose={(chosen) => {
                      setPlan(chosen);
                      setPhase("payment");
                    }}
                  />
                </div>
              )}

              {phase === "payment" && plan && draft && (
                <PaymentProcessing
                  plan={plan}
                  draft={draft}
                  alreadyRegistered={alreadyRegistered}
                  onBack={() => setPhase("plan")}
                  onComplete={({ payment: result }) => {
                    setPayment(result ?? null);
                    setPhase("success");
                  }}
                />
              )}

              {phase === "success" && draft && plan && (
                <PaymentSuccess
                  profile={draft}
                  plan={plan}
                  payment={payment ?? undefined}
                  onContinue={goToDashboard}
                  redirectSeconds={40}
                />
              )}
            </FitToViewport>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
