// backend/payment-service/src/services/commissionSplit.service.ts
// ============================================================
// THE money-splitting truth for a rent payment. Runs ONCE per payment when
// escrow releases (renter confirmed, or the 24h window lapsed).
//
//   platform commission = the PROPERTY's plan rate (Premium 15%, else 20%)
//   listing agent       = 50% of the commission (PAYMENTS.agentShareOfCommission)
//   sub-agent           = 50% of the agent share, only when the payment carries
//                         subAgentId (pinned from a PROMO ShareLink at checkout)
//   owner               = rent − commission
//   Newcondo            = commission − agent pool
//
// MONEY CORE: all maths in integer kobo. The split is ONE ledger transaction
// out of escrow:rent, inside the same DB transaction that flips the payment
// to RELEASED — so the wallets, the history rows and the escrow balance can
// never disagree. Shares are floored; the remainder stays with Newcondo.
// The per-party Payment rows are kept: they are what history, receipts and
// statements display. Balances come from the ledger.
//
// After commit: notifications + branded emails to each party (keyed off the
// SAME ids the money went to — no cross-wiring), then the referral engine's
// rent_commission_distributed event (renter referrals, founding-agent override).
// Idempotent via Payment.commissionSettledAt AND the ledger key.
// ============================================================
import axios from "axios";
import { prisma } from "@newcondo/db";
import type { PaymentType } from "@newcondo/db";
import {
  PAYMENTS, publishNotification, sendBrandedEmail, EmailTemplates, flutterwaveConfig,
  ACC, postLedger, toKobo, toNaira, mulRate, floorTo, Referrals, badGateway, conflict, notFound,
  refundBreakdown,
} from "@newcondo/backend-shared";
import { commissionRateForProperty } from "./propertyPlan.service";

const ngn = (n: number) => `₦${Math.abs(n).toLocaleString("en-NG")}`;

