"use client";

/* ============================================================
   FlutterwaveCheckoutModal

   The animated subscription-checkout modal. Appears right after the
   user picks a plan (the flow's payment phase mounts payment-processing,
   which opens this). It owns the full finalize:

     PAID  → register (if needed) → initiate subscription → open the
             Flutterwave Inline card modal → on success, finalize.
     FREE  → register (if needed) → create free subscription → finalize.

   Recurring billing: the backend attaches `payment_plan` (the Flutterwave
   plan ID) to the payload, so Flutterwave charges the saved card every
   month automatically; the server's renewal cron is the backstop.

   Rendered through a portal to document.body so it escapes the scaled
   FitToViewport ancestor (a CSS transform would otherwise become the
   containing block for `position: fixed`).

   Mobile: the sheet docks to the bottom edge (squared bottom corners)
   and caps at ~90vh with internal scroll, so tall content on short
   phones never gets clipped.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  ShieldCheck,
  Loader2,
  AlertCircle,
  X,
  Check,
  RefreshCw,
  CreditCard,
} from "lucide-react";
import { cx } from "@/lib/cx";
import { EASE } from "@/components/motion";
import { useRegister } from "@/hooks/useAuth";
import { useFlutterwaveInline } from "@/hooks/useFlutterwaveInline";
import {
  initiateSubscription,
  createFreeRenterSubscription,
  resolveSubscriptionPlanCode,
  isLiveBackend,
} from "@/lib/api/subscriptions";
import { UserType } from "@/types/api";
import type { BillingCycle, Plan, PaymentResult } from "@/types/api";
import type { OnboardingDraft } from "../auth/onboarding-form";

const naira = (n: number) => `\u20A6${n.toLocaleString("en-NG")}`;

type Stage = "review" | "working" | "error";

export default function FlutterwaveCheckoutModal({
  open,
  plan,
  role,
  draft,
  alreadyRegistered = false,
  billingCycle = "MONTHLY",
  onSuccess,
  onClose,
}: {
  open: boolean;
  plan: Plan;
  role: UserType;
  /** Collected details (incl. password) — registered before charging. */
  draft: OnboardingDraft;
  /** Social sign-ups already have an account — skip register(). */
  alreadyRegistered?: boolean;
  billingCycle?: BillingCycle;
  onSuccess: (result: { payment?: PaymentResult }) => void;
  /** Dismiss → back to plan selection. */
  onClose: () => void;
}) {
  const free = plan.price === 0;
  const { mutate: register } = useRegister();
  const { open: openCheckout } = useFlutterwaveInline();

  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<Stage>("review");
  const [workingLabel, setWorkingLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // Reset to review whenever the modal (re)opens for a fresh plan.
  useEffect(() => {
    if (open) {
      setStage("review");
      setError(null);
      startedRef.current = false;
    }
  }, [open, plan.id]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const registerAsync = useCallback(
    () =>
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
      }),
    [register, draft]
  );

  const fail = useCallback((message: string) => {
    setError(message);
    setStage("error");
    startedRef.current = false;
  }, []);

  /* ---- FREE plan: register (+ free subscription), no Flutterwave ---- */
  const activateFree = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStage("working");
    setError(null);
    try {
      setWorkingLabel("Setting up your account\u2026");
      if (!alreadyRegistered) await registerAsync();
      if (role === UserType.RENTER) await createFreeRenterSubscription();
      onSuccess({});
    } catch (e) {
      fail(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  }, [alreadyRegistered, registerAsync, role, onSuccess, fail]);

  /* ---- PAID plan: register → initiate → Flutterwave inline ---- */
  const pay = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStage("working");
    setError(null);

    try {
      // 1) Account must exist before initiate() (backend reads req.user.id).
      setWorkingLabel("Creating your account\u2026");
      if (!alreadyRegistered) await registerAsync();

      // 2) Ask the backend for the Flutterwave payload (recurring plan attached).
      setWorkingLabel("Opening secure checkout\u2026");
      const planCode = plan.subscriptionPlan ?? resolveSubscriptionPlanCode(role, plan.id, billingCycle);

      // DEV/mock: no backend → simulate a successful charge so the flow is demoable.
      if (!isLiveBackend) {
        await new Promise((r) => setTimeout(r, 1400));
        onSuccess({
          payment: { reference: `FLW-MOCK-${Date.now()}`, status: "successful", amount: plan.price },
        });
        return;
      }

      const { flwPayload } = await initiateSubscription(planCode);

      // 3) Open Flutterwave's inline card modal.
      await openCheckout({
        payload: flwPayload,
        onSuccess: (resp) => {
          setWorkingLabel("Confirming your subscription\u2026");
          onSuccess({
            payment: {
              reference: String(resp.tx_ref ?? resp.flw_ref ?? ""),
              status: "successful",
              amount: plan.price,
            },
          });
        },
        onClose: () => {
          // User closed FLW without paying — let them try again.
          startedRef.current = false;
          setStage("review");
        },
        onError: (e) => fail(e.message),
      });
    } catch (e) {
      fail(e instanceof Error ? e.message : "We couldn't start the payment. Please try again.");
    }
  }, [alreadyRegistered, registerAsync, plan, role, billingCycle, openCheckout, onSuccess, fail]);

  // Escape closes (only when idle on the review screen).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stage === "review") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, stage, onClose]);

  if (!mounted) return null;

  const topFeatures = plan.features.slice(0, 4);

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 max-[480px]:items-end max-[480px]:p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          aria-modal="true"
          role="dialog"
          aria-label="Confirm your subscription"
        >
          {/* scrim */}
          <button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={() => stage === "review" && onClose()}
            className="absolute inset-0 cursor-default bg-ink/55 backdrop-blur-[3px]"
          />

          {/* panel */}
          <motion.div
            className="relative z-10 flex max-h-[90vh] w-full max-w-[440px] flex-col overflow-hidden rounded-card border border-border-hair bg-surface shadow-pop max-[480px]:max-h-[92vh] max-[480px]:rounded-b-none max-[480px]:rounded-t-[24px]"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {/* close */}
            {stage !== "working" && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full text-text-tertiary transition-colors duration-200 ease-nc hover:bg-black/5 hover:text-ink"
              >
                <X size={19} strokeWidth={2} />
              </button>
            )}

            {/* ---- REVIEW ---- */}
            {stage === "review" && (
              <div className="overflow-y-auto p-[clamp(22px,2.6vw,30px)] max-[480px]:p-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-green-dark">
                  {free ? "Confirm your plan" : "Confirm subscription"}
                </p>

                <div className="mt-2.5 flex items-baseline gap-2">
                  <h2 className="m-0 text-[clamp(26px,3vw,32px)] font-bold tracking-[-0.04em] text-text-primary">
                    {free ? "Free" : naira(plan.price)}
                  </h2>
                  {!free && (
                    <span className="text-[15px] font-medium text-text-tertiary">
                      /{billingCycle === "ANNUAL" ? "year" : "month"}
                    </span>
                  )}
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
                  onClick={free ? activateFree : pay}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[16px] font-semibold leading-none text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:bg-black hover:shadow-card active:scale-[0.97]"
                >
                  {free ? (
                    "Activate free plan"
                  ) : (
                    <>
                      <CreditCard size={18} strokeWidth={2} />
                      Pay {naira(plan.price)}/{billingCycle === "ANNUAL" ? "yr" : "mo"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2.5 inline-flex w-full items-center justify-center rounded-full px-7 py-2.5 text-[14px] font-semibold text-text-secondary transition-colors duration-200 ease-nc hover:text-ink"
                >
                  Choose a different plan
                </button>

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
                      Billed {billingCycle === "ANNUAL" ? "yearly" : "monthly"} to your card · cancel anytime from your
                      dashboard. We never store your card details.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* ---- WORKING ---- */}
            {stage === "working" && (
              <div className="flex flex-col items-center p-[clamp(30px,3.4vw,42px)] text-center max-[480px]:p-8">
                <span className="relative grid h-[60px] w-[60px] place-items-center">
                  <span className="absolute inset-0 rounded-full border-2 border-border-hair" />
                  <Loader2 size={30} strokeWidth={2} className="animate-spin text-ink" />
                </span>
                <h2 className="mt-6 text-[20px] font-bold tracking-[-0.03em] text-text-primary">{workingLabel}</h2>
                <p className="mt-2 max-w-[34ch] text-[14px] leading-[1.5] text-text-secondary">
                  Please don&apos;t close this window.
                </p>
              </div>
            )}

            {/* ---- ERROR ---- */}
            {stage === "error" && (
              <div className="flex flex-col items-center overflow-y-auto p-[clamp(26px,3vw,36px)] text-center max-[480px]:p-6">
                <span className="grid h-[58px] w-[58px] place-items-center rounded-full bg-danger/[0.08] text-danger">
                  <AlertCircle size={28} strokeWidth={1.9} />
                </span>
                <h2 className="mt-5 text-[21px] font-bold tracking-[-0.03em] text-text-primary">
                  We couldn&apos;t finish that
                </h2>
                <p className="mt-2 max-w-[40ch] text-[14px] leading-[1.5] text-text-secondary">{error}</p>
                {!free && (
                  <p className="mt-2 text-[12.5px] text-text-tertiary">
                    If your card was charged, retrying is safe — you won&apos;t be billed twice.
                  </p>
                )}
                <div className="mt-6 flex w-full items-center gap-3 max-[420px]:flex-col-reverse">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-border-strong bg-surface px-6 py-[13px] text-[15px] font-semibold text-ink transition-colors duration-200 ease-nc hover:bg-surface-sunken max-[420px]:w-full"
                  >
                    Back to plans
                  </button>
                  <button
                    type="button"
                    onClick={free ? activateFree : pay}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 py-[14px] text-[15px] font-semibold text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:bg-black hover:shadow-card active:scale-[0.97] max-[420px]:w-full"
                  >
                    <RefreshCw size={16} strokeWidth={2} />
                    Try again
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
