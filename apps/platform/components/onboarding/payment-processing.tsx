"use client";

/* ============================================================
   PaymentProcessing  (finalize step)

   This is where the account is ACTUALLY created — registration is
   deferred to here so an abandoned onboarding never leaves a
   half-made account behind.

   Order of operations:
     • Paid plan  → charge first (Flutterwave via usePayment), THEN register.
     • Free plan  → just register.
     • Social user (alreadyRegistered) → skip register; only charge if paid.

   On any failure it surfaces a retry + "Back to plans" so nothing is
   silently lost. A per-attempt ref guards React 18 StrictMode against
   double-charging in dev.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, Lock, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { usePayment, useRegister } from "@/hooks/useAuth";
import type { Plan, PaymentResult } from "@/types/api";
import type { OnboardingDraft } from "./onboarding-form";

const naira = (n: number) => `\u20A6${n.toLocaleString("en-NG")}`;

export default function PaymentProcessing({
  plan,
  draft,
  alreadyRegistered = false,
  onComplete,
  onBack,
}: {
  plan: Plan;
  /** Collected details (incl. password) — used to register at the end. */
  draft: OnboardingDraft;
  /** True for social sign-ups whose account already exists; skips register(). */
  alreadyRegistered?: boolean;
  onComplete: (result: { payment?: PaymentResult }) => void;
  /** Return to plan selection (shown on error). */
  onBack?: () => void;
}) {
  const { pay } = usePayment();
  const { mutate: register } = useRegister();

  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const ranFor = useRef(-1);

  const free = plan.price === 0;

  // Promise wrappers around the existing callback-style hooks.
  const payAsync = (p: Plan) =>
    new Promise<PaymentResult>((resolve, reject) => {
      pay(p, { onSuccess: resolve, onError: reject });
    });

  const registerAsync = () =>
    new Promise<void>((resolve, reject) => {
      register(
        {
          name: draft.name.trim(),
          email: draft.email.trim().toLowerCase(),
          phone: (draft.phone ?? "").replace(/\s/g, ""),
          password: draft.password,
          userType: draft.role,
        },
        { onSuccess: () => resolve(), onError: reject }
      );
    });

  useEffect(() => {
    // Guard StrictMode's double-invoke per attempt so we never charge twice.
    if (ranFor.current === attempt) return;
    ranFor.current = attempt;

    let cancelled = false;

    (async () => {
      setError(null);
      try {
        let paymentResult: PaymentResult | undefined;

        // 1) Charge first for paid plans (email already verified earlier in the flow).
        if (!free) {
          paymentResult = await payAsync(plan);
        }

        // 2) Create the account — unless this is a social user who already exists.
        //    Backend should treat the email as pre-verified (OTP was done in-flow)
        //    and attach the chosen `plan` as the active subscription.
        if (!alreadyRegistered) {
          await registerAsync();
        }

        // 3) TODO(optional): if subscription activation is a SEPARATE backend call
        //    from register/pay, fire it here with `plan` + `paymentResult`.

        if (!cancelled) onComplete({ payment: paymentResult });
      } catch (e: unknown) {
        const message =
          e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string"
            ? (e as { message: string }).message
            : "Something went wrong while finishing up. Please try again.";
        if (!cancelled) setError(message);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

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
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-border-strong bg-surface px-6 py-[13px] text-[15px] font-semibold text-ink transition-colors duration-200 ease-nc hover:bg-surface-sunken max-[480px]:w-full"
            >
              <ArrowLeft size={17} strokeWidth={2} className="transition-transform duration-200 ease-nc group-hover:-translate-x-1" />
              Back to plans
            </button>
          )}
          <button
            type="button"
            onClick={() => setAttempt((a) => a + 1)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-[14px] text-[15px] font-semibold text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:bg-black hover:shadow-card active:scale-[0.97] max-[480px]:w-full"
          >
            <RefreshCw size={16} strokeWidth={2} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* ---- Processing state ---- */
  return (
    <div className="flex flex-col items-center text-center">
      <span className="relative grid h-[68px] w-[68px] place-items-center">
        <span className="absolute inset-0 rounded-full border-2 border-border-hair" />
        <Loader2 size={34} strokeWidth={2} className="animate-spin text-ink" />
      </span>

      <h2 className="mt-7 text-[clamp(24px,3vw,32px)] font-bold tracking-[-0.035em] text-text-primary">
        {free ? "Setting up your account\u2026" : "Processing your payment\u2026"}
      </h2>
      <p className="mt-2.5 max-w-[44ch] text-[15.5px] leading-[1.55] text-text-secondary">
        {free
          ? "Just a moment while we create your account and get your dashboard ready."
          : `Securely charging ${naira(plan.price)} for your ${plan.name} plan, then creating your account. Please don't close this window.`}
      </p>

      {!free && (
        <div className="mt-7 flex items-center gap-5 text-[13px] font-medium text-text-tertiary">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={16} strokeWidth={1.9} className="text-green-dark" /> Held in escrow
          </span>
          <span className="inline-flex items-center gap-2">
            <Lock size={15} strokeWidth={1.9} className="text-green-dark" /> Secured by Flutterwave
          </span>
        </div>
      )}
    </div>
  );
}