export async function releaseEscrowAndSplit(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      rental: {
        include: {
          property: {
            select: {
              id: true, title: true, ownerId: true, agentId: true,
              owner: { select: { id: true, name: true, email: true } },
              agent: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });
  if (!payment || payment.status !== "HELD" || payment.commissionSettledAt || !payment.rental) return null;

  const property = payment.rental.property;
  const owner = property.owner;
  const agent = property.agent;
  // A sub-agent link only counts when there IS a listing agent to share with,
  // and never when the "sub-agent" is the listing agent themself.
  const subAgentId = agent && payment.subAgentId && payment.subAgentId !== agent.id ? payment.subAgentId : null;

  const rate = await commissionRateForProperty(property.id);
  const rentKobo = toKobo(payment.ownerAmount ?? payment.amount);
  const commission = floorTo(mulRate(rentKobo, rate), 1n);
  const agentPool = agent ? floorTo(mulRate(commission, PAYMENTS.agentShareOfCommission), 100n) : 0n;
  const subAgentCut = subAgentId ? floorTo(mulRate(agentPool, PAYMENTS.subAgentSplitOfAgentShare), 100n) : 0n;
  const listingAgentCut = agentPool - subAgentCut;
  const ownerNet = rentKobo - commission;
  const platformCut = commission - agentPool;

  const subAgent = subAgentId
    ? await prisma.user.findUnique({ where: { id: subAgentId }, select: { id: true, name: true, email: true } })
    : null;

  const settled = await prisma.$transaction(async (tx) => {
    // Conditional claim — two release paths (renter confirm + cron) racing
    // for the same payment: exactly one wins.
    const { count } = await tx.payment.updateMany({
      where: { id: paymentId, status: "HELD", commissionSettledAt: null },
      data: { status: "RELEASED", isReleased: true, releasedAt: new Date(), commissionSettledAt: new Date(), agentCommission: toNaira(agentPool), platformFee: payment.platformFee },
    });
    if (!count) return false;

    await postLedger(tx, {
      idempotencyKey: `rent-release:${paymentId}`,
      type: "RENT_RELEASED",
      sourceType: "PAYMENT",
      sourceId: paymentId,
      paymentId,
      memo: `Escrow release — ${property.title}`,
      metadata: { rate, rentKobo: rentKobo.toString(), commissionKobo: commission.toString() },
      legs: [
        { account: ACC.rentEscrow, amountKobo: -rentKobo },
        { account: ACC.userAvailable(owner.id), amountKobo: ownerNet },
        ...(agent && listingAgentCut > 0n ? [{ account: ACC.userAvailable(agent.id), amountKobo: listingAgentCut }] : []),
        ...(subAgent && subAgentCut > 0n ? [{ account: ACC.userAvailable(subAgent.id), amountKobo: subAgentCut }] : []),
        ...(platformCut > 0n ? [{ account: ACC.revenue, amountKobo: platformCut }] : []),
      ],
    });

    const history = (userId: string, kobo: bigint, description: string, paymentType: PaymentType) =>
      tx.payment.create({
        data: {
          userId, amount: toNaira(kobo), ownerAmount: toNaira(kobo), paymentType, status: "RELEASED",
          description, rentalId: payment.rentalId,
          flutterwaveRef: `${payment.flutterwaveRef}-${paymentType}-${userId.slice(-6)}`,
          isReleased: true, releasedAt: new Date(),
        },
      });
    await history(owner.id, ownerNet, `Rent released — ${property.title}`, "RENT_RELEASE");
    if (agent && listingAgentCut > 0n) await history(agent.id, listingAgentCut, `Listing commission — ${property.title}`, "AGENT_COMMISSION");
    if (subAgent && subAgentCut > 0n) await history(subAgent.id, subAgentCut, `Sub-agent commission — ${property.title}`, "AGENT_COMMISSION");
    if (platformCut > 0n) await tx.platformRevenue.create({ data: { paymentId, amount: toNaira(platformCut), source: "RENT_COMMISSION" } });
    await tx.rental.update({ where: { id: payment.rentalId! }, data: { status: "ACTIVE", isConfirmed: true, confirmedAt: new Date() } });
    return true;
  });
  if (!settled) return null;

  const tasks: Promise<unknown>[] = [
    publishNotification({
      userId: owner.id, kind: "wallet", title: "Rent released to your wallet",
      body: `${ngn(toNaira(ownerNet))} from ${property.title} is now available.`,
      to: "/wallet", entityType: "payment", entityId: paymentId,
    }),
    sendBrandedEmail(owner.email, EmailTemplates.escrowReleased({ ownerName: owner.name ?? "there", amount: toNaira(ownerNet), property: property.title })),
  ];
  if (agent && listingAgentCut > 0n) {
    tasks.push(
      publishNotification({ userId: agent.id, kind: "wallet", title: "Listing commission credited", body: `${ngn(toNaira(listingAgentCut))} — ${property.title}`, to: "/payments", entityType: "payment", entityId: paymentId }),
      sendBrandedEmail(agent.email, EmailTemplates.commissionReceived({ agentName: agent.name ?? "there", amount: toNaira(listingAgentCut), property: property.title, kind: "LISTING" }))
    );
  }
  if (subAgent && subAgentCut > 0n) {
    tasks.push(
      publishNotification({ userId: subAgent.id, kind: "wallet", title: "Sub-agent commission credited", body: `${ngn(toNaira(subAgentCut))} — ${property.title} (via your promo link)`, to: "/payments", entityType: "payment", entityId: paymentId }),
      sendBrandedEmail(subAgent.email, EmailTemplates.commissionReceived({ agentName: subAgent.name ?? "there", amount: toNaira(subAgentCut), property: property.title, kind: "SUB_AGENT" }))
    );
  }
  await Promise.allSettled(tasks);

  // Referral engine — renter referrals + Founding Agent Override. The margin
  // is Newcondo's NET share, i.e. what platform:revenue just received.
  Referrals.emitReferralEvent({
    type: "rent_commission_distributed",
    sourceType: "RENT_COMMISSION",
    sourceId: paymentId,
    occurredAt: new Date().toISOString(),
    subjectUserId: payment.userId,
    subjectOwnerId: owner.id,
    breakdown: {
      grossCommissionKobo: Number(commission),
      listingAgentShareKobo: Number(listingAgentCut),
      subAgentShareKobo: Number(subAgentCut),
      newcondoNetKobo: Number(platformCut),
    },
  });

  return { ownerNet: toNaira(ownerNet), listingAgentCut: toNaira(listingAgentCut), subAgentCut: toNaira(subAgentCut), platformCut: toNaira(platformCut), rate };
}

/** Cron entry: release every HELD payment whose window lapsed. */
export async function releaseExpiredEscrows(): Promise<number> {
  const due = await prisma.payment.findMany({
    where: { status: "HELD", paymentType: "RENT", confirmationPeriodEnd: { lt: new Date() }, commissionSettledAt: null, dispute: { is: null } },
    select: { id: true },
  });
  for (const p of due) {
    await releaseEscrowAndSplit(p.id).catch((e) => console.error("escrow release failed", p.id, e));
  }
  return due.length;
}

/** Refund a rent payment still in escrow (renter disputed inside the window
 *  and the dispute was upheld). The rent goes back through Flutterwave; the
 *  renter service fee is NOT refunded, nor is the processing fee —
 *  Flutterwave does not return its transaction fee on a refund.
 *
 *  ++ REFUND COST — the refund itself costs Newcondo again, so the renter
 *  bears it (constants/fees.ts refundBreakdown, /refund §03):
 *    refund = rent − reversal fee (Flutterwave's transaction cost on the
 *             rent, rounded up) − transfer fee (₦11/₦27/₦54, rounded up)
 *  This is the ONLY refund Newcondo makes: rent, still in escrow, after a
 *  valid dispute inside the confirmation window. Every other fee is final. */
export async function refundHeldRent(paymentId: string, reason: string, by = "admin") {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, status: true, amount: true, ownerAmount: true, transactionId: true, flutterwaveRef: true, rentalId: true, userId: true, description: true,
      rental: { select: { unitId: true, propertyId: true } } },
  });
  if (!payment) throw notFound("Payment not found");
  if (payment.status !== "HELD") throw conflict("Only a payment still in escrow can be refunded here");
  const rentKobo = toKobo(payment.ownerAmount ?? payment.amount);
  const refund = refundBreakdown(toNaira(rentKobo));
  const refundKobo = toKobo(refund.refundNaira);
  const costKobo = rentKobo - refundKobo;

  // Ask Flutterwave first; book it only once they accept.
  try {
    const base = flutterwaveConfig.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";
    const id = payment.transactionId;
    if (!id) throw new Error("No Flutterwave transaction id on this payment");
    const res = await axios.post(`${base}/transactions/${id}/refund`, { amount: refund.refundNaira, comments: reason }, {
      headers: { Authorization: `Bearer ${flutterwaveConfig.FLUTTERWAVE_SECRET_KEY}` }, timeout: 20_000,
    });
    if (res.data?.status !== "success") throw new Error(res.data?.message ?? "Refund rejected");
  } catch (e) {
    throw badGateway(`Refund could not be started: ${(e as Error).message}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: paymentId }, data: { status: "REFUNDED", failureReason: `${reason} · refunded ₦${refund.refundNaira.toLocaleString("en-NG")} (rent ₦${refund.rentNaira.toLocaleString("en-NG")} − refund cost ₦${refund.refundCostNaira.toLocaleString("en-NG")})` } });
    await postLedger(tx, {
      idempotencyKey: `rent-refund:${paymentId}`,
      type: "RENT_REFUNDED",
      sourceType: "PAYMENT",
      sourceId: paymentId,
      paymentId,
      createdBy: by,
      memo: `Refund — ${reason}`,
      metadata: { rentNaira: refund.rentNaira, reversalFeeNaira: refund.reversalFeeNaira, transferFeeNaira: refund.transferFeeNaira, refundNaira: refund.refundNaira },
      // Rent leaves escrow: the refund goes back out through Flutterwave; the
      // refund cost the renter bore pays Flutterwave's refund charges
      // (platform:processing absorbs any difference from the real figure).
      legs: [
        { account: ACC.rentEscrow, amountKobo: -rentKobo },
        { account: ACC.world, amountKobo: refundKobo },
        ...(costKobo > 0n ? [{ account: ACC.processing, amountKobo: costKobo }] : []),
      ],
    });
    if (payment.rentalId) await tx.rental.update({ where: { id: payment.rentalId }, data: { status: "TERMINATED" } });
    if (payment.rental?.unitId) await tx.propertyUnit.update({ where: { id: payment.rental.unitId }, data: { status: "AVAILABLE", isAvailable: true } });
    else if (payment.rental) await tx.property.update({ where: { id: payment.rental.propertyId }, data: { isAvailable: true } });
  });
  // I5 — any referral reward created from this payment is reversed.
  await Referrals.voidBySource("RENT_COMMISSION", paymentId, `rent refunded: ${reason}`);
  await publishNotification({
    userId: payment.userId, kind: "payment", title: "Refund on its way",
    body: `${ngn(refund.refundNaira)} is on its way back: your rent of ${ngn(refund.rentNaira)} less ${ngn(refund.refundCostNaira)} that Flutterwave charges to reverse and send it. The service fee and payment-processing fee are non-refundable.`,
    to: "/payments", entityType: "payment", entityId: paymentId,
  });
}
