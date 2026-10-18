// backend/payment-service/src/webhooks/flutterwave.webhook.ts
// ============================================================
// POST /api/v1/payments/webhooks/flutterwave  (and /api/v1/webhooks/flutterwave)
//
// THE single entry point for money arriving or leaving through Flutterwave.
//
//   verif-hash   timing-safe compare → forgeries get 401
//   verify       every charge/transfer is re-fetched from Flutterwave; the
//                body is never trusted for amounts or status
//   route        charge.completed  → by tx_ref prefix (chargeHandlers.ts)
//                                    or, for a bank transfer into the central
//                                    account, record → match by narration ref
//                transfer.completed → withdrawals (NC-WD-) / vendors (NC-VP-)
//   idempotent   every handler is; Flutterwave retries
//   status       200 when handled or irrelevant (stop retrying);
//                500 only on transient errors we WANT retried
//
// BUG THIS FIXES: the previous handler only understood subscriptions. Rent
// (NC-RENT-), marking fees (NC-MKFEE-) and withdrawals (NC-WD-) were never
// routed, so paid rent never reached escrow, paid marking jobs never went
// live and withdrawals stayed PENDING forever.
// ============================================================
import type { Request, Response } from "express";
import { timingSafeEqual } from "crypto";
import axios from "axios";
import { flutterwaveConfig, parseInboundCredit, recordInboundTransfer, settledFromFlutterwave, FLW_FEES } from "@newcondo/backend-shared";
import { verifyFlutterwaveTransaction } from "../services";
import { confirmRentPaid } from "../services/rentCheckout.service";
import { activatePropertyPlan } from "../services/propertyPlan.service";
import { settleWithdrawal } from "../services/wallet.service";
import { settleVendorPayout } from "../services/vendorPayout.service";
import { handleSubscriptionCharge } from "./subscriptionCharge";
import { registerChargeHandler, handlerFor, type VerifiedPayment } from "./chargeHandlers";

/* ---- built-in handlers ---- */
registerChargeHandler("NC-SUB-", handleSubscriptionCharge);
registerChargeHandler("NC-RENT-", (ref, p) =>
  confirmRentPaid(ref, { amountNaira: p.amountNaira, settledNaira: p.settledNaira, via: p.via, inboundTransferId: p.inboundTransferId, transactionId: p.transactionId ?? undefined }));
registerChargeHandler("NC-PSUB-", (ref, p) =>
  activatePropertyPlan(ref, { transactionId: p.transactionId, amountNaira: p.amountNaira, settledNaira: p.settledNaira, via: p.via, cardToken: p.cardToken }));
registerChargeHandler("NC-RENEW-", async () => "settled-by-renewal-cron");

/** Which intents may be paid by plain bank transfer. Subscriptions and
 *  property plans are card-only: recurring billing needs the card token. */
const TRANSFER_PAYABLE = ["NC-RENT-", "NC-MKFEE-"];

