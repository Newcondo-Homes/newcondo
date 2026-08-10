// backend/marking-service/src/services/markingTokenizedCharge.service.ts
// ============================================================
// Marking fee via SAVED CARD (tokenized charge) — server-to-server.
//
// WHY: an owner/agent requesting marking is already authenticated AND already
// subscribed, so we hold their card token from the subscription charge
// (Subscription.flwCustomerToken, saved by activateSubscription()). Re-opening
// an Inline modal to re-enter a card they gave us minutes ago is friction, so
// we charge the token directly and show a result modal.
//
// FLOW
//   1. getSavedCardForMarking()   — does this user have a usable token?
//   2. chargeMarkingWithSavedCard() — PENDING Payment (NC-MKFEE-*) →
//      POST /v3/tokenized-charges → on success call confirmMarkingFeePaid()
//      immediately so the job goes live without waiting for the webhook.
//      The webhook still fires later and is a NO-OP (confirmMarkingFeePaid is
//      idempotent: it bails unless the Payment is still PENDING).
//   3. On failure the PENDING Payment is marked FAILED and we return a typed
//      reason so the UI can say "top up your account" vs "card declined".
//
// Inline stays as the FALLBACK (initiateMarkingPayment) for users with no
// token — renters, removed cards, or a declined tokenized charge.
// ============================================================
import { randomBytes } from "crypto";
import axios from "axios";
import { prisma } from "@newcondo/db";
import { badRequest, notFound, flutterwaveConfig, MARKING } from "@newcondo/backend-shared";
import { confirmMarkingFeePaid } from "./markingPayment.service";

type PaidMethod = "BROADCAST" | "NEWCONDO";

const FLW_BASE = "https://api.flutterwave.com/v3";

/** Typed failure reasons so the client can render the right modal copy. */
export type ChargeFailureCode =
  | "INSUFFICIENT_FUNDS"
  | "CARD_DECLINED"
  | "CARD_EXPIRED"
  | "NO_SAVED_CARD"
  | "NETWORK"
  | "UNKNOWN";

export interface SavedCardInfo {
  hasSavedCard: boolean;
  last4?: string;
  brand?: string;
  expiry?: string;
}

export interface MarkingChargeResult {
  ok: boolean;
  /** Present on success. */
  jobId?: string;
  reference: string;
  amount: number;
  /** Present on failure. */
  failureCode?: ChargeFailureCode;
  failureMessage?: string;
  /** True when the client should fall back to the Inline checkout. */
  retryWithInline?: boolean;
}

