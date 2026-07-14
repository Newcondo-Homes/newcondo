"use client";

/* ============================================================
   OnboardingFlow

   Phases: register → verify → (phone) → plan → payment(finalize) → success

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
   • Social sign-ups get two gap-fills before the plan step:
       1. Google/Facebook never carry the role picked in step 1 (OAuth
          callbacks don't see our callbackUrl's query params) — if the
          account's userType differs from ?role=, we PATCH it server-side
          via /api/user/profile and push it into the session.
       2. Google never returns a phone number — if session.user.phone is
          empty, we route to the "phone" phase to collect one before plan.
   ============================================================ */

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, RotateCcw } from "lucide-react";
// NOTE: useSession comes from your NextAuth client; adjust the import if your
// auth package exposes it elsewhere. Requires a SessionProvider above this tree.
import { useSession } from "@newcondo/auth/client";
import { cx } from "@/lib/cx";
import { EASE } from "@/components/motion";
import { UserType } from "@/types/api";
import type { Plan, PaymentResult } from "@/types/api";
import OnboardingForm, { type OnboardingDraft } from "./onboarding-form";
import PhonePrompt from "./phone-prompt";
import PlanSelector from "./plan-selector";
import PaymentProcessing from "./payment-processing";
import PaymentSuccess from "./payment-success";
import FitToViewport from "./fit-to-viewport";
import { OTPVerificationPanel } from "@/components/auth/OTPVerificationPanel";
import { getOnboardingState, changeAccountType, checkEmailRegistered } from "@/lib/api/onboarding";
import { updateProfile } from "@/lib/api/profile";

const LOGO_DARK = "/assets/logo-mark-dark.png";

/* ------------------------------------------------------------------ */
/* Flow phases                                                         */
/* ------------------------------------------------------------------ */
type Phase = "register" | "verify" | "phone" | "plan" | "payment" | "success";

const STEPS: { key: Phase | "done"; label: string }[] = [
  { key: "register", label: "Account" },
  { key: "verify", label: "Verify" },
  { key: "plan", label: "Plan" },
  { key: "payment", label: "Payment" },
];

const PHASE_INDEX: Record<Phase, number> = {
  register: 0,
  verify: 1,
  // Grouped visually with "Verify" in the stepper — it's a one-off contact
  // step for social sign-ups (Google never returns a phone number), not a
  // whole extra stage of the flow.
  phone: 1,
  plan: 2,
  payment: 3,
  success: 4,
};

