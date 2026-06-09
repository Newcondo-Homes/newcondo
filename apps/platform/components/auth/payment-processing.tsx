"use client";

import { useEffect, useRef } from "react";
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import { usePayment } from "@/hooks/useAuth";
import type { Plan, PaymentResult } from "@/types/api";

/* ============================================================
   PaymentProcessing

   A transient screen shown while the subscription charge runs.
   Today it calls the mocked `usePayment` hook; wire the real
   Flutterwave checkout inside `usePayment` (see hooks/useAuth.ts)
   or kick off FlutterwaveCheckout() directly here.
   ============================================================ */
const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

export default function PaymentProcessing({
  plan,
  onComplete,
}: {
  plan: Plan;
  onComplete: (result: PaymentResult) => void;
}) {
  const { pay } = usePayment();
  const started = useRef(false);

  useEffect(() => {
    // Guard against React 18 StrictMode double-invoke in dev.
    if (started.current) return;
    started.current = true;

    /* 🔌 FLUTTERWAVE — the charge runs here (mocked in usePayment).
       For a real inline checkout you'd instead open the widget and
       resolve onComplete from its callback after server verification. */
    pay(plan, { onSuccess: (result) => onComplete(result) });
  }, [pay, plan, onComplete]);

  const free = plan.price === 0;

  return (
    <div className="flex flex-col items-center text-center">
      <span className="relative grid h-[68px] w-[68px] place-items-center">
        <span className="absolute inset-0 rounded-full border-2 border-border-hair" />
        <Loader2 size={34} strokeWidth={2} className="animate-spin text-ink" />
      </span>

      <h2 className="mt-7 text-[clamp(24px,3vw,32px)] font-bold tracking-[-0.035em] text-text-primary">
        {free ? "Setting up your account…" : "Processing your payment…"}
      </h2>
      <p className="mt-2.5 max-w-[44ch] text-[15.5px] leading-[1.55] text-text-secondary">
        {free
          ? "Just a moment while we get your dashboard ready."
          : `Securely charging ${naira(plan.price)} for your ${plan.name} plan. Please don't close this window.`}
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
