"use client";

/* ============================================================
   PaymentProcessing  (finalize step)

   IMPORTANT — why the order changed to REGISTER-FIRST:
   Your Express backend gates BOTH subscription endpoints behind
   authMiddleware (they read req.user.id):
       POST /payments/subscriptions/initiate       (paid)
       POST /payments/subscriptions/renter-signup  (free renter)
   So the account MUST exist + be authenticated BEFORE we can create a
   subscription. The old charge-first flow never called the backend at
   all — which is exactly why (1) no free-renter subscription row was
   ever created and (2) paid subscriptions were never recorded.

   New order:
     1. register            → create the account
     2. signIn              → live NextAuth session (carries accessToken)
     3. waitForSessionToken → ensure apiClient can read the new token
     3b. syncRoleIfNeeded   → NEW: Google/Facebook OAuth sign-up creates the
         User row via the Prisma adapter, which only maps standard profile
         fields (name/email/image) — it NEVER sets userType, so a fresh
         Google user silently lands on your schema's default (RENTER),
         regardless of the role they picked in step 1. This step compares
         the LIVE session's userType against the role the user actually
         chose (`draft.role`) and PATCHes it via /api/user/profile BEFORE
         we ever call initiateSubscription — otherwise the backend correctly
         (but confusingly) rejects e.g. "Plan OWNER_ESSENTIAL is not
         available for RENTER accounts." Runs for every path (register OR
         already-registered/social), so it's a no-op/no-friction safety net
         whenever the roles already match, and the actual fix when they don't.
     4a. FREE renter  → POST /subscriptions/renter-signup
     4b. PAID         → POST /subscriptions/initiate → backend returns the
         authoritative Flutterwave payload (amount + payment_plan + tx_ref)
         → open Flutterwave Inline with THAT payload → success
     5. onComplete

   Opening the modal with the BACKEND payload (not a client-guessed
   amount) also fixes the "modal flashes / never opens" class of bug:
   when payment_plan is attached, Flutterwave rejects the call unless the
   amount matches the plan amount exactly — letting the server supply both
   guarantees they match.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { getSession } from "@newcondo/auth/client";
import { Loader2, ShieldCheck, Lock, AlertCircle, RefreshCw, ArrowLeft, Check, CreditCard } from "lucide-react";
import { useRegister, useAuth } from "@/hooks/useAuth";
import { useFlutterwaveInline } from "@/hooks/useFlutterwaveInline";
import {
  initiateSubscription,
  createFreeRenterSubscription,
  resolveSubscriptionPlanCode,
} from "@/lib/api/subscriptions";
import { updateProfile } from "@/lib/api/profile";
import { UserType } from "@/types/api";
import type { Plan, PaymentResult, AuthResponse } from "@/types/api";
import type { OnboardingDraft } from "./onboarding-form";

const naira = (n: number) => `\u20A6${n.toLocaleString("en-NG")}`;

/**
 * Poll getSession() until it returns a session carrying an accessToken (the
 * value apiClient sends as the Bearer). Right after signIn the session can
 * briefly still be the old token-less one; this prevents the resulting 401.
 * Resolves anyway after the timeout so we never hang the flow.
 */
