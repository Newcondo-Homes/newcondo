"use client";

/* ============================================================
   OnboardingFlow — register-first

   THE CHANGE: the account is created at FORM SUBMIT, not after payment.
   Registration transmits the password once and we never hold it again, so a
   user who backgrounds or quits the browser to fetch their emailed code comes
   back to a live session and the OTP step — not an empty form. That was the
   original problem: reading the code REQUIRES leaving the browser, and on
   mobile the tab is frequently discarded outright.

   THE SERVER OWNS THE STEP. GET /auth/onboarding-state resolves it from the
   User row, its linked OAuth accounts and its subscription. The client no
   longer infers anything from session fields — that inference is what made
   OAuth fragile, and once registration moved earlier it would have pushed
   every signed-in-but-unverified user straight past verification.

   Both paths converge on the same resolver:

     email form   register → verify → plan → payment → success
     Google       (email already proven by Google) → details → plan → …
     Facebook     details (collect email + phone) → verify → plan → …

   details comes BEFORE verify on purpose: Facebook often returns no email at
   all, and an address we do not yet have cannot be verified.

   PAYMENT IS NEVER RESUMED INTO. A restored `payment` phase would remount
   PaymentProcessing, which charges immediately — so someone who merely reopened
   a tab could be billed twice. The resolver returns `plan`; one extra tap makes
   a duplicate charge impossible.
   ============================================================ */

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, RotateCcw, AlertCircle } from "lucide-react";
import { useSession, signOut } from "@newcondo/auth/client";
import { cx } from "@/lib/cx";
import { errMsg } from "@/lib/errMsg";
import { EASE } from "@/components/motion";
import { UserType } from "@/types/api";
import type { Plan, PaymentResult } from "@/types/api";
import OnboardingForm, { type OnboardingDraft } from "./onboarding-form";
import SocialAccountDetails, { type SocialDetailsPayload } from "@/components/onboarding/SocialAccountDetails";
import PlanSelector from "./plan-selector";
import PaymentProcessing from "./payment-processing";
import PaymentSuccess from "./payment-success";
import FitToViewport from "./fit-to-viewport";
import { OTPVerificationPanel } from "@/components/auth/OTPVerificationPanel";
import {
  getOnboardingState, registerAccount, checkEmailRegistered, changeAccountType,
  changeOnboardingEmail,
  type OnboardingState,
} from "@/lib/api/onboarding";
import { updateProfile } from "@/lib/api/profile";
import { useAuth } from "@/hooks/useAuth";
import { loadOnboarding, saveOnboarding, clearOnboarding } from "@/lib/onboarding-storage";

const LOGO_DARK = "/assets/logo-mark-dark.png";

type Phase = "register" | "verify" | "details" | "plan" | "payment" | "success";

const STEPS: { key: string; label: string }[] = [
  { key: "register", label: "Account" },
  { key: "verify", label: "Verify" },
  { key: "plan", label: "Plan" },
  { key: "payment", label: "Payment" },
];

const PHASE_INDEX: Record<Phase, number> = {
  register: 0, verify: 1, details: 1, plan: 2, payment: 3, success: 4,
};

const PHASE_MAXW: Record<Phase, string> = {
  register: "max-w-4xl",
  verify: "max-w-[460px]",
  details: "max-w-[480px]",
  plan: "max-w-[1000px]",
  payment: "max-w-[480px]",
  success: "max-w-[560px]",
};

function roleFromParam(p: string | null): UserType | undefined {
  switch ((p ?? "").toLowerCase()) {
    case "agent": case "agents": return UserType.AGENT;
    case "renter": case "renters": return UserType.RENTER;
    case "owner": case "owners": case "property-owner": case "property_owner": return UserType.OWNER;
    default: return undefined;
  }
}

