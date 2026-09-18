// backend/payment-service/src/services/commissionSplit.service.ts
// ============================================================
// THE money-splitting truth for a rent payment. Runs ONCE per payment when
// escrow releases (renter confirmed, or the 24h window lapsed).
//
// Rates come from the shared plan constant — never re-derived here:
//   platform commission = the owner's PLAN rate (20% Essential/Plus, 15% Premium)
//   listing agent       = 50% of the commission
//   sub-agent           = 50% of the agent share, only when the payment
//                         carries subAgentId (set from a PROMO ShareLink)
//   owner               = rent − commission
//   Newcondo            = commission − agent pool  → PlatformRevenue
//
// Each party gets its own ledger row + SSE notification + branded email, all
// keyed off the SAME record the money went to — no cross-wiring possible.
// Idempotent via Payment.commissionSettledAt.
//
// ── WHY THE RATE LOOKUP CHANGED ────────────────────────────────────────────
// This file used to read:
//
//   const isElite = owner.subscription?.planType === "OWNER_ELITE"
//                || owner.subscription?.planType === "OWNER_ELITE_ANNUAL";
//   const rate = isElite ? PAYMENTS.eliteCommissionRate : PAYMENTS.platformCommissionRate;
//
// Owner tiers became Essential / Plus / Premium, so those two members no
// longer exist and TypeScript rejected the comparison (TS2367). That error was
// the lucky outcome: the same pattern written against a plan code that DOES
// still exist compiles fine and silently bills the wrong rate. A boolean also
// can't express three tiers — the moment Plus needed its own rate, an
// isElite-shaped check would have to be rewritten anyway.
//
// commissionRateFor(planType) is the single source of truth: it reads the rate
// off the same SUBSCRIPTION_PLANS entry the customer was charged from, so the
// split always matches the plan they actually bought. Never pattern-match on a
// plan NAME here again — add the rate to the plan spec instead.
//
// SCHEMA NOTES (previous compile failures):
//  • The owner's plan is on Subscription.planType, not User.plan.
//  • paymentType must be a PaymentType enum member (typed below).
//  • $transaction uses the callback form for heterogeneous writes.
// ============================================================
import { prisma, SubscriptionPlan, SubscriptionStatus } from "@newcondo/db";
import {
  PAYMENTS,
  commissionRateFor,
  publishNotification,
  sendBrandedEmail,
  EmailTemplates,
} from "@newcondo/backend-shared";
import type { PaymentType } from "@newcondo/db";

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
              owner: {
                select: {
                  id: true, name: true, email: true,
                  // status matters as much as planType: an EXPIRED plan must
                  // not keep granting the reduced Premium rate.
                  subscription: { select: { planType: true, status: true } },
                },
              },
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
  const subAgentId = payment.subAgentId;

  const rent = Number(payment.ownerAmount ?? payment.amount);

  // The owner's plan rate. An owner with no subscription, or one that has
  // lapsed, pays the standard rate — the discount is a benefit of an active
  // plan, and letting an EXPIRED Premium keep 15% would mean unpaid accounts
  // get the best terms on the platform.
  const sub = owner.subscription;
  const planIsLive =
    sub?.status === SubscriptionStatus.ACTIVE || sub?.status === SubscriptionStatus.FREE_ACTIVE;
  const rate = planIsLive
    ? commissionRateFor(sub!.planType)
    : commissionRateFor(SubscriptionPlan.OWNER_ESSENTIAL);

  // Round ONCE, here, and derive the owner's share by SUBTRACTION. Computing
  // ownerNet as rent * (1 - rate) independently leaves the two figures a kobo
  // apart on most amounts, and the ledger then never reconciles. Same reason
  // platformCut is commission - agentPool rather than its own multiplication.
  const commission = Math.round(rent * rate);
  const agentPool = agent ? Math.round(commission * PAYMENTS.agentShareOfCommission) : 0;
  const subAgentCut = subAgentId ? Math.round(agentPool * PAYMENTS.subAgentSplitOfAgentShare) : 0;
  const listingAgentCut = agentPool - subAgentCut;
  const ownerNet = rent - commission;
  const platformCut = commission - agentPool;

  const subAgent = subAgentId
    ? await prisma.user.findUnique({ where: { id: subAgentId }, select: { id: true, name: true, email: true } })
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "RELEASED", isReleased: true, releasedAt: new Date(), commissionSettledAt: new Date() },
    });

    const credit = (userId: string, amount: number, description: string, paymentType: PaymentType) =>
      tx.payment.create({
        data: {
          userId, amount, ownerAmount: amount, paymentType, status: "RELEASED",
          description, rentalId: payment.rentalId,
          flutterwaveRef: `${payment.flutterwaveRef}-${paymentType}-${userId.slice(-4)}`,
          isReleased: true, releasedAt: new Date(),
        },
      });

    await credit(owner.id, ownerNet, `Rent released — ${property.title}`, "RENT_RELEASE");
    if (agent && listingAgentCut > 0) await credit(agent.id, listingAgentCut, `Listing commission — ${property.title}`, "AGENT_COMMISSION");
    if (subAgent && subAgentCut > 0) await credit(subAgent.id, subAgentCut, `Sub-agent commission — ${property.title}`, "AGENT_COMMISSION");

    if (platformCut > 0) {
      await tx.platformRevenue.create({ data: { paymentId, amount: platformCut, source: "RENT_COMMISSION" } });
    }
  });

  const tasks: Promise<unknown>[] = [
    publishNotification({
      userId: owner.id, kind: "wallet", title: "Rent released to your account",
      body: `${ngn(ownerNet)} from ${property.title} is now available.`,
      to: "/wallet", entityType: "payment", entityId: paymentId,
    }),
    sendBrandedEmail(owner.email, EmailTemplates.escrowReleased({
      ownerName: owner.name ?? "there", amount: ownerNet, property: property.title,
    })),
  ];
  if (agent && listingAgentCut > 0) {
    tasks.push(
      publishNotification({
        userId: agent.id, kind: "wallet", title: "Listing commission credited",
        body: `${ngn(listingAgentCut)} — ${property.title}`,
        to: "/payments", entityType: "payment", entityId: paymentId,
      }),
      sendBrandedEmail(agent.email, EmailTemplates.commissionReceived({
        agentName: agent.name ?? "there", amount: listingAgentCut, property: property.title, kind: "LISTING",
      }))
    );
  }
  if (subAgent && subAgentCut > 0) {
    tasks.push(
      publishNotification({
        userId: subAgent.id, kind: "wallet", title: "Sub-agent commission credited",
        body: `${ngn(subAgentCut)} — ${property.title} (via your promo link)`,
        to: "/payments", entityType: "payment", entityId: paymentId,
      }),
      sendBrandedEmail(subAgent.email, EmailTemplates.commissionReceived({
        agentName: subAgent.name ?? "there", amount: subAgentCut, property: property.title, kind: "SUB_AGENT",
      }))
    );
  }
  await Promise.all(tasks);

  return { ownerNet, listingAgentCut, subAgentCut, platformCut, rate };
}

/** Cron entry: release every HELD payment whose window lapsed. */
export async function releaseExpiredEscrows(): Promise<number> {
  const due = await prisma.payment.findMany({
    where: { status: "HELD", confirmationPeriodEnd: { lt: new Date() }, commissionSettledAt: null },
    select: { id: true },
  });
  for (const p of due) {
    await releaseEscrowAndSplit(p.id).catch((e) => console.error("escrow release failed", p.id, e));
  }
  return due.length;
}
