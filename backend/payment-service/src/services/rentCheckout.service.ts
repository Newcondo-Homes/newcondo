// backend/payment-service/src/services/rentCheckout.service.ts
// ============================================================
// Renter rent-payment checkout.
//   1. quoteRent()    — rent + renter service fee, shown before paying
//   2. initiateRent() — Redis unit lock (+ DB mirror), Rental
//      (PENDING_CONFIRMATION) + PENDING Payment, Flutterwave inline payload.
//      A PROMO shareCode pins Payment.subAgentId — the ONLY commission
//      attribution source, so a sub-agent's cut can't be misdirected.
//   3. confirmRentPaid() — webhook: Payment → HELD with a 24h
//      confirmationPeriodEnd, unit → OCCUPIED, notifications + branded emails.
//      The split itself runs at release (commissionSplit.service.ts).
//
// SCHEMA/API NOTES (previous compile failures):
//  • flutterwaveConfig keys are FLUTTERWAVE_PUBLIC_KEY / _SECRET_KEY / _BASE_URL.
//  • $transaction uses the CALLBACK form — a heterogeneous array of promises
//    (payment/rental/unit/property) can't be typed by the array overload.
//  • Unit locking lives in ../lib/unitLock (no @newcondo/booking-service dep).
// ============================================================
import { randomBytes } from "crypto";
import { prisma } from "@newcondo/db";
import {
  conflict, notFound,
  PAYMENTS, publishNotification, sendBrandedEmail, EmailTemplates, flutterwaveConfig,
} from "@newcondo/backend-shared";
import { acquireUnitLock, releaseUnitLock } from "../lib/unitlock";

const FEE_RATE = PAYMENTS.renterServiceFeeRate;
const LOCK_SECONDS = PAYMENTS.checkoutLockMinutes * 60;
const ESCROW_MS = PAYMENTS.escrowWindowHours * 3600_000;

async function findUnit(propertyId: string, unitNumber: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true, title: true, price: true, status: true, structure: true, isAvailable: true,
      units: {
        where: { unitNumber },
        select: { id: true, unitNumber: true, price: true, status: true, isPaymentLocked: true, paymentLockExpiry: true },
      },
    },
  });
  if (!property || property.status !== "PUBLISHED") throw notFound("This listing is not available");

  const unit = property.units[0] ?? null; // SINGLE_UNIT properties have no unit rows
  if (unit) {
    if (unit.status !== "AVAILABLE") throw conflict("This unit is no longer available");
    if (unit.isPaymentLocked && unit.paymentLockExpiry && unit.paymentLockExpiry > new Date()) {
      throw conflict("Someone else is completing payment for this unit right now");
    }
  } else if (!property.isAvailable) {
    throw conflict("This property is no longer available");
  }
  return { property, unit };
}

export async function quoteRent(propertyId: string, unitNumber: string) {
  const { property, unit } = await findUnit(propertyId, unitNumber);
  const rent = Number(unit?.price ?? property.price ?? 0);
  const serviceFee = Math.round(rent * FEE_RATE);
  return {
    propertyTitle: property.title,
    unitNumber: unit?.unitNumber ?? "Main unit",
    rent, serviceFee, total: rent + serviceFee,
    escrowWindowHours: PAYMENTS.escrowWindowHours,
  };
}

