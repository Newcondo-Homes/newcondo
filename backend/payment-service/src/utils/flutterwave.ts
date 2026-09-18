/* ============================================================
   Flutterwave — tokenized (recurring) charge helper

   Your @newcondo/payment-service already has verifyFlutterwaveTransaction().
   The ONE thing it doesn't have is charging a saved card token without the
   cardholder present — that's what the renewal cron needs. This adds it.

   ⚠️ THIS IS NOW LOAD-BEARING. The header used to say "you only need this if
   you move OFF payment_plan auto-billing (Model A)". That move has happened:
   owner tiers are priced per property, so the bill is a sum that changes with
   the portfolio, and a Flutterwave payment plan pins one fixed amount. There
   are no plan objects any more, Flutterwave charges nobody on our behalf, and
   this function is the only way a subscription gets billed after month one.
   See jobs/renewSubscriptions.ts and subscription-plans/BILLING-MODEL.md.

   ── ENV VAR FIX ────────────────────────────────────────────────────────────
   This file read FLW_SECRET_KEY. Nothing else in the monorepo sets that name:
   subscription.service.ts reads FLUTTERWAVE_SECRET_KEY, and
   combined-backend/src/config/environment.ts validates FLUTTERWAVE_SECRET_KEY.
   So FLW_SECRET_KEY was undefined and every tokenized charge would have gone
   out as `Authorization: Bearer undefined` → 401 → every renewal marked
   FAILED, three times, then EXPIRED. Invisible until the first renewal cycle.

   Now: FLUTTERWAVE_SECRET_KEY, with FLW_SECRET_KEY kept as a fallback in case
   an environment already has the old name set, and a hard error at call time
   rather than a silent 401.
   ============================================================ */

import axios from "axios";

const FLW_SECRET_KEY =
  process.env.FLUTTERWAVE_SECRET_KEY ?? process.env.FLW_SECRET_KEY;
const FLW_BASE = process.env.FLUTTERWAVE_BASE_URL ?? "https://api.flutterwave.com/v3";

export interface TokenizedChargeArgs {
  token: string; // card token captured on the first successful charge
  email: string;
  amount: number;
  currency?: string;
  txRef: string; // OUR unique reference — Flutterwave also dedupes on this
  narration?: string;
  meta?: Record<string, unknown>;
}

export interface TokenizedChargeResult {
  ok: boolean;
  status: string; // "successful" | "failed" | "pending"
  txRef: string;
  flwRef?: string;
  transactionId?: number;
  raw: unknown;
}

export async function chargeTokenizedCard(args: TokenizedChargeArgs): Promise<TokenizedChargeResult> {
  // Fail loudly and once, rather than letting every subscription in the run
  // collect a 401 and march toward EXPIRED.
  if (!FLW_SECRET_KEY) {
    throw new Error(
      "FLUTTERWAVE_SECRET_KEY is not set — tokenized charges cannot be made, " +
        "which means no subscription can renew. Set it in the environment."
    );
  }

  try {
    const { data } = await axios.post(
      `${FLW_BASE}/tokenized-charges`,
      {
        token: args.token,
        email: args.email,
        amount: args.amount,
        currency: args.currency ?? "NGN",
        tx_ref: args.txRef,
        narration: args.narration ?? "NewCondo subscription renewal",
        meta: args.meta,
      },
      { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
    );

    const d = data?.data;
    const status: string = d?.status ?? (data?.status === "success" ? "pending" : "failed");
    return {
      ok: data?.status === "success" && status === "successful",
      status,
      txRef: d?.tx_ref ?? args.txRef,
      flwRef: d?.flw_ref,
      transactionId: d?.id,
      raw: data,
    };
  } catch (err: unknown) {
    const e = err as { response?: { data?: unknown; status?: number }; message?: string };
    // 401 here almost always means the key is missing or is a TEST key against
    // live tokens — worth naming, because the generic "charge failed" path
    // sends the customer a dunning email for our configuration problem.
    if (e.response?.status === 401) {
      console.error(
        "[flutterwave] tokenized charge rejected with 401 — check FLUTTERWAVE_SECRET_KEY " +
          "matches the environment that issued the card token (TEST tokens cannot be charged with LIVE keys)."
      );
    }
    return {
      ok: false,
      status: "failed",
      txRef: args.txRef,
      raw: e.response?.data ?? e.message ?? "charge error",
    };
  }
}