function signatureOk(header: unknown): boolean {
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  if (!secret || typeof header !== "string") return false;
  const a = Buffer.from(header), b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function verifyTransfer(id: string | number): Promise<{ reference: string; status: string; feeNaira: number | null } | null> {
  const base = flutterwaveConfig.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";
  const res = await axios.get(`${base}/transfers/${id}`, { headers: { Authorization: `Bearer ${flutterwaveConfig.FLUTTERWAVE_SECRET_KEY}` }, timeout: 15_000 });
  const d = res.data?.data;
  // `fee` is Flutterwave's transfer fee incl. VAT (e.g. 10.75) — reconciled
  // against the fee the user had deducted (constants/fees.ts payoutBreakdown).
  const fee = d?.fee != null ? Number(String(d.fee).replace(/,/g, "")) : null;
  return d ? { reference: String(d.reference), status: String(d.status).toUpperCase(), feeNaira: Number.isFinite(fee) ? fee : null } : null;
}

async function handleTransfer(body: Record<string, any>): Promise<string> {
  const t = await verifyTransfer(body.id);
  if (!t) return "transfer-not-found";
  if (t.status !== "SUCCESSFUL" && t.status !== "FAILED") return `transfer-${t.status}`; // NEW / PENDING — wait for the final event
  const ok = t.status === "SUCCESSFUL";
  if (t.reference.startsWith("NC-WD-")) { await settleWithdrawal(t.reference, ok, t.feeNaira); return "withdrawal-settled"; }
  if (t.reference.startsWith("NC-VP-")) { await settleVendorPayout(t.reference, ok, t.feeNaira); return "vendor-payout-settled"; }
  return "transfer-ignored";
}

async function handleCharge(body: Record<string, any>): Promise<string> {
  if (!body?.id) return "no-transaction-id";
  const tx = await verifyFlutterwaveTransaction(String(body.id));
  if (tx?.status !== "successful") return `not-successful-${tx?.status}`;
  if ((tx.currency ?? "NGN") !== "NGN") return "non-ngn-ignored";

  const txRef = String(tx.tx_ref ?? "");
  // Our gross-up IS the fee pass-through. If Flutterwave's dashboard is still
  // set to "customer pays fees", it adds its fee on top → user charged twice.
  if (FLW_FEES.passToUsers && tx.charged_amount != null && Number(tx.charged_amount) > Number(tx.amount) + 1) {
    console.warn(`[webhook] ⚠️ ${txRef}: charged_amount ₦${tx.charged_amount} > amount ₦${tx.amount}. Flutterwave is ALSO passing fees to the customer — set Fee settings → "Charge me" in the Flutterwave dashboard.`);
  }
  const settled = settledFromFlutterwave(tx);
  const paid: VerifiedPayment = {
    amountNaira: Number(tx.amount),
    settledNaira: settled != null ? Number(settled) / 100 : null,
    currency: tx.currency ?? "NGN",
    via: "CHECKOUT",
    transactionId: String(tx.id),
    cardToken: tx.card?.token ?? undefined,
    raw: tx,
  };

  const own = handlerFor(txRef);
  if (own) { await own(txRef, paid); return `handled-${txRef.split("-").slice(0, 2).join("-")}`; }

  // Not one of our checkouts. A bank transfer into the central account (or a
  // user's VA) → book the cash, then try to match it by narration reference.
  const credit = parseInboundCredit(tx);
  if (credit) {
    const rec = await recordInboundTransfer(credit);
    if (rec.duplicate) return "inbound-duplicate";
    const ref = rec.reference;
    if (ref && TRANSFER_PAYABLE.some((p) => ref.startsWith(p))) {
      const h = handlerFor(ref);
      if (h) {
        await h(ref, { ...paid, via: "TRANSFER", amountNaira: Number(rec.amountKobo) / 100, settledNaira: null, inboundTransferId: rec.transferId });
        return "inbound-matched";
      }
    }
    console.warn(`[webhook] inbound transfer ${rec.transferId} unmatched (ref ${ref ?? "none"}) — in suspense for admin review`);
    return "inbound-suspense";
  }

  // Legacy: Flutterwave-minted refs from payment-plan subscriptions.
  return handleSubscriptionCharge(txRef, paid);
}

export async function flutterwaveWebhook(req: Request, res: Response): Promise<void> {
  if (!signatureOk(req.headers["verif-hash"])) {
    console.warn("⚠️ Flutterwave webhook: bad verif-hash — blocked");
    res.status(401).json({ error: "Unauthorized signature" });
    return;
  }
  const event = String(req.body?.event ?? req.body?.["event.type"] ?? "");
  const body = (req.body?.data ?? req.body) as Record<string, any>;
  try {
    let outcome = "ignored";
    if (event === "transfer.completed" || event.toUpperCase().includes("TRANSFER")) outcome = await handleTransfer(body);
    else if (event === "charge.completed" || event.toUpperCase().includes("TRANSACTION")) outcome = await handleCharge(body);
    console.log(`📡 Flutterwave ${event} → ${outcome}`);
    res.status(200).json({ received: true, outcome });
  } catch (error) {
    console.error(`❌ Flutterwave webhook ${event} failed:`, error);
    // 500 → Flutterwave retries later; every handler is idempotent.
    res.status(500).json({ error: "Internal processing error" });
  }
}