export async function initiateRent(opts: {
  propertyId: string; unitNumber: string; renterId: string; renterEmail: string; shareCode?: string;
}) {
  const quote = await quoteRent(opts.propertyId, opts.unitNumber);
  const { unit } = await findUnit(opts.propertyId, opts.unitNumber);

  // Commission attribution: only an approved sub-agent's PROMO link counts.
  let subAgentId: string | null = null;
  if (opts.shareCode) {
    const link = await prisma.shareLink.findUnique({
      where: { code: opts.shareCode },
      select: { kind: true, creatorId: true, propertyId: true },
    });
    if (link && link.propertyId === opts.propertyId && link.kind === "PROMO") subAgentId = link.creatorId;
  }

  const lock = await acquireUnitLock(opts.propertyId, opts.unitNumber, opts.renterId, LOCK_SECONDS);
  if (!lock.acquired) throw conflict("Someone else is completing payment for this unit right now — try again shortly");

  try {
    const lockExpiry = new Date(Date.now() + LOCK_SECONDS * 1000);
    const reference = `NC-RENT-${Date.now()}-${randomBytes(4).toString("hex")}`;

    const { payment, rentalId } = await prisma.$transaction(async (tx) => {
      // DB mirror of the Redis lock so other read paths see it
      if (unit) {
        await tx.propertyUnit.update({ where: { id: unit.id }, data: { isPaymentLocked: true, paymentLockExpiry: lockExpiry } });
      } else {
        await tx.property.update({ where: { id: opts.propertyId }, data: { isPaymentLocked: true, paymentLockExpiry: lockExpiry } });
      }
      const rental = await tx.rental.create({
        data: {
          propertyId: opts.propertyId, unitId: unit?.id ?? null, renterId: opts.renterId,
          startDate: new Date(), monthlyRent: quote.rent, status: "PENDING_CONFIRMATION",
        },
        select: { id: true },
      });
      const payment = await tx.payment.create({
        data: {
          userId: opts.renterId, rentalId: rental.id,
          paymentType: "RENT", status: "PENDING",
          amount: quote.total, platformFee: quote.serviceFee, ownerAmount: quote.rent,
          flutterwaveRef: reference, subAgentId,
          description: `Rent — ${quote.propertyTitle} (${quote.unitNumber})`,
        },
        select: { id: true, description: true },
      });
      return { payment, rentalId: rental.id };
    });

    return {
      paymentId: payment.id,
      rentalId,
      checkout: {
        public_key: flutterwaveConfig.FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: reference,
        amount: quote.total,
        currency: "NGN",
        customer: { email: opts.renterEmail },
        customizations: { title: "Newcondo", description: payment.description ?? "Rent payment" },
      },
      quote,
    };
  } catch (e) {
    await releaseUnitLock(opts.propertyId, opts.unitNumber, opts.renterId); // never strand the unit
    throw e;
  }
}

/** Webhook (NC-RENT-*): charge verified → HELD escrow, occupy unit, notify. */
export async function confirmRentPaid(flutterwaveRef: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { flutterwaveRef },
    include: {
      user: { select: { id: true, name: true, email: true } },
      rental: {
        include: {
          unit: { select: { id: true, unitNumber: true } },
          property: {
            select: {
              id: true, title: true, ownerId: true, agentId: true,
              owner: { select: { name: true, email: true } },
            },
          },
        },
      },
    },
  });
  if (!payment || payment.status !== "PENDING" || !payment.rental) return; // idempotent

  const r = payment.rental;
  const confirmationEnd = new Date(Date.now() + ESCROW_MS);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { flutterwaveRef },
      data: { status: "HELD", paidAt: new Date(), confirmationPeriodEnd: confirmationEnd },
    });
    await tx.rental.update({ where: { id: r.id }, data: { confirmationDeadline: confirmationEnd } });
    if (r.unit) {
      await tx.propertyUnit.update({
        where: { id: r.unit.id },
        data: { status: "OCCUPIED", isAvailable: false, isPaymentLocked: false, paymentLockExpiry: null },
      });
    } else {
      await tx.property.update({
        where: { id: r.property.id },
        data: { isAvailable: false, isPaymentLocked: false, paymentLockExpiry: null },
      });
    }
  });

  await releaseUnitLock(r.property.id, r.unit?.unitNumber ?? "Main unit", payment.userId);

  const p = r.property;
  const netToOwner = Number(payment.ownerAmount ?? payment.amount);
  const tasks: Promise<unknown>[] = [
    publishNotification({
      userId: p.ownerId, kind: "payment", title: "Rent payment in escrow",
      body: `${payment.description} — releases after the renter's 24h window.`,
      to: "/payments", entityType: "payment", entityId: payment.id,
    }),
    sendBrandedEmail(p.owner.email, EmailTemplates.rentPaidOwner({
      ownerName: p.owner.name ?? "there", amount: Number(payment.amount), net: netToOwner,
      property: p.title, renterName: payment.user.name ?? "Your renter",
      escrowEndsAt: confirmationEnd.toUTCString(),
    })),
    publishNotification({
      userId: payment.userId, kind: "payment", title: "Payment received — you're protected",
      body: "Visit the property within 24 hours. If it doesn't match the listing, dispute from My Rentals before the window closes.",
      to: "/payments", entityType: "payment", entityId: payment.id,
    }),
    sendBrandedEmail(payment.user.email, EmailTemplates.rentReceiptRenter({
      renterName: payment.user.name ?? "there", amount: Number(payment.amount),
      property: p.title, unit: r.unit?.unitNumber ?? "Main unit", reference: flutterwaveRef,
    })),
  ];
  if (p.agentId) {
    tasks.push(publishNotification({
      userId: p.agentId, kind: "payment", title: "Your listing was rented",
      body: `${p.title} — commission releases after the escrow window.`,
      to: "/payments", entityType: "payment", entityId: payment.id,
    }));
  }
  await Promise.all(tasks);
}
