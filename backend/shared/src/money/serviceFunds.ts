// backend/shared/src/money/serviceFunds.ts
// ============================================================
// Property service funds — the reason a vendor is never paid from profit.
//
//   accrueServiceFunds()   revenue → fund:{property}:{service}, the VENDOR COST
//                          share of a paid period (monthlyAccrualNaira × months).
//                          Called by vendor-service's accrual job for every PAID
//                          subscription invoice, and for prorated lines.
//   fundBalanceKobo()      what a property can spend on a service right now.
//   returnFundToRevenue()  downgrade/lapse leftover (VENDORS.scheduling.downgradeLeftover).
//
// The payout itself (fund → transit → world) is payment-service
// vendorPayout.service.ts — postLedger's no-overdraft rule makes a payout
// from an underfunded fund fail loudly instead of borrowing from revenue.
// ============================================================
import { prisma } from "@newcondo/db";
import { ACC } from "./accounts";
import { postLedger, balanceOf, type Tx } from "./ledger";
import { toKobo, type Kobo } from "./kobo";
import { monthlyAccrualNaira, servicesForPlan, type VendorServiceType } from "../constants/vendors";
import type { SubscriptionPlanCode } from "../constants/subscriptionPlans";

export interface AccrualInput {
  propertyId: string;
  planCode: SubscriptionPlanCode;
  /** Months of service the payment bought. Fractions allowed (prorated lines). */
  months: number;
  /** Stable per payment, e.g. `inv:{invoiceId}` — services are appended. */
  idempotencyBase: string;
  sourceType: "INVOICE" | "PROPERTY_LINE";
  sourceId: string;
}

/** Post one accrual per service the plan covers. Idempotent per (base, service). */
export async function accrueServiceFunds(tx: Tx, a: AccrualInput): Promise<{ service: VendorServiceType; naira: number }[]> {
  const out: { service: VendorServiceType; naira: number }[] = [];
  for (const service of servicesForPlan(a.planCode)) {
    const naira = Math.round(monthlyAccrualNaira(a.planCode, service) * a.months);
    if (naira <= 0) continue;
    const res = await postLedger(tx, {
      idempotencyKey: `${a.idempotencyBase}:fund:${a.propertyId}:${service}`,
      type: "SERVICE_FUND_ACCRUED",
      sourceType: a.sourceType,
      sourceId: a.sourceId,
      memo: `${service} fund — ${a.months} month(s) of ${a.planCode}`,
      metadata: { propertyId: a.propertyId, service, planCode: a.planCode, months: a.months },
      legs: [
        { account: ACC.revenue, amountKobo: -toKobo(naira) },
        { account: ACC.serviceFund(a.propertyId, service), amountKobo: toKobo(naira) },
      ],
    });
    if (!res.duplicate) out.push({ service, naira });
  }
  return out;
}

export const fundBalanceKobo = (propertyId: string, service: VendorServiceType, client: Tx | typeof prisma = prisma): Promise<Kobo> =>
  balanceOf(ACC.serviceFund(propertyId, service), client);

/** Move whatever is left in a fund back to revenue. Used only by the
 *  downgrade/lapse policy — never to fund anything else. */
export async function returnFundToRevenue(tx: Tx, propertyId: string, service: VendorServiceType, reason: string, key: string): Promise<Kobo> {
  const bal = await balanceOf(ACC.serviceFund(propertyId, service), tx);
  if (bal <= 0n) return 0n;
  await postLedger(tx, {
    idempotencyKey: `fund-return:${key}:${propertyId}:${service}`,
    type: "SERVICE_FUND_RETURNED",
    sourceType: "PROPERTY_LINE",
    sourceId: propertyId,
    memo: reason,
    legs: [
      { account: ACC.serviceFund(propertyId, service), amountKobo: -bal },
      { account: ACC.revenue, amountKobo: bal },
    ],
  });
  return bal;
}
