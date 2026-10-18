// backend/shared/src/referrals/redemption.ts — spec §10
// Subscription credit is applied by the billing engine; service credit
// becomes a normal vendor request at ₦0 to the landlord.
import { prisma } from "@newcondo/db";
import type { Tx } from "../money/ledger";
import { notifyReferral } from "./notify";

/** Reserve credit against an invoice, FIFO by expiry. Call inside the
 *  transaction that creates/claims the invoice. Returns reserved kobo.
 *  Reserving bumps redeemedKobo immediately so two invoices can never spend
 *  the same credit; releaseRedemptions() gives it back on a failed charge. */
export async function reserveCredits(tx: Tx, userId: string, invoiceId: string, dueKobo: bigint): Promise<bigint> {
  if (dueKobo <= 0n) return 0n;
  // Idempotent per invoice: a retried renewal re-uses its reservation.
  const prior = await tx.referralRedemption.aggregate({ where: { invoiceId, status: "RESERVED" }, _sum: { amountKobo: true } });
  if ((prior._sum.amountKobo ?? 0n) > 0n) return prior._sum.amountKobo!;

  const credits = await tx.referralLedgerEntry.findMany({
    where: { userId, kind: "SUBSCRIPTION_CREDIT", status: { in: ["AVAILABLE", "PARTIALLY_REDEEMED"] }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
  });
  let remaining = dueKobo;
  for (const c of credits) {
    if (remaining <= 0n) break;
    const free = c.amountKobo - c.redeemedKobo;
    if (free <= 0n) continue;
    const take = free < remaining ? free : remaining;
    const { count } = await tx.referralLedgerEntry.updateMany({
      where: { id: c.id, redeemedKobo: c.redeemedKobo }, // optimistic: nobody spent it meanwhile
      data: { redeemedKobo: { increment: take }, status: take === free ? "REDEEMED" : "PARTIALLY_REDEEMED" },
    });
    if (!count) continue;
    await tx.referralRedemption.create({ data: { ledgerEntryId: c.id, invoiceId, amountKobo: take, status: "RESERVED" } });
    remaining -= take;
  }
  return dueKobo - remaining;
}

export async function confirmRedemptions(invoiceId: string, userId?: string): Promise<bigint> {
  const rows = await prisma.referralRedemption.findMany({ where: { invoiceId, status: "RESERVED" } });
  if (!rows.length) return 0n;
  await prisma.referralRedemption.updateMany({ where: { invoiceId, status: "RESERVED" }, data: { status: "CONFIRMED" } });
  const total = rows.reduce((s, r) => s + r.amountKobo, 0n);
  if (userId && total > 0n) await notifyReferral({ kind: "CREDIT_APPLIED", userId, amountKobo: total, invoiceId });
  return total;
}

/** Failed charge → credit restored exactly as it was. */
export async function releaseRedemptions(invoiceId: string): Promise<void> {
  const rows = await prisma.referralRedemption.findMany({ where: { invoiceId, status: "RESERVED" } });
  for (const r of rows) {
    await prisma.$transaction(async (tx) => {
      const e = await tx.referralLedgerEntry.update({ where: { id: r.ledgerEntryId }, data: { redeemedKobo: { decrement: r.amountKobo } } });
      await tx.referralLedgerEntry.update({ where: { id: e.id }, data: { status: e.redeemedKobo === 0n ? "AVAILABLE" : "PARTIALLY_REDEEMED" } });
      await tx.referralRedemption.update({ where: { id: r.id }, data: { status: "RELEASED" } });
    });
  }
}

/** Map the referral service type → vendor-service serviceType. */
const SERVICE_TYPE: Record<string, string> = {
  fumigation: "FUMIGATION",
  waste_management: "WASTE_MANAGEMENT",
  inspection: "INSPECTION",
  emergency_maintenance: "REPAIR_GENERAL",
};

/** §10.2 — one property, one use, owner must own it and have it on a paid tier.
 *  `createRequest` is vendor-service's requestService, injected by the route
 *  so shared never imports a service package. */
export async function redeemServiceCredit(opts: {
  userId: string;
  ledgerId: string;
  propertyId: string;
  preferredWindow?: string;
  createRequest: (a: { ownerId: string; propertyId: string; serviceType: string; notes?: string }) => Promise<{ id: string }>;
}): Promise<{ serviceRef: string }> {
  const entry = await prisma.referralLedgerEntry.findUnique({ where: { id: opts.ledgerId } });
  if (!entry || entry.userId !== opts.userId || entry.kind !== "SERVICE_CREDIT") throw Object.assign(new Error("Credit not found"), { statusCode: 404 });
  if (entry.status !== "AVAILABLE") throw Object.assign(new Error("This credit is not available to use"), { statusCode: 409 });
  if (entry.expiresAt && entry.expiresAt <= new Date()) throw Object.assign(new Error("This credit has expired"), { statusCode: 409 });

  const property = await prisma.property.findFirst({
    where: { id: opts.propertyId, ownerId: opts.userId },
    select: { id: true, subscriptionLine: { select: { status: true, cancelledAt: true } } },
  });
  if (!property) throw Object.assign(new Error("Choose one of your own properties"), { statusCode: 403 });
  const line = property.subscriptionLine;
  if (!line || line.status !== "ACTIVE" || line.cancelledAt) throw Object.assign(new Error("That property needs an active plan to book this service"), { statusCode: 409 });

  // Claim first so a double-tap can't book two services.
  const { count } = await prisma.referralLedgerEntry.updateMany({ where: { id: entry.id, status: "AVAILABLE" }, data: { status: "REDEEMED", redeemedKobo: entry.amountKobo } });
  if (!count) throw Object.assign(new Error("This credit was just used"), { statusCode: 409 });
  try {
    const req = await opts.createRequest({
      ownerId: opts.userId,
      propertyId: opts.propertyId,
      serviceType: SERVICE_TYPE[entry.serviceType ?? ""] ?? "REPAIR_GENERAL",
      notes: `Referral reward (${entry.ruleId}) — paid by Newcondo.${opts.preferredWindow ? ` Preferred: ${opts.preferredWindow}` : ""}`,
    });
    await prisma.referralLedgerEntry.update({ where: { id: entry.id }, data: { serviceRef: req.id } });
    return { serviceRef: req.id };
  } catch (e) {
    await prisma.referralLedgerEntry.update({ where: { id: entry.id }, data: { status: "AVAILABLE", redeemedKobo: 0n } });
    throw e;
  }
}

/** Vendor/platform cancelled the booked service (not the landlord) → restore. */
export async function restoreServiceCredit(serviceRef: string): Promise<void> {
  await prisma.referralLedgerEntry.updateMany({ where: { serviceRef, status: "REDEEMED" }, data: { status: "AVAILABLE", redeemedKobo: 0n, serviceRef: null } });
}
