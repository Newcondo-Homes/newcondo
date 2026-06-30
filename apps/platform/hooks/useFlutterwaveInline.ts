"use client";

/* ============================================================
   useFlutterwaveInline — onboarding subscription checkout adapter

   WHY THIS CALLS window.FlutterwaveCheckout DIRECTLY:
   Your isolated console test — a minimal FlutterwaveCheckout({...}) with
   public_key, tx_ref, amount, currency, customer, callback, onclose —
   opened the card modal fine on this exact page. Routing the same charge
   through flutterwaveClient.initializePayment(...) left the iframe stuck
   on Flutterwave's orange spinner. The wrapper was adding fields that
   broke inline init — chiefly `redirect_url`, which flips Inline into the
   redirect/standard flow (navigates the user away AND can hang the iframe).

   So we build the SAME minimal config the working test used. Notably:
     • NO redirect_url  → user stays in onboarding; the inline `callback`
       fires on success instead of a full-page redirect.
     • payment_plan is passed straight through (recurring monthly billing)
       only when the backend supplies it.

   The Flutterwave script is loaded once in app/layout.tsx via
   <Script strategy="beforeInteractive">, and the Window globals
   (FlutterwaveCheckout, closePaymentModal) are declared in
   lib/api/flutterwave.ts — we reuse both; nothing is injected here.
   ============================================================ */

import { useCallback, useRef } from "react";
import type {
  FlutterwaveCallbackResponse,
  FlutterwavePayload,
} from "@/types/flutterwave";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ?? "";
const FLW_SRC = "https://checkout.flutterwave.com/v3.js";

/**
 * Self-contained script loader (singleton). We DON'T rely on the layout
 * <Script beforeInteractive> tag because in this app it wasn't making
 * FlutterwaveCheckout available by click time (the console test showed
 * `window.FlutterwaveCheckout is not a function`). Loading it here and
 * awaiting it guarantees the global exists before we open checkout —
 * exactly what the old flutterwaveClient wrapper used to do.
 */
let flwScriptPromise: Promise<void> | null = null;
function ensureFlutterwaveLoaded(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (typeof window.FlutterwaveCheckout === "function") return Promise.resolve();
  if (flwScriptPromise) return flwScriptPromise;

  flwScriptPromise = new Promise<void>((resolve, reject) => {
    const finish = () => {
      if (typeof window.FlutterwaveCheckout === "function") resolve();
      else reject(new Error("Flutterwave script loaded but FlutterwaveCheckout is undefined"));
    };
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${FLW_SRC}"]`);
    if (existing) {
      if (typeof window.FlutterwaveCheckout === "function") return resolve();
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => { flwScriptPromise = null; reject(new Error("Failed to load Flutterwave")); }, { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = FLW_SRC;
    s.async = true;
    s.addEventListener("load", finish, { once: true });
    s.addEventListener("error", () => { flwScriptPromise = null; reject(new Error("Failed to load the Flutterwave checkout script")); }, { once: true });
    document.head.appendChild(s);
  });
  return flwScriptPromise;
}

interface OpenArgs {
  payload: FlutterwavePayload;
  onSuccess: (response: FlutterwaveCallbackResponse) => void;
  /** User dismissed the Flutterwave modal without completing payment. */
  onClose: () => void;
  onError: (error: Error) => void;
}

export function useFlutterwaveInline() {
  // Guards onclose firing AFTER a successful callback (FLW fires both).
  const settledRef = useRef(false);

  const open = useCallback(
    async ({ payload, onSuccess, onClose, onError }: OpenArgs) => {
      settledRef.current = false;
      try {
        // Make sure the global exists (loads the script if the layout didn't).
        await ensureFlutterwaveLoaded();
        if (!PUBLIC_KEY) {
          throw new Error("NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY is not set.");
        }
        if (!payload.amount || payload.amount <= 0) {
          throw new Error(`Flutterwave needs a positive amount — backend returned amount=${payload.amount}.`);
        }
        if (!payload.customer?.email) {
          throw new Error("Backend payload is missing customer.email — Flutterwave can't initialize without it.");
        }

        // --- Build the SAME minimal config the working test used. ---
        // Only include optional keys when present; an `undefined`
        // redirect_url is intentionally never added.
        const config: Record<string, unknown> = {
          public_key: PUBLIC_KEY,
          tx_ref: payload.tx_ref,
          amount: payload.amount,
          currency: payload.currency || "NGN",
          payment_options: payload.payment_options || "card",
          customer: {
            email: payload.customer.email,
            name: payload.customer.name || payload.customer.email,
            phonenumber: payload.customer.phonenumber,
          },
          customizations: {
            title: payload.customizations?.title || "NewCondo subscription",
            description: payload.customizations?.description || "Monthly subscription",
            logo: payload.customizations?.logo,
          },
          callback: (response: FlutterwaveCallbackResponse) => {
            settledRef.current = true;
            // Close FLW's own iframe modal explicitly.
            if (typeof window.closePaymentModal === "function") window.closePaymentModal();
            const ok = response?.status === "successful" || response?.status === "completed";
            if (ok) onSuccess(response);
            else onError(new Error(`Payment ${response?.status ?? "was not completed"}.`));
          },
          onclose: () => {
            // Only a dismissal if no successful callback already fired.
            if (!settledRef.current) onClose();
          },
        };

        // Recurring billing — attach the Flutterwave plan ID when present.
        if (payload.payment_plan != null && payload.payment_plan !== "") {
          config.payment_plan = payload.payment_plan;
        }
        // NOTE: redirect_url is deliberately omitted — keeps the user in
        // onboarding and uses the inline callback above.

        if (payload.meta && Object.keys(payload.meta).length > 0) {
          config.meta = payload.meta;
        }

        if (typeof window.FlutterwaveCheckout !== "function") {
          throw new Error("FlutterwaveCheckout is unavailable after loading the script.");
        }
        window.FlutterwaveCheckout(config as never);
      } catch (err) {
        onError(err instanceof Error ? err : new Error("Could not open checkout"));
      }
    },
    []
  );

  return { open };
}
