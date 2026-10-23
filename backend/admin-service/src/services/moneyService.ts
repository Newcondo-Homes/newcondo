// backend/admin-service/src/services/moneyService.ts
// Rent (escrow, splits, early release), the platform ledger, failed transfers,
// rent disputes, referrals and support tickets.
//
// MONEY RULES (mirrors payment-service — admin can't produce a split or refund
// the system itself wouldn't):
//   • Rent in escrow = Payment(RENT) status HELD. Release and split go through
//     releaseEscrowAndSplit() — plan-based commission rate, listing/sub-agent
//     share, referral events — never re-computed here.
//   • The ONLY refund is rent still in escrow, after a dispute raised inside the
//     window and upheld (refundHeldRent). There is no stand-alone refund button.
//   • Failed withdrawals are already reversed to the user's wallet by
//     wallet.service, and failed vendor batches are unlinked so the next run
//     re-pays them. A manual "retry" could pay twice — so there is none; staff
//     see them read-only with what happens next.
import type { Request } from "express";
import { prisma } from "@newcondo/db";
import type { Prisma } from "@newcondo/db";
import { ACC, Referrals, publishNotification, notFound, badRequest, conflict } from "@newcondo/backend-shared";
import { audit } from "../utils/audit";
import { hasScope } from "../middleware/requireStaff";
import { page, skipTake, type ListQuery } from "../utils/paginate";
import type { AdminDeps } from "../routes";
import type { RentRowDTO } from "../types";

const OPEN_DISPUTE = ["PENDING", "UNDER_REVIEW", "INVESTIGATING"] as const;
const kobo = (n: unknown) => BigInt(Math.round(Number(n ?? 0) * 100));

/* ---------------- rent ---------------- */
const RENT_FILTER: Record<string, Prisma.PaymentWhereInput> = {
  escrow: { status: "HELD", OR: [{ dispute: { is: null } }, { dispute: { status: { notIn: [...OPEN_DISPUTE] } } }] },
  disputed: { status: "HELD", dispute: { status: { in: [...OPEN_DISPUTE] } } },
  released: { status: "RELEASED" },
  refunded: { status: "REFUNDED" },
  failed: { status: { in: ["FAILED", "CANCELLED"] } },
};

async function splitsFor(paymentIds: string[]) {
  if (!paymentIds.length) return new Map<string, Map<string, bigint>>();
  const txs = await prisma.ledgerTransaction.findMany({ where: { type: "RENT_RELEASED", sourceType: "PAYMENT", sourceId: { in: paymentIds } }, select: { sourceId: true, entries: { select: { amountKobo: true, account: { select: { code: true } } } } } });
  return new Map(txs.map((t) => [t.sourceId, new Map(t.entries.map((e) => [e.account.code, e.amountKobo]))]));
}

