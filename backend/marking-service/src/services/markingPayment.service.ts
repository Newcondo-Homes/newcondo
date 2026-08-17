// backend/marking-service/src/services/markingPayment.service.ts
// ============================================================
// Paid marking methods (BROADCAST ₦20,000 · NEWCONDO ₦25,000) are paid via
// Flutterwave BEFORE the job goes live:
//   1. initiateMarkingPayment() — PENDING Payment (MARKING_FEE) + the FLW
//      inline payload (the shape useFlutterwaveInline expects).
//   2. Webhook: charge with NC-MKFEE-* verifies → confirmMarkingFeePaid()
//      → createMarkingJob() broadcasts to nearby agents.
// SELF / KNOWN_PERSON never come through here (they're free).
//
// >>> OWNERSHIP GATE <<<
// assertOwnershipProof(propertyId, "MARK") runs as the FIRST statement of
// initiateMarkingPayment — i.e. BEFORE the Payment row is created and long
// before a card is charged. Placing it here rather than in
// confirmMarkingFeePaid is deliberate: gating after the webhook would mean
// taking ₦25,000 and then refusing to create the job, which is the worst
// possible outcome for the user and a refund we'd have to chase.
//
// BUILD NOTES:
//  • Explicit return types — Prisma 7 payload types aren't nameable across
//    package boundaries (TS2742).
//  • flutterwaveConfig keys are FLUTTERWAVE_PUBLIC_KEY / _SECRET_KEY.
//  • AppError in shared/types is an interface — use the ServiceError helpers.
// ============================================================
import { randomBytes } from "crypto";
import { prisma } from "@newcondo/db";
import { badRequest, notFound, flutterwaveConfig, MARKING, publishNotification } from "@newcondo/backend-shared";
import { assertOwnershipProof } from "@newcondo/property-service";
import { createMarkingJob, type MarkingMethod } from "./markingJobService";

type PaidMethod = "BROADCAST" | "NEWCONDO";

/* NOTE: the marking-fee reference prefix stays NC-MKFEE-* so the Flutterwave
   webhook can route it to confirmMarkingFeePaid(). */
export interface MarkingCheckout {
  paymentId: string;
  checkout: {
    public_key: string;
    tx_ref: string;
    amount: number;
    currency: string;
    customer: { email: string };
    customizations: { title: string; description: string };
  };
}

export async function initiateMarkingPayment(opts: {
  propertyId: string;
  requesterId: string;
  requesterEmail: string;
  method: PaidMethod;
  contactName: string;
  contactPhone: string;
  accessNotes?: string;
}): Promise<MarkingCheckout> {
  // GATE FIRST — before any Payment row exists and before any money moves.
  // Throws a 403 whose message the dashboard renders verbatim.
  await assertOwnershipProof(opts.propertyId, "MARK");

  const fee = MARKING.fees[opts.method];
  if (!fee) throw badRequest("This marking method does not require payment");

  const property = await prisma.property.findUnique({ where: { id: opts.propertyId }, select: { title: true } });
  if (!property) throw notFound("Property not found");

  const reference = `NC-MKFEE-${Date.now()}-${randomBytes(4).toString("hex")}`;
  const description = `Marking service — ${property.title}`;
  const payment = await prisma.payment.create({
    data: {
      userId: opts.requesterId,
      // PaymentType enum member for marking fees is PROPERTY_MARKING
      paymentType: "PROPERTY_MARKING",
      status: "PENDING",
      amount: fee,
      flutterwaveRef: reference,
      description,
      // Job params ride along so the webhook can create the job verbatim.
      meta: {
        propertyId: opts.propertyId,
        method: opts.method,
        contactName: opts.contactName,
        contactPhone: opts.contactPhone,
        accessNotes: opts.accessNotes ?? null,
      } as never,
    },
    select: { id: true },
  });

  return {
    paymentId: payment.id,
    checkout: {
      public_key: flutterwaveConfig.FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: reference,
      amount: fee,
      currency: "NGN",
      customer: { email: opts.requesterEmail },
      customizations: { title: "Newcondo", description },
    },
  };
}

/** Webhook-driven (NC-MKFEE-*): fee verified → the job goes live. Idempotent.
 *
 *  NO GATE HERE ON PURPOSE. The document was already verified at
 *  initiateMarkingPayment, the card has now been charged, and re-checking
 *  would let a document deleted mid-checkout strand a paid job. Money has
 *  moved; the job must be created. */
export async function confirmMarkingFeePaid(
  flutterwaveRef: string
): Promise<{ jobId: string; status: string } | null> {
  const payment = await prisma.payment.findUnique({
    where: { flutterwaveRef },
    select: { id: true, status: true, userId: true, meta: true },
  });
  if (!payment || payment.status !== "PENDING") return null; // idempotent — webhooks retry

  await prisma.payment.update({
    where: { flutterwaveRef },
    data: { status: "SUCCESS", paidAt: new Date() },
  });

  const m = (payment.meta ?? {}) as {
    propertyId?: string; method?: PaidMethod;
    contactName?: string; contactPhone?: string; accessNotes?: string | null;
  };
  if (!m.propertyId || !m.method) return null;

  const job = await createMarkingJob({
    propertyId: m.propertyId,
    requesterId: payment.userId,
    method: m.method as MarkingMethod,
    contactName: m.contactName,
    contactPhone: m.contactPhone,
    accessNotes: m.accessNotes ?? undefined,
    feePaid: true,
  });

  await publishNotification({
    userId: payment.userId,
    kind: "marking",
    title: "Marking job is live",
    body: m.method === "BROADCAST"
      ? "Broadcasting to verified agents near the property — most jobs are picked up within hours."
      : "A Newcondo agent will be assigned within 24 hours.",
    to: "/marking",
    entityType: "markingJob",
    entityId: job.id,
  });
  return { jobId: job.id, status: job.status };
}
