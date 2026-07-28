/* ============================================================
   Flutterwave — tokenized (recurring) charge helper

   Your @newcondo/payment-service already has verifyFlutterwaveTransaction().
   The ONE thing it doesn't have is charging a saved card token without the
   cardholder present — that's what a Model-B renewal cron needs. This adds it.

   ⚠️ You only need this if you move OFF payment_plan auto-billing (Model A).
   In Model A, Flutterwave charges the card itself and the webhook's renewal
   branch extends the period — no tokenized charge required. See README.

   Uses your existing env var name: FLW_SECRET_KEY.
   ============================================================ */

import axios from "axios";

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY!;
const FLW_BASE = "https://api.flutterwave.com/v3";

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
    const e = err as { response?: { data?: unknown }; message?: string };
    return {
      ok: false,
      status: "failed",
      txRef: args.txRef,
      raw: e.response?.data ?? e.message ?? "charge error",
    };
  }
}