export async function rent(q: ListQuery) {
  const where: Prisma.PaymentWhereInput = { paymentType: "RENT", ...(q.filter ? RENT_FILTER[q.filter] ?? {} : {}), ...(q.q ? { OR: [{ user: { name: { contains: q.q, mode: "insensitive" } } }, { flutterwaveRef: { contains: q.q } }, { rental: { property: { title: { contains: q.q, mode: "insensitive" } } } }] } : {}) };
  const [total, rows] = await Promise.all([prisma.payment.count({ where }), prisma.payment.findMany({ where, ...skipTake(q), orderBy: { createdAt: "desc" }, select: {
    id: true, flutterwaveRef: true, amount: true, ownerAmount: true, status: true, paidAt: true, confirmationPeriodEnd: true, subAgentId: true, userId: true,
    user: { select: { name: true } }, subAgent: { select: { name: true } }, dispute: { select: { id: true, status: true } },
    rental: { select: { unit: { select: { unitNumber: true } }, property: { select: { id: true, title: true, ownerId: true, agentId: true, owner: { select: { name: true } }, agent: { select: { name: true } } } } } },
  } })]);
  const splits = await splitsFor(rows.filter((p) => p.status === "RELEASED").map((p) => p.id));
  return page(rows.map((p): RentRowDTO => {
    const prop = p.rental?.property;
    const open = !!p.dispute && (OPEN_DISPUTE as readonly string[]).includes(p.dispute.status);
    const s = splits.get(p.id);
    const get = (code: string | null) => String(code && s ? s.get(code) ?? 0n : 0n);
    return {
      id: p.id, ref: p.flutterwaveRef ?? p.id, tenant: p.user.name ?? "—", tenantId: p.userId, property: prop?.title ?? "—", propertyId: prop?.id ?? null, unit: p.rental?.unit?.unitNumber ?? null,
      amountKobo: String(kobo(p.ownerAmount ?? p.amount)),
      status: p.status === "HELD" ? (open ? "DISPUTED" : "IN_ESCROW") : (p.status as RentRowDTO["status"]),
      paidAt: p.paidAt?.toISOString() ?? null, escrowEndsAt: p.confirmationPeriodEnd?.toISOString() ?? null, disputeId: p.dispute?.id ?? null,
      split: s && prop ? { ownerKobo: get(ACC.userAvailable(prop.ownerId)), listingAgentKobo: get(prop.agentId ? ACC.userAvailable(prop.agentId) : null), subAgentKobo: get(p.subAgentId && p.subAgentId !== prop.agentId ? ACC.userAvailable(p.subAgentId) : null), newcondoKobo: get(ACC.revenue) } : null,
      parties: { owner: prop?.owner.name ?? null, listingAgent: prop?.agent?.name ?? null, subAgent: p.subAgent?.name ?? null },
    };
  }), total, q);
}

/** Only when the renter confirmed in writing (support ticket / call) and the window hasn't lapsed yet. */
export async function releaseRent(req: Request, deps: AdminDeps, paymentId: string, reason: string) {
  const p = await prisma.payment.findUnique({ where: { id: paymentId }, select: { status: true, paymentType: true, commissionSettledAt: true, dispute: { select: { status: true } } } });
  if (!p || p.paymentType !== "RENT") throw notFound("Rent payment not found");
  if (p.status !== "HELD" || p.commissionSettledAt) throw conflict("This rent isn’t in escrow any more");
  if (p.dispute && (OPEN_DISPUTE as readonly string[]).includes(p.dispute.status)) throw badRequest("There’s an open dispute — resolve it on the Disputes page instead");
  const r = await deps.releaseEscrowAndSplit(paymentId);
  if (!r) throw conflict("Release was already processed by another path");
  await audit(prisma, req, { action: "RENT_RELEASED", targetType: "Payment", targetId: paymentId, description: `Released early — ${reason}`, metadata: r as Record<string, unknown> });
  return r;
}

/* ---------------- ledger ---------------- */
const LEDGER_TYPES = ["RENT_COLLECTED", "RENT_RELEASED", "RENT_REFUNDED", "SUBSCRIPTION_COLLECTED", "PROPERTY_PLAN_COLLECTED", "MARKING_FEE_COLLECTED", "MARKING_HOLD", "MARKING_RELEASED", "MARKING_REFUNDED", "VENDOR_PAYOUT", "WITHDRAWAL_INITIATED", "WITHDRAWAL_SETTLED", "WITHDRAWAL_REVERSED", "REFERRAL_OVERRIDE", "SERVICE_FUND_ACCRUED", "SERVICE_FUND_RETURNED", "ADJUSTMENT", "INBOUND_TRANSFER", "INBOUND_MATCHED"] as const;
const LEDGER_GROUP: Record<string, string[]> = {
  rent: ["RENT_COLLECTED", "RENT_RELEASED", "RENT_REFUNDED"], subscriptions: ["SUBSCRIPTION_COLLECTED", "PROPERTY_PLAN_COLLECTED"],
  marking: ["MARKING_FEE_COLLECTED", "MARKING_HOLD", "MARKING_RELEASED", "MARKING_REFUNDED"], vendors: ["VENDOR_PAYOUT", "SERVICE_FUND_ACCRUED", "SERVICE_FUND_RETURNED"],
  withdrawals: ["WITHDRAWAL_INITIATED", "WITHDRAWAL_SETTLED", "WITHDRAWAL_REVERSED"], referrals: ["REFERRAL_OVERRIDE"], adjustments: ["ADJUSTMENT"],
};
export async function ledger(q: ListQuery) {
  const types = q.filter && LEDGER_GROUP[q.filter] ? LEDGER_GROUP[q.filter] : q.filter && (LEDGER_TYPES as readonly string[]).includes(q.filter) ? [q.filter] : null;
  const where: Prisma.LedgerTransactionWhereInput = { ...(types ? { type: { in: types as never } } : {}), ...(q.q ? { OR: [{ memo: { contains: q.q, mode: "insensitive" } }, { sourceId: { contains: q.q } }, { idempotencyKey: { contains: q.q } }] } : {}) };
  const [total, rows] = await Promise.all([prisma.ledgerTransaction.count({ where }), prisma.ledgerTransaction.findMany({ where, ...skipTake(q), orderBy: { createdAt: "desc" }, select: { id: true, type: true, memo: true, sourceType: true, sourceId: true, createdAt: true, createdBy: true, entries: { select: { amountKobo: true, account: { select: { code: true, kind: true } } } } } })]);
  return page(rows.map((t) => ({
    id: t.id, type: t.type, memo: t.memo, source: `${t.sourceType}:${t.sourceId}`, createdAt: t.createdAt.toISOString(), createdBy: t.createdBy,
    amountKobo: String(t.entries.reduce((s, e) => s + (e.amountKobo > 0n ? e.amountKobo : 0n), 0n)),
    revenueKobo: String(t.entries.filter((e) => e.account.code === ACC.revenue).reduce((s, e) => s + e.amountKobo, 0n)),
    legs: t.entries.map((e) => ({ account: e.account.code.replace(/^user:([^:]{6})[^:]*:/, "user:$1…:"), kind: e.account.kind, amountKobo: String(e.amountKobo) })),
  })), total, q);
}

