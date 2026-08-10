/* ============================================================
   backend/payment-service/src/services/flutterwave.types.ts

   Explicit shape for the Flutterwave v3 verify response.

   WHY THIS FILE: verifyFlutterwaveTransaction() currently returns
   `response.data.data` straight off axios, so it's implicitly `any` — every
   `tx.card?.token` / `tx.amount` read compiles even when the field name is
   wrong, and a typo only shows up at runtime as `undefined`. Typing the
   return makes the card metadata (last_4digits / type / expiry) a checked
   contract instead of a guess.

   Reference: GET https://api.flutterwave.com/v3/transactions/:id/verify
   ============================================================ */

/** `data.card` on a successful card charge. `last_4digits` is NOT a PAN —
    storing it for display is PCI-safe; `first_6digits`/`token` are not. */
export interface FlutterwaveVerifyCard {
  first_6digits?: string;
  last_4digits?: string;
  issuer?: string;
  country?: string;
  /** Card scheme — "VISA" | "MASTERCARD" | "VERVE". */
  type?: string;
  /** Reusable charge token — what tokenized-charges bills against. */
  token?: string;
  /** "MM/YY", e.g. "09/27". */
  expiry?: string;
}

export interface FlutterwaveVerifyCustomer {
  id?: number | string;
  name?: string;
  email?: string;
  phone_number?: string;
}

export interface FlutterwaveVerifyTransaction {
  id: number;
  tx_ref: string;
  flw_ref?: string;
  amount: number;
  charged_amount?: number;
  currency?: string;
  /** "successful" | "failed" | "pending" */
  status: string;
  payment_type?: string;
  processor_response?: string;
  narration?: string;
  created_at?: string;
  /** Present on plan-driven (recurring) charges. */
  subscription_id?: number | string;
  payment_plan?: number | string;
  meta?: Record<string, unknown> | null;
  customer?: FlutterwaveVerifyCustomer;
  card?: FlutterwaveVerifyCard;
}

/** Display-only card fields we persist on Subscription. */
export interface SavedCardMeta {
  last4?: string;
  brand?: string;
  expiry?: string;
}

/** Pull the display fields off a verify response. Returns undefined when the
    charge wasn't a card (transfer/USSD), so callers can skip the write. */
export function extractSavedCardMeta(
  tx: Pick<FlutterwaveVerifyTransaction, "card"> | null | undefined
): SavedCardMeta | undefined {
  if (!tx?.card) return undefined;
  const { last_4digits, type, issuer, expiry } = tx.card;
  if (!last_4digits && !type && !expiry) return undefined;
  return {
    last4: last_4digits ?? undefined,
    brand: type ?? issuer ?? undefined,
    expiry: expiry ?? undefined,
  };
}
