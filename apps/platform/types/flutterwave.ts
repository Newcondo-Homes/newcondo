/* ============================================================
   Flutterwave — subscription payload types (onboarding)

   IMPORTANT: this file no longer augments `Window`. Your app already
   declares `Window.FlutterwaveCheckout` (and `closePaymentModal`) in
   apps/platform/lib/api/flutterwave.ts — that is the single source of
   truth. Declaring it again here is what caused:
     TS2717 "Subsequent property declarations must have the same type"
     TS2687 "All declarations of 'FlutterwaveCheckout' must have identical modifiers"

   The onboarding checkout now goes through your existing
   `flutterwaveClient.initializePayment(...)` (see useFlutterwaveInline),
   so nothing here touches the global.

   These two types describe ONLY the payload your backend's
   `initiateSubscription` returns and the response your callback receives.
   ============================================================ */

export interface FlutterwavePayloadCustomer {
  email: string;
  name?: string;
  phonenumber?: string;
}

export interface FlutterwavePayloadCustomizations {
  title?: string;
  description?: string;
  logo?: string;
}

/**
 * The payload returned by POST /payments/subscriptions/initiate.
 * `payment_plan` is the Flutterwave plan ID — it's what makes the card
 * charge recur monthly.
 */
export interface FlutterwavePayload {
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options?: string;
  /** Flutterwave payment-plan ID → recurring (monthly) billing. */
  payment_plan?: string | number;
  customer: FlutterwavePayloadCustomer;
  meta?: Record<string, unknown>;
  customizations?: FlutterwavePayloadCustomizations;
  redirect_url?: string;
}

/**
 * Response passed to the inline `callback`. Structurally compatible with
 * your `FlutterwaveResponse` in @/types/payment (kept local so this file
 * has no cross-imports).
 */
export interface FlutterwaveCallbackResponse {
  status: "successful" | "completed" | "cancelled" | "failed" | string;
  transaction_id?: number | string;
  tx_ref: string;
  flw_ref?: string;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
}