/** Read-only: failed withdrawals (already reversed) + failed vendor batches (re-queued automatically). */
export async function failedTransfers(q: ListQuery) {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [wd, vb] = await Promise.all([
    prisma.payment.findMany({ where: { paymentType: "WITHDRAWAL", status: "FAILED", createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, amount: true, failureReason: true, createdAt: true, flutterwaveRef: true, user: { select: { id: true, name: true } } } }),
    prisma.vendorPayoutBatch.findMany({ where: { status: "FAILED", createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, reference: true, amountKobo: true, jobCount: true, createdAt: true, vendor: { select: { id: true, name: true } } } }),
  ]);
  const rows = [
    ...wd.map((w) => ({ id: w.id, kind: "WITHDRAWAL", ref: w.flutterwaveRef ?? w.id, party: w.user.name, partyId: w.user.id, amountKobo: String(kobo(w.amount)), reason: w.failureReason, createdAt: w.createdAt.toISOString(), next: "Reversed to the user’s wallet — they can withdraw again." })),
    ...vb.map((b) => ({ id: b.id, kind: "VENDOR_BATCH", ref: b.reference, party: b.vendor.name, partyId: b.vendor.id, amountKobo: String(b.amountKobo), reason: `${b.jobCount} visit(s)`, createdAt: b.createdAt.toISOString(), next: "Visits were unlinked and are paid in the next batch run." })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const { skip, take } = skipTake(q);
  return page(rows.slice(skip, skip + take), rows.length, q);
}

/* ---------------- rent disputes ---------------- */
export async function disputes(q: ListQuery) {
  const where: Prisma.DisputeWhereInput = q.filter === "open" ? { status: { in: [...OPEN_DISPUTE] } } : q.filter === "closed" ? { status: { notIn: [...OPEN_DISPUTE] } } : {};
  const [total, rows] = await Promise.all([prisma.dispute.count({ where }), prisma.dispute.findMany({ where, ...skipTake(q), orderBy: { createdAt: "desc" }, select: {
    id: true, reason: true, description: true, preferredResolution: true, status: true, resolutionOutcome: true, resolutionNotes: true, createdAt: true, resolvedAt: true,
    renter: { select: { id: true, name: true } }, payment: { select: { id: true, amount: true, status: true, confirmationPeriodEnd: true } },
    rental: { select: { unit: { select: { unitNumber: true } }, property: { select: { id: true, title: true, owner: { select: { id: true, name: true } } } } } },
    _count: { select: { evidence: true, comments: true } },
  } })]);
  return page(rows.map((d) => ({ ...d, payment: { ...d.payment, amount: Number(d.payment.amount) } })), total, q);
}

type Outcome = "NO_REFUND" | "FULL_REFUND" | "PROPERTY_FIX_REQUIRED" | "REQUEST_EVIDENCE" | "DISMISSED";
export async function resolveDispute(req: Request, deps: AdminDeps, id: string, outcome: Outcome, note: string) {
  const d = await prisma.dispute.findUnique({ where: { id }, select: { status: true, paymentId: true, renterId: true, payment: { select: { status: true, amount: true } }, rental: { select: { property: { select: { title: true, ownerId: true, agentId: true } } } } } });
  if (!d) throw notFound("Dispute not found");
  if (!(OPEN_DISPUTE as readonly string[]).includes(d.status)) throw conflict("This dispute is already closed");
  if (d.payment.status !== "HELD") throw conflict("The rent is no longer in escrow — this dispute can only be closed with a note");
  if (outcome === "FULL_REFUND" && !hasScope(req, "payments.refund")) throw badRequest("Refunding needs the Refunds permission");

  // Money first (it throws if Flutterwave rejects), then the dispute row.
  if (outcome === "FULL_REFUND") await deps.refundHeldRent(d.paymentId, note, `admin:${req.staff!.id}`);
  if (outcome === "NO_REFUND" || outcome === "DISMISSED") { const r = await deps.releaseEscrowAndSplit(d.paymentId); if (!r) throw conflict("The rent could not be released — refresh and check its status"); }

  const closes = outcome === "FULL_REFUND" || outcome === "NO_REFUND" || outcome === "DISMISSED";
  await prisma.$transaction(async (tx) => {
    await tx.dispute.update({ where: { id }, data: closes
      ? { status: outcome === "DISMISSED" ? "REJECTED" : "RESOLVED", resolutionOutcome: outcome, resolutionNotes: note, resolvedAt: new Date(), assignedAdminId: req.staff!.userId, ...(outcome === "FULL_REFUND" ? { refundAmount: d.payment.amount } : {}) }
      : { status: outcome === "PROPERTY_FIX_REQUIRED" ? "INVESTIGATING" : "UNDER_REVIEW", ...(outcome === "PROPERTY_FIX_REQUIRED" ? { resolutionOutcome: "PROPERTY_FIX_REQUIRED" } : {}), resolutionNotes: note, assignedAdminId: req.staff!.userId } });
    await audit(tx, req, { action: outcome === "FULL_REFUND" ? "PAYMENT_REFUNDED" : "DISPUTE_RESOLVED", targetType: "Dispute", targetId: id, description: `${outcome} — ${note}` });
  });
  const prop = d.rental.property;
  const msg: Record<Outcome, [string, string]> = {
    NO_REFUND: ["Dispute closed", `${prop.title}: the claim wasn’t upheld and the rent was released.`],
    DISMISSED: ["Dispute dismissed", `${prop.title}: the rent was released.`],
    FULL_REFUND: ["Dispute upheld", `${prop.title}: the rent is being refunded to the renter.`],
    PROPERTY_FIX_REQUIRED: ["Fix required before release", `${prop.title}: the owner must fix the issue. Rent stays in escrow until NewCondo confirms.`],
    REQUEST_EVIDENCE: ["Evidence requested", `${prop.title}: please add photos or documents to the dispute within 48 hours.`],
  };
  const who = new Set([d.renterId, prop.ownerId, ...(prop.agentId ? [prop.agentId] : [])]);
  for (const uid of who) await publishNotification({ userId: uid, kind: "payment", title: msg[outcome][0], body: `${msg[outcome][1]} ${note}`.slice(0, 400), to: "/payments", entityType: "Dispute", entityId: id });
}

/* ---------------- referrals (engine lives in backend-shared/referrals) ---------------- */
export async function referrals(q: ListQuery) {
  const where: Prisma.ReferralWhereInput = { ...(q.filter === "hold" ? { fraudHold: true } : q.filter && ["ACTIVE", "PENDING", "VOID", "QUALIFIED", "REWARDED"].includes(q.filter) ? { status: q.filter as never } : {}),
    ...(q.q ? { OR: [{ referrer: { name: { contains: q.q, mode: "insensitive" } } }, { referred: { name: { contains: q.q, mode: "insensitive" } } }, { referralCode: { contains: q.q } }] } : {}) };
  const [total, rows] = await Promise.all([prisma.referral.count({ where }), prisma.referral.findMany({ where, ...skipTake(q), orderBy: { createdAt: "desc" }, select: {
    id: true, status: true, fraudHold: true, fraudReason: true, source: true, referralType: true, createdAt: true, activatedAt: true,
    referrer: { select: { id: true, name: true, role: true } }, referred: { select: { id: true, name: true, role: true } },
  } })]);
  const ids = rows.map((r) => r.id);
  const earned = ids.length ? await prisma.referralLedgerEntry.groupBy({ by: ["referralId", "userId"], where: { referralId: { in: ids }, status: { notIn: ["VOIDED", "EXPIRED"] } }, _sum: { amountKobo: true } }) : [];
  return page(rows.map((r) => {
    const sum = (uid: string) => String(earned.filter((e) => e.referralId === r.id && e.userId === uid).reduce((s, e) => s + (e._sum.amountKobo ?? 0n), 0n));
    return { ...r, referrerEarnedKobo: sum(r.referrer.id), referredEarnedKobo: sum(r.referred.id) };
  }), total, q);
}
export const referralExposure = () => Referrals.adminExposure();

export async function decideReferral(req: Request, id: string, action: "CLEAR" | "VOID", reason?: string) {
  const r = await prisma.referral.findUnique({ where: { id }, select: { fraudHold: true, status: true } });
  if (!r) throw notFound("Referral not found");
  if (action === "CLEAR") { if (!r.fraudHold) throw conflict("This referral isn’t on hold"); await Referrals.clearFraudHold(id); }
  else { if (r.status === "VOID") throw conflict("Already void"); await Referrals.voidReferral(id, reason!); }
  await audit(prisma, req, { action: action === "CLEAR" ? "REFERRAL_HOLD_CLEARED" : "REFERRAL_VOIDED", targetType: "Referral", targetId: id, description: reason ?? "" });
}

/* ---------------- support tickets ---------------- */
export async function tickets(q: ListQuery) {
  const where: Prisma.SupportTicketWhereInput = { ...(q.filter === "open" ? { status: { in: ["OPEN", "IN_PROGRESS"] } } : q.filter && ["TECHNICAL", "BILLING", "PROPERTY", "VERIFICATION", "GENERAL"].includes(q.filter) ? { category: q.filter as never } : {}),
    ...(q.q ? { OR: [{ title: { contains: q.q, mode: "insensitive" } }, { user: { name: { contains: q.q, mode: "insensitive" } } }] } : {}) };
  const [total, rows] = await Promise.all([prisma.supportTicket.count({ where }), prisma.supportTicket.findMany({ where, ...skipTake(q), orderBy: [{ status: "asc" }, { createdAt: "desc" }], select: { id: true, title: true, description: true, category: true, priority: true, status: true, adminResponse: true, createdAt: true, resolvedAt: true, user: { select: { id: true, name: true, role: true } } } })]);
  return page(rows, total, q);
}
export async function replyTicket(req: Request, id: string, response: string, status: "IN_PROGRESS" | "RESOLVED" | "CLOSED") {
  const t = await prisma.supportTicket.findUnique({ where: { id }, select: { userId: true, title: true, status: true } });
  if (!t) throw notFound("Ticket not found");
  if (t.status === "CLOSED") throw conflict("This ticket is closed");
  await prisma.$transaction(async (tx) => {
    await tx.supportTicket.update({ where: { id }, data: { adminResponse: response, status, ...(status !== "IN_PROGRESS" ? { resolvedBy: req.staff!.userId, resolvedAt: new Date() } : {}) } });
    await audit(tx, req, { action: "TICKET_RESOLVED", targetType: "SupportTicket", targetId: id, description: `${status}: ${t.title}` });
  });
  await publishNotification({ userId: t.userId, kind: "verify", title: "Support replied", body: `${t.title}: ${response}`.slice(0, 300), to: "/support", entityType: "SupportTicket", entityId: id });
}
