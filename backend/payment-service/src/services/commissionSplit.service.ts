// backend/payment-service/src/services/commissionSplit.service.ts
// ============================================================
// THE money-splitting truth for a rent payment. Runs ONCE per payment when
// escrow releases (renter confirmed, or the 24h window lapsed).
// Rates come from constants/business.ts — never re-derived here:
//   platform commission = 20% (15% when the owner is on an ELITE plan)
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
// SCHEMA NOTES (previous compile failures):
//  • The owner's plan is on Subscription.planType, not User.plan.
//  • paymentType must be a PaymentType enum member (typed below).
//  • $transaction uses the callback form for heterogeneous writes.
// ============================================================
import { prisma } from "@newcondo/db";
import { PAYMENTS, publishNotification, sendBrandedEmail, EmailTemplates } from "@newcondo/backend-shared";
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
                  subscription: { select: { planType: true } }, // plan lives here
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
  const isElite = owner.subscription?.planType === "OWNER_ELITE" || owner.subscription?.planType === "OWNER_ELITE_ANNUAL";
  const rate = isElite ? PAYMENTS.eliteCommissionRate : PAYMENTS.platformCommissionRate;

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

  return { ownerNet, listingAgentCut, subAgentCut, platformCut };
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