const PHASE_MAXW: Record<Phase, string> = {
  register: "max-w-4xl",
  verify: "max-w-[460px]",
  phone: "max-w-[480px]",
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
  const { data: session, status, update } = useSession();

  const initialRole = roleFromParam(searchParams.get("role"));

  const [phase, setPhase] = useState<Phase>("register");
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  // True once we resolved a returning user via GET /onboarding/state — they
  // have an abandoned PENDING checkout (Q1) and we dropped them back on the
  // plan step with a "resume" banner.
  const [resuming, setResuming] = useState(false);
  // Blocks a flash of the register form while we resolve backend state for an
  // authenticated arrival (the Q3 "already paid → dashboard" check).
  const [checkingState, setCheckingState] = useState(false);

  /* ── Q4 — returning SUBSCRIBER whose session expired ──
     Requirement: a user who already has a subscription and tries to onboard
     again should land on the DASHBOARD (active session) or the LOGIN page
     (expired session).

     • Active session  → handled below by getOnboardingState (ACTIVE → dashboard).
     • Expired session → we do NOT guess from a localStorage marker (it goes
       stale — a deleted/cancelled user would be wrongly bounced to login
       forever). Instead the truth is checked at the real decision point: when
       the user submits the register step, the backend reports whether that
       email already exists. An existing account → send to /login; a fresh (or
       deleted) email → onboard normally. See handleDetailsSubmit below. */

  /* ── Authenticated entry: resume / guard via the backend ──
     When we arrive already authenticated at the START of the flow (returning
     from Google/Facebook or One Tap, OR a user who registered earlier, paid
     or abandoned, and came back), ask the backend where they stand BEFORE
     showing any step. This is what makes the three edge cases correct:

       • Q3 — already ACTIVE/FREE_ACTIVE  → straight to /dashboard, never the
         payment step again. No double-charge possible.
       • Q1 — abandoned PENDING checkout  → resume on the plan step with a
         banner; re-picking reuses the same subscription row server-side.
       • Social / fresh authed user       → resume at plan (via "phone" first
         if they have none on file).

     The `phase === "register"` guard stops this firing later, when our own
     deferred register() in the finalize step makes the session authenticated. */
  const initializedFromSession = useRef(false);
  useEffect(() => {
    if (initializedFromSession.current) return;
    if (status === "loading") return;
    if (status !== "authenticated" || !session?.user) return;
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

    const resolvedRole = initialRole ?? u.userType ?? UserType.OWNER;
    setDraft({
      name: u.name ?? "",
      email: u.email ?? "",
      phone: u.phone ?? "",
      password: "", // unused — account already exists
      role: resolvedRole,
    });
    setAlreadyRegistered(true);

    // Resolve their canonical onboarding state, then route accordingly.
    setCheckingState(true);
    (async () => {
      try {
        // Google/Facebook sign-up never carries the role the user picked in
        // step 1 — persist it now if it differs from what's on file. This
        // runs before the state check so a Q3 redirect (if any) already has
        // the right role recorded.
        if (initialRole && u.userType && initialRole !== u.userType) {
          const res = await updateProfile({ userType: initialRole });
          if (res.success) await update({ userType: initialRole });
        }

        const state = await getOnboardingState();
        if (state?.redirectTo === "dashboard" || state?.step === "done") {
          // Q3 — they're already subscribed. Leave onboarding entirely.
          router.replace("/dashboard");
          return;
        }
        if (state?.pendingPlan) {
          // Q1 — they had a checkout in progress. Resume on the plan step.
          setResuming(true);
        }

        // Social sign-ups have no phone from OAuth — collect it once, here,
        // before letting them into the plan step (email users already gave
        // theirs in OnboardingForm).
        setPhase(u.phone ? "plan" : "phone");
      } catch {
        setPhase(u.phone ? "plan" : "phone");
      } finally {
        setCheckingState(false);
      }
    })();
  }, [status, session, phase, draft, initialRole, router, update]);

  const goToDashboard = useCallback(() => router.push("/dashboard"), [router]);

  /* Q2 — returning user wants a different account type. Their account already
     exists, so we change the role server-side (allowed only while their
     subscription is still PENDING; the backend refuses once ACTIVE) and send
     them back to the role/details step to re-pick a plan for the new role. */
  const handleChangeAccountType = useCallback(async () => {
    setPhase("register");
    setResuming(false);
    setPlan(null);
  }, []);

  /* Fresh register submit (Q4 server-truth check). Before sending an OTP, ask
     the backend whether this email already has an account:
       • exists  → a real returning user whose session expired → /login (with a
         callback to the dashboard). Their subscription state is resolved there.
       • free    → brand-new OR a previously-deleted email → onboard normally.
     This replaces the unreliable localStorage marker: it's server truth, so a
     deleted user is correctly treated as new, and a real user is sent to login. */
  const [submittingDetails, setSubmittingDetails] = useState(false);
  const handleDetailsSubmit = useCallback(
    async (d: OnboardingDraft) => {
      setSubmittingDetails(true);
      try {
        const exists = await checkEmailRegistered(d.email);
        if (exists) {
          router.replace(
            `/login?callbackUrl=${encodeURIComponent("/dashboard")}&email=${encodeURIComponent(
              d.email.trim().toLowerCase()
            )}`
          );
          return;
        }
        setDraft(d);
        setPhase("verify");
      } finally {
        setSubmittingDetails(false);
      }
    },
    [router]
  );

  /* Called when a returning (already-registered) user re-submits the role/
     details step with a possibly-different role. Persists the role change,
     then jumps straight to plan (no OTP — the account is already verified). */
  const handleReturningRoleSubmit = useCallback(
    async (d: OnboardingDraft) => {
      if (draft && d.role !== draft.role) {
        const res = await changeAccountType(d.role);
        if (!res.ok) {
          // Backend refused (e.g. already ACTIVE) — keep them on the old role.
          alert(res.reason ?? "Couldn't change your account type.");
          return;
        }
      }
      setDraft(d);
      setPhase("plan");
    },
    [draft]
  );

  const activeIndex = PHASE_INDEX[phase];

  // Brief gate while we resolve an authenticated arrival's backend state, so
  // the register form / plan step never flashes before the Q3 redirect.
  if (checkingState) {
    return (
      <main className="flex h-dvh items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-ink" strokeWidth={2} />
      </main>
    );
  }

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
                  initialRole={draft?.role ?? initialRole}
                  // Returning user changing account type: account already
                  // exists, so re-submitting only changes the role (Q2). A
                  // fresh user goes through verify as normal.
                  onDetailsSubmit={(d) => {
                    if (alreadyRegistered) {
                      void handleReturningRoleSubmit(d);
                    } else {
                      void handleDetailsSubmit(d);
                    }
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

              {phase === "phone" && draft && (
                <PhonePrompt
                  name={draft.name}
                  onUpdateSession={(patch) => update(patch)}
                  onSaved={(phone) => {
                    setDraft((d) => (d ? { ...d, phone } : d));
                    setPhase("plan");
                  }}
                />
              )}

              {phase === "plan" && draft && (
                <div>
                  {resuming && (
                    <div className="mx-auto mb-4 flex max-w-[640px] items-center justify-center gap-2.5 rounded-full border border-green-dark/20 bg-green-wash px-5 py-2.5 text-[13.5px] font-medium text-green-dark">
                      <RotateCcw size={15} strokeWidth={2.2} />
                      Welcome back — pick up where you left off, or choose a different plan.
                    </div>
                  )}
                  <div className="mb-5 text-center">
                    <h1 className="m-0 text-[clamp(26px,3.2vw,40px)] font-bold leading-[1.02] tracking-[-0.04em] text-text-primary text-balance">
                      Choose your plan
                    </h1>
                    <p className="mx-auto mt-2 max-w-[52ch] text-[15.5px] leading-[1.5] text-text-secondary">
                      {draft.role === UserType.OWNER
                        ? "Every plan includes escrow rent, verified tenants, and your dashboard."
                        : "Start free or unlock priority access. Change this anytime from your dashboard."}
                    </p>
                    {/* Q2 — always offer a way to switch account type from the plan step. */}
                    <button
                      type="button"
                      onClick={handleChangeAccountType}
                      className="mt-2.5 text-[13px] font-semibold text-text-tertiary underline-offset-4 transition-colors duration-200 ease-nc hover:text-ink hover:underline"
                    >
                      Not a{" "}
                      {draft.role === UserType.OWNER ? " property owner" : draft.role === UserType.AGENT ? "n agent" : " renter"}? Change account type
                    </button>
                  </div>
                  <PlanSelector
                    role={draft.role}
                    // Social/returning users have no details/OTP to return to;
                    // their "back" is the Change-account-type link above.
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