/* ------------------------------------------------------------------ */
/* 1. Does this user have a card we can charge?                        */
/* ------------------------------------------------------------------ */
export async function getSavedCardForMarking(userId: string): Promise<SavedCardInfo> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    // Requires the `subscription_card_metadata` migration (cardLast4 /
    // cardBrand / cardExpiry) — see SAVED_CARD_METADATA. Until it's applied
    // these columns don't exist and tsc will error here.
    select: { flwCustomerToken: true, cardLast4: true, cardBrand: true, cardExpiry: true },
  });
  if (!sub?.flwCustomerToken) return { hasSavedCard: false };
  return {
    hasSavedCard: true,
    // Written by activateSubscription()/the renewal branch from the
    // Flutterwave verify response (data.card). Null for subscribers who
    // haven't been charged since the migration — the UI then falls back to a
    // generic "Your saved card" label.
    last4: sub.cardLast4 ?? undefined,
    brand: sub.cardBrand ?? undefined,
    expiry: sub.cardExpiry ?? undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Map Flutterwave's processor response → our typed failure code.      */
/* Flutterwave surfaces the bank's reason in `processor_response`;      */
/* ISO-8583 code 51 is the canonical "insufficient funds".              */
/* ------------------------------------------------------------------ */
function classifyFailure(raw: unknown): { code: ChargeFailureCode; message: string } {
  const d = (raw ?? {}) as {
    data?: { processor_response?: string; status?: string };
    message?: string;
  };
  const text = `${d.data?.processor_response ?? ""} ${d.message ?? ""}`.toLowerCase();

  if (/insufficient|not sufficient|no sufficient|\b51\b|low balance/.test(text)) {
    return {
      code: "INSUFFICIENT_FUNDS",
      message: "Your bank declined the charge because the account balance is too low.",
    };
  }
  if (/expired/.test(text)) {
    return { code: "CARD_EXPIRED", message: "Your saved card has expired." };
  }
  if (/declin|do not honou?r|restricted|invalid|blocked|stolen|lost/.test(text)) {
    return { code: "CARD_DECLINED", message: "Your bank declined this card." };
  }
  return {
    code: "UNKNOWN",
    message: d.data?.processor_response ?? d.message ?? "The charge could not be completed.",
  };
}

/* ------------------------------------------------------------------ */
/* 2. Charge the saved card for a marking fee.                         */
/* ------------------------------------------------------------------ */
export async function chargeMarkingWithSavedCard(opts: {
  propertyId: string;
  requesterId: string;
  requesterEmail: string;
  method: PaidMethod;
  contactName: string;
  contactPhone: string;
  accessNotes?: string;
}): Promise<MarkingChargeResult> {
  const fee = MARKING.fees[opts.method];
  if (!fee) throw badRequest("This marking method does not require payment");

  const property = await prisma.property.findUnique({
    where: { id: opts.propertyId },
    select: { title: true },
  });
  if (!property) throw notFound("Property not found");

  const sub = await prisma.subscription.findUnique({
    where: { userId: opts.requesterId },
    select: { flwCustomerToken: true },
  });
  if (!sub?.flwCustomerToken) {
    return {
      ok: false,
      reference: "",
      amount: fee,
      failureCode: "NO_SAVED_CARD",
      failureMessage: "No saved card on file.",
      retryWithInline: true,
    };
  }

  // Same NC-MKFEE-* prefix as the Inline path, so the webhook routes it to
  // confirmMarkingFeePaid() identically.
  const reference = `NC-MKFEE-${Date.now()}-${randomBytes(4).toString("hex")}`;
  const description = `Marking service — ${property.title}`;

  await prisma.payment.create({
    data: {
      userId: opts.requesterId,
      paymentType: "PROPERTY_MARKING",
      status: "PENDING",
      amount: fee,
      flutterwaveRef: reference,
      description,
      meta: {
        propertyId: opts.propertyId,
        method: opts.method,
        contactName: opts.contactName,
        contactPhone: opts.contactPhone,
        accessNotes: opts.accessNotes ?? null,
        chargeMode: "SAVED_CARD",
      } as never,
    },
  });

  let raw: unknown;
  let succeeded = false;
  try {
    const { data } = await axios.post(
      `${FLW_BASE}/tokenized-charges`,
      {
        token: sub.flwCustomerToken,
        email: opts.requesterEmail,
        amount: fee,
        currency: "NGN",
        tx_ref: reference,
        narration: description,
        meta: { propertyId: opts.propertyId, method: opts.method, kind: "MARKING_FEE" },
      },
      { headers: { Authorization: `Bearer ${flutterwaveConfig.FLUTTERWAVE_SECRET_KEY}` } }
    );
    raw = data;
    succeeded = data?.status === "success" && data?.data?.status === "successful";
  } catch (err: unknown) {
    const e = err as { response?: { data?: unknown }; message?: string };
    raw = e.response?.data ?? { message: e.message ?? "network error" };
  }

  if (!succeeded) {
    const { code, message } = classifyFailure(raw);
    await prisma.payment.update({
      where: { flutterwaveRef: reference },
      data: { status: "FAILED", failureReason: message },
    });
    return {
      ok: false,
      reference,
      amount: fee,
      failureCode: code,
      failureMessage: message,
      // A declined/expired card is worth retrying with a DIFFERENT card via
      // Inline. Insufficient funds is not — the same card needs topping up.
      retryWithInline: code === "CARD_DECLINED" || code === "CARD_EXPIRED",
    };
  }

  // Success — go live now rather than waiting on the webhook. Idempotent, so
  // the webhook's later call is a harmless no-op.
  const confirmed = await confirmMarkingFeePaid(reference);
  return { ok: true, reference, amount: fee, jobId: confirmed?.jobId };
}