export default function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const { signInAfterRegister } = useAuth();

  const initialRole = roleFromParam(searchParams.get("role"));

  const [phase, setPhase] = useState<Phase>("register");
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [serverState, setServerState] = useState<OnboardingState | null>(null);
  const [resuming, setResuming] = useState(false);
  const [emailSendFailed, setEmailSendFailed] = useState(false);
  // Gates the first paint so an empty register form never flashes before the
  // resolved step appears.
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Every user reaching the payment step now already has an account, so
  // PaymentProcessing never registers — it only charges.
  const registered = !!serverState || status === "authenticated";

  /* ── Resolve the step from the server ──
     Runs for any authenticated arrival: a fresh OAuth return, a resumed
     registration, or a reopened tab. The local cache is only consulted for the
     pre-registration form, below. */
  const resolvedOnce = useRef(false);
  const resolve = useCallback(async (opts: { patchRole?: UserType } = {}) => {
    try {
      // Google/Facebook never carry the role picked in step 1 — persist it
      // before reading state, so the resolved answer already reflects it.
      if (opts.patchRole) {
        const res = await updateProfile({ userType: opts.patchRole });
        // STALE_SESSION: the JWT is valid but its user row is gone (deleted by
        // an admin, or swept by the stub-cleanup job). The 30-day token outlives
        // the record, so the browser keeps presenting a session that can read
        // but never write — every PATCH fails with Prisma P2025. Sign out and
        // restart as an anonymous registration rather than looping on a write
        // that cannot succeed.
        if (!res.success && res.code === "STALE_SESSION") {
          clearOnboarding();
          await signOut({ redirect: false });
          setServerState(null);
          setPhase("register");
          setFormError("Your previous session expired. Please create your account again.");
          setReady(true);
          return;
        }
        if (res.success) await update({ userType: opts.patchRole });
      }

      const state = await getOnboardingState();
      setServerState(state);

      if (state.redirectTo === "dashboard") {
        clearOnboarding();
        router.replace("/dashboard");
        return;
      }

      setDraft((d) => ({
        name: state.name ?? d?.name ?? "",
        email: state.email ?? d?.email ?? "",
        phone: d?.phone ?? "",
        password: "", // never held after registration
        role: (state.role as UserType) ?? opts.patchRole ?? initialRole ?? UserType.OWNER,
      }));
      if (state.pendingPlan) setResuming(true);
      setPhase(state.step === "done" ? "plan" : (state.step as Phase));
    } catch (e) {
      // A failed resolve must not strand them on a blank screen. The register
      // step is always safe: register reuses an unverified stub, so resubmitting
      // is idempotent for the same person.
      console.error("[onboarding] state resolve failed", e);
      setPhase("register");
    } finally {
      setReady(true);
    }
  }, [router, update, initialRole]);

  useEffect(() => {
    if (resolvedOnce.current) return;
    if (status === "loading") return;

    if (status === "authenticated") {
      resolvedOnce.current = true;
      const sessionRole = (session?.user as { userType?: UserType } | undefined)?.userType;
      void resolve({
        patchRole: initialRole && initialRole !== sessionRole ? initialRole : undefined,
      });
      return;
    }

    // Anonymous: prefill the form from whatever they typed before. Nothing here
    // is a credential — the password is not stored, by design.
    resolvedOnce.current = true;
    const saved = loadOnboarding();
    if (saved?.email || saved?.name) {
      setDraft({
        name: saved.name ?? "", email: saved.email ?? "", phone: saved.phone ?? "",
        password: "", role: saved.role ?? initialRole ?? UserType.OWNER,
      });
    }
    setReady(true);
  }, [status, session, initialRole, resolve]);

  const goToDashboard = useCallback(async () => {
    clearOnboarding();
    // Flutterwave's client callback can fire before the webhook has flipped
    // isPremium, so poll rather than navigating into the dashboard's gate and
    // bouncing back out again.
    for (let i = 0; i < 6; i++) {
      const fresh = await update();
      if ((fresh?.user as { isPremium?: boolean } | undefined)?.isPremium) break;
      await new Promise((r) => setTimeout(r, 1200));
    }
    router.push("/dashboard");
  }, [router, update]);

  /* ── Form submit: REGISTER, then sign in ──
     This is the whole point of the change. After this returns, the password is
     gone from the client for good. */
  const handleDetailsSubmit = useCallback(async (d: OnboardingDraft) => {
    setSubmitting(true);
    setFormError(null);
    try {
      // A verified account (or an existing customer) belongs on /login. The
      // backend answers false for an unverified, unsubscribed ghost, so a
      // returning abandoner is registered again against their own stub.
      if (await checkEmailRegistered(d.email)) {
        router.replace(
          `/login?callbackUrl=${encodeURIComponent("/dashboard")}&email=${encodeURIComponent(d.email.trim().toLowerCase())}`
        );
        return;
      }

      const result = await registerAccount({
        name: d.name, email: d.email, phone: d.phone,
        password: d.password, userType: d.role,
      });

      // Sign in NOW, not at payment: initiateSubscription is behind
      // authMiddleware and needs the Bearer token from a live session.
      const signedIn = await signInAfterRegister(d.email, d.password);
      if (!signedIn?.success) {
        console.warn("[onboarding] auto sign-in failed", signedIn?.error);
      }

      // register issues the OTP itself. Calling sendOTP as well would mint a
      // second code and invalidate the one already in flight — so the panel
      // mounts WITHOUT sendOnMount below.
      setEmailSendFailed(result.emailSent === false);
      setDraft({ ...d, password: "" });
      saveOnboarding({ name: d.name, email: d.email, phone: d.phone, role: d.role });
      setPhase("verify");
    } catch (e) {
      setFormError(errMsg(e, "We couldn't create your account. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }, [router, signInAfterRegister]);

  /* A mistyped email used to be a dead end: from the verify step, Back only
     edits the ROLE once the account exists, so there was no way to fix the
     address short of abandoning and starting a new account. This patches it,
     resets emailVerified and re-issues the code server-side, all without
     leaving the flow. */
  const handleChangeEmail = useCallback(async (nextEmail: string) => {
    try {
      const res = await changeOnboardingEmail(nextEmail);
      setDraft((d) => (d ? { ...d, email: res.email ?? nextEmail } : d));
      saveOnboarding({ email: res.email ?? nextEmail });
      // The session carries the address, so refresh it or the panel keeps
      // rendering the old one after the patch succeeds.
      await update({ email: res.email ?? nextEmail });
      setEmailSendFailed(res.emailSent === false);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errMsg(e, "Couldn't update your email address.") };
    }
  }, [update]);

  /* Q2 — returning user wants a different account type. */
  const handleChangeAccountType = useCallback(() => {
    setPhase("register");
    setResuming(false);
    setPlan(null);
  }, []);

  /* Already-registered user re-submitting the role step (Q2). No OTP: the
     account exists, so this only changes the role. */
  const handleReturningRoleSubmit = useCallback(async (d: OnboardingDraft) => {
    if (draft && d.role !== draft.role) {
      // No subscription row exists yet for email users at this point, so patch
      // the profile directly; changeAccountType is for a PENDING subscription.
      const res = serverState?.subscriptionStatus === "PENDING"
        ? await changeAccountType(d.role)
        : await updateProfile({ userType: d.role }).then((r) => ({ ok: r.success, reason: r.error }));
      if (!res.ok) { setFormError(res.reason ?? "Couldn't change your account type."); return; }
      await update({ userType: d.role });
    }
    setDraft(d);
    setPhase(serverState?.needsEmailVerification ? "verify" : "plan");
  }, [draft, serverState, update]);

  /* Social gap-fill: phone (+ email for Facebook) + terms, then re-resolve so
     the server decides whether the new address still needs verifying. */
  const handleSocialDetailsSubmit = useCallback(async (payload: SocialDetailsPayload) => {
    const res = await updateProfile({
      phone: payload.phone,
      ...(payload.email ? { email: payload.email } : {}),
    });
    if (!res.success) { setFormError(res.error ?? "Couldn't save your details."); return; }
    await update({ phone: payload.phone });
    setDraft((d) => (d ? { ...d, phone: payload.phone, email: payload.email ?? d.email } : d));
    // Changing the email resets emailVerified server-side, so ask again rather
    // than assuming: a Facebook user who just typed their address needs the OTP.
    await resolve();
  }, [update, resolve]);

  const activeIndex = PHASE_INDEX[phase];

  if (!ready) {
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
                  <span className={cx(
                    "grid h-7 w-7 flex-none place-items-center rounded-full border text-[13px] font-semibold transition-colors duration-300 ease-nc",
                    done ? "border-ink bg-ink text-cream"
                      : current ? "border-ink bg-surface text-ink"
                        : "border-border bg-surface text-text-tertiary"
                  )}>
                    {done ? <Check size={15} strokeWidth={2.6} /> : i + 1}
                  </span>
                  <span className={cx(
                    "text-[13.5px] font-semibold transition-colors duration-300 ease-nc max-[520px]:hidden",
                    done || current ? "text-text-primary" : "text-text-tertiary"
                  )}>
                    {step.label}
                  </span>
                </span>
                {i < STEPS.length - 1 && (
                  <span className="h-px flex-1 bg-border">
                    <span className="block h-full bg-ink transition-[width] duration-500 ease-nc"
                      style={{ width: i < activeIndex ? "100%" : "0%" }} />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </header>

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
                <>
                  {formError && (
                    <div className="mx-auto mb-3 flex max-w-[560px] items-start gap-2.5 rounded-2xl border border-danger/25 bg-danger/[0.06] px-4 py-3 text-[13.5px] leading-snug text-danger">
                      <AlertCircle size={16} strokeWidth={2} className="mt-px flex-none" />
                      {formError}
                    </div>
                  )}
                  <OnboardingForm
                    initialRole={draft?.role ?? initialRole}
                    initialDraft={draft ?? undefined}
                    submitting={submitting}
                    onDetailsSubmit={(d) => {
                      if (registered) void handleReturningRoleSubmit(d);
                      else void handleDetailsSubmit(d);
                    }}
                  />
                </>
              )}

              {phase === "verify" && draft?.email && (
                <>
                  {emailSendFailed && (
                    <div className="mx-auto mb-3 flex max-w-[460px] items-start gap-2.5 rounded-2xl border border-warn-line/40 bg-warn-wash px-4 py-3 text-[13px] leading-snug text-text-primary">
                      <AlertCircle size={16} strokeWidth={2} className="mt-px flex-none text-warn-line" />
                      We couldn&rsquo;t send the code just now. Tap <b className="font-semibold">Resend</b> in a moment.
                    </div>
                  )}
                  <OTPVerificationPanel
                    email={draft.email}
                    type="EMAIL_VERIFICATION"
                    // NOT sendOnMount: register (or the profile email change)
                    // already issued the code. Auto-sending here would mint a
                    // second one and kill the code already in their inbox — the
                    // exact failure this whole change exists to prevent.
                    disableBackUntilExpired
                    onChangeEmail={handleChangeEmail}
                    onVerified={() => { void resolve(); }}
                    onBack={() => setPhase("register")}
                    backLabel="Back to details"
                  />
                </>
              )}

              {phase === "details" && draft && (
                <SocialAccountDetails
                  name={draft.name}
                  role={draft.role}
                  // Facebook can omit the email entirely; ask for it here.
                  needsEmail={serverState ? !serverState.hasEmail : false}
                  onSubmit={handleSocialDetailsSubmit}
                  onBack={handleChangeAccountType}
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
                    <button
                      type="button"
                      onClick={handleChangeAccountType}
                      className="mt-2.5 text-[13px] font-semibold text-text-tertiary underline-offset-4 transition-colors duration-200 ease-nc hover:cursor-pointer hover:text-ink hover:underline"
                    >
                      Not a{draft.role === UserType.OWNER ? " property owner" : draft.role === UserType.AGENT ? "n agent" : " renter"}? Change account type
                    </button>
                  </div>
                  <PlanSelector
                    role={draft.role}
                    initialPlanId={serverState?.pendingPlan ?? loadOnboarding()?.planId}
                    onBack={undefined}
                    onChoose={(chosen) => {
                      setPlan(chosen);
                      saveOnboarding({ planId: chosen.id });
                      setPhase("payment");
                    }}
                  />
                </div>
              )}

              {phase === "payment" && plan && draft && (
                <PaymentProcessing
                  plan={plan}
                  draft={draft}
                  // Always true now — the account was created at form submit,
                  // so this step only charges.
                  alreadyRegistered
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