async function waitForSessionToken(timeoutMs = 4000, intervalMs = 150): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const session = (await getSession()) as { accessToken?: string } | null;
      if (session?.accessToken) return;
    } catch {
      /* keep polling */
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/**
 * Force the backend's stored userType to match the role actually chosen in
 * this onboarding session — unconditionally, every time, right before
 * checkout. We do NOT gate this on reading the current value off the client
 * session first: NextAuth's session object only exposes userType if a custom
 * `session()` callback explicitly copies it there, and if it doesn't, our
 * previous "only patch if it differs" check would silently skip the patch
 * every single time (which is exactly the bug you just hit — the backend's
 * DB row stayed RENTER even after "syncing"). Calling PATCH unconditionally
 * is a harmless no-op write when the role already matches, and the guaranteed
 * fix when it doesn't — no client-side read of the current value to trust.
 */
async function syncRoleIfNeeded(desiredRole: UserType): Promise<void> {
  console.log("[PaymentProcessing] Forcing account type to:", desiredRole);
  const patched = await updateProfile({ userType: desiredRole });
  if (!patched.success) {
    throw new Error(
      patched.error ?? "Couldn't confirm your account type before checkout. Please try again."
    );
  }
  console.log("[PaymentProcessing] Account type confirmed:", patched.data?.userType ?? desiredRole);
  // Give the write a beat to land before the subscription call re-reads it.
  await new Promise((r) => setTimeout(r, 150));
}

export default function PaymentProcessing({
  plan,
  draft,
  alreadyRegistered = false,
  onComplete,
  onBack,
}: {
  plan: Plan;
  draft: OnboardingDraft;
  alreadyRegistered?: boolean;
  onComplete: (result: { payment?: PaymentResult }) => void;
  onBack?: () => void;
}) {
  const { open: openCheckout } = useFlutterwaveInline();
  const { mutate: register } = useRegister();
  const { signInAfterRegister } = useAuth();

  const signInRef = useRef(signInAfterRegister);
  useEffect(() => {
    signInRef.current = signInAfterRegister;
  });

  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"account" | "payment">("account");
  const [attempt, setAttempt] = useState(0);
  // Gate: show the "Confirm subscription" review card FIRST. Nothing runs
  // (no register, no charge) until the user taps Pay/Activate. This is the
  // modal the user expects before the Flutterwave card sheet appears.
  const [started, setStarted] = useState(false);

  // Guards StrictMode double-invoke — never runs the same attempt twice.
  const ranFor = useRef(-1);

  const free = plan.price === 0;

  // ---- Open Flutterwave Inline with the BACKEND-supplied payload ----
  const payWithBackendPayload = (
    flwPayload: Awaited<ReturnType<typeof initiateSubscription>>["flwPayload"]
  ) =>
    new Promise<PaymentResult>((resolve, reject) => {
      openCheckout({
        payload: flwPayload,
        onSuccess: (resp) =>
          resolve({
            reference: String(resp.tx_ref ?? resp.flw_ref ?? flwPayload.tx_ref),
            status: "successful",
            amount: plan.price,
          }),
        onClose: () =>
          reject(new Error("Payment was cancelled. You can try again when you're ready.")),
        onError: (e) => reject(e),
      });
    });

  // ---- register → returns the AuthResponse (so we can read the JWT) ----
  const registerAsync = () =>
    new Promise<AuthResponse>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Registration timed out. Please try again."));
      }, 15_000);

      register(
        {
          name: draft.name.trim(),
          email: draft.email.trim().toLowerCase(),
          phone: (draft.phone ?? "").replace(/\s/g, ""),
          password: draft.password,
          userType: draft.role,
        },
        {
          onSuccess: (data) => {
            clearTimeout(timeout);
            resolve(data);
          },
          onError: (err) => {
            clearTimeout(timeout);
            reject(new Error(err.message));
          },
        }
      );
    });

  useEffect(() => {
    if (!started) return; // wait for explicit confirmation
    if (ranFor.current === attempt) return;
    ranFor.current = attempt;

    let completed = false;

    (async () => {
      setError(null);
      setStep("account");
      try {
        // 1) Create the account (unless a social user already exists).
        if (!alreadyRegistered) {
          console.log("[PaymentProcessing] Registering user...");
          await registerAsync();
          console.log("[PaymentProcessing] Registration complete");

          // 2) Sign in so the NextAuth session (with accessToken) is live.
          //    apiClient reads session.accessToken for the backend calls below.
          console.log("[PaymentProcessing] Signing in...");
          const signInResult = await signInRef.current(
            draft.email.trim().toLowerCase(),
            draft.password
          );
          if (!signInResult.success) {
            throw new Error(
              signInResult.error ??
                "We created your account but couldn't sign you in. Please log in and choose your plan from your dashboard."
            );
          }

          // 2b) Wait until the session actually carries the accessToken before
          //     calling the backend — getSession() can briefly return the old
          //     (token-less) session right after signIn, which would 401.
          await waitForSessionToken();
        }

        // 3) Reconcile the DB's userType against what the user actually
        //    picked. No-op for email/password sign-ups (already correct);
        //    this is the real fix for Google/Facebook sign-ups, whose OAuth
        //    account creation never sets userType at all.
        console.log("[PaymentProcessing] Confirming account type...");
        await syncRoleIfNeeded(draft.role);

        // 4) Create the subscription on the backend (authed via apiClient).
        let paymentResult: PaymentResult | undefined;

        if (free) {
          // Free renter → record the free subscription server-side.
          if (draft.role === UserType.RENTER) {
            console.log("[PaymentProcessing] Creating free renter subscription...");
            await createFreeRenterSubscription();
            console.log("[PaymentProcessing] Free subscription created");
          }
        } else {
          // Paid → backend builds the Flutterwave payload (authoritative
          // amount + payment_plan), then we open the inline modal with it.
          setStep("payment");
          const planCode = resolveSubscriptionPlanCode(draft.role, plan.id, "MONTHLY");
          console.log("[PaymentProcessing] Initiating subscription:", planCode);
          const { flwPayload } = await initiateSubscription(planCode);
          console.log("[PaymentProcessing] Opening Flutterwave with backend payload");
          paymentResult = await payWithBackendPayload(flwPayload);
          console.log("[PaymentProcessing] Payment complete:", paymentResult);
        }

        // 5) Done.
        if (!completed) {
          completed = true;
          onComplete({ payment: paymentResult });
        }
      } catch (e: unknown) {
        console.error("[PaymentProcessing] Error:", e);
        const message =
          e instanceof Error ? e.message : "Something went wrong while finishing up. Please try again.";
        if (!completed) {
          completed = true;
          setError(message);
        }
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, started]);

  const beginCheckout = () => {
    setError(null);
    setStarted(true);
    setAttempt((a) => a + 1);
  };

  /* ---- Confirm subscription (review) — shown before anything runs ---- */
  if (!started && !error) {
    const topFeatures = (plan.features ?? []).slice(0, 4);
    return (
      <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-card border border-border-hair bg-surface p-[clamp(24px,2.6vw,30px)] shadow-pop">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-green-dark">
          {free ? "Confirm your plan" : "Confirm subscription"}
        </p>

        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="text-[clamp(28px,3.2vw,34px)] font-bold tracking-[-0.04em] text-text-primary">
            {free ? "Free" : naira(plan.price)}
          </span>
          {!free && <span className="text-[15px] font-medium text-text-tertiary">/month</span>}
          {plan.strikePrice ? (
            <span className="text-[17px] font-medium text-text-tertiary line-through">
              {naira(plan.strikePrice)}/mo
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[14px] text-text-secondary">
          {plan.name} plan{plan.tagline ? ` · ${plan.tagline}` : ""}
        </p>

        <ul className="mt-5 flex list-none flex-col gap-2.5 p-0">
          {topFeatures.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[14px] leading-[1.4] text-text-secondary">
              <Check size={16} strokeWidth={2.2} className="mt-px flex-none text-green-dark" />
              {f}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={beginCheckout}
          className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[16px] font-semibold leading-none text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:bg-black hover:shadow-card active:scale-[0.97] cursor-pointer"
        >
          {free ? (
            "Activate free plan"
          ) : (
            <>
              <CreditCard size={18} strokeWidth={2} />
              Pay {naira(plan.price)} / mo
            </>
          )}
        </button>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-2.5 inline-flex w-full items-center justify-center rounded-full px-7 py-2.5 text-[14px] font-semibold text-text-secondary transition-colors duration-200 ease-nc hover:text-ink cursor-pointer"
          >
            Choose a different plan
          </button>
        )}

        {!free && (
          <>
            <div className="mt-5 flex items-center justify-center gap-4 text-[12px] font-medium text-text-tertiary">
              <span className="inline-flex items-center gap-1.5">
                <Lock size={13} strokeWidth={2} className="text-green-dark" /> Secured by Flutterwave
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} strokeWidth={2} className="text-green-dark" /> PCI-DSS
              </span>
            </div>
            <p className="mt-2.5 text-center text-[11.5px] leading-[1.5] text-text-tertiary">
              Billed monthly to your card · cancel anytime from your dashboard. We never store your
              card details.
            </p>
          </>
        )}
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="flex flex-col items-center text-center">
        <span className="grid h-[64px] w-[64px] place-items-center rounded-full bg-danger/[0.08] text-danger">
          <AlertCircle size={32} strokeWidth={1.9} />
        </span>
        <h2 className="mt-6 text-[clamp(23px,2.8vw,30px)] font-bold tracking-[-0.035em] text-text-primary">
          We couldn&apos;t finish that
        </h2>
        <p className="mt-2.5 max-w-[46ch] text-[15px] leading-[1.55] text-text-secondary">{error}</p>
        {!free && (
          <p className="mt-2 text-[13px] text-text-tertiary">
            If you were charged, your account will still be created — retrying is safe.
          </p>
        )}
        <div className="mt-7 flex items-center gap-3 max-[480px]:flex-col-reverse max-[480px]:w-full">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-border-strong bg-surface px-6 py-[13px] text-[15px] font-semibold text-ink transition-colors duration-200 ease-nc hover:bg-surface-sunken max-[480px]:w-full cursor-pointer"
            >
              <ArrowLeft size={17} strokeWidth={2} className="transition-transform duration-200 ease-nc group-hover:-translate-x-1" />
              Back to plans
            </button>
          )}
          <button
            type="button"
            onClick={() => setAttempt((a) => a + 1)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-[14px] text-[15px] font-semibold text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:bg-black hover:shadow-card active:scale-[0.97] max-[480px]:w-full cursor-pointer"
          >
            <RefreshCw size={16} strokeWidth={2} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* ---- Processing state ---- */
  const heading = free
    ? "Setting up your account\u2026"
    : step === "account"
      ? "Creating your account\u2026"
      : "Processing your payment\u2026";

  return (
    <div className="flex flex-col items-center text-center">
      <span className="relative grid h-[68px] w-[68px] place-items-center">
        <span className="absolute inset-0 rounded-full border-2 border-border-hair" />
        <Loader2 size={34} strokeWidth={2} className="animate-spin text-ink" />
      </span>

      <h2 className="mt-7 text-[clamp(24px,3vw,32px)] font-bold tracking-[-0.035em] text-text-primary">
        {heading}
      </h2>
      <p className="mt-2.5 max-w-[44ch] text-[15.5px] leading-[1.55] text-text-secondary">
        {free
          ? "Just a moment while we create your account and get your dashboard ready."
          : `Securely charging ${naira(plan.price)} for your ${plan.name} plan. Please don't close this window.`}
      </p>

      {!free && (
        <div className="mt-7 flex items-center gap-5 text-[13px] font-medium text-text-tertiary">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={16} strokeWidth={1.9} className="text-green-dark" />
            Held in escrow
          </span>
          <span className="inline-flex items-center gap-2">
            <Lock size={15} strokeWidth={1.9} className="text-green-dark" />
            Secured by Flutterwave
          </span>
        </div>
      )}
    </div>
  );
}
